<?php

namespace Tests\Unit;

use App\Models\Workspace;
use App\Services\PlanCapabilityService;
use PHPUnit\Framework\TestCase;

class PlanCapabilityServiceTest extends TestCase
{
    public function test_manual_paid_plan_is_effective_without_a_subscription(): void
    {
        $workspace = new Workspace([
            'plan' => PlanCapabilityService::PLAN_PRO,
            'subscription_status' => null,
            'manual_plan' => true,
        ]);

        $this->assertTrue((new PlanCapabilityService())->isPaid($workspace));
    }

    public function test_paid_plan_without_manual_override_requires_active_subscription(): void
    {
        $workspace = new Workspace([
            'plan' => PlanCapabilityService::PLAN_TEAM,
            'subscription_status' => 'past_due',
            'manual_plan' => false,
        ]);

        $this->assertFalse((new PlanCapabilityService())->isPaid($workspace));
    }
}
