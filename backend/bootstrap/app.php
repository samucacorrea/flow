<?php

use Illuminate\Foundation\Application;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        $middleware->alias([
            'admin' => \App\Http\Middleware\RequireAdministrator::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (QueryException $exception) {
            Log::error('Database query exception', [
                'message' => $exception->getMessage(),
                'sql' => $exception->getSql(),
                'bindings' => $exception->getBindings(),
                'connection' => [
                    'driver' => config('database.default'),
                    'host' => config('database.connections.pgsql.host'),
                    'port' => config('database.connections.pgsql.port'),
                    'database' => config('database.connections.pgsql.database'),
                    'username' => config('database.connections.pgsql.username'),
                ],
            ]);
        });

        $exceptions->render(function (ValidationException $exception, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'code' => 'validation_failed',
                    'details' => $exception->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $exception, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'code' => 'unauthenticated',
                ], 401);
            }
        });

        $exceptions->render(function (AuthorizationException $exception, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Forbidden.',
                    'code' => 'forbidden',
                ], 403);
            }
        });

        $exceptions->render(function (HttpExceptionInterface $exception, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $exception->getMessage() ?: 'Request failed.',
                    'code' => 'http_error',
                ], $exception->getStatusCode());
            }
        });
    })->create();
