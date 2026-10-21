<?php

namespace App\Services;

use App\Models\Workspace;

class PlanCapabilityService
{
    public const PLAN_FREE = 'free';
    public const PLAN_PRO = 'pro';
    public const PLAN_TEAM = 'team';

    public function canCreateBoard(Workspace $workspace, string $type): bool
    {
        if ($this->isPaid($workspace)) {
            return true;
        }

        $limit = $type === 'whiteboard' ? 3 : 3;
        $count = $workspace->boards()->where('type', $type)->count();

        return $count < $limit;
    }

    public function canAddMember(Workspace $workspace): bool
    {
        if ($this->isTeam($workspace)) {
            return true;
        }

        $limit = $this->isPro($workspace) ? 5 : 2;
        $count = $workspace->members()->count();

        return $count < $limit;
    }

    public function canCreateWorkspaceForUser(int $currentWorkspaceCount, string $targetPlan = self::PLAN_FREE): bool
    {
        if ($targetPlan === self::PLAN_TEAM) {
            return true;
        }

        return $currentWorkspaceCount < 1;
    }

    public function canExportPdf(Workspace $workspace): bool
    {
        return $this->isPaid($workspace);
    }

    public function isPaid(Workspace $workspace): bool
    {
        return $this->isPro($workspace) || $this->isTeam($workspace);
    }

    public function isPro(Workspace $workspace): bool
    {
        return $workspace->plan === self::PLAN_PRO && $this->subscriptionActiveOrTrialing($workspace);
    }

    public function isTeam(Workspace $workspace): bool
    {
        return $workspace->plan === self::PLAN_TEAM && $this->subscriptionActiveOrTrialing($workspace);
    }

    protected function subscriptionActiveOrTrialing(Workspace $workspace): bool
    {
        return in_array($workspace->subscription_status, ['active', 'trialing'], true);
    }
}
