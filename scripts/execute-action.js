const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const id = process.argv[2]; 
const action = process.argv[3]; 
const classId = process.argv[4] || "7"; 
const sessionId = process.env.SESSION_ID;
const userId = process.env.USER_ID || "5658932726988800";

if (!id || !action) {
    console.error("❌ ERROR: Missing arguments.");
    process.exit(1);
}

const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionId}` };

async function execute() {
    console.log(`
🚀 KHỞI CHẠY FLOW CẬP NHẬT: ${action} trên ID ${id}`);
    
    try {
        // 1. Lấy dữ liệu Report (Tìm ở cả 0 và 1)
        let reports = [];
        const res0 = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ page: 0, status: 0, limit: 300 })
        });
        if (res0.ok) reports = reports.concat(await res0.json());
        const res1 = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ page: 0, status: 1, limit: 300 })
        });
        if (res1.ok) reports = reports.concat(await res1.json());

        const targetReport = reports.find(r => r.questionId == id || r.id == id);
        if (!targetReport) throw new Error("Không tìm thấy report.");

        const qid = targetReport.questionId;
        console.log(`>>> Đang xử lý câu hỏi ID ${qid}`);

        // 2. Lấy dữ liệu Câu hỏi gốc
        const resQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers, body: JSON.stringify({ questionIds: [parseInt(qid)], loadAll: true })
        });
        const qData = (await resQ.json())[0];
        if (!qData) throw new Error("Không tìm thấy câu hỏi gốc trên CMS.");

        const oldQuestion = JSON.parse(JSON.stringify(qData));
        let newQuestion = JSON.parse(JSON.stringify(oldQuestion));

        // 3. AI thực hiện chỉnh sửa (Dùng file tạm để an toàn tuyệt đối)
        if (action === 'OK') {
            console.log(">>> Đang gọi AI sửa nội dung...");
            const expertNote = targetReport.note || "Cần sửa lại nội dung cho chính xác.";
            const tempFile = `prompt_${id}.txt`;
            const prompt = `Bạn là chuyên gia CMS. Hãy sửa JSON câu hỏi dựa trên ghi chú thẩm định.
            YÊU CẦU:
            1. Giữ nguyên cấu trúc JSON.
            2. Sửa text, answers (correct status và text), explanation.
            3. Trả về DUY NHẤT một khối JSON hợp lệ.

            Ghi chú thẩm định: "${expertNote}"
            JSON cũ: ${JSON.stringify(oldQuestion)}`;

            fs.writeFileSync(tempFile, prompt);
            try {
                const aiOutput = execSync(`cat ${tempFile} | gemini`, { timeout: 60000 }).toString();
                const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    newQuestion = { ...newQuestion, ...JSON.parse(jsonMatch[0]), lastUpdate: Date.now() };
                } else {
                    throw new Error("AI không trả về JSON hợp lệ.");
                }
            } finally {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            }
        }

        // 4. Đẩy cập nhật lên CMS (Flow 3 bước)
        console.log(">>> [1/3] Cập nhật Question...");
        const upQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/updates', {
            method: 'POST', headers, body: JSON.stringify({ questions: [newQuestion] })
        });
        if (!upQ.ok) throw new Error(`Lỗi Update Question: ${upQ.status}`);

        console.log(">>> [2/3] Ghi History...");
        await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/history/updates', {
            method: 'POST', headers, body: JSON.stringify({
                histories: [{
                    id: -1, lastUpdate: -1, createDate: -1, table: 'question',
                    oldData: oldQuestion, newData: newQuestion,
                    userId: parseInt(userId), objectId: qid, type: action === 'OK' ? 0 : 2
                }]
            })
        });

        console.log(">>> [3/3] Chuyển trạng thái Report...");
        const updatedReport = { 
            ...targetReport, reportStatus: 1, modifierId: userId.toString(), 
            modifierDate: Date.now(), lastUpdate: Date.now(), contentType: parseInt(classId) 
        };
        const upR = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/update-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ reportQuestions: [updatedReport], shouldUpdateLastUpdate: true })
        });

        console.log(`✅ HOÀN TẤT: ${qid}`);
        process.exit(0);

    } catch (err) {
        console.error(`❌ THẤT BẠI: ${err.message}`);
        process.exit(1);
    }
}

execute();
