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
    const text = "Just converted my files for free with File Convert - 100% private, no uploads needed! 🔒";
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

<div class="conversion-results">
  {#if successful.length > 0}
    <div class="results-section">
      <div class="section-header">
        <h3>
          Successful Conversions ({successful.length})
          {#if successful.length > 5}
            <span class="scroll-hint">↓ Scroll for more</span>
          {/if}
        </h3>
        {#if successful.length > 1}
          <button class="download-all-btn" on:click={handleDownloadAll}>
            Download All
          </button>
        {/if}
      </div>
      
      <div class="results-list" class:scrollable={successful.length > 5}>
        {#each successful as state}
          {#if state.result}
            <div class="result-item success">
              <span class="result-icon">✅</span>
              <div class="result-info">
                <span class="result-name">{state.result.filename}</span>
                <span class="result-meta">
                  {state.result.metadata?.outputSize ? formatFileSize(state.result.metadata.outputSize) : 'Unknown size'}
                </span>
              </div>
              <button class="download-btn" on:click={() => handleDownload(state)}>
                Download
              </button>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Social Sharing Section -->
    <div class="share-section">
      <h3>✅ Conversion Complete!</h3>
      <p class="share-prompt">Help others discover this free tool:</p>

      <div class="share-buttons">
        <button class="share-btn twitter" on:click={shareOnTwitter}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          Share on Twitter
        </button>

        <button class="share-btn linkedin" on:click={shareOnLinkedIn}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Share on LinkedIn
        </button>

        <button class="share-btn copy" on:click={copyLink}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          Copy Link
        </button>

        <button class="share-btn discord" on:click={joinDiscord}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Join Discord
        </button>
      </div>
    </div>
  {/if}

  {#if failed.length > 0}
    <div class="results-section">
      <div class="section-header">
        <h3>
          Failed Conversions ({failed.length})
          {#if failed.length > 5}
            <span class="scroll-hint">↓ Scroll for more</span>
          {/if}
        </h3>
      </div>
      
      <div class="results-list" class:scrollable={failed.length > 5}>
        {#each failed as state}
          <div class="result-item failed">
            <span class="result-icon">❌</span>
            <div class="result-info">
              <span class="result-name">{fileNames.get(state.id) || 'Unknown file'}</span>
              <span class="result-error">{state.error?.message || state.message || 'Unknown error'}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .conversion-results {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .results-section {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 1.5rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-header h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .scroll-hint {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: normal;
    animation: bounce 2s infinite;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(3px);
    }
  }
  
  .download-all-btn {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  .download-all-btn:hover {
    background: #2563eb;
  }
  
  .results-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 0.5rem;
  }
  
  /* Responsive height adjustments */
  @media (max-width: 768px) {
    .results-list {
      max-height: 500px;
    }
  }
  
  /* Custom scrollbar for better appearance */
  .results-list::-webkit-scrollbar {
    width: 8px;
  }
  
  .results-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .results-list::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  .results-list::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  /* Firefox scrollbar */
  .results-list {
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
  }
  
  /* Add shadow when scrollable */
  .results-list.scrollable {
    box-shadow: inset 0 -10px 10px -10px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.5);
  }
  
  /* Ensure download buttons are always visible */
  .results-list.scrollable .result-item:last-child {
    margin-bottom: 0.5rem;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }
  
  .result-item.success {
    border-color: #86efac;
    background: #f0fdf4;
  }
  
  .result-item.failed {
    border-color: #fecaca;
    background: #fef2f2;
  }
  
  .result-icon {
    font-size: 1.5rem;
  }
  
  .result-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .result-name {
    font-weight: 500;
    color: #111827;
  }
  
  .result-meta {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .result-error {
    font-size: 0.875rem;
    color: #dc2626;
  }
  
  .download-btn {
    padding: 0.5rem 1rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  .download-btn:hover {
    background: #059669;
  }

  /* Social Sharing Section */
  .share-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.5rem;
    color: white;
    text-align: center;
  }

  .share-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }

  .share-prompt {
    margin: 0.5rem 0 1rem;
    opacity: 0.9;
    font-size: 1rem;
  }

  .share-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .share-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: white;
    border: none;
    border-radius: 2rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    font-size: 0.875rem;
  }

  .share-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .share-btn.twitter {
    color: #1da1f2;
  }

  .share-btn.linkedin {
    color: #0077b5;
  }

  .share-btn.copy {
    color: #667eea;
  }

  .share-btn.discord {
    color: #5865F2;
  }

  @media (max-width: 640px) {
    .share-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .share-btn {
      justify-content: center;
    }
  }
</style>