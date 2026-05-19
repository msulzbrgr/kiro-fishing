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

export const FISH_RECOGNITION_MODEL_PROFILE_LOCK: FishRecognitionModelProfileLock = {
  schemaVersion: 1,
  feature: 'fish-recognition',
  lockedAt: '2026-05-19T19:52:33.358Z',
  defaultEnabled: false,
  gate: {
    passed: false,
    reason: 'Blocked pending a browser-compatible trained species model artifact, calibrated validation report, and benchmark evidence for target devices.',
  },
  selectedModel: {
    name: 'mobilenetv3-small-species-head',
    fallbackName: 'efficientnet-lite0-species-head',
    version: 'pending-feasibility-gate',
    hash: 'pending-model-artifact',
    inputSize: 224,
    normalization: 'imagenet-symmetric-minus-one-to-one',
    topK: 3,
  },
  thresholds: {
    minConfidence: 0.72,
    p95LatencyMs: {
      webgpu: 120,
      wasm: 350,
    },
    peakMemoryMb: 180,
    top1Accuracy: 0.75,
    top3Accuracy: 0.92,
    expectedCalibrationError: 0.08,
  },
  benchmark: {
    command: 'npm run benchmark:fish-recognition',
    outputPath: '/tmp/fish-recognition-benchmark.json',
  },
  calibration: {
    method: 'temperature-scaling',
    thresholdSource: 'validation-reliability-bins',
    status: 'pending',
  },
};

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
