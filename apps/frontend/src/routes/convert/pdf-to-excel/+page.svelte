<script lang="ts">
	import { goto } from '$app/navigation';
	import SEOHead from '$lib/components/SEOHead.svelte';
	
	function startConversion() {
		goto('/convert');
	}
</script>

<!-- Enhanced SEO with FAQ schema for PDF to Excel conversion -->
<SEOHead 
	title="PDF to Excel Converter - Convert PDF to XLSX Online Free"
	description="Convert PDF files to Excel spreadsheets (XLSX) instantly in your browser. Extract tables and data from PDFs. 100% private processing, no uploads required."
	keywords="pdf to excel converter, pdf to xlsx, convert pdf to excel online, extract pdf tables, pdf to spreadsheet converter"
	appName="PDF to Excel Converter"
	appDescription="Extract tables and data from PDF files and convert to editable Excel spreadsheets"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PDF to Excel online?",
			answer: "Upload your PDF file, select Excel (XLSX) as the output format, and click convert. The conversion happens entirely in your browser - no files are uploaded to any server."
		},
		{
			question: "Is PDF to Excel conversion free?",
			answer: "Yes! Our PDF to Excel converter is completely free. Convert up to 5 PDF files simultaneously with no file size limits up to 100MB each."
		},
		{
			question: "Can I extract tables from PDF to Excel?",
			answer: "Absolutely! Our converter is specifically designed to detect and extract tables from PDFs, converting them into properly formatted Excel spreadsheets with editable cells."
		},
		{
			question: "Are my PDF files secure during conversion?",
			answer: "Yes, completely secure. All conversions happen locally in your browser using WebAssembly technology. Your PDFs never leave your device or get uploaded anywhere."
		},
		{
			question: "What types of PDFs work best for Excel conversion?",
			answer: "PDFs with tabular data, financial reports, invoices, and structured documents work best. Both text-based and scanned PDFs with clear table structures are supported."
		},
		{
			question: "Can I edit the converted Excel file?",
			answer: "Yes! The converted XLSX file is fully editable in Microsoft Excel, Google Sheets, LibreOffice Calc, and other spreadsheet applications. All data becomes selectable and editable."
		}
	]}
/>

<div class="conversion-page">
	<div class="hero-section">
		<div class="container">
			<h1>PDF to Excel Converter</h1>
			<p class="subtitle">
				Extract tables and data from PDF files to editable Excel spreadsheets. 100% private, no uploads required.
			</p>
			
			<div class="features">
				<div class="feature">
					<span class="feature-icon">🔒</span>
					<span>100% Private - No uploads</span>
				</div>
				<div class="feature">
					<span class="feature-icon">⚡</span>
					<span>Smart table detection</span>
				</div>
				<div class="feature">
					<span class="feature-icon">📊</span>
					<span>Editable Excel output</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🆓</span>
					<span>Completely free</span>
				</div>
			</div>
			
			<button class="cta-button" on:click={startConversion}>
				Convert PDF to Excel Now
			</button>
		</div>
	</div>
	
	<div class="how-it-works">
		<div class="container">
			<h2>How to Convert PDF to Excel</h2>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Upload PDF</h3>
					<p>Drag and drop your PDF file with tables or structured data.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Extract Tables</h3>
					<p>Our AI detects and extracts tables and data from your PDF automatically.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Download Excel</h3>
					<p>Get your editable XLSX file with all data in spreadsheet format.</p>
				</div>
			</div>
		</div>
	</div>
	
	<div class="benefits">
		<div class="container">
			<h2>Why Convert PDF to Excel?</h2>
			<div class="benefit-grid">
				<div class="benefit">
					<div class="benefit-icon">✏️</div>
					<h3>Editable Data</h3>
					<p>Transform static PDF tables into editable Excel spreadsheets for analysis and calculations.</p>
				</div>
				<div class="benefit">
					<div class="benefit-icon">🔢</div>
					<h3>Data Analysis</h3>
					<p>Use Excel's powerful formulas, charts, and pivot tables to analyze your extracted data.</p>
				</div>
				<div class="benefit">
					<div class="benefit-icon">📈</div>
					<h3>Create Reports</h3>
					<p>Build comprehensive reports and visualizations from PDF data in Excel format.</p>
				</div>
				<div class="benefit">
					<div class="benefit-icon">🔄</div>
					<h3>Reuse Data</h3>
					<p>Copy and reuse data from PDFs in other spreadsheets and business applications.</p>
				</div>
			</div>
		</div>
	</div>
	
	<div class="use-cases">
		<div class="container">
			<h2>Perfect For</h2>
			<div class="case-grid">
				<div class="case">
					<div class="case-icon">🧾</div>
					<h3>Financial Reports</h3>
					<p>Extract financial data from PDF reports for analysis in Excel.</p>
				</div>
				<div class="case">
					<div class="case-icon">📋</div>
					<h3>Invoices & Statements</h3>
					<p>Convert PDF invoices to Excel for accounting and bookkeeping.</p>
				</div>
				<div class="case">
					<div class="case-icon">📊</div>
					<h3>Data Tables</h3>
					<p>Extract structured data tables from research papers and reports.</p>
				</div>
				<div class="case">
					<div class="case-icon">📈</div>
					<h3>Survey Results</h3>
					<p>Convert PDF survey results to Excel for statistical analysis.</p>
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
		background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
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
		color: #7c3aed;
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
		background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
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
	
	.benefits, .use-cases {
		padding: 4rem 0;
	}
	
	.benefits {
		background: white;
	}
	
	.use-cases {
		background: #f9fafb;
	}
	
	.benefits h2, .use-cases h2 {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 3rem;
	}
	
	.benefit-grid, .case-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.benefit, .case {
		text-align: center;
		padding: 2rem;
	}
	
	.benefit-icon, .case-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.benefit h3, .case h3 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}
	
	.benefit p, .case p {
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
		
		.steps, .benefit-grid, .case-grid {
			grid-template-columns: 1fr;
		}
	}
</style>