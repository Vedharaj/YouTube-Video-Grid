'use client';

import { useState, useEffect } from 'react';
import DndWrapper from '@/components/DndWrapper';
import VideoGrid from '@/components/VideoGrid';
import UrlInput from '@/components/UrlInput';

export default function Home() {
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('multiYoutubeUrls');
    if (saved) {
      setVideoUrls(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('multiYoutubeUrls', JSON.stringify(videoUrls));
  }, [videoUrls]);

  const handleAddUrl = (url: string): boolean => {
    let added = false;
    setVideoUrls(prev => {
      // Avoid duplicates
      if (prev.includes(url)) {
        console.log('Duplicate URL skipped:', url);
        added = false;
        return prev;
      }
      const newUrls = [...prev, url];
      console.log('Updated videoUrls:', newUrls);  // Logs the NEW state
      added = true;
      return newUrls;
    });
    return added;
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setVideoUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  return (
    <DndWrapper backend="html5">
      <main className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8">YouTube Video Grid</h1>
          <UrlInput onAddUrl={handleAddUrl} />
          <VideoGrid 
            initialUrls={videoUrls} 
            onRemoveUrl={handleRemoveUrl}
          />
        </div>
      </main>
    </DndWrapper>
  );
}
