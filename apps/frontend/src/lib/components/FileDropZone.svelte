<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formats, getFormat } from '$lib/utils/conversion-registry';
	import { validateFileComplete, generateAcceptAttribute } from '$lib/utils/file-validation';

	const dispatch = createEventDispatcher();

	let isDragging = false;
	let dragCounter = 0;
	let fileInput: HTMLInputElement;

	export let accept: string | undefined = undefined;
	export let multiple = true;
	export let category: string | undefined = undefined;

	// Generate accept attribute based on supported formats
	$: acceptAttribute = accept || generateAcceptAttribute(category);

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter++;
		if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
			isDragging = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter--;
		if (dragCounter === 0) {
			isDragging = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
		dragCounter = 0;

		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			handleFiles(e.dataTransfer.files);
		}
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			handleFiles(target.files);
		}
	}

	async function handleFiles(fileList: FileList) {
		console.log('[FileDropZone] handleFiles called with', fileList.length, 'files');
		const files = Array.from(fileList);
		const validFiles: File[] = [];
		const validationErrors: Array<{
			file: File;
			reason: string;
			typeError?: string;
		}> = [];

		for (const file of files) {
			console.log('[FileDropZone] Validating file:', file.name, 'type:', file.type, 'size:', file.size);
			// Perform complete validation
			const validation = await validateFileComplete(file);
			console.log('[FileDropZone] Validation result:', validation);

			if (!validation.typeValidation.isValid) {
				// File type is not supported
				validationErrors.push({
					file,
					reason: validation.typeValidation.reason || 'Unsupported file type',
					typeError: validation.typeValidation.detectedType
				});
			} else {
				validFiles.push(file);
			}
		}

		// Dispatch validation errors
		if (validationErrors.length > 0) {
			dispatch('validation-errors', validationErrors);
		}

		// Dispatch valid files
		if (validFiles.length > 0) {
			console.log('[FileDropZone] Dispatching', validFiles.length, 'valid files');
			if (!multiple && validFiles.length > 1) {
				dispatch('files', [validFiles[0]]);
			} else {
				dispatch('files', validFiles);
			}
		} else {
			console.log('[FileDropZone] No valid files to dispatch');
		}
	}

	function openFileDialog() {
		fileInput?.click();
	}
</script>

<div
	role="button"
	tabindex="0"
	data-testid="file-drop-zone"
	class="card flex flex-col items-center justify-center text-center min-h-[260px] p-8 border-2 border-dashed cursor-pointer transition-all duration-base
	{isDragging
		? 'border-ez-yellow bg-ez-yellow/5'
		: 'border-ez-border-lt hover:border-ez-yellow hover:bg-ez-s2'}"
	on:dragenter={handleDragEnter}
	on:dragleave={handleDragLeave}
	on:dragover={handleDragOver}
	on:drop={handleDrop}
	on:click={openFileDialog}
	on:keydown={(e) => e.key === 'Enter' && openFileDialog()}
>
	<input
		bind:this={fileInput}
		type="file"
		accept={acceptAttribute}
		{multiple}
		on:change={handleFileInput}
		class="hidden"
	/>

	<div class="text-ez-yellow text-4xl leading-none mb-3" aria-hidden="true">&darr;</div>
	<p class="text-ez-white font-semibold text-md">Drop files here</p>
	<p class="text-ez-subtle text-sm mt-1">
		or <span class="text-ez-yellow underline">click to browse</span>
	</p>
	<p class="font-mono text-xs text-ez-muted mt-4 uppercase tracking-[0.1em]">
		Up to 10GB · Any format · Stays in your browser
	</p>
</div>
