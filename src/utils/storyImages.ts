import JSZip from 'jszip';
import type { TFunction } from 'i18next';
import type { Catch, FishingSession, Profile } from '../types';

// ── Story dimensions ─────────────────────────────────────────────────────────
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const MAX_SUMMARY_CATCHES = 8;
const MAX_CATCH_NOTES_LINES = 3;

// ── KiroFishing brand colours ────────────────────────────────────────────────
const KIRO_GREEN = '#1a6b3c';
const KIRO_GOLD  = '#f0a500';
const KIRO_NAVY  = '#0b1f3b';

// ── OSM tile grid parameters (3 cols × 5 rows at zoom 13) ────────────────────
const OSM_ZOOM    = 13;
const OSM_COLS    = 3;
const OSM_ROWS    = 5;
const OSM_TILE_PX = 256;

// ── Layout constants ──────────────────────────────────────────────────────────
// Ratio used to offset the flag badge towards the logo's bottom-right corner
const FLAG_BADGE_OFFSET_RATIO = 0.68;
// Scale factor applied to the flag badge radius to get the emoji font size
const FLAG_EMOJI_SIZE_MULTIPLIER = 1.35;
// Radius fraction for the placeholder fish-body ellipse (width / height)
const FISH_BODY_WIDTH_RATIO  = 0.36;
const FISH_BODY_HEIGHT_RATIO = 0.20;
// Font scale for text rendered inside a circular photo placeholder
const CIRCLE_FONT_SCALE = 0.22;
// Font scale for the "+N more" badge label
const BADGE_FONT_SCALE = 0.34;

// ── Inlined KiroFishing fishing-icon SVG ─────────────────────────────────────
const KIRO_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#1a6b3c"/>
  <ellipse cx="50" cy="78" rx="38" ry="10" fill="#0d4a2a" opacity="0.5"/>
  <path d="M14 76 Q24 70 34 76 Q44 82 54 76 Q64 70 74 76 Q84 82 86 78" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
  <path d="M14 80 Q22 74 32 80 Q42 86 52 80 Q62 74 72 80 Q82 86 86 82" fill="none" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <line x1="54" y1="32" x2="80" y2="72" stroke="#f0a500" stroke-width="1.5" stroke-linecap="round"/>
  <rect x="42" y="46" width="14" height="16" rx="4" fill="#e8d5b0"/>
  <circle cx="49" cy="38" r="8" fill="#f5c68c"/>
  <ellipse cx="49" cy="31" rx="11" ry="3" fill="#1a3a2a"/>
  <rect x="42" y="24" width="14" height="8" rx="3" fill="#1a3a2a"/>
  <rect x="42" y="29" width="14" height="2" fill="#f0a500"/>
  <line x1="56" y1="52" x2="68" y2="34" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
  <rect x="55" y="50" width="4" height="8" rx="2" fill="#6b3a2a"/>
  <g transform="translate(76, 68)">
    <ellipse cx="0" cy="0" rx="6" ry="3.5" fill="#4ade80"/>
    <polygon points="-6,0 -10,-3 -10,3" fill="#2dd068"/>
    <circle cx="3" cy="-0.5" r="1" fill="white"/>
    <circle cx="3.3" cy="-0.5" r="0.5" fill="#222"/>
    <path d="M -1,-3.5 Q 1,-7 3,-3.5" fill="#2dd068"/>
  </g>
  <path d="M80 72 Q83 72 83 76 Q83 80 79 80" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

// ── File utilities ────────────────────────────────────────────────────────────

function sanitizeFilePart(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createStoryCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');
  return { canvas, ctx };
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Could not render image')); return; }
      resolve(blob);
    }, 'image/png');
  });
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function formatDuration(startTime: string, endTime?: string): string | null {
  if (!endTime) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return null;
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      if (ctx.measureText(word).width > maxWidth) {
        let remaining = word;
        while (remaining.length > 0) {
          let chunk = remaining;
          while (chunk.length > 1 && ctx.measureText(chunk).width > maxWidth) chunk = chunk.slice(0, -1);
          if (chunk.length === 0) chunk = remaining.slice(0, 1);
          lines.push(chunk);
          remaining = remaining.slice(chunk.length);
        }
        current = '';
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Number.MAX_SAFE_INTEGER,
): number {
  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  for (const [i, line] of lines.entries()) ctx.fillText(line, x, y + i * lineHeight);
  return lines.length;
}

// ── i18n label helpers ────────────────────────────────────────────────────────

function mapWeatherConditionLabel(session: FishingSession, t: TFunction): string | null {
  const map: Record<string, string> = {
    sunny: 'conditions.sunny',
    'partly-cloudy': 'conditions.partly_cloudy',
    cloudy: 'conditions.cloudy',
    rainy: 'conditions.rainy',
    stormy: 'conditions.stormy',
  };
  const key = session.weather.condition ? map[session.weather.condition] : undefined;
  return key ? t(key) : null;
}

function mapWaterConditionLabel(session: FishingSession, t: TFunction): string | null {
  const map: Record<string, string> = {
    clear: 'conditions.clear',
    'slightly-murky': 'conditions.slightly_murky',
    murky: 'conditions.murky',
  };
  const key = session.water.clarity ? map[session.water.clarity] : undefined;
  return key ? t(key) : null;
}

function mapWaterLevelLabel(session: FishingSession, t: TFunction): string | null {
  const map: Record<string, string> = {
    low: 'conditions.level_low',
    normal: 'conditions.level_normal',
    high: 'conditions.level_high',
  };
  const key = session.water.level ? map[session.water.level] : undefined;
  return key ? t(key) : null;
}

function mapCurrentLabel(session: FishingSession, t: TFunction): string | null {
  const map: Record<string, string> = {
    still: 'conditions.current_still',
    slow: 'conditions.current_slow',
    moderate: 'conditions.current_moderate',
    fast: 'conditions.current_fast',
  };
  const key = session.water.current ? map[session.water.current] : undefined;
  return key ? t(key) : null;
}

// ── Image loaders ─────────────────────────────────────────────────────────────

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/** Load an OSM tile with CORS; resolves to null on error instead of rejecting. */
async function loadTileImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadKiroLogoImage(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(KIRO_ICON_SVG)}`;
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// ── OSM tile background ───────────────────────────────────────────────────────

function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Draw a nature-themed gradient as a fallback when tiles are unavailable. */
function drawNatureGradient(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT * 0.55);
  sky.addColorStop(0, '#061b31');
  sky.addColorStop(1, '#0d3a58');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT * 0.55);

  const water = ctx.createLinearGradient(0, STORY_HEIGHT * 0.55, 0, STORY_HEIGHT);
  water.addColorStop(0, '#0a2e48');
  water.addColorStop(1, '#040f1a');
  ctx.fillStyle = water;
  ctx.fillRect(0, STORY_HEIGHT * 0.55, STORY_WIDTH, STORY_HEIGHT * 0.45);

  // Subtle wave lines
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const waveY = STORY_HEIGHT * 0.58 + i * 100;
    ctx.beginPath();
    ctx.moveTo(0, waveY);
    for (let wx = 0; wx <= STORY_WIDTH; wx += 60) {
      ctx.quadraticCurveTo(wx + 30, waveY - 14, wx + 60, waveY);
    }
    ctx.stroke();
  }
}

/**
 * Fill the canvas with a blurred OSM map background centred on (lat, lng).
 * Falls back to a nature gradient when tiles cannot be fetched.
 */
async function drawBackground(
  ctx: CanvasRenderingContext2D,
  lat?: number,
  lng?: number,
): Promise<void> {
  let usedTiles = false;

  if (lat !== undefined && lng !== undefined) {
    try {
      const center = latLngToTile(lat, lng, OSM_ZOOM);
      const startCol = center.x - Math.floor(OSM_COLS / 2);
      const startRow = center.y - Math.floor(OSM_ROWS / 2);

      const gridW = OSM_COLS * OSM_TILE_PX;
      const gridH = OSM_ROWS * OSM_TILE_PX;

      const offscreen = document.createElement('canvas');
      offscreen.width = gridW;
      offscreen.height = gridH;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) throw new Error('Could not create offscreen canvas context');

      // Fetch all tiles in parallel
      const loads: Promise<void>[] = [];
      for (let row = 0; row < OSM_ROWS; row++) {
        for (let col = 0; col < OSM_COLS; col++) {
          const tx = startCol + col;
          const ty = startRow + row;
          const url = `https://tile.openstreetmap.org/${OSM_ZOOM}/${tx}/${ty}.png`;
          const dx = col * OSM_TILE_PX;
          const dy = row * OSM_TILE_PX;
          loads.push(loadTileImage(url).then((img) => {
            if (img) offCtx.drawImage(img, dx, dy, OSM_TILE_PX, OSM_TILE_PX);
          }));
        }
      }
      await Promise.all(loads);

      // Scale the tile grid to "cover" the story canvas
      const scale = Math.max(STORY_WIDTH / gridW, STORY_HEIGHT / gridH);
      const drawW = gridW * scale;
      const drawH = gridH * scale;
      const dx = (STORY_WIDTH - drawW) / 2;
      const dy = (STORY_HEIGHT - drawH) / 2;

      ctx.filter = 'blur(10px)';
      ctx.drawImage(offscreen, dx, dy, drawW, drawH);
      ctx.filter = 'none';
      usedTiles = true;
    } catch {
      // fall through to gradient
    }
  }

  if (!usedTiles) drawNatureGradient(ctx);

  // Semi-transparent dark overlay — heavier at top and bottom for text readability
  const overlay = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  overlay.addColorStop(0,    'rgba(11, 31, 59, 0.84)');
  overlay.addColorStop(0.22, 'rgba(11, 31, 59, 0.62)');
  overlay.addColorStop(0.68, 'rgba(11, 31, 59, 0.68)');
  overlay.addColorStop(1,    'rgba(11, 31, 59, 0.90)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
}

// ── Rounded rectangle helper ──────────────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const cr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.lineTo(x + w - cr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + cr);
  ctx.lineTo(x + w, y + h - cr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h);
  ctx.lineTo(x + cr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - cr);
  ctx.lineTo(x, y + cr);
  ctx.quadraticCurveTo(x, y, x + cr, y);
  ctx.closePath();
}

// ── Top bar (logo + flag + branding + profile photo) ─────────────────────────

/** Convert a 2-letter ISO 3166-1 alpha-2 country code to a flag emoji. */
function countryCodeToFlagEmoji(code: string): string {
  const upper = code.toUpperCase().slice(0, 2);
  if (upper.length < 2) return '';
  return (
    String.fromCodePoint(0x1f1e6 + upper.charCodeAt(0) - 65) +
    String.fromCodePoint(0x1f1e6 + upper.charCodeAt(1) - 65)
  );
}

async function drawTopBar(
  ctx: CanvasRenderingContext2D,
  countryCode: string | undefined,
  profilePhotoSrc: string | undefined,
): Promise<void> {
  const logoR  = 40;
  const logoCx = 70 + logoR;
  const logoCy = 68 + logoR; // top-padding 68 + radius → centre y = 108

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoImg = await loadKiroLogoImage();
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2);
  ctx.clip();
  if (logoImg) {
    ctx.drawImage(logoImg, logoCx - logoR, logoCy - logoR, logoR * 2, logoR * 2);
  } else {
    ctx.fillStyle = KIRO_GREEN;
    ctx.fill();
  }
  ctx.restore();

  // White ring
  ctx.beginPath();
  ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Country flag badge (bottom-right of logo) ─────────────────────────────
  if (countryCode) {
    const flagR  = 18;
    const flagCx = logoCx + Math.round(logoR * FLAG_BADGE_OFFSET_RATIO);
    const flagCy = logoCy + Math.round(logoR * FLAG_BADGE_OFFSET_RATIO);

    ctx.beginPath();
    ctx.arc(flagCx, flagCy, flagR, 0, Math.PI * 2);
    ctx.fillStyle = KIRO_NAVY;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const flag = countryCodeToFlagEmoji(countryCode);
    if (flag) {
      ctx.font = `${Math.round(flagR * FLAG_EMOJI_SIZE_MULTIPLIER)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(flag, flagCx, flagCy + 1);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }

  // ── "KiroFishing" brand text ───────────────────────────────────────────────
  const textX = logoCx + logoR + 18;
  ctx.fillStyle = KIRO_GOLD;
  ctx.font = '700 40px Inter, sans-serif';
  ctx.fillText('KiroFishing', textX, logoCy - 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
  ctx.font = '400 21px Inter, sans-serif';
  ctx.fillText('Fishing Companion', textX, logoCy + 23);

  // ── Profile photo circle (right-aligned) ──────────────────────────────────
  if (profilePhotoSrc) {
    const profR  = 40;
    const profCx = STORY_WIDTH - 70 - profR;
    const profCy = logoCy;

    ctx.save();
    ctx.beginPath();
    ctx.arc(profCx, profCy, profR, 0, Math.PI * 2);
    ctx.clip();
    try {
      const profImg = await loadImage(profilePhotoSrc);
      const ratio = Math.max((profR * 2) / profImg.width, (profR * 2) / profImg.height);
      const dw = profImg.width * ratio;
      const dh = profImg.height * ratio;
      ctx.drawImage(profImg, profCx - dw / 2, profCy - dh / 2, dw, dh);
    } catch {
      ctx.fillStyle = '#2a4a7a';
      ctx.fill();
    }
    ctx.restore();

    // Gold ring around profile photo
    ctx.beginPath();
    ctx.arc(profCx, profCy, profR, 0, Math.PI * 2);
    ctx.strokeStyle = KIRO_GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// ── Circular photo frame ──────────────────────────────────────────────────────

async function drawCirclePhoto(
  ctx: CanvasRenderingContext2D,
  photoSrc: string | undefined,
  cx: number,
  cy: number,
  r: number,
  strokeColor: string,
  strokeWidth: number,
  t: TFunction,
): Promise<void> {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (photoSrc) {
    try {
      const img = await loadImage(photoSrc);
      // "cover" — fill the circle without distortion
      const ratio = Math.max((r * 2) / img.width, (r * 2) / img.height);
      const dw = img.width * ratio;
      const dh = img.height * ratio;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    } catch {
      ctx.fillStyle = 'rgba(26, 107, 60, 0.40)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(74, 222, 128, 0.70)';
      ctx.font = `500 ${Math.max(18, Math.floor(r * CIRCLE_FONT_SCALE))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('story.catch_photo_missing'), cx, cy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  } else {
    // No photo: tinted placeholder with a fish-body hint
    ctx.fillStyle = 'rgba(26, 107, 60, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * FISH_BODY_WIDTH_RATIO, r * FISH_BODY_HEIGHT_RATIO, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Stroke ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
}

// ── Frosted-glass catch info card ─────────────────────────────────────────────

function drawCatchInfoCard(
  ctx: CanvasRenderingContext2D,
  catchEntry: Catch,
  session: FishingSession,
  t: TFunction,
  profileNickname: string | undefined,
  cardX: number,
  cardY: number,
  cardW: number,
): void {
  const hasAngler   = Boolean(profileNickname);
  const hasLocation = Boolean(
    catchEntry.location?.locationName ?? session.location.locationName,
  );
  const cardH = 230 + (hasAngler ? 42 : 0);

  // Frosted glass background
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Green left-edge accent bar
  ctx.fillStyle = KIRO_GREEN;
  ctx.fillRect(cardX, cardY + 16, 4, cardH - 32);

  const textX = cardX + 32;
  let rowY = cardY + 56;

  // Angler row (optional)
  if (hasAngler) {
    ctx.fillStyle = 'rgba(240, 165, 0, 0.9)';
    ctx.font = '500 26px Inter, sans-serif';
    ctx.fillText(`\uD83D\uDC64 ${profileNickname}`, textX, rowY);
    rowY += 42;
  }

  // Measurements
  const parts: string[] = [];
  if (catchEntry.length != null) parts.push(`${catchEntry.length} cm`);
  if (catchEntry.weight != null) parts.push(`${catchEntry.weight} g`);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 38px Inter, sans-serif';
  ctx.fillText(parts.length > 0 ? parts.join('  ·  ') : '—', textX, rowY);
  rowY += 48;

  // Time + release
  const releaseEmoji = catchEntry.released ? '\u2705' : '\uD83D\uDC1F';
  const releaseLabel = catchEntry.released ? t('story.catch_released') : t('story.catch_kept');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '400 28px Inter, sans-serif';
  ctx.fillText(
    `\uD83D\uDD50 ${catchEntry.time}  \u00B7  ${releaseEmoji} ${releaseLabel}`,
    textX, rowY,
  );
  rowY += 40;

  // Location
  if (hasLocation) {
    const locName = catchEntry.location?.locationName ?? session.location.locationName ?? '';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = '400 26px Inter, sans-serif';
    const locLines = wrapText(ctx, `\uD83D\uDCCD ${locName}`, cardW - 64);
    ctx.fillText(locLines[0] ?? '', textX, rowY);
  }
}

// ── Session meta bar ──────────────────────────────────────────────────────────

function drawSessionMeta(
  ctx: CanvasRenderingContext2D,
  session: FishingSession,
  t: TFunction,
  startY: number,
): void {
  const x = 70;
  let y = startY;

  // Gold divider
  ctx.strokeStyle = KIRO_GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(STORY_WIDTH - x, y);
  ctx.stroke();
  y += 44;

  const duration = formatDuration(session.startTime, session.endTime);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
  ctx.font = '500 28px Inter, sans-serif';
  ctx.fillText(
    `\uD83D\uDCC5 ${session.date}  \u00B7  \uD83D\uDD51 ${session.startTime}${duration ? `  (${duration})` : ''}`,
    x, y,
  );
  y += 42;

  const weatherLabel = mapWeatherConditionLabel(session, t);
  const weatherParts: string[] = [];
  if (session.weather.temperature != null) weatherParts.push(`${session.weather.temperature}\u00B0C`);
  if (weatherLabel) weatherParts.push(weatherLabel);
  if (session.weather.windSpeed != null) weatherParts.push(`${session.weather.windSpeed} km/h`);
  if (weatherParts.length > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '400 26px Inter, sans-serif';
    ctx.fillText(`\u2601\uFE0F ${weatherParts.join('  \u00B7  ')}`, x, y);
    y += 38;
  }

  const waterClarityLabel = mapWaterConditionLabel(session, t);
  const waterLevelLabel   = mapWaterLevelLabel(session, t);
  const currentLabel      = mapCurrentLabel(session, t);
  const waterParts: string[] = [];
  if (session.water.temperature != null) waterParts.push(`${session.water.temperature}\u00B0C`);
  if (waterClarityLabel) waterParts.push(waterClarityLabel);
  if (waterLevelLabel)   waterParts.push(waterLevelLabel);
  if (currentLabel)      waterParts.push(currentLabel);
  if (waterParts.length > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '400 26px Inter, sans-serif';
    ctx.fillText(`\uD83C\uDF0A ${waterParts.join('  \u00B7  ')}`, x, y);
  }
}

// ── OSM attribution ───────────────────────────────────────────────────────────

function drawOsmAttribution(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.font = '400 18px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('\u00A9 OpenStreetMap contributors', STORY_WIDTH - 40, STORY_HEIGHT - 28);
  ctx.restore();
}

// ── Catch story image (new Instagram/Strava-style template) ───────────────────

async function createCatchImage(
  session: FishingSession,
  catchEntry: Catch,
  index: number,
  t: TFunction,
  profiles: Profile[],
): Promise<Blob> {
  const { canvas, ctx } = createStoryCanvas();

  const profile     = profiles.find((p) => p.id === catchEntry.profileId);
  const countryCode = catchEntry.location?.countryCode ?? session.location.countryCode;
  const bgLat       = catchEntry.location?.lat ?? session.location.lat;
  const bgLng       = catchEntry.location?.lng ?? session.location.lng;

  // ── Background ─────────────────────────────────────────────────────────────
  await drawBackground(ctx, bgLat, bgLng);

  // ── Top bar ────────────────────────────────────────────────────────────────
  await drawTopBar(ctx, countryCode, profile?.photo);

  // ── Catch header ───────────────────────────────────────────────────────────
  ctx.fillStyle = KIRO_GOLD;
  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillText(`${t('story.catch_title')} ${index + 1}`.toUpperCase(), 70, 238);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 74px Inter, sans-serif';
  drawWrappedText(ctx, catchEntry.species, 70, 334, STORY_WIDTH - 140, 82, 2);

  // ── Photo circles ──────────────────────────────────────────────────────────
  const photos = catchEntry.photos ?? [];

  // Primary large circle centred on canvas
  const bigCx = STORY_WIDTH / 2;
  const bigCy = 710;
  const bigR  = 260;

  // Secondary circles (smaller, positioned to peek from behind / beside)
  type PhotoCircle = { cx: number; cy: number; r: number; idx: number };
  const extraCircles: PhotoCircle[] = [];
  if (photos.length >= 2) extraCircles.push({ cx: 892, cy: 958, r: 110, idx: 1 });
  if (photos.length >= 3) extraCircles.push({ cx: 152, cy: 978, r:  92, idx: 2 });

  // Draw smaller circles first so the big one renders on top
  for (const c of extraCircles) {
    await drawCirclePhoto(ctx, photos[c.idx], c.cx, c.cy, c.r, 'rgba(255,255,255,0.80)', 3, t);
  }
  await drawCirclePhoto(ctx, photos[0], bigCx, bigCy, bigR, '#ffffff', 4, t);

  // ── Frosted info card ──────────────────────────────────────────────────────
  const cardX = 60;
  const cardY = 1082;
  drawCatchInfoCard(ctx, catchEntry, session, t, profile?.nickname, cardX, cardY, STORY_WIDTH - cardX * 2);

  // ── Notes ──────────────────────────────────────────────────────────────────
  if (catchEntry.notes) {
    const hasAngler = Boolean(profile?.nickname);
    const cardH = 230 + (hasAngler ? 42 : 0);
    const notesY = cardY + cardH + 46;
    ctx.fillStyle = KIRO_GOLD;
    ctx.font = '600 26px Inter, sans-serif';
    ctx.fillText(t('story.catch_notes'), 70, notesY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.80)';
    ctx.font = 'italic 400 24px Inter, sans-serif';
    drawWrappedText(ctx, catchEntry.notes, 70, notesY + 36, STORY_WIDTH - 140, 32, MAX_CATCH_NOTES_LINES);
  }

  // ── Session meta bar ───────────────────────────────────────────────────────
  drawSessionMeta(ctx, session, t, 1600);

  // ── Attribution ────────────────────────────────────────────────────────────
  drawOsmAttribution(ctx);

  return toBlob(canvas);
}

// ── Summary story image (session overview) ────────────────────────────────────

/**
 * Calculate positions and radii for up to 4 catch photo circles in the
 * summary image so they fill the photo-area without clashing.
 */
function getSummaryCircleLayout(
  count: number,
): Array<{ cx: number; cy: number; r: number; idx: number }> {
  const midX = STORY_WIDTH / 2;
  if (count === 0) return [];
  if (count === 1) return [{ cx: midX, cy: 720, r: 270, idx: 0 }];
  if (count === 2) return [
    { cx: 260, cy: 710, r: 210, idx: 0 },
    { cx: 820, cy: 710, r: 210, idx: 1 },
  ];
  if (count === 3) return [
    { cx: midX, cy: 620, r: 220, idx: 0 },
    { cx: 210, cy: 870, r: 160, idx: 1 },
    { cx: 870, cy: 870, r: 160, idx: 2 },
  ];
  // 4+: 2×2 grid
  return [
    { cx: 248, cy: 620, r: 190, idx: 0 },
    { cx: 832, cy: 620, r: 190, idx: 1 },
    { cx: 248, cy: 870, r: 190, idx: 2 },
    { cx: 832, cy: 870, r: 190, idx: 3 },
  ];
}

async function createSummaryImage(
  session: FishingSession,
  t: TFunction,
  profiles: Profile[],
): Promise<Blob> {
  const { canvas, ctx } = createStoryCanvas();

  const countryCode = session.location.countryCode;
  const bgLat = session.location.lat;
  const bgLng = session.location.lng;

  // ── Background ─────────────────────────────────────────────────────────────
  await drawBackground(ctx, bgLat, bgLng);

  // ── Top bar (no profile photo for summary — multi-angler session) ──────────
  await drawTopBar(ctx, countryCode, undefined);

  // ── Summary title ──────────────────────────────────────────────────────────
  ctx.fillStyle = KIRO_GOLD;
  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillText(t('story.summary_title').toUpperCase(), 70, 238);

  const titleLocation =
    session.location.locationName || session.location.canton || t('map.unknown_location');
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 58px Inter, sans-serif';
  drawWrappedText(ctx, titleLocation, 70, 322, STORY_WIDTH - 140, 64, 2);

  // ── Catch photo circles ────────────────────────────────────────────────────
  const photoCatches = session.catches.filter((c) => (c.photos ?? []).length > 0).slice(0, 4);
  const noCatchPhotos = session.catches.length > 0 && photoCatches.length === 0;
  const layout = getSummaryCircleLayout(noCatchPhotos ? 0 : photoCatches.length);

  for (const { cx, cy, r, idx } of layout) {
    const photo = photoCatches[idx]?.photos?.[0];
    await drawCirclePhoto(ctx, photo, cx, cy, r, '#ffffff', 4, t);
  }

  // Placeholder circle when there are catches but no photos
  if (noCatchPhotos) {
    await drawCirclePhoto(ctx, undefined, STORY_WIDTH / 2, 720, 220, '#ffffff', 4, t);
  }

  // "+N more" badge when there are more than 4 photo catches
  const extraCount = session.catches.filter((c) => (c.photos ?? []).length > 0).length - 4;
  if (extraCount > 0) {
    const badgeCx = 880;
    const badgeCy = layout[3]?.cy ?? 870;
    const badgeR  = layout[3]?.r ?? 190;
    ctx.beginPath();
    ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(11, 31, 59, 0.72)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.floor(badgeR * BADGE_FONT_SCALE)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${extraCount}`, badgeCx, badgeCy);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  // ── Stats card ─────────────────────────────────────────────────────────────
  const statsY = layout.length > 0 ? Math.max(...layout.map((c) => c.cy + c.r)) + 40 : 1000;
  const statsCardY = Math.max(statsY, 1060);
  const statsCardH = session.catches.length === 0 ? 100 : 120 + Math.min(session.catches.length, MAX_SUMMARY_CATCHES) * 38;
  const cardX = 60;
  const cardW = STORY_WIDTH - cardX * 2;

  drawRoundedRect(ctx, cardX, statsCardY, cardW, statsCardH, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = KIRO_GREEN;
  ctx.fillRect(cardX, statsCardY + 16, 4, statsCardH - 32);

  const textX = cardX + 32;
  let rowY = statsCardY + 56;

  // Catches headline
  const releasedCount = session.catches.filter((c) => c.released).length;
  const keptCount = session.catches.length - releasedCount;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px Inter, sans-serif';
  ctx.fillText(
    session.catches.length === 0
      ? t('story.no_catches')
      : `${session.catches.length} ${t('story.summary_catches')}  ·  \u2705 ${releasedCount}  \uD83D\uDC1F ${keptCount}`,
    textX, rowY,
  );
  rowY += 48;

  // Catch list (up to MAX_SUMMARY_CATCHES)
  ctx.font = '400 26px Inter, sans-serif';
  for (const [i, c] of session.catches.slice(0, MAX_SUMMARY_CATCHES).entries()) {
    const profile = profiles.find((p) => p.id === c.profileId);
    const wt = c.weight != null ? `${c.weight}g` : null;
    const ln = c.length != null ? `${c.length}cm` : null;
    const meas = [ln, wt].filter(Boolean).join(' · ');
    const anglerPart = profile?.nickname ? ` — ${profile.nickname}` : '';
    const detailPart = [meas, c.time].filter(Boolean).join(' · ');
    const line = `${i + 1}. ${c.species}${detailPart ? `  ${detailPart}` : ''}${anglerPart}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    drawWrappedText(ctx, line, textX, rowY, cardW - 64, 30, 1);
    rowY += 38;
  }
  if (session.catches.length > MAX_SUMMARY_CATCHES) {
    ctx.fillStyle = 'rgba(240, 165, 0, 0.80)';
    ctx.fillText(t('story.more_catches', { count: session.catches.length - MAX_SUMMARY_CATCHES }), textX, rowY);
  }

  // ── Session meta ───────────────────────────────────────────────────────────
  const metaY = Math.min(statsCardY + statsCardH + 44, 1620);
  drawSessionMeta(ctx, session, t, metaY);

  // ── Attribution ────────────────────────────────────────────────────────────
  drawOsmAttribution(ctx);

  return toBlob(canvas);
}

// ── Public export ─────────────────────────────────────────────────────────────

export async function exportSessionStoryImages(
  session: FishingSession,
  t: TFunction,
  profiles: Profile[] = [],
): Promise<void> {
  const zip = new JSZip();
  const datePart = sanitizeFilePart(session.date || 'session');
  const idPart   = sanitizeFilePart(session.id.slice(0, 8));

  const summaryBlob = await createSummaryImage(session, t, profiles);
  zip.file(`story-${datePart}-${idPart}-summary.png`, summaryBlob);

  for (const [index, catchEntry] of session.catches.entries()) {
    const catchBlob = await createCatchImage(session, catchEntry, index, t, profiles);
    const speciesPart = sanitizeFilePart(catchEntry.species || 'unknown-species') || 'species';
    zip.file(`story-${datePart}-${idPart}-catch-${index + 1}-${speciesPart}.png`, catchBlob);
  }

  const archive = await zip.generateAsync({ type: 'blob' });
  triggerDownload(archive, `story-${datePart}-${idPart}.zip`);
}
