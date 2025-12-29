<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';
	
	function startConversion() {
		goto('/convert');
	}
</script>

<!-- Enhanced SEO with FAQ schema for Word to PDF conversion -->
<SEOHead 
	title="Word to PDF Converter - Convert DOCX to PDF Online Free"
	description="Convert Word documents (DOCX, DOC) to PDF files instantly in your browser. 100% private processing, no uploads required. Perfect formatting preservation."
	keywords="word to pdf converter, docx to pdf, convert word to pdf online, word to pdf free, doc to pdf converter"
	appName="Word to PDF Converter"
	appDescription="Convert Word documents to high-quality PDF files with perfect formatting"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert Word to PDF online?",
			answer: "Upload your Word document (DOCX or DOC), select PDF as the output format, and click convert. The conversion happens entirely in your browser with no file uploads."
		},
		{
			question: "Is Word to PDF conversion free?",
			answer: "Yes! Our Word to PDF converter is completely free. Convert up to 5 Word documents simultaneously with no file size limits up to 10GB each."
		},
		{
			question: "Will my Word formatting be preserved in PDF?",
			answer: "Absolutely! Our converter maintains all formatting, fonts, images, tables, headers, footers, and page layouts exactly as they appear in your original Word document."
		},
		{
			question: "Are my Word documents secure during conversion?",
			answer: "Yes, completely secure. All conversions happen locally in your browser using WebAssembly. Your Word documents never leave your device."
		},
		{
			question: "What Word formats can be converted to PDF?",
			answer: "We support all modern Word formats including DOCX (Word 2007+), DOC (older Word versions), and DOCM (macro-enabled documents)."
		},
		{
			question: "Can I convert password-protected Word documents?",
			answer: "Yes! If your Word document is password-protected, you'll be prompted to enter the password during the conversion process. The password is only used locally on your device."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>Word to PDF Converter</h1>
			<p class="subtitle">
				Convert Word documents to professional PDF files instantly. 100% private, no uploads required.
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
					<span class="feature-icon">📄</span>
					<span>Perfect PDF output</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🆓</span>
					<span>Completely free</span>
				</div>
			</div>
			
			<button class="cta-button" on:click={startConversion}>
				Convert Word to PDF Now
			</button>
		</div>
	</div>
	
	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert Word to PDF</h2>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Upload Word Document</h3>
					<p>Drag and drop your DOCX or DOC file. Files remain on your device.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Choose PDF Format</h3>
					<p>Select PDF as your output format for universal compatibility.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Download PDF</h3>
					<p>Get your professional PDF file in seconds. Perfect for sharing!</p>
				</div>
			</div>
		</div>
	</div>
	
	<div class="benefits">
		<div class="container">
			<h2>Why Convert Word to PDF?</h2>
			<div class="benefit-grid">
				<div class="benefit">
					<div class="benefit-icon">🛡️</div>
					<h3>Preserve Formatting</h3>
					<p>PDF format locks in your document's formatting, ensuring it looks the same on any device.</p>
				</div>
				<div class="benefit">
					<div class="benefit-icon">🌍</div>
					<h3>Universal Compatibility</h3>
					<p>PDF files can be opened on any device, operating system, or PDF viewer worldwide.</p>
				</div>
				<div class="benefit">
					<div class="benefit-icon">📱</div>
					<h3>Professional Sharing</h3>
					<p>PDFs are the standard for professional document sharing, printing, and archiving.</p>
				</div>
				<div class="benefit">
					<div class="benefit-icon">🔐</div>
					<h3>Security Options</h3>
					<p>PDFs support password protection and permissions for sensitive documents.</p>
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
		background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
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
		color: #dc2626;
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
		background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
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
	
	.benefits {
		padding: 4rem 0;
		background: white;
	}
	
	.benefits h2 {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 3rem;
	}
	
	.benefit-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.benefit {
		text-align: center;
		padding: 2rem;
	}
	
	.benefit-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.benefit h3 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}
	
	.benefit p {
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
		
		.steps, .benefit-grid {
			grid-template-columns: 1fr;
		}
	}
</style>