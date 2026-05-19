---
title: 'Plan gated-off ONNX Runtime Web fish recognition plumbing'
type: 'feature'
created: '2026-05-19T20:31:14.450+00:00'
status: 'draft'
context:
  - '{project-root}/docs/adr/0002-local-first-browser-application.md'
  - '{project-root}/docs/ai/fish-recognition-feasibility.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Fish recognition has safe preprocessing and gating, but it still lacks the real browser runtime plumbing for ONNX Runtime Web, model artifact manifests, and offline caching hooks. Without that groundwork, the app cannot progress from a blocked feasibility gate toward a real browser model while staying honest about missing artifacts.

**Approach:** Add gated-off ONNX Runtime Web integration boundaries that can load a future quantized MobileNetV3 / EfficientNet-Lite model over WebGPU with WASM SIMD fallback, define the artifact formats and manifests the repo expects, and document exactly which training/export/calibration outputs are required before the lock can pass.

## Boundaries & Constraints

**Always:** Keep `FISH_RECOGNITION_ENABLED` off by default; preserve the failed feasibility gate until real model, calibration, and benchmark evidence exist; keep manual species entry authoritative; stay browser-only and local-first; use ONNX Runtime Web with WebGPU preferred and WASM SIMD fallback; make model/runtime caching explicit and offline-friendly without requiring a backend.

**Ask First:** Adding a new service worker strategy that changes existing offline behavior outside model assets; changing locked thresholds or flipping `gate.passed`; introducing remote model hosting instead of repo-managed artifacts.

**Never:** Reintroduce placeholder or stub predictions; silently auto-select fish species; persist fake recognition metadata; add server-side inference; claim the model is production-ready without artifacts and benchmark evidence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Runtime loader prepared but gate still blocked | Feature flag off and profile lock failed, with artifact manifest present | UI remains manual-only and no recognition result is surfaced or persisted | Loader path stays unreachable through normal app flow |
| Artifact manifest incomplete | Missing model, labels, calibration, or tokenizer-equivalent metadata expected by the loader | Availability or loader diagnostics explain which artifact is missing | Throw structured `inference_unavailable` / manifest validation failure without fallback predictions |
| Browser lacks WebGPU | Supported browser with ONNX Runtime Web available but no `navigator.gpu` | Runtime config selects WASM SIMD fallback metadata | If WASM runtime also cannot initialize, return structured unavailability |
| Cached assets stale or absent offline | Device is offline and model files are not already cached | App does not suggest species and remains manual-only | Surface deterministic unavailability; do not hang or corrupt cache state |

</frozen-after-approval>

## Code Map

- `package.json` -- dependency and script surface for ONNX Runtime Web and any cache-prep utilities
- `src/services/fishRecognitionService.ts` -- current availability checks, preprocessing pipeline, runner loader, and inference entry point
- `src/ai/fishRecognitionModelProfile.ts` -- locked model metadata and benchmark/calibration contract used by runtime loading
- `src/ai/model-profile-lock.json` -- source-of-truth lock that must remain blocked until real evidence exists
- `src/main.tsx` -- app bootstrap point for any service-worker registration hook
- `tests/fishRecognition.spec.ts` -- current recognition coverage to extend with loader/manifest/runtime selection behavior
- `tests/fishRecognition.benchmark.spec.ts` -- benchmark harness that must keep working with the new runtime plumbing
- `docs/ai/fish-recognition-feasibility.md` -- user-facing explanation of prerequisites, artifact requirements, and enablement checklist

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` -- add the ONNX Runtime Web dependency and any minimal script/config support needed for browser model loading -- establishes the chosen inference stack without enabling the feature
- [ ] `src/ai/` -- add typed artifact-manifest definitions and checked-in placeholder manifests for the future ONNX model, class labels, calibration report, and cacheable asset set -- makes the required deliverables explicit and machine-readable
- [ ] `src/services/fishRecognitionService.ts` -- replace the temporary unavailable loader path with a real ONNX runtime loader, backend selection, manifest validation, and structured gated-off diagnostics -- creates the actual runtime boundary while preserving blocked behavior
- [ ] `src/main.tsx` and related runtime files -- register a narrowly scoped service worker or cache hook for model assets only when supported -- prepares offline reuse of downloaded model artifacts without changing current user flows
- [ ] `docs/ai/fish-recognition-feasibility.md` -- document the exact artifacts needed, how to train/export/package them, and how to produce calibration and benchmark evidence -- answers what the user still needs to create
- [ ] `tests/fishRecognition.spec.ts` and any new focused tests -- cover runtime backend selection, manifest validation, blocked-gate behavior, and offline/cache failure paths -- prevents regressions while the feature stays off

**Acceptance Criteria:**
- Given the app starts with the current default config, when fish recognition availability is computed, then the feature remains unavailable because the flag is off and the failed lock still blocks inference.
- Given a valid future artifact manifest and a browser without WebGPU, when the runtime loader is initialized in tests, then it selects the WASM SIMD ONNX path instead of failing immediately.
- Given required model artifacts are missing or malformed, when the loader validates its inputs, then it returns deterministic unavailability without generating any species predictions or persisted metadata.
- Given model assets were previously cached and the device is offline, when the runtime attempts to resolve artifacts, then it either serves the cached assets or fails cleanly back to manual-only behavior without affecting catch logging.
- Given a contributor follows the feasibility documentation, when they prepare the dataset, ONNX export, calibration report, and benchmark evidence, then the repository contains a clear checklist of the files and outputs needed before `model-profile-lock.json` can be updated to pass.

## Spec Change Log

## Design Notes

- Keep the runtime seam narrow: manifest parsing and ONNX session setup should live near the existing `loadFishRecognitionRunner` boundary so preprocessing and confidence logic stay unchanged.
- Cache only fish-recognition model artifacts, not the whole app shell, to avoid turning this task into a general PWA migration.
- Treat labels and calibration outputs as first-class artifacts alongside the `.onnx` file so the loader can verify taxonomy alignment before any inference session is created.

## Verification

**Commands:**
- `npm run test` -- expected: Playwright suite passes, including updated fish recognition coverage
- `npm run lint` -- expected: ESLint passes after test artifacts exist
- `npm run build` -- expected: TypeScript and Vite production build succeed with the new runtime files
