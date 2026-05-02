<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import Notification from './Notification.svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
</script>

{#if $notifications.length > 0}
	<div class="fixed top-[72px] right-4 z-[60] space-y-3 max-w-md w-full pointer-events-none">
		{#each $notifications as notification (notification.id)}
			<div
				class="pointer-events-auto"
				animate:flip={{ duration: 300 }}
				in:fly={{ x: 50, duration: 200 }}
				out:fly={{ x: 50, duration: 200 }}
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
