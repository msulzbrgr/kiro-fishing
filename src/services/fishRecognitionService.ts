import { COMMON_FISH_SPECIES } from '../data/cantonLaws';
import {
  FISH_RECOGNITION_MODEL_PROFILE_LOCK,
  getLockedFishRecognitionModelMetadata,
  hasValidFishRecognitionModelProfileLock,
  isFishRecognitionProfilePassed,
  type FishRecognitionModelMetadata,
} from '../ai/fishRecognitionModelProfile';
import type { CatchRecognitionErrorCode, SpeciesPrediction } from '../types';

export const FISH_RECOGNITION_ENABLED = false;
export const FISH_RECOGNITION_MODEL_VERSION = FISH_RECOGNITION_MODEL_PROFILE_LOCK.selectedModel.version;
export const FISH_RECOGNITION_INPUT_SIZE = FISH_RECOGNITION_MODEL_PROFILE_LOCK.selectedModel.inputSize;
export const FISH_RECOGNITION_CONFIDENCE_THRESHOLD = FISH_RECOGNITION_MODEL_PROFILE_LOCK.thresholds.minConfidence;
export const FISH_RECOGNITION_TOP_K = FISH_RECOGNITION_MODEL_PROFILE_LOCK.selectedModel.topK;
export const MAX_FISH_RECOGNITION_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_FISH_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type FishRecognitionRuntimeBackend = 'webgpu' | 'wasm' | 'unavailable';
type FishRecognitionCanvas = OffscreenCanvas | HTMLCanvasElement;
type FishRecognition2DContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export interface FishRecognitionInput {
  file: File;
}

export interface FishRecognitionAvailability {
  enabled: boolean;
  profileValid: boolean;
  profilePassed: boolean;
  runtimeBackend: FishRecognitionRuntimeBackend;
  available: boolean;
  reason: string;
}

export interface PreprocessedFishRecognitionImage {
  input: Float32Array;
  inputSize: number;
  originalWidth: number;
  originalHeight: number;
  crop: {
    x: number;
    y: number;
    size: number;
  };
}

export interface FishRecognitionResult {
  predictions: SpeciesPrediction[];
  modelVersion: string;
  recognizedAt: string;
  modelMetadata: FishRecognitionModelMetadata;
}

export interface FishRecognitionInferenceRunner {
  metadata: FishRecognitionModelMetadata;
  predict: (input: Float32Array) => Promise<number[] | Float32Array>;
}

type InferenceRunnerLoader = () => Promise<FishRecognitionInferenceRunner>;

let inferenceRunnerLoader: InferenceRunnerLoader | null = null;

export class FishRecognitionError extends Error {
  code: CatchRecognitionErrorCode;

  constructor(code: CatchRecognitionErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'FishRecognitionError';
  }
}

export function setFishRecognitionInferenceRunnerForTesting(loader: InferenceRunnerLoader | null): void {
  inferenceRunnerLoader = loader;
}

export function isSupportedFishImage(file: File): boolean {
  return SUPPORTED_FISH_IMAGE_MIME_TYPES.includes(file.type as (typeof SUPPORTED_FISH_IMAGE_MIME_TYPES)[number]);
}

export function normalizeFishRecognitionPixel(value: number): number {
  return Math.round((((value / 255) * 2) - 1) * 1000000) / 1000000;
}

export function normalizeFishRecognitionConfidence(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function computeFishRecognitionCenterCrop(width: number, height: number): {
  x: number;
  y: number;
  size: number;
} {
  const size = Math.min(width, height);
  return {
    x: Math.max(Math.floor((width - size) / 2), 0),
    y: Math.max(Math.floor((height - size) / 2), 0),
    size,
  };
}

function hasBrowserCanvasRuntime(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getFishRecognitionRuntimeBackend(): FishRecognitionRuntimeBackend {
  if (!hasBrowserCanvasRuntime()) return 'unavailable';
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) return 'webgpu';
  if (typeof WebAssembly === 'object') return 'wasm';
  return 'unavailable';
}

export function getFishRecognitionAvailability(): FishRecognitionAvailability {
  const profileValid = hasValidFishRecognitionModelProfileLock();
  const profilePassed = profileValid && isFishRecognitionProfilePassed();
  const runtimeBackend = getFishRecognitionRuntimeBackend();

  if (!FISH_RECOGNITION_ENABLED) {
    return {
      enabled: false,
      profileValid,
      profilePassed,
      runtimeBackend,
      available: false,
      reason: 'feature_disabled',
    };
  }

  if (!profileValid) {
    return {
      enabled: true,
      profileValid: false,
      profilePassed: false,
      runtimeBackend,
      available: false,
      reason: 'invalid_model_profile_lock',
    };
  }

  if (!profilePassed) {
    return {
      enabled: true,
      profileValid: true,
      profilePassed: false,
      runtimeBackend,
      available: false,
      reason: FISH_RECOGNITION_MODEL_PROFILE_LOCK.gate.reason,
    };
  }

  if (runtimeBackend === 'unavailable') {
    return {
      enabled: true,
      profileValid: true,
      profilePassed: true,
      runtimeBackend,
      available: false,
      reason: 'browser_runtime_unavailable',
    };
  }

  return {
    enabled: true,
    profileValid: true,
    profilePassed: true,
    runtimeBackend,
    available: true,
    reason: 'ready',
  };
}

export function isFishRecognitionAvailable(): boolean {
  return getFishRecognitionAvailability().available;
}

function validateFishRecognitionInput(file: File): void {
  if (!isSupportedFishImage(file)) {
    throw new FishRecognitionError('unsupported_image');
  }
  if (file.size > MAX_FISH_RECOGNITION_IMAGE_BYTES) {
    throw new FishRecognitionError('processing_failed');
  }
}

function createWorkingCanvas(size: number): FishRecognitionCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(size, size);
  }

  if (!hasBrowserCanvasRuntime()) {
    throw new FishRecognitionError('inference_unavailable');
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function getCanvas2DContext(canvas: FishRecognitionCanvas): FishRecognition2DContext {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !('drawImage' in context) || !('getImageData' in context)) {
    throw new FishRecognitionError('processing_failed');
  }
  return context as FishRecognition2DContext;
}

async function decodeFishImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch (err) {
      if (!(err instanceof TypeError)) {
        throw err;
      }
    }

    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  if (!hasBrowserCanvasRuntime()) {
    throw new FishRecognitionError('inference_unavailable');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new FishRecognitionError('malformed_image'));
      img.src = objectUrl;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

function getCanvasImageData(canvas: FishRecognitionCanvas): ImageData {
  const context = getCanvas2DContext(canvas);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export async function preprocessFishRecognitionImage(file: File): Promise<PreprocessedFishRecognitionImage> {
  validateFishRecognitionInput(file);

  const decoded = await decodeFishImage(file);
  try {
    const inputSize = FISH_RECOGNITION_INPUT_SIZE;
    const crop = computeFishRecognitionCenterCrop(decoded.width, decoded.height);
    const canvas = createWorkingCanvas(inputSize);
    const context = getCanvas2DContext(canvas);

    context.drawImage(
      decoded.source,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      inputSize,
      inputSize,
    );

    const imageData = getCanvasImageData(canvas).data;
    const normalized = new Float32Array(inputSize * inputSize * 3);

    for (let src = 0, dest = 0; src < imageData.length; src += 4) {
      normalized[dest] = normalizeFishRecognitionPixel(imageData[src]);
      normalized[dest + 1] = normalizeFishRecognitionPixel(imageData[src + 1]);
      normalized[dest + 2] = normalizeFishRecognitionPixel(imageData[src + 2]);
      dest += 3;
    }

    return {
      input: normalized,
      inputSize,
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      crop,
    };
  } catch (err) {
    throw mapToRecognitionError(err);
  } finally {
    decoded.close();
  }
}

export function softmaxFishRecognitionScores(scores: number[]): number[] {
  if (scores.length === 0) return [];

  const maxScore = Math.max(...scores);
  const exponentials = scores.map((value) => Math.exp(value - maxScore));
  const sum = exponentials.reduce((acc, value) => acc + value, 0);

  return exponentials.map((value) => value / sum);
}

export function mapScoresToSpeciesPredictions(
  scores: number[],
  speciesCatalog = COMMON_FISH_SPECIES,
): SpeciesPrediction[] {
  if (scores.length !== speciesCatalog.length) {
    throw new FishRecognitionError('processing_failed');
  }

  return softmaxFishRecognitionScores(scores)
    .map((confidence, index) => ({
      species: speciesCatalog[index],
      confidence: normalizeFishRecognitionConfidence(confidence),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, FISH_RECOGNITION_TOP_K);
}

export function assertFishRecognitionConfidence(predictions: SpeciesPrediction[]): SpeciesPrediction[] {
  const topCandidate = predictions[0];

  if (!topCandidate || topCandidate.confidence < FISH_RECOGNITION_CONFIDENCE_THRESHOLD) {
    throw new FishRecognitionError('low_confidence');
  }

  return predictions;
}

export async function runFishRecognitionInference(
  preprocessed: PreprocessedFishRecognitionImage,
  runner: FishRecognitionInferenceRunner,
): Promise<FishRecognitionResult> {
  const scores = await runner.predict(preprocessed.input);
  const predictions = assertFishRecognitionConfidence(mapScoresToSpeciesPredictions([...scores]));

  return {
    predictions,
    modelVersion: runner.metadata.version,
    recognizedAt: new Date().toISOString(),
    modelMetadata: runner.metadata,
  };
}

async function loadFishRecognitionRunner(): Promise<FishRecognitionInferenceRunner> {
  if (inferenceRunnerLoader) {
    return inferenceRunnerLoader();
  }

  throw new FishRecognitionError(
    'inference_unavailable',
    `No browser model artifact is available for ${getLockedFishRecognitionModelMetadata().name}.`,
  );
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
  const availability = getFishRecognitionAvailability();

  if (!availability.available) {
    throw new FishRecognitionError('inference_unavailable', availability.reason);
  }

  try {
    const preprocessed = await preprocessFishRecognitionImage(file);
    const runner = await loadFishRecognitionRunner();
    return await runFishRecognitionInference(preprocessed, runner);
  } catch (err) {
    throw mapToRecognitionError(err);
  }
}
