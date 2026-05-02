<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';

	const guides = [
		{
			title: 'How to convert PDF to Word',
			summary: 'Open the file. Pick DOCX. Download. Done.',
			href: '/guides/how-to-convert-pdf-to-word',
			category: 'PDF · DOCX'
		},
		{
			title: 'Keep formatting through PDF conversion',
			summary: 'Why fonts break, layouts shift, and tables fall apart — and how to stop it.',
			href: '/guides/maintain-formatting-pdf-conversion',
			category: 'PDF'
		},
		{
			title: 'Batch convert images to PDF',
			summary: 'Drop a stack of JPGs and PNGs. Get one PDF back. No reorder dance.',
			href: '/guides/batch-convert-images-to-pdf',
			category: 'IMAGE · PDF'
		},
		{
			title: 'Convert files without uploading them',
			summary: 'Why most online converters are a privacy disaster — and what to do instead.',
			href: '/guides/secure-file-conversion-online',
			category: 'Privacy'
		},
		{
			title: 'Best PDF to Excel converter',
			summary: 'What separates a real table extractor from a glorified text dump.',
			href: '/guides/best-pdf-to-excel-converter',
			category: 'PDF · XLSX'
		},
		{
			title: 'Document conversion for business teams',
			summary: 'Workflows, security, and naming conventions for teams that ship documents at scale.',
			href: '/guides/document-conversion-business-teams',
			category: 'Workflows'
		}
	];
</script>

<SEOHead
	title="File Conversion Guides - How to Convert Files Online"
	description="Step-by-step guides for converting files between different formats. Learn how to convert PDF, Word, Excel, images, and more with our detailed tutorials."
	keywords="file conversion guide, how to convert files, pdf conversion tutorial, file format guide"
	includeBreadcrumbs={true}
/>

<div class="max-w-5xl mx-auto px-6 py-16">
	<section class="mb-12">
		<div class="section-eyebrow">guides</div>
		<h1 class="text-4xl font-bold tracking-[-0.03em] text-ez-white">
			How to convert files. Without uploading them.
		</h1>
		<p class="text-md text-ez-subtle mt-4 max-w-xl leading-relaxed">
			Step-by-step walkthroughs for the conversions people actually need.
		</p>
		<div class="mt-6">
			<a
				href="/guides/rss.xml"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 font-mono text-xs text-ez-muted uppercase tracking-[0.1em] hover:text-ez-yellow transition-colors duration-base"
			>
				<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
				</svg>
				Subscribe via RSS
			</a>
		</div>
	</section>

	<div class="grid md:grid-cols-2 gap-6">
		{#each guides as g}
			<a href={g.href} class="tool-card no-underline">
				<div class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em]">
					{g.category}
				</div>
				<h2 class="text-xl text-ez-white">{g.title}</h2>
				<p class="text-ez-subtle text-sm leading-relaxed">{g.summary}</p>
			</a>
		{/each}
	</div>
</div>
