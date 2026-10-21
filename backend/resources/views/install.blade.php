<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flowio Installer</title>
    <style>
        body { font-family: Arial, sans-serif; background:#f8fafc; color:#0f172a; margin:0; }
        .wrap { max-width: 860px; margin: 40px auto; padding: 0 20px; }
        .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-bottom:20px; box-shadow:0 8px 24px rgba(15,23,42,0.06); }
        h1 { margin:0 0 6px; }
        .grid { display:grid; gap:16px; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); }
        label { font-size:14px; color:#475569; display:block; margin-bottom:6px; }
        input { width:100%; padding:10px 12px; border:1px solid #e2e8f0; border-radius:10px; }
        .btn { background:#3b82f6; color:#fff; border:none; padding:12px 16px; border-radius:10px; font-weight:600; cursor:pointer; }
        .btn:disabled { background:#94a3b8; cursor:not-allowed; }
        .req { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; }
        .ok { color:#16a34a; font-weight:600; }
        .bad { color:#dc2626; font-weight:600; }
        .error { color:#dc2626; font-size:14px; margin-top:8px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <h1>Flowio Install Wizard</h1>
            <p>Configure o ambiente e conclua a instalação.</p>
        </div>

        <div class="card">
            <h2>Requisitos</h2>
            @foreach($requirements as $req)
                <div class="req">
                    <div>{{ $req['label'] }}</div>
                    <div class="{{ $req['ok'] ? 'ok' : 'bad' }}">
                        {{ $req['ok'] ? 'OK' : 'FALHOU' }}
                        @if(isset($req['current']))
                            ({{ $req['current'] }})
                        @endif
                    </div>
                </div>
            @endforeach
            @if($errors->has('requirements'))
                <div class="error">{{ $errors->first('requirements') }}</div>
            @endif
        </div>

        <form method="POST" action="/install" class="card">
            @csrf
            <h2>Configuração</h2>
            <div class="grid">
                <div>
                    <label>APP URL</label>
                    <input name="app_url" value="{{ old('app_url', request()->getSchemeAndHttpHost()) }}" required>
                </div>
                <div>
                    <label>DB Host</label>
                    <input name="db_host" value="{{ old('db_host','127.0.0.1') }}" required>
                </div>
                <div>
                    <label>DB Port</label>
                    <input name="db_port" value="{{ old('db_port','5432') }}" required>
                </div>
                <div>
                    <label>DB Database</label>
                    <input name="db_database" value="{{ old('db_database','flowio') }}" required>
                </div>
                <div>
                    <label>DB Username</label>
                    <input name="db_username" value="{{ old('db_username','postgres') }}" required>
                </div>
                <div>
                    <label>DB Password</label>
                    <input name="db_password" value="{{ old('db_password') }}">
                </div>
            </div>

            <h2 style="margin-top:24px;">Admin</h2>
            <div class="grid">
                <div>
                    <label>Nome</label>
                    <input name="admin_name" value="{{ old('admin_name') }}" required>
                </div>
                <div>
                    <label>Email</label>
                    <input name="admin_email" type="email" value="{{ old('admin_email') }}" required>
                </div>
                <div>
                    <label>Senha</label>
                    <input name="admin_password" type="password" required>
                </div>
            </div>

            @if($errors->any())
                <div class="error">
                    {{ $errors->first() }}
                </div>
            @endif

            <div style="margin-top:20px;">
                <button class="btn" type="submit" {{ $canInstall ? '' : 'disabled' }}>Instalar</button>
            </div>
        </form>
    </div>
</body>
</html>
