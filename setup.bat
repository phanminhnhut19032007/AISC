@echo off
chcp 65001 >nul
title Cài đặt dự án RENTEASY tự động
echo ========================================================
echo   🚀 BẮT ĐẦU CÀI ĐẶT DỰ ÁN RENTEASY TỰ ĐỘNG
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Đang cài đặt thư viện Python cho Backend...
cd smartrent-backend
if not exist "venv" (
    echo Đang tạo môi trường ảo Python venv...
    python -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo.
echo [2/3] Đang cài đặt thư viện Node.js cho Frontend...
cd smartrent-frontend
call npm install
cd ..

echo.
echo ========================================================
echo   ✅ CÀI ĐẶT HOÀN TẤT THÀNH CÔNG!
echo   Bây giờ bạn chỉ cần nhấp đúp file 'run_renteasy.vbs' để chạy dự án.
echo ========================================================
echo.
pause
