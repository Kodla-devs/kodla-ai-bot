# Kodla Dev AI Discord Bot Projesi

Bu proje iki ana bileşenden oluşur:
1. **Python Backend**: YouTube kanal analizi ve AI dataset oluşturma
2. **Node.js Discord Bot**: AI destekli Discord botu

## 🏗️ Proje Yapısı

```
kodla-dev-bot/
├── 🐍 Python Backend
│   ├── youtube_analyzer.py     # Ana analiz scripti
│   ├── demo_analyzer.py        # Test için demo
│   ├── requirements.txt        # Python bağımlılıkları
│   └── kodla_dev_dataset.jsonl # Oluşturulan dataset
├── 🤖 Discord Bot
│   ├── bot.js                  # Ana bot dosyası
│   ├── package.json           # Node.js bağımlılıkları
│   └── .env                   # Environment variables
└── 📚 Çıktılar
    ├── combined_transcripts.txt
    └── kodla_dev_dataset.jsonl
```

## 🚀 Kurulum

### 1. Python Backend Kurulumu

```bash
# Python kütüphanelerini yükle
pip install -r requirements.txt

# YouTube API anahtarını youtube_analyzer.py dosyasına gir
# Google Cloud Console'dan YouTube Data API v3 anahtarı al
```

### 2. Discord Bot Kurulumu

```bash
# Node.js bağımlılıklarını yükle
npm install

# Environment dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle:
# - DISCORD_TOKEN: Discord Developer Portal'dan
# - CLIENT_ID: Bot Application ID
# - YOUTUBE_API_KEY: Google Cloud Console'dan
```

## 📋 Kullanım

### Adım 1: Dataset Oluştur (Python)
```bash
python youtube_analyzer.py
```

### Adım 2: Discord Bot'u Başlat (Node.js)
```bash
npm start
# veya geliştirme için:
npm run dev
```

## 🤖 Bot Komutları

- `/yardim` - Bot hakkında bilgi
- `/soru <soru>` - AI'ya soru sor
- `/istatistik` - Bot istatistikleri
- `/kanal` - Kodla Dev kanalı bilgisi

## ✨ Özellikler

### Python Backend:
✅ YouTube kanal analizi
✅ Otomatik transkript çekme
✅ Metin temizleme ve işleme
✅ Soru-cevap dataset oluşturma
✅ JSONL format export

### Discord Bot:
✅ Slash komutları
✅ AI destekli soru-cevap
✅ Otomatik mesaj algılama
✅ Embed mesajları
✅ İstatistik takibi

## 🔧 API Anahtarları

1. **YouTube Data API v3**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Discord Bot Token**: [Discord Developer Portal](https://discord.com/developers/applications)

## 📊 Dataset Formatı

```json
{"messages": [{"role": "user", "content": "Soru"}, {"role": "assistant", "content": "Cevap"}]}
```