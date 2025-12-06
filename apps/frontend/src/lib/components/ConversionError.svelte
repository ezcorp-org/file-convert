<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let fileName: string = '';
	export let fromFormat: string = '';
	export let toFormat: string = '';
	export let error: string = '';
	export let jobId: string = '';
	
	const dispatch = createEventDispatcher();
	
	// Map technical errors to user-friendly messages
	function getUserFriendlyError(): { title: string; description: string; suggestions: string[] } {
		// Handle null, undefined, or empty error messages
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
		
		if (errorLower.includes('corrupt') || errorLower.includes('invalid') || errorLower.includes('malformed')) {
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
	
	function getFormatIcon(): string {
		const icons: Record<string, string> = {
			'png': '🖼️', 'jpeg': '📷', 'jpg': '📷', 'webp': '🌐',
			'gif': '🎞️', 'bmp': '🎨', 'ico': '⚡', 'tiff': '📐',
			'mp3': '🎵', 'wav': '🎶', 'flac': '🎼', 'ogg': '🔊',
			'pdf': '📄', 'docx': '📝', 'txt': '📃', 'html': '🌍',
			'zip': '📦', '7z': '🗜️', 'tar': '📚',
			'json': '{ }', 'yaml': '📊', 'xml': '🏷️', 'csv': '📈'
		};
		return icons[(format || '').toLowerCase()] || '📁';
	}
</script>

<div class="error-container">
	<div class="error-header">
		<div class="error-icon">⚠️</div>
		<div class="error-title-section">
			<h3 class="error-title">{errorInfo.title}</h3>
			<div class="file-info">
				<span class="format-icon">{getFormatIcon(fromFormat)}</span>
				<span class="file-name">{fileName}</span>
				<span class="conversion-arrow">→</span>
				<span class="format-icon">{getFormatIcon(toFormat)}</span>
			</div>
		</div>
	</div>
	
	<div class="error-body">
		<p class="error-description">{errorInfo.description}</p>
		
		{#if errorInfo.suggestions.length > 0}
			<div class="suggestions">
				<h4>Try these solutions:</h4>
				<ul>
					{#each errorInfo.suggestions as suggestion}
						<li>{suggestion}</li>
					{/each}
				</ul>
			</div>
		{/if}
		
		<details class="technical-details">
			<summary>Technical details</summary>
			<code>{error}</code>
		</details>
	</div>
	
	<div class="error-actions">
		<button class="retry-btn" on:click={handleRetry}>
			🔄 Retry Conversion
		</button>
		<button class="dismiss-btn" on:click={handleDismiss}>
			Dismiss
		</button>
	</div>
</div>

<style>
	.error-container {
		background: white;
		border: 2px solid var(--danger);
		border-radius: 12px;
		padding: 1.25rem;
		margin-bottom: 1rem;
		box-shadow: 0 4px 6px rgba(239, 68, 68, 0.1);
	}
	
	.error-header {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		align-items: flex-start;
	}
	
	.error-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}
	
	.error-title-section {
		flex: 1;
		min-width: 0;
	}
	
	.error-title {
		margin: 0 0 0.5rem 0;
		color: var(--danger);
		font-size: 1.125rem;
		font-weight: 600;
	}
	
	.file-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--gray-600);
	}
	
	.format-icon {
		font-size: 1rem;
	}
	
	.file-name {
		font-weight: 500;
		color: var(--gray-700);
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.conversion-arrow {
		color: var(--gray-400);
	}
	
	.error-body {
		margin-left: 3rem;
		margin-bottom: 1rem;
	}
	
	.error-description {
		margin: 0 0 1rem 0;
		color: var(--gray-700);
		line-height: 1.5;
	}
	
	.suggestions {
		background: var(--gray-50);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}
	
	.suggestions h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--gray-700);
	}
	
	.suggestions ul {
		margin: 0;
		padding-left: 1.25rem;
		color: var(--gray-600);
		font-size: 0.875rem;
	}
	
	.suggestions li {
		margin-bottom: 0.25rem;
	}
	
	.suggestions li:last-child {
		margin-bottom: 0;
	}
	
	.technical-details {
		margin-top: 1rem;
		font-size: 0.875rem;
	}
	
	.technical-details summary {
		cursor: pointer;
		color: var(--gray-500);
		user-select: none;
		padding: 0.25rem 0;
	}
	
	.technical-details summary:hover {
		color: var(--gray-700);
	}
	
	.technical-details code {
		display: block;
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: var(--gray-900);
		color: var(--gray-100);
		border-radius: 4px;
		font-size: 0.75rem;
		font-family: 'Monaco', 'Menlo', monospace;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
	}
	
	.error-actions {
		display: flex;
		gap: 0.75rem;
		margin-left: 3rem;
	}
	
	.retry-btn {
		padding: 0.5rem 1rem;
		background: var(--primary);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}
	
	.retry-btn:hover {
		background: var(--primary-dark);
	}
	
	.dismiss-btn {
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--gray-600);
		border: 1px solid var(--gray-300);
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.dismiss-btn:hover {
		background: var(--gray-50);
		border-color: var(--gray-400);
		color: var(--gray-700);
	}
	
	@media (max-width: 768px) {
		.error-body {
			margin-left: 0;
		}
		
		.error-actions {
			margin-left: 0;
			flex-direction: column;
		}
		
		.error-actions button {
			width: 100%;
		}
		
		.file-name {
			max-width: 120px;
		}
	}
</style>