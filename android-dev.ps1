<#
.SYNOPSIS
    Собирает, устанавливает и запускает приложение на подключённом
    Android-эмуляторе/устройстве одной командой.

.DESCRIPTION
    Прогоняет весь ручной рецепт из ANDROID_TROUBLESHOOTING.md
    («Рецепт «с нуля» после перезагрузки/новой машины»):
      1. Собирает и ставит debug-APK через gradlew.bat напрямую
         (в обход npm run android, который на этой машине не находит
         gradlew.bat из-за NoDefaultCurrentDirectoryInExePath) с
         init-скриптом, обходящим конфликт версий Kotlin.
      2. Поднимает Metro в отдельном окне PowerShell, если он ещё не
         запущен на порту 8081.
      3. Пробрасывает adb reverse для 8081 (Metro) и 8443 (Keycloak HTTPS
         dev-бэкенда) — они слетают при каждом перезапуске эмулятора.
      4. Запускает MainActivity.

    Предполагается, что эмулятор уже запущен и виден в `adb devices`.

.EXAMPLE
    .\android-dev.ps1
#>

$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
$androidDir = Join-Path $repoRoot 'android'

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

# 0. Убедиться, что есть подключённое устройство/эмулятор.
Write-Step 'Проверяю adb devices...'
$devices = & adb devices | Select-String -Pattern '\tdevice$'
if (-not $devices) {
    throw "Не вижу ни одного устройства в 'adb devices'. Запусти эмулятор и повтори."
}
Write-Host $devices

# 1. Сборка и установка debug-APK напрямую через gradlew (обход npm run android).
Write-Step 'Собираю и ставлю debug-APK через gradlew.bat...'
Push-Location $androidDir
try {
    & .\gradlew.bat --init-script skip-metadata-check-init.gradle app:installDebug -PreactNativeDevServerPort=8081
    if ($LASTEXITCODE -ne 0) {
        throw "gradlew.bat завершился с кодом $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

# 2. Поднять Metro в отдельном окне, если он ещё не слушает 8081.
Write-Step 'Проверяю Metro на порту 8081...'
$metroRunning = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($metroRunning) {
    Write-Host 'Metro уже запущен на 8081 — пропускаю запуск.'
}
else {
    Write-Host 'Запускаю Metro в новом окне PowerShell...'
    Start-Process powershell -ArgumentList @(
        '-NoExit', '-Command',
        "Set-Location '$repoRoot'; npx react-native start"
    )
    Write-Host 'Жду, пока Metro поднимется на 8081...'
    $deadline = (Get-Date).AddSeconds(30)
    while (-not (Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue)) {
        if ((Get-Date) -gt $deadline) {
            throw 'Metro не поднялся на 8081 за 30 секунд — проверь его окно вручную.'
        }
        Start-Sleep -Milliseconds 500
    }
}

# 3. adb reverse — слетает при каждом перезапуске эмулятора.
Write-Step 'Пробрасываю порты (adb reverse)...'
& adb reverse tcp:8081 tcp:8081
& adb reverse tcp:8443 tcp:8443

# 4. Запустить приложение.
Write-Step 'Запускаю MainActivity...'
& adb shell am start -n com.univer_mobile/.MainActivity

Write-Host "`nГотово. Metro работает в отдельном окне — не закрывай его." -ForegroundColor Green
