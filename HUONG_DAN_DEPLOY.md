# 🚀 Hướng dẫn Deploy hệ thống RENTEASY lên Cloud (Chạy 24/7 Miễn phí)

Hệ thống RENTEASY gồm 2 phần:
1. **Backend (API FastAPI & Database)** &rarr; Deploy lên **Render.com** (Miễn phí)
2. **Frontend (Giao diện Next.js)** &rarr; Deploy lên **Vercel.com** (Miễn phí)

---

## 📌 BƯỚC 1: Đẩy mã nguồn lên GitHub của bạn
1. Truy cập [https://github.com](https://github.com) và tạo một Repository mới (ví dụ: `renteasy-app`).
2. Mở terminal tại thư mục dự án `D:\AISC` và chạy các lệnh sau:
   ```bash
   git init
   git add .
   git commit -m "Deploy RENTEASY fullstack"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/renteasy-app.git
   git push -u origin main
   ```

---

## 📌 BƯỚC 2: Deploy Backend lên Render.com (API Server)
1. Đăng ký/Đăng nhập tại [https://render.com](https://render.com) (chọn **Continue with GitHub**).
2. Tại trang Dashboard, nhấn **New +** &rarr; Chọn **Web Service**.
3. Chọn Repository `renteasy-app` vừa tạo trên GitHub &rarr; Nhấn **Connect**.
4. Điền các thông tin cài đặt:
   * **Name:** `renteasy-backend` (hoặc tên tùy thích)
   * **Root Directory:** `smartrent-backend` *(rất quan trọng)*
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type:** `Free`
5. Kéo xuống mục **Environment Variables** &rarr; Thêm các biến môi trường:
   * `DATABASE_URL` = `sqlite+aiosqlite:///./smartrent_demo.db`
   * `DATABASE_URL_SYNC` = `sqlite:///./smartrent_demo.db`
   * `PYTHONIOENCODING` = `utf-8`
   * `CORS_ORIGINS` = `["*"]`
6. Nhấn nút **Create Web Service**.
7. Chờ 1-2 phút, Render sẽ cấp cho bạn một đường link Backend (Ví dụ: `https://renteasy-backend.onrender.com`).
   * *Kiểm tra link:* Mở `https://renteasy-backend.onrender.com/docs` &rarr; Thấy trang Swagger API là thành công!

---

## 📌 BƯỚC 3: Deploy Frontend lên Vercel.com (Giao diện Web)
1. Đăng ký/Đăng nhập tại [https://vercel.com](https://vercel.com) (chọn **Continue with GitHub**).
2. Nhấn nút **Add New...** &rarr; Chọn **Project**.
3. Chọn Repository `renteasy-app` &rarr; Nhấn **Import**.
4. Cấu hình dự án:
   * **Framework Preset:** `Next.js`
   * **Root Directory:** Nhấn Edit &rarr; Chọn thư mục `smartrent-frontend`
5. Mục **Environment Variables** (Biến môi trường) &rarr; Thêm biến:
   * **Key:** `NEXT_PUBLIC_API_URL`
   * **Value:** `https://renteasy-backend.onrender.com/api/v1` *(Dán link Render Backend ở Bước 2 kèm `/api/v1`)*
6. Nhấn nút **Deploy**!
7. Chờ khoảng 1 phút, Vercel sẽ cấp cho bạn đường link website chính thức (Ví dụ: `https://renteasy-frontend.vercel.app`).

---

🎉 **CHÚC MỪNG BẠN! Website RENTEASY của bạn đã chính thức hoạt động 24/7 trên toàn thế giới!**
Mọi người chỉ cần mở link Vercel trên điện thoại hoặc máy tính là có thể sử dụng đầy đủ các tính năng.
