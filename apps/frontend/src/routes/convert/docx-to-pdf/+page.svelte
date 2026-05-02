<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="DOCX to PDF Converter - Convert Word Documents to PDF Online"
	description="Convert DOCX and DOC files to PDF instantly in your browser. 100% private processing, maintains formatting. No uploads required."
	keywords="docx to pdf, doc to pdf, word to pdf, convert docx pdf online, document converter"
	appName="DOCX to PDF Converter"
	appDescription="Convert Word documents (DOCX, DOC) to PDF with perfect formatting"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert DOCX to PDF online?",
			answer: "Upload your DOCX file, select PDF as output format, and click convert. All processing is done securely in your browser."
		},
		{
			question: "Will my document formatting be preserved?",
			answer: "Yes! We maintain all formatting, fonts, images, tables, and styles from your Word document in the PDF."
		},
		{
			question: "Can I convert password-protected DOCX files?",
			answer: "Yes, if you provide the correct password, we can convert password-protected Word documents to PDF."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">DOCX → PDF</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			DOCX to PDF.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Lock your Word doc into a portable PDF. Layout, fonts, tables — all intact. Locally.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Layout Preserved</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert DOCX to PDF →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your DOCX</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">DOCX or DOC. Drag and drop, no Word license required.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Headers, footers, tables, images — rendered exactly as you wrote them.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">A clean PDF, identical on every device. Ready to email or sign.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" DOCX converters upload your file to a server. Yours doesn't. Resumes, contracts, drafts — they stay where they belong.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Convert a DOCX now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
