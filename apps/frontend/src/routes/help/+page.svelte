<script lang="ts">
	import { goto } from '$app/navigation';
	import { HelpCircle, ArrowLeft, Mail, MessageCircle } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Help & Support - File Convert</title>
	<meta name="description" content="Get help and support for File Convert" />
</svelte:head>

<div class="help-page">
	<div class="container">
		<header class="page-header">
			<button class="back-button" on:click={() => goto('/')}>
				<ArrowLeft class="w-5 h-5" />
				Back to Home
			</button>
			<div class="header-content">
				<HelpCircle class="w-8 h-8 text-blue-600" />
				<div>
					<h1>Help & Support</h1>
					<p>We're here to help you get the most out of File Convert</p>
				</div>
			</div>
		</header>

		<div class="help-content">
			<section class="help-section">
				<h2>Getting Started</h2>
				<div class="help-cards">
					<div class="help-card">
						<h3>How to Convert Files</h3>
						<p>Upload your files, select the output format, and click convert. It's that simple!</p>
					</div>
					<div class="help-card">
						<h3>Supported Formats</h3>
						<p>We support a wide range of file formats including images, documents, and archives.</p>
					</div>
					<div class="help-card">
						<h3>Open Source</h3>
						<p>File Convert is open source! Contribute, report issues, or self-host on GitHub.</p>
					</div>
				</div>
			</section>

			<section class="help-section">
				<h2>Contact Support</h2>
				<div class="contact-options">
					<div class="contact-card">
						<Mail class="w-6 h-6 text-blue-600" />
						<div>
							<h3>Email Support</h3>
							<p>Get help via email within 24 hours</p>
							<a href="mailto:support@fileconvert.com" class="contact-link">
								support@fileconvert.com
							</a>
						</div>
					</div>
					<div class="contact-card">
						<MessageCircle class="w-6 h-6 text-green-600" />
						<div>
							<h3>Live Chat</h3>
							<p>Chat with our support team in real-time</p>
							<button class="contact-link">Start Chat</button>
						</div>
					</div>
				</div>
			</section>

			<section class="help-section">
				<h2>Frequently Asked Questions</h2>
				<div class="faq-list">
					<details class="faq-item">
						<summary>What file formats do you support?</summary>
						<p>We support over 50 file formats including images (JPG, PNG, WebP), documents (PDF, DOCX), and archives (ZIP, 7Z).</p>
					</details>
					<details class="faq-item">
						<summary>Is my data secure?</summary>
						<p>Yes! All conversions happen locally in your browser. Your files never leave your device.</p>
					</details>
					<details class="faq-item">
						<summary>What are the file size limits?</summary>
						<p>Files up to 10GB are supported.</p>
					</details>
					<details class="faq-item">
						<summary>Can I self-host File Convert?</summary>
						<p>Yes! File Convert is open source. Check our GitHub repository for deployment instructions.</p>
					</details>
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.help-page {
		min-height: 100vh;
		background: #f9fafb;
		padding: 2rem 0;
	}

	.container {
		max-width: 1024px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.page-header {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		background: none;
		border: none;
		font-size: 0.875rem;
		cursor: pointer;
		margin-bottom: 1rem;
		transition: color 0.15s;
	}

	.back-button:hover {
		color: #374151;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-content h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}

	.header-content p {
		color: #6b7280;
		margin: 0;
	}

	.help-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.help-section {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.help-section h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1.5rem 0;
	}

	.help-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.help-card {
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #f9fafb;
	}

	.help-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.help-card p {
		color: #6b7280;
		line-height: 1.5;
		margin: 0;
	}

	.contact-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.contact-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #f9fafb;
	}

	.contact-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}

	.contact-card p {
		color: #6b7280;
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
	}

	.contact-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.contact-link:hover {
		color: #2563eb;
		text-decoration: underline;
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.faq-item {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	.faq-item summary {
		padding: 1rem 1.5rem;
		background: #f9fafb;
		cursor: pointer;
		font-weight: 500;
		color: #111827;
		border-bottom: 1px solid #e5e7eb;
	}

	.faq-item summary:hover {
		background: #f3f4f6;
	}

	.faq-item p {
		padding: 1rem 1.5rem;
		margin: 0;
		color: #6b7280;
		line-height: 1.6;
		background: white;
	}

	@media (max-width: 768px) {
		.help-page {
			padding: 1rem 0;
		}

		.page-header {
			padding: 1.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			text-align: left;
		}

		.header-content h1 {
			font-size: 1.75rem;
		}

		.help-section {
			padding: 1.5rem;
		}

		.help-cards,
		.contact-options {
			grid-template-columns: 1fr;
		}

		.contact-card {
			flex-direction: column;
			text-align: center;
		}
	}
</style>