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
	class="drop-zone"
	class:dragging={isDragging}
	data-testid="file-drop-zone"
	on:dragenter={handleDragEnter}
	on:dragleave={handleDragLeave}
	on:dragover={handleDragOver}
	on:drop={handleDrop}
	on:click={openFileDialog}
	role="button"
	tabindex="0"
	on:keydown={(e) => e.key === 'Enter' && openFileDialog()}
>
	<input
		bind:this={fileInput}
		type="file"
		accept={acceptAttribute}
		{multiple}
		on:change={handleFileInput}
		style="display: none;"
	/>

	<div class="drop-content">
		<svg class="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="17 8 12 3 7 8" />
			<line x1="12" y1="3" x2="12" y2="15" />
		</svg>

		<h3>Drop files here or click to browse</h3>
		<p>Supports images, audio, documents, archives, and more</p>
	</div>
</div>

<style>
	.drop-zone {
		border: 2px dashed var(--gray-400);
		border-radius: var(--border-radius);
		padding: 3rem;
		text-align: center;
		cursor: pointer;
		transition: all var(--transition-speed);
		background: var(--white);
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.drop-zone:hover,
	.drop-zone.dragging {
		border-color: var(--primary);
		background: rgba(0, 123, 255, 0.05);
	}

	.drop-zone:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.drop-content {
		pointer-events: none;
	}

	.upload-icon {
		color: var(--gray-500);
		margin-bottom: 1rem;
	}

	.drop-zone.dragging .upload-icon {
		color: var(--primary);
		animation: bounce 0.5s ease-in-out;
	}

	h3 {
		color: var(--gray-800);
		margin: 1rem 0 0.5rem;
	}

	p {
		color: var(--gray-600);
		margin: 0.5rem 0;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
</style>
