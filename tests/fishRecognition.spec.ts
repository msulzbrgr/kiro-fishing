import { expect, test } from '@playwright/test';
import { COMMON_FISH_SPECIES } from '../src/data/cantonLaws';
import {
  assertFishRecognitionConfidence,
  computeFishRecognitionCenterCrop,
  getFishRecognitionAvailability,
  mapScoresToSpeciesPredictions,
  normalizeFishRecognitionPixel,
  runFishRecognitionInference,
} from '../src/services/fishRecognitionService';

test.describe('Fish recognition service', () => {
  test('stays unavailable while the feature flag is off and the profile lock is blocked', () => {
    const availability = getFishRecognitionAvailability();

    expect(availability.enabled).toBe(false);
    expect(availability.profileValid).toBe(true);
    expect(availability.profilePassed).toBe(false);
    expect(availability.available).toBe(false);
    expect(availability.reason).toBe('feature_disabled');
  });

  test('computes a deterministic center crop and symmetric pixel normalization', () => {
    expect(computeFishRecognitionCenterCrop(3, 1)).toEqual({ x: 1, y: 0, size: 1 });
    expect(normalizeFishRecognitionPixel(0)).toBe(-1);
    expect(normalizeFishRecognitionPixel(255)).toBe(1);
    expect(normalizeFishRecognitionPixel(128)).toBeCloseTo(0.003922, 6);
  });

  test('maps model scores to sorted top-3 species probabilities', () => {
    const scores = Array.from({ length: COMMON_FISH_SPECIES.length }, () => -10);
    scores[0] = 5;
    scores[1] = 1;
    scores[2] = 3;

    const predictions = mapScoresToSpeciesPredictions(scores);

    expect(predictions).toHaveLength(3);
    expect(predictions[0].species).toBe(COMMON_FISH_SPECIES[0]);
    expect(predictions[1].species).toBe(COMMON_FISH_SPECIES[2]);
    expect(predictions[2].species).toBe(COMMON_FISH_SPECIES[1]);
    expect(predictions[0].confidence).toBeGreaterThan(predictions[1].confidence);
    expect(predictions[1].confidence).toBeGreaterThan(predictions[2].confidence);
  });

  test('rejects low-confidence prediction sets', () => {
    try {
      assertFishRecognitionConfidence([
        { species: COMMON_FISH_SPECIES[0], confidence: 0.5 },
        { species: COMMON_FISH_SPECIES[1], confidence: 0.3 },
        { species: COMMON_FISH_SPECIES[2], confidence: 0.2 },
      ]);
      throw new Error('expected low-confidence rejection');
    } catch (error) {
      expect((error as { code?: string }).code).toBe('low_confidence');
    }
  });

  test('runFishRecognitionInference returns calibrated top-3 predictions for confident scores', async () => {
    const result = await runFishRecognitionInference(
      {
        input: new Float32Array(224 * 224 * 3),
        inputSize: 224,
        originalWidth: 224,
        originalHeight: 224,
        crop: { x: 0, y: 0, size: 224 },
      },
      {
        metadata: { name: 'test-runner', version: '1.0.0', hash: 'test-hash' },
        predict: async () => {
          const scores = Array.from({ length: COMMON_FISH_SPECIES.length }, () => -10);
          scores[0] = 9;
          scores[1] = 3;
          scores[2] = 2;
          return scores;
        },
      },
    );

    expect(result.modelVersion).toBe('1.0.0');
    expect(result.predictions).toHaveLength(3);
    expect(result.predictions[0].species).toBe(COMMON_FISH_SPECIES[0]);
  });
});
