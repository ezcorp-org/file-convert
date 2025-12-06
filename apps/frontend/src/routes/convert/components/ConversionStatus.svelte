<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let state;
  export let fileName;

  const dispatch = createEventDispatcher();

  function getStatusIcon(statusValue: string) {
    switch (statusValue) {
      case "pending":
        return "⏳";
      case "validating":
        return "🔍";
      case "converting":
        return "⚙️";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      default:
        return "⏸️";
    }
  }

  function getStatusColor(statusValue: string) {
    switch (statusValue) {
      case "pending":
        return "#9ca3af";
      case "validating":
        return "#3b82f6";
      case "converting":
        return "#8b5cf6";
      case "completed":
        return "#10b981";
      case "failed":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }

  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  $: elapsedTime =
    state.startTime && !state.endTime
      ? Date.now() - state.startTime
      : state.startTime && state.endTime
        ? state.endTime - state.startTime
        : 0;
</script>

<div class="conversion-status">
  <div class="status-header">
    <span class="status-icon">{getStatusIcon(state.status)}</span>
    <div class="file-info">
      <span class="file-name">{fileName}</span>
      <span class="status-message">{state.message || state.status}</span>
    </div>
    {#if state.status === "converting" || state.status === "validating"}
      <button class="cancel-btn" on:click={() => dispatch("cancel")}>
        Cancel
      </button>
    {/if}
  </div>

  {#if state.status === "converting" || state.status === "validating"}
    <div class="progress-bar">
      <div
        class="progress-fill"
        style="width: {state.progress}%; background: {getStatusColor(
          state.status,
        )}"
      />
    </div>
    <div class="progress-info">
      <span class="progress-percent">{state.progress}%</span>
      {#if elapsedTime > 0}
        <span class="elapsed-time">{formatTime(elapsedTime)}</span>
      {/if}
    </div>
  {/if}

  {#if state.status === "failed" && (state.error || state.message)}
    <div class="error-details">
      <span class="error-message"
        >{state.error?.message || state.message || "Conversion failed"}</span
      >
    </div>
  {/if}
</div>

<style>
  .conversion-status {
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .status-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status-icon {
    font-size: 1.5rem;
  }

  .file-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .file-name {
    font-weight: 500;
    color: #111827;
  }

  .status-message {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .cancel-btn {
    padding: 0.5rem 1rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #dc2626;
  }

  .progress-bar {
    margin-top: 1rem;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .error-details {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
  }
</style>
