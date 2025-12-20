/**
 * Validation utilities for test fixtures
 */

export { MagicByteValidator, MAGIC_SIGNATURES } from './magic-bytes';
export type { ValidationResult } from './magic-bytes';

export { StructuralValidator } from './structural';
export type { StructuralValidationResult } from './structural';

export { MetadataValidator } from './metadata';
export type { ImageMetadata, AudioMetadata, MetadataValidationResult } from './metadata';

export { ContentValidator } from './content';
export type { ContentValidationResult } from './content';

export { SSIMValidator, compareImages } from './ssim';
export type { SSIMResult } from './ssim';
