<script lang="ts">
	const currentYear = new Date().getFullYear();

	const productLinks = [
		{ href: '/convert', label: 'Convert' },
		{ href: '/#features', label: 'Features' },
		{ href: '/guides', label: 'Guides' }
	];

	const formatLinks = [
		{ href: '/convert/pdf-to-word', label: 'PDF to Word' },
		{ href: '/convert/pdf-to-jpg', label: 'PDF to JPG' },
		{ href: '/convert/jpg-to-pdf', label: 'JPG to PDF' },
		{ href: '/convert/excel-to-pdf', label: 'Excel to PDF' },
		{ href: '/convert/pdf-to-excel', label: 'PDF to Excel' }
	];

	const companyLinks = [
		{ href: '/help', label: 'Help' },
		{ href: '/contact', label: 'Contact' },
		{ href: 'https://discord.ezcorp.org', label: 'Discord', external: true },
		{ href: 'https://github.com', label: 'GitHub', external: true }
	];
</script>

<footer class="bg-ez-s0 border-t border-ez-border mt-20">
	<div class="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
		<div class="space-y-3">
			<div class="flex items-center gap-3 font-bold text-md text-ez-white">
				<img src="/ez-logo.svg" alt="EZ" class="w-7 h-7" />
				<span>File Convert</span>
			</div>
			<p class="text-ez-subtle text-sm leading-relaxed max-w-xs">
				Make it EZ. Convert 50+ formats in your browser. Files never leave your device.
			</p>
			<div class="flex flex-wrap gap-2 pt-2">
				<span class="badge badge-neutral">Zero Upload</span>
				<span class="badge badge-neutral">100% Local</span>
				<span class="badge badge-neutral">Open Source</span>
			</div>
		</div>

		<div>
			<h3 class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-3">Product</h3>
			<ul class="space-y-2">
				{#each productLinks as link}
					<li>
						<a href={link.href} class="text-ez-subtle text-sm hover:text-ez-yellow transition-colors duration-base">
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div>
			<h3 class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-3">Formats</h3>
			<ul class="space-y-2">
				{#each formatLinks as link}
					<li>
						<a href={link.href} class="text-ez-subtle text-sm hover:text-ez-yellow transition-colors duration-base">
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div>
			<h3 class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-3">Company</h3>
			<ul class="space-y-2">
				{#each companyLinks as link}
					<li>
						{#if link.external}
							<a
								href={link.href}
								target="_blank"
								rel="noopener"
								class="text-ez-subtle text-sm hover:text-ez-yellow transition-colors duration-base"
							>
								{link.label}
							</a>
						{:else}
							<a href={link.href} class="text-ez-subtle text-sm hover:text-ez-yellow transition-colors duration-base">
								{link.label}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="border-t border-ez-border">
		<div class="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 font-mono text-xs text-ez-muted">
			<span>© {currentYear} EZCorp · File Convert</span>
			<span>MIT licensed · No tracking · No accounts</span>
		</div>
	</div>
</footer>
