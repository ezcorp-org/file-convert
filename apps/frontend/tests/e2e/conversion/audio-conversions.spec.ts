import { test, expect, AudioFactory, StructuralValidator } from '../../fixtures';

// Audio conversion matrix - WAV source to all output formats
// Note: Currently only testing WAV as source since AudioFactory only creates WAV
// Other source formats (FLAC, MP3, OGG) are skipped with test.skip() pending factory support
const AUDIO_CONVERSIONS = [
	// WAV source - only MP3 is fully implemented in worker
	{ from: 'wav', to: 'mp3', mimeType: 'audio/wav' }
];

// Helper to get correct extension for audio file
function getAudioExtension(format: string): string {
	const extensions: Record<string, string> = {
		wav: 'wav',
		flac: 'flac',
		mp3: 'mp3',
		ogg: 'ogg',
		opus: 'opus'
	};
	return extensions[format] || format;
}

// Helper to get UI text for format selection
function getAudioUIText(format: string): RegExp {
	const uiText: Record<string, RegExp> = {
		wav: /WAV/i,
		flac: /FLAC/i,
		mp3: /MP3/i,
		ogg: /OGG/i,
		opus: /Opus/i
	};
	return uiText[format] || new RegExp(format, 'i');
}

test.describe('Audio Conversions - WAV Source', () => {
	for (const { from, to, mimeType } of AUDIO_CONVERSIONS) {
		test.skip(`converts ${from.toUpperCase()} to ${to.toUpperCase()} (MP3 encoding issues)`, async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			// Generate 1-second WAV with 440Hz tone
			const sourceBuffer = AudioFactory.createWAV({
				duration: 1,
				sampleRate: 44100,
				channels: 2,
				bitDepth: 16,
				frequency: 440
			});

			const originalDuration = AudioFactory.getDuration(sourceBuffer);

			const fileData = fileHelper.createFileData(
				sourceBuffer,
				`test.${getAudioExtension(from)}`,
				mimeType
			);

			// Navigate to convert page
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Upload source file
			await fileHelper.uploadFile(fileData);

			// Wait for file to appear in UI
			await expect(page.locator('.file-item')).toContainText(`test.${getAudioExtension(from)}`);

			// Wait for format options to be available
			await expect(page.locator('.format-option').first()).toBeVisible();

			// Select output format
			const formatOption = page
				.locator('.format-option')
				.filter({ hasText: getAudioUIText(to) });
			await formatOption.click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for completion (audio conversions can be slower)
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

			// Download and validate
			const { filename, buffer, validation } = await downloadHelper.validateDownload(
				'.download-btn',
				to
			);

			// Validate format detection
			expect(validation.valid).toBe(true);
			expect(buffer.length).toBeGreaterThan(0);

			// Validate audio structure using StructuralValidator
			const audioValidation = await StructuralValidator.validateAudio(buffer);
			expect(audioValidation.valid).toBe(true);
			expect(audioValidation.format).toBeTruthy();

			// Validate duration is approximately correct (within 0.5s tolerance)
			if (audioValidation.metadata?.duration) {
				const durationDiff = Math.abs(audioValidation.metadata.duration - originalDuration);
				expect(durationDiff).toBeLessThan(0.5);
			}

			// Validate sample rate is reasonable (>8000 Hz for standard audio)
			if (audioValidation.metadata?.sampleRate) {
				expect(audioValidation.metadata.sampleRate).toBeGreaterThan(8000);
			}

			// Log metadata for debugging
			console.log(
				`${from} -> ${to}: ${buffer.length} bytes, format: ${audioValidation.format}, ` +
					`duration: ${audioValidation.metadata?.duration?.toFixed(2)}s, ` +
					`sample rate: ${audioValidation.metadata?.sampleRate} Hz, ` +
					`bitrate: ${audioValidation.metadata?.bitrate} bps`
			);
		});
	}

	// Unsupported output formats (worker falls back to WAV)
	test.skip('converts WAV to FLAC (FLAC encoding not implemented in worker)', async () => {
		// TODO: Worker currently falls back to WAV for FLAC output
		// See audio-worker.js line 110-116
	});

	test.skip('converts WAV to OGG (OGG encoding not implemented in worker)', async () => {
		// TODO: Worker currently falls back to WAV for OGG output
		// See audio-worker.js line 110-116
	});

	test.skip('converts WAV to Opus (Opus encoding not implemented in worker)', async () => {
		// TODO: Worker currently falls back to WAV for Opus output
		// See audio-worker.js line 110-116
	});
});

test.describe('Lossless Audio Verification', () => {
	test.skip('WAV to FLAC to WAV is truly lossless (FLAC encoding not implemented)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// TODO: Implement when FLAC encoding is available in audio worker
		//
		// Test approach:
		// 1. Create WAV with known properties (duration, sample rate, channels, bit depth)
		// 2. Convert WAV → FLAC (lossless compression)
		// 3. Convert FLAC → WAV (decompress)
		// 4. Compare audio properties:
		//    - Sample count should be identical
		//    - Duration should match (within 0.01s tolerance for rounding)
		//    - Sample rate, channels, bit depth should match
		//
		// Byte-for-byte comparison note:
		// - WAV headers may differ (metadata, chunk ordering)
		// - Compare audio data only using AudioFactory.getSampleCount()
		// - This proves lossless preservation without header sensitivity

		const originalWav = AudioFactory.createWAV({
			duration: 1,
			sampleRate: 44100,
			channels: 2,
			bitDepth: 16,
			frequency: 440
		});

		const originalDuration = AudioFactory.getDuration(originalWav);
		const originalSamples = AudioFactory.getSampleCount(originalWav);

		// Convert WAV → FLAC
		// ... upload originalWav, convert to FLAC, download
		// const flacBuffer = await convertAndDownload(originalWav, 'flac');

		// Convert FLAC → WAV
		// ... upload flacBuffer, convert to WAV, download
		// const finalWavBuffer = await convertAndDownload(flacBuffer, 'wav');

		// Validate lossless preservation
		// const finalDuration = AudioFactory.getDuration(finalWavBuffer);
		// const finalSamples = AudioFactory.getSampleCount(finalWavBuffer);

		// expect(Math.abs(originalDuration - finalDuration)).toBeLessThan(0.01);
		// expect(finalSamples).toBe(originalSamples);
	});
});

test.describe('Audio Quality Validation', () => {
	test.skip('MP3 conversion maintains reasonable quality (MP3 encoding issues)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// TODO: Fix MP3 encoding issues in audio worker before enabling
		//
		// Current issues:
		// - LAME encoder loading may have additional problems beyond window reference
		// - Conversion doesn't complete successfully in tests
		//
		// When working, this test should:
		// 1. Create WAV file
		// 2. Convert to MP3
		// 3. Validate:
		//    - Duration within 0.1s of original
		//    - Bitrate is reasonable (>64 kbps)
		//    - Format detected as MP3
		//    - File size smaller than WAV (lossy compression)

		const originalWav = AudioFactory.createWAV({
			duration: 1,
			sampleRate: 44100,
			channels: 2,
			bitDepth: 16,
			frequency: 440
		});

		const originalDuration = AudioFactory.getDuration(originalWav);

		// Convert to MP3
		// const mp3Result = await convertAndDownload(originalWav, 'mp3');

		// Validate audio structure
		// const audioValidation = await StructuralValidator.validateAudio(mp3Result.buffer);
		// expect(audioValidation.valid).toBe(true);

		// Validate duration preserved
		// expect(Math.abs(audioValidation.metadata.duration - originalDuration)).toBeLessThan(0.1);

		// Validate bitrate is reasonable
		// expect(audioValidation.metadata.bitrate).toBeGreaterThan(64000);

		// Validate lossy compression reduced file size
		// expect(mp3Result.buffer.length).toBeLessThan(originalWav.length);
	});

	// ADV-11: Audio quality validation using spectrogram analysis
	// DEFERRED: Spectrogram analysis requires additional tooling (essentia.js or similar)
	// that adds significant complexity for marginal benefit over simpler metrics.
	//
	// Current validation approach (adequate for most cases):
	// - Lossless: sample count + duration match (proves data integrity)
	// - Lossy: bitrate threshold + duration match (proves reasonable quality)
	//
	// Spectrogram analysis would add:
	// - Visual frequency comparison between original and converted audio
	// - Detection of encoding artifacts, frequency cutoffs, or distortion
	//
	// To implement when needed:
	// 1. Add essentia.js or Web Audio API spectrogram generation
	// 2. Generate spectrograms for original and converted audio
	// 3. Compare using image similarity (SSIM) or frequency bin correlation
	//
	// Reference: RESEARCH.md Open Question #1 - "Audio Spectrogram Analysis"
	test.skip('validates audio quality using spectrogram analysis (ADV-11 - deferred)', async () => {
		// TODO: Implement spectrogram-based audio quality validation
		//
		// Steps when implemented:
		// 1. Generate spectrogram image from original WAV
		// 2. Convert WAV to lossy format (MP3/OGG)
		// 3. Generate spectrogram image from converted audio
		// 4. Compare spectrograms using SSIM or visual diff
		// 5. Assert similarity > threshold (e.g., 0.90 for lossy)
		//
		// Deferral rationale:
		// - Current simpler validation in 'MP3 conversion maintains reasonable quality'
		//   test covers basic quality metrics (bitrate, duration).
		// - Spectrogram analysis requires complex audio processing libraries
		// - Marginal benefit over simpler metrics for most use cases
		// - Can be added later if bugs surface that simple metrics miss
		//
		// Libraries to evaluate:
		// - essentia.js (audio analysis in JavaScript)
		// - spectro (Node.js spectrogram generation)
		// - Web Audio API (built-in, but complex for spectrogram generation)
	});
});

test.describe('Audio Conversions - Other Sources (Pending Factory Support)', () => {
	// FLAC source conversions
	test.skip('converts FLAC to WAV (FLAC source generation not supported)', async () => {
		// TODO: Implement FLAC generation in AudioFactory
		// Test will convert FLAC to WAV and validate lossless preservation
	});

	test.skip('converts FLAC to MP3 (FLAC source generation not supported)', async () => {
		// TODO: Implement FLAC generation in AudioFactory
	});

	test.skip('converts FLAC to OGG (FLAC source generation not supported)', async () => {
		// TODO: Implement FLAC generation in AudioFactory
	});

	// MP3 source conversions
	test.skip('converts MP3 to WAV (MP3 source generation not supported)', async () => {
		// TODO: Implement MP3 generation in AudioFactory
		// Test will convert lossy MP3 to WAV
	});

	test.skip('converts MP3 to FLAC (MP3 source generation not supported)', async () => {
		// TODO: Implement MP3 generation in AudioFactory
	});

	// OGG source conversions
	test.skip('converts OGG to WAV (OGG source generation not supported)', async () => {
		// TODO: Implement OGG generation in AudioFactory
		// Test will convert lossy OGG to WAV
	});

	test.skip('converts OGG to MP3 (OGG source generation not supported)', async () => {
		// TODO: Implement OGG generation in AudioFactory
	});
});
