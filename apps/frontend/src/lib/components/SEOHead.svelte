<!--
  Enhanced SEO Head Component
  Manages meta tags, structured data, and SEO optimization
  Updated for SEO-002 structured data implementation
-->
<script lang="ts">
  import { page } from '$app/stores';
  import SoftwareApplicationSchema from './schemas/SoftwareApplicationSchema.svelte';
  import FAQSchema from './schemas/FAQSchema.svelte';
  import HowToSchema from './schemas/HowToSchema.svelte';
  import OrganizationSchema from './schemas/OrganizationSchema.svelte';
  import BreadcrumbSchema from './schemas/BreadcrumbSchema.svelte';

  // Props for customizing SEO data
  export let title = '';
  export let description = '';
  export let keywords = '';
  export let ogImage = '';
  export let ogType = 'website';
  export let canonical = '';
  
  // Schema control props
  export let includeAppSchema = true;
  export let includeFAQSchema = false;
  export let includeHowToSchema = false;
  export let includeOrgSchema = true;
  export let includeBreadcrumbs = true;
  
  // Schema data props
  export let appName = '';
  export let appDescription = '';
  export let faqs = [];
  export let howToName = '';
  export let howToDescription = '';
  export let howToSteps = [];
  export let breadcrumbs = [];

  // Default SEO values
  const defaultTitle = 'File Convert - Privacy-First File Conversion Tools';
  const defaultDescription = 'Convert files instantly without uploading. 100% client-side processing ensures your files never leave your device. Support for 50+ formats including PDF, images, documents, and more.';
  const defaultKeywords = 'file converter, pdf converter, image converter, document converter, private converter, local converter, WebAssembly converter, secure file conversion';
  const defaultOgImage = '/images/og-file-converter.jpg';

  // Compute final values
  $: finalTitle = title || defaultTitle;
  $: finalDescription = description || defaultDescription;  
  $: finalKeywords = keywords || defaultKeywords;
  $: finalOgImage = ogImage || defaultOgImage;
  $: finalCanonical = canonical || $page.url.href;
  $: finalAppName = appName || 'File Convert';
  $: finalAppDescription = appDescription || finalDescription;
</script>

<svelte:head>
  <!-- Primary Meta Tags -->
  <title>{finalTitle}</title>
  <meta name="title" content={finalTitle} />
  <meta name="description" content={finalDescription} />
  <meta name="keywords" content={finalKeywords} />
  <meta name="robots" content="index, follow" />
  <meta name="language" content="English" />
  <meta name="author" content="File Convert" />

  <!-- Canonical URL -->
  <link rel="canonical" href={finalCanonical} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={ogType} />
  <meta property="og:url" content={$page.url.href} />
  <meta property="og:title" content={finalTitle} />
  <meta property="og:description" content={finalDescription} />
  <meta property="og:image" content={finalOgImage} />
  <meta property="og:site_name" content="File Convert" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={$page.url.href} />
  <meta property="twitter:title" content={finalTitle} />
  <meta property="twitter:description" content={finalDescription} />
  <meta property="twitter:image" content={finalOgImage} />

  <!-- Additional Meta Tags for File Conversion Tools -->
  <meta name="application-name" content="File Convert" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="File Convert" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#2563eb" />

  <!-- Performance and Loading -->
  <meta name="referrer" content="origin-when-cross-origin" />

  <!-- Preload critical resources -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin="" />
</svelte:head>

<!-- Structured Data Components -->
{#if includeAppSchema}
  <SoftwareApplicationSchema 
    appName={finalAppName}
    description={finalAppDescription}
    featureList={[
      "PDF to Word conversion",
      "Image format conversion", 
      "Document format conversion",
      "Audio file conversion",
      "100% local processing",
      "No file uploads required",
      "Privacy-focused design",
      "WebAssembly powered"
    ]}
  />
{/if}

{#if includeFAQSchema && faqs.length > 0}
  <FAQSchema {faqs} />
{/if}

{#if includeHowToSchema && howToName && howToSteps.length > 0}
  <HowToSchema 
    name={howToName}
    description={howToDescription}
    steps={howToSteps}
  />
{/if}

{#if includeOrgSchema}
  <OrganizationSchema 
    sameAs={[
      "https://github.com/fileconvert",
      "https://twitter.com/fileconvert"
    ]}
  />
{/if}

{#if includeBreadcrumbs}
  <BreadcrumbSchema {breadcrumbs} />
{/if}