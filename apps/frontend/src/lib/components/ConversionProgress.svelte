<script lang="ts">
	import type { ConversionProgress } from '$lib/workers/worker-manager';
	
	export let progress: ConversionProgress;
	export let fileName: string;
	export let fromFormat: string;
	export let toFormat: string;
	
	$: progressPercent = Math.min(100, Math.max(0, progress.progress));
	$: isComplete = progressPercent === 100;
	$: statusColor = isComplete ? 'var(--success)' : 'var(--primary)';
	
	function getFormatIcon(): string {
		const icons: Record<string, string> = {
			// Images
			'png': '🖼️',
			'jpeg': '📷',
			'jpg': '📷',
			'webp': '🌐',
			'gif': '🎞️',
			'bmp': '🎨',
			'ico': '⚡',
			'tiff': '📐',
			// Audio
			'mp3': '🎵',
			'wav': '🎶',
			'flac': '🎼',
			'ogg': '🔊',
			'opus': '🎧',
			// Documents
			'pdf': '📄',
			'docx': '📝',
			'txt': '📃',
			'html': '🌍',
			'md': '📋',
			// Archives
			'zip': '📦',
			'7z': '🗜️',
			'tar': '📚',
			'tgz': '📦',
			// Data
			'json': '{ }',
			'yaml': '📊',
			'xml': '🏷️',
			'csv': '📈',
			'tsv': '📉',
			'xlsx': '📊'
		};
		return icons[format.toLowerCase()] || '📁';
	}
	
	function truncateFileName(): string {
		if (name.length <= maxLength) return name;
		const ext = name.split('.').pop() || '';
		const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
		const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 4);
		return `${truncatedName}...${ext ? '.' + ext : ''}`;
	}
</script>

<div class="progress-container" class:complete={isComplete}>
	<div class="progress-header">
		<div class="file-info">
			<span class="format-icon">{getFormatIcon(fromFormat)}</span>
			<span class="file-name" title={fileName}>
				{truncateFileName(fileName)}
			</span>
			<span class="conversion-arrow">→</span>
			<span class="format-icon">{getFormatIcon(toFormat)}</span>
			<span class="to-format">{toFormat.toUpperCase()}</span>
		</div>
		<div class="progress-percentage">
			{progressPercent}%
		</div>
	</div>
	
	<div class="progress-track">
		<div 
			class="progress-bar" 
			style="width: {progressPercent}%; background-color: {statusColor}"
		>
			<div class="progress-shimmer"></div>
		</div>
	</div>
	
	{#if progress.message}
		<div class="progress-message">
			{#if isComplete}
				<span class="status-icon">✅</span>
			{:else}
				<span class="status-spinner">⚡</span>
			{/if}
			<span class="message-text">{progress.message}</span>
		</div>
	{/if}
</div>

<style>
	.progress-container {
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1rem;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.progress-container:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	
	.progress-container.complete {
		border-color: var(--success);
		background: linear-gradient(to right, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.02));
	}
	
	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	
	.file-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}
	
	.format-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}
	
	.file-name {
		font-weight: 500;
		color: var(--gray-800);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 200px;
	}
	
	.conversion-arrow {
		color: var(--gray-400);
		font-weight: bold;
		flex-shrink: 0;
	}
	
	.to-format {
		font-weight: 600;
		color: var(--primary);
		font-size: 0.875rem;
		background: var(--gray-100);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		flex-shrink: 0;
	}
	
	.progress-percentage {
		font-weight: bold;
		color: var(--gray-700);
		font-size: 0.875rem;
		min-width: 45px;
		text-align: right;
	}
	
	.progress-track {
		height: 8px;
		background: var(--gray-200);
		border-radius: 4px;
		overflow: hidden;
		position: relative;
	}
	
	.progress-bar {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.progress-shimmer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.3),
			transparent
		);
		animation: shimmer 2s infinite;
	}
	
	.complete .progress-shimmer {
		animation: none;
	}
	
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
	
	.progress-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--gray-600);
	}
	
	.status-icon {
		animation: pulse 0.5s ease;
	}
	
	.status-spinner {
		animation: spin 1s linear infinite;
		display: inline-block;
	}
	
	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	.message-text {
		flex: 1;
	}
	
	@media (max-width: 768px) {
		.file-name {
			max-width: 120px;
		}
		
		.progress-container {
			padding: 0.75rem;
		}
	}
</style>