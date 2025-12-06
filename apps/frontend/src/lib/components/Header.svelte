<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let mobileMenuOpen = false;
	let activeSection = '';

	// Safe pathname and hash getters with fallback
	$: currentPath = $page?.url?.pathname || '/';
	$: currentHash = $page?.url?.hash || '';

	// Navigation items with their corresponding section IDs
	const navItems = [
		{ href: '/convert', label: 'Convert', isPage: true },
		{ href: '/#features', label: 'Features', sectionId: 'features' },
		{ href: '/#faq', label: 'FAQ', sectionId: 'faq' },
		{ href: '/#get-started', label: 'Get Started', sectionId: 'get-started' }
	];

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function navigateTo(path) {
		mobileMenuOpen = false;
		if (path.startsWith('#')) {
			// Same page navigation
			scrollToSection(path.substring(1));
		} else if (path.includes('#')) {
			// Navigate to different page then scroll
			const [pagePath, hash] = path.split('#');
			if (currentPath === pagePath || pagePath === '/') {
				scrollToSection(hash);
			} else {
				goto(path);
			}
		} else {
			goto(path);
		}
	}

	function scrollToSection(sectionId) {
		if (!browser) return;

		const element = document.getElementById(sectionId);
		if (element) {
			const navHeight = 64; // Height of sticky navbar
			const elementPosition = element.getBoundingClientRect().top + window.scrollY;
			const offsetPosition = elementPosition - navHeight - 20; // Extra padding

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});

			// Update URL hash without triggering navigation
			if (history.pushState) {
				history.pushState(null, '', `#${sectionId}`);
			}
		}
	}

	function isNavItemActive(item) {
		// For page routes (like /convert)
		if (item.isPage) {
			return currentPath === item.href;
		}

		// For home page sections
		if (currentPath === '/') {
			return item.sectionId === activeSection;
		}

		return false;
	}

	function updateActiveSection() {
		if (!browser || currentPath !== '/') {
			return;
		}

		const scrollY = window.scrollY;
		const navHeight = 80; // Adding extra buffer for nav height

		// Try to find sections in the DOM
		let foundActive = false;

		// Check sections in reverse order (bottom to top)
		// This ensures lower sections take precedence when multiple are visible
		const reversedNavItems = [...navItems].filter(item => item.sectionId).reverse();

		for (const item of reversedNavItems) {
			if (!item.sectionId) continue;

			const element = document.getElementById(item.sectionId);
			if (!element) {
				continue;
			}

			const rect = element.getBoundingClientRect();
			const absoluteTop = rect.top + scrollY;
			const absoluteBottom = absoluteTop + rect.height;

			// Check if we're within this section
			// A section is active if the scroll position + nav height is within it
			if (scrollY + navHeight >= absoluteTop && scrollY + navHeight < absoluteBottom) {
				if (activeSection !== item.sectionId) {
					activeSection = item.sectionId;
				}
				foundActive = true;
				break;
			}
		}

		// Special case: if we're at the very bottom of the page
		if (!foundActive && window.innerHeight + scrollY >= document.body.offsetHeight - 50) {
			// Set to last section
			activeSection = 'get-started';
		} else if (!foundActive && scrollY < 100) {
			// At the top, no section active
			activeSection = '';
		}
	}

	let scrollTimer;
	function handleScroll() {
		// Debounce scroll events
		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(() => {
			updateActiveSection();
		}, 50);
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && mobileMenuOpen) {
			mobileMenuOpen = false;
		}
	}

	onMount(() => {
		if (browser) {
			// Initial check after a short delay to ensure DOM is ready
			setTimeout(() => {
				updateActiveSection();
			}, 100);

			// Add event listeners
			window.addEventListener('scroll', handleScroll);
			window.addEventListener('resize', handleScroll);
			window.addEventListener('keydown', handleKeydown);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleScroll);
			window.removeEventListener('keydown', handleKeydown);
			clearTimeout(scrollTimer);
		}
	});

	// React to page changes
	$: if (browser && currentPath === '/') {
		// When navigating to home page, set up scroll detection
		setTimeout(() => {
			updateActiveSection();
		}, 100);
	} else if (browser) {
		// Clear active section when not on home page
		activeSection = '';
	}
</script>

<header class="site-header">
	<div class="container">
		<nav class="nav">
			<a href="/" class="logo" on:click={() => mobileMenuOpen = false}>
				<span class="logo-icon">🔄</span>
				<span class="logo-text">File Convert</span>
			</a>

			<div class="nav-links desktop-only">
				{#each navItems as item}
					<a
						href={item.href}
						class:active={isNavItemActive(item)}
						on:click|preventDefault={() => navigateTo(item.href)}
					>
						{item.label}
					</a>
				{/each}
			</div>

			<div class="nav-actions desktop-only">
				<a href="/convert" class="btn btn-primary">Convert Files</a>
			</div>

			<button
				class="mobile-menu-toggle mobile-only"
				on:click={toggleMobileMenu}
				data-testid="mobile-menu-button"
				aria-label="Toggle mobile menu"
				aria-expanded={mobileMenuOpen}
			>
				<span class="hamburger" class:open={mobileMenuOpen}></span>
			</button>
		</nav>
	</div>

	{#if mobileMenuOpen}
		<div class="mobile-menu" data-testid="mobile-menu">
			<div class="mobile-menu-content" data-testid="mobile-menu-items">
				{#each navItems as item}
					<a
						href={item.href}
						on:click|preventDefault={() => navigateTo(item.href)}
						class:active={isNavItemActive(item)}
					>
						{item.label}
					</a>
				{/each}
				<div class="mobile-menu-actions">
					<a
						href="/convert"
						class="btn btn-primary btn-block"
					>
						Convert Files
					</a>
				</div>
			</div>
		</div>
	{/if}
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: white;
		border-bottom: 1px solid #e2e8f0;
		backdrop-filter: blur(10px);
		background: rgba(255, 255, 255, 0.95);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		font-weight: 700;
		font-size: 1.25rem;
		color: #1a202c;
		transition: opacity 0.2s;
	}

	.logo:hover {
		opacity: 0.8;
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.nav-links a {
		text-decoration: none;
		color: #64748b;
		font-weight: 500;
		transition: all 0.2s;
		position: relative;
		cursor: pointer;
		padding-bottom: 2px;
	}

	.nav-links a:hover {
		color: #1a202c;
	}

	.nav-links a.active {
		color: #667eea;
	}

	.nav-links a.active::after {
		content: '';
		position: absolute;
		bottom: -22px;
		left: 0;
		right: 0;
		height: 2px;
		background: #667eea;
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: scaleX(0);
			opacity: 0;
		}
		to {
			transform: scaleX(1);
			opacity: 1;
		}
	}

	.nav-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font-size: 0.875rem;
		display: inline-block;
		text-align: center;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover {
		background: #5a67d8;
		transform: translateY(-1px);
	}

	.btn-block {
		width: 100%;
		display: block;
	}

	/* Mobile Menu */
	.mobile-menu-toggle {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
	}

	.hamburger {
		display: block;
		width: 24px;
		height: 2px;
		background: #1a202c;
		position: relative;
		transition: background 0.2s;
	}

	.hamburger::before,
	.hamburger::after {
		content: '';
		position: absolute;
		width: 24px;
		height: 2px;
		background: #1a202c;
		transition: all 0.2s;
	}

	.hamburger::before {
		top: -7px;
	}

	.hamburger::after {
		top: 7px;
	}

	.hamburger.open {
		background: transparent;
	}

	.hamburger.open::before {
		transform: rotate(45deg);
		top: 0;
	}

	.hamburger.open::after {
		transform: rotate(-45deg);
		top: 0;
	}

	.mobile-menu {
		position: fixed;
		top: 64px;
		left: 0;
		right: 0;
		height: calc(100vh - 64px);
		background: white;
		z-index: 999;
		overflow-y: auto;
		animation: slideDown 0.3s ease;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
	}

	@keyframes slideDown {
		from {
			transform: translateY(-10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.mobile-menu-content {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.mobile-menu-content a {
		text-decoration: none;
		color: #64748b;
		font-weight: 500;
		font-size: 1.125rem;
		transition: color 0.2s;
		cursor: pointer;
		padding: 0.5rem 0;
		border-bottom: 2px solid transparent;
	}

	.mobile-menu-content a:hover {
		color: #667eea;
	}

	.mobile-menu-content a.active {
		color: #667eea;
		border-bottom-color: #667eea;
	}

	.mobile-menu-actions {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Responsive */
	.desktop-only {
		display: flex;
	}

	.mobile-only {
		display: none;
	}

	@media (max-width: 768px) {
		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: block;
		}

		.mobile-menu-toggle {
			display: block;
		}
	}

	/* Smooth scroll behavior for the entire document */
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
