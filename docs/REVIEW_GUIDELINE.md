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

**Nếu:**
- Không tìm thấy thông tin trong tài liệu.
- Hoặc thông tin không đủ để kết luận chắc chắn.
👉 **BẮT BUỘC** trả về: **Kết luận: Unclear** | **Hành động: Wait**

---

## 2. QUY TRÌNH VERIFY SOURCE (BẮT BUỘC 4 BƯỚC)
⚠️ Chỉ áp dụng cho: **Knowledge Issue**.

**QUY TẮC ĐỐI CHIẾU NGUỒN (CROSS-REFERENCE):**
- **KHÔNG** chỉ dùng 1 nguồn rồi kết luận ngay.
- Agent **BẮT BUỘC** phải tìm thông tin từ **TẤT CẢ các Tier** được cung cấp trong `SOURCE_MAPPING.md` cho App đó.
- Nếu các nguồn thống nhất -> Confidence tăng cao.
- Nếu các nguồn mâu thuẫn -> Ưu tiên Tier 1 (Official), nhưng phải giải trình rõ sự mâu thuẫn trong phần Phân tích.

1. **Trích dẫn (Quote)**: Đọc source và chép nguyên văn nội dung liên quan. (❌ Không paraphrase, không tự nhớ kiến thức).
2. **Suy luận (Reasoning)**: Dựa TRỰC TIẾP trên nội dung vừa trích dẫn. So sánh: Source nói gì? CMS nói gì? Hai bên Khớp hay Mâu thuẫn?
3. **Kết luận nguồn (Source Verdict)**: Dựa trên source đã đọc, khẳng định Source chứng minh CMS Đúng hay CMS Sai.
4. **Vị trí (Location)**: Ghi rõ vị trí trong source (Trang / Chương / Dòng / Section).

---

## 3. ĐỘ TIN CẬY (CONFIDENCE SCORE)
Confidence là mức độ chắc chắn của agent dựa trên độ mạnh của bằng chứng từ Source.

- **Confidence < 70%** (Không đủ chắc): 👉 **BẮT BUỘC** Kết luận: **Unclear** | Hành động: **Wait**.

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
   * Phân tích: [Logic dựa trên CMS + kiến thức]
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
