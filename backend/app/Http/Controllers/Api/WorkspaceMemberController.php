<?php

namespace App\Http\Controllers\Api;

use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Services\PlanCapabilityService;
use Illuminate\Http\Request;

class WorkspaceMemberController extends ApiController
{
    public function index(Request $request, Workspace $workspace)
    {
        $this->authorize('view', $workspace);

        $members = $workspace->members()->with('user')->get();

        return response()->json(['members' => $members]);
    }

    public function store(Request $request, Workspace $workspace, PlanCapabilityService $plans)
    {
        $this->authorize('manageMembers', $workspace);

        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'in:owner,admin,member,viewer'],
        ]);

        if (!$plans->canAddMember($workspace)) {
            return $this->error('Member limit reached.', 'member_limit_reached', 403);
        }

        $existing = WorkspaceMember::where('workspace_id', $workspace->id)
            ->where('user_id', $data['user_id'])
            ->first();

        if ($existing) {
            return $this->error('User already a member.', 'member_exists', 409);
        }

        $member = WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $data['user_id'],
            'role' => $data['role'],
        ]);

        return response()->json(['member' => $member->load('user')], 201);
    }

    public function update(Request $request, Workspace $workspace, WorkspaceMember $member)
    {
        $this->authorize('manageMembers', $workspace);

        if ($member->workspace_id !== $workspace->id) {
            return $this->error('Member not in workspace.', 'member_not_in_workspace', 404);
        }

        $data = $request->validate([
            'role' => ['required', 'in:owner,admin,member,viewer'],
        ]);

        $member->role = $data['role'];
        $member->save();

        return response()->json(['member' => $member->load('user')]);
    }

    public function destroy(Request $request, Workspace $workspace, WorkspaceMember $member)
    {
        $this->authorize('manageMembers', $workspace);

        if ($member->workspace_id !== $workspace->id) {
            return $this->error('Member not in workspace.', 'member_not_in_workspace', 404);
        }

        $member->delete();

        return response()->json(['status' => 'ok']);
    }
}
