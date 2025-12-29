/**
 * Vitest setup file - provides polyfills for jsdom environment
 */

// Polyfill File.text() for jsdom environment
if (typeof File !== 'undefined' && !File.prototype.text) {
	File.prototype.text = function(): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsText(this);
		});
	};
}

// Polyfill File.arrayBuffer() for jsdom environment
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
	File.prototype.arrayBuffer = function(): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as ArrayBuffer);
			reader.onerror = () => reject(reader.error);
			reader.readAsArrayBuffer(this);
		});
	};
}

// Polyfill Blob.text() for jsdom environment
if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
	Blob.prototype.text = function(): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsText(this);
		});
	};
}
