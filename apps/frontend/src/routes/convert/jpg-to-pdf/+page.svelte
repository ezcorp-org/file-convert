<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';

	function startConversion() {
		goto('/convert');
	}
</script>

<SEOHead
	title="JPG to PDF Converter - Convert JPG/JPEG to PDF Online Free"
	description="Convert JPG and JPEG images to PDF instantly in your browser. 100% private processing, no uploads required. Batch conversion supported."
	keywords="jpg to pdf, jpeg to pdf, convert jpg pdf, photo to pdf, image converter"
	appName="JPG to PDF Converter"
	appDescription="Convert JPG and JPEG images to PDF format with perfect quality"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert JPG to PDF online?",
			answer: "Upload your JPG file, select PDF as output format, and click convert. All processing happens in your browser - no uploads required."
		},
		{
			question: "Is JPG to PDF conversion free?",
			answer: "Yes! Convert up to 5 JPG files simultaneously for free with no file size limits up to 10GB each."
		},
		{
			question: "Can I combine multiple JPG files into one PDF?",
			answer: "Yes! Upload multiple JPG files and they'll be combined into a single PDF with each image on its own page."
		},
		{
			question: "Will my JPG quality be reduced?",
			answer: "No! We preserve the original JPG quality with no compression. Your images remain crystal clear in the PDF."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>JPG to PDF Converter</h1>
			<p class="subtitle">Convert JPG and JPEG images to PDF instantly. 100% private, no uploads required.</p>
			<div class="features">
				<div class="feature"><span class="feature-icon">🔒</span><span>100% Private</span></div>
				<div class="feature"><span class="feature-icon">⚡</span><span>Instant conversion</span></div>
				<div class="feature"><span class="feature-icon">🖼️</span><span>Full quality</span></div>
				<div class="feature"><span class="feature-icon">🆓</span><span>Free</span></div>
			</div>
			<button class="cta-button" on:click={startConversion}>Convert JPG to PDF Now</button>
		</div>
	</div>

	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert JPG to PDF</h2>
			<div class="steps">
				<div class="step"><div class="step-number">1</div><h3>Upload JPG</h3><p>Select your JPG/JPEG files</p></div>
				<div class="step"><div class="step-number">2</div><h3>Choose PDF</h3><p>Select PDF as output format</p></div>
				<div class="step"><div class="step-number">3</div><h3>Download</h3><p>Get your PDF instantly</p></div>
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
