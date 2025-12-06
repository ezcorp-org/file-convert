<script lang="ts">
  import { notifications } from '$lib/stores/notifications';
  import Notification from './Notification.svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
</script>

{#if $notifications.length > 0}
  <div class="notification-container">
    {#each $notifications as notification (notification.id)}
      <div
        animate:flip={{ duration: 300 }}
        transition:fade={{ duration: 200 }}
      >
        <Notification
          type={notification.type}
          message={notification.message}
          detail={notification.detail}
          autoClose={notification.autoClose}
          duration={notification.duration}
          on:close={() => notifications.dismiss(notification.id)}
        />
      </div>
    {/each}
  </div>
{/if}

<style>
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    pointer-events: none;
  }

  .notification-container :global(.notification) {
    pointer-events: auto;
  }

  @media (max-width: 640px) {
    .notification-container {
      left: 10px;
      right: 10px;
      max-width: none;
    }
  }
</style>