<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
</script>

<SEOHead
	title="PDF to Word Converter - Convert PDF to DOCX Online Free"
	description="Convert PDF files to Word documents (DOCX) instantly in your browser. 100% private processing, no uploads required. Maintain formatting and extract editable text."
	keywords="pdf to word converter, pdf to docx, convert pdf to word online, pdf to word free, extract text from pdf, pdf converter"
	appName="PDF to Word Converter"
	appDescription="Convert PDF files to editable Word documents with perfect formatting preservation"
	includeAppSchema={true}
	includeFAQSchema={true}
	includeOrgSchema={true}
	includeBreadcrumbs={true}
	faqs={[
		{
			question: "How do I convert PDF to Word online?",
			answer: "Upload your PDF file, select Word (DOCX) as the output format, and click convert. The conversion happens entirely in your browser - no files are uploaded to any server."
		},
		{
			question: "Is PDF to Word conversion free?",
			answer: "Yes! Our PDF to Word converter is completely free. You can convert up to 5 PDF files simultaneously with no file size limits up to 10GB each."
		},
		{
			question: "Will my PDF formatting be preserved in Word?",
			answer: "Our converter maintains original formatting, fonts, images, and layout as closely as possible. Complex layouts may require minor adjustments in Word."
		},
		{
			question: "Are my PDF files secure during conversion?",
			answer: "Absolutely secure. All conversions happen locally in your browser using WebAssembly technology. Your PDFs never leave your device or get uploaded anywhere."
		},
		{
			question: "What PDF types can be converted to Word?",
			answer: "We support text-based PDFs, scanned PDFs with OCR, PDFs with images, forms, and complex layouts. Password-protected PDFs are also supported if you provide the password."
		},
		{
			question: "Can I edit the converted Word document?",
			answer: "Yes! The converted DOCX file is fully editable in Microsoft Word, Google Docs, LibreOffice, and other word processors. All text becomes selectable and editable."
		}
	]}
/>

<div class="max-w-4xl mx-auto px-6 py-16">

	<!-- Hero -->
	<section class="mb-16">
		<div class="section-eyebrow">PDF → Word</div>
		<h1 class="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-ez-white leading-[1.05]">
			PDF to Word.<br/><span class="text-ez-yellow">In your browser.</span>
		</h1>
		<p class="text-lg text-ez-subtle mt-6 max-w-xl leading-relaxed">
			Convert PDFs to editable .docx files locally. Files don't leave your device.
		</p>
		<div class="flex flex-wrap items-center gap-2 mt-6">
			<span class="badge badge-neutral">Zero Upload</span>
			<span class="badge badge-neutral">100% Local</span>
			<span class="badge badge-neutral">Editable Output</span>
			<span class="badge badge-neutral">Free</span>
		</div>
		<div class="mt-8">
			<a href="/convert" class="btn btn-primary btn-lg">Convert PDF to Word →</a>
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
				<h3 class="text-xl text-ez-white mb-2">Pick DOCX</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Choose Word as the target format. Done in one click.</p>
			</div>
			<div class="card card-body">
				<div class="font-mono text-xs text-ez-yellow uppercase tracking-[0.15em] mb-2">03</div>
				<h3 class="text-xl text-ez-white mb-2">Download</h3>
				<p class="text-ez-subtle text-sm leading-relaxed">Editable .docx in seconds. Open in Word, Google Docs, anywhere.</p>
			</div>
		</div>
	</section>

	<!-- Privacy alert -->
	<section class="mb-16">
		<div class="alert alert-info">
			<div>
				<div class="font-semibold mb-1">Why local conversion matters</div>
				<p class="text-sm leading-relaxed text-ez-subtle">Other "free" PDF converters upload your file to a server. Yours doesn't. Confidential contracts, NDAs, legal docs — the PDF and the resulting Word doc never touch the network.</p>
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
