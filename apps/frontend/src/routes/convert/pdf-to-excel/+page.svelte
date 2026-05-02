<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

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
			answer: "Yes! Our PDF to Excel converter is completely free. Convert up to 5 PDF files simultaneously with no file size limits up to 10GB each."
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

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">PDF → Excel</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			PDF to Excel.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Pull tables out of PDFs into editable .xlsx spreadsheets. Locally. No upload.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Spreadsheet Output</span>
			<span class="badge badge-neutral">Table Detection</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert PDF to Excel →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Drag in any PDF with tables — invoices, reports, statements. Stays on-device.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick XLSX</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">We detect rows and columns and rebuild them as proper Excel cells.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Editable .xlsx ready for formulas, pivots, charts. Excel, Sheets, Numbers.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" PDF converters upload your file to a server. Yours doesn't. Financial statements, payroll PDFs, customer data — none of it touches the network.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Extract a table now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
