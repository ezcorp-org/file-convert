<!--
  HowTo Schema Component
  Implements Schema.org HowTo markup for educational guide pages
  Based on SEO-002 requirements
-->
<script lang="ts">
  export let name;
  export let description;
  export let totalTime = 'PT2M'; // 2 minutes in ISO 8601 duration format
  export let supply = [];
  export let tool = [];
  export let steps = [];
  
  // For external reference if needed
  export const estimatedCost = '$0';

  // Default supplies for file conversion guides
  const defaultSupply = supply.length > 0 ? supply : ['Computer or mobile device', 'Internet connection', 'File to convert'];
  
  // Default tools for file conversion guides  
  const defaultTools = tool.length > 0 ? tool : ['Web browser', 'File Convert web application'];

  let howToSchema = {};
  $: howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "image": steps.find(step => step.image)?.image || "https://fileconvert.com/images/how-to-guide.jpg",
    "totalTime": totalTime,
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "supply": defaultSupply.map(item => ({
      "@type": "HowToSupply",
      "name": item
    })),
    "tool": defaultTools.map(item => ({
      "@type": "HowToTool",
      "name": item
    })),
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { "image": step.image }),
      ...(step.url && { "url": step.url })
    }))
  };
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(howToSchema ?? {})}</script>`}
</svelte:head>