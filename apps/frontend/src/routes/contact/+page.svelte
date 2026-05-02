<script lang="ts">
	let email = '';
	let subject = '';
	let message = '';
	let isSubmitting = false;
	let submitSuccess = false;
	let submitError = '';

	async function handleSubmit() {
		if (!email || !subject || !message) {
			submitError = 'Please fill in all fields';
			return;
		}

		isSubmitting = true;
		submitError = '';

		// For now, just show success message
		// In production, this would send to a backend endpoint
		setTimeout(() => {
			isSubmitting = false;
			submitSuccess = true;
			email = '';
			subject = '';
			message = '';

			setTimeout(() => {
				submitSuccess = false;
			}, 5000);
		}, 1000);
	}
</script>

<svelte:head>
	<title>Contact - File Convert</title>
	<meta name="description" content="Get in touch with the File Convert team." />
</svelte:head>

<div class="max-w-xl mx-auto px-6 py-16">
	<div class="section-eyebrow">contact</div>
	<h1 class="text-4xl font-bold tracking-[-0.03em] text-ez-white">Get in touch.</h1>
	<p class="text-ez-subtle mt-3 leading-relaxed">
		Bug? Feature request? Just say hi.
	</p>

	<form on:submit|preventDefault={handleSubmit} class="mt-10 space-y-5">
		<label class="block">
			<span
				class="block font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2"
			>Email</span>
			<input
				id="email"
				type="email"
				bind:value={email}
				required
				class="input"
				placeholder="you@example.com"
			/>
		</label>

		<label class="block">
			<span
				class="block font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2"
			>Subject</span>
			<input
				id="subject"
				type="text"
				bind:value={subject}
				required
				class="input"
				placeholder="What's up?"
			/>
		</label>

		<label class="block">
			<span
				class="block font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2"
			>Message</span>
			<textarea
				id="message"
				bind:value={message}
				required
				rows="6"
				class="input"
				placeholder="Tell us more."
			></textarea>
		</label>

		{#if submitError}
			<div class="alert alert-danger">
				<span class="font-mono text-base leading-none mt-0.5" aria-hidden="true">!</span>
				<div class="text-sm">{submitError}</div>
			</div>
		{/if}

		{#if submitSuccess}
			<div class="alert alert-success">
				<span class="font-mono text-base leading-none mt-0.5" aria-hidden="true">&#10003;</span>
				<div class="text-sm">Got it. We'll get back to you soon.</div>
			</div>
		{/if}

		<button type="submit" disabled={isSubmitting} class="btn btn-primary">
			{isSubmitting ? 'Sending...' : 'Send →'}
		</button>
	</form>

	<div class="mt-12 card card-body">
		<div class="font-mono text-xs text-ez-muted uppercase tracking-[0.1em] mb-2">
			other ways
		</div>
		<p class="text-ez-subtle text-sm leading-relaxed">
			Email <a
				href="mailto:support@fileconvert.app"
				class="text-ez-yellow hover:text-ez-yellow-lt underline">support@fileconvert.app</a
			>
			or check the
			<a href="/help" class="text-ez-yellow hover:text-ez-yellow-lt underline">help page</a> for
			common questions.
		</p>
	</div>
</div>
