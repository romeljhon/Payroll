# Ensure the script runs from its own directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $ScriptDir



function Check-Command($name, $command) {
    Write-Host "Checking $name..."
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] $name not found. Please install it." -ForegroundColor Red
        return $false
    }
    return $true
}

function Setup-Python {
    if (-not (Check-Command "Python" "python")) {
        Install-Python
    }

    Write-Host "[INFO] Verifying pip..."
    if (-not (python -m pip --version 2>$null)) {
        python -m ensurepip --upgrade
    }

    if (-Not (Test-Path "backend/.venv/Scripts/Activate.ps1")) {
        Write-Host "[INFO] Creating virtualenv..."
        python -m venv backend/.venv
    }

    Write-Host "[INFO] Activating virtualenv..."
    & backend/.venv/Scripts/Activate.ps1

    Write-Host "[INFO] Installing backend requirements..."
    pip install -r backend/requirements.txt

    Write-Host "[INFO] Ensuring Django is installed..."
    if (-not (python -m django --version 2>$null)) {
        pip install django
    }

    Write-Host "[INFO] Running Django migrations..."
    Push-Location backend
    python manage.py migrate

    Write-Host "[INFO] Seeding Salary Components..."
    python manage.py seed_salary_components

    Write-Host "[INFO] Seeding Mock Restaurant Payroll Data..."
    python manage.py seed_mock_payroll

    Write-Host "[INFO] Seeding Mock Restaurant Employees..."
    python manage.py seed_employees

    Write-Host "[INFO] Seeding Time Logs..."
    python manage.py seed_full_timelogs_2025
    Pop-Location
}



function Setup-Node {
    if (-not (Check-Command "Node.js" "node")) { return $false }
    if (-not (Check-Command "npm" "npm")) { return $false }

    return $true
}

function Setup-Frontend {
    Write-Host "[INFO] Checking frontend dependencies..."
    if (-not (Test-Path "frontend/node_modules")) {
        Write-Host "[INFO] Installing frontend (Next.js) dependencies..."
        Push-Location frontend
        npm install
        Pop-Location
    } else {
        Write-Host "[OK] Frontend dependencies already installed."
    }
}

function Setup-Electron {
    Write-Host "[INFO] Installing Electron dependencies..."
    Push-Location electron
    npm install
    Pop-Location
}

function Start-App {
    Write-Host "[INFO] Launching app (Electron + Next.js)..."
    Push-Location electron
    npm run devdesktop
    Pop-Location
}

function Ensure-Backend-Env {
    # 🔧 Fallback-safe way to get script location
    $ScriptDir = Split-Path -Parent $PSCommandPath
    $envPath = Join-Path $ScriptDir "backend\.env"

    if (-not (Test-Path $envPath)) {
        Write-Host "[INFO] Generating secure SECRET_KEY for Django..."

        # Generate 50-character secure Django key
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(-_=+)'
        $rand = -join ((1..50) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

        $lines = @(
            "SECRET_KEY=$rand"
            "DEBUG=True"
            "ALLOWED_HOSTS=127.0.0.1,localhost"
        )

        Write-Host "[INFO] Writing backend/.env file (UTF-8 NO BOM)..."
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllLines($envPath, $lines, $utf8NoBom)
    } else {
        Write-Host "[OK] backend/.env already exists."
    }
}

function Create-DjangoSuperUser {
    $username = "admin"
    $email = "KazuPay Solutions @admin.com"
    $password = "admin123"

    Write-Host "[INFO] Creating default Django superuser if not exists..."

    $script = @"
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$username').exists():
    User.objects.create_superuser('$username', '$email', '$password')
    print('✅ Superuser created: $username')
else:
    print('ℹ️  Superuser already exists: $username')
"@

    Push-Location backend
    python manage.py shell -c "$script"
    Pop-Location
}


function Ensure-Frontend-Env {
    $envPath = "frontend/.env.local"
    if (-not (Test-Path $envPath)) {
        Write-Host "[INFO] Creating default frontend .env.local file..."
        @"
NEXT_PUBLIC_API_URL=http://localhost:8000/payroll
NEXT_PUBLIC_APP_NAME=Payroll App
"@ | Out-File -Encoding UTF8 -FilePath $envPath
    } else {
        Write-Host "[OK] frontend/.env.local already exists."
    }
}


# ----------- MAIN EXECUTION -----------

if (-not (Setup-Node)) { exit 1 }

Ensure-Backend-Env
Ensure-Frontend-Env
Setup-Python
Create-DjangoSuperUser
Setup-Frontend
Setup-Electron
Start-App
