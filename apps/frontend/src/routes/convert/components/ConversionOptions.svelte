<script lang="ts">
  import { getConversionOptions } from '$lib/conversion/config';

  export let sourceFormat: string;
  export let targetFormat: string;
  export let options: Record<string, any> = {};

  $: conversionOptions = getConversionOptions(sourceFormat, targetFormat);

  function handleNumberInput(id: string, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      options[id] = num;
    }
  }

  function handleBooleanInput(id: string, checked: boolean) {
    options[id] = checked;
  }

  function handleSelectInput(id: string, value: string) {
    // Parse value if it's a number
    const option = conversionOptions.find(o => o.id === id);
    if (option && option.options) {
      const selected = option.options.find(o => String(o.value) === value);
      if (selected) {
        options[id] = selected.value;
      }
    }
  }
</script>

{#if conversionOptions.length > 0}
  <div class="conversion-options card card-body mt-6">
    <div class="section-eyebrow">options</div>
    <h4 class="text-lg text-ez-white m-0 mb-4">Conversion Options</h4>

    <div class="grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
      {#each conversionOptions as option}
        <div class="flex flex-col gap-2">
          <label for={option.id} class="text-ez-text font-medium text-sm">{option.name}</label>

          {#if option.type === 'number'}
            <input
              type="number"
              id={option.id}
              value={options[option.id] ?? option.default}
              on:input={(e) => handleNumberInput(option.id, e.currentTarget.value)}
              class="input"
            />
          {:else if option.type === 'boolean'}
            <input
              type="checkbox"
              id={option.id}
              checked={options[option.id] ?? option.default}
              on:change={(e) => handleBooleanInput(option.id, e.currentTarget.checked)}
              class="w-5 h-5 cursor-pointer accent-ez-yellow"
            />
          {:else if option.type === 'select' && option.options}
            <select
              id={option.id}
              value={String(options[option.id] ?? option.default)}
              on:change={(e) => handleSelectInput(option.id, e.currentTarget.value)}
              class="input"
            >
              {#each option.options as opt}
                <option value={String(opt.value)}>{opt.label}</option>
              {/each}
            </select>
          {:else if option.type === 'string'}
            <input
              type="text"
              id={option.id}
              value={options[option.id] ?? option.default}
              on:input={(e) => options[option.id] = e.currentTarget.value}
              class="input"
            />
          {/if}

          {#if option.description}
            <span class="font-mono text-xs text-ez-muted">{option.description}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
