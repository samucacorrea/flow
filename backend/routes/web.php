<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InstallController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/install', [InstallController::class, 'index']);
Route::post('/install', [InstallController::class, 'install']);
Route::get('/install/success', [InstallController::class, 'success']);
