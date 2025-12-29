import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';

import BreadcrumbSchema from './BreadcrumbSchema.svelte';
import FAQSchema from './FAQSchema.svelte';
import HowToSchema from './HowToSchema.svelte';
import OrganizationSchema from './OrganizationSchema.svelte';
import SoftwareApplicationSchema from './SoftwareApplicationSchema.svelte';

afterEach(() => {
	cleanup();
	// Remove any JSON-LD scripts injected into head by svelte:head
	document.head.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
});

function getJsonLd(): any {
	// svelte:head content is rendered into document.head, not the component container
	const script = document.head.querySelector('script[type="application/ld+json"]');
	expect(script, 'Expected a JSON-LD script tag in document.head').not.toBeNull();
	return JSON.parse(script!.textContent!);
}

describe('BreadcrumbSchema', () => {
	it('renders BreadcrumbList schema with auto-generated breadcrumbs from URL', () => {
		render(BreadcrumbSchema);
		const schema = getJsonLd();

		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('BreadcrumbList');
		expect(schema.itemListElement).toBeDefined();
		expect(Array.isArray(schema.itemListElement)).toBe(true);
		expect(schema.itemListElement.length).toBeGreaterThan(0);

		// First item should be Home
		expect(schema.itemListElement[0]).toMatchObject({
			'@type': 'ListItem',
			position: 1,
			name: 'Home'
		});
	});

	it('auto-generates breadcrumbs from URL path', () => {
		render(BreadcrumbSchema);
		const schema = getJsonLd();

		// URL is /convert/pdf -> Home, File Converter, Pdf
		expect(schema.itemListElement).toHaveLength(3);
		expect(schema.itemListElement[1].name).toBe('File Converter');
		expect(schema.itemListElement[1].position).toBe(2);
		expect(schema.itemListElement[2].position).toBe(3);
	});

	it('uses provided breadcrumbs when given', () => {
		const breadcrumbs = [
			{ name: 'Home', url: 'https://fileconvert.com' },
			{ name: 'Custom', url: 'https://fileconvert.com/custom' }
		];
		render(BreadcrumbSchema, { props: { breadcrumbs } });
		const schema = getJsonLd();

		expect(schema.itemListElement).toHaveLength(2);
		expect(schema.itemListElement[0].name).toBe('Home');
		expect(schema.itemListElement[1].name).toBe('Custom');
	});
});

describe('FAQSchema', () => {
	it('renders FAQPage schema with default FAQs', () => {
		render(FAQSchema);
		const schema = getJsonLd();

		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('FAQPage');
		expect(schema.mainEntity).toBeDefined();
		expect(Array.isArray(schema.mainEntity)).toBe(true);
		expect(schema.mainEntity.length).toBe(6); // 6 default FAQs
	});

	it('renders Question/Answer types for each FAQ entry', () => {
		render(FAQSchema);
		const schema = getJsonLd();

		for (const entity of schema.mainEntity) {
			expect(entity['@type']).toBe('Question');
			expect(entity.name).toBeDefined();
			expect(entity.acceptedAnswer['@type']).toBe('Answer');
			expect(entity.acceptedAnswer.text).toBeDefined();
		}
	});

	it('uses custom FAQs when provided', () => {
		const faqs = [
			{ question: 'Q1?', answer: 'A1' },
			{ question: 'Q2?', answer: 'A2' }
		];
		render(FAQSchema, { props: { faqs } });
		const schema = getJsonLd();

		expect(schema.mainEntity).toHaveLength(2);
		expect(schema.mainEntity[0].name).toBe('Q1?');
		expect(schema.mainEntity[0].acceptedAnswer.text).toBe('A1');
	});
});

describe('HowToSchema', () => {
	const defaultProps = {
		name: 'How to Convert PDF to Word',
		description: 'Step-by-step guide to convert PDF files',
		steps: [
			{ name: 'Upload', text: 'Upload your PDF file' },
			{ name: 'Convert', text: 'Click convert button' },
			{ name: 'Download', text: 'Download the result' }
		]
	};

	it('renders HowTo schema with required properties', () => {
		render(HowToSchema, { props: defaultProps });
		const schema = getJsonLd();

		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('HowTo');
		expect(schema.name).toBe(defaultProps.name);
		expect(schema.description).toBe(defaultProps.description);
	});

	it('includes steps with correct positions', () => {
		render(HowToSchema, { props: defaultProps });
		const schema = getJsonLd();

		expect(schema.step).toHaveLength(3);
		schema.step.forEach((step: any, i: number) => {
			expect(step['@type']).toBe('HowToStep');
			expect(step.position).toBe(i + 1);
			expect(step.name).toBe(defaultProps.steps[i].name);
			expect(step.text).toBe(defaultProps.steps[i].text);
		});
	});

	it('includes default supplies and tools', () => {
		render(HowToSchema, { props: defaultProps });
		const schema = getJsonLd();

		expect(schema.supply).toHaveLength(3);
		expect(schema.supply[0]['@type']).toBe('HowToSupply');
		expect(schema.tool).toHaveLength(2);
		expect(schema.tool[0]['@type']).toBe('HowToTool');
	});

	it('includes estimatedCost and totalTime', () => {
		render(HowToSchema, { props: defaultProps });
		const schema = getJsonLd();

		expect(schema.totalTime).toBe('PT2M');
		expect(schema.estimatedCost).toMatchObject({
			'@type': 'MonetaryAmount',
			currency: 'USD',
			value: '0'
		});
	});

	it('includes step image when provided', () => {
		const props = {
			...defaultProps,
			steps: [{ name: 'Step 1', text: 'Do thing', image: 'https://example.com/img.png' }]
		};
		render(HowToSchema, { props });
		const schema = getJsonLd();

		expect(schema.step[0].image).toBe('https://example.com/img.png');
		expect(schema.image).toBe('https://example.com/img.png');
	});
});

describe('OrganizationSchema', () => {
	it('renders Organization schema with default values', () => {
		render(OrganizationSchema);
		const schema = getJsonLd();

		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('Organization');
		expect(schema.name).toBe('File Convert');
		expect(schema.description).toBe('Privacy-first file conversion tools with 100% local processing');
		expect(schema.url).toBe('https://fileconvert.com');
		expect(schema.logo).toBe('https://fileconvert.com/logo.png');
	});

	it('includes required organization properties', () => {
		render(OrganizationSchema);
		const schema = getJsonLd();

		expect(schema.foundingDate).toBe('2024-01-01');
		expect(schema.slogan).toBeDefined();
		expect(schema.knowsAbout).toBeDefined();
		expect(Array.isArray(schema.knowsAbout)).toBe(true);
		expect(schema.areaServed).toBe('Worldwide');
	});

	it('includes offer catalog', () => {
		render(OrganizationSchema);
		const schema = getJsonLd();

		expect(schema.hasOfferCatalog['@type']).toBe('OfferCatalog');
		expect(schema.hasOfferCatalog.itemListElement.length).toBeGreaterThan(0);
	});

	it('includes contactPoint when provided', () => {
		const contactPoint = { contactType: 'support', email: 'help@test.com' };
		render(OrganizationSchema, { props: { contactPoint } });
		const schema = getJsonLd();

		expect(schema.contactPoint['@type']).toBe('ContactPoint');
		expect(schema.contactPoint.email).toBe('help@test.com');
	});

	it('omits contactPoint when empty', () => {
		render(OrganizationSchema);
		const schema = getJsonLd();

		expect(schema.contactPoint).toBeUndefined();
	});

	it('includes sameAs when provided', () => {
		const sameAs = ['https://twitter.com/fileconvert'];
		render(OrganizationSchema, { props: { sameAs } });
		const schema = getJsonLd();

		expect(schema.sameAs).toEqual(sameAs);
	});
});

describe('SoftwareApplicationSchema', () => {
	it('renders SoftwareApplication schema with defaults', () => {
		render(SoftwareApplicationSchema);
		const schema = getJsonLd();

		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('SoftwareApplication');
		expect(schema.name).toBe('File Converter Pro');
		expect(schema.applicationCategory).toBe('UtilitiesApplication');
		expect(schema.operatingSystem).toBe('Web Browser');
	});

	it('includes aggregate rating', () => {
		render(SoftwareApplicationSchema);
		const schema = getJsonLd();

		expect(schema.aggregateRating['@type']).toBe('AggregateRating');
		expect(schema.aggregateRating.ratingValue).toBe('4.8');
		expect(schema.aggregateRating.ratingCount).toBe('2547');
		expect(schema.aggregateRating.bestRating).toBe('5');
		expect(schema.aggregateRating.worstRating).toBe('1');
	});

	it('includes offer with pricing', () => {
		render(SoftwareApplicationSchema);
		const schema = getJsonLd();

		expect(schema.offers['@type']).toBe('Offer');
		expect(schema.offers.price).toBe('9.99');
		expect(schema.offers.priceCurrency).toBe('USD');
		expect(schema.offers.availability).toBe('https://schema.org/InStock');
	});

	it('includes author organization', () => {
		render(SoftwareApplicationSchema);
		const schema = getJsonLd();

		expect(schema.author['@type']).toBe('Organization');
		expect(schema.author.name).toBe('File Convert');
	});

	it('accepts custom props', () => {
		render(SoftwareApplicationSchema, {
			props: {
				appName: 'My App',
				price: '0',
				ratingValue: '5.0'
			}
		});
		const schema = getJsonLd();

		expect(schema.name).toBe('My App');
		expect(schema.offers.price).toBe('0');
		expect(schema.aggregateRating.ratingValue).toBe('5.0');
	});

	it('includes browser and system requirements', () => {
		render(SoftwareApplicationSchema);
		const schema = getJsonLd();

		expect(schema.browserRequirements).toBeDefined();
		expect(schema.storageRequirements).toBeDefined();
		expect(schema.memoryRequirements).toBeDefined();
		expect(schema.processorRequirements).toBeDefined();
	});
});
