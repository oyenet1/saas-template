export function renderSpotifyEmbed(
  spotifyUrl: string,
  height: number = 152
): string {
  // Extract the embed URL from the Spotify URL
  const embedUrl = spotifyUrl.replace(
    /open\.spotify\.com\/(track|album|playlist|episode|show)/,
    "open.spotify.com/embed/$1"
  );

  return `<iframe data-testid="embed-iframe" style="border-radius:12px" src="${embedUrl}?utm_source=generator" width="100%" height="${height}" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
}
