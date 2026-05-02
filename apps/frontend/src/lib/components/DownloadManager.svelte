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

	$: {
		results.forEach((result) => {
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

	$: sortedDownloads = (() => {
		let items = Array.from(downloads.values());

		if (filterText) {
			const search = filterText.toLowerCase();
			items = items.filter((item) => item.filename.toLowerCase().includes(search));
		}

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

	$: selectedCount = sortedDownloads.filter((d) => d.selected).length;
	$: totalSize = sortedDownloads.reduce((sum, d) => sum + d.size, 0);
	$: selectedSize = sortedDownloads
		.filter((d) => d.selected)
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
		const selected = sortedDownloads.filter((d) => d.selected);

		if (selected.length === 1) {
			downloadFile(selected[0]);
		} else if (selected.length > 1) {
			createAndDownloadZip(selected);
		}
	}

	async function createAndDownloadZip(items: DownloadItem[]) {
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

		items.forEach((item) => {
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
		downloads.forEach((item) => {
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
		const selected = sortedDownloads.filter((d) => d.selected);
		selected.forEach((item) => {
			if (item.downloadUrl) {
				URL.revokeObjectURL(item.downloadUrl);
			}
			downloads.delete(item.id);
		});
		downloads = new Map(downloads);

		dispatch('remove-selected');
	}

	function clearAll() {
		downloads.forEach((item) => {
			if (item.downloadUrl) {
				URL.revokeObjectURL(item.downloadUrl);
			}
		});
		downloads.clear();
		downloads = new Map(downloads);

		dispatch('clear');
	}

	function getFileExt(filename: string): string {
		const parts = filename.split('.');
		return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
	}

	onDestroy(() => {
		downloads.forEach((item) => {
			if (item.downloadUrl) {
				URL.revokeObjectURL(item.downloadUrl);
			}
		});
	});
</script>

<div class="card card-body space-y-5">
	<div class="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-ez-border">
		<div>
			<div class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em]">
				downloads
			</div>
			<h3 class="text-xl text-ez-white mt-1">Converted files</h3>
			<div class="flex flex-wrap gap-2 mt-2">
				<span class="badge badge-neutral">
					{downloads.size} file{downloads.size !== 1 ? 's' : ''}
				</span>
				<span class="badge badge-neutral">{formatFileSize(totalSize)}</span>
				{#if selectedCount > 0}
					<span class="badge badge-yellow">
						{selectedCount} selected · {formatFileSize(selectedSize)}
					</span>
				{/if}
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<input
				type="text"
				placeholder="Filter..."
				bind:value={filterText}
				class="input max-w-[160px]"
			/>
			<select bind:value={sortBy} class="input max-w-[110px]">
				<option value="date">Date</option>
				<option value="name">Name</option>
				<option value="size">Size</option>
			</select>
			<button
				type="button"
				class="btn btn-ghost btn-sm"
				on:click={() => (sortAscending = !sortAscending)}
				aria-label={sortAscending ? 'Sort ascending' : 'Sort descending'}
				title={sortAscending ? 'Ascending' : 'Descending'}
			>
				{sortAscending ? '↑' : '↓'}
			</button>
		</div>
	</div>

	{#if downloads.size > 0}
		<div class="flex flex-wrap gap-2">
			<button type="button" class="btn btn-ghost btn-sm" on:click={toggleSelectAll}>
				{selectAll ? 'Deselect all' : 'Select all'}
			</button>
			{#if selectedCount > 0}
				<button type="button" class="btn btn-primary btn-sm" on:click={downloadSelected}>
					Download {selectedCount > 1 ? `${selectedCount} files` : 'selected'}
				</button>
				<button type="button" class="btn btn-danger btn-sm" on:click={removeSelected}>
					Remove selected
				</button>
			{/if}
			<button type="button" class="btn btn-ghost btn-sm" on:click={clearAll}>
				Clear all
			</button>
		</div>

		<div class="max-h-[400px] overflow-y-auto space-y-2">
			{#each sortedDownloads as item (item.id)}
				<div
					class="flex items-center gap-3 p-3 border rounded-md transition-colors duration-fast
					{item.selected
						? 'border-ez-yellow bg-ez-yellow/5'
						: 'border-ez-border hover:bg-ez-s2'}"
				>
					<input
						type="checkbox"
						checked={item.selected}
						on:change={() => toggleSelection(item.id)}
						class="accent-ez-yellow"
					/>
					<span
						class="font-mono text-xs text-ez-yellow uppercase tracking-[0.1em] shrink-0 min-w-[40px]"
					>
						{getFileExt(item.filename) || 'file'}
					</span>
					<div class="flex-1 min-w-0">
						<div class="text-ez-white font-semibold text-sm truncate" title={item.filename}>
							{item.filename}
						</div>
						<div class="font-mono text-xs text-ez-muted mt-1 flex flex-wrap gap-3">
							<span>{formatFileSize(item.size)}</span>
							<span>{formatDate(item.timestamp)}</span>
							{#if item.downloaded}
								<span class="text-ez-success">downloaded</span>
							{/if}
						</div>
					</div>
					<div class="flex gap-1 shrink-0">
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							on:click={() => downloadFile(item)}
							title="Download"
						>
							Download
						</button>
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							on:click={() => removeItem(item.id)}
							title="Remove"
							aria-label="Remove file"
						>
							&times;
						</button>
					</div>
				</div>
			{/each}
		</div>

		<div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ez-border">
			<label class="flex items-center gap-2 text-ez-subtle text-sm cursor-pointer">
				<input
					type="checkbox"
					bind:checked={autoDownload}
					class="accent-ez-yellow"
				/>
				Auto-download converted files
			</label>
			<button
				type="button"
				class="btn btn-secondary btn-sm"
				on:click={() => createAndDownloadZip(Array.from(downloads.values()))}
			>
				Download all as ZIP
			</button>
		</div>
	{:else}
		<div class="text-center py-12">
			<p class="text-ez-white font-semibold">No converted files yet</p>
			<p class="text-ez-subtle text-sm mt-1">Converted files will show up here.</p>
		</div>
	{/if}
</div>
