const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const YouTubeSearcher = require('./youtube_search');
const SimpleSearcher = require('./simple_search');
const GeminiAI = require('./gemini_ai');
require('dotenv').config();

class KodlaDevBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        this.qaDataset = this.loadQADataset();
        this.youtubeSearcher = new YouTubeSearcher(process.env.YOUTUBE_API_KEY);
        this.simpleSearcher = new SimpleSearcher();
        this.geminiAI = new GeminiAI(process.env.GEMINI_API_KEY);
        this.setupEventListeners();
        this.setupCommands();
    }

    loadQADataset() {
        try {
            const datasetPath = path.join(__dirname, 'kodla_dev_dataset.jsonl');
            if (fs.existsSync(datasetPath)) {
                const data = fs.readFileSync(datasetPath, 'utf8');
                const lines = data.trim().split('\n');
                const dataset = lines.map(line => JSON.parse(line));
                console.log(`📚 ${dataset.length} soru-cevap çifti yüklendi!`);
                return dataset;
            } else {
                console.log('⚠️  Dataset dosyası bulunamadı. Önce Python scriptini çalıştırın.');
                return [];
            }
        } catch (error) {
            console.error('❌ Dataset yüklenirken hata:', error);
            return [];
        }
    }

    setupEventListeners() {
        this.client.once('clientReady', () => {
            console.log(`🤖 ${this.client.user.tag} aktif!`);
            console.log(`📊 ${this.client.guilds.cache.size} sunucuda hizmet veriyorum`);

            // Bot durumunu ayarla
            this.client.user.setActivity('Kodla Dev | /yardim', { type: 'WATCHING' });
        });

        // Error handler
        this.client.on('error', (error) => {
            console.error('Discord.js hatası:', error);
        });

        // Unhandled rejection handler
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            console.log(`📨 Mesaj alındı: "${message.content}" - Kullanıcı: ${message.author.username}`);

            // Prefix komutları (/komut)
            if (message.content.startsWith('/')) {
                console.log('🔧 Prefix komut algılandı:', message.content);
                await this.handlePrefixCommand(message);
                return;
            }

            // Gelişmiş otomatik cevap sistemi (Gemini AI ile)
            if (message.content.toLowerCase().includes('python') ||
                message.content.toLowerCase().includes('kod') ||
                message.content.toLowerCase().includes('programlama') ||
                message.content.toLowerCase().includes('yapay zeka') ||
                message.content.toLowerCase().includes('ai') ||
                message.content.includes('?')) {

                console.log('🤖 Gelişmiş otomatik cevap tetiklendi');

                // Önce dataset'te ara
                const datasetResponse = this.findBestAnswer(message.content);
                console.log('📝 Dataset cevabı:', datasetResponse ? 'Var' : 'Yok');

                if (datasetResponse) {
                    // Dataset'ten cevap varsa onu kullan
                    const embed = new EmbedBuilder()
                        .setColor('#3498db')
                        .setTitle('🤖 Kodla Dev AI Asistanı')
                        .setDescription(datasetResponse)
                        .setFooter({
                            text: 'Kodla Dev bilgi bankasından',
                            iconURL: this.client.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                    console.log('✅ Dataset cevabı gönderildi');
                } else if (message.content.includes('?') && message.content.length > 10) {
                    // Soru işareti varsa ve yeterince uzunsaKodla AI kullan
                    console.log('🧠Kodla AI devreye giriyor...');

                    try {
                        const aiResult = await this.geminiAI.generateResponse(message.content);

                        if (aiResult.success) {
                            const embed = new EmbedBuilder()
                                .setColor('#4285f4')
                                .setTitle('🧠 Kodla Dev AI (Gemini)')
                                .setDescription(aiResult.text.length > 2000 ? aiResult.text.substring(0, 1997) + '...' : aiResult.text)
                                .setFooter({
                                    text: 'Gemini AI ile desteklenmektedir',
                                    iconURL: this.client.user.displayAvatarURL()
                                })
                                .setTimestamp();

                            await message.reply({ embeds: [embed] });
                            console.log('✅Kodla AI cevabı gönderildi');
                        }
                    } catch (error) {
                        console.error('❌Kodla AI hatası:', error);
                    }
                } else {
                    console.log('❌ Uygun cevap bulunamadı');
                }
            }
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            try {
                await this.handleSlashCommand(interaction);
            } catch (error) {
                console.error('Interaction hatası:', error);

                // Eğer interaction henüz cevaplanmamışsa cevapla
                if (!interaction.replied && !interaction.deferred) {
                    try {
                        await interaction.reply({
                            content: '❌ Bir hata oluştu!',
                            ephemeral: true
                        });
                    } catch (replyError) {
                        console.error('Reply hatası:', replyError);
                    }
                }
            }
        });
    }

    findBestAnswer(question) {
        console.log(`🔍 Cevap aranıyor: "${question}"`);
        console.log(`📚 Dataset boyutu: ${this.qaDataset.length}`);

        if (this.qaDataset.length === 0) {
            console.log('❌ Dataset boş!');
            return null;
        }

        const questionLower = question.toLowerCase();
        console.log(`🔤 Küçük harf: "${questionLower}"`);

        // Basit keyword matching
        for (let i = 0; i < this.qaDataset.length; i++) {
            const item = this.qaDataset[i];
            const userMessage = item.messages.find(m => m.role === 'user');
            const assistantMessage = item.messages.find(m => m.role === 'assistant');

            if (userMessage && assistantMessage) {
                console.log(`📝 Dataset ${i + 1}: "${userMessage.content}"`);
                const keywords = userMessage.content.toLowerCase().split(' ');
                const matchCount = keywords.filter(keyword =>
                    questionLower.includes(keyword) && keyword.length > 2
                ).length;

                console.log(`🎯 Eşleşen kelime sayısı: ${matchCount}`);

                if (matchCount > 0) {
                    console.log(`✅ Cevap bulundu: "${assistantMessage.content.substring(0, 50)}..."`);
                    return assistantMessage.content;
                }
            }
        }

        console.log('❌ Hiç eşleşme bulunamadı');
        return null;
    }

    async setupCommands() {
        const commands = [
            new SlashCommandBuilder()
                .setName('yardim')
                .setDescription('Bot hakkında bilgi al'),

            new SlashCommandBuilder()
                .setName('soru')
                .setDescription('Kodla Dev AI\'ya soru sor')
                .addStringOption(option =>
                    option.setName('soru')
                        .setDescription('Sormak istediğin soru')
                        .setRequired(true)
                ),

            new SlashCommandBuilder()
                .setName('istatistik')
                .setDescription('Bot istatistiklerini göster'),

            new SlashCommandBuilder()
                .setName('kanal')
                .setDescription('Kodla Dev YouTube kanalı hakkında bilgi'),

            new SlashCommandBuilder()
                .setName('arastir')
                .setDescription('Bilgi bankasında araştırma yap')
                .addStringOption(option =>
                    option.setName('konu')
                        .setDescription('Araştırmak istediğin konu')
                        .setRequired(true)
                ),

            new SlashCommandBuilder()
                .setName('yeni-video')
                .setDescription('Yeni video paylaş')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Video başlığı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('aciklama')
                        .setDescription('Video açıklaması')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('link')
                        .setDescription('Video linki')
                        .setRequired(true)
                ),

            new SlashCommandBuilder()
                .setName('ai-soru')
                .setDescription('Gemini AI ile gelişmiş soru sor')
                .addStringOption(option =>
                    option.setName('soru')
                        .setDescription('Sormak istediğin soru')
                        .setRequired(true)
                ),

            new SlashCommandBuilder()
                .setName('kod-ornegi')
                .setDescription('Belirli bir konu için kod örneği iste')
                .addStringOption(option =>
                    option.setName('konu')
                        .setDescription('Kod örneği istediğin konu')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('seviye')
                        .setDescription('Zorluk seviyesi')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Başlangıç', value: 'beginner' },
                            { name: 'Orta', value: 'intermediate' },
                            { name: 'İleri', value: 'advanced' }
                        )
                )
        ];

        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

            console.log('🔄 Slash komutları yükleniyor...');

            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );

            console.log('✅ Slash komutları başarıyla yüklendi!');
        } catch (error) {
            console.error('❌ Komut yükleme hatası:', error);
        }
    }

    async handlePrefixCommand(message) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        console.log(`🔧 Komut işleniyor: "${command}", Args: [${args.join(', ')}]`);

        try {
            switch (command) {
                case 'yardim':
                case 'help':
                    console.log('📖 Yardım komutu çalıştırılıyor');
                    await this.handlePrefixHelp(message);
                    break;

                case 'soru':
                case 'ask':
                    const question = args.join(' ');
                    if (!question) {
                        await message.reply('❌ Lütfen bir soru yazın! Örnek: `/soru Python nedir?`');
                        return;
                    }
                    console.log(`❓ Soru komutu: "${question}"`);
                    await this.handlePrefixQuestion(message, question);
                    break;

                case 'istatistik':
                case 'stats':
                    console.log('📊 İstatistik komutu çalıştırılıyor');
                    await this.handlePrefixStats(message);
                    break;

                case 'kanal':
                case 'channel':
                    await this.handlePrefixChannel(message);
                    break;

                case 'arastir':
                case 'search':
                case 'ara':
                    const topic = args.join(' ');
                    if (!topic) {
                        await message.reply('❌ Lütfen araştırmak istediğiniz konuyu yazın! Örnek: `/arastir Python fonksiyonları`');
                        return;
                    }
                    console.log(`🔍 Araştırma komutu: "${topic}"`);
                    await this.handlePrefixResearch(message, topic);
                    break;

                case 'video':
                case 'yeni-video':
                    await message.reply('📹 Yeni video paylaşmak için slash komutunu kullanın: `/yeni-video`');
                    break;

                default:
                    console.log(`❌ Bilinmeyen komut: "${command}"`);
                    await message.reply('❌ Bilinmeyen komut! `/yardim` yazarak komutları görebilirsiniz.');
            }
        } catch (error) {
            console.error('Prefix komut hatası:', error);
            await message.reply('❌ Bir hata oluştu!');
        }
    }

    async handlePrefixHelp(message) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🤖 Kodla Dev AI Asistanı - Komutlar')
            .setDescription('Prefix komutları (/) kullanabilirsiniz!')
            .addFields(
                { name: '📝 /soru <soru>', value: 'Bilgi bankasından hızlı cevap', inline: true },
                { name: '🧠 /ai-soru <soru>', value: 'Gemini AI ile gelişmiş cevap', inline: true },
                { name: '💻 /kod-ornegi <konu>', value: 'AI ile kod örneği oluştur', inline: true },
                { name: '🔍 /arastir <konu>', value: 'Bilgi bankasında araştırma yap', inline: true },
                { name: '📹 /yeni-video', value: 'Yeni video paylaş', inline: true },
                { name: '📊 /istatistik', value: 'Bot istatistikleri', inline: true },
                { name: '💡 Otomatik AI', value: 'Soru işareti (?) kullanın,Kodla AI otomatik cevap verir!', inline: false },
                { name: '🚀 YENİ!', value: '**Gemini AI entegrasyonu**: Gelişmiş AI cevapları ve kod örnekleri!', inline: false }
            )
            .setThumbnail(this.client.user.displayAvatarURL())
            .setFooter({ text: 'Kodla Dev AI Asistanı' })
            .setTimestamp();

        console.log('✅ Yardım mesajı gönderiliyor');
        await message.reply({ embeds: [embed] });
    }

    async handlePrefixQuestion(message, question) {
        const answer = this.findBestAnswer(question);

        if (answer) {
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🤖 Cevabım')
                .setDescription(answer)
                .addFields(
                    { name: '❓ Sorunuz', value: question, inline: false }
                )
                .setFooter({ text: 'Kodla Dev YouTube kanalından öğrendim!' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('🤔 Üzgünüm')
                .setDescription('Bu konuda henüz bilgim yok. Kodla Dev kanalındaki videoları izleyerek daha fazla öğrenmeye devam ediyorum!')
                .addFields(
                    { name: '💡 Önerim', value: '[Kodla Dev YouTube Kanalı](https://youtube.com/@kodla_dev) ziyaret edin!', inline: false }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }
    }

    async handlePrefixStats(message) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📊 Bot İstatistikleri')
            .addFields(
                { name: '🏠 Sunucu Sayısı', value: `${this.client.guilds.cache.size}`, inline: true },
                { name: '👥 Kullanıcı Sayısı', value: `${this.client.users.cache.size}`, inline: true },
                { name: '📚 Bilgi Bankası', value: `${this.qaDataset.length} soru-cevap`, inline: true },
                { name: '⏱️ Çalışma Süresi', value: `${Math.floor(this.client.uptime / 1000 / 60)} dakika`, inline: true },
                { name: '🧠 Bellek Kullanımı', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
                { name: '🔗 Ping', value: `${this.client.ws.ping}ms`, inline: true }
            )
            .setThumbnail(this.client.user.displayAvatarURL())
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }

    async handlePrefixChannel(message) {
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('📺 Kodla Dev YouTube Kanalı')
            .setDescription('Python, yapay zeka ve oyun geliştirme üzerine kaliteli içerikler!')
            .addFields(
                { name: '🔗 Kanal Linki', value: '[youtube.com/@kodla_dev](https://youtube.com/@kodla_dev)', inline: false },
                { name: '📚 İçerik Konuları', value: '• Python Programlama\n• Yapay Zeka\n• Oyun Geliştirme\n• Web Geliştirme\n• Yazılım Mühendisliği', inline: false },
                { name: '🤖 AI Asistanı', value: 'Bu bot, Kodla Dev kanalındaki videolardan öğrendiği bilgilerle size yardımcı oluyor!', inline: false }
            )
            .setImage('https://via.placeholder.com/400x200/e67e22/ffffff?text=Kodla+Dev')
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }

    async handlePrefixResearch(message, topic) {
        // Yükleniyor mesajı gönder
        const loadingEmbed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🔍 Araştırma Yapılıyor...')
            .setDescription(`"${topic}" konusunda bilgi bankamda araştırma yapıyorum...`)
            .setTimestamp();

        const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

        try {
            // Dataset'te araştırma yap
            const results = this.simpleSearcher.searchMultiple(topic, 3);

            if (results && results.length > 0) {
                const mainResult = results[0];

                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🎯 Araştırma Sonucu')
                    .setDescription(mainResult.answer)
                    .addFields(
                        { name: '❓ Araştırılan Konu', value: topic, inline: false },
                        { name: '🎯 Eşleşen Soru', value: mainResult.question, inline: false },
                        { name: '📊 Eşleşme Skoru', value: `${mainResult.score}/10`, inline: true }
                    )
                    .setFooter({ text: 'Kodla Dev bilgi bankasından' })
                    .setTimestamp();

                // Diğer sonuçları da ekle
                if (results.length > 1) {
                    const otherResults = results.slice(1, 3).map((r, i) =>
                        `**${i + 2}.** ${r.question} (Skor: ${r.score})`
                    ).join('\n');

                    if (otherResults) {
                        embed.addFields({ name: '📚 İlgili Diğer Sorular', value: otherResults, inline: false });
                    }
                }

                await loadingMessage.edit({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('😔 Sonuç Bulunamadı')
                    .setDescription('Bu konuda henüz bilgi bankamda veri bulunamadı.')
                    .addFields(
                        { name: '💡 Önerim', value: 'Farklı kelimeler kullanarak tekrar deneyin veya [Kodla Dev YouTube Kanalı](https://youtube.com/@kodla_dev) ziyaret edin!', inline: false }
                    )
                    .setTimestamp();

                await loadingMessage.edit({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Araştırma hatası:', error);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Araştırma Hatası')
                .setDescription('Araştırma sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                .setTimestamp();

            await loadingMessage.edit({ embeds: [embed] });
        }
    }

    async handleSlashCommand(interaction) {
        const { commandName } = interaction;

        try {
            switch (commandName) {
                case 'yardim':
                    await this.handleHelpCommand(interaction);
                    break;

                case 'soru':
                    await this.handleQuestionCommand(interaction);
                    break;

                case 'istatistik':
                    await this.handleStatsCommand(interaction);
                    break;

                case 'kanal':
                    await this.handleChannelCommand(interaction);
                    break;

                case 'arastir':
                    await this.handleResearchCommand(interaction);
                    break;

                case 'yeni-video':
                    await this.handleNewVideoCommand(interaction);
                    break;

                case 'ai-soru':
                    await this.handleAIQuestionCommand(interaction);
                    break;

                case 'kod-ornegi':
                    await this.handleCodeExampleCommand(interaction);
                    break;

                default:
                    await interaction.reply('❌ Bilinmeyen komut!');
            }
        } catch (error) {
            console.error('Komut hatası:', error);

            // Eğer interaction henüz cevaplanmamışsa cevapla
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ Bir hata oluştu!',
                        ephemeral: true
                    });
                } catch (replyError) {
                    console.error('Reply hatası:', replyError);
                }
            }
        }
    }

    async handleHelpCommand(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🤖 Kodla Dev AI Asistanı')
            .setDescription('Kodla Dev YouTube kanalından öğrendiğim bilgilerle size yardımcı oluyorum!')
            .addFields(
                { name: '📝 /soru', value: 'Python, programlama ve yapay zeka hakkında soru sor', inline: true },
                { name: '📊 /istatistik', value: 'Bot istatistiklerini görüntüle', inline: true },
                { name: '📺 /kanal', value: 'Kodla Dev kanalı hakkında bilgi al', inline: true },
                { name: '💡 İpucu', value: 'Mesajlarınızda "python", "kod" veya "programlama" kelimelerini kullanırsanız otomatik cevap verebilirim!', inline: false }
            )
            .setThumbnail(this.client.user.displayAvatarURL())
            .setFooter({ text: 'Kodla Dev AI Asistanı' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleQuestionCommand(interaction) {
        const question = interaction.options.getString('soru');
        const answer = this.findBestAnswer(question);

        if (answer) {
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🤖 Cevabım')
                .setDescription(answer)
                .addFields(
                    { name: '❓ Sorunuz', value: question, inline: false }
                )
                .setFooter({ text: 'Kodla Dev YouTube kanalından öğrendim!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('🤔 Üzgünüm')
                .setDescription('Bu konuda henüz bilgim yok. Kodla Dev kanalındaki videoları izleyerek daha fazla öğrenmeye devam ediyorum!')
                .addFields(
                    { name: '💡 Önerim', value: '[Kodla Dev YouTube Kanalı](https://youtube.com/@kodla_dev) ziyaret edin!', inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }

    async handleStatsCommand(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📊 Bot İstatistikleri')
            .addFields(
                { name: '🏠 Sunucu Sayısı', value: `${this.client.guilds.cache.size}`, inline: true },
                { name: '👥 Kullanıcı Sayısı', value: `${this.client.users.cache.size}`, inline: true },
                { name: '📚 Bilgi Bankası', value: `${this.qaDataset.length} soru-cevap`, inline: true },
                { name: '⏱️ Çalışma Süresi', value: `${Math.floor(this.client.uptime / 1000 / 60)} dakika`, inline: true },
                { name: '🧠 Bellek Kullanımı', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
                { name: '🔗 Ping', value: `${this.client.ws.ping}ms`, inline: true }
            )
            .setThumbnail(this.client.user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleChannelCommand(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('📺 Kodla Dev YouTube Kanalı')
            .setDescription('Python, yapay zeka ve oyun geliştirme üzerine kaliteli içerikler!')
            .addFields(
                { name: '🔗 Kanal Linki', value: '[youtube.com/@kodla_dev](https://youtube.com/@kodla_dev)', inline: false },
                { name: '📚 İçerik Konuları', value: '• Python Programlama\n• Yapay Zeka\n• Oyun Geliştirme\n• Web Geliştirme\n• Yazılım Mühendisliği', inline: false },
                { name: '🤖 AI Asistanı', value: 'Bu bot, Kodla Dev kanalındaki videolardan öğrendiği bilgilerle size yardımcı oluyor!', inline: false }
            )
            .setImage('https://via.placeholder.com/400x200/e67e22/ffffff?text=Kodla+Dev')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async handleResearchCommand(interaction) {
        const topic = interaction.options.getString('konu');

        // Yükleniyor mesajı
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('🔍 Araştırma Yapılıyor...')
                .setDescription(`"${topic}" konusunda bilgi bankamda araştırma yapıyorum...`)
                .setTimestamp()]
        });

        try {
            // Dataset'te araştırma yap
            const results = this.simpleSearcher.searchMultiple(topic, 3);

            if (results && results.length > 0) {
                const mainResult = results[0];

                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🎯 Araştırma Sonucu')
                    .setDescription(mainResult.answer)
                    .addFields(
                        { name: '❓ Araştırılan Konu', value: topic, inline: false },
                        { name: '🎯 Eşleşen Soru', value: mainResult.question, inline: false },
                        { name: '📊 Eşleşme Skoru', value: `${mainResult.score}/10`, inline: true }
                    )
                    .setFooter({ text: 'Kodla Dev bilgi bankasından' })
                    .setTimestamp();

                // Diğer sonuçları da ekle
                if (results.length > 1) {
                    const otherResults = results.slice(1, 3).map((r, i) =>
                        `**${i + 2}.** ${r.question} (Skor: ${r.score})`
                    ).join('\n');

                    if (otherResults) {
                        embed.addFields({ name: '📚 İlgili Diğer Sorular', value: otherResults, inline: false });
                    }
                }

                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('😔 Sonuç Bulunamadı')
                    .setDescription('Bu konuda henüz bilgi bankamda veri bulunamadı.')
                    .addFields(
                        { name: '💡 Önerim', value: 'Farklı kelimeler kullanarak tekrar deneyin veya [Kodla Dev YouTube Kanalı](https://youtube.com/@kodla_dev) ziyaret edin!', inline: false }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Araştırma hatası:', error);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Araştırma Hatası')
                .setDescription('Araştırma sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }

    async handleNewVideoCommand(interaction) {
        const isim = interaction.options.getString('isim');
        const aciklama = interaction.options.getString('aciklama');
        const link = interaction.options.getString('link');

        try {
            // Video ID'sini linkten çıkar
            let videoId = null;
            const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
            const match = link.match(youtubeRegex);

            if (match) {
                videoId = match[1];
            }

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🎬 YENİ VİDEO')
                .setDescription(`**${isim}**`)
                .addFields(
                    { name: '📝 Açıklama', value: aciklama, inline: false },
                    { name: '🔗 Link', value: `[Videoyu İzle](${link})`, inline: false }
                )
                .setFooter({
                    text: 'Kodla Dev - Yeni Video Bildirimi',
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Eğer YouTube linki ise thumbnail ekle
            if (videoId) {
                embed.setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
            }

            await interaction.reply({
                content: '🔔 **YENİ VİDEO YAYINLANDI!** @everyone',
                embeds: [embed]
            });

            console.log(`📹 Yeni video paylaşıldı: ${isim}`);

        } catch (error) {
            console.error('Yeni video paylaşım hatası:', error);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Paylaşım Hatası')
                .setDescription('Video paylaşılırken bir hata oluştu.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    async handleAIQuestionCommand(interaction) {
        const question = interaction.options.getString('soru');

        // Yükleniyor mesajı
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#4285f4')
                .setTitle('🤖Kodla AI Düşünüyor...')
                .setDescription(`"${question}" sorunuz için en iyi cevabı hazırlıyorum...`)
                .setTimestamp()]
        });

        try {
            // Önce dataset'te ara
            const datasetResult = this.simpleSearcher.searchInDataset(question);
            let context = '';

            if (datasetResult) {
                context = `Mevcut bilgi: ${datasetResult.answer}`;
            }

            //Kodla AI'dan cevap al
            const aiResult = await this.geminiAI.generateResponse(question, context);

            if (aiResult.success) {
                const embed = new EmbedBuilder()
                    .setColor('#4285f4')
                    .setTitle('🤖Kodla AI Cevabı')
                    .setDescription(aiResult.text)
                    .addFields(
                        { name: '❓ Sorunuz', value: question, inline: false },
                        { name: '🧠 AI Model', value: aiResult.model, inline: true }
                    )
                    .setFooter({ text: 'Kodla Dev AI - Gemini Pro ile desteklenmektedir' })
                    .setTimestamp();

                if (datasetResult) {
                    embed.addFields({ name: '📚 Dataset Eşleşmesi', value: `✅ Skor: ${datasetResult.score}`, inline: true });
                }

                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('❌ AI Hatası')
                    .setDescription(aiResult.fallback || 'AI sisteminde bir sorun oluştu.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('AI soru hatası:', error);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Sistem Hatası')
                .setDescription('AI sisteminde bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }

    async handleCodeExampleCommand(interaction) {
        const topic = interaction.options.getString('konu');
        const difficulty = interaction.options.getString('seviye') || 'beginner';

        // Yükleniyor mesajı
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#00d4aa')
                .setTitle('💻 Kod Örneği Hazırlanıyor...')
                .setDescription(`"${topic}" konusunda ${difficulty === 'beginner' ? 'başlangıç' : difficulty === 'intermediate' ? 'orta' : 'ileri'} seviye kod örneği hazırlıyorum...`)
                .setTimestamp()]
        });

        try {
            const result = await this.geminiAI.generateCodeExample(topic, difficulty);

            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#00d4aa')
                    .setTitle('💻 Kod Örneği')
                    .setDescription(result.text)
                    .addFields(
                        { name: '📚 Konu', value: topic, inline: true },
                        { name: '📊 Seviye', value: difficulty === 'beginner' ? 'Başlangıç' : difficulty === 'intermediate' ? 'Orta' : 'İleri', inline: true }
                    )
                    .setFooter({ text: 'Kodla Dev AI - Gemini Pro ile oluşturuldu' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('❌ Kod Örneği Oluşturulamadı')
                    .setDescription('Kod örneği oluşturulurken bir hata oluştu.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Kod örneği hatası:', error);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Sistem Hatası')
                .setDescription('Kod örneği oluşturulurken bir hata oluştu.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }

    start() {
        this.client.login(process.env.DISCORD_TOKEN);
    }
}

// Bot'u başlat
const bot = new KodlaDevBot();
bot.start();