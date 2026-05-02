<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="Word to PDF Converter - Convert DOCX to PDF Online Free"
	description="Convert Word documents (DOCX, DOC) to PDF files instantly in your browser. 100% private processing, no uploads required. Perfect formatting preservation."
	keywords="word to pdf converter, docx to pdf, convert word to pdf online, word to pdf free, doc to pdf converter"
	appName="Word to PDF Converter"
	appDescription="Convert Word documents to high-quality PDF files with perfect formatting"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert Word to PDF online?",
			answer: "Upload your Word document (DOCX or DOC), select PDF as the output format, and click convert. The conversion happens entirely in your browser with no file uploads."
		},
		{
			question: "Is Word to PDF conversion free?",
			answer: "Yes! Our Word to PDF converter is completely free. Convert up to 5 Word documents simultaneously with no file size limits up to 10GB each."
		},
		{
			question: "Will my Word formatting be preserved in PDF?",
			answer: "Absolutely! Our converter maintains all formatting, fonts, images, tables, headers, footers, and page layouts exactly as they appear in your original Word document."
		},
		{
			question: "Are my Word documents secure during conversion?",
			answer: "Yes, completely secure. All conversions happen locally in your browser using WebAssembly. Your Word documents never leave your device."
		},
		{
			question: "What Word formats can be converted to PDF?",
			answer: "We support all modern Word formats including DOCX (Word 2007+), DOC (older Word versions), and DOCM (macro-enabled documents)."
		},
		{
			question: "Can I convert password-protected Word documents?",
			answer: "Yes! If your Word document is password-protected, you'll be prompted to enter the password during the conversion process. The password is only used locally on your device."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">Word → PDF</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			Word to PDF.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Lock your .docx layout into a portable PDF. Locally. Fonts, tables, images intact.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Layout Preserved</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert Word to PDF →</a>
		</div>
	</section>

	<!-- How it works -->
	<section class="mb-16">
		<div class="section-eyebrow">how it works</div>
		<h2 class="section-title">Three steps. No uploads.</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">01</div>
				<h3 class="text-xl text-ez-white mb-2">Drop your Word doc</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">DOCX, DOC, or DOCM. Drag and drop, no opening Word required.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">02</div>
				<h3 class="text-xl text-ez-white mb-2">Pick PDF</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Headers, footers, tables, images — all rendered exactly where you put them.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">A clean, shareable PDF in seconds. Same on every device.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" Word converters upload your file to a server. Yours doesn't. Resumes, contracts, draft proposals — none of it leaves your device.</p>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="text-center">
		<h2 class="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-ez-white">Convert a Word doc now.</h2>
		<p class="text-ez-subtle mt-3 mb-6">Free. No account. No upload.</p>
		<a href="/convert" class="btn btn-primary btn-lg">Open File Convert →</a>
	</section>
</div>
