import modelProfileLock from './model-profile-lock.json';

export interface FishRecognitionModelProfileLock {
  schemaVersion: number;
  feature: string;
  lockedAt: string;
  defaultEnabled: boolean;
  gate: {
    passed: boolean;
    reason: string;
  };
  selectedModel: {
    name: string;
    fallbackName: string;
    version: string;
    hash: string;
    inputSize: number;
    normalization: string;
    topK: number;
  };
  thresholds: {
    minConfidence: number;
    p95LatencyMs: {
      webgpu: number;
      wasm: number;
    };
    peakMemoryMb: number;
    top1Accuracy: number;
    top3Accuracy: number;
    expectedCalibrationError: number;
  };
  benchmark: {
    command: string;
    outputPath: string;
  };
  calibration: {
    method: string;
    thresholdSource: string;
    status: string;
  };
}

export interface FishRecognitionModelMetadata {
  name: string;
  version: string;
  hash: string;
}

export const FISH_RECOGNITION_MODEL_PROFILE_LOCK = modelProfileLock as FishRecognitionModelProfileLock;

export function hasValidFishRecognitionModelProfileLock(): boolean {
  const profile = FISH_RECOGNITION_MODEL_PROFILE_LOCK;
  return (
    profile.schemaVersion === 1
    && profile.feature === 'fish-recognition'
    && typeof profile.gate?.passed === 'boolean'
    && typeof profile.gate?.reason === 'string'
    && typeof profile.selectedModel?.version === 'string'
    && typeof profile.selectedModel?.hash === 'string'
    && Number.isFinite(profile.selectedModel?.inputSize)
    && Number.isFinite(profile.thresholds?.minConfidence)
  );
}

export function isFishRecognitionProfilePassed(): boolean {
  return hasValidFishRecognitionModelProfileLock() && FISH_RECOGNITION_MODEL_PROFILE_LOCK.gate.passed;
}

export function getLockedFishRecognitionModelMetadata(): FishRecognitionModelMetadata {
  const { name, version, hash } = FISH_RECOGNITION_MODEL_PROFILE_LOCK.selectedModel;
  return { name, version, hash };
}
