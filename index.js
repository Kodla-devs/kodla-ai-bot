require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');

const startTime = Date.now();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const PREFIX = process.env.BOT_PREFIX || '!';
const BOT_STATUS = process.env.BOT_STATUS || 'online';
const BOT_ACTIVITY = process.env.BOT_ACTIVITY || 'Listening to !ping';

client.once('ready', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`🔧 Prefix: ${PREFIX}`);
    console.log(`📊 Status: ${BOT_STATUS}`);
    console.log(`🎯 Activity: ${BOT_ACTIVITY}`);
    
    client.user.setPresence({
        activities: [{
            name: BOT_ACTIVITY,
            type: ActivityType.Watching
        }],
        status: BOT_STATUS
    });
});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'ping') {
        const sent = message.createdTimestamp;
        const received = Date.now();
        const ping = received - sent;
        const apiPing = Math.round(client.ws.ping);
        
        const pingEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📨 Message Latency', value: `\`${ping}ms\``, inline: true },
                { name: '🌐 API Latency', value: `\`${apiPing}ms\``, inline: true }
            )
            .setTimestamp();
        
        message.reply({ embeds: [pingEmbed] });
    }
    
    else if (command === 'uptime') {
        const uptime = Date.now() - startTime;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
        
        let uptimeString = '';
        if (days > 0) uptimeString += `${days} gün, `;
        if (hours > 0) uptimeString += `${hours} saat, `;
        if (minutes > 0) uptimeString += `${minutes} dakika, `;
        uptimeString += `${seconds} saniye`;
        
        const uptimeEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('⏰ Bot Uptime')
            .setDescription(`Bot **${uptimeString}** süredir çalışıyor.`)
            .addFields(
                { name: '🚀 Başlatılma Zamanı', value: `<t:${Math.floor(startTime / 1000)}:F>`, inline: false }
            )
            .setTimestamp();
        
        message.reply({ embeds: [uptimeEmbed] });
    }
    
    else if (command === 'yardim' || command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 Bot Komutları')
            .setDescription('Mevcut komutların listesi:')
            .addFields(
                { 
                    name: '🏓 !ping', 
                    value: 'Botun ping değerini gösterir', 
                    inline: false 
                },
                { 
                    name: '⏰ !uptime', 
                    value: 'Botun ne kadar süredir çalıştığını gösterir', 
                    inline: false 
                },
                { 
                    name: '❓ !yardim', 
                    value: 'Bu yardım mesajını gösterir', 
                    inline: false 
                }
            )
            .setFooter({ text: `Prefix: ${PREFIX}` })
            .setTimestamp();
        
        message.reply({ embeds: [helpEmbed] });
    }
});

client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        console.error('❌ Failed to login:', error);
        process.exit(1);
    });