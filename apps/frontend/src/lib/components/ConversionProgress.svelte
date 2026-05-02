<script lang="ts">
	import type { ConversionProgress } from '$lib/workers/worker-manager';

	export let progress: ConversionProgress;
	export let fileName: string;
	export let fromFormat: string;
	export let toFormat: string;

	$: progressPercent = Math.min(100, Math.max(0, progress.progress));
	$: isComplete = progressPercent === 100;

	function truncateFileName(name: string, maxLength = 36): string {
		if (name.length <= maxLength) return name;
		const ext = name.split('.').pop() || '';
		const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
		const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 4);
		return `${truncatedName}...${ext ? '.' + ext : ''}`;
	}
</script>

<div class="card card-body">
	<div class="flex items-center justify-between gap-3 mb-3">
		<div class="flex items-center gap-2 min-w-0 flex-1">
			<span class="text-ez-white font-semibold text-sm truncate" title={fileName}>
				{truncateFileName(fileName)}
			</span>
			<span class="font-mono text-xs text-ez-muted shrink-0" aria-hidden="true">&rarr;</span>
			<span class="font-mono text-xs text-ez-yellow uppercase tracking-[0.1em] shrink-0">
				{toFormat}
			</span>
		</div>
		<div class="font-mono text-xs text-ez-muted shrink-0">{progressPercent}%</div>
	</div>

	<div class="h-2 bg-ez-s2 rounded-pill overflow-hidden">
		<div
			class="h-full transition-all duration-base {isComplete
				? 'bg-ez-success'
				: 'bg-ez-yellow'}"
			style="width: {progressPercent}%"
		></div>
	</div>

	{#if progress.message}
		<div class="font-mono text-xs text-ez-muted mt-3 flex items-center gap-2">
			{#if isComplete}
				<span class="text-ez-success" aria-hidden="true">✓</span>
			{:else}
				<span class="text-ez-yellow" aria-hidden="true">·</span>
			{/if}
			<span class="flex-1 truncate">{progress.message}</span>
			<span class="text-ez-muted" data-from-format={fromFormat}></span>
		</div>
	{/if}
</div>
