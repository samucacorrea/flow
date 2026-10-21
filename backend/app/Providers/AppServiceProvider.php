<?php

namespace App\Providers;

use App\Models\Board;
use App\Models\Workspace;
use App\Policies\BoardPolicy;
use App\Policies\WorkspacePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Cashier::useCustomerModel(Workspace::class);
        Gate::policy(Workspace::class, WorkspacePolicy::class);
        Gate::policy(Board::class, BoardPolicy::class);
        Gate::define('manage-subscription', [\App\Policies\SubscriptionPolicy::class, 'manage']);
    }
}
