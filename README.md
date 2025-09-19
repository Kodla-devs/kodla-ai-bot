# kodla-ai-bot
Adımlar (numaralandırılmış, bağımlılık ile)

Discord veri seti oluşturma

Discord kanallarındaki mesajları, kullanıcı rol/kanal meta verilerini ve kontekst pencerelerini içeren temizlenmiş veri seti üretilecek (CSV/JSON/Parquet).

Output: fine-tune hazır veri (ör. instruction-style pairs veya conversational turns).

Bağımlılık: 3. adım için zorunlu.

YouTube verilerini çekme (Python)

YouTube API ile video başlık, açıklama, altyazı (varsa) çekilecek; her video için basit metadata tutulacak.

Output: RAG için kullanılacak text parçaları + id/URL.

Bağımlılık: 4. adım için zorunlu.

Discord verisiyle model fine-tune (veya LoRA/peft)

adım tamamlandığında aynı kişi veya ekip fine-tune yapar (LoRA/LoCon önerilir hafif kaynaklarla).

Output: local deploy için quantize edilebilecek model/LoRA dosyası.

Bağımlılık: 1.

YouTube verileriyle RAG pipeline kurma

2. adımdan gelen veriler embed edilip (embedding modeli), vektör DB’ye atılacak; retrieval + prompt şablonları hazırlanacak.

İlk aşamada dummy veritabanı / küçük FAISS denemesi yeterli; prod için Milvus/Weaviate/VectorDB tercih edilebilir.

Küfür listesine göre metin analizi (Python)

Gelen metinleri küfür listesiyle eşleştirip skorlama yapan fonksiyon yazılacak. (negatif/orta/pozitif veya risk score)

Ayrıca hem mesaj hem URL içeriği için "saldırganlık, hakaret, hedef tipi" gibi etiketler dönecek.

Post içeriği ve link içeriğini düz metne dönüştürme (Python)

Eğer post içinde link varsa (YouTube, Twitter, web) otomatik fetch+parse yapıp sayfa metnini çıkaran modül.

Output: temiz text bloğu (4 için de kullanılabilir).

Modeli sunucuda llama.cpp ile ayağa kaldırma

Seçilen dili modelini (<=1B parametre) llama.cpp ile çalışır hâle getirecek kişi/görev. (GGUF/quantize vb.)

Not: modeli ayağa kaldıran kişi 8. adımın bazı alt maddelerini de yapacak (çünkü doğrudan çalışan modele erişimi olacak).

Önerilen model: Llama-3.2 1B (instruction tuned, 1B) — küçük, pratiktir ve yerelde çalıştırılabilecek 1B sınıfı bir seçenek. 
Hugging Face
+1

Prompt özelleştirme + öneri sistemi (model üzerinde)

5 ve 6’dan gelen etiket/skor/metinleri kullanarak prompt şablonları ve bir öneri (recommendation) katmanı hazırlama.

7’de ayağa kaldırılan model ile entegrasyon: RAG çağrıları, fallbacks, güvenlik filtreleri.

7’yi yapan kişi 8 ile yakın çalışmalı (veya aynı kişi olmalı).

Projeyi birleştirme / dummy entegrasyonlar

Önceki adımların mock/stub sürümleriyle uçtan uca test (ör. model hazırmış gibi davranıp discord fonksiyonlarını test etme).

9 ve 10 için prod hazır temizleme (dokümantasyon, deploy scriptleri) sonradan detaylandırılabilir.

Güvenlik & üretim hazır hâle getirme

Rate limiting, input sanitization, cevap filtreleri, logging, hata yönetimi, privacy (kullanıcı verisi saklama politikası).

Discord üzerinde çalışacak fonksiyonların yazılması (Python)

Komutlar (slash komutlar), webhook dinleme, moderation eventleri, message parser vs. yazılacak.

Bu adımda model çağrıları için test stubları kullanılarak bağımsız geliştirme yapılabilir.

Discord ↔ Model / RAG entegrasyonu (Python)

11’in yazdığı fonksiyonları gerçek model / RAG ile bağlama: çağrı, timeout, fallback mekanizmaları.

13+. Geliştirme sonrası ek özellikler
- Kullanıcı geribildirim arayüzü, dashboard, analytics, iyileştirme döngüleri.
