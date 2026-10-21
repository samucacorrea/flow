<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class ApiController extends Controller
{
    use AuthorizesRequests;

    protected function error(string $message, string $code, int $status = 400, mixed $details = null): JsonResponse
    {
        $payload = [
            'message' => $message,
            'code' => $code,
        ];

        if ($details !== null) {
            $payload['details'] = $details;
        }

        return response()->json($payload, $status);
    }
}
