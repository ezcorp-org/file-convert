<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let type: 'error' | 'warning' | 'success' | 'info' = 'info';
	export let message: string;
	export let detail: string = '';
	export let autoClose: boolean = false;
	export let duration: number = 5000;

	const dispatch = createEventDispatcher();
	let visible = true;
	let timeoutId: NodeJS.Timeout | null = null;
	let isPaused = false;
	let remainingTime = duration;
	let pauseStartTime = 0;

	onMount(() => {
		if (autoClose) {
			startAutoClose();
		}
		
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
	
	function startAutoClose() {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => close(), remainingTime);
	}
	
	function pauseAutoClose() {
		if (!autoClose || isPaused) return;
		isPaused = true;
		pauseStartTime = Date.now();
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
	
	function resumeAutoClose() {
		if (!autoClose || !isPaused) return;
		isPaused = false;
		const pauseDuration = Date.now() - pauseStartTime;
		remainingTime = Math.max(remainingTime - pauseDuration, 1000); // Keep at least 1 second
		startAutoClose();
	}

	function close() {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		visible = false;
		setTimeout(() => {
			dispatch('close');
		}, 300);
	}

	$: icon = getIcon(type);

	function getIcon() {
		switch(type) {
			case 'error': return '❌';
			case 'warning': return '⚠️';
			case 'success': return '✅';
			default: return 'ℹ️';
		}
	}
</script>

{#if visible}
	<div 
		class="notification notification--{type}" 
		class:closing={!visible}
		class:auto-close={autoClose}
		on:mouseenter={pauseAutoClose}
		on:mouseleave={resumeAutoClose}
	>
		{#if autoClose}
			<div class="notification__timer" style="animation-duration: {duration}ms"></div>
		{/if}
		<div class="notification__icon">{icon}</div>
		<div class="notification__content">
			<div class="notification__message">{message}</div>
			{#if detail}
				<div class="notification__detail">{detail}</div>
			{/if}
		</div>
		<button class="notification__close" on:click={close} aria-label="Close notification">
			×
		</button>
	</div>
{/if}

<style>
	.notification {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		padding-right: 2.5rem; /* Make room for close button */
		margin: 0.5rem 0;
		border-radius: var(--border-radius, 8px);
		background: var(--white, #fff);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-left: 4px solid;
		animation: slideIn 0.3s ease-out;
		position: relative;
		pointer-events: auto; /* Ensure notification can receive events */
		overflow: hidden; /* Clip the timer bar */
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.notification:hover {
		transform: translateX(-5px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.notification.closing {
		animation: slideOut 0.3s ease-out;
	}

	.notification--error {
		border-left-color: var(--danger);
		background: #fff5f5;
	}

	.notification--warning {
		border-left-color: var(--warning);
		background: #fffbf0;
	}

	.notification--success {
		border-left-color: var(--success);
		background: #f0fff4;
	}

	.notification--info {
		border-left-color: var(--info);
		background: #f0f9ff;
	}

	.notification__icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.notification__content {
		flex: 1;
	}

	.notification__message {
		font-weight: 600;
		color: var(--gray-900);
		margin-bottom: 0.25rem;
	}

	.notification__detail {
		color: var(--gray-600);
		font-size: 0.875rem;
	}

	.notification__close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: transparent;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--gray-500, #6c757d);
		cursor: pointer;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.2s, color 0.2s;
		z-index: 10;
		padding: 0;
	}

	.notification__close:hover {
		background: rgba(0, 0, 0, 0.1);
		color: var(--gray-700, #333);
	}
	
	.notification__close:active {
		background: rgba(0, 0, 0, 0.15);
		transform: scale(0.95);
	}
	
	.notification__timer {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: linear-gradient(90deg, 
			rgba(102, 126, 234, 0.6) 0%, 
			rgba(118, 75, 162, 0.6) 100%);
		animation: timer-countdown linear forwards;
		transform-origin: left;
		z-index: 1;
		box-shadow: 0 -1px 3px rgba(102, 126, 234, 0.2);
	}
	
	.notification:hover .notification__timer {
		animation-play-state: paused;
	}
	
	@keyframes timer-countdown {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes slideOut {
		from {
			transform: translateX(0);
			opacity: 1;
		}
		to {
			transform: translateX(-100%);
			opacity: 0;
		}
	}
</style>