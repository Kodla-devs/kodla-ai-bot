require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const chalk = require('chalk');
const os = require('os');

// Enhanced Logging System
class Logger {
    static getTimestamp() {
        return new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    static success(message) {
        console.log(chalk.green.bold(`[${this.getTimestamp()}] [SUCCESS] ${message}`));
    }

    static info(message) {
        console.log(chalk.blue.bold(`[${this.getTimestamp()}] [INFO] ${message}`));
    }

    static warning(message) {
        console.log(chalk.yellow.bold(`[${this.getTimestamp()}] [WARNING] ${message}`));
    }

    static error(message) {
        console.log(chalk.red.bold(`[${this.getTimestamp()}] [ERROR] ${message}`));
    }

    static command(user, guild, command, type = 'PREFIX') {
        const userTag = `${user.username}#${user.discriminator}`;
        const guildName = guild ? guild.name : 'DM';
        console.log(chalk.cyan(`[${this.getTimestamp()}] [${type}] ${chalk.bold(userTag)} used ${chalk.bold(command)} in ${chalk.bold(guildName)}`));
    }

    static system(message) {
        console.log(chalk.magenta.bold(`[${this.getTimestamp()}] [SYSTEM] ${message}`));
    }

    static discord(message) {
        console.log(chalk.hex('#5865F2').bold(`[${this.getTimestamp()}] [DISCORD] ${message}`));
    }

    static startup() {
        console.clear();
        console.log(chalk.hex('#1e40af').bold('\n' + '═'.repeat(80)));
        console.log(chalk.hex('#1e40af').bold('█'.repeat(20) + ' KODLA AI BOT STARTING ' + '█'.repeat(20)));
        console.log(chalk.hex('#1e40af').bold('═'.repeat(80) + '\n'));
        
        this.system(`Node.js Version: ${process.version}`);
        this.system(`Platform: ${os.platform()} ${os.arch()}`);
        this.system(`Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB`);
        this.system(`CPU: ${os.cpus()[0].model}`);
        this.system(`Hostname: ${os.hostname()}`);
        console.log('');
    }

    static ready(botTag, guildCount, userCount) {
        console.log(chalk.green.bold('\n' + '🎉'.repeat(40)));
        console.log(chalk.green.bold('           BOT SUCCESSFULLY ONLINE!'));
        console.log(chalk.green.bold('🎉'.repeat(40) + '\n'));
        
        this.success(`Logged in as: ${chalk.bold(botTag)}`);
        this.success(`Serving ${chalk.bold(guildCount)} guilds with ${chalk.bold(userCount)} users`);
    }
}

const startTime = Date.now();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Function to create help embed
function createHelpEmbed() {
    return new EmbedBuilder()
        .setColor('#1e40af') // Beautiful blue color
        .setTitle('🤖 Kodla AI Bot - Komutlar')
        .setDescription('Prefix komutları (!) ve slash komutları (/) kullanabilirsiniz!')
        .addFields(
            { 
                name: '🏓 ping', 
                value: 'Botun ping değerini gösterir\n`!ping` veya `/ping`', 
                inline: true 
            },
            { 
                name: '⏰ uptime', 
                value: 'Botun ne kadar süredir çalıştığını gösterir\n`!uptime` veya `/uptime`', 
                inline: true 
            },
            { 
                name: '❓ yardım', 
                value: 'Bu yardım menüsünü gösterir\n`!yardim` veya `/yardim`', 
                inline: true 
            }
        )
        .addFields(
            {
                name: '💡 **Öneriler**',
                value: '• Slash komutları daha hızlı ve kullanışlıdır\n• Bot sürekli geliştirilmektedir\n• Sorun yaşarsanız ping komutuyla bağlantıyı test edin',
                inline: false
            }
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ 
            text: `Prefix: ${PREFIX} | Slash komutları da desteklenir`, 
            iconURL: client.user.displayAvatarURL() 
        })
        .setTimestamp();
}

// Function to register slash commands
async function registerSlashCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Botun ping değerini gösterir'),
        new SlashCommandBuilder()
            .setName('uptime')
            .setDescription('Botun ne kadar süredir çalıştığını gösterir'),
        new SlashCommandBuilder()
            .setName('yardim')
            .setDescription('Bot komutlarını gösterir')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('🔄 Slash komutları kaydediliyor...');
        
        // Delete existing commands first (optional, for clean registration)
        console.log('🧯 Mevcut komutlar temizleniyor...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [] }
        );
        
        // Register new commands
        Logger.system('Registering new slash commands...');
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        Logger.success(`Successfully registered ${chalk.bold(data.length)} slash commands!`);
        data.forEach(cmd => {
            Logger.success(`  /${cmd.name} - ${cmd.description}`);
        });
        Logger.warning('Slash commands may take up to 5 minutes to appear in Discord.');
        
    } catch (error) {
        console.error('❌ Slash komutları kaydedilirken hata:', error);
        if (error.code === 50001) {
            console.error('⚠️ Hata: Bot yeterli izinlere sahip değil!');
            console.error('Bot’u sunucuya "applications.commands" izni ile tekrar davet edin.');
        }
    }
}
// Initialize startup logging
Logger.startup();

const PREFIX = process.env.BOT_PREFIX || '!';
const BOT_STATUS = process.env.BOT_STATUS || 'online';
const BOT_ACTIVITY = process.env.BOT_ACTIVITY || 'Listening to !ping';

Logger.info(`Configuration loaded:`);
Logger.info(`  Prefix: ${chalk.bold(PREFIX)}`);
Logger.info(`  Status: ${chalk.bold(BOT_STATUS)}`);
Logger.info(`  Activity: ${chalk.bold(BOT_ACTIVITY)}`);
console.log('');

client.once('ready', async () => {
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    
    Logger.ready(client.user.tag, guildCount, userCount);
    
    Logger.discord('Setting bot presence...');
    client.user.setPresence({
        activities: [{
            name: BOT_ACTIVITY,
            type: ActivityType.Watching
        }],
        status: BOT_STATUS
    });
    Logger.success(`Presence set: ${BOT_STATUS} - ${BOT_ACTIVITY}`);
    
    console.log('');
    // Register slash commands
    await registerSlashCommands();
    
    console.log('');
    Logger.system('Bot is now ready to receive commands!');
    Logger.info('Available commands: !ping, !uptime, !yardim, /ping, /uptime, /yardim');
    console.log(chalk.gray('─'.repeat(80)));
});

// Enhanced slash command handler with logging
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    Logger.command(interaction.user, interaction.guild, `/${commandName}`, 'SLASH');

    try {
        if (commandName === 'ping') {
            const sent = interaction.createdTimestamp;
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
            
            await interaction.reply({ embeds: [pingEmbed] });
        }
        else if (commandName === 'uptime') {
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
            
            await interaction.reply({ embeds: [uptimeEmbed] });
        }
        else if (commandName === 'yardim') {
            const helpEmbed = createHelpEmbed();
            await interaction.reply({ embeds: [helpEmbed] });
        }
    } catch (error) {
        Logger.error(`Error handling slash command /${commandName}: ${error.message}`);
        
        // Try to respond if interaction hasn't been replied to yet
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({ 
                    content: 'Bir hata oluştu. Lütfen tekrar deneyin.', 
                    ephemeral: true 
                });
            } catch (replyError) {
                Logger.error(`Failed to send error response: ${replyError.message}`);
            }
        }
    }
});

// Enhanced message command handler with logging
client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    Logger.command(message.author, message.guild, `${PREFIX}${command}`, 'PREFIX');
    
    try {
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
            const helpEmbed = createHelpEmbed();
            message.reply({ embeds: [helpEmbed] });
        }
    } catch (error) {
        Logger.error(`Error handling prefix command ${PREFIX}${command}: ${error.message}`);
        try {
            message.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
        } catch (replyError) {
            Logger.error(`Failed to send error response: ${replyError.message}`);
        }
    }
});

// Enhanced error handling
client.on('error', error => {
    Logger.error(`Discord client error: ${error.message}`);
    Logger.error(`Stack: ${error.stack}`);
});

client.on('warn', warning => {
    Logger.warning(`Discord client warning: ${warning}`);
});

client.on('disconnect', () => {
    Logger.warning('Bot disconnected from Discord!');
});

client.on('reconnecting', () => {
    Logger.info('Bot reconnecting to Discord...');
});

process.on('unhandledRejection', error => {
    Logger.error(`Unhandled promise rejection: ${error.message}`);
    Logger.error(`Stack: ${error.stack}`);
});

process.on('uncaughtException', error => {
    Logger.error(`Uncaught exception: ${error.message}`);
    Logger.error(`Stack: ${error.stack}`);
    process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    Logger.warning('Received SIGINT. Graceful shutdown...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    Logger.warning('Received SIGTERM. Graceful shutdown...');
    client.destroy();
    process.exit(0);
});

// Bot login with enhanced logging
Logger.info('Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        Logger.success('Discord login successful!');
    })
    .catch(error => {
        Logger.error(`Discord login failed: ${error.message}`);
        if (error.code === 'TOKEN_INVALID') {
            Logger.error('Invalid bot token! Please check your .env file.');
        }
        Logger.error('Exiting...');
        process.exit(1);
    });