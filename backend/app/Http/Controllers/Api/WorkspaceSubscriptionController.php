<?php

namespace App\Http\Controllers\Api;

use App\Models\Workspace;
use App\Services\PlanCapabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WorkspaceSubscriptionController extends ApiController
{
    public function checkout(Request $request, Workspace $workspace)
    {
        Gate::authorize('manage-subscription', $workspace);

        if ($workspace->manual_plan) {
            return $this->error('This plan is managed manually by an administrator.', 'manual_plan', 409);
        }

        $data = $request->validate([
            'plan' => ['required', 'in:pro,team'],
        ]);

        $priceId = $data['plan'] === PlanCapabilityService::PLAN_TEAM
            ? env('STRIPE_PRICE_TEAM')
            : env('STRIPE_PRICE_PRO');

        if (!$priceId) {
            return $this->error('Stripe price not configured.', 'stripe_price_missing', 500);
        }

        $session = $workspace->newSubscription('default', $priceId)
            ->trialDays(15)
            ->checkout([
                'success_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/')
                    .'/billing?status=success&plan='.$data['plan'],
                'cancel_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/')
                    .'/billing?status=cancel&plan='.$data['plan'],
                'metadata' => [
                    'workspace_id' => $workspace->id,
                    'plan' => $data['plan'],
                ],
            ]);

        return response()->json(['url' => $session->url]);
    }

    public function portal(Request $request, Workspace $workspace)
    {
        Gate::authorize('manage-subscription', $workspace);

        if ($workspace->manual_plan) {
            return $this->error('Billing is managed manually by an administrator.', 'manual_plan', 409);
        }

        $url = $workspace->billingPortalUrl(
            rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/').'/billing'
        );

        return response()->json(['url' => $url]);
    }
}
