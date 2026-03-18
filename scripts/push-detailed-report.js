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

function truncate(str, max = 1000) { if (!str) return "N/A"; return str.length > max ? str.substring(0, max) + "..." : str; }

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 5) { console.error("Usage error..."); process.exit(1); }
    const [qId, analysis, conclusion, action, contentType, sourceLink, evidence, position, proposedFix] = args;

    try {
        await client.login(DISCORD_TOKEN);
        const channel = await client.channels.fetch(CHANNEL_ID);
        
        const resQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionIds: [parseInt(qId)], loadAll: true })
        });
        const qData = (await resQ.json())[0];
        
        let report = null;
        if (fs.existsSync('all_reports.json')) {
            const reports = JSON.parse(fs.readFileSync('all_reports.json'));
            report = reports.find(r => r.questionId == qId);
        }

        const appName = APP_MAP[qData.appId] || `App ID: ${qData.appId}`;
        const isKnowledgeIssue = report ? report.reasons.some(r => [0, 1, 2].includes(r)) : true;

        let description = `**1. Trích xuất nội dung gốc từ CMS:**
* Tên app: ${appName}
* Câu hỏi: "${truncate(qData.text, 500)}"
* Các đáp án:
${qData.answers.map(a => ((a.correct === true || a.isCorrect === true) ? "- [✅] " : "- [❌] ") + truncate(a.text, 200)).join('\n')}
* Giải thích: "${truncate(qData.explanation, 500)}"

**2. Phân tích Report:**
* Reasons (enum): ${report ? report.reasons.map(id => `${id} (${ERROR_MAP[id]})`).join(', ') : 'N/A'}
* Report Type: ${isKnowledgeIssue ? "Knowledge Issue" : "Non-Knowledge Issue"}

**3. Phân tích tính đúng sai của report**
* Phân tích: ${analysis}
* So sánh: ${action.toUpperCase() === 'OK' ? "Sai lệch với kiến thức chuẩn/CMS" : "Hoàn toàn khớp với CMS"}

${(sourceLink && sourceLink !== "null" && sourceLink !== "undefined") ? `**4. Nguồn kiểm chứng (VERIFY SOURCE)**
- Link nguồn tham khảo: ${sourceLink}
- Bằng chứng: "${truncate(evidence || 'N/A', 500)}"
- Vị trí trong tài liệu: ${position || 'N/A'}` : ""}

**5. Kết luận:**
${conclusion === 'Invalid' ? 'CMS Đúng -> Report của người dùng là Sai (Invalid).' : (conclusion === 'Valid' ? 'CMS Sai -> Report của người dùng là Đúng (Valid).' : 'Unclear -> Cần con người xử lý (Unclear).')}

${(proposedFix && proposedFix !== "null" && proposedFix !== "undefined") ? `**7. Bản chỉnh sửa đề xuất (CHỈ khi Valid):**
${proposedFix}` : ""}

**6. Đề xuất xử lý:**
* Hành động: ${action.toUpperCase()}
* Phân loại contentType: ${contentType}`;

        const embed = new EmbedBuilder()
            .setTitle(`Thẩm định Report Mistake của: ${qId} - (${appName})`)
            .setColor(action.toUpperCase() === 'OK' ? 0x00FF00 : (action.toUpperCase() === 'CANCEL' ? 0xFF0000 : 0xFFFF00))
            .setDescription(description);

        if (report && report.screenshot && report.screenshot !== "N/A") embed.setImage(report.screenshot);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`confirm_ok_${contentType}_${qId}`).setLabel('OK - Chấp nhận & Sửa').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`confirm_cancel_-1_${qId}`).setLabel('Cancel - Giữ nguyên').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`confirm_wait_-1_${qId}`).setLabel('Wait - Tự kiểm tra lại').setStyle(ButtonStyle.Secondary)
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`>>> Success: Pushed ID ${qId} to Discord.`);
        setTimeout(() => process.exit(0), 1000);
    } catch (err) { console.error(">>> Error:", err.message); process.exit(1); }
}
run();
