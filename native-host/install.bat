@echo off
REM TabTimeMachine Native Host Installation Script for Windows
REM This script installs the native messaging host for Chrome and Edge

echo Installing TabTimeMachine Native Messaging Host...
echo.

REM Get the current directory
set INSTALL_DIR=%~dp0
set INSTALL_DIR=%INSTALL_DIR:~0,-1%

REM Prompt for extension ID
set /p EXTENSION_ID="Enter your Chrome/Edge Extension ID: "

if "%EXTENSION_ID%"=="" (
    echo Error: Extension ID is required
    pause
    exit /b 1
)

REM Create the manifest with the correct path and extension ID
echo Creating native messaging manifest...
(
echo {
echo   "name": "com.tabtimemachine.host",
echo   "description": "TabTimeMachine Native Messaging Host",
echo   "path": "%INSTALL_DIR%\\tabtimemachine_host.exe",
echo   "type": "stdio",
echo   "allowed_origins": [
echo     "chrome-extension://%EXTENSION_ID%/"
echo   ]
echo }
) > "%INSTALL_DIR%\com.tabtimemachine.host.json"

REM Register for Chrome
echo.
echo Registering for Google Chrome...
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabtimemachine.host" /ve /t REG_SZ /d "%INSTALL_DIR%\com.tabtimemachine.host.json" /f
if %errorlevel% equ 0 (
    echo Chrome registration successful
) else (
    echo Chrome registration failed or Chrome not installed
)

REM Register for Edge
echo.
echo Registering for Microsoft Edge...
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabtimemachine.host" /ve /t REG_SZ /d "%INSTALL_DIR%\com.tabtimemachine.host.json" /f
if %errorlevel% equ 0 (
    echo Edge registration successful
) else (
    echo Edge registration failed or Edge not installed
)

echo.
echo Installation complete!
echo.
echo Native messaging host installed to: %INSTALL_DIR%
echo Manifest location: %INSTALL_DIR%\com.tabtimemachine.host.json
echo.
pause
