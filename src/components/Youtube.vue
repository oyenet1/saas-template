<template>
  <div
    class="space-y-4 hover:shadow-2xl duration-300 rounded-lg overflow-hidden"
  >
    <div
      class="relative aspect-video rounded-lg overflow-hidden shadow-xl shadow-gray-200/50 bg-gray-100"
    >
      <iframe
        :src="getEmbedUrl(video.youtube_url)"
        class="w-full h-full border-0"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      ></iframe>
      <div
        class="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs text-white font-black"
      >
        {{ video.duration || "NEW" }}
      </div>
    </div>
    <div class="px-2 pb-3 space-y-2 text-left">
      <h4
        class="text-xl font-black text-gray-900 leading-tight italic line-clamp-2"
      >
        {{ video.title }}
      </h4>
      <div
        class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400"
      >
        <!-- <span>{{ video.views || "Latest" }}</span> -->
        <span>{{
          new Date(video.created_at).toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          })
        }}</span>
      </div>
      <UButton
        variant="link"
        color="primary"
        :to="video.youtube_url"
        target="_blank"
        class="p-0 text-sm font-bold"
      >
        Watch on YouTube
        <UIcon name="i-heroicons-arrow-up-right" class="ml-1 h-4 w-4" />
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  description?: string;
  author_id?: string;
  created_at: string;
  updated_at: string;
  duration?: string;
}

const { video } = defineProps<{ video: Video }>();

const getEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return "";
  return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=1`;
};
</script>

<style scoped></style>
