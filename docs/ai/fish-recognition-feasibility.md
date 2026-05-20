# Fish Recognition Feasibility

## Scope

- Local-first, browser-only fish species suggestions for Catch Log.
- No backend inference.
- Manual species selection remains the source of truth.
- `FISH_RECOGNITION_ENABLED` stays default OFF until the feasibility gate passes.

## Locked baseline

- Primary model: **MobileNetV3-small + custom species head**
- Fallback model: **EfficientNet-lite0 + custom species head**
- Optional later candidate: **ViT-tiny** only if the browser performance budget stays within the thresholds below.

## Acceptance thresholds

| Metric | WebGPU target | WASM fallback target |
| --- | --- | --- |
| P95 inference latency | <= 120 ms | <= 350 ms |
| Peak memory | <= 180 MB | <= 180 MB |
| Top-1 accuracy | >= 0.75 | same artifact |
| Top-3 accuracy | >= 0.92 | same artifact |
| Calibration | ECE <= 0.08 | ECE <= 0.08 |

## Current gate status

**FAIL / BLOCKED**

The repository does not yet contain all required assets to enable user-visible fish recognition:

1. No curated labeled dataset aligned to the in-app species taxonomy is checked in or referenced by a reproducible manifest.
2. No browser-compatible trained model artifact (ONNX/TFLite/Web format) is available.
3. No calibration output, reliability bins, or saved confidence threshold report is available.
4. No benchmark evidence from target device classes is available yet.

Because those prerequisites are missing, the profile lock in `src/ai/model-profile-lock.json` remains failed and the feature stays disabled by default.

## What is implemented in this slice

- Placeholder hash-based predictions have been removed.
- Browser-side preprocessing is deterministic:
  - EXIF-aware decode when supported by the runtime
  - center crop + resize to the locked model input size
  - symmetric pixel normalization to `[-1, 1]`
- Catch Log now treats AI as opt-in suggestions only:
  - no silent overwrite of manual species choice
  - no AI metadata persisted when inference is unavailable, fails, or is low-confidence
- A benchmark harness is available via `npm run benchmark:fish-recognition`.

## Remaining work before enablement

1. Build and version the labeled fish dataset aligned to `COMMON_FISH_SPECIES`.
2. Train MobileNetV3-small and EfficientNet-lite0 browser artifacts with a reproducible recipe.
3. Run calibration (temperature scaling or equivalent) and save the selected threshold.
4. Run the benchmark harness on target device classes for WebGPU and WASM.
5. Update `src/ai/model-profile-lock.json` to `gate.passed = true` only after the evidence is attached.
