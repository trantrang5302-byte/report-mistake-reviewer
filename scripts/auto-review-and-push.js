const fs = require('fs');
const { spawnSync } = require('child_process');

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
        const guideline = guidelinePath ? fs.readFileSync(guidelinePath, 'utf8') : "Review this report.";
        
        const prompt = `Bạn là Chuyên gia thẩm định nội dung. Hãy thẩm định báo cáo sau dựa trên QUY ĐỊNH.\n\nQUY ĐỊNH:\n${guideline}\n\nDỮ LIỆU CMS:\n- App: ${APP_MAP[qData.appId] || qData.appId}\n- Question: ${qData.text}\n- Answers: ${JSON.stringify(qData.answers)}\n- Explanation: ${qData.explanation}\n\nDỮ LIỆU REPORT:\n- Reasons: ${JSON.stringify(report.reasons)}\n- User Note: ${report.otherReason}\n\nYÊU CẦU: Trả về JSON {analysis, conclusion, action, contentType, proposedFix, sourceLink, evidence, position}`;

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

        // Cập nhật CMS Note
        report.note = `${result.analysis}\n\nĐỀ XUẤT: ${result.proposedFix || 'Giữ nguyên'}`;
        await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/update-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ reportQuestions: [report], shouldUpdateLastUpdate: true })
        });

        // Đẩy lên Discord dùng spawnSync (An toàn tuyệt đối với ký tự đặc biệt)
        const args = [
            'scripts/push-detailed-report.js',
            qId.toString(),
            result.analysis,
            result.conclusion,
            result.action,
            result.contentType.toString(),
            result.sourceLink || 'null',
            result.evidence || 'N/A',
            result.position || 'N/A',
            result.proposedFix || 'null',
            report.screenshot || 'null'
        ];

        spawnSync('node', args, { stdio: 'inherit' });

    } catch (e) {
        console.error("❌ Lỗi xử lý AI hoặc Push:", e.message);
    }
}

autoReview();
