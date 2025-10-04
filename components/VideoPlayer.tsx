'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface VideoPlayerProps {
  videoId: string;
  url: string;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export default function VideoPlayer({
  videoId,
  url,
  isActive,
  onClick,
  onRemove,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null); // Store YT.Player instance
  const [isMuted, setIsMuted] = useState(true);
  const [channelName, setChannelName] = useState<string | null>(null);

  // Fetch channel name
  useEffect(() => {
    const fetchChannelName = async () => {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!apiKey) return;

      try {
        const res = await axios.get(
          'https://www.googleapis.com/youtube/v3/videos',
          { params: { id: videoId, key: apiKey, part: 'snippet' } }
        );
        setChannelName(res.data.items?.[0]?.snippet?.channelTitle || 'Unknown');
      } catch {
        setChannelName('Unknown');
      }
    };
    fetchChannelName();
  }, [videoId]);

  // Load YouTube Iframe API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  // Initialize player once
  useEffect(() => {
    const initPlayer = () => {
      if (!iframeRef.current || playerRef.current) return;
      const YT = (window as any).YT;
      if (!YT) return;

      playerRef.current = new YT.Player(iframeRef.current, {
        videoId,
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (event: any) => {
            event.target.mute();
            setIsMuted(true);
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) initPlayer();
    else (window as any).onYouTubeIframeAPIReady = initPlayer;
  }, [videoId]);

  // Mute/unmute based on active
  useEffect(() => {
    if (!playerRef.current) return;
    if (isActive) {
      playerRef.current.unMute?.();
      setIsMuted(false);
    } else {
      playerRef.current.mute?.();
      setIsMuted(true);
    }
  }, [isActive]);

  const handleMuteToggle = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) playerRef.current.unMute?.();
    else playerRef.current.mute?.();
    setIsMuted(!isMuted);
  }, [isMuted]);


  return (
    <div className="relative bg-black rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
      <div ref={iframeRef} className="w-full h-64 sm:h-72 md:h-80 aspect-video" />

      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }} className="p-2 bg-gray-800 bg-opacity-70 text-white rounded-full hover:bg-gray-700">
          {isMuted ? '🔇' : '🔊'}
        </button>

        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
          ❌
        </button>
      </div>

      {channelName && (
       <div className="absolute bottom-0 left-0 w-full bg-black/70 text-center text-white text-sm py-1">
        {channelName}
      </div>
      )}
    </div>
  );
}
