<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { detectFileType, validateFile } from '$lib/conversion/config';
  import { validateFileType } from '$lib/utils/file-validation';
  import { notifications } from '$lib/stores/notifications';

  const dispatch = createEventDispatcher();

  let isDragging = false;
  let fileInput;
  let errors = [];

  async function handleDrop(event) {
    event.preventDefault();
    isDragging = false;

    const files = Array.from(event.dataTransfer?.files || []);
    await processFiles(files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event) {
    event.preventDefault();
    isDragging = false;
  }

  async function handleFileSelect(event) {
    console.log('FileUploader: handleFileSelect called');
    const input = event.target;
    const files = Array.from(input.files || []);
    console.log('FileUploader: Selected files:', files.length, files.map(f => f.name));
    await processFiles(files);

    // Reset input
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async function processFiles(files) {
    console.log('FileUploader: processFiles called with', files.length, 'files');
    errors = [];
    const validFiles = [];
    const fileTypeErrors = [];
    const validationErrors = [];

    for (const file of files) {
      // Zero-byte validation (ERROR-04)
      if (file.size === 0) {
        errors.push({
          file: file.name,
          message: 'File is empty (0 bytes)'
        });
        validationErrors.push(`${file.name}: File is empty`);
        continue;
      }

      // Detect file type
      const config = detectFileType(file);

      if (!config) {
        const errorMsg = 'Unsupported file type';
        errors.push({
          file: file.name,
          message: errorMsg
        });
        fileTypeErrors.push(file.name);
        continue;
      }

      // Validate file with config
      const validation = validateFile(file, config);

      if (!validation.valid) {
        const errorMsg = validation.reason || 'Invalid file';
        errors.push({
          file: file.name,
          message: errorMsg
        });
        validationErrors.push(`${file.name}: ${errorMsg}`);
        continue;
      }

      // Magic byte / content validation (ERROR-05)
      const typeValidation = await validateFileType(file);

      if (!typeValidation.isValid) {
        if (typeValidation.detectedType) {
          // Extension spoofing detected - warn but allow (per CONTEXT.md policy)
          const extension = file.name.split('.').pop()?.toLowerCase() || '';
          notifications.warning(
            'Format mismatch detected',
            `${file.name} appears to be ${typeValidation.detectedType.toUpperCase()}, not ${extension.toUpperCase()}. The file will still be processed.`
          );
          // File is still added to validFiles per "warn but allow" policy
        } else if (typeValidation.reason) {
          // Truly corrupted file (no valid magic bytes) - reject
          errors.push({
            file: file.name,
            message: typeValidation.reason
          });
          validationErrors.push(`${file.name}: ${typeValidation.reason}`);
          continue;
        }
      }

      validFiles.push(file);
    }

    console.log('FileUploader: Valid files after processing:', validFiles.length);
    console.log('FileUploader: Errors during processing:', errors.length, errors);

    // Show categorized toast notifications for upload errors
    if (fileTypeErrors.length > 0) {
      notifications.error(
        `Unsupported file types (${fileTypeErrors.length})`,
        `The following files are not supported: ${fileTypeErrors.join(', ')}.\n\nSupported formats include: TXT, CSV, JSON, XML, YAML, PDF, images, and more.`
      );
    }

    if (validationErrors.length > 0) {
      notifications.error(
        `File validation failed (${validationErrors.length})`,
        `Files failed validation:\n${validationErrors.join('\n')}\n\nCommon issues: file too large, corrupted file, or invalid format.`
      );
    }

    if (validFiles.length > 0) {
      console.log('FileUploader: Dispatching', validFiles.length, 'valid files');
      dispatch('files', validFiles);
    } else if (files.length > 0) {
      // If no valid files but we had input files, show an overall failure message
      console.log('FileUploader: No valid files to dispatch');
      notifications.error(
        'No files could be uploaded',
        `All ${files.length} file${files.length !== 1 ? 's' : ''} failed validation. Please check the file types and try again.`
      );
    }

    // Clear local errors after shorter time since we now use toasts
    if (errors.length > 0) {
      setTimeout(() => {
        errors = [];
      }, 3000);
    }
  }

  function openFileDialog() {
    fileInput?.click();
  }
</script>

<div class="file-uploader w-full">
  <input
    bind:this={fileInput}
    type="file"
    multiple
    on:change={handleFileSelect}
    class="hidden"
  />

  <div
    class="drop-zone card flex flex-col items-center justify-center text-center min-h-[260px] p-8 border-2 border-dashed cursor-pointer transition-all duration-base
    {isDragging
      ? 'dragging border-ez-yellow bg-ez-yellow/5'
      : 'border-ez-border-lt hover:border-ez-yellow hover:bg-ez-s2'}"
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:click={openFileDialog}
    role="button"
    tabindex="0"
    on:keypress={(e) => e.key === 'Enter' && openFileDialog()}
  >
    <div class="drop-content pointer-events-none flex flex-col items-center">
      <div class="text-ez-yellow text-4xl leading-none mb-3" aria-hidden="true">&darr;</div>
      <h3 class="text-ez-white font-semibold text-md m-0">Drop files here or click to browse</h3>
      <p class="text-ez-subtle text-sm mt-1 mb-5">Support for images, audio, documents, and more</p>

      <button
        class="btn btn-primary pointer-events-auto"
        on:click|stopPropagation={openFileDialog}
        type="button"
      >
        Browse Files
      </button>

      <div class="font-mono text-xs text-ez-muted mt-6 uppercase tracking-[0.1em] flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span class="text-ez-subtle">Images</span><span aria-hidden="true">·</span>
        <span class="text-ez-subtle">Audio</span><span aria-hidden="true">·</span>
        <span class="text-ez-subtle">Documents</span><span aria-hidden="true">·</span>
        <span class="text-ez-subtle">Archives</span><span aria-hidden="true">·</span>
        <span class="text-ez-subtle">Text</span><span aria-hidden="true">·</span>
        <span class="text-ez-subtle">Spreadsheets</span>
      </div>
    </div>
  </div>

  {#if errors.length > 0}
    <div class="errors mt-4 flex flex-col gap-2">
      {#each errors as error}
        <div class="alert alert-danger">
          <span class="font-mono text-lg leading-none mt-0.5 shrink-0 text-ez-red-lt" aria-hidden="true">!</span>
          <div class="flex-1 min-w-0 text-left">
            <span class="font-semibold text-ez-white text-sm">{error.file}:</span>
            <span class="text-ez-subtle text-sm">{error.message}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
