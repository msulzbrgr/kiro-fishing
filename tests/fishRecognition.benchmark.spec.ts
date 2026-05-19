import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';

const shouldRun = process.env.FISH_RECOGNITION_BENCHMARK === '1';

test.describe('Fish recognition benchmark harness', () => {
  test.skip(!shouldRun, 'Run this harness only when explicitly requested.');

  test('captures browser preprocessing and runtime metrics', async ({ page }) => {
    await page.goto('/');

    const metrics = await page.evaluate(async () => {
      const service = await import('/src/services/fishRecognitionService.ts');
      const profile = await import('/src/ai/fishRecognitionModelProfile.ts');

      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('missing canvas context');

      context.fillStyle = '#2f855a';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (value) resolve(value);
          else reject(new Error('failed to create blob'));
        }, 'image/png');
      });

      const file = new File([blob], 'benchmark.png', { type: 'image/png' });
      const iterations = 10;
      const samples: number[] = [];

      for (let index = 0; index < iterations; index += 1) {
        const start = performance.now();
        await service.preprocessFishRecognitionImage(file);
        samples.push(performance.now() - start);
      }

      const sortedSamples = [...samples].sort((a, b) => a - b);
      const percentileIndex = Math.min(sortedSamples.length - 1, Math.floor(sortedSamples.length * 0.95));

      return {
        collectedAt: new Date().toISOString(),
        availability: service.getFishRecognitionAvailability(),
        lockedModel: profile.FISH_RECOGNITION_MODEL_PROFILE_LOCK.selectedModel,
        preprocessingLatencyMs: {
          samples,
          p95: sortedSamples[percentileIndex],
        },
      };
    });

    const outputPath = '/tmp/fish-recognition-benchmark.json';
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');

    expect(metrics.lockedModel.name).toBeTruthy();
  });
});
