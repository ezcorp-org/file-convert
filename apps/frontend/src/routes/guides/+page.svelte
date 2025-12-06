<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { goto } from '$app/navigation';
	
	const guides = [
		{
			title: "How to Convert PDF to Word",
			description: "Complete guide to converting PDF files to editable Word documents",
			url: "/guides/how-to-convert-pdf-to-word",
			icon: "📄",
			difficulty: "Easy",
			time: "5 minutes"
		},
		{
			title: "Maintain Formatting During PDF Conversion",
			description: "Professional tips to preserve formatting when converting PDFs",
			url: "/guides/maintain-formatting-pdf-conversion",
			icon: "✨",
			difficulty: "Intermediate",
			time: "8 minutes"
		},
		{
			title: "Batch Convert Images to PDF",
			description: "Convert multiple images to PDF efficiently with our step-by-step guide",
			url: "/guides/batch-convert-images-to-pdf",
			icon: "🖼️",
			difficulty: "Easy",
			time: "4 minutes"
		},
		{
			title: "Secure File Conversion Online",
			description: "Protect your privacy during file conversions with security best practices",
			url: "/guides/secure-file-conversion-online",
			icon: "🔒",
			difficulty: "Easy",
			time: "6 minutes"
		},
		{
			title: "Best PDF to Excel Converter",
			description: "Find the best PDF to Excel converter with our features comparison guide",
			url: "/guides/best-pdf-to-excel-converter",
			icon: "📊",
			difficulty: "Easy",
			time: "5 minutes"
		},
		{
			title: "Document Conversion for Business Teams",
			description: "Enterprise guide to efficient file conversion workflows and collaboration",
			url: "/guides/document-conversion-business-teams",
			icon: "👥",
			difficulty: "Advanced",
			time: "10 minutes"
		}
	];
</script>

<SEOHead 
	title="File Conversion Guides - How to Convert Files Online"
	description="Step-by-step guides for converting files between different formats. Learn how to convert PDF, Word, Excel, images, and more with our detailed tutorials."
	keywords="file conversion guide, how to convert files, pdf conversion tutorial, file format guide"
	includeBreadcrumbs={true}
/>

<div class="guides-page">
	<div class="hero-section">
		<div class="container">
			<h1>File Conversion Guides</h1>
			<p class="subtitle">
				Step-by-step tutorials for converting files between different formats
			</p>
			<div class="rss-link">
				<a href="/guides/rss.xml" target="_blank" rel="noopener noreferrer">
					<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
					</svg>
					Subscribe to RSS Feed
				</a>
			</div>
		</div>
	</div>
	
	<div class="guides-section">
		<div class="container">
			<div class="guides-grid">
				{#each guides as guide}
					<div class="guide-card">
						<div class="guide-icon">{guide.icon}</div>
						<h3>{guide.title}</h3>
						<p>{guide.description}</p>
						<div class="guide-meta">
							<span class="difficulty">{guide.difficulty}</span>
							<span class="time">{guide.time}</span>
						</div>
						<button class="guide-btn" on:click={() => goto(guide.url)}>
							Read Guide
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.guides-page {
		min-height: 100vh;
	}
	
	.hero-section {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4rem 0;
		text-align: center;
	}
	
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}
	
	.hero-section h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		font-weight: 800;
	}
	
	.subtitle {
		font-size: 1.25rem;
		opacity: 0.9;
		margin-bottom: 1.5rem;
	}

	.rss-link {
		margin-top: 1.5rem;
	}

	.rss-link a {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		text-decoration: none;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background 0.2s, transform 0.2s;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.rss-link a:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}

	.rss-link svg {
		flex-shrink: 0;
	}

	.guides-section {
		padding: 4rem 0;
		background: #f9fafb;
	}
	
	.guides-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.guide-card {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		text-align: center;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		transition: transform 0.2s;
	}
	
	.guide-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
	}
	
	.guide-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.guide-card h3 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
		color: #111827;
	}
	
	.guide-card p {
		color: #6b7280;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}
	
	.guide-meta {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.difficulty, .time {
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.difficulty {
		background: #dcfce7;
		color: #166534;
	}
	
	.time {
		background: #e0e7ff;
		color: #4338ca;
	}
	
	.guide-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s;
	}
	
	.guide-btn:hover {
		transform: translateY(-2px);
	}
	
	@media (max-width: 768px) {
		.hero-section h1 {
			font-size: 2rem;
		}
		
		.guides-grid {
			grid-template-columns: 1fr;
		}
	}
</style>