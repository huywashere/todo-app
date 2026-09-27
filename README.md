# todo-app

Fullstack Task Management Application featuring a pixel-accurate **TickTick Web UI** and a modern **Java Spring Boot 3.4** Clean Architecture REST API.

---

## 🚀 Tính Năng Chính (Features)

### 🎨 Frontend (React 19 + TypeScript + Vite)
- **Giao diện TickTick chuẩn 4 cột**:
  - **Left Rail**: Logo TickTick, Tasks, Calendar, Habits, Matrix, Pomodoro, Search, Cloud Sync, Theme Toggle (Light/Dark).
  - **Lists Sidebar**: Smart Lists (`Today`, `Tomorrow`, `Next 7 Days`, `Assigned to Me`, `Inbox`) & Custom Lists (`September Plan`, `Work Hard`, `Life Memo`, `Life`, `Workout Plan`, `Wishlist`).
  - **Main Task Pane**: Nhóm theo thời gian (`Today`, `Tomorrow`, `Next 7 Days`), thêm nhanh `+ Add task`, time badges (`07:00`, `09:00`, `12:00`, `Mon`).
  - **Right Detail Pane**: Xem và chỉnh sửa chi tiết task, checklist subtasks con, chip ngày giờ, cờ mức độ ưu tiên (Priority Flags).
- **Chế độ Lịch Timeline (Calendar View)**: Khung giờ `07:00` - `18:00` với khối màu trực quan mô phỏng mobile view trong ảnh mockup.
- **Offline-First & Hybrid Sync**: Tự động đồng bộ với Spring Boot REST API khi online, lưu trữ cục bộ LocalStorage an toàn khi offline.
- **Haptic Audio Feedback**: Hiệu ứng âm thanh click, hoàn thành và confetti pháo hoa khi hoàn tất công việc.

### ☕ Backend (Java Spring Boot 3.4 + Spring Data JPA)
- **Kiến trúc Layered Clean Architecture**: Controller -> Service -> Repository -> Entity / DTOs.
- **RESTful APIs**:
  - `GET /api/v1/tasks` (Hỗ trợ query, listId, status filter)
  - `POST /api/v1/tasks` (Tạo task)
  - `PUT /api/v1/tasks/{id}` (Cập nhật task)
  - `PATCH /api/v1/tasks/{id}/toggle` (Đảo trạng thái hoàn thành)
  - `DELETE /api/v1/tasks/{id}` (Xóa task)
  - `POST /api/v1/tasks/{id}/subtasks` (Thêm subtask checklist)
  - `PATCH /api/v1/tasks/{id}/subtasks/{subTaskId}/toggle` (Đảo trạng thái subtask)
  - `DELETE /api/v1/tasks/{id}/subtasks/{subTaskId}` (Xóa subtask)
  - `GET /api/v1/lists`, `POST /api/v1/lists`, `DELETE /api/v1/lists/{id}`
  - `GET /api/v1/tasks/stats`
- **Database**: H2 In-Memory Database (Console tại `/h2-console`).
- **Tài liệu API**: OpenAPI / Swagger UI 3.1 tại `/swagger-ui.html`.
- **CORS Config**: Mở quyền cho frontend chạy tại `http://localhost:5173`.

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)

### 1. Khởi chạy Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
- API chạy tại: `http://localhost:8085`
- Swagger UI: `http://localhost:8085/swagger-ui.html`
- H2 Console: `http://localhost:8085/h2-console` (JDBC URL: `jdbc:h2:mem:tododb`, Username: `sa`, Password: để trống)

### 2. Khởi chạy Frontend (React + Vite)
```bash
npm install
npm run dev
```
- Mở trình duyệt tại: `http://localhost:5173`
