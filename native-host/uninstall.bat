@echo off
REM TabTimeMachine Native Host Uninstall Script for Windows

echo Uninstalling TabTimeMachine Native Messaging Host...
echo.

REM Unregister from Chrome
echo Removing Chrome registry entry...
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabtimemachine.host" /f 2>nul
if %errorlevel% equ 0 (
    echo Chrome registry entry removed
) else (
    echo Chrome registry entry not found or already removed
)

REM Unregister from Edge
echo.
echo Removing Edge registry entry...
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabtimemachine.host" /f 2>nul
if %errorlevel% equ 0 (
    echo Edge registry entry removed
) else (
    echo Edge registry entry not found or already removed
)

echo.
echo Uninstall complete!
echo.
echo Note: The extension and native host files are still on disk.
echo You can manually delete them if desired.
echo.
pause
