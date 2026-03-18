const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { exec } = require('child_process');
const http = require('http');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Web Server để giữ Bot online trên Render/Railway
http.createServer((req, res) => {
    res.write("Bot is running...");
    res.end();
}).listen(process.env.PORT || 3000);

client.once(Events.ClientReady, c => console.log(`Bot đã online: ${c.user.tag}`));

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const [prefix, status, classId, id] = interaction.customId.split('_');
    if (prefix !== 'confirm') return;

    const userHandle = interaction.user.username;
    
    // 1. UI Feedback
    const originalEmbed = interaction.message.embeds[0];
    const processingEmbed = EmbedBuilder.from(originalEmbed)
        .setTitle(`⏳ ĐANG XỬ LÝ - ID: ${id}`)
        .setColor(0xFFA500);

    const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('p1').setLabel('Đang xử lý...').setStyle(ButtonStyle.Secondary).setDisabled(true),
    );

    await interaction.update({ embeds: [processingEmbed], components: [disabledRow] });

    // 2. Thực thi lệnh cập nhật CMS
    exec(`node execute-action.js ${id} ${status.toUpperCase()} ${classId}`, async (error, stdout, stderr) => {
        if (error) {
            const shortError = (stderr || error.message).substring(0, 500);
            const errorEmbed = EmbedBuilder.from(originalEmbed)
                .setTitle(`❌ LỖI XỬ LÝ - ID: ${id}`)
                .setColor(0xFF0000)
                .setDescription(`Lỗi: ${shortError}`);
            
            return interaction.message.edit({ embeds: [errorEmbed], components: [] });
        }

        // 3. UI Thành công
        const successEmbed = EmbedBuilder.from(originalEmbed)
            .setTitle(`✅ ĐÃ XỬ LÝ - ID: ${id}`)
            .setDescription(`${originalEmbed.description || ''}\n\n**Trạng thái xử lý**\nĐã thực hiện lệnh **${status.toUpperCase()}** bởi **@${userHandle}**`)
            .setColor(0x2B2D31);

        const finalRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('done').setLabel('ĐÃ XONG').setStyle(ButtonStyle.Secondary).setDisabled(true),
        );

        await interaction.message.edit({ embeds: [successEmbed], components: [finalRow] });
    });
});

client.login(DISCORD_TOKEN);
