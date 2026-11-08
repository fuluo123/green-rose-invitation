"""Render an original quiet piano sketch; numpy + lameenc 1.8.4.
Install the encoder into .audio-build-tools (build-time only), then run this file.
No samples or third-party melody are used.
"""
from pathlib import Path
import sys
import numpy as np

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / '.audio-build-tools'))
import lameenc

sr = 22050
beat = 60 / 72
length = 16 * 4 * beat + 5
mix = np.zeros((int(length * sr), 2), dtype=np.float64)

def note(midi, start, gain, pan=0.5, sustain=4.5):
    t = np.arange(int(sustain * sr)) / sr
    frequency = 440 * 2 ** ((midi - 69) / 12)
    wave = np.zeros_like(t)
    for harmonic, weight in enumerate([1, .23, .10, .045, .021, .008], 1):
        wave += weight * np.sin(2 * np.pi * frequency * harmonic * (1 + .00012 * harmonic ** 2) * t) * np.exp(-t * (.85 + harmonic * .12))
    wave *= (1 - np.exp(-t * 110)) * np.minimum(1, (sustain - t) / .25) * gain
    stereo = wave[:, None] * np.array([np.sqrt(1-pan), np.sqrt(pan)])
    offset = int(start * sr)
    for delay, level in [(0, 1), (.13, .12), (.27, .10), (.43, .07), (.67, .04)]:
        first = offset + int(delay * sr)
        count = min(len(stereo), len(mix) - first)
        if count > 0:
            mix[first:first+count] += stereo[:count] * level

chords = [[48,55,59,64], [45,52,55,60], [41,48,57,60], [43,50,57,62],
          [48,55,59,64], [40,47,55,62], [41,48,55,60], [43,50,57,62]]
melody = [[76,74,71], [72,76,79], [77,76,72], [74,71,69],
          [76,79,74], [71,74,76], [72,69,67], [74,71,72],
          [79,76,74], [76,72,69], [77,72,76], [74,69,71],
          [76,74,71], [74,71,67], [72,76,69], [71,74,72]]
for bar in range(16):
    start = bar * 4 * beat
    chord = chords[bar % 8]
    note(chord[0], start, .11, .35, 5)
    for step, pitch in enumerate([chord[1], chord[2], chord[3], chord[2]]):
        note(pitch, start + step * beat, .075, .40 + step * .08)
    for pitch, offset in zip(melody[bar], [.5, 2, 3.25]):
        note(pitch, start + offset * beat, .085, .60, 4)
mix *= .48 / np.max(np.abs(mix))
fade = int(2 * sr)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
pcm = np.clip(mix * 32767, -32768, 32767).astype('<i2').tobytes()
encoder = lameenc.Encoder()
encoder.set_bit_rate(96)
encoder.set_in_sample_rate(sr)
encoder.set_channels(2)
encoder.set_quality(2)
target = root / 'src/assets/weekend-nocturne.mp3'
target.write_bytes(encoder.encode(pcm) + encoder.flush())
print(f'{target.name}: {length:.1f}s, {target.stat().st_size} bytes')
