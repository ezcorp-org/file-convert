<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { goto } from '$app/navigation';
	
	function startConversion() {
		goto('/convert');
	}
	
	const howToSteps = [
		{
			name: "Upload your PDF file",
			text: "Drag and drop your PDF file into the upload area, or click to browse and select your file. The file will remain on your device throughout the entire process.",
			image: "/images/guide-step-upload.jpg"
		},
		{
			name: "Select Word as output format",
			text: "Choose DOCX (Word Document) from the available output formats. This ensures maximum compatibility with Microsoft Word and other word processors.",
			image: "/images/guide-step-format.jpg"
		},
		{
			name: "Start the conversion process",
			text: "Click the 'Convert' button to begin processing. The conversion happens entirely in your browser using WebAssembly technology - no files are uploaded to any server.",
			image: "/images/guide-step-convert.jpg"
		},
		{
			name: "Download your Word document",
			text: "Once conversion is complete, download your new DOCX file. The converted document will maintain the original formatting, fonts, and layout as closely as possible.",
			image: "/images/guide-step-download.jpg"
		}
	];
</script>

<!-- Enhanced SEO with HowTo schema for guide page -->
<SEOHead 
	title="How to Convert PDF to Word: Complete Step-by-Step Guide"
	description="Learn how to convert PDF files to editable Word documents online. Follow our detailed step-by-step guide with screenshots. 100% free and private."
	keywords="how to convert pdf to word, pdf to word guide, convert pdf to docx tutorial, pdf word converter guide"
	includeHowToSchema={true}
	includeBreadcrumbs={true}
	howToName="How to Convert PDF to Word Online"
	howToDescription="Convert PDF files to editable Word documents in 4 simple steps using our free online converter"
	howToSteps={howToSteps}
	breadcrumbs={[
		{ name: 'Home', url: '/' },
		{ name: 'Guides', url: '/guides' },
		{ name: 'How to Convert PDF to Word', url: '/guides/how-to-convert-pdf-to-word' }
	]}
/>

<div class="guide-page">
	<div class="hero-section">
		<div class="container">
			<h1>How to Convert PDF to Word</h1>
			<p class="subtitle">
				Complete step-by-step guide to convert PDF files to editable Word documents
			</p>
			
			<div class="guide-meta">
				<div class="meta-item">
					<span class="meta-icon">⏱️</span>
					<span>2 minutes</span>
				</div>
				<div class="meta-item">
					<span class="meta-icon">📋</span>
					<span>4 steps</span>
				</div>
				<div class="meta-item">
					<span class="meta-icon">💰</span>
					<span>Free</span>
				</div>
			</div>
		</div>
	</div>
	
	<div class="content-section">
		<div class="container">
			<div class="intro">
				<p>
					Converting PDF files to Word documents allows you to edit, modify, and reuse content 
					that was previously locked in PDF format. Our free online converter makes this process 
					simple and secure, with all conversions happening directly in your browser.
				</p>
			</div>
			
			<div class="steps-section">
				<h2>Step-by-Step Instructions</h2>
				
				{#each howToSteps as step, index}
					<div class="step-card">
						<div class="step-header">
							<div class="step-number">{index + 1}</div>
							<h3>{step.name}</h3>
						</div>
						<div class="step-content">
							<p>{step.text}</p>
							{#if step.image}
								<div class="step-image">
									<img src={step.image} alt={step.name} />
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			
			<div class="tips-section">
				<h2>Pro Tips</h2>
				<div class="tips-grid">
					<div class="tip">
						<div class="tip-icon">💡</div>
						<h4>File Quality Matters</h4>
						<p>Higher quality PDFs with clear text will convert better than scanned or low-resolution files.</p>
					</div>
					<div class="tip">
						<div class="tip-icon">🔒</div>
						<h4>Password Protection</h4>
						<p>If your PDF is password-protected, you'll be prompted to enter the password during conversion.</p>
					</div>
					<div class="tip">
						<div class="tip-icon">📝</div>
						<h4>Formatting Notes</h4>
						<p>Complex layouts may require minor adjustments in Word, but most formatting will be preserved.</p>
					</div>
					<div class="tip">
						<div class="tip-icon">⚡</div>
						<h4>Batch Processing</h4>
						<p>You can convert up to 5 PDF files simultaneously in our free version.</p>
					</div>
				</div>
			</div>
			
			<div class="cta-section">
				<h2>Ready to Convert Your PDF?</h2>
				<p>Start converting your PDF files to Word documents right now - it's completely free!</p>
				<button class="cta-button" on:click={startConversion}>
					Convert PDF to Word Now
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.guide-page {
		min-height: 100vh;
	}
	
	.hero-section {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4rem 0;
		text-align: center;
	}
	
	.container {
		max-width: 800px;
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
		margin-bottom: 2rem;
		opacity: 0.9;
	}
	
	.guide-meta {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
	}
	
	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem 1rem;
		border-radius: 1rem;
		backdrop-filter: blur(10px);
	}
	
	.meta-icon {
		font-size: 1.25rem;
	}
	
	.content-section {
		padding: 4rem 0;
		background: white;
	}
	
	.intro {
		margin-bottom: 3rem;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 1rem;
		border-left: 4px solid #667eea;
	}
	
	.intro p {
		margin: 0;
		font-size: 1.125rem;
		line-height: 1.7;
		color: #374151;
	}
	
	.steps-section {
		margin-bottom: 4rem;
	}
	
	.steps-section h2 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: #111827;
	}
	
	.step-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		margin-bottom: 2rem;
		overflow: hidden;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}
	
	.step-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		border-bottom: 1px solid #e5e7eb;
	}
	
	.step-number {
		width: 2.5rem;
		height: 2.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.125rem;
		flex-shrink: 0;
	}
	
	.step-header h3 {
		margin: 0;
		font-size: 1.25rem;
		color: #111827;
	}
	
	.step-content {
		padding: 2rem;
	}
	
	.step-content p {
		margin: 0 0 1.5rem;
		line-height: 1.7;
		color: #374151;
	}
	
	.step-image {
		border-radius: 0.5rem;
		overflow: hidden;
		background: #f9fafb;
		padding: 1rem;
		text-align: center;
	}
	
	.step-image img {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
	}
	
	.tips-section {
		margin-bottom: 4rem;
	}
	
	.tips-section h2 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: #111827;
	}
	
	.tips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	
	.tip {
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 1rem;
		text-align: center;
	}
	
	.tip-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
	}
	
	.tip h4 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
		color: #111827;
	}
	
	.tip p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.6;
	}
	
	.cta-section {
		text-align: center;
		padding: 3rem 2rem;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		border-radius: 1rem;
	}
	
	.cta-section h2 {
		margin-bottom: 1rem;
		font-size: 1.75rem;
		color: #111827;
	}
	
	.cta-section p {
		margin-bottom: 2rem;
		color: #6b7280;
	}
	
	.cta-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
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
	
	@media (max-width: 768px) {
		.hero-section h1 {
			font-size: 2rem;
		}
		
		.guide-meta {
			flex-direction: column;
			align-items: center;
		}
		
		.step-header {
			padding: 1rem 1.5rem;
		}
		
		.step-content {
			padding: 1.5rem;
		}
		
		.tips-grid {
			grid-template-columns: 1fr;
		}
	}
</style>