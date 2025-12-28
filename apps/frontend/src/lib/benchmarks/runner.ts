/**
 * Benchmark runner utility for performance regression detection
 *
 * This module provides infrastructure to:
 * 1. Run timed benchmarks for conversion operations
 * 2. Compare results against established baselines
 * 3. Detect regressions (>50% slower than baseline)
 *
 * Used by tests/benchmarks/conversion-benchmarks.spec.ts
 */

export interface BenchmarkResult {
	name: string;
	durationMs: number;
	iterations: number;
	avgMs: number;
	minMs: number;
	maxMs: number;
}

export interface BaselineEntry {
	baselineMs: number;
	threshold: number; // e.g., 0.5 for 50%
	fileSize: string;
	lastUpdated: string;
}

export interface Baselines {
	conversions: Record<string, BaselineEntry>;
	meta: {
		generatedAt: string;
		environment: string;
		notes?: string;
	};
}

export interface ComparisonResult {
	passed: boolean;
	message: string;
	ratio: number;
}

/**
 * Run a benchmark for a given async function
 *
 * @param name - Name of the benchmark for reporting
 * @param fn - Async function to benchmark
 * @param iterations - Number of iterations to run (default: 5)
 * @returns Benchmark results with timing statistics
 */
export async function runBenchmark(
	name: string,
	fn: () => Promise<void>,
	iterations: number = 5
): Promise<BenchmarkResult> {
	const times: number[] = [];

	// Warmup run (not counted)
	await fn();

	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		await fn();
		const end = performance.now();
		times.push(end - start);
	}

	const totalMs = times.reduce((a, b) => a + b, 0);

	return {
		name,
		durationMs: totalMs,
		iterations,
		avgMs: totalMs / iterations,
		minMs: Math.min(...times),
		maxMs: Math.max(...times)
	};
}

/**
 * Compare benchmark result against baseline
 *
 * @param result - Benchmark result to compare
 * @param baseline - Baseline entry to compare against
 * @returns Comparison result with pass/fail status and message
 */
export function compareToBaseline(result: BenchmarkResult, baseline: BaselineEntry): ComparisonResult {
	const allowedMax = baseline.baselineMs * (1 + baseline.threshold);
	const ratio = result.avgMs / baseline.baselineMs;
	const passed = result.avgMs <= allowedMax;

	const message = passed
		? `${result.name}: ${result.avgMs.toFixed(1)}ms (baseline: ${baseline.baselineMs}ms, ratio: ${ratio.toFixed(2)}x)`
		: `REGRESSION: ${result.name}: ${result.avgMs.toFixed(1)}ms exceeds ${allowedMax.toFixed(1)}ms (${(ratio * 100 - 100).toFixed(0)}% slower)`;

	return { passed, message, ratio };
}

/**
 * Load baselines from JSON string
 *
 * @param json - JSON string containing baselines
 * @returns Parsed baselines object
 */
export function loadBaselines(json: string): Baselines {
	return JSON.parse(json) as Baselines;
}

/**
 * Get baseline key from source and target format
 *
 * @param sourceFormat - Source file format (e.g., 'png')
 * @param targetFormat - Target file format (e.g., 'jpeg')
 * @returns Baseline key (e.g., 'png-to-jpeg')
 */
export function getBaselineKey(sourceFormat: string, targetFormat: string): string {
	return `${sourceFormat.toLowerCase()}-to-${targetFormat.toLowerCase()}`;
}

/**
 * Format benchmark result for logging
 *
 * @param result - Benchmark result to format
 * @returns Formatted string for console output
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
	return [
		`Benchmark: ${result.name}`,
		`  Iterations: ${result.iterations}`,
		`  Total: ${result.durationMs.toFixed(1)}ms`,
		`  Average: ${result.avgMs.toFixed(1)}ms`,
		`  Min: ${result.minMs.toFixed(1)}ms`,
		`  Max: ${result.maxMs.toFixed(1)}ms`
	].join('\n');
}
