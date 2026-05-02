<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let state;
  export let fileName;

  const dispatch = createEventDispatcher();

  function getStatusGlyph(statusValue: string) {
    switch (statusValue) {
      case "pending":
        return "·";
      case "validating":
        return "·";
      case "converting":
        return "·";
      case "completed":
        return "✓";
      case "failed":
        return "×";
      default:
        return "·";
    }
  }

  function getStatusColorClass(statusValue: string) {
    switch (statusValue) {
      case "pending":
        return "text-ez-muted";
      case "validating":
        return "text-ez-info";
      case "converting":
        return "text-ez-yellow";
      case "completed":
        return "text-ez-success";
      case "failed":
        return "text-ez-red-lt";
      default:
        return "text-ez-muted";
    }
  }

  function getProgressBarClass(statusValue: string) {
    if (statusValue === "validating") return "bg-ez-info";
    return "bg-ez-yellow";
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

<div class="card card-body">
  <div class="flex items-center gap-3">
    <span
      class="font-mono text-lg leading-none shrink-0 {getStatusColorClass(state.status)}"
      aria-hidden="true"
    >{getStatusGlyph(state.status)}</span>
    <div class="flex-1 min-w-0 flex flex-col">
      <span class="text-ez-white font-semibold text-sm truncate">{fileName}</span>
      <span class="font-mono text-xs text-ez-muted">{state.message || state.status}</span>
    </div>
    {#if state.status === "converting" || state.status === "validating"}
      <button class="btn btn-ghost btn-sm" on:click={() => dispatch("cancel")} type="button">
        Cancel
      </button>
    {/if}
  </div>

  {#if state.status === "converting" || state.status === "validating"}
    <div class="h-2 bg-ez-s2 rounded-pill overflow-hidden mt-4">
      <div
        class="h-full transition-all duration-base {getProgressBarClass(state.status)}"
        style="width: {state.progress}%"
      ></div>
    </div>
    <div class="progress-info flex justify-between mt-2 font-mono text-xs text-ez-muted">
      <span>{state.progress}%</span>
      {#if elapsedTime > 0}
        <span>{formatTime(elapsedTime)}</span>
      {/if}
    </div>
  {/if}

  {#if state.status === "failed" && (state.error || state.message)}
    <div class="alert alert-danger mt-4">
      <span class="font-mono text-lg leading-none shrink-0 text-ez-red-lt" aria-hidden="true">×</span>
      <span class="text-sm flex-1">{state.error?.message || state.message || "Conversion failed"}</span>
    </div>
  {/if}
</div>
