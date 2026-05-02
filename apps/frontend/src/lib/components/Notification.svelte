<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let type: 'error' | 'warning' | 'success' | 'info' | 'upgrade' = 'info';
	export let message: string;
	export let detail: string = '';
	export let autoClose: boolean = false;
	export let duration: number = 5000;

	const dispatch = createEventDispatcher();
	let visible = true;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
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
		remainingTime = Math.max(remainingTime - pauseDuration, 1000);
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

	// Map type → alert class, glyph, glyph color
	$: alertClass =
		type === 'success'
			? 'alert-success'
			: type === 'error'
				? 'alert-danger'
				: type === 'warning' || type === 'upgrade'
					? 'alert-warning'
					: 'alert-info';

	$: glyph = type === 'success' ? '✓' : type === 'info' ? 'i' : type === 'upgrade' ? '★' : '!';

	$: glyphColor =
		type === 'success'
			? 'text-ez-success'
			: type === 'error'
				? 'text-ez-red-lt'
				: type === 'warning' || type === 'upgrade'
					? 'text-ez-yellow'
					: 'text-[#6BB8F7]';
</script>

{#if visible}
	<div
		class="alert {alertClass} relative pr-10"
		role="alert"
		on:mouseenter={pauseAutoClose}
		on:mouseleave={resumeAutoClose}
	>
		<span
			class="font-mono text-lg leading-none mt-0.5 shrink-0 {glyphColor}"
			aria-hidden="true">{glyph}</span
		>
		<div class="flex-1 min-w-0">
			<div class="font-semibold text-ez-white text-sm leading-snug">{message}</div>
			{#if detail}
				<div class="text-ez-subtle text-sm mt-1 leading-relaxed">{detail}</div>
			{/if}
		</div>
		<button
			class="absolute top-2 right-2 w-7 h-7 rounded-sm flex items-center justify-center text-ez-muted hover:text-ez-white hover:bg-ez-s2 transition-colors duration-fast"
			on:click={close}
			aria-label="Close notification"
			type="button"
		>
			&times;
		</button>
		{#if autoClose}
			<div
				class="absolute bottom-0 left-0 h-[2px] bg-current opacity-40 timer-bar"
				style="animation-duration: {duration}ms"
			></div>
		{/if}
	</div>
{/if}

<style>
	.timer-bar {
		animation-name: countdown;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
		transform-origin: left center;
		width: 100%;
	}
	@keyframes countdown {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
	.alert:hover .timer-bar {
		animation-play-state: paused;
	}
</style>
