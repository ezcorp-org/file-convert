<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let mobileMenuOpen = false;

	$: pathname = $page?.url?.pathname || '/';

	const navItems = [
		{ href: '/convert', label: 'Convert', isPage: true },
		{ href: '/#features', label: 'Features', sectionId: 'features' },
		{ href: '/#faq', label: 'FAQ', sectionId: 'faq' },
		{ href: '/guides', label: 'Guides', isPage: true }
	];

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function navigateTo(path: string) {
		mobileMenuOpen = false;
		if (path.includes('#')) {
			const [pagePath, hash] = path.split('#');
			if (pathname === pagePath || pagePath === '/') {
				if (browser) {
					const el = document.getElementById(hash);
					if (el) {
						const offset = el.getBoundingClientRect().top + window.scrollY - 80;
						window.scrollTo({ top: offset, behavior: 'smooth' });
						if (history.pushState) history.pushState(null, '', `#${hash}`);
						return;
					}
				}
				goto(path);
			} else {
				goto(path);
			}
		} else {
			goto(path);
		}
	}

	function isActive(item: { href: string; isPage?: boolean }) {
		if (item.isPage) {
			if (item.href === '/convert') return pathname.startsWith('/convert');
			if (item.href === '/guides') return pathname.startsWith('/guides');
			return pathname === item.href;
		}
		return false;
	}
</script>

<header class="bg-ez-s0 border-b border-ez-border h-14 flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur">
	<a
		href="/"
		on:click={() => (mobileMenuOpen = false)}
		class="flex items-center gap-3 font-bold text-md text-ez-white tracking-tight no-underline hover:opacity-90 transition-opacity duration-base"
	>
		<img src="/ez-logo.svg" alt="EZ" class="w-7 h-7" />
		<span>File Convert</span>
	</a>

	<nav class="hidden md:flex items-center gap-1">
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-link"
				class:active={isActive(item)}
				on:click|preventDefault={() => navigateTo(item.href)}
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="hidden md:flex items-center">
		<a href="/convert" class="btn btn-primary btn-sm">Convert →</a>
	</div>

	<button
		class="md:hidden flex flex-col items-center justify-center w-9 h-9 gap-[5px] bg-transparent border-0 cursor-pointer"
		on:click={toggleMobileMenu}
		data-testid="mobile-menu-button"
		aria-label="Toggle mobile menu"
		aria-expanded={mobileMenuOpen}
	>
		<span class="block w-5 h-[2px] bg-ez-text transition-transform duration-base" class:rotate-45={mobileMenuOpen} class:translate-y-[7px]={mobileMenuOpen}></span>
		<span class="block w-5 h-[2px] bg-ez-text transition-opacity duration-base" class:opacity-0={mobileMenuOpen}></span>
		<span class="block w-5 h-[2px] bg-ez-text transition-transform duration-base" class:-rotate-45={mobileMenuOpen} class:-translate-y-[7px]={mobileMenuOpen}></span>
	</button>
</header>

{#if mobileMenuOpen}
	<div class="md:hidden fixed inset-x-0 top-14 bottom-0 bg-ez-black border-t border-ez-border z-40 overflow-y-auto" data-testid="mobile-menu">
		<div class="flex flex-col gap-1 p-6" data-testid="mobile-menu-items">
			{#each navItems as item}
				<a
					href={item.href}
					on:click|preventDefault={() => navigateTo(item.href)}
					class="nav-link text-base py-3"
					class:active={isActive(item)}
				>
					{item.label}
				</a>
			{/each}
			<div class="mt-6 pt-6 border-t border-ez-border">
				<a href="/convert" class="btn btn-primary w-full justify-center">Convert →</a>
			</div>
		</div>
	</div>
{/if}
