const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_MAX_BYTES = 1.5 * 1024 * 1024;
const MIN_OUTPUT_QUALITY = 0.55;
const MIN_RESIZE_DIMENSION = 800;
const QUALITY_STEP = 0.07;
const DIMENSION_SCALE_DOWN = 0.85;
const UNCOMPRESSED_IMAGE_TYPES = ['image/gif', 'image/svg+xml'] as const;

export interface OptimizeImageOptions {
  maxDimension?: number;
  maxBytes?: number;
  quality?: number;
}

function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match?.[1] ?? '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Could not read file'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return dataUrl.length;
  // Base64 encodes every 3 bytes as 4 characters, so we invert that ratio here.
  const base64Length = dataUrl.length - commaIndex - 1;
  return Math.ceil((base64Length * 3) / 4);
}

function scaleDimensions(width: number, height: number, maxDimension: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  const largestSide = Math.max(width, height);
  if (largestSide <= maxDimension) return { width, height };

  const scale = maxDimension / largestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function chooseOutputType(inputType: string): string {
  if (inputType === 'image/webp') return 'image/webp';
  if (inputType === 'image/png') return 'image/webp';
  return 'image/jpeg';
}

function renderCompressedDataUrl(
  image: HTMLImageElement,
  width: number,
  height: number,
  outputType: string,
  quality: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create canvas context');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL(outputType, quality);
}

async function optimizeDataUrlForStorage(
  originalDataUrl: string,
  inputType: string,
  originalBytes: number,
  options: OptimizeImageOptions = {},
): Promise<string> {
  // GIFs can be animated and SVGs are vector assets, so re-encoding them would be lossy or unnecessary.
  if (
    !inputType.startsWith('image/')
    || (UNCOMPRESSED_IMAGE_TYPES as readonly string[]).includes(inputType)
  ) {
    return originalDataUrl;
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const startingQuality = options.quality ?? 0.82;

  const image = await loadImage(originalDataUrl);
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (imageWidth <= 0 || imageHeight <= 0) {
    return originalDataUrl;
  }
  const initialDimensions = scaleDimensions(imageWidth, imageHeight, maxDimension);

  if (
    initialDimensions.width === imageWidth
    && initialDimensions.height === imageHeight
    && originalBytes <= maxBytes
  ) {
    return originalDataUrl;
  }

  const outputType = chooseOutputType(inputType);
  let width = initialDimensions.width;
  let height = initialDimensions.height;
  let quality = startingQuality;
  let optimized = renderCompressedDataUrl(image, width, height, outputType, quality);

  while (
    estimateDataUrlBytes(optimized) > maxBytes
    && (quality > MIN_OUTPUT_QUALITY || width > MIN_RESIZE_DIMENSION || height > MIN_RESIZE_DIMENSION)
  ) {
    if (quality > MIN_OUTPUT_QUALITY) {
      quality = Math.max(MIN_OUTPUT_QUALITY, quality - QUALITY_STEP);
    } else {
      width = Math.max(1, Math.round(width * DIMENSION_SCALE_DOWN));
      height = Math.max(1, Math.round(height * DIMENSION_SCALE_DOWN));
    }
    optimized = renderCompressedDataUrl(image, width, height, outputType, quality);
  }

  return optimized.length < originalDataUrl.length ? optimized : originalDataUrl;
}

export async function optimizeImageForStorage(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<string> {
  const originalDataUrl = await readFileAsDataUrl(file);
  return optimizeDataUrlForStorage(originalDataUrl, file.type, file.size, options);
}

export async function optimizeImageDataUrlForStorage(
  dataUrl: string,
  options: OptimizeImageOptions = {},
): Promise<string> {
  const inputType = getMimeTypeFromDataUrl(dataUrl);
  return optimizeDataUrlForStorage(dataUrl, inputType, estimateDataUrlBytes(dataUrl), options);
}
