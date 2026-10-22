<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('flowio:make-admin {email}', function () {
    $email = strtolower(trim((string) $this->argument('email')));
    $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

    if (!$user) {
        $this->error('No user found with that email. Create the account first.');
        return Command::FAILURE;
    }

    $user->is_admin = true;
    $user->save();
    $this->info("Administrator access enabled for {$user->email}.");

    return Command::SUCCESS;
})->purpose('Grant administrator access to an existing Flowio user');
