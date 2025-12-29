<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ConversionJob } from '$lib/workers/worker-manager';
	
	export let files: File[] = [];
	export let isConverting = false;
	
	const dispatch = createEventDispatcher();
	
	interface BatchSettings {
		outputFormat: string;
		quality?: number;
		preserveMetadata: boolean;
		createZip: boolean;
		namingPattern: 'original' | 'numbered' | 'timestamp';
	}
	
	let batchSettings: BatchSettings = {
		outputFormat: '',
		quality: 85,
		preserveMetadata: true,
		createZip: false,
		namingPattern: 'original'
	};
	
	let selectedFiles = new Set<number>();
	let selectAll = false;
	
	// Group files by format
	$: fileGroups = files.reduce((groups, file, index) => {
		const ext = getFileExtension(file.name);
		if (!groups[ext]) {
			groups[ext] = [];
		}
		groups[ext].push({ file, index });
		return groups;
	}, {} as Record<string, Array<{ file: File; index: number }>>);
	
	$: totalSize = files.reduce((sum, file) => sum + file.size, 0);
	$: selectedCount = selectedFiles.size;
	$: selectedSize = files
		.filter((_, i) => selectedFiles.has(i))
		.reduce((sum, file) => sum + file.size, 0);
	
	function getFileExtension(filename: string): string {
		const parts = filename.split('.');
		return parts.length > 1 ? parts.pop()!.toLowerCase() : 'unknown';
	}
	
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
	
	function toggleFileSelection(index: number) {
		if (selectedFiles.has(index)) {
			selectedFiles.delete(index);
		} else {
			selectedFiles.add(index);
		}
		selectedFiles = new Set(selectedFiles);
	}
	
	function toggleSelectAll() {
		if (selectAll) {
			selectedFiles.clear();
		} else {
			files.forEach((_, index) => selectedFiles.add(index));
		}
		selectedFiles = new Set(selectedFiles);
		selectAll = !selectAll;
	}
	
	function selectByFormat(format: string) {
		fileGroups[format]?.forEach(({ index }) => {
			selectedFiles.add(index);
		});
		selectedFiles = new Set(selectedFiles);
	}
	
	function deselectByFormat(format: string) {
		fileGroups[format]?.forEach(({ index }) => {
			selectedFiles.delete(index);
		});
		selectedFiles = new Set(selectedFiles);
	}
	
	function startBatchConversion() {
		if (selectedFiles.size === 0 || !batchSettings.outputFormat) return;
		
		const selectedFilesList = files.filter((_, i) => selectedFiles.has(i));
		dispatch('batch-convert', {
			files: selectedFilesList,
			settings: batchSettings
		});
	}
	
	function removeSelected() {
		const indicesToRemove = Array.from(selectedFiles).sort((a, b) => b - a);
		dispatch('remove-files', indicesToRemove);
		selectedFiles.clear();
		selectedFiles = new Set(selectedFiles);
	}
	
	// Common format conversions
	const formatGroups = {
		'Images': {
			formats: ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp'],
			icon: '🖼️',
			conversions: ['png', 'jpeg', 'webp']
		},
		'Audio': {
			formats: ['mp3', 'wav', 'flac', 'ogg', 'opus'],
			icon: '🎵',
			conversions: ['mp3', 'wav', 'flac']
		},
		'Documents': {
			formats: ['pdf', 'docx', 'txt', 'md', 'html'],
			icon: '📄',
			conversions: ['pdf', 'txt', 'html']
		},
		'Archives': {
			formats: ['zip', '7z', 'tar', 'tgz'],
			icon: '📦',
			conversions: ['zip', 'tar']
		},
		'Data': {
			formats: ['json', 'yaml', 'xml', 'csv', 'tsv'],
			icon: '📊',
			conversions: ['json', 'csv', 'xlsx']
		}
	};
	
	function getFormatGroup(ext: string): string | undefined {
		for (const [group, data] of Object.entries(formatGroups)) {
			if (data.formats.includes(ext)) {
				return group;
			}
		}
		return undefined;
	}
	
	$: availableOutputFormats = (() => {
		const formats = new Set<string>();
		selectedFiles.forEach(index => {
			const file = files[index];
			const ext = getFileExtension(file.name);
			const group = getFormatGroup(ext);
			if (group && formatGroups[group as keyof typeof formatGroups]) {
				formatGroups[group as keyof typeof formatGroups].conversions.forEach(f => formats.add(f));
			}
		});
		return Array.from(formats);
	})();
</script>

<div class="batch-panel">
	<div class="batch-header">
		<h3>Batch Conversion Manager</h3>
		<div class="batch-stats">
			<span class="stat">
				📁 {files.length} file{files.length !== 1 ? 's' : ''}
			</span>
			<span class="stat">
				💾 {formatFileSize(totalSize)}
			</span>
			{#if selectedCount > 0}
				<span class="stat selected">
					✅ {selectedCount} selected ({formatFileSize(selectedSize)})
				</span>
			{/if}
		</div>
	</div>
	
	<div class="batch-controls">
		<div class="selection-controls">
			<button class="btn-small" on:click={toggleSelectAll}>
				{selectAll ? 'Deselect All' : 'Select All'}
			</button>
			{#if selectedCount > 0}
				<button class="btn-small danger" on:click={removeSelected}>
					Remove Selected
				</button>
			{/if}
		</div>
	</div>
	
	<div class="file-groups">
		{#each Object.entries(fileGroups) as [format, items]}
			<div class="format-group">
				<div class="group-header">
					<div class="group-info">
						<span class="format-badge">{format.toUpperCase()}</span>
						<span class="file-count">{items.length} file{items.length !== 1 ? 's' : ''}</span>
					</div>
					<div class="group-actions">
						<button 
							class="btn-tiny"
							on:click={() => selectByFormat(format)}
						>
							Select
						</button>
						<button 
							class="btn-tiny"
							on:click={() => deselectByFormat(format)}
						>
							Deselect
						</button>
					</div>
				</div>
				<div class="group-files">
					{#each items as { file, index }}
						<div 
							class="file-row"
							class:selected={selectedFiles.has(index)}
						>
							<input
								type="checkbox"
								checked={selectedFiles.has(index)}
								on:change={() => toggleFileSelection(index)}
							/>
							<span class="file-name" title={file.name}>
								{file.name}
							</span>
							<span class="file-size">
								{formatFileSize(file.size)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	
	{#if selectedCount > 0}
		<div class="conversion-settings">
			<h4>Batch Conversion Settings</h4>
			
			<div class="setting-group">
				<label for="output-format">Output Format:</label>
				<select 
					id="output-format"
					bind:value={batchSettings.outputFormat}
					disabled={availableOutputFormats.length === 0}
				>
					<option value="">Select format...</option>
					{#each availableOutputFormats as format}
						<option value={format}>{format.toUpperCase()}</option>
					{/each}
				</select>
			</div>
			
			{#if batchSettings.outputFormat && ['jpeg', 'jpg', 'webp'].includes(batchSettings.outputFormat)}
				<div class="setting-group">
					<label for="quality">Quality ({batchSettings.quality}%):</label>
					<input
						id="quality"
						type="range"
						min="10"
						max="100"
						step="5"
						bind:value={batchSettings.quality}
					/>
				</div>
			{/if}
			
			<div class="setting-group">
				<label>
					<input
						type="checkbox"
						bind:checked={batchSettings.preserveMetadata}
					/>
					Preserve metadata
				</label>
			</div>
			
			<div class="setting-group">
				<label>
					<input
						type="checkbox"
						bind:checked={batchSettings.createZip}
					/>
					Download as ZIP archive
				</label>
			</div>
			
			<div class="setting-group">
				<label for="naming">File naming:</label>
				<select id="naming" bind:value={batchSettings.namingPattern}>
					<option value="original">Keep original names</option>
					<option value="numbered">Number sequentially</option>
					<option value="timestamp">Add timestamp</option>
				</select>
			</div>
			
			<button
				class="btn-primary"
				on:click={startBatchConversion}
				disabled={!batchSettings.outputFormat || isConverting}
			>
				{isConverting ? 'Converting...' : `Convert ${selectedCount} File${selectedCount !== 1 ? 's' : ''}`}
			</button>
		</div>
	{/if}
</div>

<style>
	.batch-panel {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.batch-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--gray-200);
	}
	
	.batch-header h3 {
		margin: 0;
		color: var(--gray-800);
	}
	
	.batch-stats {
		display: flex;
		gap: 1rem;
	}
	
	.stat {
		padding: 0.25rem 0.75rem;
		background: var(--gray-100);
		border-radius: 20px;
		font-size: 0.875rem;
		color: var(--gray-600);
	}
	
	.stat.selected {
		background: var(--primary);
		color: white;
	}
	
	.batch-controls {
		margin-bottom: 1rem;
	}
	
	.selection-controls {
		display: flex;
		gap: 0.5rem;
	}
	
	.btn-small {
		padding: 0.5rem 1rem;
		background: var(--primary);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background 0.2s;
	}
	
	.btn-small:hover {
		background: var(--primary-dark);
	}
	
	.btn-small.danger {
		background: var(--danger);
	}
	
	.btn-small.danger:hover {
		background: #dc2626;
	}
	
	.file-groups {
		max-height: 400px;
		overflow-y: auto;
		margin-bottom: 1.5rem;
	}
	
	.format-group {
		margin-bottom: 1rem;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		overflow: hidden;
	}
	
	.group-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--gray-50);
		border-bottom: 1px solid var(--gray-200);
	}
	
	.group-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.format-badge {
		padding: 0.25rem 0.5rem;
		background: var(--primary);
		color: white;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	
	.file-count {
		color: var(--gray-600);
		font-size: 0.875rem;
	}
	
	.group-actions {
		display: flex;
		gap: 0.25rem;
	}
	
	.btn-tiny {
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px solid var(--gray-300);
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.btn-tiny:hover {
		background: var(--gray-100);
		border-color: var(--gray-400);
	}
	
	.group-files {
		max-height: 200px;
		overflow-y: auto;
	}
	
	.file-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--gray-100);
		transition: background 0.2s;
	}
	
	.file-row:hover {
		background: var(--gray-50);
	}
	
	.file-row.selected {
		background: rgba(102, 126, 234, 0.1);
	}
	
	.file-row input[type="checkbox"] {
		flex-shrink: 0;
	}
	
	.file-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.875rem;
	}
	
	.file-size {
		color: var(--gray-500);
		font-size: 0.75rem;
	}
	
	.conversion-settings {
		background: var(--gray-50);
		border-radius: 8px;
		padding: 1rem;
	}
	
	.conversion-settings h4 {
		margin: 0 0 1rem 0;
		color: var(--gray-700);
		font-size: 1rem;
	}
	
	.setting-group {
		margin-bottom: 1rem;
	}
	
	.setting-group label {
		display: block;
		margin-bottom: 0.25rem;
		color: var(--gray-600);
		font-size: 0.875rem;
	}
	
	.setting-group select,
	.setting-group input[type="range"] {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--gray-300);
		border-radius: 4px;
		background: white;
	}
	
	.setting-group input[type="checkbox"] {
		margin-right: 0.5rem;
	}
	
	.btn-primary {
		width: 100%;
		padding: 0.75rem;
		background: var(--primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: var(--primary-dark);
	}
	
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>