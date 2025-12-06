<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';

	function startConversion() {
		goto('/convert');
	}
</script>

<!-- Enhanced SEO with FAQ schema for PowerPoint to PDF conversion -->
<SEOHead
	title="PowerPoint to PDF Converter - Convert PPT to PDF Online Free"
	description="Convert PowerPoint presentations to PDF instantly in your browser. 100% private processing, no uploads required. Maintain formatting, animations, and slides."
	keywords="powerpoint to pdf, ppt to pdf, convert powerpoint pdf, presentation to pdf, pptx to pdf converter"
	appName="PowerPoint to PDF Converter"
	appDescription="Convert PowerPoint presentations to PDF format with perfect slide preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PowerPoint to PDF online?",
			answer: "Upload your PowerPoint file (PPT or PPTX), select PDF as the output format, and click convert. The conversion happens entirely in your browser - no files are uploaded to any server."
		},
		{
			question: "Is PowerPoint to PDF conversion free?",
			answer: "Yes! Our PowerPoint to PDF converter is completely free. You can convert up to 5 presentations simultaneously with no file size limits up to 100MB each."
		},
		{
			question: "Will my PowerPoint formatting be preserved in PDF?",
			answer: "Our converter maintains original formatting, fonts, images, layouts, and slides. All visual elements are preserved in the PDF output."
		},
		{
			question: "Are my PowerPoint files secure during conversion?",
			answer: "Absolutely secure. All conversions happen locally in your browser using WebAssembly technology. Your presentations never leave your device or get uploaded anywhere."
		},
		{
			question: "Can I convert password-protected PowerPoint files?",
			answer: "Yes, if you provide the correct password, our converter can process password-protected PPT and PPTX files safely and securely."
		},
		{
			question: "Does the converter work on mobile devices?",
			answer: "Yes! Our converter is fully optimized for mobile browsers and provides the same quality results on smartphones and tablets."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>PowerPoint to PDF Converter</h1>
			<p class="subtitle">
				Convert PowerPoint presentations to PDF instantly. 100% private, no uploads required.
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
					<span class="feature-icon">📊</span>
					<span>Preserves slides & formatting</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🆓</span>
					<span>Completely free</span>
				</div>
			</div>

			<button class="cta-button" on:click={startConversion}>
				Convert PowerPoint to PDF Now
			</button>
		</div>
	</div>

	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert PowerPoint to PDF</h2>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Upload PowerPoint</h3>
					<p>Drag and drop your PPT or PPTX file or click to browse. Files stay on your device.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Choose PDF Format</h3>
					<p>Select PDF as your output format for universal compatibility.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Download Result</h3>
					<p>Get your PDF presentation in seconds. All slides perfectly preserved!</p>
				</div>
			</div>
		</div>
	</div>

	<div class="benefits-section">
		<div class="container">
			<h2>Why Choose Our PowerPoint to PDF Converter?</h2>
			<div class="benefits">
				<div class="benefit">
					<span class="benefit-icon">✅</span>
					<div>
						<h3>Maintains original formatting</h3>
						<p>All slides, layouts, fonts, and images preserved perfectly</p>
					</div>
				</div>
				<div class="benefit">
					<span class="benefit-icon">✅</span>
					<div>
						<h3>Fast 30-second conversion</h3>
						<p>Convert presentations instantly without waiting</p>
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
						<h3>No software installation required</h3>
						<p>Works directly in your browser - no downloads needed</p>
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
