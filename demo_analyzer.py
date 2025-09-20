#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demo YouTube Analyzer - API anahtarı olmadan test için
Kodla Dev kanalından örnek video ID'leri ile çalışır
"""

import json
import re
import time
from typing import List, Dict, Optional
from youtube_transcript_api import YouTubeTranscriptApi

class DemoYouTubeAnalyzer:
    def __init__(self):
        """Demo analyzer başlatır"""
        # Kodla Dev kanalından örnek video ID'leri
        self.sample_video_ids = [
            "dQw4w9WgXcQ",  # Örnek ID - gerçek video ID'leri ile değiştirin
            "jNQXAC9IVRw",  # Örnek ID - gerçek video ID'leri ile değiştirin
            # Daha fazla video ID ekleyebilirsiniz
        ]
        self.transcripts = {}
        
    def get_video_transcript(self, video_id: str) -> Optional[str]:
        """Tek bir videonun transkriptini alır"""
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            try:
                transcript = transcript_list.find_transcript(['tr'])
            except:
                try:
                    transcript = transcript_list.find_transcript(['en'])
                except:
                    transcript = transcript_list.find_generated_transcript(['tr', 'en'])
            
            transcript_data = transcript.fetch()
            
            full_text = ""
            for entry in transcript_data:
                full_text += entry['text'] + " "
            
            return full_text.strip()
            
        except Exception as e:
            print(f"⚠️  {video_id} için transkript alınamadı: {str(e)}")
            return None
    
    def collect_sample_transcripts(self):
        """Örnek video transkriptlerini toplar"""
        print("📝 Örnek transkriptler toplanıyor...")
        
        for i, video_id in enumerate(self.sample_video_ids, 1):
            print(f"[{i}/{len(self.sample_video_ids)}] Video ID: {video_id}")
            
            transcript = self.get_video_transcript(video_id)
            if transcript:
                self.transcripts[video_id] = {
                    'title': f"Örnek Video {i}",
                    'transcript': transcript
                }
                print(f"✅ Transkript alındı ({len(transcript)} karakter)")
            else:
                print("❌ Transkript alınamadı")
            
            time.sleep(0.5)
        
        print(f"\n🎯 {len(self.transcripts)} videonun transkripti alındı!")
    
    def clean_transcript_text(self, text: str) -> str:
        """Transkript metnini temizler"""
        # Zaman damgalarını kaldır
        text = re.sub(r'\d{1,2}:\d{2}\s*->\s*\d{1,2}:\d{2}', '', text)
        text = re.sub(r'\d{1,2}:\d{2}:\d{2}\s*->\s*\d{1,2}:\d{2}:\d{2}', '', text)
        
        # Köşeli parantez içindeki ifadeleri kaldır
        text = re.sub(r'\[.*?\]', '', text)
        
        # Ses efektlerini kaldır
        text = re.sub(r'\([^)]*(?:müzik|alkış|gülüş|ses|efekt)[^)]*\)', '', text, flags=re.IGNORECASE)
        
        # Fazla boşlukları temizle
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n', text)
        text = text.strip()
        
        return text
    
    def generate_sample_qa_pairs(self) -> List[Dict]:
        """Örnek soru-cevap çiftleri üretir"""
        qa_pairs = [
            {
                "question": "Python programlamaya nasıl başlarım?",
                "answer": "Python programlamaya başlamak için önce Python'ı bilgisayarınıza kurmalısınız. Sonra temel syntax, değişkenler ve veri tipleri ile başlayabilirsiniz."
            },
            {
                "question": "Kodla Dev kanalında hangi konular var?",
                "answer": "Kodla Dev kanalında Python, yapay zeka, oyun geliştirme ve web programlama konuları bulunmaktadır."
            },
            {
                "question": "Python'da liste nasıl oluşturulur?",
                "answer": "Python'da liste oluşturmak için köşeli parantez kullanılır. Örnek: my_list = [1, 2, 3, 'hello']"
            },
            {
                "question": "Yapay zeka öğrenmek için hangi dil önerilir?",
                "answer": "Yapay zeka öğrenmek için Python dili önerilir çünkü TensorFlow, PyTorch gibi güçlü kütüphanelere sahiptir."
            },
            {
                "question": "Python'da fonksiyon nasıl tanımlanır?",
                "answer": "Python'da fonksiyon def anahtar kelimesi ile tanımlanır. Örnek: def my_function(): return 'Hello'"
            }
        ]
        
        return qa_pairs
    
    def create_jsonl_dataset(self, qa_pairs: List[Dict], filename: str = "demo_dataset.jsonl"):
        """JSONL dataset oluşturur"""
        print(f"\n💾 Demo dataset oluşturuluyor: {filename}")
        
        with open(filename, 'w', encoding='utf-8') as f:
            for qa in qa_pairs:
                json_obj = {
                    "messages": [
                        {
                            "role": "user",
                            "content": qa["question"]
                        },
                        {
                            "role": "assistant", 
                            "content": qa["answer"]
                        }
                    ]
                }
                f.write(json.dumps(json_obj, ensure_ascii=False) + '\n')
        
        print(f"✅ {len(qa_pairs)} soru-cevap çifti kaydedildi!")
        return filename
    
    def run_demo(self):
        """Demo analizi çalıştırır"""
        print("🚀 Demo YouTube Analizi Başlıyor...\n")
        
        # Örnek transkriptleri topla
        self.collect_sample_transcripts()
        
        # Örnek soru-cevap çiftleri üret
        qa_pairs = self.generate_sample_qa_pairs()
        
        # Dataset oluştur
        dataset_file = self.create_jsonl_dataset(qa_pairs)
        
        print(f"\n🎉 Demo tamamlandı!")
        print(f"📊 İstatistikler:")
        print(f"   - Transkript sayısı: {len(self.transcripts)}")
        print(f"   - Soru-cevap sayısı: {len(qa_pairs)}")
        print(f"   - Dataset dosyası: {dataset_file}")


if __name__ == "__main__":
    demo = DemoYouTubeAnalyzer()
    demo.run_demo()