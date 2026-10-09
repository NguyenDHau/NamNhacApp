# FamilyBiz MVP

Ứng dụng quản lý doanh thu, công nợ khách hàng và bảng giá — React + Vite PWA frontend, Express API backend.

## Bản hiện tại
- Giao diện tiếng Việt, responsive cho điện thoại.
- Dashboard doanh thu, chi phí, công nợ.
- Quản lý khách hàng, sản phẩm/bảng giá.
- Ghi nhận giao dịch bán hàng, thu nợ, chi phí.
- Lưu dữ liệu cục bộ bằng IndexedDB qua `idb`; có thể nhập liệu khi offline trên cùng thiết bị.
- Xuất dữ liệu JSON để sao lưu.
- Backend Express mẫu và schema PostgreSQL để chuẩn bị đồng bộ nhiều thiết bị.

## Quan trọng
Bản mặc định là **local-first demo**: dữ liệu được lưu trên trình duyệt của thiết bị. Dữ liệu chưa tự chia sẻ giữa nhiều điện thoại. Để dùng chung thật, cần cấu hình Supabase, đăng nhập, chính sách phân quyền và API đồng bộ. Không dùng dữ liệu tài chính quan trọng trước khi thiết lập sao lưu và bảo mật.

## Yêu cầu
- Node.js 20+ khuyến nghị
- npm

## Chạy frontend
```bash
cd client
npm install
npm run dev
```
Mở URL Vite hiện trong terminal.

## Chạy backend mẫu
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
API health check: `http://localhost:8080/api/health`

Backend hiện là scaffold; chưa tự lưu dữ liệu vào PostgreSQL cho tới khi bạn cấu hình database và triển khai các endpoint tương ứng.

## Cài lên điện thoại
Sau khi deploy frontend lên HTTPS, mở đường dẫn bằng Safari (iPhone) hoặc Chrome (Android), chọn Add to Home Screen / Install app. Service worker hoạt động trong bản build production.

## Cấu trúc
- `client/`: React + Vite + PWA + IndexedDB
- `server/`: Express API scaffold
- `database/schema.sql`: schema PostgreSQL khởi đầu

## Lộ trình tiếp theo
1. Cấu hình Supabase Auth và bảng dữ liệu.
2. Thêm family membership + RLS.
3. Viết endpoint sync có idempotency bằng UUID.
4. Kiểm thử đồng bộ xung đột giữa nhiều thiết bị.
5. Thiết lập backup tự động.
