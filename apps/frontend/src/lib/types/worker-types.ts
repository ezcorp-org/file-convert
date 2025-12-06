// Common types for all workers

export interface ConversionJob {
	id: string;
	file: File;
	fromFormat: string;
	toFormat: string;
	options?: {
		quality?: number;
		compressionLevel?: number;
		[key: string]: any;
	};
}

export interface ConversionResult {
	id: string;
	outputFile: Blob;
	filename: string;
	mimeType: string;
}

export interface ProgressMessage {
	type: 'progress';
	id: string;
	progress: number;
	message: string;
}

export interface WorkerApi {
	convert: (job: ConversionJob) => Promise<ConversionResult>;
}