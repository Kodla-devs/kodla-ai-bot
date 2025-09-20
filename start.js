#!/usr/bin/env node

const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Kodla Dev AI Bot Başlatılıyor...\n');

// Environment dosyası kontrolü
if (!fs.existsSync('.env')) {
    console.log('⚠️  .env dosyası bulunamadı!');
    console.log('📝 .env.example dosyasını kopyalayıp .env olarak kaydedin');
    console.log('🔑 Discord token ve API anahtarlarınızı girin\n');
    process.exit(1);
}

// Dataset dosyası kontrolü
const datasetPath = path.join(__dirname, 'kodla_dev_dataset.jsonl');
if (!fs.existsSync(datasetPath)) {
    console.log('📚 Dataset dosyası bulunamadı!');
    console.log('🐍 Önce Python scriptini çalıştırın:');
    console.log('   python youtube_analyzer.py\n');
    
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('Dataset olmadan devam etmek istiyor musunuz? (y/N): ', (answer) => {
        readline.close();
        
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('👋 Önce dataset oluşturun, sonra tekrar deneyin!');
            process.exit(1);
        }
        
        startBot();
    });
} else {
    console.log('✅ Dataset dosyası bulundu!');
    startBot();
}

function startBot() {
    console.log('🤖 Discord bot başlatılıyor...\n');
    
    const bot = spawn('node', ['bot.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });
    
    bot.on('close', (code) => {
        console.log(`\n🔴 Bot kapandı (kod: ${code})`);
        
        if (code !== 0) {
            console.log('❌ Bot hata ile kapandı!');
            console.log('🔍 Lütfen .env dosyanızı ve token\'larınızı kontrol edin');
        }
    });
    
    bot.on('error', (error) => {
        console.error('❌ Bot başlatma hatası:', error);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Bot kapatılıyor...');
        bot.kill('SIGINT');
        process.exit(0);
    });
}