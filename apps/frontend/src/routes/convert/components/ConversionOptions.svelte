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
  <div class="conversion-options">
    <h4>Conversion Options</h4>
    
    <div class="options-grid">
      {#each conversionOptions as option}
        <div class="option">
          <label for={option.id}>{option.name}</label>
          
          {#if option.type === 'number'}
            <input
              type="number"
              id={option.id}
              value={options[option.id] ?? option.default}
              on:input={(e) => handleNumberInput(option.id, e.currentTarget.value)}
              class="input-number"
            />
          {:else if option.type === 'boolean'}
            <input
              type="checkbox"
              id={option.id}
              checked={options[option.id] ?? option.default}
              on:change={(e) => handleBooleanInput(option.id, e.currentTarget.checked)}
              class="input-checkbox"
            />
          {:else if option.type === 'select' && option.options}
            <select
              id={option.id}
              value={String(options[option.id] ?? option.default)}
              on:change={(e) => handleSelectInput(option.id, e.currentTarget.value)}
              class="input-select"
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
              class="input-text"
            />
          {/if}
          
          {#if option.description}
            <span class="description">{option.description}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .conversion-options {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }
  
  .conversion-options h4 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .option {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .option label {
    font-weight: 500;
    color: #374151;
  }
  
  .input-number,
  .input-text,
  .input-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
  }
  
  .input-number:focus,
  .input-text:focus,
  .input-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .input-checkbox {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }
  
  .description {
    font-size: 0.75rem;
    color: #6b7280;
  }
</style>