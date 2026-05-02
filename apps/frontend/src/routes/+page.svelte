<script lang="ts">
  import SEOHead from "$lib/components/SEOHead.svelte";

  const features = [
    {
      title: "Instant",
      description: "Convert and download in seconds. Most formats in under 2s, no progress bar required.",
    },
    {
      title: "Works offline",
      description: "Once loaded, you can pull the plug. Pure browser magic via WebAssembly.",
    },
    {
      title: "Zero tracking",
      description: "No analytics, no cookies, no telemetry. We can't see what you convert because nothing leaves your machine.",
    },
    {
      title: "Free forever",
      description: "Open source, MIT licensed. Pay nothing. See the code on GitHub if you don't believe us.",
    },
  ];

  const testimonials = [
    {
      quote: "Finally. A converter that doesn't ask for my email or upload my files to who-knows-where.",
      author: "Sarah Chen",
      role: "Security Engineer",
    },
    {
      quote: "Batched 500+ images without a single upload. My bandwidth thanks you.",
      author: "Marcus Rodriguez",
      role: "Photographer",
    },
    {
      quote: "We push sensitive client docs through this. Zero-upload guarantee = sleeping at night.",
      author: "Alex Thompson",
      role: "IT Admin",
    },
  ];

  const faqs = [
    {
      question: "Do my files ever leave my device?",
      answer:
        "Never. Conversion runs in your browser. There's no upload endpoint — we literally cannot see your files because they don't reach a server.",
    },
    {
      question: "What's the file size limit?",
      answer:
        "10GB per file. Multiple files at once. Free.",
    },
    {
      question: "Does it work offline?",
      answer:
        "Yes. After the first page load, service workers cache the app. Disconnect your wifi and keep going.",
    },
    {
      question: "Can I batch convert?",
      answer:
        "Yep. Drop in as many files as you like — they queue up and run in parallel.",
    },
    {
      question: "Is this actually open source?",
      answer:
        "MIT licensed. Inspect the code, contribute, or self-host. Your call.",
    },
  ];
</script>

<SEOHead
  title="File Convert - Privacy-First File Conversion"
  description="Convert files instantly in your browser. No uploads, no tracking, 100% private. Images, documents, audio, archives, and more."
  keywords="file converter, privacy, local conversion, browser converter, image converter, pdf converter"
  ogImage="/og-image.png"
/>

<!-- Hero -->
<section class="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
  <div class="section-eyebrow">file convert · v1</div>
  <h1 class="text-5xl md:text-[68px] font-bold tracking-[-0.03em] leading-[1.05] text-ez-white max-w-3xl mx-auto">
    Convert files. <span class="text-ez-yellow">Locally.</span>
  </h1>
  <p class="text-lg text-ez-subtle mt-6 max-w-xl mx-auto leading-relaxed">
    50+ formats. In your browser. Files never leave your device.
  </p>
  <div class="flex flex-wrap items-center justify-center gap-3 mt-8">
    <a href="/convert" class="btn btn-primary btn-lg">Start converting →</a>
    <a href="#features" class="btn btn-ghost btn-lg">How it works</a>
  </div>
  <div class="flex flex-wrap items-center justify-center gap-2 mt-8">
    <span class="badge badge-green badge-dot">Free</span>
    <span class="badge badge-neutral">Zero Upload</span>
    <span class="badge badge-neutral">100% Local</span>
    <span class="badge badge-neutral">Open Source</span>
    <span class="badge badge-neutral">No Tracking</span>
  </div>
</section>

<!-- Features -->
<section id="features" class="max-w-5xl mx-auto px-6 py-20">
  <div class="section-eyebrow">why</div>
  <h2 class="section-title">No upload. No tracking. No BS.</h2>
  <p class="section-desc">
    Conversion happens in your browser via WebAssembly. Your files don't go anywhere.
  </p>
  <div class="grid md:grid-cols-2 gap-6">
    {#each features as f}
      <div class="card card-body">
        <h3 class="text-xl text-ez-white mb-2">{f.title}</h3>
        <p class="text-ez-subtle text-sm leading-relaxed">{f.description}</p>
      </div>
    {/each}
  </div>
</section>

<!-- Testimonials -->
<section class="max-w-5xl mx-auto px-6 py-20">
  <div class="section-eyebrow">trusted</div>
  <h2 class="section-title">Built by people who hate uploading their files.</h2>
  <div class="grid md:grid-cols-3 gap-6 mt-10">
    {#each testimonials as t}
      <blockquote class="card card-body">
        <p class="text-ez-text leading-relaxed">"{t.quote}"</p>
        <div class="font-mono text-xs text-ez-muted mt-4">— {t.author}{#if t.role}, {t.role}{/if}</div>
      </blockquote>
    {/each}
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="max-w-3xl mx-auto px-6 py-20">
  <div class="section-eyebrow">faq</div>
  <h2 class="section-title">Questions, answered.</h2>
  <div class="space-y-3 mt-10">
    {#each faqs as q}
      <details class="card group">
        <summary class="card-body cursor-pointer flex items-center justify-between text-ez-white font-semibold list-none">
          <span>{q.question}</span>
          <span class="font-mono text-ez-muted group-open:rotate-45 transition-transform duration-base">+</span>
        </summary>
        <div class="px-6 pb-6 text-ez-subtle leading-relaxed">{q.answer}</div>
      </details>
    {/each}
  </div>
</section>

<!-- Final CTA -->
<section class="max-w-3xl mx-auto px-6 py-20 text-center">
  <h2 class="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-ez-white">
    Ready when you are.
  </h2>
  <p class="text-ez-subtle mt-4 mb-8">No signup. No card. Just click and go.</p>
  <a href="/convert" class="btn btn-primary btn-xl">Convert a file →</a>
</section>
