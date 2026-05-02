<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';

	const howToSteps = [
		{
			name: 'Upload your PDF file',
			text: 'Drag and drop your PDF file into the upload area, or click to browse and select your file. The file will remain on your device throughout the entire process.',
			image: '/images/guide-step-upload.jpg'
		},
		{
			name: 'Select Word as output format',
			text: 'Choose DOCX (Word Document) from the available output formats. This ensures maximum compatibility with Microsoft Word and other word processors.',
			image: '/images/guide-step-format.jpg'
		},
		{
			name: 'Start the conversion process',
			text: "Click Convert. The conversion happens entirely in your browser using WebAssembly — no files are uploaded to any server.",
			image: '/images/guide-step-convert.jpg'
		},
		{
			name: 'Download your Word document',
			text: 'Once conversion finishes, download your DOCX file. Original formatting, fonts, and layout are preserved as closely as the source allows.',
			image: '/images/guide-step-download.jpg'
		}
	];
</script>

<SEOHead
	title="How to Convert PDF to Word: Complete Step-by-Step Guide"
	description="Learn how to convert PDF files to editable Word documents online. Follow our detailed step-by-step guide with screenshots. 100% free and private."
	keywords="how to convert pdf to word, pdf to word guide, convert pdf to docx tutorial, pdf word converter guide"
	includeHowToSchema={true}
	includeBreadcrumbs={true}
	howToName="How to Convert PDF to Word Online"
	howToDescription="Convert PDF files to editable Word documents in 4 simple steps using our free online converter"
	howToSteps={howToSteps}
	breadcrumbs={[
		{ name: 'Home', url: '/' },
		{ name: 'Guides', url: '/guides' },
		{ name: 'How to Convert PDF to Word', url: '/guides/how-to-convert-pdf-to-word' }
	]}
/>

<article class="max-w-3xl mx-auto px-6 py-16">
	<div class="section-eyebrow">guide</div>
	<h1 class="text-4xl font-bold tracking-[-0.03em] text-ez-white leading-[1.1]">
		How to convert PDF to Word
	</h1>
	<p class="text-lg text-ez-subtle mt-4 leading-relaxed">
		Drop the PDF. Pick DOCX. Download. Four steps, no upload, no account.
	</p>

	<div class="mt-6 flex flex-wrap gap-2">
		<span class="badge badge-neutral">2 min</span>
		<span class="badge badge-neutral">4 steps</span>
		<span class="badge badge-green">Free</span>
	</div>

	<div
		class="mt-10 space-y-6 text-ez-text leading-relaxed
		[&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:font-bold [&_h2]:tracking-[-0.03em] [&_h2]:text-ez-white
		[&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-ez-white [&_h3]:font-semibold
		[&_p]:text-ez-subtle
		[&_a]:text-ez-yellow [&_a]:underline hover:[&_a]:text-ez-yellow-lt
		[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:text-ez-subtle
		[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:text-ez-subtle
		[&_img]:rounded-lg [&_img]:border [&_img]:border-ez-border [&_img]:my-4"
	>
		<p>
			Converting PDFs to Word lets you edit content that was previously locked. Our converter
			runs entirely in your browser — your file never leaves your device.
		</p>

		<h2>Step-by-step</h2>

		{#each howToSteps as step, index}
			<div class="card card-body !p-6 my-6">
				<div class="flex items-start gap-4">
					<div
						class="font-mono text-xs text-ez-yellow uppercase tracking-[0.1em] shrink-0 pt-1"
					>
						step {String(index + 1).padStart(2, '0')}
					</div>
					<div class="flex-1">
						<h3 class="!text-xl !mt-0 !mb-2">{step.name}</h3>
						<p>{step.text}</p>
						{#if step.image}
							<img src={step.image} alt={step.name} class="mt-4" />
						{/if}
					</div>
				</div>
			</div>
		{/each}

		<h2>Pro tips</h2>
		<ul>
			<li>
				<strong class="text-ez-white">Quality in, quality out.</strong> A clean source PDF
				converts better than a low-res scan.
			</li>
			<li>
				<strong class="text-ez-white">Password-protected files.</strong> You'll be prompted
				for the password during conversion. It never leaves your browser.
			</li>
			<li>
				<strong class="text-ez-white">Complex layouts.</strong> Most formatting carries
				through. Heavy column layouts may need a quick touch-up in Word.
			</li>
			<li>
				<strong class="text-ez-white">Batch.</strong> You can queue multiple PDFs at once.
			</li>
		</ul>
	</div>

	<div class="mt-16 card card-body">
		<h2 class="text-xl text-ez-white mb-2">Try it now.</h2>
		<p class="text-ez-subtle text-sm mb-4">
			Open File Convert and try this conversion in your browser.
		</p>
		<a href="/convert" class="btn btn-primary">Open File Convert →</a>
	</div>
</article>
