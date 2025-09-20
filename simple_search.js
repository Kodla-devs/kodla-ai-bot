const fs = require('fs');
const path = require('path');

class SimpleSearcher {
    constructor() {
        this.dataset = this.loadDataset();
    }

    loadDataset() {
        try {
            const datasetPath = path.join(__dirname, 'kodla_dev_dataset.jsonl');
            if (fs.existsSync(datasetPath)) {
                const data = fs.readFileSync(datasetPath, 'utf8');
                const lines = data.trim().split('\n');
                const dataset = lines.map(line => JSON.parse(line));
                console.log(`📚 ${dataset.length} veri yüklendi (SimpleSearcher)`);
                return dataset;
            } else {
                console.log('⚠️ Dataset dosyası bulunamadı (SimpleSearcher)');
                return [];
            }
        } catch (error) {
            console.error('❌ Dataset yükleme hatası:', error);
            return [];
        }
    }

    searchInDataset(query) {
        console.log(`🔍 Dataset'te aranıyor: "${query}"`);
        
        if (this.dataset.length === 0) {
            return null;
        }

        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ').filter(word => word.length > 2);
        
        let bestMatch = null;
        let bestScore = 0;

        // Dataset'teki her soru-cevap çiftini kontrol et
        for (const item of this.dataset) {
            const userMessage = item.messages.find(m => m.role === 'user');
            const assistantMessage = item.messages.find(m => m.role === 'assistant');

            if (userMessage && assistantMessage) {
                const questionLower = userMessage.content.toLowerCase();
                const answerLower = assistantMessage.content.toLowerCase();
                
                let score = 0;

                // Soru kısmında kelime eşleşmesi
                for (const word of queryWords) {
                    if (questionLower.includes(word)) {
                        score += 3; // Soruda eşleşme daha değerli
                    }
                    if (answerLower.includes(word)) {
                        score += 1; // Cevapta eşleşme
                    }
                }

                // Tam eşleşme bonusu
                if (questionLower.includes(queryLower)) {
                    score += 10;
                }

                console.log(`📝 "${userMessage.content}" - Skor: ${score}`);

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        question: userMessage.content,
                        answer: assistantMessage.content,
                        score: score
                    };
                }
            }
        }

        if (bestMatch && bestMatch.score > 0) {
            console.log(`✅ En iyi eşleşme bulundu (Skor: ${bestMatch.score})`);
            return bestMatch;
        }

        console.log('❌ Uygun eşleşme bulunamadı');
        return null;
    }

    // Gelişmiş arama - birden fazla sonuç döndür
    searchMultiple(query, limit = 3) {
        console.log(`🔍 Çoklu arama: "${query}"`);
        
        if (this.dataset.length === 0) {
            return [];
        }

        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ').filter(word => word.length > 2);
        
        const matches = [];

        for (const item of this.dataset) {
            const userMessage = item.messages.find(m => m.role === 'user');
            const assistantMessage = item.messages.find(m => m.role === 'assistant');

            if (userMessage && assistantMessage) {
                const questionLower = userMessage.content.toLowerCase();
                const answerLower = assistantMessage.content.toLowerCase();
                
                let score = 0;

                for (const word of queryWords) {
                    if (questionLower.includes(word)) {
                        score += 3;
                    }
                    if (answerLower.includes(word)) {
                        score += 1;
                    }
                }

                if (questionLower.includes(queryLower)) {
                    score += 10;
                }

                if (score > 0) {
                    matches.push({
                        question: userMessage.content,
                        answer: assistantMessage.content,
                        score: score
                    });
                }
            }
        }

        // Skora göre sırala ve limit kadar döndür
        matches.sort((a, b) => b.score - a.score);
        return matches.slice(0, limit);
    }

    // Konu bazlı arama
    searchByTopic(topic) {
        const topicKeywords = {
            'python': ['python', 'programlama', 'kod', 'fonksiyon', 'değişken', 'liste'],
            'yapay zeka': ['yapay zeka', 'ai', 'machine learning', 'tensorflow', 'pytorch'],
            'oyun': ['oyun', 'game', 'geliştirme', 'unity', 'pygame'],
            'web': ['web', 'html', 'css', 'javascript', 'react', 'node']
        };

        const keywords = topicKeywords[topic.toLowerCase()] || [topic];
        const query = keywords.join(' ');
        
        return this.searchMultiple(query, 5);
    }
}

module.exports = SimpleSearcher;