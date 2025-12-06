<script lang="ts">
	import { Mail, MessageCircle, HelpCircle } from 'lucide-svelte';

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
			// Reset form
			email = '';
			subject = '';
			message = '';

			// Hide success message after 5 seconds
			setTimeout(() => {
				submitSuccess = false;
			}, 5000);
		}, 1000);
	}
</script>

<svelte:head>
	<title>Contact Us - File Convert</title>
	<meta name="description" content="Get in touch with File Convert support team">
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
	<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="bg-white rounded-lg shadow-sm p-8">
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
					<MessageCircle class="w-8 h-8 text-blue-600" />
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
				<p class="text-gray-600">We're here to help with any questions or issues</p>
			</div>

			<div class="grid gap-6 mb-8">
				<div class="border rounded-lg p-4 flex items-start gap-4">
					<Mail class="w-5 h-5 text-blue-600 mt-0.5" />
					<div>
						<h3 class="font-semibold text-gray-900">Email Support</h3>
						<p class="text-gray-600 text-sm">support@fileconvert.app</p>
					</div>
				</div>

				<div class="border rounded-lg p-4 flex items-start gap-4">
					<HelpCircle class="w-5 h-5 text-blue-600 mt-0.5" />
					<div>
						<h3 class="font-semibold text-gray-900">FAQ</h3>
						<p class="text-gray-600 text-sm">Check our frequently asked questions on the <a href="/#faq" class="text-blue-600 hover:text-blue-700">homepage</a></p>
					</div>
				</div>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						Your Email
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="your@email.com"
					/>
				</div>

				<div>
					<label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
						Subject
					</label>
					<input
						id="subject"
						type="text"
						bind:value={subject}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="How can we help?"
					/>
				</div>

				<div>
					<label for="message" class="block text-sm font-medium text-gray-700 mb-1">
						Message
					</label>
					<textarea
						id="message"
						bind:value={message}
						required
						rows="5"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Tell us more about your issue or question..."
					></textarea>
				</div>

				{#if submitError}
					<div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
						{submitError}
					</div>
				{/if}

				{#if submitSuccess}
					<div class="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
						Thank you for contacting us! We'll get back to you soon.
					</div>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isSubmitting ? 'Sending...' : 'Send Message'}
				</button>
			</form>
		</div>
	</div>
</div>