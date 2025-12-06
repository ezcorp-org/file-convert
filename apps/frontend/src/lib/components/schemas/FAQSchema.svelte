<!--
  FAQ Schema Component
  Implements Schema.org FAQPage markup for conversion tool pages
  Based on SEO-002 requirements
-->
<script lang="ts">
  export let faqs = [];

  // Default FAQs for file conversion tools if none provided
  const defaultFAQs = [
    {
      question: "Is this file converter free to use?",
      answer:
        "Yes, our basic file converter is completely free with no hidden costs. You can convert up to 5 files simultaneously with files up to 100MB each. For unlimited conversions and advanced features, check out our Pro version.",
    },
    {
      question: "How does the conversion process work?",
      answer:
        "All file conversions happen directly in your browser using advanced WebAssembly technology. Your files never leave your device - they are processed locally on your computer, ensuring complete privacy and security.",
    },
    {
      question: "Is my data secure during conversion?",
      answer:
        "Absolutely. Since all conversions happen locally in your browser, your files never leave your device. We don't upload, store, or have access to any of your files. This makes our converter one of the most secure options available.",
    },
    {
      question: "What file formats are supported?",
      answer:
        "We support over 50 file formats including PDF, Word documents, Excel spreadsheets, PowerPoint presentations, images (JPG, PNG, GIF, WebP), audio files (MP3, WAV, FLAC), and many more. New formats are regularly added based on user feedback.",
    },
    {
      question: "Can I convert multiple files at once?",
      answer:
        "Yes! Our free version allows up to 5 simultaneous conversions. With our Pro version, you can convert unlimited files in batch operations, including entire folders with custom rules and filters.",
    },
    {
      question: "Do I need to install any software?",
      answer:
        "No installation required! Our converter works entirely in your web browser. Simply visit our website, upload your files, choose your output format, and download the converted files. It works on any device with a modern browser.",
    },
  ];

  $: finalFAQs = faqs.length > 0 ? faqs : defaultFAQs;

  $: faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: finalFAQs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`}
</svelte:head>
