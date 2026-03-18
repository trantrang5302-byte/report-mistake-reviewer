# 📋 QUY ĐỊNH THẨM ĐỊNH REPORT MISTAKE (MANDATORY)

File này là "Kinh Thánh" của Agent. Mọi hành động thẩm định phải tuân thủ 100% các quy tắc dưới đây.

---

## 1. PHÂN LOẠI REPORT (BẮT BUỘC)

Dựa trên trường `reasons` (enum) và `otherReason` (text):

### A. KNOWLEDGE ISSUE (Cần Verify Source)
- **Reasons**: 0 (incorrectAnswer), 1 (wrongExplanation), 2 (wrongCategory).
- **Other Reason (7)**: Nếu text chứa nội dung sai kiến thức, sai đáp án, sai logic.
- **Missing Content (4)**: Nếu thiếu thông tin kiến thức để trả lời câu hỏi.

### B. NON-KNOWLEDGE ISSUE (KHÔNG Verify Source)
- **Reasons**: 3 (grammaticalError), 5 (typo), 6 (badImage).
- **Missing Content (4)**: Nếu thiếu asset (ảnh, đoạn văn, hình ảnh).

---

## 2. MỤC ĐÍCH TÌM NGUỒN (VERIFY SOURCE)

Mục đích duy nhất: **KIỂM CHỨNG TÍNH ĐÚNG/SAI CỦA CMS.**

- **CMS (Question, Answers, Explanation) vs Source (Tài liệu chính thống)**.
- **CMS đúng** (Khớp Source) → **Invalid**.
- **CMS sai** (Khác Source) → **Valid**.
- **Không chứng minh được đúng hay sai** → **Unclear**.

### 🛑 LUẬT DIỆT NGU:
1. **ÉP DÙNG NGUỒN**: Phải có Bằng chứng (Exact Quote) + Link + Vị trí. Thiếu 1 trong 3 = Verify FAIL → Kết luận: **Unclear**.
2. **KHÔNG SEARCH CHUNG CHUNG**: Mỗi nguồn phải trả lời trực tiếp: "Thông tin này chứng minh CMS đúng hay sai?".
3. **MATH/LOGIC HIỂN NHIÊN**: Không cần tìm nguồn, chỉ cần giải trình logic.

---

## 3. FORMAT BÁO CÁO THẨM ĐỊNH (DISCORD)

Thẩm định Report Mistake của: [Question ID] - ([Tên app])

1. Trích xuất nội dung gốc từ CMS:
   * Tên app: [Tên ứng dụng]
   * Câu hỏi: "[Nguyên văn]"
   * Các đáp án:
     - [✅] [Đáp án đúng]
     - [❌] [Đáp án sai 1]
     - [❌] [Đáp án sai 2]
     - [❌] [Đáp án sai 3]
   * Giải thích: "[Nguyên văn]"

2. Phân tích Report:
   * Reasons (enum): [0, 1, ...]
   * Report Type: Knowledge Issue / Non-Knowledge Issue

3. Phân tích tính đúng sai của report
   * Phân tích: [Logic dựa trên CMS + kiến thức]
   * So sánh: [Chỉ rõ điểm CMS đúng/sai so với kiến thức chuẩn]

4. Nguồn kiểm chứng (CHỈ khi VERIFY SOURCE)
   - Link nguồn tham khảo: [URL]
   - Bằng chứng: "[Trích dẫn nguyên văn]"
   - Vị trí trong tài liệu: [Số trang, chương, ...]
   (⚠️ Nếu KHÔNG VERIFY -> BỎ TOÀN BỘ MỤC NÀY)

5. Kết luận:
   - CMS Đúng -> Report của người dùng là Sai (Invalid).
   - CMS Sai -> Report của người dùng là Đúng (Valid).
   - Unclear -> Cần con người xử lý (Unclear).

**7. Bản chỉnh sửa đề xuất (CHỈ khi Valid):**
   - **Câu hỏi:** [Nội dung mới nếu cần sửa]
   - **Đáp án:** [Danh sách đáp án đã sửa]
   - **Giải thích:** [Nội dung giải thích mới]

6. Đề xuất xử lý:
   * Hành động: OK / Cancel / Wait
   * Phân loại contentType: (CHỈ set nếu Valid)
     - other = 0, dev = 1, design = 2, content = 3

---

## 4. QUY TẮC CONTENT TYPE & HÀNH ĐỘNG

- **Action = OK** (Valid):
    - Knowledge Issue (0,1,2,4,7) → **content (3)**.
    - Grammatical/Typo (3,5) → **content (3)**.
    - Bad Image (6) → **design (2)**.
    - Missing Asset (4) → **dev (1)**.
- **Action = Cancel** (Invalid): contentType = **N/A (BỎ QUA)**.
- **Action = Wait** (Unclear): contentType = **N/A (BỎ QUA)**.
