export interface ConversionFormat {
	id: string;
	name: string;
	extensions: string[];
	mimeTypes: string[];
	category: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'text' | 'spreadsheet';
}

export interface ConversionPath {
	from: string;
	to: string;
	converter: string;
	options?: Record<string, any>;
}

export const formats: ConversionFormat[] = [
	// Images
	{ id: 'png', name: 'PNG', extensions: ['png'], mimeTypes: ['image/png'], category: 'image' },
	{ id: 'jpeg', name: 'JPEG', extensions: ['jpg', 'jpeg'], mimeTypes: ['image/jpeg'], category: 'image' },
	{ id: 'webp', name: 'WebP', extensions: ['webp'], mimeTypes: ['image/webp'], category: 'image' },
	{ id: 'tiff', name: 'TIFF', extensions: ['tif', 'tiff'], mimeTypes: ['image/tiff'], category: 'image' },
	{ id: 'bmp', name: 'BMP', extensions: ['bmp'], mimeTypes: ['image/bmp'], category: 'image' },
	{ id: 'gif', name: 'GIF', extensions: ['gif'], mimeTypes: ['image/gif'], category: 'image' },
	{ id: 'ico', name: 'ICO', extensions: ['ico'], mimeTypes: ['image/x-icon'], category: 'image' },
	{ id: 'pnm', name: 'PNM', extensions: ['pnm', 'pbm', 'pgm', 'ppm'], mimeTypes: ['image/x-portable-anymap'], category: 'image' },
	
	// Audio
	{ id: 'wav', name: 'WAV', extensions: ['wav'], mimeTypes: ['audio/wav'], category: 'audio' },
	{ id: 'flac', name: 'FLAC', extensions: ['flac'], mimeTypes: ['audio/flac'], category: 'audio' },
	{ id: 'mp3', name: 'MP3', extensions: ['mp3'], mimeTypes: ['audio/mpeg'], category: 'audio' },
	{ id: 'ogg', name: 'Ogg Vorbis', extensions: ['ogg', 'oga'], mimeTypes: ['audio/ogg'], category: 'audio' },
	{ id: 'opus', name: 'Opus', extensions: ['opus'], mimeTypes: ['audio/opus'], category: 'audio' },
	
	// Archives
	{ id: 'zip', name: 'ZIP', extensions: ['zip'], mimeTypes: ['application/zip'], category: 'archive' },
	{ id: '7z', name: '7Z', extensions: ['7z'], mimeTypes: ['application/x-7z-compressed'], category: 'archive' },
	{ id: 'tar', name: 'TAR', extensions: ['tar'], mimeTypes: ['application/x-tar'], category: 'archive' },
	{ id: 'tgz', name: 'TGZ', extensions: ['tar.gz', 'tgz'], mimeTypes: ['application/gzip'], category: 'archive' },
	{ id: 'tbz2', name: 'TBZ2', extensions: ['tar.bz2', 'tbz2'], mimeTypes: ['application/x-bzip2'], category: 'archive' },
	{ id: 'txz', name: 'TXZ', extensions: ['tar.xz', 'txz'], mimeTypes: ['application/x-xz'], category: 'archive' },
	
	// Documents
	{ id: 'pdf', name: 'PDF', extensions: ['pdf'], mimeTypes: ['application/pdf'], category: 'document' },
	{ id: 'docx', name: 'DOCX', extensions: ['docx'], mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], category: 'document' },
	{ id: 'html', name: 'HTML', extensions: ['html', 'htm'], mimeTypes: ['text/html'], category: 'text' },
	{ id: 'txt', name: 'Text', extensions: ['txt'], mimeTypes: ['text/plain'], category: 'text' },
	{ id: 'md', name: 'Markdown', extensions: ['md', 'markdown'], mimeTypes: ['text/markdown'], category: 'text' },
	
	// Spreadsheets
	{ id: 'xlsx', name: 'Excel', extensions: ['xlsx'], mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], category: 'spreadsheet' },
	{ id: 'csv', name: 'CSV', extensions: ['csv'], mimeTypes: ['text/csv'], category: 'spreadsheet' },
	{ id: 'tsv', name: 'TSV', extensions: ['tsv'], mimeTypes: ['text/tab-separated-values'], category: 'spreadsheet' },
	{ id: 'json', name: 'JSON', extensions: ['json'], mimeTypes: ['application/json'], category: 'text' },
	{ id: 'yaml', name: 'YAML', extensions: ['yaml', 'yml'], mimeTypes: ['text/yaml'], category: 'text' },
	{ id: 'xml', name: 'XML', extensions: ['xml'], mimeTypes: ['text/xml'], category: 'text' },
];

export const conversionPaths: ConversionPath[] = [
	// Image conversions
	{ from: 'png', to: 'jpeg', converter: 'image' },
	{ from: 'png', to: 'webp', converter: 'image' },
	{ from: 'png', to: 'tiff', converter: 'image' },
	{ from: 'jpeg', to: 'png', converter: 'image' },
	{ from: 'jpeg', to: 'webp', converter: 'image' },
	{ from: 'webp', to: 'png', converter: 'image' },
	{ from: 'webp', to: 'jpeg', converter: 'image' },
	{ from: 'bmp', to: 'png', converter: 'image' },
	{ from: 'bmp', to: 'jpeg', converter: 'image' },
	{ from: 'gif', to: 'png', converter: 'image' },
	{ from: 'gif', to: 'jpeg', converter: 'image' },
	{ from: 'gif', to: 'webp', converter: 'image' },
	{ from: 'ico', to: 'png', converter: 'image' },
	{ from: 'pnm', to: 'png', converter: 'image' },
	{ from: 'pnm', to: 'jpeg', converter: 'image' },
	{ from: 'png', to: 'pnm', converter: 'image' },
	{ from: 'jpeg', to: 'pnm', converter: 'image' },
	
	// Audio conversions
	{ from: 'wav', to: 'flac', converter: 'audio' },
	{ from: 'wav', to: 'mp3', converter: 'audio' },
	{ from: 'wav', to: 'ogg', converter: 'audio' },
	{ from: 'wav', to: 'opus', converter: 'audio' },
	{ from: 'flac', to: 'wav', converter: 'audio' },
	{ from: 'mp3', to: 'wav', converter: 'audio' },
	{ from: 'ogg', to: 'wav', converter: 'audio' },
	{ from: 'opus', to: 'wav', converter: 'audio' },
	
	// Archive conversions
	{ from: 'zip', to: 'tar', converter: 'archive' },
	{ from: 'zip', to: 'tgz', converter: 'archive' },
	{ from: 'zip', to: '7z', converter: 'archive' },
	{ from: 'tar', to: 'zip', converter: 'archive' },
	{ from: 'tar', to: 'tgz', converter: 'archive' },
	{ from: 'tgz', to: 'zip', converter: 'archive' },
	{ from: '7z', to: 'zip', converter: 'archive' },
	
	// Document conversions
	{ from: 'docx', to: 'html', converter: 'document' },
	{ from: 'docx', to: 'txt', converter: 'document' },
	{ from: 'pdf', to: 'png', converter: 'pdf' },
	{ from: 'pdf', to: 'jpeg', converter: 'pdf' },
	{ from: 'pdf', to: 'txt', converter: 'pdf' },
	
	// Spreadsheet conversions
	{ from: 'xlsx', to: 'csv', converter: 'spreadsheet' },
	{ from: 'xlsx', to: 'json', converter: 'spreadsheet' },
	{ from: 'csv', to: 'xlsx', converter: 'spreadsheet' },
	{ from: 'csv', to: 'json', converter: 'spreadsheet' },
	{ from: 'csv', to: 'tsv', converter: 'spreadsheet' },
	{ from: 'tsv', to: 'csv', converter: 'spreadsheet' },
	
	// Text conversions
	{ from: 'txt', to: 'md', converter: 'text' },
	{ from: 'txt', to: 'html', converter: 'text' },
	{ from: 'md', to: 'txt', converter: 'text' },
	{ from: 'md', to: 'html', converter: 'text' },
	{ from: 'md', to: 'pdf', converter: 'text' },
	{ from: 'html', to: 'md', converter: 'text' },
	{ from: 'html', to: 'txt', converter: 'text' },
	{ from: 'html', to: 'pdf', converter: 'text' },
	{ from: 'yaml', to: 'json', converter: 'text' },
	{ from: 'json', to: 'yaml', converter: 'text' },
	{ from: 'xml', to: 'json', converter: 'text' },
	{ from: 'json', to: 'xml', converter: 'text' },
];

export function getFormat(idOrExtension: string): (ConversionFormat & { icon: string }) | undefined {
	const lower = idOrExtension.toLowerCase();
	const format = formats.find(f => 
		f.id === lower || 
		f.extensions.includes(lower)
	);
	
	if (format) {
		const icons: Record<string, string> = {
			'image': '🖼️',
			'audio': '🎵',
			'video': '📹',
			'document': '📄',
			'archive': '📦',
			'text': '📝',
			'spreadsheet': '📊'
		};
		return {
			...format,
			icon: icons[format.category] || '📎'
		};
	}
	
	return undefined;
}

export function getAvailableConversions(fromFormats: string | string[]): ConversionFormat[] {
	const inputFormats = Array.isArray(fromFormats) ? fromFormats : [fromFormats];
	console.log('[getAvailableConversions] Called with:', fromFormats);
	console.log('[getAvailableConversions] Input formats array:', inputFormats);
	
	// Filter out empty strings
	const validFormats = inputFormats.filter(f => f && f.length > 0);
	console.log('[getAvailableConversions] Valid formats:', validFormats);
	
	if (validFormats.length === 0) {
		console.log('[getAvailableConversions] No valid formats, returning empty array');
		return [];
	}
	
	// Get all unique target formats from all input formats
	const targetFormatIds = new Set<string>();
	
	for (const fromFormat of validFormats) {
		const paths = conversionPaths
			.filter(p => p.from === fromFormat)
			.map(p => p.to);
		console.log(`[getAvailableConversions] Paths for '${fromFormat}':`, paths);
		paths.forEach(id => targetFormatIds.add(id));
	}
	
	// Convert IDs to format objects with icons
	console.log('[getAvailableConversions] Target format IDs:', Array.from(targetFormatIds));
	const result = Array.from(targetFormatIds)
		.map(id => {
			const format = formats.find(f => f.id === id);
			console.log(`[getAvailableConversions] Looking for format ${id}:`, format);
			if (format) {
				// Add icon based on category
				const icons: Record<string, string> = {
					'image': '🖼️',
					'audio': '🎵',
					'video': '📹',
					'document': '📄',
					'archive': '📦',
					'text': '📝',
					'spreadsheet': '📊'
				};
				return {
					...format,
					icon: icons[format.category] || '📎'
				};
			}
			return null;
		})
		.filter(Boolean) as (ConversionFormat & { icon: string })[];
	
	console.log('[getAvailableConversions] Final result:', result);
	return result;
}

export function getConversionPath(from: string, to: string): ConversionPath | undefined {
	return conversionPaths.find(p => p.from === from && p.to === to);
}