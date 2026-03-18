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
    if (!qId || !GEMINI_API_KEY) return;

    console.log(`\n🔍 Thẩm định Question ID: ${qId}...`);

    try {
        const headers = { 'Content-Type': 'application/json' };
        const resRep = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ page: 0, status: 0, limit: 100 })
        });
        const reports = await resRep.json();
        const report = reports.find(r => r.questionId == qId);
        if (!report) return;

        const resQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers, body: JSON.stringify({ questionIds: [parseInt(qId)], loadAll: true })
        });
        const qData = (await resQ.json())[0];

        const guidelinePath = fs.existsSync('docs/REVIEW_GUIDELINE.md') ? 'docs/REVIEW_GUIDELINE.md' : (fs.existsSync('../docs/REVIEW_GUIDELINE.md') ? '../docs/REVIEW_GUIDELINE.md' : '');
        const guideline = guidelinePath ? fs.readFileSync(guidelinePath, 'utf8') : "Hãy thẩm định báo cáo này.";
        
        const prompt = `Bạn là Chuyên gia thẩm định nội dung (Content Review Specialist).
        Nhiệm vụ: Phân tích báo cáo lỗi của người dùng dựa trên QUY ĐỊNH và DỮ LIỆU CMS.

        QUY ĐỊNH THẨM ĐỊNH:
        ${guideline}

        DỮ LIỆU CMS GỐC:
        - App: ${APP_MAP[qData.appId] || qData.appId}
        - Câu hỏi: ${qData.text}
        - Đáp án: ${JSON.stringify(qData.answers)}
        - Giải thích: ${qData.explanation}

        DỮ LIỆU REPORT:
        - Reasons (Lý do lỗi): ${JSON.stringify(report.reasons)}
        - Ghi chú từ người dùng: ${report.otherReason || "Không có"}

        YÊU CẦU QUAN TRỌNG:
        1. Phân tích bằng TIẾNG VIỆT rõ ràng, ngắn gọn. 
        2. TUYỆT ĐỐI KHÔNG đưa dữ liệu JSON gốc vào phần "analysis".
        3. Nếu CMS đúng, kết luận Invalid. Nếu CMS sai, kết luận Valid và đưa ra nội dung sửa đổi trong "proposedFix".
        4. Trả về DUY NHẤT một khối JSON theo cấu trúc sau:
        {
            "analysis": "Viết phân tích của bạn ở đây bằng tiếng Việt...",
            "conclusion": "Valid/Invalid/Unclear",
            "action": "OK/Cancel/Wait",
            "contentType": "0/1/2/3",
            "proposedFix": "Nội dung đề xuất sửa đổi nếu có, nếu không thì ghi null",
            "sourceLink": "URL nguồn nếu cần verify, nếu không thì ghi null",
            "evidence": "Trích dẫn nguyên văn từ nguồn nếu có",
            "position": "Số trang hoặc vị trí trong nguồn"
        }`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const aiData = await aiRes.json();
        if (!aiData.candidates || !aiData.candidates[0]) return;

        const aiText = aiData.candidates[0].content.parts[0].text;
        const result = JSON.parse(aiText.match(/\{[\s\S]*\}/)[0]);

        // Cập nhật CMS
        report.note = `${result.analysis}\n\nĐỀ XUẤT: ${result.proposedFix || 'Giữ nguyên'}`;
        await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/update-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ reportQuestions: [report], shouldUpdateLastUpdate: true })
        });

        // Đẩy lên Discord
        const pushCmd = `node scripts/push-detailed-report.js ${qId} ${JSON.stringify(result.analysis)} ${JSON.stringify(result.conclusion)} ${JSON.stringify(result.action)} ${JSON.stringify(result.contentType)} ${JSON.stringify(result.sourceLink || 'null')} ${JSON.stringify(result.evidence || 'N/A')} ${JSON.stringify(result.position || 'N/A')} ${JSON.stringify(result.proposedFix || 'null')}`;
        execSync(pushCmd, { stdio: 'inherit' });

    } catch (e) {
        console.error("❌ Lỗi tại ID " + qId + ": " + e.message);
    }
}

autoReview();
