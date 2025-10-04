import axios from 'axios';

export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0`;
}

export async function isLiveStream(videoId: string): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ YouTube API key not set. Skipping live check.');
    return true; // Assume live if no key (dev fallback)
  }

  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          id: videoId,
          key: apiKey,
          part: 'snippet,liveStreamingDetails',
        },
      }
    );

    const video = response.data.items?.[0];
    if (!video) return false;
    
    const liveDetails = video.liveStreamingDetails;
    const isCurrentlyLive =
    video.snippet?.liveBroadcastContent === 'live' || liveDetails?.actualStartTime
    
    return !!isCurrentlyLive;
  } catch (error) {
    console.error('❌ Error checking live status:', error);
    return false;
  }
}

export async function getLiveVideoIdFromChannel(identifier: string, apiKey: string) {
  let channelId = null;

  // Step 1: Resolve @handle or channel ID
  if (identifier.startsWith('UC')) {
    channelId = identifier;
  } else {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${identifier.replace('@', '')}&key=${apiKey}`
    );
    const data = await res.json();
    channelId = data?.items?.[0]?.id || null;
  }

  if (!channelId) return null;

  // Step 2: Fetch currently live stream (if any)
  const liveRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`
  );
  const liveData = await liveRes.json();

  const videoId = liveData?.items?.[0]?.id?.videoId || null;
  return videoId;
}
