'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [channelName, setChannelName] = useState<string | null>(null);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&playsinline=1`;

  // Fetch channel name
  useEffect(() => {
    const fetchChannelName = async () => {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!apiKey) return;

      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            id: videoId,
            key: apiKey,
            part: 'snippet',
          },
        });
        const video = response.data.items?.[0];
        setChannelName(video?.snippet?.channelTitle || 'Unknown Channel');
      } catch (error) {
        console.error('Failed to fetch channel name:', error);
        setChannelName('Unknown Channel');
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

  // Initialize player
  useEffect(() => {
    const onYouTubeIframeAPIReady = () => {
      const YT = (window as any).YT;
      if (YT && iframeRef.current) {
        const playerInstance = new YT.Player(iframeRef.current, {
          events: {
            onReady: (event: any) => {
              event.target.mute();
              setPlayer(event.target);
            },
          },
        });
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
  }, [videoId]);

  // Mute/unmute
  const handleMuteToggle = useCallback(() => {
    if (!player) return;
    if (isMuted) player.unMute();
    else player.mute();
    setIsMuted(!isMuted);
  }, [player, isMuted]);

  // Fullscreen individual video
  const handleFullscreen = () => {
    if (!iframeRef.current) return;

    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  // Auto mute others, unmute active
  useEffect(() => {
    if (!player) return;
    if (isActive) player.unMute();
    else player.mute();
  }, [isActive, player]);

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        isActive ? 'ring-2 ring-blue-500 shadow-lg' : 'ring-1 ring-gray-300'
      }`}
      onClick={onClick}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={`YouTube Live: ${videoId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-64 sm:h-72 md:h-80 aspect-video"
      />

      {/* Individual fullscreen button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFullscreen();
        }}
        className="absolute top-2 left-2 p-2 bg-gray-800 bg-opacity-70 text-white rounded-full hover:bg-gray-700 transition-colors"
        title="Fullscreen Video"
      >
        ⛶
      </button>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMuteToggle();
          }}
          className="p-2 bg-gray-800 bg-opacity-70 text-white rounded-full hover:bg-gray-700 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          title="Remove Video"
        >
          ❌
        </button>
      </div>

      {/* Channel Name */}
      {channelName && (
        <div className="absolute bottom-1 left-1 right-1 p-1 bg-black/70 text-center text-white text-sm truncate">
          {channelName}
        </div>
      )}
    </div>
  );
}
