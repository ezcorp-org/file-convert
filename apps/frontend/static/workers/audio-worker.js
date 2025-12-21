// Initialize Comlink with robust fallback
let Comlink;

// Wrap initialization in async IIFE
(async () => {
	try {
		// Try dynamic import first (may be blocked by extensions)
		Comlink = await import('/lib/comlink.mjs');
	} catch (error) {
		console.warn('Failed to import Comlink, trying fallback:', error);
		// If import fails, try fetching and evaluating the script
		try {
			const response = await fetch('/lib/comlink.mjs');
			const scriptText = await response.text();
			const moduleExports = {};
			eval(scriptText.replace(/export /g, 'moduleExports.'));
			Comlink = moduleExports;
		} catch (fallbackError) {
			console.error('Failed to load Comlink via fallback, using inline implementation:', fallbackError);
		}
	}
	
	// Continue with initialization after Comlink is loaded
	initializeWorker();
})();

// Function to initialize the worker after Comlink is loaded
function initializeWorker() {
	// Force use of our inline implementation to bypass Comlink issues
	// if (!Comlink || typeof Comlink.expose !== 'function') {
	if (true) { // Force fallback for debugging
	console.warn('AudioWorker: Using inline Comlink fallback implementation (forced for debugging)');
	Comlink = {
		expose: function(obj) {
			self.addEventListener('message', async function(e) {
				console.log('AudioWorker: Received message:', e.data);
				const { id, type, method, args } = e.data;
				
				if (type === 'CALL') {
					try {
						console.log(`AudioWorker: Calling method ${method} with args:`, args);
						if (typeof obj[method] === 'function') {
							const result = await obj[method](...args);
							console.log('AudioWorker: Method completed, sending RESULT:', result);
							self.postMessage({ id, type: 'RESULT', result });
						} else {
							const error = new Error(`Method ${method} not found`);
							console.error('AudioWorker: Method not found error:', error);
							throw error;
						}
					} catch (error) {
						console.error('AudioWorker: Error in message handler:', error);
						self.postMessage({ 
							id, 
							type: 'ERROR', 
							error: { 
								message: error.message, 
								stack: error.stack,
								name: error.name 
							}
						});
					}
				}
			});
		}
	};
}

class AudioConverter {
	constructor() {
		this.audioContext = null;
		this.lameEncoder = null;
		this.flacEncoder = null;
		this.vorbisEncoder = null;
		this.opusEncoder = null;
	}

	async loadLameEncoder() {
		if (!this.lameEncoder) {
			// lamejs is not an ES module, it assigns to global scope
			// We need to load it via script injection pattern
			if (typeof self.lamejs === 'undefined') {
				try {
					// Fetch the lamejs library
					const response = await fetch('https://unpkg.com/lamejs@1.2.1/lame.all.js');
					if (!response.ok) {
						throw new Error(`CDN fetch failed: ${response.status} ${response.statusText}`);
					}
					const code = await response.text();
					// Execute in global scope - lamejs assigns to self.lamejs
					eval(code);
					// Verify lamejs was actually loaded
					if (typeof self.lamejs === 'undefined') {
						throw new Error('lamejs library did not initialize properly after eval');
					}
					console.log('AudioWorker: lamejs loaded successfully');
				} catch (error) {
					console.error('AudioWorker: Failed to load lamejs:', error);
					throw new Error('Failed to load MP3 encoder library');
				}
			}
			this.lameEncoder = self.lamejs;
		}
		return this.lameEncoder;
	}

	async loadFLACEncoder() {
		if (!this.flacEncoder) {
			// libflac.js is also a global script
			if (typeof self.Flac === 'undefined') {
				try {
					// Fetch the libflac.js library
					const response = await fetch('https://cdn.jsdelivr.net/npm/libflacjs@5.4.0/dist/libflac.min.js');
					if (!response.ok) {
						throw new Error(`CDN fetch failed: ${response.status} ${response.statusText}`);
					}
					const code = await response.text();
					// Execute in global scope - libflac assigns to self.Flac
					eval(code);
					// Verify Flac was actually loaded
					if (typeof self.Flac === 'undefined') {
						throw new Error('libflac.js library did not initialize properly after eval');
					}
					console.log('AudioWorker: libflac.js loaded successfully');
				} catch (error) {
					console.error('AudioWorker: Failed to load libflac.js:', error);
					throw new Error('Failed to load FLAC encoder library');
				}
			}
			this.flacEncoder = self.Flac;
		}
		return this.flacEncoder;
	}

	async convert(job) {
		try {
			self.postMessage({ type: 'progress', id: job.id, progress: 10, message: 'Loading audio...' });

			const arrayBuffer = await job.file.arrayBuffer();

			self.postMessage({ type: 'progress', id: job.id, progress: 30, message: 'Decoding audio...' });

			// Parse audio data without AudioContext (not available in workers)
			const audioData = await this.parseAudioFile(arrayBuffer, job.file.name);

			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: `Converting to ${job.toFormat.toUpperCase()}...` });

			let outputBlob;
			let mimeType;

			switch (job.toFormat) {
				case 'wav':
					outputBlob = await this.encodeWAVFromData(audioData);
					mimeType = 'audio/wav';
					break;
				case 'mp3':
					outputBlob = await this.encodeMP3FromData(audioData, job.options, job.id);
					mimeType = 'audio/mpeg';
					break;
				case 'flac':
					outputBlob = await this.encodeFLACFromData(audioData, job.options, job.id);
					mimeType = 'audio/flac';
					break;
				case 'ogg':
					// OGG Vorbis encoding not implemented - browser-compatible encoders unavailable
					// Options investigated:
					// - vorbis-encoder-js: No longer maintained, incompatible with modern browsers
					// - libvorbis.js: Requires Emscripten build, no CDN-ready version
					// - MediaRecorder API: Only works with live audio streams, not pre-recorded data
					//
					// Technical blocker: OGG Vorbis encoding requires WASM-compiled libvorbis,
					// which would need to be self-hosted (110KB+ file) or built from source.
					//
					// Recommended approach for future: Bundle libvorbis WASM build in project
					console.warn('OGG Vorbis encoding not implemented - no browser-compatible encoder available');
					outputBlob = await this.encodeWAVFromData(audioData);
					mimeType = 'audio/wav';
					break;
				case 'opus':
					// Opus encoding not implemented - browser-compatible encoders unavailable
					// Options investigated:
					// - opus-encoder: Not designed for browser use, Node.js only
					// - libopus.js: Requires Emscripten build, no CDN-ready version
					// - MediaRecorder API: Only works with live audio streams, not pre-recorded data
					//
					// Technical blocker: Opus encoding requires WASM-compiled libopus,
					// which would need to be self-hosted (90KB+ file) or built from source.
					//
					// Recommended approach for future: Bundle libopus WASM build in project
					console.warn('Opus encoding not implemented - no browser-compatible encoder available');
					outputBlob = await this.encodeWAVFromData(audioData);
					mimeType = 'audio/wav';
					break;
				default:
					throw new Error(`Unsupported output format: ${job.toFormat}`);
			}

			self.postMessage({ type: 'progress', id: job.id, progress: 90, message: 'Finalizing...' });

			const originalName = job.file.name.substring(0, job.file.name.lastIndexOf('.'));
			const outputFilename = `${originalName}.${job.toFormat}`;

			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });

			return {
				id: job.id,
				outputFile: outputBlob,
				filename: outputFilename,
				mimeType: mimeType
			};
		} catch (error) {
			throw new Error(`Audio conversion failed: ${error.message}`);
		}
	}

	async parseAudioFile(arrayBuffer, filename) {
		const ext = filename.split('.').pop()?.toLowerCase();

		if (ext === 'wav') {
			return this.parseWAV(arrayBuffer);
		} else if (ext === 'mp3') {
			// For MP3, we need to decode it first - this is complex without AudioContext
			// For now, return an error suggesting to use WAV as source
			throw new Error('MP3 to other format conversion requires using WAV as source format first');
		} else {
			throw new Error(`Unsupported source format: ${ext}. Please use WAV files for conversion.`);
		}
	}

	parseWAV(arrayBuffer) {
		const view = new DataView(arrayBuffer);

		// Check for RIFF header
		const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
		if (riff !== 'RIFF') {
			throw new Error('Invalid WAV file: Missing RIFF header');
		}

		// Check for WAVE format
		const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
		if (wave !== 'WAVE') {
			throw new Error('Invalid WAV file: Missing WAVE format');
		}

		// Find fmt chunk
		let offset = 12;
		while (offset < view.byteLength) {
			const chunkId = String.fromCharCode(
				view.getUint8(offset), view.getUint8(offset + 1),
				view.getUint8(offset + 2), view.getUint8(offset + 3)
			);
			const chunkSize = view.getUint32(offset + 4, true);

			if (chunkId === 'fmt ') {
				const numChannels = view.getUint16(offset + 8 + 2, true);
				const sampleRate = view.getUint32(offset + 8 + 4, true);
				const bitsPerSample = view.getUint16(offset + 8 + 14, true);

				// Find data chunk
				let dataOffset = offset + 8 + chunkSize;
				while (dataOffset < view.byteLength) {
					const dataChunkId = String.fromCharCode(
						view.getUint8(dataOffset), view.getUint8(dataOffset + 1),
						view.getUint8(dataOffset + 2), view.getUint8(dataOffset + 3)
					);
					const dataChunkSize = view.getUint32(dataOffset + 4, true);

					if (dataChunkId === 'data') {
						const samples = new Int16Array(arrayBuffer, dataOffset + 8, dataChunkSize / 2);

						return {
							numberOfChannels: numChannels,
							sampleRate: sampleRate,
							length: samples.length / numChannels,
							bitsPerSample: bitsPerSample,
							samples: samples
						};
					}

					dataOffset += 8 + dataChunkSize;
				}

				throw new Error('Invalid WAV file: No data chunk found');
			}

			offset += 8 + chunkSize;
		}

		throw new Error('Invalid WAV file: No fmt chunk found');
	}

	async encodeWAVFromData(audioData) {
		const numberOfChannels = audioData.numberOfChannels;
		const sampleRate = audioData.sampleRate;
		const format = 1; // PCM
		const bitDepth = 16;

		// Calculate sizes
		const bytesPerSample = bitDepth / 8;
		const blockAlign = numberOfChannels * bytesPerSample;
		const byteRate = sampleRate * blockAlign;
		const dataSize = audioData.samples.length * bytesPerSample;
		const buffer = new ArrayBuffer(44 + dataSize);
		const view = new DataView(buffer);

		// Write WAV header
		const writeString = (offset, string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};

		writeString(0, 'RIFF');
		view.setUint32(4, 36 + dataSize, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true); // fmt chunk size
		view.setUint16(20, format, true);
		view.setUint16(22, numberOfChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, byteRate, true);
		view.setUint16(32, blockAlign, true);
		view.setUint16(34, bitDepth, true);
		writeString(36, 'data');
		view.setUint32(40, dataSize, true);

		// Copy sample data
		const samples = new Int16Array(buffer, 44, audioData.samples.length);
		samples.set(audioData.samples);

		return new Blob([buffer], { type: 'audio/wav' });
	}

	async encodeMP3FromData(audioData, options = {}, jobId) {
		try {
			// Load lamejs dynamically
			const lamejs = await this.loadLameEncoder();
			if (!lamejs) {
				throw new Error('LAME encoder not available');
			}

			const channels = audioData.numberOfChannels;
			const sampleRate = audioData.sampleRate;
			const bitrate = parseInt(options.bitrate) || 128;

			// Initialize LAME encoder
			const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);

			// Encode samples
			const mp3Data = [];
			const blockSize = 1152; // Must be multiple of 576 for encoder
			const samples = audioData.samples;

			// Split samples into left and right channels
			const leftChannel = new Int16Array(Math.ceil(samples.length / channels));
			const rightChannel = channels > 1 ? new Int16Array(Math.ceil(samples.length / channels)) : leftChannel;

			for (let i = 0, j = 0; i < samples.length; i += channels, j++) {
				leftChannel[j] = samples[i];
				if (channels > 1) {
					rightChannel[j] = samples[i + 1];
				}
			}

			for (let i = 0; i < leftChannel.length; i += blockSize) {
				const leftChunk = leftChannel.subarray(i, i + blockSize);
				const rightChunk = channels > 1 ? rightChannel.subarray(i, i + blockSize) : leftChunk;

				const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
				if (mp3buf.length > 0) {
					mp3Data.push(mp3buf);
				}

				// Update progress
				if (jobId) {
					const progress = 50 + Math.floor((i / leftChannel.length) * 40);
					self.postMessage({
						type: 'progress',
						id: jobId,
						progress,
						message: 'Encoding MP3...'
					});
				}
			}

			// Flush encoder
			const mp3buf = mp3encoder.flush();
			if (mp3buf.length > 0) {
				mp3Data.push(mp3buf);
			}

			// Create blob from MP3 data
			return new Blob(mp3Data, { type: 'audio/mpeg' });

		} catch (error) {
			console.error('MP3 encoding failed:', error);
			throw error;
		}
	}

	async encodeFLACFromData(audioData, options = {}, jobId) {
		try {
			// Load libflac.js dynamically
			const Flac = await this.loadFLACEncoder();
			if (!Flac) {
				throw new Error('FLAC encoder not available');
			}

			const channels = audioData.numberOfChannels;
			const sampleRate = audioData.sampleRate;
			const bitsPerSample = audioData.bitsPerSample || 16;
			const compressionLevel = parseInt(options.compressionLevel) || 5; // 0-8, 5 is default

			// Initialize FLAC encoder
			const flacEncoder = Flac.create_libflac_encoder(sampleRate, channels, bitsPerSample, compressionLevel, 0, false);

			if (flacEncoder === 0) {
				throw new Error('Failed to initialize FLAC encoder');
			}

			// Prepare output buffer
			const flacData = [];

			// Set up write callback to capture encoded data
			const status_encoder = Flac.init_encoder_stream(
				flacEncoder,
				function(buffer, bytes, samples, current_frame) {
					// Callback receives encoded FLAC frames
					const chunk = new Uint8Array(buffer);
					flacData.push(chunk.slice(0, bytes));
				},
				null, // metadata callback
				null  // client data
			);

			if (status_encoder !== 0) {
				throw new Error('Failed to initialize FLAC encoder stream');
			}

			// Convert interleaved Int16Array to planar Int32Array (FLAC expects 32-bit samples)
			const samples = audioData.samples;
			const samplesPerChannel = Math.floor(samples.length / channels);
			const planarSamples = [];

			for (let ch = 0; ch < channels; ch++) {
				const channelData = new Int32Array(samplesPerChannel);
				for (let i = 0; i < samplesPerChannel; i++) {
					// Extract channel samples and convert to 32-bit
					channelData[i] = samples[i * channels + ch];
				}
				planarSamples.push(channelData);
			}

			// Encode in chunks
			const blockSize = 4096;
			for (let i = 0; i < samplesPerChannel; i += blockSize) {
				const chunkSize = Math.min(blockSize, samplesPerChannel - i);
				const buffer = new Int32Array(chunkSize * channels);

				// Interleave samples for this chunk
				for (let ch = 0; ch < channels; ch++) {
					for (let j = 0; j < chunkSize; j++) {
						buffer[j * channels + ch] = planarSamples[ch][i + j];
					}
				}

				// Encode chunk
				const encodeResult = Flac.FLAC__stream_encoder_process_interleaved(flacEncoder, buffer, chunkSize);

				if (!encodeResult) {
					throw new Error('FLAC encoding failed during process');
				}

				// Update progress
				if (jobId) {
					const progress = 50 + Math.floor((i / samplesPerChannel) * 40);
					self.postMessage({
						type: 'progress',
						id: jobId,
						progress,
						message: 'Encoding FLAC...'
					});
				}
			}

			// Finalize encoding
			Flac.FLAC__stream_encoder_finish(flacEncoder);
			Flac.FLAC__stream_encoder_delete(flacEncoder);

			// Create blob from FLAC data
			return new Blob(flacData, { type: 'audio/flac' });

		} catch (error) {
			console.error('FLAC encoding failed:', error);
			throw error;
		}
	}

	async encodeWAV(audioBuffer) {
		const numberOfChannels = audioBuffer.numberOfChannels;
		const sampleRate = audioBuffer.sampleRate;
		const format = 1; // PCM
		const bitDepth = 16;
		
		// Calculate sizes
		const bytesPerSample = bitDepth / 8;
		const blockAlign = numberOfChannels * bytesPerSample;
		const byteRate = sampleRate * blockAlign;
		const dataSize = audioBuffer.length * blockAlign;
		const buffer = new ArrayBuffer(44 + dataSize);
		const view = new DataView(buffer);
		
		// Write WAV header
		const writeString = (offset, string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};
		
		writeString(0, 'RIFF');
		view.setUint32(4, 36 + dataSize, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true); // fmt chunk size
		view.setUint16(20, format, true);
		view.setUint16(22, numberOfChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, byteRate, true);
		view.setUint16(32, blockAlign, true);
		view.setUint16(34, bitDepth, true);
		writeString(36, 'data');
		view.setUint32(40, dataSize, true);
		
		// Convert float samples to PCM
		let offset = 44;
		for (let i = 0; i < audioBuffer.length; i++) {
			for (let channel = 0; channel < numberOfChannels; channel++) {
				const sample = audioBuffer.getChannelData(channel)[i];
				const clampedSample = Math.max(-1, Math.min(1, sample));
				const pcmSample = clampedSample < 0 ? 
					clampedSample * 0x8000 : clampedSample * 0x7FFF;
				view.setInt16(offset, pcmSample, true);
				offset += 2;
			}
		}
		
		return new Blob([buffer], { type: 'audio/wav' });
	}
	
	async encodeMP3(audioBuffer, options = {}, jobId) {
		try {
			// Load lamejs dynamically
			await this.loadLameEncoder();
			
			const lamejs = self.lamejs || window.lamejs;
			if (!lamejs) {
				throw new Error('LAME encoder not available');
			}
			
			const channels = audioBuffer.numberOfChannels;
			const sampleRate = audioBuffer.sampleRate;
			const bitrate = options.bitrate || 128; // Default 128 kbps
			const quality = options.quality || 5; // 0 = highest, 9 = lowest
			
			// Convert float samples to Int16
			const samples = [];
			for (let channel = 0; channel < channels; channel++) {
				const channelData = audioBuffer.getChannelData(channel);
				const int16Samples = new Int16Array(channelData.length);
				for (let i = 0; i < channelData.length; i++) {
					const s = Math.max(-1, Math.min(1, channelData[i]));
					int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
				}
				samples.push(int16Samples);
			}
			
			// Initialize LAME encoder
			const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
			
			// Encode samples
			const mp3Data = [];
			const blockSize = 1152; // Must be multiple of 576 for encoder
			
			for (let i = 0; i < samples[0].length; i += blockSize) {
				const leftChunk = samples[0].subarray(i, i + blockSize);
				const rightChunk = channels > 1 ? samples[1].subarray(i, i + blockSize) : leftChunk;
				
				const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
				if (mp3buf.length > 0) {
					mp3Data.push(mp3buf);
				}
				
				// Update progress
				const progress = 50 + Math.floor((i / samples[0].length) * 40);
				if (jobId) {
					self.postMessage({ 
						type: 'progress', 
						id: jobId, 
						progress, 
						message: 'Encoding MP3...' 
					});
				}
			}
			
			// Flush encoder
			const mp3buf = mp3encoder.flush();
			if (mp3buf.length > 0) {
				mp3Data.push(mp3buf);
			}
			
			// Create blob from MP3 data
			return new Blob(mp3Data, { type: 'audio/mpeg' });
			
		} catch (error) {
			console.error('MP3 encoding failed:', error);
			// Fallback to WAV
			console.warn('MP3 encoding failed, converting to WAV instead');
			return this.encodeWAV(audioBuffer);
		}
	}
	
	async encodeOGG(audioBuffer, options = {}) {
		// OGG Vorbis encoding would require a separate library like libvorbis.js
		// For now, we'll use the browser's MediaRecorder API if available
		try {
			if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/ogg')) {
				// Create a new audio context for encoding
				const offlineContext = new OfflineAudioContext(
					audioBuffer.numberOfChannels,
					audioBuffer.length,
					audioBuffer.sampleRate
				);
				
				// Create buffer source
				const source = offlineContext.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(offlineContext.destination);
				source.start();
				
				// Render audio
				const renderedBuffer = await offlineContext.startRendering();
				
				// Convert to OGG using MediaRecorder (browser-dependent)
				// This is a simplified approach - real OGG encoding would need libvorbis
				return this.encodeWAV(renderedBuffer);
			}
		} catch (error) {
			console.error('OGG encoding failed:', error);
		}
		
		// Fallback to WAV
		console.warn('OGG encoding not fully implemented, converting to WAV instead');
		return this.encodeWAV(audioBuffer);
	}
	
	async encodeFLAC(audioBuffer, options = {}) {
		// FLAC encoding would require libflac.js or similar
		// For now, we'll convert to WAV as it's lossless
		console.warn('FLAC encoding not fully implemented, converting to WAV instead');
		return this.encodeWAV(audioBuffer);
	}
	
	async encodeOpus(audioBuffer, options = {}) {
		// Opus encoding would require libopus.js
		// Check if browser supports Opus encoding via MediaRecorder
		try {
			if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/opus')) {
				// Similar approach to OGG encoding
				return this.encodeWAV(audioBuffer);
			}
		} catch (error) {
			console.error('Opus encoding failed:', error);
		}
		
		console.warn('Opus encoding not fully implemented, converting to WAV instead');
		return this.encodeWAV(audioBuffer);
	}
}

	// Set up message handling for progress updates
	self.addEventListener('message', (event) => {
		// Handle any direct messages if needed
	});

	// Expose the converter via Comlink
	Comlink.expose(new AudioConverter());
}