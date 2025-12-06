<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';

	function startConversion() {
		goto('/convert');
	}
</script>

<SEOHead
	title="PDF to JPG Converter - Convert PDF to JPG/JPEG Online Free"
	description="Convert PDF pages to JPG images instantly in your browser. 100% private processing, no uploads required. Extract all pages as images."
	keywords="pdf to jpg, pdf to jpeg, convert pdf jpg, pdf image converter, extract pdf images"
	appName="PDF to JPG Converter"
	appDescription="Convert PDF pages to JPG images with perfect quality"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PDF to JPG online?",
			answer: "Upload your PDF file, select JPG as output format, and click convert. Each PDF page becomes a separate JPG image."
		},
		{
			question: "Is PDF to JPG conversion free?",
			answer: "Yes! Convert PDFs to JPG for free with no limits on the number of pages or file size up to 100MB."
		},
		{
			question: "Can I convert all PDF pages to JPG?",
			answer: "Yes! Our converter extracts all pages from your PDF and converts each page to a separate high-quality JPG image."
		},
		{
			question: "What resolution will my JPG images be?",
			answer: "We preserve the original PDF resolution, typically 300 DPI for print quality. You can also choose custom resolution settings."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>PDF to JPG Converter</h1>
			<p class="subtitle">Convert PDF pages to JPG images instantly. 100% private, no uploads required.</p>
			<div class="features">
				<div class="feature"><span class="feature-icon">🔒</span><span>100% Private</span></div>
				<div class="feature"><span class="feature-icon">⚡</span><span>Instant conversion</span></div>
				<div class="feature"><span class="feature-icon">📄</span><span>All pages</span></div>
				<div class="feature"><span class="feature-icon">🆓</span><span>Free</span></div>
			</div>
			<button class="cta-button" on:click={startConversion}>Convert PDF to JPG Now</button>
		</div>
	</div>

	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert PDF to JPG</h2>
			<div class="steps">
				<div class="step"><div class="step-number">1</div><h3>Upload PDF</h3><p>Select your PDF file</p></div>
				<div class="step"><div class="step-number">2</div><h3>Choose JPG</h3><p>Select JPG as output format</p></div>
				<div class="step"><div class="step-number">3</div><h3>Download</h3><p>Get your JPG images instantly</p></div>
			</div>
		</div>
	</div>
</div>

<style>
	.conversion-page { min-height: 100vh; }
	.hero-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4rem 0; text-align: center; }
	.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
	.hero-section h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 800; }
	.subtitle { font-size: 1.25rem; margin-bottom: 3rem; opacity: 0.9; }
	.features { display: flex; justify-content: center; gap: 2rem; margin-bottom: 3rem; flex-wrap: wrap; }
	.feature { display: flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.1); padding: 0.75rem 1.5rem; border-radius: 2rem; backdrop-filter: blur(10px); }
	.feature-icon { font-size: 1.25rem; }
	.cta-button { background: white; color: #667eea; padding: 1rem 2rem; border: none; border-radius: 2rem; font-size: 1.125rem; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
	.cta-button:hover { transform: translateY(-2px); }
	.how-it-works { padding: 4rem 0; background: #f9fafb; }
	.how-it-works h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
	.steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 900px; margin: 0 auto; }
	.step { background: white; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
	.step-number { width: 3rem; height: 3rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem; margin: 0 auto 1rem; }
	.step h3 { margin-bottom: 1rem; font-size: 1.25rem; }
	.step p { color: #6b7280; }
	@media (max-width: 768px) {
		.hero-section h1 { font-size: 2rem; }
		.features { flex-direction: column; align-items: center; }
		.steps { grid-template-columns: 1fr; }
	}
</style>
