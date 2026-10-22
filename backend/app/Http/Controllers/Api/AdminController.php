<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\Request;

class AdminController extends ApiController
{
    public function access(Request $request)
    {
        return response()->json(['is_admin' => (bool) $request->user()->is_admin]);
    }

    public function users()
    {
        $users = User::query()
            ->with('workspaces:id,name,plan,subscription_status,manual_plan')
            ->select(['id', 'name', 'email', 'is_admin', 'unlimited_limits', 'created_at'])
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($users);
    }

    public function dashboard()
    {
        return response()->json([
            'users' => User::count(),
            'admins' => User::where('is_admin', true)->count(),
            'unlimited_users' => User::where('is_admin', true)
                ->orWhere('unlimited_limits', true)
                ->count(),
            'workspaces' => Workspace::count(),
            'manual_workspaces' => Workspace::where('manual_plan', true)->count(),
            'plans' => [
                'free' => Workspace::where('plan', 'free')->count(),
                'pro' => Workspace::where('plan', 'pro')->count(),
                'team' => Workspace::where('plan', 'team')->count(),
            ],
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate([
            'is_admin' => ['sometimes', 'boolean'],
            'unlimited_limits' => ['sometimes', 'boolean'],
        ]);

        if ($data === []) {
            return $this->error('Choose a permission to update.', 'empty_permissions', 422);
        }

        if (array_key_exists('is_admin', $data) && !$data['is_admin'] && $user->is_admin) {
            if ($request->user()->is($user)) {
                return $this->error('You cannot remove your own administrator access.', 'cannot_demote_self', 422);
            }

            $adminCount = User::query()->where('is_admin', true)->count();
            if ($adminCount <= 1) {
                return $this->error('The last administrator cannot be removed.', 'last_admin_required', 422);
            }
        }

        foreach ($data as $permission => $enabled) {
            $user->{$permission} = (bool) $enabled;
        }
        $user->save();

        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'is_admin', 'unlimited_limits', 'created_at']),
        ]);
    }

    public function updateWorkspacePlan(Request $request, Workspace $workspace)
    {
        $data = $request->validate([
            'plan' => ['required', 'in:free,pro,team'],
        ]);

        $workspace->plan = $data['plan'];
        $workspace->manual_plan = true;
        $workspace->subscription_status = $data['plan'] === 'free' ? null : 'active';
        $workspace->save();

        return response()->json([
            'workspace' => $workspace->only([
                'id', 'name', 'plan', 'subscription_status', 'manual_plan',
            ]),
        ]);
    }
}
