import { expect, test } from '@playwright/test';

test.describe('Fish recognition service', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('stays unavailable while the feature flag is off and the profile lock is blocked', async ({ page }) => {
    const availability = await page.evaluate(async () => {
      const service = await import('/src/services/fishRecognitionService.ts');
      return service.getFishRecognitionAvailability();
    });

    expect(availability.enabled).toBe(false);
    expect(availability.profileValid).toBe(true);
    expect(availability.profilePassed).toBe(false);
    expect(availability.available).toBe(false);
    expect(availability.reason).toBe('feature_disabled');
  });

  test('preprocesses images with center crop and normalized pixels', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const service = await import('/src/services/fishRecognitionService.ts');

      const canvas = document.createElement('canvas');
      canvas.width = 3;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('missing canvas context');

      context.fillStyle = '#ff0000';
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = '#00ff00';
      context.fillRect(1, 0, 1, 1);
      context.fillStyle = '#0000ff';
      context.fillRect(2, 0, 1, 1);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (value) resolve(value);
          else reject(new Error('failed to create blob'));
        }, 'image/png');
      });

      const file = new File([blob], 'striped.png', { type: 'image/png' });
      const preprocessed = await service.preprocessFishRecognitionImage(file);

      return {
        inputSize: preprocessed.inputSize,
        originalWidth: preprocessed.originalWidth,
        originalHeight: preprocessed.originalHeight,
        crop: preprocessed.crop,
        firstPixel: [preprocessed.input[0], preprocessed.input[1], preprocessed.input[2]],
      };
    });

    expect(result.inputSize).toBe(224);
    expect(result.originalWidth).toBe(3);
    expect(result.originalHeight).toBe(1);
    expect(result.crop).toEqual({ x: 1, y: 0, size: 1 });
    expect(result.firstPixel[0]).toBeCloseTo(-1, 5);
    expect(result.firstPixel[1]).toBeCloseTo(1, 5);
    expect(result.firstPixel[2]).toBeCloseTo(-1, 5);
  });

  test('maps model scores to sorted top-3 species probabilities', async ({ page }) => {
    const predictions = await page.evaluate(async () => {
      const service = await import('/src/services/fishRecognitionService.ts');
      const { COMMON_FISH_SPECIES } = await import('/src/data/cantonLaws.ts');

      const scores = Array.from({ length: COMMON_FISH_SPECIES.length }, () => -10);
      scores[0] = 5;
      scores[1] = 1;
      scores[2] = 3;

      return service.mapScoresToSpeciesPredictions(scores);
    });

    expect(predictions).toHaveLength(3);
    expect(predictions[0].confidence).toBeGreaterThan(predictions[1].confidence);
    expect(predictions[1].confidence).toBeGreaterThan(predictions[2].confidence);
  });

  test('rejects low-confidence inference outputs', async ({ page }) => {
    const failure = await page.evaluate(async () => {
      const service = await import('/src/services/fishRecognitionService.ts');
      const { COMMON_FISH_SPECIES } = await import('/src/data/cantonLaws.ts');
      const runner = {
        metadata: { name: 'test-runner', version: '1.0.0', hash: 'test' },
        predict: async () => new Array(COMMON_FISH_SPECIES.length).fill(0),
      };

      try {
        await service.runFishRecognitionInference(
          {
            input: new Float32Array(224 * 224 * 3),
            inputSize: 224,
            originalWidth: 224,
            originalHeight: 224,
            crop: { x: 0, y: 0, size: 224 },
          },
          runner,
        );
        return { code: 'unexpected-success' };
      } catch (error) {
        return { code: (error as { code?: string }).code ?? 'unknown' };
      }
    });

    expect(failure.code).toBe('low_confidence');
  });
});
