import type { TestInfo } from '@playwright/test';

export type ComplexityLevel = 'simple' | 'medium' | 'complex';

export type TimeoutConfig = {
	base: number;
	perMB: number;
	multipliers: Record<ComplexityLevel, number>;
};

/**
 * Default timeout configuration
 */
const DEFAULT_CONFIG: TimeoutConfig = {
	base: 30000, // 30 seconds base
	perMB: 2000, // 2 seconds per MB
	multipliers: {
		simple: 1, // No multiplier for simple conversions
		medium: 2, // 2x for medium complexity (e.g., image format changes)
		complex: 4 // 4x for complex operations (e.g., PDF generation, compression)
	}
};

/**
 * Calculate appropriate timeout based on file size and complexity
 *
 * Formula: base + (fileSizeMB * perMB * complexityMultiplier)
 *
 * @param fileSizeMB - File size in megabytes
 * @param complexity - Complexity level of the operation
 * @param config - Optional custom timeout configuration
 * @returns Timeout in milliseconds
 *
 * @example
 * // Simple text file conversion (1MB)
 * calculateTimeout(1, 'simple') // 32000ms (30s + 2s)
 *
 * @example
 * // Complex PDF generation (5MB)
 * calculateTimeout(5, 'complex') // 70000ms (30s + 40s)
 */
export function calculateTimeout(
	fileSizeMB: number,
	complexity: ComplexityLevel,
	config: TimeoutConfig = DEFAULT_CONFIG
): number {
	const multiplier = config.multipliers[complexity];
	const fileTimeout = fileSizeMB * config.perMB * multiplier;
	const total = config.base + fileTimeout;

	return Math.ceil(total);
}

/**
 * Apply calculated timeout to a test
 *
 * @param testInfo - Playwright TestInfo object
 * @param fileSizeMB - File size in megabytes
 * @param complexity - Complexity level of the operation
 * @param config - Optional custom timeout configuration
 *
 * @example
 * test('convert large image', async ({ page }, testInfo) => {
 *   applyTimeout(testInfo, 10, 'medium'); // Sets 50s timeout
 *   // ... test code
 * });
 */
export function applyTimeout(
	testInfo: TestInfo,
	fileSizeMB: number,
	complexity: ComplexityLevel,
	config: TimeoutConfig = DEFAULT_CONFIG
): void {
	const timeout = calculateTimeout(fileSizeMB, complexity, config);
	testInfo.setTimeout(timeout);
}

/**
 * Convert bytes to megabytes
 * @param bytes - File size in bytes
 * @returns Size in megabytes
 */
export function bytesToMB(bytes: number): number {
	return bytes / (1024 * 1024);
}

/**
 * Get complexity level based on conversion type
 *
 * @param fromFormat - Source format
 * @param toFormat - Target format
 * @returns Recommended complexity level
 *
 * @example
 * getComplexityForConversion('png', 'jpeg') // 'simple'
 * getComplexityForConversion('docx', 'pdf') // 'complex'
 */
export function getComplexityForConversion(fromFormat: string, toFormat: string): ComplexityLevel {
	// Complex conversions
	const complexConversions = [
		['pdf'], // PDF operations are always complex
		['docx', 'xlsx'], // Office formats
		['zip', '7z', 'tar'], // Archive operations
		['wav', 'mp3', 'flac'] // Audio transcoding
	];

	// Medium complexity
	const mediumConversions = [
		['png', 'jpeg', 'webp', 'gif'], // Image conversions
		['csv', 'json', 'xml', 'yaml'] // Structured data conversions
	];

	const from = fromFormat.toLowerCase();
	const to = toFormat.toLowerCase();

	// Check if either format is in complex list
	for (const group of complexConversions) {
		if (group.includes(from) || group.includes(to)) {
			return 'complex';
		}
	}

	// Check if both formats are in same medium group
	for (const group of mediumConversions) {
		if (group.includes(from) && group.includes(to)) {
			return 'medium';
		}
	}

	// Different format groups (e.g., text to image) are complex
	const fromGroup = mediumConversions.findIndex((g) => g.includes(from));
	const toGroup = mediumConversions.findIndex((g) => g.includes(to));

	if (fromGroup !== -1 && toGroup !== -1 && fromGroup !== toGroup) {
		return 'complex';
	}

	// Default to simple for text operations
	return 'simple';
}

/**
 * Create a custom timeout configuration
 * @param overrides - Partial configuration to override defaults
 * @returns Complete timeout configuration
 */
export function createTimeoutConfig(overrides: Partial<TimeoutConfig> = {}): TimeoutConfig {
	return {
		base: overrides.base ?? DEFAULT_CONFIG.base,
		perMB: overrides.perMB ?? DEFAULT_CONFIG.perMB,
		multipliers: {
			...DEFAULT_CONFIG.multipliers,
			...overrides.multipliers
		}
	};
}
