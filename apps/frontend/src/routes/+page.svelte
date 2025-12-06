<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import SEOHead from "$lib/components/SEOHead.svelte";

  let currentTestimonial = 0;
  let faqOpenItems = new Set();
  let currentConversionIndex = 0;

  // Realistic file format conversions
  const fileConversions = [
    { from: { icon: "📄", ext: "PDF" }, to: { icon: "🖼️", ext: "PNG" } },
    { from: { icon: "📸", ext: "JPG" }, to: { icon: "🖼️", ext: "WEBP" } },
    { from: { icon: "📝", ext: "DOCX" }, to: { icon: "📄", ext: "PDF" } },
    { from: { icon: "📊", ext: "XLSX" }, to: { icon: "📑", ext: "CSV" } },
    { from: { icon: "🎵", ext: "WAV" }, to: { icon: "🎶", ext: "MP3" } },
    { from: { icon: "📦", ext: "ZIP" }, to: { icon: "📂", ext: "TAR" } },
    { from: { icon: "🖼️", ext: "PNG" }, to: { icon: "📸", ext: "JPG" } },
    { from: { icon: "📑", ext: "CSV" }, to: { icon: "📋", ext: "JSON" } },
    { from: { icon: "🎶", ext: "MP3" }, to: { icon: "🎵", ext: "FLAC" } },
    { from: { icon: "📄", ext: "PDF" }, to: { icon: "📝", ext: "TXT" } },
    { from: { icon: "🖼️", ext: "TIFF" }, to: { icon: "📸", ext: "JPG" } },
    { from: { icon: "📋", ext: "JSON" }, to: { icon: "📊", ext: "XLSX" } },
    { from: { icon: "🖼️", ext: "BMP" }, to: { icon: "🖼️", ext: "PNG" } },
    { from: { icon: "📝", ext: "MD" }, to: { icon: "🌐", ext: "HTML" } },
    { from: { icon: "📂", ext: "TAR" }, to: { icon: "📦", ext: "7Z" } },
  ];

  const testimonials = [
    {
      quote:
        "Finally, a conversion tool that respects privacy. Everything happens locally - no data leaves my machine.",
      author: "Sarah Chen",
      role: "Security Engineer",
      avatar: "👩‍💻",
    },
    {
      quote:
        "The batch processing saved me hours. I converted 500+ images without any uploads.",
      author: "Marcus Rodriguez",
      role: "Photographer",
      avatar: "📸",
    },
    {
      quote:
        "We use File Convert for sensitive client documents. The zero-upload guarantee gives us peace of mind.",
      author: "Alex Thompson",
      role: "IT Administrator",
      avatar: "🛡️",
    },
    {
      quote:
        "Lightning fast conversions and the UI is so clean. This is how file conversion should work.",
      author: "Emily Watson",
      role: "UI Designer",
      avatar: "🎨",
    },
  ];

  const faqs = [
    {
      question: "Do my files ever leave my device?",
      answer:
        "Never. All conversions happen directly in your browser. No files are uploaded to our servers. We don't have servers that process your files - it's technically impossible for us to see your data.",
    },
    {
      question: "Are there any limitations?",
      answer:
        "The web app allows multiple simultaneous conversions with files up to 100MB each. Perfect for everyday use and completely free.",
    },
    {
      question: "How does offline mode work?",
      answer:
        "Once loaded, the web app works offline thanks to service workers - perfect for working without internet.",
    },
    {
      question: "Can I convert multiple files at once?",
      answer:
        "Yes! The web app handles multiple files simultaneously with batch processing support.",
    },
    {
      question: "Is this really open source?",
      answer:
        "Yes! Our core conversion libraries and web app are open source. You can inspect the code, contribute, or even self-host if you prefer.",
    },
  ];

  const webFeatures = [
    {
      icon: "⚡",
      title: "Instant Conversions",
      description: "No uploads, no waiting. Convert files at native speed.",
    },
    {
      icon: "🌐",
      title: "Works Everywhere",
      description: "Any modern browser, any device. No installation needed.",
    },
    {
      icon: "🔒",
      title: "Zero Tracking",
      description: "No analytics, no cookies, no data collection. Ever.",
    },
    {
      icon: "🆓",
      title: "Free Forever",
      description: "Core features always free. No credit card required.",
    },
  ];

  function toggleFaq(index: number) {
    if (faqOpenItems.has(index)) {
      faqOpenItems.delete(index);
    } else {
      faqOpenItems.add(index);
    }
    faqOpenItems = faqOpenItems;
  }

  function nextTestimonial() {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
  }

  function prevTestimonial() {
    currentTestimonial =
      (currentTestimonial - 1 + testimonials.length) % testimonials.length;
  }

  function startFree() {
    goto("/convert");
  }

  onMount(() => {
    // Cycle through conversion examples
    const interval = setInterval(() => {
      currentConversionIndex =
        (currentConversionIndex + 1) % fileConversions.length;
    }, 3000);

    return () => clearInterval(interval);
  });
</script>

<SEOHead
  title="File Convert - Privacy-First File Conversion"
  description="Convert files instantly in your browser. No uploads, no tracking, 100% private. Images, documents, audio, archives, and more."
  keywords="file converter, privacy, local conversion, browser converter, image converter, pdf converter"
  image="/og-image.png"
/>

<div class="page">
  <!-- Hero Section -->
  <section class="hero" id="hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            Convert Files<br />
            <span class="gradient-text">Without Uploading</span>
          </h1>
          <p class="hero-description">
            100% browser-based file conversion. Your files never leave your
            device. No registration, no tracking, no compromises.
          </p>

          <div class="conversion-demo">
            <div class="file-card from">
              <span class="file-icon"
                >{fileConversions[currentConversionIndex].from.icon}</span
              >
              <span class="file-ext"
                >{fileConversions[currentConversionIndex].from.ext}</span
              >
            </div>
            <div class="arrow">→</div>
            <div class="file-card to">
              <span class="file-icon"
                >{fileConversions[currentConversionIndex].to.icon}</span
              >
              <span class="file-ext"
                >{fileConversions[currentConversionIndex].to.ext}</span
              >
            </div>
          </div>

          <div class="hero-cta">
            <button class="btn btn-primary btn-lg" on:click={startFree}>
              Start Converting →
            </button>
            <p class="cta-subtitle">Free • No Sign Up • No Limits</p>
          </div>

          <div class="trust-indicators">
            <div class="indicator">
              <span class="indicator-icon">🔒</span>
              <span>100% Private</span>
            </div>
            <div class="indicator">
              <span class="indicator-icon">⚡</span>
              <span>Instant</span>
            </div>
            <div class="indicator">
              <span class="indicator-icon">🆓</span>
              <span>Free Forever</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features" id="features">
    <div class="container">
      <div class="section-header">
        <h2>Privacy-First File Conversion</h2>
        <p>All conversions happen in your browser. Zero data collection.</p>
      </div>

      <div class="features-grid">
        {#each webFeatures as feature}
          <div class="feature-card">
            <div class="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
  <section class="testimonials">
    <div class="container">
      <div class="section-header">
        <h2>Trusted by Privacy-Conscious Users</h2>
      </div>

      <div class="testimonial-container">
        <button class="testimonial-nav prev" on:click={prevTestimonial}>
          ‹
        </button>

        <div class="testimonial-card">
          <div class="avatar">{testimonials[currentTestimonial].avatar}</div>
          <blockquote>{testimonials[currentTestimonial].quote}</blockquote>
          <div class="author">
            <strong>{testimonials[currentTestimonial].author}</strong>
            <span>{testimonials[currentTestimonial].role}</span>
          </div>
        </div>

        <button class="testimonial-nav next" on:click={nextTestimonial}>
          ›
        </button>
      </div>

      <div class="testimonial-dots">
        {#each testimonials as _, index}
          <button
            class="dot"
            class:active={index === currentTestimonial}
            on:click={() => (currentTestimonial = index)}
          />
        {/each}
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq" id="faq">
    <div class="container">
      <div class="section-header">
        <h2>Frequently Asked Questions</h2>
      </div>

      <div class="faq-list">
        {#each faqs as faq, index}
          <div class="faq-item" class:open={faqOpenItems.has(index)}>
            <button class="faq-question" on:click={() => toggleFaq(index)}>
              <span>{faq.question}</span>
              <span class="faq-icon">{faqOpenItems.has(index) ? "−" : "+"}</span
              >
            </button>
            {#if faqOpenItems.has(index)}
              <div class="faq-answer">
                <p>{faq.answer}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section" id="get-started">
    <div class="container">
      <div class="cta-content">
        <h2>Ready to Convert?</h2>
        <p>Start converting files instantly. No sign-up required.</p>
        <button class="btn btn-primary btn-lg" on:click={startFree}>
          Start Converting Now →
        </button>
      </div>
    </div>
  </section>
</div>

<style>
  /* Reset and Base */
  .page {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  /* Hero Section */
  .hero {
    padding: 6rem 0 4rem;
    text-align: center;
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1.2;
    margin: 0 0 1.5rem;
    color: #1a202c;
  }

  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-description {
    font-size: 1.25rem;
    color: #64748b;
    max-width: 600px;
    margin: 0 auto 3rem;
    line-height: 1.6;
  }

  .conversion-demo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin: 3rem 0;
    animation: fadeIn 0.5s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .file-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    min-width: 120px;
  }

  .file-icon {
    font-size: 3rem;
  }

  .file-ext {
    font-weight: 700;
    color: #1a202c;
    font-size: 1.125rem;
  }

  .arrow {
    font-size: 2rem;
    color: #667eea;
    font-weight: bold;
  }

  .hero-cta {
    margin: 3rem 0;
  }

  .btn {
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 1rem;
    display: inline-block;
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover {
    background: #5a67d8;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  .btn-lg {
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
  }

  .cta-subtitle {
    margin-top: 1rem;
    color: #64748b;
    font-size: 0.875rem;
  }

  .trust-indicators {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 3rem;
  }

  .indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #475569;
    font-weight: 500;
  }

  .indicator-icon {
    font-size: 1.5rem;
  }

  /* Features Section */
  .features {
    padding: 4rem 0;
  }

  .section-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .section-header h2 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1a202c;
    margin: 0 0 1rem;
  }

  .section-header p {
    font-size: 1.125rem;
    color: #64748b;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .feature-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 0.5rem;
  }

  .feature-card p {
    color: #64748b;
    line-height: 1.6;
  }

  /* Testimonials */
  .testimonials {
    padding: 4rem 0;
    background: white;
  }

  .testimonial-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .testimonial-card {
    background: #f8fafc;
    padding: 3rem;
    border-radius: 16px;
    text-align: center;
  }

  .avatar {
    font-size: 4rem;
    margin-bottom: 1.5rem;
  }

  blockquote {
    font-size: 1.125rem;
    color: #1a202c;
    line-height: 1.8;
    margin: 0 0 1.5rem;
  }

  .author strong {
    display: block;
    color: #1a202c;
    font-weight: 600;
  }

  .author span {
    color: #64748b;
    font-size: 0.875rem;
  }

  .testimonial-nav {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .testimonial-nav:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  .testimonial-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #cbd5e0;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dot.active {
    background: #667eea;
    width: 30px;
    border-radius: 5px;
  }

  /* FAQ */
  .faq {
    padding: 4rem 0;
  }

  .faq-list {
    max-width: 800px;
    margin: 0 auto;
  }

  .faq-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .faq-question {
    width: 100%;
    padding: 1.5rem;
    background: none;
    border: none;
    text-align: left;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a202c;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .faq-icon {
    font-size: 1.5rem;
    color: #667eea;
  }

  .faq-answer {
    padding: 0 1.5rem 1.5rem;
    color: #64748b;
    line-height: 1.6;
  }

  /* CTA Section */
  .cta-section {
    padding: 6rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .cta-content {
    text-align: center;
  }

  .cta-content h2 {
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 1rem;
  }

  .cta-content p {
    font-size: 1.25rem;
    margin: 0 0 2rem;
    opacity: 0.9;
  }

  .cta-content .btn-primary {
    background: white;
    color: #667eea;
  }

  .cta-content .btn-primary:hover {
    background: #f8fafc;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }

    .conversion-demo {
      gap: 1rem;
    }

    .file-card {
      padding: 1.5rem;
      min-width: 100px;
    }

    .trust-indicators {
      flex-direction: column;
      gap: 1rem;
    }

    .testimonial-container {
      flex-direction: column;
    }

    .testimonial-nav {
      display: none;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .cta-content h2 {
      font-size: 2rem;
    }
  }
</style>
