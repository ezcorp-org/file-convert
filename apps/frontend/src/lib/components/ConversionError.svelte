<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let fileName: string = '';
	export let fromFormat: string = '';
	export let toFormat: string = '';
	export let error: string = '';
	export let jobId: string = '';

	const dispatch = createEventDispatcher();

	// Map technical errors to user-friendly messages
	function getUserFriendlyError(_error?: string): {
		title: string;
		description: string;
		suggestions: string[];
	} {
		if (!error) {
			return {
				title: 'Conversion failed',
				description: 'An unexpected error occurred during conversion.',
				suggestions: [
					'Try again in a few moments',
					'Check if the file opens correctly in other applications',
					'Contact support if the problem persists'
				]
			};
		}

		const errorLower = error.toLowerCase();

		if (errorLower.includes('memory') || errorLower.includes('oom')) {
			return {
				title: 'File too large',
				description: 'The file is too large to process in your browser.',
				suggestions: [
					'Try converting a smaller file',
					'Close other browser tabs to free up memory',
					'Use our desktop app for larger files (coming soon)'
				]
			};
		}

		if (errorLower.includes('unsupported') || errorLower.includes('not supported')) {
			return {
				title: 'Format not supported',
				description: `Converting from ${(fromFormat || 'unknown').toUpperCase()} to ${(toFormat || 'unknown').toUpperCase()} is not currently supported.`,
				suggestions: [
					'Check our supported formats list',
					'Try converting to a different format',
					'Contact support if you need this conversion'
				]
			};
		}

		if (
			errorLower.includes('corrupt') ||
			errorLower.includes('invalid') ||
			errorLower.includes('malformed')
		) {
			return {
				title: 'File appears corrupted',
				description: 'The file could not be read properly.',
				suggestions: [
					'Ensure the file is not corrupted',
					'Try opening the file in its native application first',
					'Re-download or re-save the original file'
				]
			};
		}

		if (errorLower.includes('timeout')) {
			return {
				title: 'Conversion timed out',
				description: 'The conversion took too long to complete.',
				suggestions: [
					'Try converting a smaller file',
					'Check your internet connection',
					'Retry the conversion'
				]
			};
		}

		if (errorLower.includes('network') || errorLower.includes('fetch')) {
			return {
				title: 'Network error',
				description: 'Failed to load required conversion libraries.',
				suggestions: [
					'Check your internet connection',
					'Disable browser extensions that might block scripts',
					'Try refreshing the page'
				]
			};
		}

		// Default error
		return {
			title: 'Conversion failed',
			description: error || 'An unexpected error occurred during conversion.',
			suggestions: [
				'Try again in a few moments',
				'Check if the file opens correctly in other applications',
				'Contact support if the problem persists'
			]
		};
	}

	$: errorInfo = getUserFriendlyError(error);

	function handleRetry() {
		dispatch('retry', { jobId, fileName, fromFormat, toFormat });
	}

	function handleDismiss() {
		dispatch('dismiss', { jobId });
	}
</script>

<div class="alert alert-danger flex-col items-stretch gap-3">
	<div class="flex items-start gap-3">
		<span
			class="font-mono text-lg text-ez-red-lt leading-none mt-0.5 shrink-0"
			aria-hidden="true">!</span
		>
		<div class="flex-1 min-w-0">
			<h3 class="text-ez-white font-semibold text-sm leading-snug">
				{errorInfo.title}
			</h3>
			<div class="flex items-center gap-2 mt-1 font-mono text-xs text-ez-muted uppercase tracking-[0.1em] truncate">
				<span class="text-ez-subtle truncate">{fileName}</span>
				<span aria-hidden="true">&rarr;</span>
				<span class="text-ez-yellow">{toFormat || '?'}</span>
			</div>
		</div>
	</div>

	<p class="text-ez-subtle text-sm leading-relaxed">{errorInfo.description}</p>

	{#if errorInfo.suggestions.length > 0}
		<div class="bg-ez-s2 rounded-md p-3">
			<div class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2">
				try this
			</div>
			<ul class="list-disc pl-5 space-y-1 text-ez-subtle text-sm">
				{#each errorInfo.suggestions as suggestion}
					<li>{suggestion}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<details class="text-sm">
		<summary class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em] cursor-pointer hover:text-ez-subtle">
			Technical details
		</summary>
		<pre class="code-block mt-2 text-xs whitespace-pre-wrap break-words">{error}</pre>
	</details>

	<div class="flex gap-2 mt-1">
		<button type="button" class="btn btn-secondary btn-sm" on:click={handleRetry}>
			Retry
		</button>
		<button type="button" class="btn btn-ghost btn-sm" on:click={handleDismiss}>
			Dismiss
		</button>
	</div>
</div>
