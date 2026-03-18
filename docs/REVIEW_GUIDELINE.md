# 📋 QUY ĐỊNH THẨM ĐỊNH REPORT MISTAKE (INTERNAL AUDIT ONLY)

File này quy định logic thẩm định chuyên sâu. Agent bắt buộc tuân thủ 100%.

---

## 1. NGUỒN TÀI LIỆU DUY NHẤT
TUYỆT ĐỐI KHÔNG sử dụng nguồn bên ngoài:
- ❌ No Google Search
- ❌ No Web Fetch
- ❌ No external knowledge

**CHỈ ĐƯỢC PHÉP sử dụng:**
- Tài liệu được liệt kê trong: `report-mistake-reviewer-project/docs/SOURCE_MAPPING.md`

**Quy định về Knowledge Issue:**
- Nếu là **Knowledge Issue** (sai đáp án, sai kiến thức): **BẮT BUỘC** phải tra cứu tài liệu nội bộ.
- Nếu thuộc App **không có tài liệu** trong SOURCE_MAPPING -> **BẮT BUỘC** trả về: **Kết luận: Unclear** | **Hành động: Wait**.

---

## 2. QUY TRÌNH THẨM ĐỊNH (PHÂN LOẠI)

### A. KNOWLEDGE ISSUE (Cần Verify Source)
*Áp dụng khi Reasons: 0 (incorrectAnswer), 1 (wrongExplanation), 2 (wrongCategory), hoặc Other (7) về kiến thức.*

1. **Trích dẫn (Quote)**: Đọc source và chép nguyên văn nội dung liên quan.
2. **Suy luận (Reasoning)**: So sánh Source vs CMS. Hai bên Khớp hay Mâu thuẫn?
3. **Kết luận nguồn**: Source chứng minh CMS Đúng hay CMS Sai.
4. **Vị trí**: Ghi rõ Trang / Chương / Dòng trong tài liệu.

### B. NON-KNOWLEDGE ISSUE (KHÔNG cần Verify Source)
*Áp dụng khi Reasons: 3 (grammaticalError), 5 (typo), 6 (badImage), 4 (missing asset).*

- Agent tự thẩm định dựa trên logic và dữ liệu CMS (ví dụ: thấy ảnh bị lỗi thật thì mark Valid ngay).
- **KHÔNG** hiển thị Mục 4 (Nguồn kiểm chứng) trong báo cáo.

---

## 3. ĐỘ TIN CẬY (CONFIDENCE SCORE)
Confidence là mức độ chắc chắn dựa trên độ mạnh của bằng chứng (cho Knowledge Issue) hoặc sự rõ ràng của lỗi (cho Non-Knowledge Issue).

- **Confidence < 70%**: 👉 **BẮT BUỘC** Kết luận: **Unclear** | Hành động: **Wait**.

---

## 4. FORMAT BÁO CÁO THẨM ĐỊNH (DISCORD)
📄 Thẩm định Report Mistake — ID: [Question ID] ([Tên app])

1. Trích xuất nội dung gốc từ CMS:
   * Tên app: [Tên ứng dụng]
   * Câu hỏi: "[Nguyên văn]"
   * Các đáp án:
     - [✅] ...
     - [❌] ...
   * Giải thích: "[Nguyên văn]"

2. Phân tích Report:
   * Reasons (enum): [0, 1, ...]
   * Report Type: Knowledge Issue / Non-Knowledge Issue

3. Phân tích tính đúng sai của report
   * Phân tích: [Logic dựa trên CMS + tài liệu]
   * So sánh: [Chỉ rõ điểm CMS đúng/sai]

4. Nguồn kiểm chứng (CHỈ khi VERIFY SOURCE)
   - Nguồn tham khảo: [Tên file]
   - Trích dẫn: "[Chép nguyên văn]"
   - Suy luận: [Source vs CMS khớp hay mâu thuẫn]
   - Kết luận nguồn: [Chứng minh CMS Đúng hay Sai]
   - Vị trí: [Trang, dòng...]
   (⚠️ Nếu KHÔNG VERIFY -> BỎ TOÀN BỘ MỤC NÀY)

5. Kết luận:
- CMS Đúng -> Report của người dùng là Sai (Invalid).
- CMS Sai -> Report của người dùng là Đúng (Valid).
- Unclear -> Cần con người xử lý (Unclear).
- Độ tin cậy (Confidence): [Score]%

**7. Bản chỉnh sửa đề xuất (CHỈ khi Valid):**
- **Câu hỏi:** [Nội dung mới nếu cần sửa]
- **Đáp án:** [Danh sách đáp án đã sửa]
- **Giải thích:** [Nội dung giải thích mới]

6. Đề xuất xử lý:
   * Hành động: OK / Cancel / Wait
   * Phân loại contentType: (CHỈ set nếu Valid)
     - Knowledge Issue (0,1,2,4,7) -> content (3)
     - Grammatical/Typo (3,5) -> content (3)
     - Bad Image (6) -> design (2)
     - Missing Asset (4) -> dev (1)
     - Invalid / Unclear -> contentType = N/A (BỎ QUA)
