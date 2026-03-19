const fs = require('fs');
const { spawnSync } = require('child_process');

const qId = process.argv[2];
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const APP_MAP = {
    "4558937445629952": "NCE", "4629853261266944": "Phlebotomy", "4638437827149824": "ASE T-Series", "4647892048412672": "Permit test app",
    "4689991686946816": "CPCE", "4702244196843520": "Servsafe", "4731191135567872": "HSPT", "4756777530818560": "CNA",
    "4768893323182080": "Journeyman Electrician", "4791574240165888": "Real Estate", "4795941550817280": "CEN", "4803155283935232": "AP Human Geography",
    "4841079174070272": "PERT", "4865360100589568": "App Test 2", "4888964410376192": "SIE", "4893670444630016": "Driving Theory",
    "4903047163543552": "GED", "4939098850590720": "EPA 608", "4942297368100864": "ASE A-Series", "4977354434674688": "HESI",
    "4977354434674688": "HESI", "4987271203782656": "VTNE", "4989149748658176": "CDA", "5007337827860480": "NASM-CPT",
    "5028296731394048": "CPA", "5074526257807360": "ASVAB", "5087046683066368": "Permit", "5111275205951488": "AP Psychology",
    "5111712646692864": "Cosmetology", "5138959021637632": "Paramedic", "5178126573240320": "CEH", "5211425656012800": "PART 107",
    "5218573983154176": "PCCN", "5218573983154176": "NAPLEX", "5239948022120448": "FSOT", "5264190939856896": "Java SE 17 Developer",
    "5283912381104128": "CFA level 1", "5309771708104704": "TASC", "5348476208545792": "NCLEX-RN", "5351698977521664": "CAST",
    "5381480482078720": "TEAS", "5387829492318208": "HiSET", "5393415927758848": "CCAT", "5402212020781056": "CompTIA Project+",
    "5424102907052032": "PMP", "5452195373776896": "DMV", "5480069443092480": "PL-300", "5486339290038272": "CST",
    "5595632291020800": "Accuplacer", "5613004561317888": "CompTIA A+", "5634601401712640": "CHSPE", "5639601012080640": "CompTIA Linux+",
    "5641932374016000": "AWS Cloud Practitioner (CLF-C02)", "5644720948641792": "CompTIA Security+", "5667261339664384": "ABC Elearning",
    "5667896256626688": "AWS Solutions Architect (SAA-C03)", "5685292619005952": "AP US History", "5690798230208512": "CBEST",
    "5693883451179008": "CompTIA Network+", "5700433016258560": "CFA Level 2", "5713703047528448": "AWS Certified Developer – Associate (DVA-C02)",
    "5716561121771520": "SSCP", "5720018327175168": "EMT-B", "5724966171443200": "CompTIA CySA+", "5730972012118016": "Journeyman Plumber",
    "5749041115693056": "CCMA", "5754332943220736": "PHR", "5771028647116800": "NATE", "5785609700376576": "Wastewater Treatment Operator",
    "5833237792292864": "FSC", "5916395212636160": "CISA", "5942292615528448": "Azure Fundamentals (AZ - 900)", "5978235292614656": "App Test 1",
    "6015415708811264": "Motorcycle", "6034375808385024": "NCLEX-PN", "6043019396513792": "Parapro", "6046397161799680": "MBLEx",
    "6067367071186944": "CCNA", "6086034609668096": "Ham Radio", "6121370849116160": "PTCE", "6131286854860800": "CDL",
    "6149292834160640": "CCSP", "6201769172402176": "HVAC", "6234935824220160": "NMLS SAFE MLO", "6239490569928704": "Ontario G1",
    "6250356568752128": "CAPM", "6261959649394688": "UploadImage", "6305942496870400": "Praxis Core", "6329382482214912": "GRE",
    "6372873824370688": "DKT", "6381943587340288": "Series 7", "6437974254288896": "TABE", "6489528760008704": "AWS SysOps Administrator (SOA-C02)",
    "6498095718203392": "App Test", "6511838405591040": "Canadian Citizenship", "6528111927623680": "CISSP", "6528498516623360": "Australian Citizenship",
    "6556938380771328": "AP World History", "6565809996431360": "Wonderlic", "6602970363854848": "CompTIA Tech+", "6708644880056320": "TSI"
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
        if (!qData) {
            console.error(`❌ Không tìm thấy dữ liệu cho Question ID: ${qId}`);
            return;
        }

        const guidelinePath = fs.existsSync('docs/REVIEW_GUIDELINE.md') ? 'docs/REVIEW_GUIDELINE.md' : (fs.existsSync('../docs/REVIEW_GUIDELINE.md') ? '../docs/REVIEW_GUIDELINE.md' : '');
        const guideline = guidelinePath ? fs.readFileSync(guidelinePath, 'utf8') : "Review report.";
        
        const prompt = `Bạn là Chuyên gia thẩm định nội dung. Nhiệm vụ của bạn là thẩm định báo cáo lỗi dựa trên QUY ĐỊNH và TÀI LIỆU được cung cấp.

        TUYỆT ĐỐI CHỈ sử dụng thông tin từ tài liệu hệ thống. Nếu là Knowledge Issue, phải chỉ rõ trích dẫn.

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

        YÊU CẦU: 
        1. "comparison": Phải trả về "CMS Đúng" hoặc "CMS Sai".
        2. "conclusion": "Valid" (Report đúng -> CMS Sai), "Invalid" (Report sai -> CMS Đúng), hoặc "Unclear".

        Trả về JSON có cấu trúc chính xác:
        {
            "qId": "${qId}",
            "analysis": "Phân tích logic ngắn gọn bằng tiếng Việt...",
            "comparison": "CMS Đúng/CMS Sai",
            "verifySource": true/false,
            "sourceLink": "URL",
            "evidence": "Trích dẫn nguyên văn (Quote)",
            "reasoning": "Suy luận logic",
            "sourceVerdict": "Kết luận nguồn",
            "position": "Vị trí trong tài liệu",
            "confidence": 0-100,
            "conclusion": "Valid/Invalid/Unclear",
            "action": "OK/Cancel/Wait",
            "contentType": "0/1/2/3",
            "proposedFix": {
                "question": "Nội dung câu hỏi mới...",
                "answers": ["Đáp án 1", "Đáp án 2..."],
                "explanation": "Giải thích mới..."
            },
            "screenshot": "${report.screenshot || 'null'}"
        }`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const aiData = await aiRes.json();
        const aiText = aiData.candidates[0].content.parts[0].text;
        const result = JSON.parse(aiText.match(/\{[\s\S]*\}/)[0]);

        // Cập nhật CMS Note
        report.note = `${result.analysis}\n\nĐỀ XUẤT: ${result.proposedFix || 'Giữ nguyên'}`;
        await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/update-questions-report', {
            method: 'POST', headers, body: JSON.stringify({ reportQuestions: [report], shouldUpdateLastUpdate: true })
        });

        // Lưu JSON tạm và Đẩy lên Discord
        const tempJson = `temp_${qId}.json`;
        fs.writeFileSync(tempJson, JSON.stringify(result, null, 2));
        spawnSync('node', ['scripts/push-detailed-report.js', tempJson], { stdio: 'inherit' });
        fs.unlinkSync(tempJson);

    } catch (e) {
        console.error("❌ Lỗi:", e.message);
    }
}

autoReview();
