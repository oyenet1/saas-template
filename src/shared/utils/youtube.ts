// Utility functions for YouTube handling

/**
 * Extracts the video ID from a YouTube URL
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generates the YouTube embed URL from a video ID
 * @param videoId - The YouTube video ID
 * @param options - Optional parameters for customization
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    mute?: boolean;
    controls?: boolean;
    start?: number;
    end?: number;
    loop?: boolean;
    playlist?: string;
  } = {}
): string {
  const params = new URLSearchParams();

  if (options.autoplay) params.set("autoplay", "1");
  if (options.mute) params.set("mute", "1");
  if (options.controls !== undefined)
    params.set("controls", options.controls ? "1" : "0");
  if (options.start) params.set("start", options.start.toString());
  if (options.end) params.set("end", options.end.toString());
  if (options.loop) params.set("loop", "1");
  if (options.playlist) params.set("playlist", options.playlist);

  const query = params.toString();
  return `https://www.youtube.com/embed/${videoId}${query ? "?" + query : ""}`;
}

/**
 * Generates an iframe HTML string for embedding YouTube video
 * @param url - Full YouTube URL
 * @param options - Embed options
 */
export function generateYouTubeIframe(
  url: string,
  options: {
    width?: number;
    height?: number;
    autoplay?: boolean;
    mute?: boolean;
    controls?: boolean;
    start?: number;
    end?: number;
    loop?: boolean;
    playlist?: string;
  } = {}
): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return "";

  const embedUrl = getYouTubeEmbedUrl(videoId, options);

  const width = options.width || 560;
  const height = options.height || 315;

  return `<iframe width="${width}" height="${height}" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

/**
 * Generates a full-width, full-height YouTube embed iframe for container
 * @param youtubeUrl - Full YouTube URL
 */
export function renderYouTubeEmbed(youtubeUrl: string): string {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) return "";

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=1`;

  return `<iframe style="width:100%; height:100%; border:none;" src="${embedUrl}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>`;
}
