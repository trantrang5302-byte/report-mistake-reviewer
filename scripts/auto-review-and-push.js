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
        const guideline = guidelinePath ? fs.readFileSync(guidelinePath, 'utf8') : "Review report.";
        
        const prompt = `Bạn là Chuyên gia thẩm định nội dung. Hãy thẩm định báo cáo sau dựa trên QUY ĐỊNH đính kèm.

        QUY ĐỊNH:
        ${guideline}

        DỮ LIỆU CMS GỐC:
        - App: ${APP_MAP[qData.appId] || qData.appId}
        - Question: ${qData.text}
        - Answers: ${JSON.stringify(qData.answers)}
        - Explanation: ${qData.explanation}

        DỮ LIỆU REPORT:
        - Reasons: ${JSON.stringify(report.reasons)}
        - User Note: ${report.otherReason}

        YÊU CẦU CỰC KỲ QUAN TRỌNG:
        1. Phân tích bằng TIẾNG VIỆT.
        2. Phần "analysis" CHỈ chứa lời giải thích logic. KHÔNG lặp lại tên App, KHÔNG lặp lại ID, KHÔNG lặp lại format báo cáo.
        3. Phần "proposedFix" phải là một chuỗi văn bản (string) mô tả chi tiết:
           - Câu hỏi: (nội dung mới)
           - Đáp án: (danh sách mới)
           - Giải thích: (nội dung mới)
        4. Trả về JSON chuẩn: {analysis, conclusion, action, contentType, proposedFix, sourceLink, evidence, position}`;

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

        // Xử lý proposedFix nếu nó là object
        let finalFix = result.proposedFix;
        if (typeof finalFix === 'object' && finalFix !== null) {
            finalFix = Object.entries(finalFix).map(([k, v]) => `- ${k}: ${v}`).join('\n');
        }

        // Cập nhật CMS
        report.note = `${result.analysis}\n\nĐỀ XUẤT: ${finalFix || 'Giữ nguyên'}`;
        await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/update-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ reportQuestions: [report], shouldUpdateLastUpdate: true })
        });

        // Đẩy lên Discord
        spawnSync('node', [
            'scripts/push-detailed-report.js',
            qId.toString(),
            result.analysis,
            result.conclusion,
            result.action,
            result.contentType.toString(),
            result.sourceLink || 'null',
            result.evidence || 'N/A',
            result.position || 'N/A',
            finalFix || 'null',
            report.screenshot || 'null'
        ], { stdio: 'inherit' });

    } catch (e) {
        console.error("❌ Lỗi:", e.message);
    }
}

autoReview();
