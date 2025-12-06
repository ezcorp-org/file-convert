<!--
  SoftwareApplication Schema Component
  Implements Schema.org SoftwareApplication markup for file conversion tools
  Based on SEO-002 requirements
-->
<script lang="ts">
  import { page } from "$app/stores";

  export let appName = "File Converter Pro";
  export let description =
    "Professional file conversion tools with 100% local processing for maximum privacy and security";
  export let applicationCategory = "UtilitiesApplication";
  export let operatingSystem = "Web Browser";
  export let ratingValue = "4.8";
  export let ratingCount = "2547";
  export let price = "9.99";
  export let priceCurrency = "USD";
  export let featureList = [];
  export let supportUrl = "";
  export let downloadUrl = "";
  export let screenshot = [];

  // Enhanced schema with complete SoftwareApplication markup
  let softwareApplicationSchema = {};
  $: softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: appName,
    description: description,
    url: $page.url.href,
    applicationCategory: applicationCategory,
    operatingSystem: operatingSystem,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue,
      ratingCount: ratingCount,
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: priceCurrency,
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
      priceValidUntil: new Date(
        new Date().getFullYear() + 1,
        11,
        31,
      ).toISOString(),
    },
    author: {
      "@type": "Organization",
      name: "File Convert",
      url: "https://fileconvert.com",
      sameAs: ["https://github.com/fileconvert"],
    },
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    version: "2.0",
    softwareVersion: "2.0.0",
    ...(featureList.length > 0 && { "featureList": featureList }),
    ...(screenshot.length > 0 && { "screenshot": screenshot }),
    ...(supportUrl && { "supportUrl": supportUrl }),
    ...(downloadUrl && { "installUrl": downloadUrl }),
    browserRequirements:
      "Requires modern browser with JavaScript and WebAssembly support",
    storageRequirements: "Files processed locally - no server storage required",
    memoryRequirements: "Varies by file size - typically 2-4x file size",
    processorRequirements: "Modern CPU with WebAssembly support",
    applicationSubCategory: "File Converter",
    downloadUrl: downloadUrl || $page.url.href,
    installUrl: $page.url.href,
    softwareAddOn: [],
    softwareHelp: supportUrl || `${$page.url.origin}/help`,
    releaseNotes:
      "Latest version includes enhanced security, faster processing, and support for additional file formats",
  };

  // JSON.stringify omits undefined values; avoid JSON.parse on undefined during SSR
  $: cleanedSchemaJson = JSON.stringify(softwareApplicationSchema ?? {});
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${cleanedSchemaJson}</script>`}
</svelte:head>
