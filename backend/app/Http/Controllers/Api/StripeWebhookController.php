<?php

namespace App\Http\Controllers\Api;

use App\Models\StripeWebhookEvent;
use App\Models\Workspace;
use App\Services\PlanCapabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class StripeWebhookController extends ApiController
{
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');
        $secret = config('services.stripe.webhook_secret');

        try {
            $event = $secret ? Webhook::constructEvent($payload, $signature, $secret) : json_decode($payload);
        } catch (\Throwable $exception) {
            Log::warning('Stripe webhook signature failed', ['error' => $exception->getMessage()]);
            return response()->json(['status' => 'invalid'], 400);
        }

        if (!$event || empty($event->id)) {
            return response()->json(['status' => 'invalid'], 400);
        }

        $alreadyProcessed = StripeWebhookEvent::where('event_id', $event->id)->exists();
        if ($alreadyProcessed) {
            return response()->json(['status' => 'ok']);
        }

        StripeWebhookEvent::create([
            'event_id' => $event->id,
            'type' => $event->type ?? 'unknown',
            'payload' => json_decode($payload, true),
            'processed_at' => now(),
        ]);

        DB::transaction(function () use ($event) {
            $type = $event->type ?? '';
            $object = $this->eventObject($event);

            if (in_array($type, [
                'customer.subscription.created',
                'customer.subscription.updated',
                'customer.subscription.deleted',
            ], true)) {
                $this->handleSubscriptionEvent($object, $type === 'customer.subscription.deleted');
            }

            if ($type === 'invoice.payment_failed') {
                $subscriptionId = is_array($object) ? ($object['subscription'] ?? null) : ($object?->subscription ?? null);
                if ($subscriptionId) {
                    $this->handlePaymentFailed($subscriptionId);
                }
            }
        });

        return response()->json(['status' => 'ok']);
    }

    protected function handleSubscriptionEvent($subscription, bool $isDeleted): void
    {
        if (!$subscription || empty($subscription->customer)) {
            return;
        }

        $workspace = Workspace::where('stripe_id', $subscription->customer)->first();
        if (!$workspace) {
            return;
        }

        $plan = $this->resolvePlanFromSubscription($subscription);

        if ($isDeleted) {
            $workspace->plan = PlanCapabilityService::PLAN_FREE;
            $workspace->subscription_status = 'canceled';
            $workspace->trial_ends_at = null;
        } else {
            if ($plan) {
                $workspace->plan = $plan;
            }
            $workspace->subscription_status = $subscription->status ?? $workspace->subscription_status;
        }

        if (!empty($subscription->trial_end)) {
            $workspace->trial_ends_at = Carbon::createFromTimestamp($subscription->trial_end);
        }

        $workspace->save();
    }

    protected function handlePaymentFailed(string $stripeSubscriptionId): void
    {
        $subscription = \Laravel\Cashier\Subscription::where('stripe_id', $stripeSubscriptionId)->first();
        if (!$subscription) {
            return;
        }

        $workspace = Workspace::find($subscription->workspace_id);
        if (!$workspace) {
            return;
        }

        $workspace->subscription_status = 'past_due';
        $workspace->save();
    }

    protected function resolvePlanFromSubscription($subscription): ?string
    {
        $items = $subscription->items->data ?? [];
        $priceIds = array_map(fn ($item) => $item->price->id ?? null, $items);

        if (in_array(env('STRIPE_PRICE_TEAM'), $priceIds, true)) {
            return PlanCapabilityService::PLAN_TEAM;
        }

        if (in_array(env('STRIPE_PRICE_PRO'), $priceIds, true)) {
            return PlanCapabilityService::PLAN_PRO;
        }

        return null;
    }

    protected function eventObject($event): mixed
    {
        if (is_array($event)) {
            return $event['data']['object'] ?? null;
        }

        return $event->data->object ?? null;
    }
}
