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
  type Step = "upload" | "configure" | "converting" | "complete";
  let currentStep: Step = "upload";
  let isConverting: boolean = false;

  const steps: Array<{ key: Step; label: string }> = [
    { key: "upload", label: "Upload" },
    { key: "configure", label: "Configure" },
    { key: "converting", label: "Converting" },
    { key: "complete", label: "Complete" },
  ];

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

  $: currentStepIndex = steps.findIndex((s) => s.key === currentStep);
</script>

<SEOHead
  title="File Converter - Convert Files Online Free & Private"
  description="Convert files between formats instantly in your browser. Support for PDF, images, documents, audio, and more. Fast, secure, and completely private."
  keywords="file converter, pdf converter, image converter, document converter, online converter, free converter"
/>

<!-- Header -->
<div class="max-w-4xl mx-auto px-6 pt-12 pb-8">
  <div class="section-eyebrow">file convert</div>
  <h1 class="text-3xl font-bold tracking-[-0.03em] text-ez-white">Convert.</h1>
  <p class="text-ez-subtle mt-2">Local. Private. Fast. Files never leave your device.</p>
</div>

<!-- Step indicator -->
<div class="max-w-4xl mx-auto px-6 mb-8">
  <ol class="flex flex-wrap items-center gap-2 font-mono text-xs text-ez-muted uppercase tracking-[0.1em]">
    {#each steps as s, i}
      <li class="flex items-center gap-2">
        <span
          class="w-6 h-6 rounded-pill flex items-center justify-center {currentStepIndex === i
            ? 'bg-ez-yellow text-ez-black'
            : currentStepIndex > i
              ? 'bg-ez-s3 text-ez-text'
              : 'bg-ez-s2 text-ez-muted'}"
        >{i + 1}</span>
        <span class={currentStepIndex === i ? 'text-ez-yellow' : ''}>{s.label}</span>
        {#if i < steps.length - 1}
          <span class="text-ez-border ml-2">/</span>
        {/if}
      </li>
    {/each}
  </ol>
</div>

<!-- Main content -->
<div class="max-w-4xl mx-auto px-6 pb-20 space-y-6">
  {#if currentStep === "upload" || currentStep === "configure"}
    <div class="card card-body">
      <FileUploader on:files={handleFilesUploaded} />
    </div>

    {#if uploadedFiles.length > 0}
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="text-lg text-ez-white">Selected files</h3>
            <p class="font-mono text-xs text-ez-muted mt-1">
              {selectedFiles.size}/{uploadedFiles.length} selected
            </p>
          </div>
          <button class="btn btn-ghost btn-sm" on:click={clearAll}>Clear all</button>
        </div>

        <div class="p-6 space-y-2">
          {#each uploadedFiles as file}
            {@const config = detectFileType(file)}
            {@const isSelected = selectedFiles.has(file.name)}
            <div
              class="bg-ez-s2 border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-fast {isSelected
                ? 'border-ez-border-lt'
                : 'border-ez-border opacity-60'}"
            >
              <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  class="w-4 h-4 accent-ez-yellow cursor-pointer"
                  checked={isSelected}
                  on:change={() => handleFileToggle(file.name)}
                />
                <div class="flex flex-col min-w-0">
                  <span class="text-ez-text truncate">{file.name}</span>
                  <span class="font-mono text-xs text-ez-muted mt-0.5">
                    {config?.name || "Unknown"} · {formatFileSize(file.size)}
                  </span>
                </div>
              </label>
              <button
                class="btn btn-ghost btn-icon"
                aria-label="Remove file"
                on:click={() => removeFile(file.name)}
              >×</button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if currentStep === "configure" && fileTypeGroups.size > 0}
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg text-ez-white">Pick output formats</h3>
          <span class="font-mono text-xs text-ez-muted">{fileTypeGroups.size} group{fileTypeGroups.size !== 1 ? 's' : ''}</span>
        </div>

        <div class="p-6 space-y-6">
          {#each [...fileTypeGroups.entries()] as [typeKey, group]}
            <div class="bg-ez-s2 border border-ez-border rounded-md p-5">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-md text-ez-white">{group.config.name}</h4>
                <span class="font-mono text-xs text-ez-muted">{group.files.length} file{group.files.length !== 1 ? 's' : ''}</span>
              </div>

              <ul class="space-y-1 mb-5">
                {#each group.files as file}
                  <li class="font-mono text-xs text-ez-muted truncate">— {file.name}</li>
                {/each}
              </ul>

              <div class="border-t border-ez-border pt-4">
                <div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.1em] mb-3">Convert to</div>
                {#if group.config.supportedOutputs?.length > 0}
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {#each group.config.supportedOutputs as outputId}
                      {@const outputFormat = FILE_TYPES[outputId]}
                      {#if outputFormat}
                        <button
                          class="tool-card !p-3 !gap-1 text-left {group.targetFormat === outputId ? '!border-ez-yellow !bg-ez-s3' : ''}"
                          on:click={() => updateTargetFormat(typeKey, outputId)}
                        >
                          <span class="text-ez-white text-sm font-semibold">{outputFormat.name}</span>
                          <span class="font-mono text-xs text-ez-muted">.{outputFormat.extensions[0]}</span>
                        </button>
                      {/if}
                    {/each}
                  </div>
                {:else}
                  <p class="text-ez-muted italic text-sm">No conversion options available.</p>
                {/if}
              </div>

              {#if group.targetFormat && group.config.category === "audio"}
                <div class="mt-5 border-t border-ez-border pt-4">
                  <ConversionOptions
                    sourceFormat={group.config.id}
                    targetFormat={group.targetFormat}
                    bind:options={group.options}
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="card-footer">
          <span class="font-mono text-xs text-ez-muted">
            {totalFilesToConvert} file{totalFilesToConvert !== 1 ? 's' : ''} queued
          </span>
          <button
            class="btn btn-primary btn-lg"
            disabled={!canConvert}
            on:click={startConversion}
          >
            Convert {totalFilesToConvert} file{totalFilesToConvert !== 1 ? "s" : ""} →
          </button>
        </div>
      </div>
    {/if}
  {/if}

  {#if currentStep === "converting"}
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg text-ez-white">Converting…</h2>
        <span class="font-mono text-xs text-ez-yellow">in progress</span>
      </div>
      <div class="p-6 space-y-3">
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
    <div class="alert alert-success">
      <div class="flex-1">
        <div class="font-semibold">Done.</div>
        <div class="text-sm text-ez-subtle mt-1">
          {completedConversions.length} file{completedConversions.length !== 1 ? 's' : ''} converted. Files stayed on your device.
        </div>
      </div>
    </div>

    <div class="card card-body">
      <ConversionResults
        conversions={completedConversions}
        fileNames={conversionFileNames}
        on:download={(e) => handleDownload(e.detail)}
      />
    </div>

    <div class="flex justify-center">
      <button class="btn btn-ghost btn-lg" on:click={startNewConversion}>
        Convert another
      </button>
    </div>
  {/if}
</div>
