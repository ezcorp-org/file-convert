<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="PDF to JPG Converter - Convert PDF to JPG/JPEG Online Free"
	description="Convert PDF pages to JPG images instantly in your browser. 100% private processing, no uploads required. Extract all pages as images."
	keywords="pdf to jpg, pdf to jpeg, convert pdf jpg, pdf image converter, extract pdf images"
	appName="PDF to JPG Converter"
	appDescription="Convert PDF pages to JPG images with perfect quality"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PDF to JPG online?",
			answer: "Upload your PDF file, select JPG as output format, and click convert. Each PDF page becomes a separate JPG image."
		},
		{
			question: "Is PDF to JPG conversion free?",
			answer: "Yes! Convert PDFs to JPG for free with no limits on the number of pages or file size up to 10GB."
		},
		{
			question: "Can I convert all PDF pages to JPG?",
			answer: "Yes! Our converter extracts all pages from your PDF and converts each page to a separate high-quality JPG image."
		},
		{
			question: "What resolution will my JPG images be?",
			answer: "We preserve the original PDF resolution, typically 300 DPI for print quality. You can also choose custom resolution settings."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">PDF → JPG</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			PDF to JPG.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Every page of your PDF rendered as a high-res JPG. Locally. No upload.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">All Pages</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert PDF to JPG →</a>
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
				<p class="text-ez-subtle text-sm leading-relaxed">Drag and drop or click to pick a file. It stays in your browser.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick JPG</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Each page becomes its own JPG. Pick the resolution if you care.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">All pages bundled and ready. Drop into Photoshop, slides, anywhere.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" PDF converters upload your file to a server. Yours doesn't. Internal slide decks, signed forms, ID scans — every page renders on your device.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Convert a PDF now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
