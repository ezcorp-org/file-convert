<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import type { ConversionResult } from '$lib/workers/worker-manager';
	
	export let results: ConversionResult[] = [];
	export let autoDownload = false;
	
	const dispatch = createEventDispatcher();
	
	interface DownloadItem {
		id: string;
		filename: string;
		size: number;
		mimeType: string;
		blob: Blob;
		downloadUrl?: string;
		downloaded: boolean;
		timestamp: Date;
		selected: boolean;
	}
	
	let downloads: Map<string, DownloadItem> = new Map();
	let selectAll = false;
	let sortBy: 'name' | 'size' | 'date' = 'date';
	let sortAscending = false;
	let filterText = '';
	
	// Convert results to download items
	$: {
		results.forEach(result => {
			if (!downloads.has(result.id)) {
				const item: DownloadItem = {
					id: result.id,
					filename: result.filename,
					size: result.outputFile.size,
					mimeType: result.mimeType,
					blob: result.outputFile,
					downloadUrl: URL.createObjectURL(result.outputFile),
					downloaded: false,
					timestamp: new Date(),
					selected: false
				};
				downloads.set(result.id, item);
				
				if (autoDownload) {
					downloadFile(item);
				}
			}
		});
		downloads = new Map(downloads);
	}
	
	// Filtered and sorted downloads
	$: sortedDownloads = (() => {
		let items = Array.from(downloads.values());
		
		// Filter
		if (filterText) {
			const search = filterText.toLowerCase();
			items = items.filter(item => 
				item.filename.toLowerCase().includes(search)
			);
		}
		
		// Sort
		items.sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'name':
					comparison = a.filename.localeCompare(b.filename);
					break;
				case 'size':
					comparison = a.size - b.size;
					break;
				case 'date':
					comparison = a.timestamp.getTime() - b.timestamp.getTime();
					break;
			}
			return sortAscending ? comparison : -comparison;
		});
		
		return items;
	})();
	
	$: selectedCount = sortedDownloads.filter(d => d.selected).length;
	$: totalSize = sortedDownloads.reduce((sum, d) => sum + d.size, 0);
	$: selectedSize = sortedDownloads
		.filter(d => d.selected)
		.reduce((sum, d) => sum + d.size, 0);
	
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDate(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);

		if (seconds < 60) return 'Just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
		return date.toLocaleDateString();
	}

	function downloadFile(item: DownloadItem) {
		if (!item.downloadUrl) return;

		const a = document.createElement('a');
		a.href = item.downloadUrl;
		a.download = item.filename;
		a.click();

		item.downloaded = true;
		downloads = new Map(downloads);

		dispatch('download', { id: item.id });
	}
	
	function downloadSelected() {
		const selected = sortedDownloads.filter(d => d.selected);
		
		if (selected.length === 1) {
			// Single file download
			downloadFile(selected[0]);
		} else if (selected.length > 1) {
			// Multiple files - create ZIP
			createAndDownloadZip(selected);
		}
	}
	
	async function createAndDownloadZip(items: DownloadItem[]) {
		// Dynamically import fflate for ZIP creation
		const { zipSync } = await import('fflate');

		const files: Record<string, Uint8Array> = {};

		for (const item of items) {
			const arrayBuffer = await item.blob.arrayBuffer();
			files[item.filename] = new Uint8Array(arrayBuffer);
		}
		
		const zipped = zipSync(files);
		const blob = new Blob();
		const url = URL.createObjectURL(blob);
		
		const a = document.createElement('a');
		a.href = url;
		a.download = `converted-files-${Date.now()}.zip`;
		a.click();
		
		URL.revokeObjectURL(url);
		
		// Mark all as downloaded
		items.forEach(item => {
			item.downloaded = true;
		});
		downloads = new Map(downloads);
		
		dispatch('download-zip');
	}

	function toggleSelection(id: string) {
		const item = downloads.get(id);
		if (item) {
			item.selected = !item.selected;
			downloads = new Map(downloads);
		}
	}
	
	function toggleSelectAll() {
		selectAll = !selectAll;
		downloads.forEach(item => {
			item.selected = selectAll;
		});
		downloads = new Map(downloads);
	}
	
	function removeItem(id: string) {
		const item = downloads.get(id);
		if (item?.downloadUrl) {
			URL.revokeObjectURL(item.downloadUrl);
		}
		downloads.delete(id);
		downloads = new Map(downloads);
		
		dispatch('remove', { id });
	}
	
	function removeSelected() {
		const selected = sortedDownloads.filter(d => d.selected);
		selected.forEach(item => {
			if (item.downloadUrl) {
				URL.revokeObjectURL(item.downloadUrl);
			}
			downloads.delete(item.id);
		});
		downloads = new Map(downloads);
		
		dispatch('remove-selected');
	}

	function clearAll() {
		downloads.forEach(item => {
			if (item.downloadUrl) {
				URL.revokeObjectURL(item.downloadUrl);
			}
		});
		downloads.clear();
		downloads = new Map(downloads);
		
		dispatch('clear');
	}
	
	function getFileIcon(mimeType: string): string {
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType.startsWith('audio/')) return '🎵';
		if (mimeType.startsWith('video/')) return '🎬';
		if (mimeType.includes('pdf')) return '📄';
		if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
		if (mimeType.includes('text')) return '📝';
		if (mimeType.includes('json') || mimeType.includes('xml')) return '📊';
		return '📁';
	}
	
	// Cleanup URLs on destroy
	onDestroy(() => {
		downloads.forEach(item => {
			if (item.downloadUrl) {
				URL.revokeObjectURL(item.downloadUrl);
			}
		});
	});
</script>

<div class="download-manager">
	<div class="manager-header">
		<div class="header-left">
			<h3>📥 Download Manager</h3>
			<div class="stats">
				<span class="stat">{downloads.size} file{downloads.size !== 1 ? 's' : ''}</span>
				<span class="stat">{formatFileSize(totalSize)}</span>
				{#if selectedCount > 0}
					<span class="stat selected">
						{selectedCount} selected ({formatFileSize(selectedSize)})
					</span>
				{/if}
			</div>
		</div>
		<div class="header-right">
			<input
				type="text"
				placeholder="Filter files..."
				bind:value={filterText}
				class="filter-input"
			/>
			<select bind:value={sortBy} class="sort-select">
				<option value="date">Date</option>
				<option value="name">Name</option>
				<option value="size">Size</option>
			</select>
			<button
				class="sort-direction"
				on:click={() => sortAscending = !sortAscending}
				title={sortAscending ? 'Ascending' : 'Descending'}
			>
				{sortAscending ? '↑' : '↓'}
			</button>
		</div>
	</div>
	
	{#if downloads.size > 0}
		<div class="manager-controls">
			<button class="btn-control" on:click={toggleSelectAll}>
				{selectAll ? 'Deselect All' : 'Select All'}
			</button>
			{#if selectedCount > 0}
				<button class="btn-control primary" on:click={downloadSelected}>
					Download {selectedCount > 1 ? `${selectedCount} Files` : 'Selected'}
				</button>
				<button class="btn-control danger" on:click={removeSelected}>
					Remove Selected
				</button>
			{/if}
			<button class="btn-control" on:click={clearAll}>
				Clear All
			</button>
		</div>
		
		<div class="downloads-list">
			{#each sortedDownloads as item (item.id)}
				<div class="download-item" class:selected={item.selected}>
					<input
						type="checkbox"
						checked={item.selected}
						on:change={() => toggleSelection(item.id)}
					/>
					<span class="file-icon">{getFileIcon(item.mimeType)}</span>
					<div class="file-info">
						<div class="file-name" title={item.filename}>
							{item.filename}
						</div>
						<div class="file-meta">
							<span class="file-size">{formatFileSize(item.size)}</span>
							<span class="file-date">{formatDate(item.timestamp)}</span>
							{#if item.downloaded}
								<span class="downloaded-badge">✓ Downloaded</span>
							{/if}
						</div>
					</div>
					<div class="item-actions">
						<button
							class="btn-action download"
							on:click={() => downloadFile(item)}
							title="Download"
						>
							⬇️
						</button>
						<button
							class="btn-action remove"
							on:click={() => removeItem(item.id)}
							title="Remove"
						>
							❌
						</button>
					</div>
				</div>
			{/each}
		</div>
		
		<div class="manager-footer">
			<label class="auto-download">
				<input
					type="checkbox"
					bind:checked={autoDownload}
				/>
				Auto-download converted files
			</label>
			<button class="btn-download-all" on:click={() => createAndDownloadZip(Array.from(downloads.values()))}>
				📦 Download All as ZIP
			</button>
		</div>
	{:else}
		<div class="empty-state">
			<span class="empty-icon">📭</span>
			<p>No converted files yet</p>
			<p class="empty-hint">Converted files will appear here</p>
		</div>
	{/if}
</div>

<style>
	.download-manager {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.manager-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--gray-200);
	}
	
	.header-left h3 {
		margin: 0 0 0.5rem 0;
		color: var(--gray-800);
	}
	
	.stats {
		display: flex;
		gap: 0.75rem;
	}
	
	.stat {
		padding: 0.25rem 0.5rem;
		background: var(--gray-100);
		border-radius: 12px;
		font-size: 0.75rem;
		color: var(--gray-600);
	}
	
	.stat.selected {
		background: var(--primary);
		color: white;
	}
	
	.header-right {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.filter-input {
		padding: 0.5rem;
		border: 1px solid var(--gray-300);
		border-radius: 6px;
		font-size: 0.875rem;
	}
	
	.sort-select {
		padding: 0.5rem;
		border: 1px solid var(--gray-300);
		border-radius: 6px;
		font-size: 0.875rem;
		background: white;
	}
	
	.sort-direction {
		padding: 0.5rem 0.75rem;
		background: var(--gray-100);
		border: 1px solid var(--gray-300);
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
	}
	
	.manager-controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.btn-control {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid var(--gray-300);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
	}
	
	.btn-control:hover {
		background: var(--gray-50);
		border-color: var(--gray-400);
	}
	
	.btn-control.primary {
		background: var(--primary);
		color: white;
		border-color: var(--primary);
	}
	
	.btn-control.primary:hover {
		background: var(--primary-dark);
	}
	
	.btn-control.danger {
		background: var(--danger);
		color: white;
		border-color: var(--danger);
	}
	
	.downloads-list {
		max-height: 400px;
		overflow-y: auto;
		margin-bottom: 1rem;
	}
	
	.download-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		margin-bottom: 0.5rem;
		transition: all 0.2s;
	}
	
	.download-item:hover {
		background: var(--gray-50);
		border-color: var(--gray-300);
	}
	
	.download-item.selected {
		background: rgba(102, 126, 234, 0.05);
		border-color: var(--primary);
	}
	
	.file-icon {
		font-size: 1.5rem;
	}
	
	.file-info {
		flex: 1;
		min-width: 0;
	}
	
	.file-name {
		font-weight: 500;
		color: var(--gray-800);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.file-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: var(--gray-500);
	}
	
	.downloaded-badge {
		color: var(--success);
		font-weight: 500;
	}
	
	.item-actions {
		display: flex;
		gap: 0.25rem;
	}
	
	.btn-action {
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		transition: transform 0.2s;
	}
	
	.btn-action:hover {
		transform: scale(1.2);
	}
	
	.manager-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid var(--gray-200);
	}
	
	.auto-download {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--gray-600);
	}
	
	.btn-download-all {
		padding: 0.5rem 1rem;
		background: var(--info);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}
	
	.btn-download-all:hover {
		background: #2563eb;
	}
	
	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--gray-500);
	}
	
	.empty-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}
	
	.empty-state p {
		margin: 0.5rem 0;
	}
	
	.empty-hint {
		font-size: 0.875rem;
		color: var(--gray-400);
	}
</style>