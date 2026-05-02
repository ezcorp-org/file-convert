<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="PowerPoint to PDF Converter - Convert PPT to PDF Online Free"
	description="Convert PowerPoint presentations to PDF instantly in your browser. 100% private processing, no uploads required. Maintain formatting, animations, and slides."
	keywords="powerpoint to pdf, ppt to pdf, convert powerpoint pdf, presentation to pdf, pptx to pdf converter"
	appName="PowerPoint to PDF Converter"
	appDescription="Convert PowerPoint presentations to PDF format with perfect slide preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PowerPoint to PDF online?",
			answer: "Upload your PowerPoint file (PPT or PPTX), select PDF as the output format, and click convert. The conversion happens entirely in your browser - no files are uploaded to any server."
		},
		{
			question: "Is PowerPoint to PDF conversion free?",
			answer: "Yes! Our PowerPoint to PDF converter is completely free. You can convert up to 5 presentations simultaneously with no file size limits up to 10GB each."
		},
		{
			question: "Will my PowerPoint formatting be preserved in PDF?",
			answer: "Our converter maintains original formatting, fonts, images, layouts, and slides. All visual elements are preserved in the PDF output."
		},
		{
			question: "Are my PowerPoint files secure during conversion?",
			answer: "Absolutely secure. All conversions happen locally in your browser using WebAssembly technology. Your presentations never leave your device or get uploaded anywhere."
		},
		{
			question: "Can I convert password-protected PowerPoint files?",
			answer: "Yes, if you provide the correct password, our converter can process password-protected PPT and PPTX files safely and securely."
		},
		{
			question: "Does the converter work on mobile devices?",
			answer: "Yes! Our converter is fully optimized for mobile browsers and provides the same quality results on smartphones and tablets."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">PowerPoint → PDF</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			PowerPoint to PDF.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Slides into a portable PDF. Locally. Fonts, layouts, images — all rendered as you built them.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Slides Preserved</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert PowerPoint to PDF →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your deck</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">PPT or PPTX. Drag and drop, no PowerPoint license needed.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">One slide per page. Layouts and master themes preserved.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">A polished PDF deck for email, print, or handouts. Same on every screen.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" PowerPoint converters upload your file to a server. Yours doesn't. Pitch decks, internal strategy, board presentations — they stay in this tab.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Convert a deck now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
