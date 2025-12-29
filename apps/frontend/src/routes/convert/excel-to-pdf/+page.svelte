<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';
	
	function startConversion() {
		goto('/convert');
	}
</script>

<!-- Enhanced SEO with FAQ schema for Excel to PDF conversion -->
<SEOHead 
	title="Excel to PDF Converter - Convert XLSX to PDF Online Free"
	description="Convert Excel spreadsheets (XLSX, XLS) to PDF files instantly in your browser. 100% private processing, no uploads required. Perfect for sharing data."
	keywords="excel to pdf converter, xlsx to pdf, convert excel to pdf online, spreadsheet to pdf, excel to pdf free"
	appName="Excel to PDF Converter"
	appDescription="Convert Excel spreadsheets to professional PDF files with preserved formatting"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert Excel to PDF online?",
			answer: "Upload your Excel file (XLSX or XLS), select PDF as the output format, and click convert. All processing happens in your browser - no file uploads to servers."
		},
		{
			question: "Is Excel to PDF conversion free?",
			answer: "Yes! Our Excel to PDF converter is completely free. Convert up to 5 Excel files simultaneously with files up to 10GB each."
		},
		{
			question: "Will my Excel formatting be preserved in PDF?",
			answer: "Yes! Our converter maintains all cell formatting, charts, images, formulas (as values), and worksheet layouts in the PDF output."
		},
		{
			question: "Are my Excel files secure during conversion?",
			answer: "Absolutely secure. All conversions happen locally in your browser using WebAssembly. Your Excel files never leave your device."
		},
		{
			question: "What Excel formats can be converted to PDF?",
			answer: "We support XLSX (Excel 2007+), XLS (older Excel versions), and XLSM (macro-enabled Excel files). Multiple worksheets are supported."
		},
		{
			question: "Can I convert Excel files with multiple sheets?",
			answer: "Yes! Multi-sheet Excel files are supported. You can choose to convert all sheets into a single PDF or select specific sheets for conversion."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>Excel to PDF Converter</h1>
			<p class="subtitle">
				Convert Excel spreadsheets to professional PDF files instantly. 100% private, no uploads required.
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
					<span>Perfect spreadsheet PDFs</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🆓</span>
					<span>Completely free</span>
				</div>
			</div>
			
			<button class="cta-button" on:click={startConversion}>
				Convert Excel to PDF Now
			</button>
		</div>
	</div>
	
	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert Excel to PDF</h2>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Upload Excel File</h3>
					<p>Drag and drop your XLSX or XLS file. Files stay on your device.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Choose PDF Format</h3>
					<p>Select PDF as your output format and choose sheet options if needed.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Download PDF</h3>
					<p>Get your professional PDF file in seconds. Perfect for reports!</p>
				</div>
			</div>
		</div>
	</div>
	
	<div class="use-cases">
		<div class="container">
			<h2>Perfect For</h2>
			<div class="case-grid">
				<div class="case">
					<div class="case-icon">📈</div>
					<h3>Financial Reports</h3>
					<p>Convert financial spreadsheets to PDF for professional presentation and archiving.</p>
				</div>
				<div class="case">
					<div class="case-icon">📋</div>
					<h3>Data Sharing</h3>
					<p>Share spreadsheet data as PDFs that everyone can view without Excel.</p>
				</div>
				<div class="case">
					<div class="case-icon">🖨️</div>
					<h3>Print-Ready Files</h3>
					<p>Create print-ready PDFs with perfect pagination and formatting.</p>
				</div>
				<div class="case">
					<div class="case-icon">📧</div>
					<h3>Email Attachments</h3>
					<p>Send smaller, more compatible PDF files instead of large Excel documents.</p>
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
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
		color: #059669;
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
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
	
	.use-cases {
		padding: 4rem 0;
		background: white;
	}
	
	.use-cases h2 {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 3rem;
	}
	
	.case-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.case {
		text-align: center;
		padding: 2rem;
	}
	
	.case-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.case h3 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}
	
	.case p {
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
		
		.steps, .case-grid {
			grid-template-columns: 1fr;
		}
	}
</style>