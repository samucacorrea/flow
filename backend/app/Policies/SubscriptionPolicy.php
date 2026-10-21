<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class SubscriptionPolicy
{
    public function manage(User $user, Workspace $workspace): bool
    {
        return $workspace->members()
            ->where('user_id', $user->id)
            ->whereIn('role', ['owner', 'admin'])
            ->exists();
    }
}
