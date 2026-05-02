<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="Excel to Word Converter - Convert XLS, XLSX to DOCX Online"
	description="Convert Excel spreadsheets to Word documents instantly in your browser. 100% private processing, maintains tables and data. No uploads required."
	keywords="excel to word, xlsx to docx, convert excel word, spreadsheet to document, xls converter"
	appName="Excel to Word Converter"
	appDescription="Convert Excel files to Word documents with table preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert Excel to Word online?",
			answer: "Upload your Excel file, select Word (DOCX) as output format, and click convert. Tables and data are preserved as Word tables."
		},
		{
			question: "Will my Excel tables be preserved in Word?",
			answer: "Yes! All tables, data, and formatting from your Excel spreadsheet are converted to properly formatted Word tables."
		},
		{
			question: "Can I convert multiple Excel sheets?",
			answer: "Yes! Each Excel worksheet is converted to a separate section or table in the Word document."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">Excel → Word</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			Excel to Word.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Spreadsheets become editable Word tables. Multi-sheet supported. Locally. No upload.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Tables Preserved</span>
			<span class="badge badge-neutral">Multi-Sheet</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert Excel to Word →</a>
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
				<p class="text-ez-subtle text-sm leading-relaxed">XLS, XLSX, XLSM. Single sheet or many — both work.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick DOCX</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Each sheet rebuilt as a Word table. Cells stay editable.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">A .docx ready to drop into a report or memo. Open in Word or Google Docs.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" Excel converters upload your file to a server. Yours doesn't. Internal numbers, HR data, client lists — they never leave your device.</p>
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
