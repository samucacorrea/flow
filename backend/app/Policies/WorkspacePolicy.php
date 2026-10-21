<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Workspace $workspace): bool
    {
        return $workspace->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Workspace $workspace): bool
    {
        return $this->isAdminOrOwner($user, $workspace);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Workspace $workspace): bool
    {
        return $this->isOwner($user, $workspace);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Workspace $workspace): bool
    {
        return $this->isOwner($user, $workspace);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Workspace $workspace): bool
    {
        return $this->isOwner($user, $workspace);
    }

    public function manageMembers(User $user, Workspace $workspace): bool
    {
        return $this->isAdminOrOwner($user, $workspace);
    }

    public function createBoard(User $user, Workspace $workspace): bool
    {
        return $this->isEditor($user, $workspace);
    }

    protected function isOwner(User $user, Workspace $workspace): bool
    {
        return $workspace->members()
            ->where('user_id', $user->id)
            ->where('role', 'owner')
            ->exists();
    }

    protected function isAdminOrOwner(User $user, Workspace $workspace): bool
    {
        return $workspace->members()
            ->where('user_id', $user->id)
            ->whereIn('role', ['owner', 'admin'])
            ->exists();
    }

    protected function isEditor(User $user, Workspace $workspace): bool
    {
        return $workspace->members()
            ->where('user_id', $user->id)
            ->whereIn('role', ['owner', 'admin', 'member'])
            ->exists();
    }
}
