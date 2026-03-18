const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = '1481518050007318530';
const SESSION_ID = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50IjoidHJhbmd0cmFuIiwiaWF0IjoxNzczMzcxMzk5LCJleHAiOjE3NzM4MDMzOTl9.559gvckcSxCpFORri0aGEHX-O6evGTgcHQozikyC_ek';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function pushReport() {
    try {
        await client.login(DISCORD_TOKEN);
        const channel = await client.channels.fetch(CHANNEL_ID);
        const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SESSION_ID}` };
        const targetId = '6408328423931904';

        // 1. Snapshot
        const resGet = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-by-ids', {
            method: 'POST', headers: h, body: JSON.stringify({ questionIds: [parseInt(targetId)], loadAll: true })
        });
        const qData = (await resGet.json())[0];

        // 2. Report
        const resRepList = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
            method: 'POST', headers: h, body: JSON.stringify({ page: 0, status: 0, limit: 100 })
        });
        const reports = await resRepList.json();
        const report = reports.find(r => r.questionId == targetId);

        const embed = new EmbedBuilder()
            .setTitle('📑 BÁO CÁO THẨM ĐỊNH CHI TIẾT - ID: ' + targetId)
            .setColor(0x0099FF)
            .addFields(
                { name: '📊 1. TRÍCH XUẤT NỘI DUNG GỐC', value: `**Câu hỏi:** ${qData.text.substring(0, 300)}\n**Đáp án:**\n${qData.answers.map(a=>(a.correct?'✅ ':'❌ ')+a.text).join('\n')}\n**Giải thích:** ${qData.explanation.substring(0, 200)}` },
                { name: '🔍 2. PHÂN TÍCH REPORT', value: `**Lý do:** Incorrect Answer (ID: 0)\n**Ghi chú:** N/A\n**Nhận định:** Khách hàng nghi ngờ cổng 1433 cho MSSQL là sai, nhưng đây là kiến thức căn bản.` },
                { name: '🧠 3. PHÂN TÍCH CHUYÊN MÔN & NGUỒN OFFICIAL', value: `**Phân tích:** Cổng mặc định cho Microsoft SQL Server là TCP 1433. Đây là kiến thức chuẩn trong giáo trình CompTIA Security+.\n**Nguồn:** [Microsoft Official](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-a-windows-firewall-for-database-engine-access)` },
                { name: '💡 4. ĐỀ XUẤT XỬ LÝ', value: '**Kết luận:** Report SAI.\n**Hành động:** Cancel (Giữ nguyên).\n**Phân loại:** (Bỏ trống).' }
            )
            .setTimestamp();

        if (report && report.screenshot) embed.setImage(report.screenshot);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ok_' + targetId).setLabel('OK (Fix)').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_' + targetId).setLabel('Cancel').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('wait_' + targetId).setLabel('Wait').setStyle(ButtonStyle.Secondary)
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log('>>> Done push report for ' + targetId);
        process.exit(0);
    } catch (e) {
        console.error('Lỗi:', e.message);
        process.exit(1);
    }
}
pushReport();
