@echo off
setlocal

:: Check Node.js
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js is not installed.
  echo         Download: https://nodejs.org
  goto end
)

:: Check npm
where npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm is not installed.
  echo         Download: https://nodejs.org
  goto end
)

:: Check Python
where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [INFO] Python is not installed — attempting to download and install...
  powershell -Command "Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe -OutFile python-installer.exe"
  echo [INFO] Launching Python installer...
  start /wait python-installer.exe
  echo [INFO] Please rerun this script after Python installation completes.
  goto end
)

:: Check pip
python -m pip --version >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [INFO] pip not found — attempting to bootstrap it...
  python -m ensurepip --upgrade
  python -m pip --version >nul 2>nul
  IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] pip is still not available after bootstrapping.
    echo         Please install manually from: https://pip.pypa.io/en/stable/installation/
    goto end
  )
)

:: Check Django
python -m django --version >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Django is not installed in your environment.
  echo         Run this after activating your virtualenv: pip install django
  goto end
)

:: Activate virtualenv
IF EXIST backend\.venv\Scripts\activate.bat (
  call backend\.venv\Scripts\activate.bat
) ELSE (
  echo [INFO] Creating Python virtual environment...
  cd backend
  python -m venv .venv
  call .venv\Scripts\activate.bat
  pip install -r requirements.txt
  cd ..
)

:: Install Electron dependencies
cd electron
npm install

:: Start the app
npm run devdesktop

:end
pause
