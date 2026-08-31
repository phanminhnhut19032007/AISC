# 🎨 REASY Frontend — Modern Next.js 14 Web Application

> Giao diện Web hiện đại, mượt mà và trực quan dành cho nền tảng quản lý nhà trọ **REASY**. Hỗ trợ đầy đủ 2 phân hệ người dùng: **Bảng điều khiển Quản lý Chủ trọ (Admin)** và **Cổng dịch vụ Cư dân (Tenant)**, tích hợp hiệu ứng **Anti-gravity (Phản trọng lực)** và tương thích hoàn hảo trên mọi thiết bị Di động & Máy tính.

🌐 **Website Trực tuyến (Vercel Live):** [https://aisc-delta.vercel.app](https://aisc-delta.vercel.app)

---

## 🛠️ Danh sách Tech Stack Frontend

| Hạng mục | Công nghệ / Thư viện | Phiên bản | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Core Framework** | `Next.js` (App Router) | `14.2.5` | Khung ứng dụng React tối ưu SEO, Server/Client Components |
| **UI Library** | `React` / `React-DOM` | `^18.3.1` | Thư viện xây dựng giao diện người dùng tương tác |
| **Ngôn ngữ** | `TypeScript` | `^5.5.3` | Định kiểu tĩnh an toàn và hạn chế lỗi runtime |
| **Styling & CSS** | `TailwindCSS` | `^3.4.4` | Utility-first CSS framework thiết kế giao diện linh hoạt |
| **CSS Preprocessor** | `PostCSS` / `Autoprefixer` | `^8.4.39` | Tự động thêm tiền tố trình duyệt và biên dịch CSS |
| **Hệ thống Icon** | `Lucide React` | `^0.395.0` | Bộ icon SVG hiện đại, sắc nét và cực nhẹ |
| **HTTP Client** | `Axios` | `^1.7.2` | Xử lý gọi API, tự động đính kèm Token và chặn lỗi 401 |
| **Quản lý Auth** | `js-cookie` | `^3.0.5` | Lưu trữ Token an toàn trong Cookie trình duyệt |
| **Thông báo (Toasts)** | `react-hot-toast` | `^2.4.1` | Hiển thị thông báo trạng thái thao tác đẹp mắt |
| **Biểu đồ & Thống kê** | `Recharts` | `^2.12.7` | Vẽ biểu đồ doanh thu và thống kê phòng |
| **Hiệu ứng Không gian** | `HTML5 Canvas + CSS3` | Native | Hiệu ứng hạt lơ lửng Anti-gravity, Parallax và Glassmorphism |
| **Giao diện Di động** | `Mobile Responsive Drawer` | Custom | Menu trượt 3 gạch trên điện thoại, tự co giãn 100% màn hình |
| **Nền tảng Hosting** | `Vercel` | Latest | Triển khai Edge CDN toàn cầu, tự động build khi push Git |

---

## 📱 Tính năng & Phân hệ Giao diện

### 👑 1. Phân hệ Chủ trọ / Quản lý (Admin):
* **Tổng quan (Dashboard):** Thống kê số phòng đang thuê, phòng trống, doanh thu tháng và biểu đồ.
* **Quản lý Tòa nhà & Phòng (`/buildings`):** Thêm tòa nhà, cấu hình giá thuê, đơn giá điện nước.
* **Quản lý Hóa đơn (`/invoices`):** Chốt số điện nước, sinh hóa đơn tự động và gắn mã VietQR.
* **Xử lý Sự cố & Bảo trì (`/tickets`):** Tiếp nhận báo hỏng từ người thuê, cập nhật trạng thái sửa chữa.
* **Tiện ích UniPack (`/unipack`):** Cửa hàng dịch vụ giặt ủi, dọn phòng, thẻ xe cho cư dân.
* **Kênh Chat tòa nhà (`/chat`):** Trò chuyện realtime trong kênh chung tòa nhà hoặc nhắn riêng từng phòng.

### 🏠 2. Phân hệ Cư dân / Người thuê trọ (Tenant):
* **Tổng quan Cư dân:** Xem thông tin phòng đang ở, hợp đồng thuê và hóa đơn tháng hiện tại.
* **Quét mã VietQR:** Thanh toán tiền phòng nhanh chóng bằng app ngân hàng 1 chạm.
* **Báo cáo sự cố:** Gửi ảnh và mô tả hỏng hóc (vòi nước, bóng đèn, điều hòa) để chủ trọ xử lý.
* **Trò chuyện cộng đồng:** Giao lưu với cư dân trong cùng tòa nhà hoặc liên hệ ban quản lý.

---

## 📂 Cấu trúc thư mục Frontend

```
smartrent-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root Layout, Metadata & Viewport di động
│   │   ├── globals.css             # CSS toàn cục & Keyframes hiệu ứng Anti-gravity
│   │   ├── page.tsx                # Trang chủ (Redirect sang Dashboard)
│   │   ├── login/                  # Trang Đăng nhập (Hiệu ứng Anti-gravity & Logo)
│   │   │   └── page.tsx
│   │   └── dashboard/              # Phân hệ Dashboard
│   │       ├── layout.tsx          # Layout Dashboard responsive (Sidebar + Main)
│   │       ├── page.tsx            # Trang Tổng quan số liệu
│   │       ├── buildings/page.tsx  # Trang Quản lý tòa nhà & phòng
│   │       ├── invoices/page.tsx   # Trang Quản lý hóa đơn & VietQR
│   │       ├── tickets/page.tsx    # Trang Quản lý bảo trì & sự cố
│   │       ├── chat/page.tsx       # Trang Chat Realtime WebSocket
│   │       └── unipack/page.tsx    # Trang Tiện ích dịch vụ UniPack
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx          # Thanh Header, Chuông thông báo & Nút Menu Mobile
│   │       └── Sidebar.tsx         # Thanh điều hướng Menu & Drawer di động
│   └── lib/
│       ├── api.ts                  # Axios API Client & TypeScript Interfaces
│       └── auth.ts                 # Quản lý Token, Cookie & Thông tin User
├── public/
│   └── logo.jpg                    # Logo thương hiệu REASY chính thức
├── package.json                    # Cấu hình dependencies & Scripts
├── tailwind.config.js              # Cấu hình bảng màu & mở rộng Tailwind
├── tsconfig.json                   # Cấu hình TypeScript
└── next.config.js                  # Cấu hình Next.js
```

---

## ⚡ Hướng dẫn Cài đặt & Chạy Local

### 1. Cài đặt thư viện dependencies:
```bash
cd smartrent-frontend
npm install
```

### 2. Cấu hình biến môi trường:
Tạo file `.env.local` tại thư mục `smartrent-frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Chạy ở chế độ phát triển (Development):
```bash
npm run dev
```

Mở trình duyệt tại: **`http://localhost:3000`**

### 4. Build phiên bản Production:
```bash
npm run build
npm run start
```
