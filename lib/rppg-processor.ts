/**
 * rPPG Signal Processor
 *
 * Extracts heart rate (BPM) and HRV from webcam video using the CHROM algorithm.
 * CHROM (Chrominance-based) method isolates the blood volume pulse signal
 * from subtle skin color fluctuations in the RGB channels.
 *
 * Reference: De Haan & Jeanne (2013) "Robust Pulse Rate From Chrominance-Based rPPG"
 */

const SAMPLE_RATE = 30; // Expected camera FPS
const BUFFER_SECONDS = 10;
const BUFFER_SIZE = SAMPLE_RATE * BUFFER_SECONDS;
const MIN_BPM = 45;
const MAX_BPM = 150;
const MIN_HZ = MIN_BPM / 60;
const MAX_HZ = MAX_BPM / 60;
const SMOOTHING_WINDOW = 5; // Rolling average over last N valid readings

export interface RppgResult {
  bpm: number;
  hrv: number; // RMSSD in ms
  spo2: number; // Estimated SpO2 % (approximate, not medical-grade)
  confidence: number; // 0-1
  stressLevel: 'low' | 'moderate' | 'high';
  signal: number[]; // Last N samples of the pulse signal for visualization
}

export class RppgProcessor {
  private rBuffer: number[] = [];
  private gBuffer: number[] = [];
  private bBuffer: number[] = [];
  private timestamps: number[] = [];
  private lastResult: RppgResult | null = null;
  private bpmHistory: number[] = [];
  private hrvHistory: number[] = [];
  private spo2History: number[] = [];

  /**
   * Add an RGB sample from a skin ROI.
   * @param r Average red channel value (0-255)
   * @param g Average green channel value (0-255)
   * @param b Average blue channel value (0-255)
   */
  addSample(r: number, g: number, b: number): void {
    this.rBuffer.push(r);
    this.gBuffer.push(g);
    this.bBuffer.push(b);
    this.timestamps.push(performance.now());

    // Keep buffer at max size
    if (this.rBuffer.length > BUFFER_SIZE) {
      this.rBuffer.shift();
      this.gBuffer.shift();
      this.bBuffer.shift();
      this.timestamps.shift();
    }
  }

  /**
   * Process the current buffer and return heart rate + HRV.
   * Requires at least 5 seconds of data.
   */
  process(): RppgResult | null {
    if (this.rBuffer.length < SAMPLE_RATE * 3) {
      return this.lastResult;
    }

    // Step 1: Normalize RGB channels
    const n = this.rBuffer.length;
    const rMean = mean(this.rBuffer);
    const gMean = mean(this.gBuffer);
    const bMean = mean(this.bBuffer);

    if (rMean === 0 || gMean === 0 || bMean === 0) return this.lastResult;

    const rNorm = this.rBuffer.map((v) => v / rMean);
    const gNorm = this.gBuffer.map((v) => v / gMean);
    const bNorm = this.bBuffer.map((v) => v / bMean);

    // Step 2: CHROM algorithm
    // S1 = 3R - 2G, S2 = 1.5R + G - 1.5B
    const s1 = rNorm.map((r, i) => 3 * r - 2 * gNorm[i]);
    const s2 = rNorm.map((r, i) => 1.5 * r + gNorm[i] - 1.5 * bNorm[i]);

    // Bandpass filter both signals
    const s1Filtered = bandpassFilter(s1, this.getActualSampleRate(), MIN_HZ, MAX_HZ);
    const s2Filtered = bandpassFilter(s2, this.getActualSampleRate(), MIN_HZ, MAX_HZ);

    // Combine: pulse = S1 - (std(S1)/std(S2)) * S2
    const stdS1 = std(s1Filtered);
    const stdS2 = std(s2Filtered);
    const alpha = stdS2 > 0 ? stdS1 / stdS2 : 1;

    const pulse = s1Filtered.map((v, i) => v - alpha * s2Filtered[i]);

    // Step 3: FFT to find dominant frequency
    const actualRate = this.getActualSampleRate();
    const { frequency, confidence } = dominantFrequency(pulse, actualRate, MIN_HZ, MAX_HZ);
    const rawBpm = Math.round(frequency * 60);

    // Clamp BPM to physiological range and require minimum confidence
    if (rawBpm < MIN_BPM || rawBpm > MAX_BPM || confidence < 0.2) {
      return this.lastResult;
    }

    // Step 4: Peak detection for HRV
    const hrv = calculateHRV(pulse, actualRate);

    // Step 5: SpO2 estimation via red/blue perfusion ratio
    // R_ratio = (AC_red/DC_red) / (AC_blue/DC_blue), SpO2 ≈ 110 - 25*R (empirical)
    const rFiltered = bandpassFilter(rNorm, actualRate, MIN_HZ, MAX_HZ);
    const bFiltered = bandpassFilter(bNorm, actualRate, MIN_HZ, MAX_HZ);
    const acRed = std(rFiltered);
    const dcRed = mean(rNorm);
    const acBlue = std(bFiltered);
    const dcBlue = mean(bNorm);
    let spo2 = 98; // default to normal
    if (acBlue > 0 && dcBlue > 0 && dcRed > 0) {
      const R = (acRed / dcRed) / (acBlue / dcBlue);
      const raw = Math.round(110 - 25 * R);
      spo2 = Math.min(100, Math.max(85, raw));
    }

    // Step 6: Temporal smoothing — rolling average over last N readings
    this.bpmHistory.push(rawBpm);
    this.hrvHistory.push(hrv);
    this.spo2History.push(spo2);
    if (this.bpmHistory.length > SMOOTHING_WINDOW) this.bpmHistory.shift();
    if (this.hrvHistory.length > SMOOTHING_WINDOW) this.hrvHistory.shift();
    if (this.spo2History.length > SMOOTHING_WINDOW) this.spo2History.shift();

    const smoothedBpm = Math.round(mean(this.bpmHistory));
    const smoothedHrv = Math.round(mean(this.hrvHistory));
    const smoothedSpo2 = Math.round(mean(this.spo2History));

    // Step 7: Stress level from HRV
    let stressLevel: RppgResult['stressLevel'] = 'low';
    if (smoothedHrv < 30) stressLevel = 'high';
    else if (smoothedHrv < 50) stressLevel = 'moderate';

    const result: RppgResult = {
      bpm: smoothedBpm,
      hrv: smoothedHrv,
      spo2: smoothedSpo2,
      confidence,
      stressLevel,
      signal: pulse.slice(-60), // Last 2 seconds for visualization
    };

    this.lastResult = result;
    return result;
  }

  private getActualSampleRate(): number {
    if (this.timestamps.length < 2) return SAMPLE_RATE;
    const totalMs = this.timestamps[this.timestamps.length - 1] - this.timestamps[0];
    return ((this.timestamps.length - 1) / totalMs) * 1000;
  }

  reset(): void {
    this.rBuffer = [];
    this.gBuffer = [];
    this.bBuffer = [];
    this.timestamps = [];
    this.lastResult = null;
    this.bpmHistory = [];
    this.hrvHistory = [];
    this.spo2History = [];
  }
}

// --- Signal Processing Utilities ---

function mean(arr: number[]): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) sumSq += (arr[i] - m) ** 2;
  return Math.sqrt(sumSq / arr.length);
}

/**
 * Simple bandpass filter using cascaded moving average subtraction.
 */
function bandpassFilter(
  signal: number[],
  sampleRate: number,
  lowHz: number,
  highHz: number
): number[] {
  // High-pass: subtract moving average (removes DC + low freq)
  const highPassWindow = Math.round(sampleRate / lowHz);
  const highPassed = subtractMovingAverage(signal, highPassWindow);

  // Low-pass: moving average (removes high freq noise)
  const lowPassWindow = Math.max(2, Math.round(sampleRate / highHz / 2));
  return movingAverage(highPassed, lowPassWindow);
}

function movingAverage(signal: number[], window: number): number[] {
  const result = new Array(signal.length).fill(0);
  let sum = 0;
  for (let i = 0; i < signal.length; i++) {
    sum += signal[i];
    if (i >= window) sum -= signal[i - window];
    const count = Math.min(i + 1, window);
    result[i] = sum / count;
  }
  return result;
}

function subtractMovingAverage(signal: number[], window: number): number[] {
  const ma = movingAverage(signal, window);
  return signal.map((v, i) => v - ma[i]);
}

/**
 * Find dominant frequency using autocorrelation (more robust than FFT for short signals).
 */
function dominantFrequency(
  signal: number[],
  sampleRate: number,
  minHz: number,
  maxHz: number
): { frequency: number; confidence: number } {
  const n = signal.length;
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(n - 1, Math.ceil(sampleRate / minHz));

  if (minLag >= maxLag || maxLag >= n) {
    return { frequency: 0, confidence: 0 };
  }

  // Compute normalized autocorrelation
  let energy = 0;
  for (let i = 0; i < n; i++) energy += signal[i] * signal[i];
  if (energy === 0) return { frequency: 0, confidence: 0 };

  let bestLag = minLag;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < n - lag; i++) {
      corr += signal[i] * signal[i + lag];
    }
    corr /= energy;

    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  const frequency = sampleRate / bestLag;
  const confidence = Math.max(0, Math.min(1, bestCorr));

  return { frequency, confidence };
}

/**
 * Calculate HRV (RMSSD) from peak-to-peak intervals.
 */
function calculateHRV(signal: number[], sampleRate: number): number {
  // Find peaks
  const peaks: number[] = [];
  for (let i = 2; i < signal.length - 2; i++) {
    if (
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i - 2] &&
      signal[i] > signal[i + 1] &&
      signal[i] > signal[i + 2] &&
      signal[i] > 0
    ) {
      // Minimum distance between peaks (~45 BPM)
      if (peaks.length === 0 || i - peaks[peaks.length - 1] > sampleRate / 3) {
        peaks.push(i);
      }
    }
  }

  if (peaks.length < 3) return 50; // Default moderate HRV

  // Calculate R-R intervals in ms
  const rrIntervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const intervalMs = ((peaks[i] - peaks[i - 1]) / sampleRate) * 1000;
    // Filter physiologically plausible intervals (333ms to 1333ms = 45-180 BPM)
    if (intervalMs > 333 && intervalMs < 1333) {
      rrIntervals.push(intervalMs);
    }
  }

  if (rrIntervals.length < 2) return 50;

  // RMSSD: Root Mean Square of Successive Differences
  let sumSqDiff = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSqDiff += diff * diff;
  }

  return Math.sqrt(sumSqDiff / (rrIntervals.length - 1));
}
