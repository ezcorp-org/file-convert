<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

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

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">Excel → PDF</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			Excel to PDF.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Turn .xlsx workbooks into shareable PDFs. Cells, charts, multi-sheet — all locally.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Multi-Sheet</span>
			<span class="badge badge-neutral">Print-Ready</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert Excel to PDF →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your Excel file</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">XLSX, XLS, or XLSM. Single sheet or fifty — your call.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">All sheets, or just the ones you want. Charts and formatting carry over.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Print-ready PDF, paginated cleanly. Email it without anyone needing Excel.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" Excel converters upload your file to a server. Yours doesn't. Budgets, payroll, customer lists — your data never leaves the tab.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Convert a spreadsheet now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
