<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="Image to PDF Converter - Convert JPG, PNG to PDF Online Free"
	description="Convert images to PDF instantly in your browser. Support for JPG, PNG, GIF, WebP formats. 100% private processing, no uploads required. Batch conversion available."
	keywords="image to pdf, jpg to pdf, png to pdf, convert image pdf, photo to pdf converter"
	appName="Image to PDF Converter"
	appDescription="Convert images to PDF format with perfect quality preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert images to PDF online?",
			answer: "Upload your image files (JPG, PNG, GIF, or WebP), select PDF as the output format, and click convert. The conversion happens entirely in your browser - no files are uploaded to any server."
		},
		{
			question: "Is image to PDF conversion free?",
			answer: "Yes! Our image to PDF converter is completely free. You can convert up to 5 images simultaneously with no file size limits up to 10GB each."
		},
		{
			question: "What image formats can be converted to PDF?",
			answer: "We support JPG, JPEG, PNG, GIF, WebP, BMP, and other common image formats. All formats maintain their original quality in the PDF output."
		},
		{
			question: "Can I combine multiple images into one PDF?",
			answer: "Yes! Upload multiple images and they'll be combined into a single PDF file with each image on its own page."
		},
		{
			question: "Are my images secure during conversion?",
			answer: "Absolutely secure. All conversions happen locally in your browser using WebAssembly technology. Your images never leave your device or get uploaded anywhere."
		},
		{
			question: "Will image quality be reduced in the PDF?",
			answer: "No! We preserve the original image quality and resolution. The PDF will contain your images at their full quality with no compression artifacts."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">Image → PDF</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			Images to PDF.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			JPG, PNG, GIF, WebP. Drop one or fifty, get a single PDF. Locally. Full quality.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Multi-Page</span>
			<span class="badge badge-neutral">Full Quality</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert Images to PDF →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your images</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">One file or many. JPG, PNG, GIF, WebP, BMP — all welcome.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Each image becomes a page. Original resolution preserved.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">One PDF, multi-page, ready to email or archive.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" image converters upload your file to a server. Yours doesn't. Personal photos, ID scans, screenshots — they stay where they belong.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Bundle some images now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
