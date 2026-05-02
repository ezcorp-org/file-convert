<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="CSV to Excel Converter - Convert CSV to XLSX Online Free"
	description="Convert CSV files to Excel spreadsheets instantly in your browser. 100% private processing, maintains data structure. No uploads required."
	keywords="csv to excel, csv to xlsx, convert csv excel, csv converter, spreadsheet converter"
	appName="CSV to Excel Converter"
	appDescription="Convert CSV files to Excel format with data preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert CSV to Excel online?",
			answer: "Upload your CSV file, select Excel (XLSX) as output format, and click convert. Data structure and columns are preserved."
		},
		{
			question: "Will my CSV data be formatted in Excel?",
			answer: "Yes! CSV data is automatically formatted as an Excel table with proper columns and rows."
		},
		{
			question: "Can I convert large CSV files?",
			answer: "Yes! We support CSV files up to 10GB with millions of rows of data."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">CSV → Excel</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			CSV to Excel.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Raw CSV into a proper .xlsx workbook. Columns auto-detected. Locally. No upload.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Auto-Detect Columns</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert CSV to Excel →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your CSV</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Comma, tab, pipe — we figure out the delimiter. Up to 10GB.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick XLSX</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Headers as the first row. Numbers, dates, text typed correctly.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">A real .xlsx — open in Excel, Sheets, Numbers, anywhere.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" CSV converters upload your file to a server. Yours doesn't. Customer exports, analytics dumps, log data — every row stays on your machine.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Convert a CSV now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
