<?php

namespace App\Http\Controllers\Api;

use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Services\PlanCapabilityService;
use Illuminate\Http\Request;

class WorkspaceController extends ApiController
{
    public function index(Request $request)
    {
        $workspaces = $request->user()->workspaces()->withPivot('role')->get();

        return response()->json(['workspaces' => $workspaces]);
    }

    public function store(Request $request, PlanCapabilityService $plans)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
        ]);

        $user = $request->user();
        $currentCount = $user->workspaces()->count();
        $hasTeamWorkspace = $user->workspaces()
            ->where('plan', PlanCapabilityService::PLAN_TEAM)
            ->whereIn('subscription_status', ['active', 'trialing'])
            ->exists();

        if (!$plans->hasUnlimitedLimits($user) && $currentCount >= 1 && !$hasTeamWorkspace) {
            return $this->error('Workspace limit reached.', 'workspace_limit_reached', 403);
        }

        $workspace = Workspace::create([
            'name' => $data['name'],
            'plan' => PlanCapabilityService::PLAN_FREE,
            'subscription_status' => null,
        ]);

        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);

        return response()->json(['workspace' => $workspace->load('members')], 201);
    }

    public function show(Request $request, Workspace $workspace)
    {
        $this->authorize('view', $workspace);

        return response()->json(['workspace' => $workspace->load('members')]);
    }

    public function update(Request $request, Workspace $workspace)
    {
        $this->authorize('update', $workspace);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
        ]);

        $workspace->fill($data);
        $workspace->save();

        return response()->json(['workspace' => $workspace]);
    }
}
