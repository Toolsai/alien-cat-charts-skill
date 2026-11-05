#!/usr/bin/env python3
"""Generate assets/audio/ambient.wav — a tiny seamless loop: soft UFO hum + slow 'flying' wobble + star twinkles.
100% synthesized (original, no samples, no copyrighted music). 8 s, 11.025 kHz, mono, 16-bit  (~176 KB).
Usage: python3 scripts/make_audio.py [out.wav]      Needs: numpy.   Loop is seamless because every
periodic part uses a whole number of cycles per loop and twinkle tails wrap around."""
import numpy as np, wave, sys, os
SR, T = 11025, 8.0
N = int(SR * T); t = np.arange(N) / SR
rng = np.random.default_rng(42)
def cyc(f): return round(f * T) / T          # snap to whole cycles per loop => seamless
# 1) hum: detuned low sines + slow vibrato (FM) -> "saucer idle"
lfo = np.sin(2 * np.pi * cyc(0.25) * t)
hum = 0.0
for f, a in [(cyc(98), .5), (cyc(98.5), .35), (cyc(147), .18), (cyc(196.25), .08)]:
    hum = hum + a * np.sin(2 * np.pi * f * t + 1.8 * lfo * (f / 98))
hum *= 0.55 + 0.25 * np.sin(2 * np.pi * cyc(0.125) * t)        # slow swell
# 2) airy shimmer: filtered noise made periodic (via FFT band-limit), slow tremolo
spec = np.fft.rfft(rng.standard_normal(N)); fr = np.fft.rfftfreq(N, 1 / SR)
spec *= np.exp(-((fr - 1400) / 700) ** 2); air = np.fft.irfft(spec, N); air /= np.abs(air).max()
air *= 0.10 * (0.6 + 0.4 * np.sin(2 * np.pi * cyc(0.375) * t + 1))
# 3) twinkles: short decaying high sine pairs at random times, wrapped
tw = np.zeros(N)
for k in range(11):
    t0 = rng.uniform(0, T); f = rng.choice([1319, 1568, 1760, 2093, 2637, 3136]) * rng.choice([1, 1, .5])
    d = (t - t0) % T; env = np.exp(-d * rng.uniform(5, 9)) * (1 - np.exp(-d * 300))
    tw += rng.uniform(.05, .13) * env * (np.sin(2 * np.pi * f * d) + .4 * np.sin(2 * np.pi * f * 2.01 * d))
x = hum * 0.5 + air + tw
x = x / np.abs(x).max() * 0.55                                  # gentle level
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'audio', 'ambient.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
print(out, os.path.getsize(out) // 1024, 'KB')
