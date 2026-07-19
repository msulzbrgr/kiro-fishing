# 0005 - Use OSM tiles and Canvas API for story image export

Date: 2026-07-19

Status: Accepted

## Context

KiroFishing users want to share their catches on social platforms (Instagram, Strava, etc.).
These platforms expect portrait images in the 9:16 aspect ratio (1080 × 1920 px) that contain
catch details, branding, and a visual sense of place.

The application is fully local-first: it runs in the browser with no server component. Any image
generation must happen entirely client-side.

The primary sense-of-place element is a map background centred on the catch GPS coordinates.
The app already uses OpenStreetMap (OSM) via Leaflet for interactive maps, so OSM is a natural
source for static tile imagery as well. ADR-0003 established that OSM and Leaflet are the map
stack; this ADR extends that decision to cover server-side tile fetching for offline canvas
rendering.

## Decision

Story images will be generated entirely in the browser using the HTML Canvas 2D API:

1. **Tile background** — a 3 × 5 grid of OSM raster tiles (zoom 13) is fetched in parallel via
   `Image` elements with `crossOrigin = 'anonymous'` and drawn onto an offscreen canvas. The
   resulting grid is then scaled to cover the 1080 × 1920 canvas and blurred with
   `ctx.filter = 'blur(10px)'`. If any tiles fail (network error, CORS, offline), the affected
   cells are silently skipped; if no tiles load at all, a nature-themed gradient fallback is used
   instead.

2. **Compositing** — a dark gradient overlay is drawn on top of the tile layer for text
   legibility, followed by the remaining story elements (logo, photos, info card, meta bar).

3. **Photo circles** — catch and profile photos are clipped to circles using `ctx.arc` + `clip()`
   for the Instagram/Strava bubble aesthetic. Images are scaled to "cover" their circle without
   distortion.

4. **Export format** — each image is serialised to a PNG `Blob` via `canvas.toBlob()`. All images
   for a session (one summary + one per catch) are bundled into a ZIP archive using JSZip and
   offered as a browser download.

5. **Attribution** — every generated image includes the `© OpenStreetMap contributors` text as
   required by the OSM tile usage policy.

## Consequences

- The entire pipeline runs in the browser with no backend, consistent with the local-first
  architecture (ADR-0002).
- Tile loading is best-effort: users on restricted networks or in offline mode still get a usable
  gradient background.
- Tile requests go directly from the user's browser to `tile.openstreetmap.org`, which is subject
  to OSM's [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). High-volume
  automated export would violate that policy; single-user, on-demand generation is acceptable.
- Canvas rendering of 1080 × 1920 images is memory-intensive. Low-end devices may be slow; this
  is acceptable for an occasional export action.
- The `crossOrigin = 'anonymous'` attribute on tile images requires OSM tiles to send permissive
  CORS headers. OSM does so; switching to a different tile provider would require verifying CORS
  support.
- Tests that trigger story export must stub or abort tile requests to avoid flakiness from
  real network calls.
