import JSZip from 'jszip';
import type { TFunction } from 'i18next';
import type { Catch, FishingSession } from '../types';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const MIN_MAP_SPAN = 0.001;
const MAX_SUMMARY_CATCHES = 14;
const MAX_CATCH_NOTES_LINES = 10;

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
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  return { canvas, ctx };
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not render image'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

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
      current = word;
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
  for (const [index, line] of lines.entries()) {
    ctx.fillText(line, x, y + index * lineHeight);
  }
  return lines.length;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function mapWeatherConditionLabel(session: FishingSession, t: TFunction): string | null {
  const condition = session.weather.condition;
  if (!condition) return null;
  const map: Record<string, string> = {
    sunny: 'conditions.sunny',
    'partly-cloudy': 'conditions.partly_cloudy',
    cloudy: 'conditions.cloudy',
    rainy: 'conditions.rainy',
    stormy: 'conditions.stormy',
  };
  const key = map[condition];
  return key ? t(key) : null;
}

function mapWaterConditionLabel(session: FishingSession, t: TFunction): string | null {
  const clarity = session.water.clarity;
  if (!clarity) return null;
  const map: Record<string, string> = {
    clear: 'conditions.clear',
    'slightly-murky': 'conditions.slightly_murky',
    murky: 'conditions.murky',
  };
  const key = map[clarity];
  return key ? t(key) : null;
}

function mapWaterLevelLabel(session: FishingSession, t: TFunction): string | null {
  const level = session.water.level;
  if (!level) return null;
  const map: Record<string, string> = {
    low: 'conditions.level_low',
    normal: 'conditions.level_normal',
    high: 'conditions.level_high',
  };
  const key = map[level];
  return key ? t(key) : null;
}

function mapCurrentLabel(session: FishingSession, t: TFunction): string | null {
  const current = session.water.current;
  if (!current) return null;
  const map: Record<string, string> = {
    still: 'conditions.current_still',
    slow: 'conditions.current_slow',
    moderate: 'conditions.current_moderate',
    fast: 'conditions.current_fast',
  };
  const key = map[current];
  return key ? t(key) : null;
}

function drawSummaryMap(ctx: CanvasRenderingContext2D, session: FishingSession, t: TFunction): void {
  const mapX = 70;
  const mapY = 420;
  const mapW = 940;
  const mapH = 420;
  const pad = 40;
  const innerX = mapX + pad;
  const innerY = mapY + pad;
  const innerW = mapW - pad * 2;
  const innerH = mapH - pad * 2;

  ctx.fillStyle = '#f4f7fb';
  ctx.fillRect(mapX, mapY, mapW, mapH);
  ctx.strokeStyle = '#d6deea';
  ctx.lineWidth = 3;
  ctx.strokeRect(mapX, mapY, mapW, mapH);

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 34px Inter, sans-serif';
  ctx.fillText(t('story.summary_map'), mapX + 24, mapY + 52);

  ctx.strokeStyle = '#dbe4f0';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    const y = innerY + (innerH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(innerX, y);
    ctx.lineTo(innerX + innerW, y);
    ctx.stroke();
  }
  for (let i = 1; i <= 5; i += 1) {
    const x = innerX + (innerW * i) / 6;
    ctx.beginPath();
    ctx.moveTo(x, innerY);
    ctx.lineTo(x, innerY + innerH);
    ctx.stroke();
  }

  const batches = new Map<string, { lat: number; lng: number; count: number }>();
  for (const catchEntry of session.catches) {
    if (!catchEntry.location) continue;
    const lat = catchEntry.location.lat;
    const lng = catchEntry.location.lng;
    const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
    const existing = batches.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      batches.set(key, { lat, lng, count: 1 });
    }
  }

  const points = [...batches.values()];
  if (points.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 28px Inter, sans-serif';
    ctx.fillText(t('story.no_map_points'), mapX + 24, mapY + 212);
    return;
  }

  const minLat = Math.min(...points.map((p) => p.lat));
  const maxLat = Math.max(...points.map((p) => p.lat));
  const minLng = Math.min(...points.map((p) => p.lng));
  const maxLng = Math.max(...points.map((p) => p.lng));
  const latSpan = Math.max(maxLat - minLat, MIN_MAP_SPAN);
  const lngSpan = Math.max(maxLng - minLng, MIN_MAP_SPAN);

  for (const point of points) {
    const x = innerX + ((point.lng - minLng) / lngSpan) * innerW;
    const y = innerY + (1 - (point.lat - minLat) / latSpan) * innerH;

    ctx.beginPath();
    ctx.fillStyle = '#ff7f0e';
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(point.count), x, y);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
}

async function createSummaryImage(session: FishingSession, t: TFunction): Promise<Blob> {
  const { canvas, ctx } = createStoryCanvas();
  ctx.fillStyle = '#0b1f3b';
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  ctx.fillStyle = '#132e56';
  ctx.fillRect(0, 300, STORY_WIDTH, STORY_HEIGHT - 300);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 54px Inter, sans-serif';
  ctx.fillText(t('story.summary_title'), 70, 110);
  ctx.font = '500 30px Inter, sans-serif';
  const titleLocation = session.location.locationName || session.location.canton || t('map.unknown_location');
  ctx.fillText(titleLocation, 70, 160);

  ctx.font = '400 28px Inter, sans-serif';
  const duration = formatDuration(session.startTime, session.endTime);
  const details = [
    `${t('story.date')}: ${session.date}`,
    `${t('story.time')}: ${session.startTime}${session.endTime ? ` - ${session.endTime}` : ''}`,
    duration ? `${t('story.duration')}: ${duration}` : null,
  ].filter(Boolean) as string[];
  for (const [i, detail] of details.entries()) {
    ctx.fillText(detail, 70, 220 + i * 38);
  }

  drawSummaryMap(ctx, session, t);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 34px Inter, sans-serif';
  ctx.fillText(t('story.summary_conditions'), 70, 930);
  ctx.font = '400 28px Inter, sans-serif';

  const conditionLines = [
    session.weather.temperature != null ? `${t('conditions.air_temp')}: ${session.weather.temperature}°C` : null,
    mapWeatherConditionLabel(session, t) ? `${t('story.weather')}: ${mapWeatherConditionLabel(session, t)}` : null,
    session.water.temperature != null ? `${t('conditions.water_temp')}: ${session.water.temperature}°C` : null,
    mapWaterConditionLabel(session, t) ? `${t('conditions.water_clarity')}: ${mapWaterConditionLabel(session, t)}` : null,
    mapWaterLevelLabel(session, t) ? `${t('conditions.water_level')}: ${mapWaterLevelLabel(session, t)}` : null,
    mapCurrentLabel(session, t) ? `${t('conditions.current')}: ${mapCurrentLabel(session, t)}` : null,
  ].filter(Boolean) as string[];

  if (conditionLines.length === 0) {
    ctx.fillText('—', 70, 972);
  } else {
    for (const [i, line] of conditionLines.entries()) {
      ctx.fillText(line, 70, 972 + i * 36);
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 34px Inter, sans-serif';
  ctx.fillText(t('story.summary_catches'), 70, 1240);
  ctx.font = '400 28px Inter, sans-serif';
  if (session.catches.length === 0) {
    ctx.fillText(t('story.no_catches'), 70, 1284);
  } else {
    for (const [index, catchEntry] of session.catches.slice(0, MAX_SUMMARY_CATCHES).entries()) {
      const weight = catchEntry.weight != null ? `${catchEntry.weight}g` : null;
      const length = catchEntry.length != null ? `${catchEntry.length}cm` : null;
      const measurements = [length, weight].filter(Boolean).join(' · ');
      const releaseLabel = catchEntry.released ? t('story.catch_released') : t('story.catch_kept');
      const detailsLine = [measurements, catchEntry.time, releaseLabel].filter(Boolean).join(' · ');
      const text = `${index + 1}. ${catchEntry.species}${detailsLine ? ` — ${detailsLine}` : ''}`;
      ctx.fillText(text, 70, 1284 + index * 40);
    }
  }

  return toBlob(canvas);
}

async function drawCatchPhoto(
  ctx: CanvasRenderingContext2D,
  catchEntry: Catch,
  t: TFunction,
): Promise<void> {
  const frameX = 70;
  const frameY = 470;
  const frameW = 940;
  const frameH = 780;

  ctx.fillStyle = '#f4f7fb';
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.strokeStyle = '#d6deea';
  ctx.lineWidth = 3;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  const primaryPhoto = catchEntry.photos?.[0];
  if (!primaryPhoto) {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 30px Inter, sans-serif';
    ctx.fillText(t('story.catch_photo_missing'), frameX + 40, frameY + frameH / 2);
    return;
  }

  try {
    const image = await loadImage(primaryPhoto);
    const ratio = Math.min(frameW / image.width, frameH / image.height);
    const drawW = image.width * ratio;
    const drawH = image.height * ratio;
    const drawX = frameX + (frameW - drawW) / 2;
    const drawY = frameY + (frameH - drawH) / 2;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
  } catch {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 30px Inter, sans-serif';
    ctx.fillText(t('story.catch_photo_missing'), frameX + 40, frameY + frameH / 2);
  }
}

async function createCatchImage(
  session: FishingSession,
  catchEntry: Catch,
  index: number,
  t: TFunction,
): Promise<Blob> {
  const { canvas, ctx } = createStoryCanvas();
  ctx.fillStyle = '#0b1f3b';
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  ctx.fillStyle = '#132e56';
  ctx.fillRect(0, 280, STORY_WIDTH, STORY_HEIGHT - 280);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 50px Inter, sans-serif';
  ctx.fillText(`${t('story.catch_title')} ${index + 1}`, 70, 104);

  ctx.font = '700 60px Inter, sans-serif';
  ctx.fillText(catchEntry.species, 70, 188);

  ctx.font = '400 30px Inter, sans-serif';
  const detailRows = [
    `${t('story.catch_time')}: ${catchEntry.time}`,
    catchEntry.weight != null ? `${t('catch.weight_label')}: ${catchEntry.weight} g` : null,
    catchEntry.length != null ? `${t('catch.length_label')}: ${catchEntry.length} cm` : null,
    `${catchEntry.released ? t('story.catch_released') : t('story.catch_kept')}`,
    catchEntry.location
      ? `${t('story.catch_location')}: ${catchEntry.location.locationName ?? `${catchEntry.location.lat.toFixed(5)}, ${catchEntry.location.lng.toFixed(5)}`}`
      : session.location.locationName
        ? `${t('story.session_location')}: ${session.location.locationName}`
        : null,
  ].filter(Boolean) as string[];

  for (const [rowIndex, row] of detailRows.entries()) {
    ctx.fillText(row, 70, 236 + rowIndex * 40);
  }

  await drawCatchPhoto(ctx, catchEntry, t);

  if (catchEntry.notes) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 32px Inter, sans-serif';
    ctx.fillText(t('story.catch_notes'), 70, 1340);
    ctx.font = '400 28px Inter, sans-serif';
    drawWrappedText(ctx, catchEntry.notes, 70, 1380, 940, 36, MAX_CATCH_NOTES_LINES);
  }

  return toBlob(canvas);
}

export async function exportSessionStoryImages(session: FishingSession, t: TFunction): Promise<void> {
  const zip = new JSZip();
  const datePart = sanitizeFilePart(session.date || 'session');
  const idPart = sanitizeFilePart(session.id.slice(0, 8));

  const summaryBlob = await createSummaryImage(session, t);
  zip.file(`story-${datePart}-${idPart}-summary.png`, summaryBlob);

  for (const [index, catchEntry] of session.catches.entries()) {
    const catchBlob = await createCatchImage(session, catchEntry, index, t);
    const speciesPart = sanitizeFilePart(catchEntry.species || `catch-${index + 1}`);
    zip.file(`story-${datePart}-${idPart}-catch-${index + 1}-${speciesPart}.png`, catchBlob);
  }

  const archive = await zip.generateAsync({ type: 'blob' });
  triggerDownload(archive, `story-${datePart}-${idPart}.zip`);
}
