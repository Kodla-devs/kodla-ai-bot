const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Kodla Dev kanalı için özel prompt
        this.systemPrompt = `Sen Kodla Dev YouTube kanalının AI asistanısın. 
        
Görevin:
- Python programlama, yapay zeka, oyun geliştirme ve web programlama konularında yardım etmek
- Kodla Dev kanalının tarzında cevaplar vermek (samimi, öğretici, Türkçe)
- Kod örnekleri verirken açıklayıcı olmak
- Başlangıç seviyesinden ileri seviyeye kadar herkese uygun cevaplar vermek

Kurallar:
- Her zaman Türkçe cevap ver
- Kod örnekleri verirken açıklama ekle
- Karmaşık konuları basit şekilde anlat
- Kodla Dev kanalını referans gösterebilirsin
- Eğer bir konuda emin değilsen, "Bu konuda daha detaylı bilgi için Kodla Dev kanalındaki videoları izleyebilirsin" de

Tarzın: Samimi, öğretici, yardımsever, şakaçı , Türkçe`;
    }

    async generateResponse(userMessage, context = '') {
        try {
            console.log(`🤖Kodla AI'ya gönderiliyor: "${userMessage.substring(0, 50)}..."`);
            
            // Prompt'u hazırla
            const fullPrompt = `${this.systemPrompt}

${context ? `Bağlam: ${context}` : ''}

Kullanıcı sorusu: ${userMessage}

Lütfen Kodla Dev tarzında, Türkçe ve yardımcı bir cevap ver:`;

            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅Kodla AI cevap verdi: ${text.length} karakter`);
            return {
                success: true,
                text: text,
                model: 'Gemini Pro'
            };
            
        } catch (error) {
            console.error('❌Kodla AI hatası:', error);
            return {
                success: false,
                error: error.message,
                fallback: 'Üzgünüm, şu anda AI sistemimde bir sorun var. Lütfen daha sonra tekrar deneyin.'
            };
        }
    }

    async generateCodeExample(topic, difficulty = 'beginner') {
        try {
            const prompt = `${this.systemPrompt}

Konu: ${topic}
Seviye: ${difficulty}

Lütfen bu konu hakkında:
1. Kısa bir açıklama
2. Pratik bir kod örneği
3. Kodun açıklaması
4. Kullanım alanları

Kodla Dev tarzında, Türkçe olarak hazırla:`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return {
                success: true,
                text: text,
                type: 'code_example'
            };
            
        } catch (error) {
            console.error('❌ Kod örneği oluşturma hatası:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async improveDatasetAnswer(question, currentAnswer) {
        try {
            const prompt = `${this.systemPrompt}

Mevcut soru-cevap çiftini geliştir:

Soru: ${question}
Mevcut Cevap: ${currentAnswer}

Lütfen bu cevabı:
1. Daha detaylı hale getir
2. Kod örneği ekle (gerekirse)
3. Kodla Dev tarzında yeniden yaz
4. Daha öğretici yap

Geliştirilmiş cevap:`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return {
                success: true,
                text: text,
                improved: true
            };
            
        } catch (error) {
            console.error('❌ Cevap geliştirme hatası:', error);
            return {
                success: false,
                fallback: currentAnswer
            };
        }
    }

    async analyzeUserIntent(message) {
        try {
            const prompt = `Kullanıcı mesajını analiz et ve kategorize et:

Mesaj: "${message}"

Kategoriler:
- python_question: Python ile ilgili soru
- ai_question: Yapay zeka ile ilgili soru
- game_dev: Oyun geliştirme sorusu
- web_dev: Web geliştirme sorusu
- code_help: Kod yardımı
- general: Genel soru
- greeting: Selamlama
- other: Diğer

Sadece kategori adını döndür:`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const category = response.text().trim().toLowerCase();
            
            return category;
            
        } catch (error) {
            console.error('❌ Intent analizi hatası:', error);
            return 'general';
        }
    }
}

module.exports = GeminiAI;