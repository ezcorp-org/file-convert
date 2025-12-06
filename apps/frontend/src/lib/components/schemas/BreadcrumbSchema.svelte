<!--
  Breadcrumb Schema Component
  Implements Schema.org BreadcrumbList markup for navigation
  Based on SEO-002 requirements
-->
<script lang="ts">
  import { page } from "$app/stores";

  export let breadcrumbs = [];

  // Auto-generate breadcrumbs from current URL if none provided
  $: autoBreadcrumbs = (() => {
    if (breadcrumbs.length > 0) return breadcrumbs;

    const pathParts = $page.url.pathname.split("/").filter(Boolean);
    const crumbs = [{ name: "Home", url: $page.url.origin }];

    let currentPath = $page.url.origin;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += "/" + part;

      // Convert path segments to readable names
      let name =
        part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");

      // Special cases for known routes
      if (part === "convert") {
        name = "File Converter";
      } else if (part === "guides") {
        name = "How-to Guides";
      } else if (part === "about") {
        name = "About";
      } else if (part === "contact") {
        name = "Contact";
      } else if (part === "privacy") {
        name = "Privacy Policy";
      } else if (part === "terms") {
        name = "Terms of Service";
      }

      crumbs.push({ name, url: currentPath });
    }

    return crumbs;
  })();

  $: breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: autoBreadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`}
</svelte:head>
