import { describe, it, expect } from 'vitest';
import { AudioFactory } from './audio-factory';
import { FileHelper } from '../file-helpers';

describe('AudioFactory', () => {
	describe('WAV generation', () => {
		it('should generate valid WAV file with correct magic bytes', () => {
			const wav = AudioFactory.createWAV();

			// Verify non-empty buffer
			expect(wav.length).toBeGreaterThan(0);

			// Check RIFF signature (bytes 0-3: 'RIFF')
			expect(wav.slice(0, 4).toString('ascii')).toBe('RIFF');

			// Check WAVE signature (bytes 8-11: 'WAVE')
			expect(wav.slice(8, 12).toString('ascii')).toBe('WAVE');
		});

		it('should generate buffer with reasonable size', () => {
			const wav = AudioFactory.createWAV({ duration: 1, sampleRate: 44100, channels: 2 });

			// Expected size calculation:
			// 44100 samples/sec * 1 sec * 2 channels * 2 bytes/sample = 176,400 bytes
			// Plus WAV header (~44 bytes) = ~176,444 bytes
			expect(wav.length).toBeGreaterThan(176000);
			expect(wav.length).toBeLessThan(177000);
		});
	});

	describe('Duration control', () => {
		it('should create WAV with 2-second duration', () => {
			const wav = AudioFactory.createWAV({ duration: 2 });
			const duration = AudioFactory.getDuration(wav);

			// Allow small floating-point tolerance
			expect(duration).toBeCloseTo(2, 1); // Within 0.1 second
		});

		it('should create WAV with 0.5-second duration', () => {
			const wav = AudioFactory.createWAV({ duration: 0.5 });
			const duration = AudioFactory.getDuration(wav);

			expect(duration).toBeCloseTo(0.5, 1); // Within 0.1 second
		});

		it('should create very short WAV (100ms)', () => {
			const wav = AudioFactory.createWAV({ duration: 0.1 });
			const duration = AudioFactory.getDuration(wav);

			expect(duration).toBeCloseTo(0.1, 1);
		});
	});

	describe('Channel configuration', () => {
		it('should create mono (1 channel) WAV', () => {
			const wav = AudioFactory.createWAV({ channels: 1 });

			// Verify it's valid WAV
			expect(wav.slice(0, 4).toString('ascii')).toBe('RIFF');
			expect(wav.slice(8, 12).toString('ascii')).toBe('WAVE');

			// Verify non-empty
			expect(wav.length).toBeGreaterThan(0);
		});

		it('should create stereo (2 channel) WAV', () => {
			const wav = AudioFactory.createWAV({ channels: 2 });

			// Verify it's valid WAV
			expect(wav.slice(0, 4).toString('ascii')).toBe('RIFF');
			expect(wav.slice(8, 12).toString('ascii')).toBe('WAVE');

			// Verify non-empty
			expect(wav.length).toBeGreaterThan(0);
		});

		it('should generate different sizes for mono vs stereo', () => {
			const mono = AudioFactory.createWAV({ channels: 1, duration: 1 });
			const stereo = AudioFactory.createWAV({ channels: 2, duration: 1 });

			// Stereo should be roughly 2x the size (2 channels)
			// Allow for header differences
			expect(stereo.length).toBeGreaterThan(mono.length * 1.8);
		});
	});

	describe('Sample rate configuration', () => {
		it('should create WAV with 44100 Hz sample rate', () => {
			const wav = AudioFactory.createWAV({ sampleRate: 44100, duration: 1 });

			expect(wav.slice(0, 4).toString('ascii')).toBe('RIFF');
			expect(wav.slice(8, 12).toString('ascii')).toBe('WAVE');
		});

		it('should create WAV with 48000 Hz sample rate', () => {
			const wav = AudioFactory.createWAV({ sampleRate: 48000, duration: 1 });

			expect(wav.slice(0, 4).toString('ascii')).toBe('RIFF');
			expect(wav.slice(8, 12).toString('ascii')).toBe('WAVE');
		});

		it('should create WAV with 22050 Hz sample rate', () => {
			const wav = AudioFactory.createWAV({ sampleRate: 22050, duration: 1 });

			expect(wav.slice(0, 4).toString('ascii')).toBe('RIFF');
			expect(wav.slice(8, 12).toString('ascii')).toBe('WAVE');
		});

		it('should generate different sizes for different sample rates', () => {
			const low = AudioFactory.createWAV({ sampleRate: 22050, duration: 1, channels: 1 });
			const high = AudioFactory.createWAV({ sampleRate: 48000, duration: 1, channels: 1 });

			// Higher sample rate = more samples = larger file
			expect(high.length).toBeGreaterThan(low.length);
		});
	});

	describe('Variations', () => {
		it('should create all 9 variations', () => {
			const variations = AudioFactory.createVariations();

			const expectedKeys = [
				'silent',
				'mono',
				'stereo',
				'short',
				'long',
				'lowSampleRate',
				'highSampleRate',
				'lowFreq',
				'highFreq'
			];

			expect(Object.keys(variations).sort()).toEqual(expectedKeys.sort());
		});

		it('should generate valid WAV for each variation', () => {
			const variations = AudioFactory.createVariations();

			for (const [name, buffer] of Object.entries(variations)) {
				// Check RIFF signature
				expect(buffer.slice(0, 4).toString('ascii')).toBe('RIFF');

				// Check WAVE signature
				expect(buffer.slice(8, 12).toString('ascii')).toBe('WAVE');

				// Verify non-empty
				expect(buffer.length).toBeGreaterThan(0);
			}
		});

		it('should create variations with expected characteristics', () => {
			const variations = AudioFactory.createVariations();

			// Short should be smaller than long
			expect(variations.short.length).toBeLessThan(variations.long.length);

			// Low sample rate should be smaller than high sample rate (same duration)
			expect(variations.lowSampleRate.length).toBeLessThan(variations.highSampleRate.length);

			// Mono should be smaller than stereo
			expect(variations.mono.length).toBeLessThan(variations.stereo.length);
		});
	});

	describe('Silent audio', () => {
		it('should create valid silent WAV', () => {
			const silent = AudioFactory.createSilentWAV({ duration: 1 });

			// Valid WAV signatures
			expect(silent.slice(0, 4).toString('ascii')).toBe('RIFF');
			expect(silent.slice(8, 12).toString('ascii')).toBe('WAVE');

			// Non-empty
			expect(silent.length).toBeGreaterThan(0);
		});

		it('should have correct duration', () => {
			const silent = AudioFactory.createSilentWAV({ duration: 2 });
			const duration = AudioFactory.getDuration(silent);

			expect(duration).toBeCloseTo(2, 1);
		});
	});

	describe('Helper methods', () => {
		it('should calculate correct sample count', () => {
			// 1 second at 44100 Hz = 44100 samples
			const wav = AudioFactory.createWAV({ duration: 1, sampleRate: 44100, channels: 1 });
			const sampleCount = AudioFactory.getSampleCount(wav);

			expect(sampleCount).toBe(44100);
		});

		it('should calculate sample count for different durations', () => {
			const wav1 = AudioFactory.createWAV({ duration: 1, sampleRate: 44100, channels: 1 });
			const wav2 = AudioFactory.createWAV({ duration: 2, sampleRate: 44100, channels: 1 });

			const count1 = AudioFactory.getSampleCount(wav1);
			const count2 = AudioFactory.getSampleCount(wav2);

			expect(count2).toBeCloseTo(count1 * 2, -2); // Within 100 samples
		});

		it('should calculate duration from buffer', () => {
			const originalDuration = 3;
			const wav = AudioFactory.createWAV({ duration: originalDuration });
			const calculatedDuration = AudioFactory.getDuration(wav);

			expect(calculatedDuration).toBeCloseTo(originalDuration, 1);
		});
	});

	describe('Integration with FileHelper', () => {
		it('should create FileData with correct mimeType', () => {
			const wav = AudioFactory.createWAV({ duration: 1 });

			// Create mock page for FileHelper (not needed for createFileData)
			const fileHelper = new FileHelper(null as any);
			const fileData = fileHelper.createFileData(wav, 'test.wav', 'audio/wav');

			expect(fileData.name).toBe('test.wav');
			expect(fileData.mimeType).toBe('audio/wav');
			expect(fileData.buffer).toEqual(wav);
		});

		it(
			'should work with FileHelper.createFileData for different formats',
			() => {
			const variations = AudioFactory.createVariations();
			const fileHelper = new FileHelper(null as any);

			// Verify each variation can be wrapped in FileData
			for (const [name, buffer] of Object.entries(variations)) {
				const fileData = fileHelper.createFileData(buffer, `${name}.wav`, 'audio/wav');

				expect(fileData.mimeType).toBe('audio/wav');
				expect(fileData.buffer).toEqual(buffer);
			}
		},
		10000
	); // 10 second timeout for generating all variations
	});
});
