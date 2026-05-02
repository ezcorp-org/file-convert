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

	$: fileGroups = files.reduce(
		(groups, file, index) => {
			const ext = getFileExtension(file.name);
			if (!groups[ext]) {
				groups[ext] = [];
			}
			groups[ext].push({ file, index });
			return groups;
		},
		{} as Record<string, Array<{ file: File; index: number }>>
	);

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

	const formatGroups = {
		Images: {
			formats: ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp'],
			conversions: ['png', 'jpeg', 'webp']
		},
		Audio: {
			formats: ['mp3', 'wav', 'flac', 'ogg', 'opus'],
			conversions: ['mp3', 'wav', 'flac']
		},
		Documents: {
			formats: ['pdf', 'docx', 'txt', 'md', 'html'],
			conversions: ['pdf', 'txt', 'html']
		},
		Archives: {
			formats: ['zip', '7z', 'tar', 'tgz'],
			conversions: ['zip', 'tar']
		},
		Data: {
			formats: ['json', 'yaml', 'xml', 'csv', 'tsv'],
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
		selectedFiles.forEach((index) => {
			const file = files[index];
			const ext = getFileExtension(file.name);
			const group = getFormatGroup(ext);
			if (group && formatGroups[group as keyof typeof formatGroups]) {
				formatGroups[group as keyof typeof formatGroups].conversions.forEach((f) =>
					formats.add(f)
				);
			}
		});
		return Array.from(formats);
	})();
</script>

<div class="card card-body space-y-5">
	<div class="flex items-start justify-between gap-4 pb-4 border-b border-ez-border">
		<div>
			<div class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em]">
				batch
			</div>
			<h3 class="text-xl text-ez-white mt-1">Batch conversion</h3>
		</div>
		<div class="flex flex-wrap gap-2 justify-end">
			<span class="badge badge-neutral">
				{files.length} file{files.length !== 1 ? 's' : ''}
			</span>
			<span class="badge badge-neutral">{formatFileSize(totalSize)}</span>
			{#if selectedCount > 0}
				<span class="badge badge-yellow">
					{selectedCount} selected · {formatFileSize(selectedSize)}
				</span>
			{/if}
		</div>
	</div>

	<div class="flex gap-2">
		<button type="button" class="btn btn-ghost btn-sm" on:click={toggleSelectAll}>
			{selectAll ? 'Deselect all' : 'Select all'}
		</button>
		{#if selectedCount > 0}
			<button type="button" class="btn btn-danger btn-sm" on:click={removeSelected}>
				Remove selected
			</button>
		{/if}
	</div>

	<div class="max-h-[400px] overflow-y-auto space-y-3">
		{#each Object.entries(fileGroups) as [format, items]}
			<div class="border border-ez-border rounded-md overflow-hidden">
				<div class="flex items-center justify-between px-3 py-2 bg-ez-s2 border-b border-ez-border">
					<div class="flex items-center gap-2">
						<span class="badge badge-neutral">{format.toUpperCase()}</span>
						<span class="font-mono text-xs text-ez-muted">
							{items.length} file{items.length !== 1 ? 's' : ''}
						</span>
					</div>
					<div class="flex gap-1">
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							on:click={() => selectByFormat(format)}
						>
							Select
						</button>
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							on:click={() => deselectByFormat(format)}
						>
							Deselect
						</button>
					</div>
				</div>
				<div class="max-h-[200px] overflow-y-auto">
					{#each items as { file, index }}
						<label
							class="flex items-center gap-3 px-3 py-2 border-b border-ez-border last:border-b-0 cursor-pointer transition-colors duration-fast hover:bg-ez-s2 {selectedFiles.has(
								index
							)
								? 'bg-ez-yellow/5'
								: ''}"
						>
							<input
								type="checkbox"
								checked={selectedFiles.has(index)}
								on:change={() => toggleFileSelection(index)}
								class="accent-ez-yellow"
							/>
							<span class="text-ez-text text-sm flex-1 truncate" title={file.name}>
								{file.name}
							</span>
							<span class="font-mono text-xs text-ez-muted shrink-0">
								{formatFileSize(file.size)}
							</span>
						</label>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#if selectedCount > 0}
		<div class="bg-ez-s0 border border-ez-border rounded-md p-4 space-y-4">
			<div class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em]">
				batch settings
			</div>

			<label class="block">
				<span
					class="block font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2"
				>Output format</span>
				<select
					bind:value={batchSettings.outputFormat}
					disabled={availableOutputFormats.length === 0}
					class="input"
				>
					<option value="">Select format...</option>
					{#each availableOutputFormats as format}
						<option value={format}>{format.toUpperCase()}</option>
					{/each}
				</select>
			</label>

			{#if batchSettings.outputFormat && ['jpeg', 'jpg', 'webp'].includes(batchSettings.outputFormat)}
				<label class="block">
					<span
						class="block font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2"
					>Quality ({batchSettings.quality}%)</span>
					<input
						type="range"
						min="10"
						max="100"
						step="5"
						bind:value={batchSettings.quality}
						class="w-full accent-ez-yellow"
					/>
				</label>
			{/if}

			<label class="flex items-center gap-2 text-ez-subtle text-sm cursor-pointer">
				<input
					type="checkbox"
					bind:checked={batchSettings.preserveMetadata}
					class="accent-ez-yellow"
				/>
				Preserve metadata
			</label>

			<label class="flex items-center gap-2 text-ez-subtle text-sm cursor-pointer">
				<input
					type="checkbox"
					bind:checked={batchSettings.createZip}
					class="accent-ez-yellow"
				/>
				Download as ZIP archive
			</label>

			<label class="block">
				<span
					class="block font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2"
				>File naming</span>
				<select bind:value={batchSettings.namingPattern} class="input">
					<option value="original">Keep original names</option>
					<option value="numbered">Number sequentially</option>
					<option value="timestamp">Add timestamp</option>
				</select>
			</label>

			<button
				type="button"
				class="btn btn-primary w-full justify-center"
				on:click={startBatchConversion}
				disabled={!batchSettings.outputFormat || isConverting}
			>
				{isConverting
					? 'Converting...'
					: `Convert ${selectedCount} file${selectedCount !== 1 ? 's' : ''} →`}
			</button>
		</div>
	{/if}
</div>
