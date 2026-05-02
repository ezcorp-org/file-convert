<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="PNG to PDF Converter - Convert PNG to PDF Online Free"
	description="Convert PNG images to PDF instantly in your browser. 100% private processing, no uploads required. Maintains transparency and quality."
	keywords="png to pdf, convert png pdf, png converter, image to pdf, transparent png pdf"
	appName="PNG to PDF Converter"
	appDescription="Convert PNG images to PDF format with transparency support"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PNG to PDF online?",
			answer: "Upload your PNG file, select PDF as output format, and click convert. Processing happens entirely in your browser."
		},
		{
			question: "Will PNG transparency be preserved?",
			answer: "PNG transparency is preserved in the PDF output. Your transparent backgrounds remain intact."
		},
		{
			question: "Can I combine multiple PNG files into one PDF?",
			answer: "Yes! Upload multiple PNG files and combine them into a single PDF document."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">PNG → PDF</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			PNG to PDF.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Lossless PNGs into a single PDF. Transparency preserved. Locally. No upload.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Transparency Kept</span>
			<span class="badge badge-neutral">Multi-Page</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert PNG to PDF →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your PNGs</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">One file or a whole folder. Transparent or solid — both work.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Each PNG becomes a page. Alpha channels preserved.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">One clean PDF. Logos, screenshots, exports — bundled and shareable.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" PNG converters upload your file to a server. Yours doesn't. Brand assets, design exports, internal screenshots — none of it touches the network.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Bundle some PNGs now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
