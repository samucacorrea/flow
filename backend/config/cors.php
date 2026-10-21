<?php

function allowedOrigins(): array
{
    if (env('APP_ENV') === 'local' && env('CORS_ALLOW_ALL') === 'true') {
        return ['*'];
    }

    $fromEnv = env('FRONTEND_URLS');
    if ($fromEnv) {
        return array_values(array_filter(array_map('trim', explode(',', $fromEnv))));
    }

    return array_filter([
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://127.0.0.1:3000',
    ]);
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => allowedOrigins(),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
