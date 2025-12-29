<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';

	function startConversion() {
		goto('/convert');
	}
</script>

<!-- Enhanced SEO with FAQ schema for Image to PDF conversion -->
<SEOHead
	title="Image to PDF Converter - Convert JPG, PNG to PDF Online Free"
	description="Convert images to PDF instantly in your browser. Support for JPG, PNG, GIF, WebP formats. 100% private processing, no uploads required. Batch conversion available."
	keywords="image to pdf, jpg to pdf, png to pdf, convert image pdf, photo to pdf converter"
	appName="Image to PDF Converter"
	appDescription="Convert images to PDF format with perfect quality preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert images to PDF online?",
			answer: "Upload your image files (JPG, PNG, GIF, or WebP), select PDF as the output format, and click convert. The conversion happens entirely in your browser - no files are uploaded to any server."
		},
		{
			question: "Is image to PDF conversion free?",
			answer: "Yes! Our image to PDF converter is completely free. You can convert up to 5 images simultaneously with no file size limits up to 10GB each."
		},
		{
			question: "What image formats can be converted to PDF?",
			answer: "We support JPG, JPEG, PNG, GIF, WebP, BMP, and other common image formats. All formats maintain their original quality in the PDF output."
		},
		{
			question: "Can I combine multiple images into one PDF?",
			answer: "Yes! Upload multiple images and they'll be combined into a single PDF file with each image on its own page."
		},
		{
			question: "Are my images secure during conversion?",
			answer: "Absolutely secure. All conversions happen locally in your browser using WebAssembly technology. Your images never leave your device or get uploaded anywhere."
		},
		{
			question: "Will image quality be reduced in the PDF?",
			answer: "No! We preserve the original image quality and resolution. The PDF will contain your images at their full quality with no compression artifacts."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>Image to PDF Converter</h1>
			<p class="subtitle">
				Convert JPG, PNG, and other images to PDF instantly. 100% private, no uploads required.
			</p>

			<div class="features">
				<div class="feature">
					<span class="feature-icon">🔒</span>
					<span>100% Private - No uploads</span>
				</div>
				<div class="feature">
					<span class="feature-icon">⚡</span>
					<span>Instant conversion</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🖼️</span>
					<span>Preserves image quality</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🆓</span>
					<span>Completely free</span>
				</div>
			</div>

			<button class="cta-button" on:click={startConversion}>
				Convert Images to PDF Now
			</button>
		</div>
	</div>

	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert Images to PDF</h2>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Upload Images</h3>
					<p>Drag and drop your JPG, PNG, or other image files. Files stay on your device.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Choose PDF Format</h3>
					<p>Select PDF as your output format. Combine multiple images if needed.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Download Result</h3>
					<p>Get your PDF in seconds with all images at full quality!</p>
				</div>
			</div>
		</div>
	</div>

	<div class="benefits-section">
		<div class="container">
			<h2>Why Choose Our Image to PDF Converter?</h2>
			<div class="benefits">
				<div class="benefit">
					<span class="benefit-icon">✅</span>
					<div>
						<h3>Maintains original quality</h3>
						<p>No quality loss or compression - images stay crystal clear</p>
					</div>
				</div>
				<div class="benefit">
					<span class="benefit-icon">✅</span>
					<div>
						<h3>Fast 30-second conversion</h3>
						<p>Convert single or multiple images instantly</p>
					</div>
				</div>
				<div class="benefit">
					<span class="benefit-icon">✅</span>
					<div>
						<h3>Secure - files deleted after 1 hour</h3>
						<p>Complete privacy with local browser processing</p>
					</div>
				</div>
				<div class="benefit">
					<span class="benefit-icon">✅</span>
					<div>
						<h3>Works on all devices</h3>
						<p>Desktop, mobile, tablet - convert anywhere</p>
					</div>
				</div>
				<div class="benefit">
					<span class="benefit-icon">✅</span>
					<div>
						<h3>Batch conversion support</h3>
						<p>Convert multiple images to PDF at once</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.conversion-page {
		min-height: 100vh;
	}

	.hero-section {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4rem 0;
		text-align: center;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.hero-section h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		font-weight: 800;
	}

	.subtitle {
		font-size: 1.25rem;
		margin-bottom: 3rem;
		opacity: 0.9;
	}

	.features {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 3rem;
		flex-wrap: wrap;
	}

	.feature {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.75rem 1.5rem;
		border-radius: 2rem;
		backdrop-filter: blur(10px);
	}

	.feature-icon {
		font-size: 1.25rem;
	}

	.cta-button {
		background: white;
		color: #667eea;
		padding: 1rem 2rem;
		border: none;
		border-radius: 2rem;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.cta-button:hover {
		transform: translateY(-2px);
	}

	.how-it-works {
		padding: 4rem 0;
		background: #f9fafb;
	}

	.how-it-works h2 {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 3rem;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.step {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		text-align: center;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.step-number {
		width: 3rem;
		height: 3rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.25rem;
		margin: 0 auto 1rem;
	}

	.step h3 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.step p {
		color: #6b7280;
	}

	.benefits-section {
		padding: 4rem 0;
		background: white;
	}

	.benefits-section h2 {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 3rem;
	}

	.benefits {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.benefit {
		display: flex;
		gap: 1rem;
		align-items: start;
	}

	.benefit-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.benefit h3 {
		margin-bottom: 0.5rem;
		font-size: 1.125rem;
	}

	.benefit p {
		color: #6b7280;
		font-size: 0.938rem;
	}

	@media (max-width: 768px) {
		.hero-section h1 {
			font-size: 2rem;
		}

		.features {
			flex-direction: column;
			align-items: center;
		}

		.steps {
			grid-template-columns: 1fr;
		}

		.benefits {
			grid-template-columns: 1fr;
		}
	}
</style>
