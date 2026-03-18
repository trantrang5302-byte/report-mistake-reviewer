# 🕵️ Report Mistake Reviewer Project

Dự án chuyên biệt dành cho agent thẩm định nội dung và xử lý báo cáo lỗi câu hỏi từ CMS, tự động đẩy kết quả lên Discord với giao diện nút bấm (Action Buttons).

## 📂 Cấu trúc dự án
- `agents/`: Chứa file định nghĩa AI Agent (`report-mistake-reviewer.md`).
- `scripts/`: Chứa các script thực thi (Push to Discord, Fetch API).
- `docs/`: Hướng dẫn chuyên sâu và quy trình thẩm định.

## 🚀 Hướng dẫn cài đặt

1. **Cài đặt Dependency**:
   ```bash
   npm install
   ```

2. **Cấu hình Môi trường**:
   - Copy file `.env.example` thành `.env` (nếu có).
   - Điền các thông tin sau:
     - `DISCORD_TOKEN`: Token của Bot Discord.
     - `CHANNEL_ID`: ID của kênh nhận báo cáo.
     - `SESSION_ID`: JWT Token để gọi API CMS.

3. **Chạy Agent**:
   Sử dụng Gemini CLI hoặc chạy trực tiếp script:
   ```bash
   node scripts/push-detailed-report.js <QuestionID> <Analysis> <Source> <Conclusion> <Action> <ClassID>
   ```

## 🛠️ Quy trình hoạt động
1. **Lấy dữ liệu**: Script `fetch-cms.js` truy vấn danh sách báo cáo lỗi từ CMS.
2. **Thẩm định**: AI Agent tra cứu nguồn tin cậy (Google Web Search) để đối chiếu kiến thức.
3. **Đẩy báo cáo**: Script `push-detailed-report.js` tạo Embed đẹp mắt trên Discord kèm 3 nút thực thi:
   - `OK - Chấp nhận & Sửa`
   - `Cancel - Giữ nguyên`
   - `Wait - Tự kiểm tra lại`

## ⚖️ Tiêu chuẩn Thẩm định
- Luôn cung cấp **Link nguồn** và **Bằng chứng** từ tài liệu gốc.
- Phân loại lỗi chính xác theo 3 nhóm: `DEV (0)`, `CONTENT (1)`, `DESIGN (2)`.
- Đảm bảo tính khách quan tuyệt đối.
