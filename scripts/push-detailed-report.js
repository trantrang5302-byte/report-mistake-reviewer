const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = '1481518050007318530';

const APP_MAP = {
    "5634601401712640": "CompTIA A+", "5074526257807360": "ASVAB / Permit", "4756777530818560": "CNA", 
    "5667261339664384": "CompTIA Security+", "6067367071186944": "CCNA", "6489528760008704": "TABE",
    "5309771708104704": "CFA Level 1", "5348476208545792": "NCLEX-RN"
};

const ERROR_MAP = { 0: 'Incorrect Answer', 1: 'Wrong Explanation', 2: 'Wrong Category', 3: 'Grammatical Error', 4: 'Missing Content', 5: 'Typo', 6: 'Bad Image Quality', 7: 'Other' };
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function cleanText(str) {
    if (!str || str === "null" || str === "N/A") return "";
    return str.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n').trim();
}

async function run() {
    const jsonPath = process.argv[2];
    if (!jsonPath || !fs.existsSync(jsonPath)) {
        console.error("Usage: node push-detailed-report.js <path_to_json>");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const qId = data.qId;

    try {
        await client.login(DISCORD_TOKEN);
        const channel = await client.channels.fetch(CHANNEL_ID);
        
        const resQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionIds: [parseInt(qId)], loadAll: true })
        });
        const qData = (await resQ.json())[0];
        if (!qData) {
            console.error(`>>> Error: Question ID ${qId} not found in CMS.`);
            process.exit(1);
        }
        
        let report = null;
        if (fs.existsSync('all_reports.json')) report = JSON.parse(fs.readFileSync('all_reports.json')).find(r => r.questionId == qId);

        const appName = APP_MAP[qData.appId] || `App ID: ${qData.appId}`;
        const isKnowledgeIssue = report ? report.reasons.some(r => [0, 1, 2].includes(r)) : true;
        const isValid = data.conclusion.toLowerCase().includes('valid');

        // Logic ẩn: IF Knowledge Issue AND cần verify -> hiển thị mục 4
        // (User Rule: Nếu không VERIFY SOURCE -> bỏ hoàn toàn mục 4 và Confidence)
        const showSource = data.verifySource && data.sourceLink && data.sourceLink !== "null";

        let section4 = "";
        if (showSource) {
            section4 = `
4. Nguồn kiểm chứng:
- Link nguồn: ${data.sourceLink}
- Bằng chứng: ${cleanText(data.evidence)}
- Vị trí: ${data.position || 'N/A'}`;
        }

        // Section 5 Kết luận
        let section5 = `
5. Kết luận:
- Kết luận: ${data.conclusion}`;
        if (showSource) {
            section5 += `\n- Confidence: [${data.confidence || 0}]%`;
        }

        // Logic ẩn: IF Valid -> hiển thị "Bản chỉnh sửa"
        let fixContent = "";
        if (isValid && data.proposedFix && typeof data.proposedFix === 'object') {
            fixContent = `
- Bản chỉnh sửa:
  - Câu hỏi: ${cleanText(data.proposedFix.question)}
  - Đáp án: ${Array.isArray(data.proposedFix.answers) ? data.proposedFix.answers.map(ans => cleanText(ans)).join(', ') : cleanText(data.proposedFix.answers)}
  - Giải thích: ${cleanText(data.proposedFix.explanation)}`;
        }

        const description = `
1. Trích xuất nội dung gốc từ CMS:
- Tên app: ${appName}
- Câu hỏi: "${cleanText(qData.text)}"
- Các đáp án:
${qData.answers.map(a => ((a.correct || a.isCorrect) ? "  - [✅] " : "  - [❌] ") + cleanText(a.text)).join('\n')}
- Giải thích: "${cleanText(qData.explanation)}"

2. Phân tích Report:
- Reasons (enum): [${report ? report.reasons.join(', ') : 'N/A'}]
- Report Type: ${isKnowledgeIssue ? "Knowledge Issue" : "Non-Knowledge Issue"}

3. Phân tích tính đúng sai của report:
- Phân tích: ${cleanText(data.analysis)}
- So sánh với CMS: ${isValid ? "SAI LỆCH" : "Hoàn toàn khớp"}${section4}${section5}

6. Đề xuất xử lý:
- Hành động: ${data.action.toUpperCase()}${fixContent}
- Phân loại contentType: ${data.contentType}

7. Screenshot report:
${data.screenshot || (report ? report.screenshot : 'N/A')}`;

        const embed = new EmbedBuilder()
            .setTitle(`📄 Thẩm định Report Mistake — ID: ${qId} (${appName})`)
            .setColor(data.action.toUpperCase() === 'OK' ? 0x00FF00 : (data.action.toUpperCase() === 'CANCEL' ? 0xFF0000 : 0xFFFF00))
            .setDescription(description);

        const screenshot = data.screenshot || (report ? report.screenshot : null);
        if (screenshot && screenshot !== "null" && screenshot !== "N/A") embed.setImage(screenshot);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`confirm_ok_${data.contentType}_${qId}`).setLabel('OK - Chấp nhận & Sửa').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`confirm_cancel_-1_${qId}`).setLabel('Cancel - Giữ nguyên').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`confirm_wait_-1_${qId}`).setLabel('Wait - Tự kiểm tra lại').setStyle(ButtonStyle.Secondary)
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`>>> Success: Pushed ID ${qId} to Discord.`);
        setTimeout(() => process.exit(0), 1000);
    } catch (err) { console.error(">>> Error:", err.message); process.exit(1); }
}
run();
