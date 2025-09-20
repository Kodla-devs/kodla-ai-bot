#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube Kanal Analizi ve Fine-tuning Dataset Oluşturucu
Kodla Dev kanalı için özel geliştirilmiştir.
"""

import os
import json
import re
import time
from typing import List, Dict, Optional
import requests
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


class YouTubeAnalyzer:
    def __init__(self, api_key: str, channel_url: str):
        self.api_key = api_key
        self.channel_url = channel_url
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        self.channel_id = self._extract_channel_id()
        self.videos = []
        self.transcripts = {}
        
    def _extract_channel_id(self) -> str:
        if '@' in self.channel_url:
            username = self.channel_url.split('@')[-1]
            try:
                response = self.youtube.channels().list(
                    part='id',
                    forUsername=username
                ).execute()
                
                if response['items']:
                    return response['items'][0]['id']
                else:
                    search_response = self.youtube.search().list(
                        part='snippet',
                        q=username,
                        type='channel',
                        maxResults=1
                    ).execute()
                    
                    if search_response['items']:
                        return search_response['items'][0]['snippet']['channelId']
                        
            except HttpError as e:
                print(f"Kanal ID bulunamadı: {e}")
                return None
        
        return None
    
    def get_channel_videos(self) -> List[Dict]:
        videos = []
        next_page_token = None
        
        print("📹 Kanal videoları alınıyor...")
        
        while True:
            try:
                request = self.youtube.search().list(
                    part='snippet',
                    channelId=self.channel_id,
                    type='video',
                    order='date',
                    maxResults=50,
                    pageToken=next_page_token
                )
                
                response = request.execute()
                
                for item in response['items']:
                    video_data = {
                        'video_id': item['id']['videoId'],
                        'title': item['snippet']['title'],
                        'description': item['snippet']['description'],
                        'published_at': item['snippet']['publishedAt'],
                        'thumbnail': item['snippet']['thumbnails']['default']['url']
                    }
                    videos.append(video_data)
                    print(f"✅ Video bulundu: {video_data['title'][:50]}...")
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
                    
                time.sleep(0.1)
                
            except HttpError as e:
                print(f"❌ Video listesi alınırken hata: {e}")
                break
        
        self.videos = videos
        print(f"🎯 Toplam {len(videos)} video bulundu!")
        return videos
    
    def get_video_transcript(self, video_id: str) -> Optional[str]:
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
    
    def collect_all_transcripts(self) -> Dict[str, str]:
        print("\n📝 Transkriptler toplanıyor...")
        
        for i, video in enumerate(self.videos, 1):
            video_id = video['video_id']
            title = video['title']
            
            print(f"[{i}/{len(self.videos)}] {title[:40]}...")
            
            transcript = self.get_video_transcript(video_id)
            if transcript:
                self.transcripts[video_id] = {
                    'title': title,
                    'transcript': transcript
                }
                print(f"✅ Transkript alındı ({len(transcript)} karakter)")
            else:
                print("❌ Transkript alınamadı")
            
            time.sleep(0.5)
        
        print(f"\n🎯 {len(self.transcripts)} videonun transkripti başarıyla alındı!")
        return self.transcripts
    
    def clean_transcript_text(self, text: str) -> str:
        text = re.sub(r'\d{1,2}:\d{2}\s*->\s*\d{1,2}:\d{2}', '', text)
        text = re.sub(r'\d{1,2}:\d{2}:\d{2}\s*->\s*\d{1,2}:\d{2}:\d{2}', '', text)
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'\([^)]*(?:müzik|alkış|gülüş|ses|efekt)[^)]*\)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n', text)
        text = text.strip()
        return text
    
    def save_combined_transcript(self, filename: str = "combined_transcripts.txt"):
        print(f"\n📄 Transkriptler birleştiriliyor: {filename}")
        
        combined_text = ""
        
        for video_id, data in self.transcripts.items():
            title = data['title']
            transcript = data['transcript']
            
            combined_text += f"\n{'='*80}\n"
            combined_text += f"VİDEO: {title}\n"
            combined_text += f"{'='*80}\n\n"
            
            cleaned_transcript = self.clean_transcript_text(transcript)
            combined_text += cleaned_transcript + "\n\n"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(combined_text)
        
        print(f"✅ {len(self.transcripts)} video transkripti {filename} dosyasına kaydedildi!")
        print(f"📊 Toplam karakter sayısı: {len(combined_text):,}")
        
        return combined_text
    
    def generate_qa_pairs(self, text: str, min_pairs: int = 100) -> List[Dict]:
        print(f"\n🤖 Soru-cevap çiftleri üretiliyor (hedef: {min_pairs} adet)...")
        
        qa_pairs = []
        
        manual_qa_templates = [
            {
                "question": "Kodla Dev kanalında hangi konular işleniyor?",
                "answer": "Kodla Dev kanalında Python programlama, yapay zeka, oyun geliştirme, web geliştirme ve yazılım mühendisliği konuları işlenmektedir."
            },
            {
                "question": "Python öğrenmeye nereden başlamalıyım?",
                "answer": "Python öğrenmeye temel syntax ve veri tipleri ile başlamalısınız. Değişkenler, listeler, döngüler ve fonksiyonları öğrendikten sonra daha ileri konulara geçebilirsiniz."
            },
            {
                "question": "Yapay zeka projelerinde hangi kütüphaneler kullanılır?",
                "answer": "Yapay zeka projelerinde genellikle TensorFlow, PyTorch, scikit-learn, pandas ve numpy gibi kütüphaneler kullanılır."
            }
        ]
        
        for template in manual_qa_templates:
            qa_pairs.append({
                "question": template["question"],
                "answer": template["answer"]
            })
        
        return qa_pairs
    
    def extract_qa_from_text(self, text: str) -> List[Dict]:
        qa_pairs = []
        
        sentences = text.split('.')
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:
                continue
                
            if any(keyword in sentence.lower() for keyword in ['python', 'kod', 'program', 'fonksiyon', 'değişken']):
                if 'nedir' in sentence.lower() or 'ne işe yarar' in sentence.lower():
                    qa_pairs.append({
                        "question": sentence + "?",
                        "answer": "Bu konuda detaylı bilgi için Kodla Dev kanalındaki ilgili videoları izleyebilirsiniz."
                    })
                elif len(sentence) > 30:
                    if 'python' in sentence.lower():
                        question = f"Python'da {sentence.lower().split('python')[1].strip()[:30]}... nasıl yapılır?"
                        qa_pairs.append({
                            "question": question,
                            "answer": sentence
                        })
        
        return qa_pairs
    
    def create_jsonl_dataset(self, qa_pairs: List[Dict], filename: str = "kodla_dev_dataset.jsonl"):
        print(f"\n💾 Dataset oluşturuluyor: {filename}")
        
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
        
        print(f"✅ {len(qa_pairs)} soru-cevap çifti {filename} dosyasına kaydedildi!")
        return filename
    
    def run_full_analysis(self):
        print("🚀 Kodla Dev YouTube Kanal Analizi Başlıyor...\n")
        
        videos = self.get_channel_videos()
        if not videos:
            print("❌ Video bulunamadı!")
            return
        
        transcripts = self.collect_all_transcripts()
        if not transcripts:
            print("❌ Hiç transkript alınamadı!")
            return
        
        combined_text = self.save_combined_transcript()
        
        qa_pairs = self.generate_qa_pairs(combined_text)
        
        auto_qa = self.extract_qa_from_text(combined_text)
        qa_pairs.extend(auto_qa)
        
        print(f"🎯 Toplam {len(qa_pairs)} soru-cevap çifti oluşturuldu!")
        
        dataset_file = self.create_jsonl_dataset(qa_pairs)
        
        print(f"\n🎉 Analiz tamamlandı!")
        print(f"📊 İstatistikler:")
        print(f"   - Video sayısı: {len(self.videos)}")
        print(f"   - Transkript sayısı: {len(self.transcripts)}")
        print(f"   - Soru-cevap sayısı: {len(qa_pairs)}")
        print(f"   - Dataset dosyası: {dataset_file}")


def main():
    # .env dosyasından API anahtarını oku
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    API_KEY = os.getenv('YOUTUBE_API_KEY')
    CHANNEL_URL = "https://youtube.com/@kodla_dev"
    
    if not API_KEY or API_KEY == "your_youtube_api_key_here":
        print("⚠️  Lütfen YouTube API anahtarınızı .env dosyasına girin!")
        print("Google Cloud Console'dan YouTube Data API v3 anahtarı alabilirsiniz.")
        print("YOUTUBE_API_KEY=your_api_key_here")
        return
    
    analyzer = YouTubeAnalyzer(API_KEY, CHANNEL_URL)
    analyzer.run_full_analysis()


if __name__ == "__main__":
    main()