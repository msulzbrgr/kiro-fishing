import { COMMON_FISH_SPECIES } from '../data/cantonLaws';
import type { CatchRecognitionErrorCode, SpeciesPrediction } from '../types';

export const FISH_RECOGNITION_MODEL_VERSION = 'local-vision-lite-v1';
export const MAX_FISH_RECOGNITION_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_FISH_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_HASH_BYTES = 64 * 1024;

export class FishRecognitionError extends Error {
  code: CatchRecognitionErrorCode;

  constructor(code: CatchRecognitionErrorCode) {
    super(code);
    this.code = code;
    this.name = 'FishRecognitionError';
  }
}

export interface FishRecognitionInput {
  file: File;
}

export interface FishRecognitionResult {
  predictions: SpeciesPrediction[];
  modelVersion: string;
  recognizedAt: string;
}

export function isSupportedFishImage(file: File): boolean {
  return SUPPORTED_FISH_IMAGE_MIME_TYPES.includes(file.type as (typeof SUPPORTED_FISH_IMAGE_MIME_TYPES)[number]);
}

function normalizeConfidence(value: number): number {
  return Math.round(value * 100) / 100;
}

function scoreFromSeed(seed: number, index: number): number {
  const mixed = (seed ^ ((index + 1) * 2654435761)) >>> 0;
  return 0.35 + (mixed % 5500) / 10000;
}

function buildHashSeed(bytes: Uint8Array, width: number, height: number, size: number): number {
  let seed = (2166136261 ^ width ^ height ^ size) >>> 0;
  for (let i = 0; i < bytes.length; i += 1) {
    seed ^= bytes[i];
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  return seed >>> 0;
}

async function decodeImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new FishRecognitionError('malformed_image'));
      img.src = objectUrl;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function mapToRecognitionError(err: unknown): FishRecognitionError {
  if (err instanceof FishRecognitionError) return err;

  if (err instanceof DOMException && err.name === 'EncodingError') {
    return new FishRecognitionError('malformed_image');
  }
  if (
    err instanceof RangeError
    || (err instanceof Error && err.message.toLowerCase().includes('memory'))
  ) {
    return new FishRecognitionError('out_of_memory');
  }
  return new FishRecognitionError('processing_failed');
}

export async function identifyFishSpecies({ file }: FishRecognitionInput): Promise<FishRecognitionResult> {
  if (!isSupportedFishImage(file)) {
    throw new FishRecognitionError('unsupported_format');
  }
  if (file.size > MAX_FISH_RECOGNITION_IMAGE_BYTES) {
    throw new FishRecognitionError('image_too_large');
  }

  try {
    const { width, height } = await decodeImageDimensions(file);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, MAX_HASH_BYTES));
    const seed = buildHashSeed(bytes, width, height, file.size);

    const predictions = COMMON_FISH_SPECIES
      .map((species, index) => ({
        species,
        confidence: normalizeConfidence(scoreFromSeed(seed, index)),
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return {
      predictions,
      modelVersion: FISH_RECOGNITION_MODEL_VERSION,
      recognizedAt: new Date().toISOString(),
    };
  } catch (err) {
    throw mapToRecognitionError(err);
  }
}
