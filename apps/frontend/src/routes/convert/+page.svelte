<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { conversionManager } from "$lib/conversion/manager";
  import {
    FILE_TYPES,
    detectFileType,
    formatFileSize,
  } from "$lib/conversion/config";
  import { notifications } from "$lib/stores/notifications";
  import FileUploader from "./components/FileUploader.svelte";
  import ConversionOptions from "./components/ConversionOptions.svelte";
  import ConversionStatus from "./components/ConversionStatus.svelte";
  import ConversionResults from "./components/ConversionResults.svelte";
  import SEOHead from "$lib/components/SEOHead.svelte";

  // State
  let uploadedFiles: File[] = [];
  let selectedFiles: Set<string> = new Set();
  let fileTypeGroups: Map<
    string,
    { config: any; files: File[]; targetFormat: string; options: Record<string, any> }
  > = new Map();
  let conversions: Map<string, any> = new Map();
  let completedConversions: any[] = [];
  let conversionFileNames: Map<string, string> = new Map();

  // UI State
  let currentStep: "upload" | "configure" | "converting" | "complete" = "upload";
  let isConverting: boolean = false;

  // Subscriptions
  let subscriptions: Array<() => void> = [];

  onMount(() => {
    if (browser) {
      console.log("File conversion page initialized");
    }
  });

  onDestroy(() => {
    subscriptions.forEach((unsub) => unsub());
    subscriptions = [];
  });

  function handleFilesUploaded(event: CustomEvent<File[]>) {
    const newFiles = event.detail;

    // Filter out duplicates and validate file types
    const existingNames = new Set(uploadedFiles.map((f) => f.name));
    const uniqueFiles = [];
    const unsupportedFiles = [];

    for (const file of newFiles) {
      if (existingNames.has(file.name)) {
        continue;
      }

      const fileType = detectFileType(file);
      if (!fileType) {
        unsupportedFiles.push(file.name);
        continue;
      }

      uniqueFiles.push(file);
    }

    if (unsupportedFiles.length > 0) {
      notifications.error(
        `Unsupported file types`,
        `The following files are not supported: ${unsupportedFiles.join(", ")}.`
      );
    }

    uploadedFiles = [...uploadedFiles, ...uniqueFiles];

    // Auto-select new files
    uniqueFiles.forEach((f) => selectedFiles.add(f.name));
    selectedFiles = selectedFiles;

    if (uploadedFiles.length > 0) {
      currentStep = "configure";
      groupFilesByType();

      if (uniqueFiles.length > 0) {
        notifications.success(
          `Files loaded`,
          `Added ${uniqueFiles.length} file${uniqueFiles.length !== 1 ? "s" : ""}`
        );
      }
    }
  }

  function groupFilesByType(): void {
    fileTypeGroups.clear();

    const selected = uploadedFiles.filter((f) => selectedFiles.has(f.name));

    for (const file of selected) {
      const config = detectFileType(file);
      if (!config) continue;

      const typeKey = config.id;
      if (!fileTypeGroups.has(typeKey)) {
        fileTypeGroups.set(typeKey, {
          config,
          files: [],
          targetFormat: config.supportedOutputs?.[0] || "",
          options: {},
        });
      }

      const group = fileTypeGroups.get(typeKey);
      if (group) {
        group.files.push(file);
      }
    }

    fileTypeGroups = fileTypeGroups;
  }

  function handleFileToggle(filename: string) {
    if (selectedFiles.has(filename)) {
      selectedFiles.delete(filename);
    } else {
      selectedFiles.add(filename);
    }
    selectedFiles = selectedFiles;
    groupFilesByType();
  }

  function removeFile(filename: string): void {
    uploadedFiles = uploadedFiles.filter((f) => f.name !== filename);
    selectedFiles.delete(filename);
    selectedFiles = selectedFiles;

    if (uploadedFiles.length === 0) {
      currentStep = "upload";
      fileTypeGroups.clear();
    } else {
      groupFilesByType();
    }
  }

  function clearAll(): void {
    uploadedFiles = [];
    selectedFiles.clear();
    selectedFiles = selectedFiles;
    fileTypeGroups.clear();
    fileTypeGroups = fileTypeGroups;
    currentStep = "upload";
    completedConversions = [];
    conversions.clear();
    conversions = conversions;
    conversionFileNames.clear();
  }

  function updateTargetFormat(typeKey: string, format: string): void {
    const group = fileTypeGroups.get(typeKey);
    if (group) {
      group.targetFormat = format;
      fileTypeGroups = fileTypeGroups;
    }
  }

  async function startConversion(): Promise<void> {
    if (fileTypeGroups.size === 0) return;

    isConverting = true;
    currentStep = "converting";
    conversions.clear();
    completedConversions = [];

    for (const [typeKey, group] of fileTypeGroups) {
      if (!group.targetFormat) continue;

      for (const file of group.files) {
        try {
          const id = await conversionManager.convert(
            file,
            group.targetFormat,
            group.options || {}
          );

          conversionFileNames.set(id, file.name);

          const unsubscribe = conversionManager.subscribe(id, async (state) => {
            conversions.set(id, state);
            conversions = conversions;

            if (state.status === "completed" || state.status === "failed") {
              if (state.status === "failed") {
                notifications.error(
                  `Conversion failed: ${file.name}`,
                  state.error?.message || state.message || "An error occurred"
                );
              }

              const existingIndex = completedConversions.findIndex(
                (c) => c.id === state.id
              );
              if (existingIndex >= 0) {
                completedConversions[existingIndex] = state;
                completedConversions = [...completedConversions];
              } else {
                completedConversions = [...completedConversions, state];
              }

              const allDone = Array.from(conversions.values()).every(
                (s) => s.status === "completed" || s.status === "failed"
              );

              if (allDone) {
                isConverting = false;
                currentStep = "complete";
              }
            }
          });

          subscriptions.push(unsubscribe);
        } catch (error) {
          console.error("Failed to start conversion:", error);
          const errorId = `error_${Date.now()}_${Math.random()}`;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const errorState = {
            id: errorId,
            status: "failed",
            progress: 0,
            message: `Failed to start: ${errorMessage}`,
            error: error instanceof Error ? error : new Error("Unknown error"),
          };
          conversions.set(errorId, errorState);
          completedConversions = [...completedConversions, errorState];
          conversionFileNames.set(errorId, file.name);

          notifications.error(
            `Conversion failed`,
            `Could not convert ${file.name}: ${errorMessage}`
          );
        }
      }
    }
  }

  function handleCancel(id: string): void {
    conversionManager.cancel(id);
  }

  function handleDownload(state: any): void {
    if (!state || !state.result) return;

    const blob = state.result.outputFile;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notifications.success(
      `Downloaded: ${state.result.filename}`,
      `File saved successfully`
    );
  }

  function startNewConversion(): void {
    currentStep = "upload";
    uploadedFiles = [];
    selectedFiles.clear();
    selectedFiles = selectedFiles;
    fileTypeGroups.clear();
    fileTypeGroups = fileTypeGroups;
    completedConversions = [];
    conversions.clear();
    conversions = conversions;
    conversionFileNames.clear();
    conversionManager.clearCompleted();
  }

  $: canConvert = (() => {
    if (fileTypeGroups.size === 0 || isConverting) return false;
    for (const group of fileTypeGroups.values()) {
      if (!group.targetFormat) return false;
    }
    return true;
  })();

  $: totalFilesToConvert = Array.from(fileTypeGroups.values()).reduce(
    (sum, group) => sum + group.files.length,
    0
  );
</script>

<SEOHead
  title="File Converter - Convert Files Online Free & Private"
  description="Convert files between formats instantly in your browser. Support for PDF, images, documents, audio, and more. Fast, secure, and completely private."
  keywords="file converter, pdf converter, image converter, document converter, online converter, free converter"
/>

<div class="file-convert-page">
  <div class="main-content">
    <div class="header">
      <h1>File Converter</h1>
      <p class="subtitle">
        Convert files locally in your browser - 100% private, no uploads
      </p>

      <div class="steps">
        <div class="step" class:active={currentStep === "upload"}>
          <span class="step-number">1</span>
          <span class="step-label">Upload</span>
        </div>
        <div class="step" class:active={currentStep === "configure"}>
          <span class="step-number">2</span>
          <span class="step-label">Configure</span>
        </div>
        <div class="step" class:active={currentStep === "converting"}>
          <span class="step-number">3</span>
          <span class="step-label">Converting</span>
        </div>
        <div class="step" class:active={currentStep === "complete"}>
          <span class="step-number">4</span>
          <span class="step-label">Complete</span>
        </div>
      </div>
    </div>

    <div class="content">
      {#if currentStep === "upload" || currentStep === "configure"}
        <div class="upload-section">
          <FileUploader on:files={handleFilesUploaded} />

          {#if uploadedFiles.length > 0}
            <div class="files-list">
              <div class="files-header">
                <h3>
                  Selected Files ({selectedFiles.size}/{uploadedFiles.length})
                </h3>
                <button class="clear-btn" on:click={clearAll}>Clear All</button>
              </div>

              <div class="files">
                {#each uploadedFiles as file}
                  {@const config = detectFileType(file)}
                  <div
                    class="file-item"
                    class:selected={selectedFiles.has(file.name)}
                  >
                    <label class="file-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.name)}
                        on:change={() => handleFileToggle(file.name)}
                      />
                      <span class="file-icon">{config?.icon || "📄"}</span>
                      <div class="file-details">
                        <span class="file-name">{file.name}</span>
                        <span class="file-info">
                          {config?.name || "Unknown"} • {formatFileSize(file.size)}
                        </span>
                      </div>
                    </label>
                    <button
                      class="remove-btn"
                      on:click={() => removeFile(file.name)}>×</button
                    >
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        {#if currentStep === "configure" && fileTypeGroups.size > 0}
          <div class="configure-section">
            <h3>Choose Output Formats</h3>

            <div class="type-groups">
              {#each [...fileTypeGroups.entries()] as [typeKey, group]}
                <div class="type-group">
                  <div class="group-header">
                    <div class="group-title">
                      <span class="group-icon">{group.config.icon}</span>
                      <h4>{group.config.name} Files</h4>
                      <span class="file-count">({group.files.length})</span>
                    </div>
                  </div>

                  <div class="group-files">
                    {#each group.files as file}
                      <div class="group-file">
                        <span class="file-bullet">•</span>
                        <span class="file-name">{file.name}</span>
                      </div>
                    {/each}
                  </div>

                  <div class="format-selection">
                    <div class="format-label">Convert to:</div>
                    {#if group.config.supportedOutputs?.length > 0}
                      <div class="format-grid">
                        {#each group.config.supportedOutputs as outputId}
                          {@const outputFormat = FILE_TYPES[outputId]}
                          {#if outputFormat}
                            <button
                              class="format-option"
                              class:selected={group.targetFormat === outputId}
                              on:click={() => updateTargetFormat(typeKey, outputId)}
                            >
                              <span class="format-icon">{outputFormat.icon}</span>
                              <span class="format-name">{outputFormat.name}</span>
                              <span class="format-ext">.{outputFormat.extensions[0]}</span>
                            </button>
                          {/if}
                        {/each}
                      </div>
                    {:else}
                      <p class="no-formats">No conversion options available</p>
                    {/if}
                  </div>

                  {#if group.targetFormat && group.config.category === "audio"}
                    <ConversionOptions
                      sourceFormat={group.config.id}
                      targetFormat={group.targetFormat}
                      bind:options={group.options}
                    />
                  {/if}
                </div>
              {/each}
            </div>

            <div class="actions">
              <button
                class="convert-btn primary"
                disabled={!canConvert}
                on:click={startConversion}
              >
                Convert {totalFilesToConvert} File{totalFilesToConvert !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        {/if}
      {/if}

      {#if currentStep === "converting"}
        <div class="converting-section">
          <h2>Converting Files...</h2>

          <div class="conversions">
            {#each [...conversions.values()] as state}
              <ConversionStatus
                {state}
                fileName={conversionFileNames.get(state.id) || "Unknown"}
                on:cancel={() => handleCancel(state.id)}
              />
            {/each}
          </div>
        </div>
      {/if}

      {#if currentStep === "complete"}
        <div class="complete-section">
          <h2>Conversion Complete!</h2>

          <ConversionResults
            conversions={completedConversions}
            fileNames={conversionFileNames}
            on:download={(e) => handleDownload(e.detail)}
          />

          <div class="actions">
            <button class="convert-btn primary" on:click={startNewConversion}>
              Convert More Files
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .file-convert-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }

  .steps {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 1rem;
    flex-wrap: wrap;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.5;
    transition: opacity 0.3s;
  }

  .step.active {
    opacity: 1;
  }

  .step-number {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e5e7eb;
    border-radius: 50%;
    font-weight: 600;
  }

  .step.active .step-number {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .step-label {
    font-weight: 500;
  }

  .content {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    padding: 2rem;
  }

  .files-list {
    margin-top: 2rem;
  }

  .files-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .files-header h3 {
    margin: 0;
  }

  .clear-btn {
    padding: 0.5rem 1rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .clear-btn:hover {
    background: #dc2626;
  }

  .files {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .file-item.selected {
    background: #eff6ff;
    border-color: #3b82f6;
  }

  .file-checkbox {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    flex: 1;
  }

  .file-checkbox input {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .file-icon {
    font-size: 1.5rem;
  }

  .file-details {
    display: flex;
    flex-direction: column;
  }

  .file-name {
    font-weight: 500;
  }

  .file-info {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .remove-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1.5rem;
  }

  .remove-btn:hover {
    background: #dc2626;
  }

  .configure-section {
    margin-top: 2rem;
  }

  .configure-section h3 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .type-groups {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .type-group {
    padding: 1.5rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
  }

  .group-header {
    margin-bottom: 1rem;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .group-icon {
    font-size: 1.5rem;
  }

  .group-title h4 {
    margin: 0;
    font-size: 1.125rem;
  }

  .file-count {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .group-files {
    margin-bottom: 1.5rem;
    padding-left: 2.5rem;
  }

  .group-file {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .format-selection {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
  }

  .format-label {
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: #374151;
  }

  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .format-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .format-option:hover {
    border-color: #9ca3af;
    transform: translateY(-1px);
  }

  .format-option.selected {
    background: rgba(102, 126, 234, 0.1);
    border-color: #667eea;
  }

  .format-icon {
    font-size: 1.5rem;
  }

  .format-name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .format-ext {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .no-formats {
    color: #6b7280;
    font-style: italic;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }

  .convert-btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .convert-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .convert-btn.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(102, 126, 234, 0.3);
  }

  .convert-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .converting-section,
  .complete-section {
    text-align: center;
  }

  .converting-section h2,
  .complete-section h2 {
    margin-bottom: 2rem;
  }

  .conversions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .file-convert-page {
      padding: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .steps {
      gap: 1rem;
    }

    .format-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
  }
</style>
