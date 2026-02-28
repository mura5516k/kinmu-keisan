@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

where npx >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npx が見つかりません。Node.js をインストールしてください。
  pause
  exit /b 1
)

if not exist "firebase-config.js" (
  echo [ERROR] firebase-config.js がありません。
  echo firebase-config.example.js をコピーして作成してください。
  pause
  exit /b 1
)

findstr /c:"YOUR_" "firebase-config.js" >nul
if not errorlevel 1 (
  echo [WARN] firebase-config.js にプレースホルダが残っています。
  echo       Firebase の設定値に置き換えてください。
)

set "PORT=3000"
echo ローカルサーバを起動します: http://localhost:%PORT%/
start "work-income-server" cmd /k "cd /d ""%ROOT%"" && npx serve . -l %PORT%"

timeout /t 3 /nobreak >nul
start "" "http://localhost:%PORT%/index.html"
start "" "http://localhost:%PORT%/monthly.html"

echo ブラウザを開きました。
echo 入力画面で1件保存し、月一覧画面で反映を確認してください。
exit /b 0
