<script lang="ts">
	const faqs = [
		{
			q: 'What file formats do you support?',
			a: 'Over 50 — images (JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO), audio (MP3, WAV, FLAC, OGG, OPUS), documents (PDF, DOCX, TXT, HTML, MD), spreadsheets (XLSX, CSV, TSV, JSON, YAML), and archives (ZIP, 7Z, TAR, TGZ).'
		},
		{
			q: 'Is my data secure?',
			a: 'Yes. Every conversion runs in your browser via WebAssembly. Your files never leave your device. No uploads, no server, no logs.'
		},
		{
			q: 'What is the file size limit?',
			a: 'Up to 10GB per file, for any format. The real limit is your browser’s memory.'
		},
		{
			q: 'Can I self-host File Convert?',
			a: 'Yes. The whole thing is open source — clone the repo, run bun install, deploy the static build wherever you want.'
		},
		{
			q: 'Do you track me?',
			a: 'No analytics. No cookies. No tracking pixels. Open the network tab and check.'
		},
		{
			q: 'How do I report a bug?',
			a: 'Open an issue on GitHub or hit us up via the contact page. Screenshots and the file format pair help a lot.'
		}
	];
</script>

<svelte:head>
	<title>Help - File Convert</title>
	<meta name="description" content="Answers to the questions people actually ask about File Convert." />
</svelte:head>

<div class="max-w-3xl mx-auto px-6 py-16">
	<section class="mb-12">
		<div class="section-eyebrow">help</div>
		<h1 class="text-4xl font-bold tracking-[-0.03em] text-ez-white">
			Questions, answered.
		</h1>
		<p class="text-md text-ez-subtle mt-4 leading-relaxed">
			Everything you might ask before, during, or after a conversion.
		</p>
	</section>

	<div class="space-y-3">
		{#each faqs as item}
			<details class="card card-body group">
				<summary
					class="flex items-center justify-between cursor-pointer list-none text-ez-white font-semibold"
				>
					<span>{item.q}</span>
					<span
						class="text-ez-yellow text-xl leading-none transition-transform duration-base group-open:rotate-45"
						aria-hidden="true">+</span
					>
				</summary>
				<p class="text-ez-subtle text-sm leading-relaxed mt-3">{item.a}</p>
			</details>
		{/each}
	</div>

	<div class="mt-16 card card-body">
		<h2 class="text-xl text-ez-white mb-2">Still stuck?</h2>
		<p class="text-ez-subtle text-sm mb-4">
			Drop us a line. We read every message.
		</p>
		<a href="/contact" class="btn btn-primary">Contact us &rarr;</a>
	</div>
</div>
