require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const chalk = require('chalk');
const os = require('os');
const fs = require('fs');

// 🎨 Gelişmiş Türkçe Logging Sistemi - Süper Güzel Versiyon! 🎨
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
        const border = chalk.green('═'.repeat(5));
        console.log(`${border} ${chalk.green.bold(`[${this.getTimestamp()}] [✅ BAŞARI] ${message}`)} ${border}`);
    }

    static info(message) {
        const border = chalk.blue('─'.repeat(3));
        console.log(`${border} ${chalk.blue.bold(`[${this.getTimestamp()}] [📌 BİLGİ] ${message}`)} ${border}`);
    }

    static warning(message) {
        const border = chalk.yellow('⚠'.repeat(3));
        console.log(`${border} ${chalk.yellow.bold(`[${this.getTimestamp()}] [⚠️ UYARI] ${message}`)} ${border}`);
    }

    static error(message) {
        const border = chalk.red('❌'.repeat(3));
        console.log(`${border} ${chalk.red.bold(`[${this.getTimestamp()}] [💥 HATA] ${message}`)} ${border}`);
    }

    static command(user, guild, command, type = 'PREFIX') {
        const userTag = `${user.username}#${user.discriminator}`;
        const guildName = guild ? guild.name : 'DM';
        const typeEmoji = type === 'SLASH' ? '⚔️' : '🗨️';
        const commandColor = type === 'SLASH' ? chalk.hex('#00d4aa') : chalk.hex('#ffa500');
        console.log(commandColor(`🎯 [${this.getTimestamp()}] [${typeEmoji} ${type}] ${chalk.bold.underline(userTag)} ➜ ${chalk.bold.italic(command)} 📍 ${chalk.bold(guildName)}`));
    }

    static system(message) {
        const gear = chalk.magenta('⚙️');
        console.log(`${gear} ${chalk.magenta.bold(`[${this.getTimestamp()}] [🔧 SİSTEM] ${message}`)} ${gear}`);
    }

    static discord(message) {
        const discordColor = chalk.hex('#5865F2');
        console.log(discordColor.bold(`🤖 [${this.getTimestamp()}] [💙 DİSCORD] ${message} 💙`));
    }

    static performance(message) {
        console.log(chalk.hex('#32CD32')(`⚡ [${this.getTimestamp()}] [📈 PERFORMANS] ${message} ⚡`));
    }

    static user(message) {
        console.log(chalk.hex('#FF69B4')(`👤 [${this.getTimestamp()}] [👥 KULLANICI] ${message} 👤`));
    }

    static startup() {
        console.clear();
        
        // Ana başlık
        console.log(chalk.hex('#FF6B6B').bold('\n' + '═'.repeat(100)));
        console.log(chalk.hex('#4ECDC4').bold('█'.repeat(30) + ' KODLA AI BOT BAŞLATILIYOR 🚀 ' + '█'.repeat(30)));
        console.log(chalk.hex('#45B7D1').bold('═'.repeat(100)));
        
        // Alt başlık
        console.log(chalk.hex('#96CEB4').bold('🎆 Türkçe Discord Bot Sistemi - Süper Güçlü Versiyon \n'));
        
        // Sistem bilgileri
        this.system(`💻 Node.js Sürümü: ${chalk.yellow.bold(process.version)}`);
        this.system(`🖥️ Platform: ${chalk.yellow.bold(os.platform())} ${chalk.yellow.bold(os.arch())}`);
        this.system(`💾 Bellek: ${chalk.yellow.bold(Math.round(os.totalmem() / 1024 / 1024))} MB Toplam`);
        this.system(`⚙️ CPU: ${chalk.yellow.bold(os.cpus()[0].model.substring(0, 40))}...`);
        this.system(`网讯 Bilgisayar Adı: ${chalk.yellow.bold(os.hostname())}`);
        this.system(`🕰️ Çalışma Süresi: ${chalk.yellow.bold(Math.floor(os.uptime() / 3600))} saat`);
        
        console.log(chalk.gray('\n' + '─'.repeat(100) + '\n'));
    }

    static ready(botTag, guildCount, userCount) {
        console.log(chalk.green.bold('\n' + '🎆'.repeat(50)));
        console.log(chalk.green.bold('🚀          BOT BAŞARIYLA ÇEVİRİMİÇİ OLDU!          🚀'));
        console.log(chalk.green.bold('🎆'.repeat(50) + '\n'));
        
        this.success(`🤖 Giriş yapılan hesap: ${chalk.bold.underline(botTag)}`);
        this.success(`🏯 ${chalk.bold(guildCount)} sunucuda 👥 ${chalk.bold(userCount)} kullanıcıya hizmet veriliyor`);
        this.performance(`Bot hazırlık süresi: ${chalk.bold(((Date.now() - global.botStartTime) / 1000).toFixed(2))}s`);
    }

    static commandStats(slashCount, prefixCount, totalCommands) {
        console.log(chalk.gray('\n' + '═'.repeat(100)));
        console.log(chalk.hex('#FFD700').bold(`📈 KOMUT İSTATİSTİKLERİ - Toplam: ${chalk.white.bold(totalCommands)} Komut 📈`));
        console.log(chalk.hex('#32CD32')(`   • Slash Komutları: ${chalk.bold(slashCount)} (⚔️ %${((slashCount/totalCommands)*100).toFixed(1)})`) );
        console.log(chalk.hex('#FF6347')(`   • Prefix Komutları: ${chalk.bold(prefixCount)} (🗨️ %${((prefixCount/totalCommands)*100).toFixed(1)})`) );
        console.log(chalk.gray('═'.repeat(100)));
    }
}

// 📊 Komut sayaçları ve performans takibi
let commandStats = {
    slash: 0,
    prefix: 0,
    totalToday: 0,
    errors: 0,
    lastReset: new Date().toDateString()
};

// 🕰️ Bot başlangıç zamanı
const startTime = Date.now();
global.botStartTime = Date.now();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// 🎨 Mavi temalı yardım embed'i oluştur
function createHelpEmbed() {
    return new EmbedBuilder()
        .setColor('#1e40af') // Güzel mavi renk
        .setTitle('🤖 Kodla AI Bot - Komutlar Rehberi')
        .setDescription('🚀 Prefix komutları (!) ve slash komutları (/) kullanabilirsiniz! 🚀')
        .addFields(
            { 
                name: '🏓 ping', 
                value: 'Botun ping değerini ve bağlantı kalitesini gösterir\n`!ping` veya `/ping`', 
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
                name: '💡 **Öneriler ve İpuçları**',
                value: '• Slash komutları daha hızlı ve kullanışlıdır ⚡\n• Bot sürekli geliştirilmektedir 🔧\n• Sorun yaşarsınız ping komutuyla bağlantıyı test edin 🔍\n• Komutları hem DM hem de sunucularda kullanabilirsiniz 💬',
                inline: false
            }
        )
        .setThumbnail(client.user ? client.user.displayAvatarURL({ dynamic: true, size: 256 }) : null)
        .setFooter({ 
            text: `Prefix: ${PREFIX} | Slash komutları da desteklenir 🚀 | ${commandStats.totalToday} komut bugün kullanıldı`, 
            iconURL: client.user ? client.user.displayAvatarURL() : null
        })
        .setTimestamp();
}

// 📺 Improved slash command registration function
async function registerSlashCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('🏓 Shows bot ping and connection quality'),
        new SlashCommandBuilder()
            .setName('uptime')
            .setDescription('⏰ Shows how long the bot has been running'),
        new SlashCommandBuilder()
            .setName('yardim')
            .setDescription('📖 Shows bot commands and usage guide')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        Logger.system('🔄 Slash komutları kaydediliyor...');
        
        // Clear existing commands first
        Logger.info('🧹 Mevcut komutlar temizleniyor...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [] }
        );
        
        // Register commands for each guild (faster appearance)
        const guilds = client.guilds.cache;
        let registeredGuilds = 0;
        
        for (const [guildId, guild] of guilds) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guildId),
                    { body: commands }
                );
                registeredGuilds++;
                Logger.success(`✅ ${guild.name} sunucusuna komutlar eklendi`);
            } catch (guildError) {
                Logger.warning(`⚠️ ${guild.name} sunucusuna komut eklenemedi: ${guildError.message}`);
                commandStats.errors++;
            }
        }
        
        // Also register global commands (for new servers)
        Logger.system('🌍 Global komutlar kaydediliyor...');
        const globalData = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        Logger.success(`✅ Başarıyla ${chalk.bold(globalData.length)} slash komutu kaydedildi!`);
        Logger.success(`📊 ${chalk.bold(registeredGuilds)} sunucuya özel komutlar eklendi`);
        
        globalData.forEach(cmd => {
            Logger.success(`  • /${cmd.name} - ${cmd.description}`);
        });
        
        Logger.info('⚡ Guild komutları hemen kullanılabilir, global komutlar 1-5 dakika sürebilir.');
        
    } catch (error) {
        Logger.error(`❌ Slash komutları kaydedilirken hata: ${error.message}`);
        commandStats.errors++;
        if (error.code === 50001) {
            Logger.error('⚠️ Hata: Bot yeterli izinlere sahip değil!');
            Logger.warning('Botu sunucuya applications.commands izni ile tekrar davet edin.');
            Logger.info('🔗 Bot davet linki oluşturma: https://discord.com/developers/applications');
        } else if (error.code === 50035) {
            Logger.error('⚠️ Hata: Komut tanımlarında sorun var!');
        } else if (error.code === 429) {
            Logger.error('⚠️ Rate limit! Birkaç dakika bekleyin.');
        }
    }
}

// 🎆 Gelişmiş bot durum ayarlayıcısı
async function setBotStatus() {
    Logger.discord('🔧 Bot durumu ayarlanıyor...');
    
    // Aktivite tipini otomatik belirle
    let activityType = ActivityType.Watching;
    const activity = BOT_ACTIVITY.toLowerCase();
    
    if (activity.includes('dinli') || activity.includes('listen')) {
        activityType = ActivityType.Listening;
    } else if (activity.includes('oyna') || activity.includes('play')) {
        activityType = ActivityType.Playing;
    } else if (activity.includes('izli') || activity.includes('watch') || activity.includes('seyret')) {
        activityType = ActivityType.Watching;
    } else if (activity.includes('yarış') || activity.includes('compete')) {
        activityType = ActivityType.Competing;
    }
    
    try {
        await client.user.setPresence({
            activities: [{
                name: BOT_ACTIVITY,
                type: activityType
            }],
            status: BOT_STATUS
        });
        
        const statusText = {
            [ActivityType.Watching]: '👀 İzliyor',
            [ActivityType.Listening]: '🎧 Dinliyor', 
            [ActivityType.Playing]: '🎮 Oynuyor',
            [ActivityType.Competing]: '🏆 Yarışıyor'
        };
        
        Logger.success(`✅ Bot durumu başarıyla ayarlandı!`);
        Logger.success(`   • Durum: ${chalk.yellow.bold(BOT_STATUS.toUpperCase())}`);
        Logger.success(`   • Aktivite: ${chalk.yellow.bold(statusText[activityType])} "${chalk.italic(BOT_ACTIVITY)}"`);
        return true;
    } catch (error) {
        Logger.error(`❌ Bot durumu ayarlanırken hata: ${error.message}`);
        commandStats.errors++;
        return false;
    }
}

// Bot yapılandırmasını yükle
Logger.startup();

const PREFIX = process.env.BOT_PREFIX || '!';
const BOT_STATUS = process.env.BOT_STATUS || 'idle';
const BOT_ACTIVITY = process.env.BOT_ACTIVITY || 'Kodla AI Projesi';

Logger.info(`Yapılandırma yüklendi:`);
Logger.info(`  🔹 Prefix: ${chalk.bold(PREFIX)}`);
Logger.info(`  🔹 Durum: ${chalk.bold(BOT_STATUS)}`);
Logger.info(`  🔹 Aktivite: ${chalk.bold(BOT_ACTIVITY)}`);
console.log('');

client.once('clientReady', async () => {
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    
    Logger.ready(client.user.tag, guildCount, userCount);
    
    // Bot durumunu ayarla
    await setBotStatus();
    
    console.log('');
    // Slash komutları kaydet
    await registerSlashCommands();
    
    console.log('');
    Logger.system('🎯 Bot komutları almaya hazır!');
    Logger.info('📋 Kullanılabilir komutlar: !ping, !uptime, !yardim, /ping, /uptime, /yardim');
    console.log(chalk.gray('─'.repeat(90)));
});

// 🚀 Enhanced slash command handler with proper debugging
client.on('interactionCreate', async interaction => {
    // Debug logging
    Logger.user(`Interaction received: ${interaction.type} from ${interaction.user.username}`);
    
    if (!interaction.isChatInputCommand()) {
        Logger.user(`Non-command interaction ignored: ${interaction.type}`);
        return;
    }

    const { commandName } = interaction;
    commandStats.slash++;
    commandStats.totalToday++;
    
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
                .setDescription(`Bot ping bilgileri aşağıda gösterilmiştir:`)
                .addFields(
                    { name: '📨 Mesaj Gecikmesi', value: `\`${ping}ms\``, inline: true },
                    { name: '🌐 API Gecikmesi', value: `\`${apiPing}ms\``, inline: true },
                    { name: '📈 Kalite', value: apiPing < 100 ? '🟢 Mükemmel' : apiPing < 200 ? '🟡 İyi' : '🔴 Yavaş', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Komut çalıştırma süresi: ${ping}ms` });
            
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
                .setTitle('⏰ Bot Çalışma Süresi')
                .setDescription(`Bot **${uptimeString}** süredir kesintisiz çalışıyor! 🚀`)
                .addFields(
                    { name: '🚀 Başlatılma Zamanı', value: `<t:${Math.floor(startTime / 1000)}:F>`, inline: false },
                    { name: '📈 Komut İstatistikleri', value: `Slash: ${commandStats.slash} | Prefix: ${commandStats.prefix}`, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [uptimeEmbed] });
        }
        else if (commandName === 'yardim') {
            const helpEmbed = createHelpEmbed();
            await interaction.reply({ embeds: [helpEmbed] });
        }
    } catch (error) {
        Logger.error(`Slash komut /${commandName} işlenirken hata: ${error.message}`);
        commandStats.errors++;
        
        // Eğer interaction henüz yanıtlanmamışsa hata mesajı gönder
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Bir hata oluştu! Lütfen tekrar deneyin.', 
                    ephemeral: true 
                });
            }
        } catch (replyError) {
            Logger.error(`Hata yanıtı gönderilemedi: ${replyError.message}`);
        }
    }
});

// Gelişmiş prefix komut işleyicisi
client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    commandStats.prefix++;
    commandStats.totalToday++;
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
                .setDescription(`Bot ping bilgileri aşağıda gösterilmiştir:`)
                .addFields(
                    { name: '📨 Mesaj Gecikmesi', value: `\`${ping}ms\``, inline: true },
                    { name: '🌐 API Gecikmesi', value: `\`${apiPing}ms\``, inline: true },
                    { name: '📈 Kalite', value: apiPing < 100 ? '🟢 Mükemmel' : apiPing < 200 ? '🟡 İyi' : '🔴 Yavaş', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Komut çalıştırma süresi: ${ping}ms` });
            
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
                .setTitle('⏰ Bot Çalışma Süresi')
                .setDescription(`Bot **${uptimeString}** süredir kesintisiz çalışıyor! 🚀`)
                .addFields(
                    { name: '🚀 Başlatılma Zamanı', value: `<t:${Math.floor(startTime / 1000)}:F>`, inline: false },
                    { name: '📈 Komut İstatistikleri', value: `Slash: ${commandStats.slash} | Prefix: ${commandStats.prefix}`, inline: false }
                )
                .setTimestamp();
            
            message.reply({ embeds: [uptimeEmbed] });
        }
        
        else if (command === 'yardim' || command === 'help') {
            const helpEmbed = createHelpEmbed();
            message.reply({ embeds: [helpEmbed] });
        }
    } catch (error) {
        Logger.error(`Prefix komut ${PREFIX}${command} işlenirken hata: ${error.message}`);
        commandStats.errors++;
        try {
            message.reply('❌ Bir hata oluştu! Lütfen tekrar deneyin.');
        } catch (replyError) {
            Logger.error(`Hata yanıtı gönderilemedi: ${replyError.message}`);
        }
    }

    // 📊 Günlük komut sayacını güncelle
    const today = new Date().toDateString();
    if (commandStats.lastReset !== today) {
        commandStats.totalToday = 0;
        commandStats.lastReset = today;
    }

    // Her 10 komutta bir istatistik göster
    const totalCommands = commandStats.slash + commandStats.prefix;
    if (totalCommands % 10 === 0 && totalCommands > 0) {
        Logger.commandStats(commandStats.slash, commandStats.prefix, totalCommands);
    }
});

// 🛡️ Gelişmiş hata yönetimi
client.on('error', error => {
    Logger.error(`💥 Discord istemci hatası: ${error.message}`);
    Logger.error(`🔍 Hata detayı: ${error.stack}`);
    commandStats.errors++;
});

client.on('warn', warning => {
    Logger.warning(`⚡ Discord istemci uyarısı: ${warning}`);
});

client.on('disconnect', (event) => {
    Logger.warning('⚠️ Bot Discord\'dan bağlantısı kesildi!');
    Logger.warning(`Çıkış kodu: ${event.code}, Sebep: ${event.reason}`);
});

client.on('reconnecting', () => {
    Logger.info('🔄 Bot Discord\'a yeniden bağlanıyor...');
});

// 🛡️ Global hata yakalayıcıları
process.on('unhandledRejection', error => {
    Logger.error(`💣 İşlenmemiş promise reddi: ${error.message}`);
    Logger.error(`🔍 Hata detayı: ${error.stack}`);
    commandStats.errors++;
});

process.on('uncaughtException', error => {
    Logger.error(`❌ Yakalanmamış hata: ${error.message}`);
    Logger.error(`🔍 Hata detayı: ${error.stack}`);
    Logger.error('🚨 Bot kapatiliyor...');
    commandStats.errors++;
    process.exit(1);
});

// 🛡️ Temiz kapanış yönetimi
process.on('SIGINT', () => {
    Logger.warning('🛡 SIGINT sinyali alındı. Bot kapatiliyor...');
    client.destroy();
    Logger.success('✅ Bot başarıyla kapatıldı!');
    process.exit(0);
});

process.on('SIGTERM', () => {
    Logger.warning('🛡 SIGTERM sinyali alındı. Bot kapatılıyor...');
    client.destroy();
    Logger.success('✅ Bot başarıyla kapatıldı!');
    process.exit(0);
});

// Bot giriş sistemi
Logger.info('🚀 Discord\'a giriş yapılıyor...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        Logger.success('✅ Discord girişi başarılı!');
    })
    .catch(error => {
        Logger.error(`❌ Discord girişi başarısız: ${error.message}`);
        if (error.code === 'TOKEN_INVALID') {
            Logger.error('🔑 Geçersiz bot token! .env dosyasını kontrol edin.');
        }
        Logger.error('🚨 Bot kapatiliyor...');
        process.exit(1);
    });
