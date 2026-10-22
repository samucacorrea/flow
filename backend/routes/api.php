<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\BoardDocumentController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\WorkspaceController;
use App\Http\Controllers\Api\WorkspaceMemberController;
use App\Http\Controllers\Api\WorkspaceSubscriptionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ['status' => 'ok'];
});

Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::prefix('admin')->group(function () {
        Route::get('/access', [AdminController::class, 'access']);
        Route::middleware('admin')->group(function () {
            Route::get('/users', [AdminController::class, 'users']);
            Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
        });
    });

    Route::get('/workspaces', [WorkspaceController::class, 'index']);
    Route::post('/workspaces', [WorkspaceController::class, 'store']);
    Route::get('/workspaces/{workspace}', [WorkspaceController::class, 'show']);
    Route::patch('/workspaces/{workspace}', [WorkspaceController::class, 'update']);

    Route::get('/workspaces/{workspace}/members', [WorkspaceMemberController::class, 'index']);
    Route::post('/workspaces/{workspace}/members', [WorkspaceMemberController::class, 'store']);
    Route::patch('/workspaces/{workspace}/members/{member}', [WorkspaceMemberController::class, 'update']);
    Route::delete('/workspaces/{workspace}/members/{member}', [WorkspaceMemberController::class, 'destroy']);

    Route::get('/workspaces/{workspace}/boards', [BoardController::class, 'index']);
    Route::post('/workspaces/{workspace}/boards', [BoardController::class, 'store']);
    Route::get('/boards/{board}', [BoardController::class, 'show']);
    Route::patch('/boards/{board}', [BoardController::class, 'update']);
    Route::delete('/boards/{board}', [BoardController::class, 'destroy']);

    Route::get('/boards/{board}/document/latest', [BoardDocumentController::class, 'latest']);
    Route::put('/boards/{board}/document', [BoardDocumentController::class, 'update']);

    Route::post('/workspaces/{workspace}/checkout', [WorkspaceSubscriptionController::class, 'checkout']);
    Route::get('/workspaces/{workspace}/portal', [WorkspaceSubscriptionController::class, 'portal']);
});
