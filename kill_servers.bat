@echo off
echo Dang don dep cac tien trinh cu...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul
ping 127.0.0.1 -n 3 >nul
echo Don dep xong!
