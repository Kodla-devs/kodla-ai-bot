require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Get configuration from environment variables
const PREFIX = process.env.BOT_PREFIX || '!';
const BOT_STATUS = process.env.BOT_STATUS || 'online';
const BOT_ACTIVITY = process.env.BOT_ACTIVITY || 'Listening to !ping';

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`🔧 Prefix: ${PREFIX}`);
    console.log(`📊 Status: ${BOT_STATUS}`);
    console.log(`🎯 Activity: ${BOT_ACTIVITY}`);
    
    // Set bot activity
    client.user.setPresence({
        activities: [{
            name: BOT_ACTIVITY,
            type: ActivityType.Listening
        }],
        status: BOT_STATUS
    });
});

// Listen for messages
client.on('messageCreate', message => {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    // Check if message starts with prefix
    if (!message.content.startsWith(PREFIX)) return;
    
    // Parse command and arguments
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Ping command
    if (command === 'ping') {
        const sent = message.createdTimestamp;
        const received = Date.now();
        const ping = received - sent;
        const apiPing = Math.round(client.ws.ping);
        
        message.reply({
            content: `🏓 **Pong!**\n` +
                    `📨 **Message Latency:** \`${ping}ms\`\n` +
                    `🌐 **API Latency:** \`${apiPing}ms\``
        });
    }
});

// Error handling
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        console.error('❌ Failed to login:', error);
        process.exit(1);
    });