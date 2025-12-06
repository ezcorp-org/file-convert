<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';
	
	function startConversion() {
		goto('/convert');
	}
</script>

<!-- Enhanced SEO with FAQ schema for PDF to Word conversion -->
<SEOHead 
	title="PDF to Word Converter - Convert PDF to DOCX Online Free"
	description="Convert PDF files to Word documents (DOCX) instantly in your browser. 100% private processing, no uploads required. Maintain formatting and extract editable text."
	keywords="pdf to word converter, pdf to docx, convert pdf to word online, pdf to word free, extract text from pdf, pdf converter"
	appName="PDF to Word Converter"
	appDescription="Convert PDF files to editable Word documents with perfect formatting preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PDF to Word online?",
			answer: "Upload your PDF file, select Word (DOCX) as the output format, and click convert. The conversion happens entirely in your browser - no files are uploaded to any server."
		},
		{
			question: "Is PDF to Word conversion free?",
			answer: "Yes! Our PDF to Word converter is completely free. You can convert up to 5 PDF files simultaneously with no file size limits up to 100MB each."
		},
		{
			question: "Will my PDF formatting be preserved in Word?",
			answer: "Our converter maintains original formatting, fonts, images, and layout as closely as possible. Complex layouts may require minor adjustments in Word."
		},
		{
			question: "Are my PDF files secure during conversion?",
			answer: "Absolutely secure. All conversions happen locally in your browser using WebAssembly technology. Your PDFs never leave your device or get uploaded anywhere."
		},
		{
			question: "What PDF types can be converted to Word?",
			answer: "We support text-based PDFs, scanned PDFs with OCR, PDFs with images, forms, and complex layouts. Password-protected PDFs are also supported if you provide the password."
		},
		{
			question: "Can I edit the converted Word document?",
			answer: "Yes! The converted DOCX file is fully editable in Microsoft Word, Google Docs, LibreOffice, and other word processors. All text becomes selectable and editable."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>PDF to Word Converter</h1>
			<p class="subtitle">
				Convert PDF files to editable Word documents instantly. 100% private, no uploads required.
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
					<span class="feature-icon">📝</span>
					<span>Editable Word output</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🆓</span>
					<span>Completely free</span>
				</div>
			</div>
			
			<button class="cta-button" on:click={startConversion}>
				Convert PDF to Word Now
			</button>
		</div>
	</div>
	
	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert PDF to Word</h2>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Upload PDF</h3>
					<p>Drag and drop your PDF file or click to browse. Files stay on your device.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Choose Word Format</h3>
					<p>Select DOCX as your output format for maximum compatibility.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Download Result</h3>
					<p>Get your editable Word document in seconds. Ready to edit!</p>
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
	}
</style>