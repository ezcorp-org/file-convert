<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatFileSize } from '$lib/conversion/config';
  import { notifications } from '$lib/stores/notifications';

  export let conversions;
  export let fileNames = new Map();

  const dispatch = createEventDispatcher();

  function handleDownload(state) {
    dispatch('download', state);
  }

  function handleDownloadAll() {
    const completed = conversions.filter(state => state.status === 'completed' && state.result);

    completed.forEach((state, index) => {
      setTimeout(() => {
        handleDownload(state);
      }, index * 150);
    });

    // Show success notification after all downloads are triggered
    if (completed.length > 0) {
      setTimeout(() => {
        notifications.success(
          `Downloaded ${completed.length} file${completed.length > 1 ? 's' : ''}`,
          'All converted files have been saved to your downloads folder'
        );
      }, completed.length * 150 + 100);
    }
  }

  $: successful = conversions.filter(c => c.status === 'completed');
  $: failed = conversions.filter(c => c.status === 'failed');
  $: hasScroll = successful.length > 5 || failed.length > 5;

  function shareOnTwitter() {
    const text = "Just converted my files for free with File Convert - 100% private, no uploads needed!";
    const url = "https://file-convert.ezcorp.org";
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`,
      '_blank'
    );
  }

  function shareOnLinkedIn() {
    const url = "https://file-convert.ezcorp.org";
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank'
    );
  }

  function copyLink() {
    navigator.clipboard.writeText('https://file-convert.ezcorp.org');
    notifications.success(
      'Link copied!',
      'Share it with anyone who needs file conversion.'
    );
  }

  function joinDiscord() {
    window.open('https://discord.ezcorp.org', '_blank');
  }
</script>

<div class="flex flex-col gap-8">
  {#if successful.length > 0}
    <div class="results-section card">
      <div class="card-header">
        <h3 class="text-xl text-ez-white m-0 flex items-center gap-3">
          <span>Successful Conversions ({successful.length})</span>
          {#if successful.length > 5}
            <span class="font-mono text-xs text-ez-muted font-normal">&darr; Scroll for more</span>
          {/if}
        </h3>
        {#if successful.length > 1}
          <button class="btn btn-primary btn-sm" on:click={handleDownloadAll} type="button">
            Download All
          </button>
        {/if}
      </div>

      <div
        class="card-body flex flex-col gap-2"
        class:max-h-[400px]={successful.length > 5}
        class:overflow-y-auto={successful.length > 5}
      >
        {#each successful as state}
          {#if state.result}
            <div class="bg-ez-s2 border border-ez-border rounded-md px-4 py-3 flex items-center gap-3">
              <span class="font-mono text-lg text-ez-success shrink-0" aria-hidden="true">✓</span>
              <div class="flex-1 min-w-0 flex flex-col">
                <span class="text-ez-text text-sm truncate">{state.result.filename}</span>
                <span class="font-mono text-xs text-ez-muted">
                  {state.result.metadata?.outputSize ? formatFileSize(state.result.metadata.outputSize) : 'Unknown size'}
                </span>
              </div>
              <button
                class="btn btn-ghost btn-sm shrink-0"
                on:click={() => handleDownload(state)}
                type="button"
              >
                Download
              </button>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Social Sharing Section -->
    <div class="card card-body text-center">
      <div class="section-eyebrow text-center">conversion complete</div>
      <h3 class="text-xl text-ez-white m-0 mb-2">Done. Files stayed local.</h3>
      <p class="text-ez-subtle text-sm mb-6">Help others discover this free tool:</p>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <button class="btn btn-ghost btn-sm" on:click={shareOnTwitter} type="button">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          Share on Twitter
        </button>

        <button class="btn btn-ghost btn-sm" on:click={shareOnLinkedIn} type="button">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Share on LinkedIn
        </button>

        <button class="btn btn-ghost btn-sm" on:click={copyLink} type="button">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          Copy Link
        </button>

        <button class="btn btn-ghost btn-sm" on:click={joinDiscord} type="button">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Join Discord
        </button>
      </div>
    </div>
  {/if}

  {#if failed.length > 0}
    <div class="results-section card">
      <div class="card-header">
        <h3 class="text-xl text-ez-white m-0 flex items-center gap-3">
          <span>Failed Conversions ({failed.length})</span>
          {#if failed.length > 5}
            <span class="font-mono text-xs text-ez-muted font-normal">&darr; Scroll for more</span>
          {/if}
        </h3>
      </div>

      <div
        class="card-body flex flex-col gap-2"
        class:max-h-[400px]={failed.length > 5}
        class:overflow-y-auto={failed.length > 5}
      >
        {#each failed as state}
          <div class="bg-ez-s2 border border-ez-red/25 rounded-md px-4 py-3 flex items-center gap-3">
            <span class="font-mono text-lg text-ez-red-lt shrink-0" aria-hidden="true">×</span>
            <div class="flex-1 min-w-0 flex flex-col">
              <span class="text-ez-text text-sm truncate">{fileNames.get(state.id) || 'Unknown file'}</span>
              <span class="font-mono text-xs text-ez-red-lt">{state.error?.message || state.message || 'Unknown error'}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
