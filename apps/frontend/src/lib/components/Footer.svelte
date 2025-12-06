<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="container">
		<div class="footer-content">
			<div class="footer-section">
				<div class="footer-brand">
					<span class="brand-icon">🔄</span>
					<h3>File Convert</h3>
				</div>
				<p class="footer-tagline">
					Privacy-first file conversion.<br />
					Your files never leave your device.
				</p>
				<div class="privacy-badges">
					<span class="badge">🔒 100% Private</span>
					<span class="badge">🚫 No Tracking</span>
					<span class="badge">✅ GDPR Ready</span>
				</div>
			</div>

			<div class="footer-section">
				<h4>Product</h4>
				<ul>
					<li><a href="/">Web Converter</a></li>
					<li><a href="/">Features</a></li>
					<li><a href="/convert">Start Converting</a></li>
				</ul>
			</div>

			<div class="footer-section">
				<h4>Formats</h4>
				<ul>
					<li><a href="/">Image Converter</a></li>
					<li><a href="/">Document Converter</a></li>
					<li><a href="/">Audio Converter</a></li>
					<li><a href="/">Archive Tools</a></li>
					<li><a href="/">Data Converter</a></li>
				</ul>
			</div>

			<div class="footer-section">
				<h4>Company</h4>
				<ul>
					<li><a href="/">About Us</a></li>
					<li><a href="/">Privacy Policy</a></li>
					<li><a href="/">Terms of Service</a></li>
					<li><a href="/">Contact</a></li>
					<li>
						<a href="https://discord.ezcorp.org" target="_blank" rel="noopener"
							>💬 Discord Community</a
						>
					</li>
					<li>
						<a href="https://github.com" target="_blank" rel="noopener"
							>Open Source</a
						>
					</li>
				</ul>
			</div>

			<div class="footer-section">
				<h4>Get Desktop Pro</h4>
				<p class="desktop-pro-text">
					Unlimited conversions, 10GB+ files, batch processing, and more.
				</p>
				<button
					class="btn-cta"
					on:click={() => alert("Desktop Pro coming soon!")}
				>
					Download Desktop Pro
				</button>
				<div class="platforms">
					<span>💻 Windows</span>
					<span>🍎 macOS</span>
					<span>🐧 Linux</span>
				</div>
			</div>
		</div>

		<div class="footer-bottom">
			<div class="footer-bottom-content">
				<p class="copyright">
					© {currentYear} File Convert. All rights reserved.
				</p>
				<div class="footer-links">
					<a href="/">Privacy</a>
					<span class="separator">•</span>
					<a href="/">Terms</a>
					<span class="separator">•</span>
					<a href="/">Cookies</a>
					<span class="separator">•</span>
					<a href="/">Security</a>
				</div>
			</div>
			<div class="made-with">Built with 💜 for privacy-conscious users</div>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		background: #1a202c;
		color: #e2e8f0;
		margin-top: auto;
		padding: 4rem 0 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.footer-content {
		display: grid;
		grid-template-columns: 2fr repeat(4, 1fr);
		gap: 3rem;
		padding-bottom: 3rem;
		border-bottom: 1px solid #2d3748;
	}

	.footer-section h3 {
		margin: 0 0 1rem;
		font-size: 1.25rem;
		color: white;
	}

	.footer-section h4 {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #a0aec0;
	}

	.footer-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.brand-icon {
		font-size: 1.75rem;
	}

	.footer-tagline {
		line-height: 1.6;
		color: #cbd5e0;
		margin-bottom: 1.5rem;
	}

	.privacy-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		background: rgba(102, 126, 234, 0.1);
		border: 1px solid rgba(102, 126, 234, 0.3);
		border-radius: 16px;
		font-size: 0.75rem;
		color: #a5b4fc;
	}

	.footer-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.footer-section li {
		margin-bottom: 0.75rem;
	}

	.footer-section a {
		color: #cbd5e0;
		text-decoration: none;
		transition: color 0.2s;
		font-size: 0.9375rem;
	}

	.footer-section a:hover {
		color: #667eea;
	}

	.desktop-pro-text {
		color: #cbd5e0;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.btn-cta {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		margin-bottom: 1rem;
	}

	.btn-cta:hover {
		background: #5a67d8;
		transform: translateY(-1px);
	}

	.platforms {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: #a0aec0;
	}

	.footer-bottom {
		padding: 2rem 0;
	}

	.footer-bottom-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.copyright {
		margin: 0;
		color: #a0aec0;
		font-size: 0.875rem;
	}

	.footer-links {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.footer-links a {
		color: #a0aec0;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.footer-links a:hover {
		color: #667eea;
	}

	.separator {
		color: #4a5568;
	}

	.made-with {
		text-align: center;
		color: #718096;
		font-size: 0.875rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.footer-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.footer-section:first-child {
			grid-column: span 1;
		}

		.footer-bottom-content {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.privacy-badges {
			justify-content: center;
		}
	}
</style>
