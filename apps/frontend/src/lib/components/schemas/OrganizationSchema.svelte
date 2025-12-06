<!--
  Organization Schema Component  
  Implements Schema.org Organization markup for business information
  Based on SEO-002 requirements
-->
<script lang="ts">
  import { page } from '$app/stores';

  export let name = 'File Convert';
  export let description = 'Privacy-first file conversion tools with 100% local processing';
  export let url = '';
  export let logo = '';
  export let contactPoint = {};
  export let sameAs = [];
  export let address = {};

  $: organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "description": description,
    "url": url || $page.url.origin,
    "logo": logo || `${$page.url.origin}/logo.png`,
    "foundingDate": "2024-01-01",
    "slogan": "Convert files privately, securely, locally",
    "knowsAbout": [
      "File conversion",
      "Document processing", 
      "Privacy protection",
      "Data security",
      "WebAssembly technology",
      "Client-side processing"
    ],
    "areaServed": "Worldwide",
    "serviceType": "File Conversion Services",
    "hasOfferCatalog": {
      "@type": "OfferCatalog", 
      "name": "File Conversion Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "PDF Conversion",
            "description": "Convert PDF files to Word, Excel, images and other formats"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Image Conversion",
            "description": "Convert between image formats like JPG, PNG, GIF, WebP"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Document Conversion",
            "description": "Convert Word, Excel, PowerPoint and other document formats"
          }
        }
      ]
    },
    ...(Object.keys(contactPoint).length > 0 && {
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": contactPoint.contactType || "customer service",
        "areaServed": contactPoint.areaServed || "US",
        "availableLanguage": contactPoint.availableLanguage || ["English"],
        ...(contactPoint.telephone && { "telephone": contactPoint.telephone }),
        ...(contactPoint.email && { "email": contactPoint.email })
      }
    }),
    ...(sameAs.length > 0 && { "sameAs": sameAs }),
    ...(Object.keys(address).length > 0 && {
      "address": {
        "@type": "PostalAddress",
        ...address
      }
    })
  };

  // JSON.stringify omits undefined values; avoid JSON.parse on undefined during SSR
  $: cleanedSchemaJson = JSON.stringify(organizationSchema ?? {});
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${cleanedSchemaJson}</script>`}
</svelte:head>