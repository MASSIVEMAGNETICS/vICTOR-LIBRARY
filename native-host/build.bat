@echo off
REM Build script for TabTimeMachine Native Host
REM Requires PyInstaller: pip install pyinstaller

echo Building TabTimeMachine Native Host...
echo.

REM Check if PyInstaller is installed
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo PyInstaller is not installed. Installing...
    pip install pyinstaller
    if errorlevel 1 (
        echo Failed to install PyInstaller
        pause
        exit /b 1
    )
)

REM Build the executable
echo Building executable...
pyinstaller --onefile --noconsole --name tabtimemachine_host tabtimemachine_host.py

if errorlevel 1 (
    echo Build failed
    pause
    exit /b 1
)

REM Copy the executable to the current directory
copy dist\tabtimemachine_host.exe . /Y

echo.
echo Build complete! tabtimemachine_host.exe created.
echo.
echo Next steps:
echo 1. Load the extension in Chrome/Edge (Developer mode)
echo 2. Copy the Extension ID
echo 3. Run install.bat and enter the Extension ID
echo.
pause
