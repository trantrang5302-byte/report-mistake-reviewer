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
    if (!str) return "N/A";
    return str.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n').trim();
}

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 10) { process.exit(1); }
    const [qId, analysis, conclusion, action, contentType, sourceLink, evidence, position, proposedFix, screenshot] = args;

    try {
        await client.login(DISCORD_TOKEN);
        const channel = await client.channels.fetch(CHANNEL_ID);
        const resQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionIds: [parseInt(qId)], loadAll: true })
        });
        const qData = (await resQ.json())[0];
        let report = null;
        if (fs.existsSync('all_reports.json')) report = JSON.parse(fs.readFileSync('all_reports.json')).find(r => r.questionId == qId);

        const appName = APP_MAP[qData.appId] || `App ID: ${qData.appId}`;
        const isKnowledgeIssue = report ? report.reasons.some(r => [0, 1, 2].includes(r)) : true;

        const hasSource = sourceLink && sourceLink !== "null" && sourceLink !== "undefined";
        const sourceSection = hasSource ? `
4. Nguồn kiểm chứng (CHỈ khi VERIFY SOURCE)
- Link nguồn tham khảo: [${sourceLink}]
- Bằng chứng: [${cleanText(evidence)}]
- Vị trí trong tài liệu [${position || 'N/A'}]` : "";

        const isValid = conclusion.toLowerCase().includes('valid');
        const fixSection = (isValid && proposedFix && proposedFix !== "null") ? `
   * Bản chỉnh sửa (chỉ có và hiện khi valid):
     ${cleanText(proposedFix)}` : "";

        const description = `
  1. Trích xuất nội dung gốc từ CMS:
   * Tên app: ${appName}
   * Câu hỏi: "${cleanText(qData.text)}"
   * Các đáp án:
${qData.answers.map(a => ((a.correct || a.isCorrect) ? "- [✅] " : "- [❌] ") + cleanText(a.text)).join('\n')}
   * Giải thích: "${cleanText(qData.explanation)}"


  2. Phân tích Report:
   * Reasons (enum): ${report ? report.reasons.map(id => `${id} (${ERROR_MAP[id]})`).join(', ') : 'N/A'}
   * Report Type: ${isKnowledgeIssue ? "Knowledge Issue" : "Non-Knowledge Issue"}


  3. Phân tích tính đúng sai của report
  * Phân tích: ${cleanText(analysis)}
  * So sánh: với CMS 
${sourceSection}


  5. Kết luận:
${conclusion === 'Invalid' ? 'CMS Đúng -> Report của người dùng là Sai (Invalid).' : (conclusion === 'Valid' ? 'CMS Sai -> Report của người dùng là Đúng (Valid).' : 'Unclear -> cần con người xử lý (Unclear).')}


  6. Đề xuất xử lý:
   * Hành động: ${action.toUpperCase()}${fixSection}
   * Phân loại contentType: ${contentType}


7. Screenshot report
Ảnh screenshot của report mistake:`;

        const embed = new EmbedBuilder()
            .setTitle(`Thẩm định Report Mistake của: ${qId} - (${appName})`)
            .setColor(action.toUpperCase() === 'OK' ? 0x00FF00 : (action.toUpperCase() === 'CANCEL' ? 0xFF0000 : 0xFFFF00))
            .setDescription(description);

        if (screenshot && screenshot !== "null" && screenshot !== "N/A") embed.setImage(screenshot);

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
