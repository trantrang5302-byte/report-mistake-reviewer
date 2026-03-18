const fs = require('fs');
const { execSync } = require('child_process');

const qId = process.argv[2];
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const APP_MAP = {
    "5634601401712640": "CompTIA A+", "5074526257807360": "ASVAB / Permit", "4756777530818560": "CNA", 
    "5667261339664384": "CompTIA Security+", "6067367071186944": "CCNA", "6489528760008704": "TABE",
    "5309771708104704": "CFA Level 1", "5348476208545792": "NCLEX-RN"
};

async function autoReview() {
    if (!qId) return;
    console.log(`\n🔍 Đang tự động thẩm định Question ID: ${qId}...`);

    try {
        // 1. Lấy dữ liệu từ CMS
        const headers = { 'Content-Type': 'application/json' };
        
        const resRep = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ page: 0, status: 0, limit: 100 })
        });
        const reports = await resRep.json();
        const report = reports.find(r => r.questionId == qId);
        if (!report) throw new Error("Không tìm thấy report.");

        const resQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers, body: JSON.stringify({ questionIds: [parseInt(qId)], loadAll: true })
        });
        const qData = (await resQ.json())[0];

        // 2. Chuẩn bị Prompt cho AI dựa trên Guideline
        const guidelinePath = fs.existsSync('docs/REVIEW_GUIDELINE.md') ? 'docs/REVIEW_GUIDELINE.md' : (fs.existsSync('../docs/REVIEW_GUIDELINE.md') ? '../docs/REVIEW_GUIDELINE.md' : '');
        if (!guidelinePath) throw new Error("Không tìm thấy REVIEW_GUIDELINE.md");
        const guideline = fs.readFileSync(guidelinePath, 'utf8');
        const prompt = `Bạn là Chuyên gia thẩm định nội dung. Hãy thẩm định báo cáo sau dựa trên QUY ĐỊNH đính kèm.
        
        QUY ĐỊNH (MANDATORY):
        ${guideline}

        DỮ LIỆU CMS:
        - App: ${APP_MAP[qData.appId] || qData.appId}
        - Question: ${qData.text}
        - Answers: ${JSON.stringify(qData.answers)}
        - Explanation: ${qData.explanation}

        DỮ LIỆU REPORT:
        - Reasons: ${JSON.stringify(report.reasons)}
        - User Note: ${report.otherReason}

        YÊU CẦU: Trả về kết quả dưới dạng JSON có cấu trúc:
        {
            "analysis": "Phân tích logic chi tiết...",
            "conclusion": "Valid/Invalid/Unclear",
            "action": "OK/Cancel/Wait",
            "contentType": "0/1/2/3",
            "proposedFix": "Nội dung sửa đổi nếu Valid...",
            "verifySource": true/false,
            "sourceLink": "URL nếu có",
            "evidence": "Trích dẫn nếu có",
            "position": "Vị trí nếu có"
        }`;

        // 3. Gọi Gemini API (Dùng curl để đơn giản cho GitHub Action)
        const aiResponse = execSync(`curl https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY} \
            -H 'Content-Type: application/json' \
            -X POST \
            -d '{
              "contents": [{ "parts":[{"text": ${JSON.stringify(prompt)}}] }]
            }'`).toString();
        
        const aiResultRaw = JSON.parse(aiResponse).candidates[0].content.parts[0].text;
        const result = JSON.parse(aiResultRaw.match(/\{[\s\S]*\}/)[0]);

        console.log(">>> AI đã hoàn tất thẩm định.");

        // 4. Cập nhật TRƯỜNG NOTE vào CMS (Để lưu vết và hỗ trợ nút bấm OK)
        const noteToSave = `${result.analysis}\n\nĐỀ XUẤT: ${result.proposedFix || 'Giữ nguyên'}`;
        report.note = noteToSave;
        await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/update-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ reportQuestions: [report], shouldUpdateLastUpdate: true })
        });

        // 5. Đẩy báo cáo lên Discord
        execSync(`node scripts/push-detailed-report.js ${qId} "${result.analysis}" "${result.conclusion}" "${result.action}" "${result.contentType}" "${result.sourceLink || 'null'}" "${result.evidence || 'N/A'}" "${result.position || 'N/A'}" "${result.proposedFix || 'null'}"`, { stdio: 'inherit' });

    } catch (e) {
        console.error("❌ Lỗi thẩm định tự động:", e.message);
    }
}

autoReview();
