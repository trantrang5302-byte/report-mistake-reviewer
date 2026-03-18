const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = '1481518050007318530';

const APP_MAP = {
    "4558937445629952": "NCE", "4629853261266944": "Phlebotomy", "4638437827149824": "ASE T-Series", 
    "4647892048412672": "Permit test app", "4689991686946816": "CPCE", "4702244196843520": "Servsafe", 
    "4731191135567872": "HSPT", "4756777530818560": "CNA", "4768893323182080": "Journeyman Electrician", 
    "4791574240165888": "Real Estate", "4795941550817280": "CEN", "4795941550817280": "AP Human Geography", 
    "4803155283935232": "PERT", "4841079174070272": "App Test 2", "4865360100589568": "SIE", 
    "4888964410376192": "Driving Theory", "4893670444630016": "GED", "4903047163543552": "EPA 608", 
    "4939098850590720": "ASE A-Series", "4942297368100864": "HESI", "4977354434674688": "VTNE", 
    "4987271203782656": "CDA", "4989149748658176": "NASM-CPT", "5007337827860480": "CPA", 
    "5028296731394048": "ASVAB", "5074526257807360": "ASVAB / Permit", "5087046683066368": "AP Psychology", 
    "5111275205951488": "Cosmetology", "5111712646692864": "Paramedic", "5138959021637632": "CEH", 
    "5178126573240320": "PART 107", "5211425656012800": "PCCN", "5218573983154176": "NAPLEX", 
    "5239948022120448": "FSOT", "5264190939856896": "Java SE 17 Developer", "5309771708104704": "CFA Level 1", 
    "5348476208545792": "NCLEX-RN", "5351698977521664": "CAST", 
    "5381480482078720": "TEAS", "5387829492318208": "HiSET", "5393415927758848": "CCAT", 
    "5394939941191680": "FAA General", "5402212020781056": "CompTIA Project+", "5424102907052032": "PMP", 
    "5452195373776896": "DMV", "5480069443092480": "PL-300", "5486339290038272": "CST", 
    "5595632291020800": "Accuplacer", "5613004561317888": "CompTIA A+", "5634601401712640": "CHSPE", 
    "5639601012080640": "CompTIA Linux+", "5641932374016000": "AWS Cloud Practitioner (CLF-C02)", 
    "5644720948641792": "CompTIA Security+", "5667261339664384": "ABC Elearning", 
    "5667896256626688": "AWS Solutions Architect (SAA-C03)", "5685292619005952": "AP US History", 
    "5690798230208512": "CBEST", "5693883451179008": "CompTIA Network+", "5700433016258560": "CFA Level 2", 
    "5713703047528448": "AWS Certified Developer – Associate (DVA-C02)", "5716561121771520": "SSCP", 
    "5720018327175168": "EMT-B", "5724966171443200": "CompTIA CySA+", "5730972012118016": "Journeyman Plumber", 
    "5749041115693056": "CCMA", "5754332943220736": "PHR", "5771028647116800": "NATE", 
    "5785609700376576": "Wastewater Treatment Operator", "5833237792292864": "FSC", 
    "5916395212636160": "CISA", "5942292615528448": "Azure Fundamentals (AZ - 900)", 
    "5978235292614656": "App Test 1", "6015415708811264": "Motorcycle", "6034375808385024": "NCLEX-PN", 
    "6043019396513792": "Parapro", "6046397161799680": "MBLEx", "6067367071186944": "CCNA", 
    "6086034609668096": "Ham Radio", "6121370849116160": "PTCE", "6131286854860800": "CDL", 
    "6149292834160640": "CCSP", "6201769172402176": "HVAC", "6234935824220160": "NMLS SAFE MLO", 
    "6239490569928704": "Ontario G1", "6250356568752128": "CAPM", "6261959649394688": "UploadImage", 
    "6305942496870400": "Praxis Core", "6329382482214912": "GRE", "6372873824370688": "DKT", 
    "6381943587340288": "Series 7", "6437974254288896": "TABE", "6489528760008704": "AWS SysOps Administrator (SOA-C02)", 
    "6498095718203392": "App Test", "6511838405591040": "Canadian Citizenship", 
    "6528111927623680": "CISSP", "6528498516623360": "Australian Citizenship", 
    "6556938380771328": "AP World History", "6565809996431360": "Wonderlic", 
    "6602970363854848": "CompTIA Tech+", "6708644880056320": "TSI", "6741934567587840": "Real Estate"
};

const ERROR_MAP = { 0: 'Incorrect Answer', 1: 'Wrong Explanation', 2: 'Wrong Category', 3: 'Grammatical Error', 4: 'Missing Content', 5: 'Typo', 6: 'Bad Image Quality', 7: 'Other' };
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function truncate(str, max = 1000) { if (!str) return "N/A"; return str.length > max ? str.substring(0, max) + "..." : str; }

async function run() {
    // node push-detailed-report.js <id> <analysis> <conclusion> <action> <contentType> [sourceLink] [evidence] [position] [proposedFix]
    const args = process.argv.slice(2);
    if (args.length < 5) { console.error("Usage: node push-detailed-report.js <id> <analysis> <conclusion> <action> <contentType> [sourceLink] [evidence] [position] [proposedFix]"); process.exit(1); }
    const [qId, analysis, conclusion, action, contentType, sourceLink, evidence, position, proposedFix] = args;

    try {
        await client.login(DISCORD_TOKEN);
        const channel = await client.channels.fetch(CHANNEL_ID);
        let token = "";
        const authPath = fs.existsSync('auth_debug.json') ? 'auth_debug.json' : (fs.existsSync('../auth_debug.json') ? '../auth_debug.json' : '');
        if (authPath) { try { const auth = JSON.parse(fs.readFileSync(authPath)); token = auth.token || ""; } catch (e) {} }
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resQ = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers, body: JSON.stringify({ questionIds: [parseInt(qId)], loadAll: true })
        });
        const qData = (await resQ.json())[0];
        if (!qData) throw new Error(`Không tìm thấy câu hỏi ID ${qId} trên CMS.`);

        let report = null;
        if (fs.existsSync('all_reports.json')) {
            const reports = JSON.parse(fs.readFileSync('all_reports.json'));
            report = reports.find(r => r.questionId == qId);
        }

        const appName = APP_MAP[qData.appId] || `App ID: ${qData.appId}`;
        const isKnowledgeIssue = report ? report.reasons.some(r => [0, 1, 2].includes(r)) : true;

        const embed = new EmbedBuilder()
            .setTitle(`Thẩm định Report Mistake của: ${qId} - (${appName})`)
            .setColor(action.toUpperCase() === 'OK' ? 0x00FF00 : (action.toUpperCase() === 'CANCEL' ? 0xFF0000 : 0xFFFF00))
            .setDescription(`**1. Trích xuất nội dung gốc từ CMS:**
* Tên app: ${appName}
* Câu hỏi: "${truncate(qData.text, 500)}"
* Các đáp án:
${qData.answers.map(a => ((a.correct === true || a.isCorrect === true) ? "- [✅] " : "- [❌] ") + truncate(a.text, 200)).join('\n')}
* Giải thích: "${truncate(qData.explanation, 500)}"

**2. Phân tích Report:**
* Reasons (enum): ${report ? report.reasons.map(id => `${id} (${ERROR_MAP[id]})`).join(', ') : 'N/A'}
* Report Type: ${isKnowledgeIssue ? "Knowledge Issue" : "Non-Knowledge Issue"}

**3. Phân tích tính đúng sai của report**
* Phân tích: ${truncate(analysis, 1000)}
* So sánh với CMS: ${action.toUpperCase() === 'OK' ? "Sai lệch với kiến thức chuẩn/CMS" : "Hoàn toàn khớp với CMS"}

${(sourceLink && sourceLink !== "null" && sourceLink !== "undefined") ? `**4. Nguồn kiểm chứng (VERIFY SOURCE)**
- Link nguồn tham khảo: ${sourceLink}
- Bằng chứng: "${truncate(evidence || 'N/A', 500)}"
- Vị trí trong tài liệu: ${position || 'N/A'}` : ""}

**5. Kết luận:**
${conclusion === 'Invalid' ? 'CMS Đúng -> Report của người dùng là Sai (Invalid).' : (conclusion === 'Valid' ? 'CMS Sai -> Report của người dùng là Đúng (Valid).' : 'Unclear -> Cần con người xử lý (Unclear).')}

${(proposedFix && proposedFix !== "null" && proposedFix !== "undefined") ? `**7. Bản chỉnh sửa đề xuất:**
${truncate(proposedFix, 1500)}` : ""}

**6. Đề xuất xử lý:**
* Hành động: ${action.toUpperCase()}
* Phân loại contentType: ${contentType}`);

        if (report && report.screenshot && report.screenshot !== "N/A") embed.setImage(report.screenshot);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`confirm_ok_${contentType}_${qId}`).setLabel('OK - Chấp nhận & Sửa').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`confirm_cancel_-1_${qId}`).setLabel('Cancel - Giữ nguyên').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`confirm_wait_-1_${qId}`).setLabel('Wait - Tự kiểm tra lại').setStyle(ButtonStyle.Secondary)
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`>>> Success: Pushed ID ${qId} (${appName}) to Discord.`);
        setTimeout(() => process.exit(0), 1000);
    } catch (err) { console.error(">>> Error:", err.message); process.exit(1); }
}
run();
