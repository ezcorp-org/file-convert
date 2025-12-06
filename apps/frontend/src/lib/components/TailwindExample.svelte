<script lang="ts">
	// Example component demonstrating Tailwind with brand colors
</script>

<!-- Example Tailwind Component with Brand Style Guide Colors -->
<div class="p-8 bg-neutral-50">
	<div class="max-w-4xl mx-auto space-y-6">
		<!-- Primary Button Examples -->
		<div class="space-y-3">
			<h3 class="text-xl font-semibold text-neutral-900">Primary Buttons</h3>
			<div class="flex gap-4">
				<button class="px-6 py-3 bg-primary text-white font-semibold rounded-full shadow-sm hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-base">
					Start Converting Free
				</button>
				<button class="px-6 py-3 bg-transparent border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-white transition-all duration-base">
					Get Desktop Pro
				</button>
			</div>
		</div>

		<!-- Gradient Examples -->
		<div class="space-y-3">
			<h3 class="text-xl font-semibold text-neutral-900">Gradient Elements</h3>
			<div class="p-6 bg-gradient-to-r from-primary to-accent rounded-xl text-white">
				<h4 class="text-2xl font-bold mb-2">Hero Gradient Background</h4>
				<p>Using the brand's signature gradient from blue to purple</p>
			</div>
		</div>

		<!-- Card Examples -->
		<div class="space-y-3">
			<h3 class="text-xl font-semibold text-neutral-900">Card Styles</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs hover:shadow-lg transition-shadow">
					<div class="text-3xl mb-3">⚡</div>
					<h4 class="font-semibold text-neutral-900 mb-2">Default Card</h4>
					<p class="text-neutral-500 text-sm">Clean minimal card with subtle shadow</p>
				</div>
				<div class="bg-white p-6 rounded-xl border-2 border-primary shadow-lg">
					<div class="text-3xl mb-3">💎</div>
					<h4 class="font-semibold text-neutral-900 mb-2">Featured Card</h4>
					<p class="text-neutral-500 text-sm">Highlighted with primary color border</p>
				</div>
			</div>
		</div>

		<!-- Typography Examples -->
		<div class="space-y-3">
			<h3 class="text-xl font-semibold text-neutral-900">Typography Scale</h3>
			<div class="space-y-2">
				<h1 class="text-5xl font-extrabold text-neutral-900">Hero Heading (text-5xl)</h1>
				<h2 class="text-3xl font-bold text-neutral-800">Section Heading (text-3xl)</h2>
				<h3 class="text-xl font-semibold text-neutral-700">Subsection (text-xl)</h3>
				<p class="text-base text-neutral-600 leading-relaxed">Body text with proper line height for readability. This follows the brand style guide specifications for typography.</p>
				<p class="text-sm text-neutral-500">Small text for secondary information</p>
			</div>
		</div>

		<!-- Badge Examples -->
		<div class="space-y-3">
			<h3 class="text-xl font-semibold text-neutral-900">Badges & Tags</h3>
			<div class="flex gap-3 flex-wrap">
				<span class="inline-flex items-center px-4 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full">
					New
				</span>
				<span class="inline-flex items-center px-4 py-1 bg-success text-white text-xs font-bold uppercase tracking-wider rounded-full">
					✓ Privacy First
				</span>
				<span class="inline-flex items-center px-4 py-1 bg-accent text-white text-xs font-bold uppercase tracking-wider rounded-full">
					Pro Feature
				</span>
			</div>
		</div>
	</div>
</div>

<style>
	/* Any custom styles can still be added here if needed */
</style>