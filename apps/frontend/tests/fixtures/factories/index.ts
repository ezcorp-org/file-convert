/**
 * Fixture factories for synthetic file generation
 * 
 * Factories generate test files programmatically to avoid committing
 * binary files to git. Each test gets fresh, consistent files.
 */

export { ImageFactory } from './image-factory';
export type { ImageFixtureOptions } from './image-factory';

export { AudioFactory } from './audio-factory';
export type { AudioFixtureOptions } from './audio-factory';

export { DocumentFactory } from './document-factory';
export type { DocumentFixtureOptions } from './document-factory';

export { SpreadsheetFactory } from './spreadsheet-factory';
export type { SpreadsheetFixtureOptions } from './spreadsheet-factory';

export { ArchiveFactory } from './archive-factory';
export type { ArchiveFixtureOptions, ArchiveEntry } from './archive-factory';
