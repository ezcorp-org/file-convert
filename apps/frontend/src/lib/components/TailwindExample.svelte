<script lang="ts">
	// Reference component for the EZ design system tokens.
	// Use this only as a visual reference — not currently mounted in any route.
</script>

<div class="p-8 bg-ez-black">
	<div class="max-w-4xl mx-auto space-y-8">
		<div>
			<div class="section-eyebrow">buttons</div>
			<div class="flex gap-3 mt-2">
				<button type="button" class="btn btn-primary">Convert files</button>
				<button type="button" class="btn btn-secondary">Learn more</button>
				<button type="button" class="btn btn-ghost">Cancel</button>
			</div>
		</div>

		<div>
			<div class="section-eyebrow">cards</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
				<div class="card card-body">
					<h4 class="text-ez-white font-semibold">Default card</h4>
					<p class="text-ez-subtle text-sm mt-1">Subtle border on a warm dark surface.</p>
				</div>
				<div class="tool-card">
					<div class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em]">tool</div>
					<h4 class="text-ez-white text-lg">Featured tool card</h4>
					<p class="text-ez-subtle text-sm">Hover for the yellow border.</p>
				</div>
			</div>
		</div>

		<div>
			<div class="section-eyebrow">type</div>
			<div class="space-y-2 mt-2">
				<h1 class="text-4xl font-bold tracking-[-0.03em] text-ez-white">Hero (4xl)</h1>
				<h2 class="text-2xl font-bold tracking-[-0.03em] text-ez-white">Section (2xl)</h2>
				<p class="text-ez-subtle leading-relaxed">Body text on the warm subtle ramp.</p>
				<p class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em]">metadata · v1</p>
			</div>
		</div>

		<div>
			<div class="section-eyebrow">badges</div>
			<div class="flex gap-2 flex-wrap mt-2">
				<span class="badge badge-yellow">New</span>
				<span class="badge badge-green">Stable</span>
				<span class="badge badge-blue">Info</span>
				<span class="badge badge-neutral">100% Local</span>
			</div>
		</div>
	</div>
</div>
