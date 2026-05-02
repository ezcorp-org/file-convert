<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="JPG to PDF Converter - Convert JPG/JPEG to PDF Online Free"
	description="Convert JPG and JPEG images to PDF instantly in your browser. 100% private processing, no uploads required. Batch conversion supported."
	keywords="jpg to pdf, jpeg to pdf, convert jpg pdf, photo to pdf, image converter"
	appName="JPG to PDF Converter"
	appDescription="Convert JPG and JPEG images to PDF format with perfect quality"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert JPG to PDF online?",
			answer: "Upload your JPG file, select PDF as output format, and click convert. All processing happens in your browser - no uploads required."
		},
		{
			question: "Is JPG to PDF conversion free?",
			answer: "Yes! Convert up to 5 JPG files simultaneously for free with no file size limits up to 10GB each."
		},
		{
			question: "Can I combine multiple JPG files into one PDF?",
			answer: "Yes! Upload multiple JPG files and they'll be combined into a single PDF with each image on its own page."
		},
		{
			question: "Will my JPG quality be reduced?",
			answer: "No! We preserve the original JPG quality with no compression. Your images remain crystal clear in the PDF."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">JPG → PDF</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			JPG to PDF.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			One JPG or fifty. They become a single PDF. Locally. No quality loss.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Multi-Page</span>
			<span class="badge badge-neutral">Full Quality</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert JPG to PDF →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your JPGs</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">JPG or JPEG. Drag in one file or a whole folder.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Each photo becomes its own page. Original resolution kept.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">A clean multi-page PDF. Email it, print it, archive it.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" JPG converters upload your file to a server. Yours doesn't. Receipts, ID scans, family photos — they stay on your machine.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Bundle some JPGs now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
