import { WaveFile } from 'wavefile';

export interface AudioFixtureOptions {
	duration?: number; // seconds, default: 1
	sampleRate?: number; // Hz, default: 44100
	channels?: 1 | 2; // mono or stereo, default: 2
	bitDepth?: 8 | 16 | 24 | 32; // default: 16
	frequency?: number; // Hz for sine wave tone, default: 440 (A4 note)
	volume?: number; // 0-1, default: 0.5
}

export class AudioFactory {
	/**
	 * Create a WAV file with a sine wave tone
	 * @param options - Audio configuration options
	 * @returns Buffer containing valid WAV file
	 */
	static createWAV(options: AudioFixtureOptions = {}): Buffer {
		const duration = options.duration ?? 1;
		const sampleRate = options.sampleRate ?? 44100;
		const channels = options.channels ?? 2;
		const bitDepth = (options.bitDepth ?? 16).toString() as '8' | '16' | '24' | '32';
		const frequency = options.frequency ?? 440;
		const volume = options.volume ?? 0.5;

		const numSamples = Math.floor(duration * sampleRate);
		const samples = new Int16Array(numSamples * channels);

		// Generate sine wave samples
		for (let i = 0; i < numSamples; i++) {
			const t = i / sampleRate;
			const value = Math.sin(2 * Math.PI * frequency * t) * 32767 * volume;

			// Write to all channels
			for (let ch = 0; ch < channels; ch++) {
				samples[i * channels + ch] = value;
			}
		}

		const wav = new WaveFile();
		wav.fromScratch(channels, sampleRate, bitDepth, samples);
		return Buffer.from(wav.toBuffer());
	}

	/**
	 * Create a silent WAV file
	 * @param options - Audio configuration options (frequency and volume ignored)
	 * @returns Buffer containing valid silent WAV file
	 */
	static createSilentWAV(
		options: Omit<AudioFixtureOptions, 'frequency' | 'volume'> = {}
	): Buffer {
		const duration = options.duration ?? 1;
		const sampleRate = options.sampleRate ?? 44100;
		const channels = options.channels ?? 2;
		const bitDepth = (options.bitDepth ?? 16).toString() as '8' | '16' | '24' | '32';

		const numSamples = Math.floor(duration * sampleRate);
		const samples = new Int16Array(numSamples * channels);

		// All zeros = silence (no need to set, Int16Array initializes to 0)

		const wav = new WaveFile();
		wav.fromScratch(channels, sampleRate, bitDepth, samples);
		return Buffer.from(wav.toBuffer());
	}

	/**
	 * Create a set of edge case audio variations for comprehensive testing
	 * @returns Object with named audio file variations
	 */
	static createVariations(): Record<string, Buffer> {
		return {
			silent: AudioFactory.createSilentWAV({ duration: 1 }),
			mono: AudioFactory.createWAV({ channels: 1, duration: 1 }),
			stereo: AudioFactory.createWAV({ channels: 2, duration: 1 }),
			short: AudioFactory.createWAV({ duration: 0.1 }),
			long: AudioFactory.createWAV({ duration: 5 }),
			lowSampleRate: AudioFactory.createWAV({ sampleRate: 22050 }),
			highSampleRate: AudioFactory.createWAV({ sampleRate: 48000 }),
			lowFreq: AudioFactory.createWAV({ frequency: 100 }),
			highFreq: AudioFactory.createWAV({ frequency: 8000 })
		};
	}

	/**
	 * Get the number of samples in a WAV file
	 * @param buffer - WAV file buffer
	 * @returns Number of samples per channel
	 */
	static getSampleCount(buffer: Buffer): number {
		const wav = new WaveFile();
		wav.fromBuffer(new Uint8Array(buffer));

		// Get the data chunk samples - returns array of samples for all channels
		// For stereo: [L, R, L, R, L, R, ...]
		// For mono: [sample, sample, sample, ...]
		const samples = wav.getSamples();
		const channels = (wav.fmt as any).numChannels;

		// samples is a flat array, so total samples = length / channels
		return samples.length / channels;
	}

	/**
	 * Get the duration of a WAV file in seconds
	 * @param buffer - WAV file buffer
	 * @returns Duration in seconds
	 */
	static getDuration(buffer: Buffer): number {
		const wav = new WaveFile();
		wav.fromBuffer(new Uint8Array(buffer));

		// Calculate duration from data chunk size
		// The fmt chunk contains: sampleRate, numChannels, byteRate, blockAlign, bitsPerSample
		const sampleRate = (wav.fmt as any).sampleRate;
		const numChannels = (wav.fmt as any).numChannels;
		const bitsPerSample = (wav.fmt as any).bitsPerSample;
		const bytesPerSample = bitsPerSample / 8;

		// Get data chunk size (raw audio data)
		const dataSize = (wav.data as any).chunkSize;

		// Calculate total samples per channel
		const totalSamples = dataSize / (numChannels * bytesPerSample);

		// Duration = samples per channel / sample rate
		return totalSamples / sampleRate;
	}
}
