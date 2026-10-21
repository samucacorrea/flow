<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class InstallController extends Controller
{
    public function index()
    {
        if ($this->isInstalled()) {
            return redirect('/install/success');
        }

        $requirements = $this->checkRequirements();

        return view('install', [
            'requirements' => $requirements,
            'canInstall' => collect($requirements)->every(fn ($item) => $item['ok']),
        ]);
    }

    public function install(Request $request)
    {
        if ($this->isInstalled()) {
            return redirect('/install/success');
        }

        $requirements = $this->checkRequirements();
        if (!collect($requirements)->every(fn ($item) => $item['ok'])) {
            return back()->withErrors(['requirements' => 'Requisitos não atendidos.'])->withInput();
        }

        $data = $request->validate([
            'app_url' => ['required', 'url'],
            'db_host' => ['required', 'string'],
            'db_port' => ['required', 'string'],
            'db_database' => ['required', 'string'],
            'db_username' => ['required', 'string'],
            'db_password' => ['nullable', 'string'],
            'admin_name' => ['required', 'string'],
            'admin_email' => ['required', 'email'],
            'admin_password' => ['required', 'string', 'min:8'],
        ]);

        $envPath = base_path('.env');
        $examplePath = base_path('.env.example');
        if (!file_exists($envPath)) {
            copy($examplePath, $envPath);
        }

        $this->setEnvValues($envPath, [
            'APP_URL' => $data['app_url'],
            'APP_KEY' => 'base64:' . base64_encode(Str::random(32)),
            'DB_CONNECTION' => 'pgsql',
            'DB_HOST' => $data['db_host'],
            'DB_PORT' => $data['db_port'],
            'DB_DATABASE' => $data['db_database'],
            'DB_USERNAME' => $data['db_username'],
            'DB_PASSWORD' => $data['db_password'] ?? '',
        ]);

        config([
            'database.connections.pgsql.host' => $data['db_host'],
            'database.connections.pgsql.port' => $data['db_port'],
            'database.connections.pgsql.database' => $data['db_database'],
            'database.connections.pgsql.username' => $data['db_username'],
            'database.connections.pgsql.password' => $data['db_password'] ?? '',
        ]);

        DB::purge('pgsql');
        try {
            DB::connection('pgsql')->getPdo();
        } catch (\Throwable $e) {
            return back()->withErrors(['db' => 'Falha ao conectar no banco: ' . $e->getMessage()])->withInput();
        }

        Artisan::call('migrate', ['--force' => true]);

        User::updateOrCreate(
            ['email' => $data['admin_email']],
            [
                'name' => $data['admin_name'],
                'password' => Hash::make($data['admin_password']),
            ]
        );

        $flag = storage_path('app/installed.flag');
        if (!file_exists($flag)) {
            file_put_contents($flag, now()->toDateTimeString());
        }

        return redirect('/login')->with('status', 'Instalação concluída. Faça login.');
    }

    public function success()
    {
        if (!$this->isInstalled()) {
            return redirect('/install');
        }

        return view('install-success');
    }

    protected function isInstalled(): bool
    {
        return file_exists(storage_path('app/installed.flag'));
    }

    protected function checkRequirements(): array
    {
        return [
            [
                'label' => 'PHP >= 8.2',
                'ok' => version_compare(PHP_VERSION, '8.2.0', '>='),
                'current' => PHP_VERSION,
            ],
            [
                'label' => 'ext-pdo_pgsql',
                'ok' => extension_loaded('pdo_pgsql'),
            ],
            [
                'label' => 'ext-openssl',
                'ok' => extension_loaded('openssl'),
            ],
            [
                'label' => 'ext-mbstring',
                'ok' => extension_loaded('mbstring'),
            ],
            [
                'label' => 'ext-curl',
                'ok' => extension_loaded('curl'),
            ],
            [
                'label' => 'storage/ writable',
                'ok' => is_writable(storage_path()),
            ],
            [
                'label' => 'bootstrap/cache writable',
                'ok' => is_writable(base_path('bootstrap/cache')),
            ],
        ];
    }

    protected function setEnvValues(string $envPath, array $values): void
    {
        $contents = file_get_contents($envPath);
        foreach ($values as $key => $value) {
            $escaped = $this->escapeEnvValue($value);
            if (preg_match("/^{$key}=.*/m", $contents)) {
                $contents = preg_replace("/^{$key}=.*/m", "{$key}={$escaped}", $contents);
            } else {
                $contents .= PHP_EOL . "{$key}={$escaped}";
            }
        }
        file_put_contents($envPath, $contents);
    }

    protected function escapeEnvValue(string $value): string
    {
        if ($value === '') {
            return '""';
        }
        if (preg_match('/\s/', $value)) {
            return '"' . addslashes($value) . '"';
        }
        return $value;
    }
}
