<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { detectFileType, validateFile } from '$lib/conversion/config';
  import { notifications } from '$lib/stores/notifications';

  const dispatch = createEventDispatcher();

  let isDragging = false;
  let fileInput;
  let errors = [];

  function handleDrop(event) {
    event.preventDefault();
    isDragging = false;

    const files = Array.from(event.dataTransfer?.files || []);
    processFiles(files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event) {
    event.preventDefault();
    isDragging = false;
  }

  function handleFileSelect(event) {
    console.log('FileUploader: handleFileSelect called');
    const input = event.target;
    const files = Array.from(input.files || []);
    console.log('FileUploader: Selected files:', files.length, files.map(f => f.name));
    processFiles(files);

    // Reset input
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function processFiles(files) {
    console.log('FileUploader: processFiles called with', files.length, 'files');
    errors = [];
    const validFiles = [];
    const fileTypeErrors = [];
    const validationErrors = [];

    for (const file of files) {
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

<div class="file-uploader">
  <input
    bind:this={fileInput}
    type="file"
    multiple
    on:change={handleFileSelect}
    class="hidden-input"
  />

  <div
    class="drop-zone"
    class:dragging={isDragging}
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:click={openFileDialog}
    role="button"
    tabindex="0"
    on:keypress={(e) => e.key === 'Enter' && openFileDialog()}
  >
    <div class="drop-content">
      <div class="icon">📁</div>
      <h3>Drop files here or click to browse</h3>
      <p>Support for images, audio, documents, and more</p>

      <button class="browse-btn" on:click|stopPropagation={openFileDialog}>
        Browse Files
      </button>

      <div class="supported-formats">
        <span>Images</span> • <span>Audio</span> • <span>Documents</span> •
        <span>Archives</span> • <span>Text</span> • <span>Spreadsheets</span>
      </div>
    </div>
  </div>

  {#if errors.length > 0}
    <div class="errors">
      {#each errors as error}
        <div class="error">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{error.file}: {error.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .file-uploader {
    width: 100%;
  }

  .hidden-input {
    display: none;
  }

  .drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 1rem;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    background: #f9fafb;
  }

  .drop-zone:hover {
    border-color: #9ca3af;
    background: #f3f4f6;
  }

  .drop-zone.dragging {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  }

  .drop-content {
    pointer-events: none;
  }

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .drop-content h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #111827;
  }

  .drop-content p {
    margin: 0 0 1.5rem 0;
    color: #6b7280;
  }

  .browse-btn {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    pointer-events: auto;
  }

  .browse-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(102, 126, 234, 0.3);
  }

  .supported-formats {
    margin-top: 2rem;
    font-size: 0.875rem;
    color: #9ca3af;
  }

  .supported-formats span {
    color: #6b7280;
    font-weight: 500;
  }

  .errors {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #dc2626;
  }

  .error-icon {
    font-size: 1.25rem;
  }

  .error-text {
    flex: 1;
    text-align: left;
  }
</style>
