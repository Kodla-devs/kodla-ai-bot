const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');

class YouTubeSearcher {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    }

    async searchVideos(query, maxResults = 5) {
        try {
            console.log(`🔍 YouTube'da aranıyor: "${query}"`);
            
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    part: 'snippet',
                    q: `${query} kodla dev`,
                    type: 'video',
                    maxResults: maxResults,
                    key: this.apiKey,
                    order: 'relevance'
                }
            });

            const videos = response.data.items.map(item => ({
                videoId: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails.default.url
            }));

            console.log(`📹 ${videos.length} video bulundu`);
            return videos;

        } catch (error) {
            console.error('❌ YouTube arama hatası:', error.message);
            return [];
        }
    }

    async getVideoTranscript(videoId) {
        try {
            console.log(`📝 Transkript alınıyor: ${videoId}`);
            
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);

            if (transcript && transcript.length > 0) {
                const fullText = transcript.map(item => item.text).join(' ');
                console.log(`✅ Transkript alındı: ${fullText.length} karakter`);
                return this.cleanTranscript(fullText);
            }

            return null;
        } catch (error) {
            console.log(`⚠️ Transkript alınamadı (${videoId}): ${error.message}`);
            return null;
        }
    }

    cleanTranscript(text) {
        // Zaman damgalarını ve gereksiz karakterleri temizle
        text = text.replace(/\d{1,2}:\d{2}\s*->\s*\d{1,2}:\d{2}/g, '');
        text = text.replace(/\[.*?\]/g, '');
        text = text.replace(/\([^)]*(?:müzik|alkış|gülüş|ses|efekt)[^)]*\)/gi, '');
        text = text.replace(/\s+/g, ' ');
        text = text.trim();
        return text;
    }

    async searchAndAnalyze(query) {
        console.log(`🚀 Gerçek zamanlı analiz başlıyor: "${query}"`);
        
        // 1. YouTube'da video ara
        const videos = await this.searchVideos(query);
        
        if (videos.length === 0) {
            return {
                success: false,
                message: 'İlgili video bulunamadı.'
            };
        }

        // 2. İlk birkaç videonun transkriptini al
        const results = [];
        
        for (let i = 0; i < Math.min(3, videos.length); i++) {
            const video = videos[i];
            const transcript = await this.getVideoTranscript(video.videoId);
            
            if (transcript) {
                results.push({
                    title: video.title,
                    videoId: video.videoId,
                    transcript: transcript,
                    url: `https://youtube.com/watch?v=${video.videoId}`
                });
            }
        }

        if (results.length === 0) {
            return {
                success: false,
                message: 'Videolarda transkript bulunamadı.'
            };
        }

        // 3. En uygun cevabı bul
        const answer = this.findBestAnswer(query, results);
        
        return {
            success: true,
            answer: answer,
            sources: results.map(r => ({
                title: r.title,
                url: r.url
            }))
        };
    }

    findBestAnswer(query, results) {
        const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
        let bestMatch = null;
        let bestScore = 0;

        for (const result of results) {
            const transcript = result.transcript.toLowerCase();
            let score = 0;

            // Kelime eşleşmesi skorla
            for (const word of queryWords) {
                const matches = (transcript.match(new RegExp(word, 'g')) || []).length;
                score += matches;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = result;
            }
        }

        if (bestMatch) {
            // İlgili kısmı çıkar (soruda geçen kelimelerin etrafındaki metin)
            const sentences = bestMatch.transcript.split('.');
            const relevantSentences = [];

            for (const sentence of sentences) {
                const sentenceLower = sentence.toLowerCase();
                const hasKeyword = queryWords.some(word => sentenceLower.includes(word));
                
                if (hasKeyword && sentence.trim().length > 20) {
                    relevantSentences.push(sentence.trim());
                }
            }

            if (relevantSentences.length > 0) {
                return {
                    text: relevantSentences.slice(0, 3).join('. ') + '.',
                    source: bestMatch.title,
                    url: bestMatch.url
                };
            }
        }

        // Fallback: İlk videonun başından bir kısım
        if (results.length > 0) {
            const firstResult = results[0];
            const sentences = firstResult.transcript.split('.').slice(0, 3);
            
            return {
                text: sentences.join('. ') + '.',
                source: firstResult.title,
                url: firstResult.url
            };
        }

        return null;
    }
}

module.exports = YouTubeSearcher;