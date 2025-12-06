<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import NotificationContainer from '$lib/components/NotificationContainer.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { dev } from '$app/environment';
	import { registerServiceWorker } from '$lib/utils/service-worker-registration';

	onMount(async () => {
		if (browser) {
			// In development, unregister any existing service workers
			if (dev) {
				if ('serviceWorker' in navigator) {
					const registrations = await navigator.serviceWorker.getRegistrations();
					for (const registration of registrations) {
						await registration.unregister();
						console.log('[Dev] Unregistered service worker:', registration.scope);
					}
					// Clear all caches
					if ('caches' in window) {
						const cacheNames = await caches.keys();
						for (const cacheName of cacheNames) {
							await caches.delete(cacheName);
							console.log('[Dev] Deleted cache:', cacheName);
						}
					}
				}
			} else {
				// Only register in production
				registerServiceWorker();
			}
		}
	});
</script>

<!-- Default SEO for all pages -->
<SEOHead />

<!-- Notification Container -->
<NotificationContainer />

<div class="app-container">
  <Header />
  <main>
    <slot />
  </main>
  <Footer />
</div>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
