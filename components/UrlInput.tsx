'use client';

import { useState } from 'react';
import { extractVideoId, isLiveStream, getLiveVideoIdFromChannel } from '@/lib/youtube';

interface UrlInputProps {
  onAddUrl: (url: string) => boolean;
}

export default function UrlInput({ onAddUrl }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [apiKey] = useState(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '');  // Use public env for client

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsChecking(true);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a URL');
      setIsChecking(false);
      return;
    }

    let videoId = extractVideoId(trimmedUrl);
    let finalUrl = trimmedUrl;

    // If channel/live URL, try to fetch video ID
    if (!videoId && trimmedUrl.includes('/live') && apiKey) {
    // Match both /channel/, /c/, and /@handle/ URLs
    const match = trimmedUrl.match(/youtube\.com\/(?:channel\/([a-zA-Z0-9_-]+)|c\/([a-zA-Z0-9_-]+)|@([a-zA-Z0-9_-]+))/);
    const identifier = match?.[1] || match?.[2] || match?.[3];

    if (identifier) {
      videoId = await getLiveVideoIdFromChannel(identifier, apiKey);
      if (videoId) {
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
        onAddUrl(finalUrl);
        setUrl('');
        setIsChecking(false);
        return;
      }
    }
  }


    if (!videoId) {
      setError(
        'Invalid YouTube URL. Examples:\n' +
        '• https://www.youtube.com/watch?v=VIDEO_ID\n' +
        '• https://youtu.be/VIDEO_ID\n' +
        '• https://www.youtube.com/shorts/VIDEO_ID\n' +
        '• https://www.youtube.com/channel/UC.../live'
      );
      setIsChecking(false);
      return;
    }

    // Check if live
    const isLive = await isLiveStream(videoId);
    if (!isLive) {
      setError('This is not a live stream. Please add a live URL.');
      setIsChecking(false);
      return;
    }

    const added = onAddUrl(finalUrl);
    if (!added) {
      setError('This video is already added to the grid.');  // NEW: Duplicate feedback
      setIsChecking(false);
      return;
    }

    setUrl('');
    setIsChecking(false);
  };

  return (
    <div className="p-4 bg-white/6 backdrop-blur-sm border border-white/8 rounded-lg mb-4">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube live URL (e.g., https://www.youtube.com/watch?v=... or /live)"
          className="flex-1 px-3 py-2 bg-transparent border border-white/12 text-white placeholder:text-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={isChecking}
        />
        <button
          type="submit"
          disabled={isChecking || !url.trim()}
          className="px-4 py-2 bg-blue-600/90 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? 'Checking...' : 'Add Video'}
        </button>
      </form>
      {error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700/30 rounded-md">
          <p className="text-red-300 text-sm whitespace-pre-wrap">{error}</p>
        </div>
      )}
    </div>
  );
}
