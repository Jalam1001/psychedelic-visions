import sys, json, base64, numpy as np
sys.path.insert(0, '/workspace/pv-audio')
from synth import *

def scale_freqs(root, steps, octaves=3):
    return [root * 2 ** (o + s / 12) for o in range(octaves) for s in steps]

def melody_walk(rng, nsteps, lo, hi, start):
    i = start; out = []
    for _ in range(nsteps):
        i = int(np.clip(i + rng.choice([-2, -1, -1, 0, 1, 1, 2]), lo, hi)); out.append(i)
    return out

# ---------------- 1. Amazonian night ----------------
def amazon(D=64.0):
    rng = np.random.default_rng(11); M = Mix(D); N = M.N
    # rainforest bed: soft rain hiss + low wind, slowly breathing (periodic LFOs)
    rain = circ_noise(N, lambda f: np.exp(-((np.log(np.maximum(f, 1)) - np.log(5000)) ** 2) / 0.9), rng)
    wind = circ_noise(N, lambda f: 1 / (1 + (f / 350) ** 2), rng)
    bed = rain * 0.035 * (1 + 0.3 * circ_lfo(N, D, 2)) + wind * 0.08 * (1 + 0.5 * circ_lfo(N, D, 1, 1.0))
    M.add(np.vstack([bed, np.roll(bed, 9000)]))
    for _ in range(70): M.add(cricket(rng, rng.uniform(0.4, 0.9)), rng.uniform(0, D), rng.uniform(-0.9, 0.9), 0.2)
    for _ in range(26): M.add(frog(rng), rng.uniform(0, D), rng.uniform(-0.8, 0.8), 0.5)
    # low drone A2 + E3 (whole cycles -> seamless)
    t = np.arange(N) / SR
    dr = sum(a * np.sin(TAU * cyc(f, D) * t) for f, a in [(110, .4), (165, .25), (220, .25), (330, .15), (440, .08)])
    M.add(dr * 0.16 * (0.8 + 0.2 * circ_lfo(N, D, 4)))
    # chakapa leaf-bundle shaker: steady pulse in 6/8 feel, 84 bpm dotted
    beat = 60 / 84
    for k in range(int(D / (beat / 2))):
        acc = [1, .45, .6, .8, .45, .6][k % 6]
        M.add(drum('shaker', rng, acc * rng.uniform(0.8, 1.1)), k * beat / 2 + rng.normal(0, 0.006), -0.15, 0.6)
    # original icaro-like whistled melody (A minor pentatonic), phrases with rests
    sc = scale_freqs(220, [0, 3, 5, 7, 10], 3)
    phr_t = 2.0; idx = 6
    while phr_t < D - 4:
        notes = melody_walk(rng, rng.integers(4, 8), 3, 12, idx); idx = notes[-1]
        tt = phr_t
        for j, ni in enumerate(notes):
            d = rng.choice([beat, beat, beat * 1.5, beat * 2])
            gl = sc[notes[j - 1]] if j and rng.random() < 0.4 else None
            M.add(flute(sc[ni] * 2, d * 0.95, rng, 0.55, breath=0.22, glide_from=gl * 2 if gl else None), tt, 0.1)
            tt += d
        phr_t = tt + rng.uniform(2.5, 5.0)
    M.buf = M.buf + 0.35 * circ_reverb(M.buf, make_ir(3.2, 0.03, 5000))
    return M

# ---------------- 2. Kaleidoscope bloom ----------------
def kaleido(D=64.0):
    rng = np.random.default_rng(22); M = Mix(D); A = Mix(D)
    bpm = 120; b = 60 / bpm
    prog = [[50, 57, 62, 66, 69], [52, 59, 64, 68, 71], [47, 54, 59, 62, 66], [45, 52, 57, 61, 64]]  # D lydian-ish colours
    for bar in range(int(D / (4 * b) / 2)):
        ch = prog[bar % 4]; t0 = bar * 8 * b
        for m in ch[:4]: M.add(pad_note(hz(m), 8 * b, rng, 1600, 3, 11, 1.2, 2.5), t0, rng.uniform(-.5, .5), 0.11)
        M.add(pad_note(hz(ch[0] - 12), 8 * b, rng, 500, 2, 6, 0.4, 1.0, 'sine'), t0, 0, 0.07)
        pattern = [0, 2, 3, 4, 3, 2, 1, 2]
        for s in range(32):
            if rng.random() < 0.12: continue
            m = ch[pattern[s % 8] % len(ch)] + 12 * (1 + (s // 8) % 2)
            A.add(soft_arp(hz(m), 0.6, rng), t0 + s * b / 4, np.sin(s * 0.7) * 0.6, 0.22 * (0.7 + 0.3 * (s % 4 == 0)))
        for s in range(0, 8, 2): M.add(drum('kick', rng, 0.35), t0 + s * b, 0, 0.3)
        for s in range(8):
            if rng.random() < 0.5: M.add(fm_bell(hz(ch[rng.integers(0, 5)] + 24), 2.5, rng, 3.5, 1.5, 1.6), t0 + s * b + b / 2, rng.uniform(-.8, .8), 0.05)
    A.buf = circ_delay(A.buf, 3 * b / 4, 0.38, 6)
    M.addmix(A)
    M.buf = M.buf + 0.4 * circ_reverb(M.buf, make_ir(3.5, 0.02, 7000))
    return M

# ---------------- 3. Fractal depths ----------------
def fractal(D=64.0):
    rng = np.random.default_rng(33); M = Mix(D); N = M.N; t = np.arange(N) / SR
    root = 55.0
    sweep = 0.5 + 0.5 * circ_lfo(N, D, 2)
    dr = np.zeros(N)
    for k in range(1, 28):
        f = cyc(root * k, D)
        a = (1 / k) * (0.3 + 0.7 * np.exp(-((k - 2 - 12 * sweep) ** 2) / 8))     # moving resonance
        dr += a * np.sin(TAU * f * t + k)
    fifth = sum((1 / k) * np.sin(TAU * cyc(root * 1.5 * k, D) * t) for k in range(1, 8))
    M.add(dr * 0.11 + fifth * 0.04 * (1 + circ_lfo(N, D, 3)) * 0.5)
    sh = circ_noise(N, lambda f: np.exp(-((f - 3000) / 1500) ** 2), rng) * 0.035 * (0.5 + 0.5 * circ_lfo(N, D, 5))
    M.add(np.vstack([sh, np.roll(sh, 7000)]))
    # self-similar bell blooms: each strike echoes at golden-ratio intervals, each echo a fifth/octave higher & softer
    phi = 1.618
    for t0 in np.arange(0, D, 8.0):
        f = root * 4 * rng.choice([1, 1.5, 2, 2.25, 1.333]); tt = t0; g = 0.4
        for lvl in range(5):
            M.add(fm_bell(f, 5, rng, 1.4, 2.0, 3.5), tt, rng.uniform(-.7, .7), g)
            tt += phi ** (3 - lvl) * 0.5; f *= 1.5 if lvl % 2 == 0 else 4 / 3; g *= 0.62
            if f > 3000: f /= 4
    M.buf = M.buf + 0.5 * circ_reverb(M.buf, make_ir(5.5, 0.04, 4500))
    return M

# ---------------- 4. Sufi ney & daf (Hijaz on D) ----------------
def sufi(D=64.0):
    rng = np.random.default_rng(44); M = Mix(D); N = M.N; t = np.arange(N) / SR
    bpm = 90; b = 60 / bpm
    dr = sum(a * np.sin(TAU * cyc(f, D) * t) for f, a in [(73.42, .3), (146.83, .35), (220.0, .3), (293.66, .25), (440.0, .1), (587.3, .05)])
    M.add(dr * 0.11 * (0.85 + 0.15 * circ_lfo(N, D, 4)))
    # daf: maqsum-like D T - T D - T -
    pat = [('dum', 1), ('tek', .7), (None, 0), ('tek', .5), ('dum', .8), (None, 0), ('tek', .7), (None, 0)]
    for bar in range(int(D / (4 * b))):
        for i, (k, v) in enumerate(pat):
            tt = bar * 4 * b + i * b / 2
            if k: M.add(drum(k, rng, v * rng.uniform(.85, 1.05), f=110.0), tt + rng.normal(0, 0.005), -0.1, 0.4 if k == 'dum' else 0.9)
            if k or rng.random() < 0.3: M.add(drum('jingle', rng, 0.6), tt, 0.15, 0.7)
    hijaz = [0, 1, 4, 5, 7, 8, 10]
    sc = scale_freqs(293.66, hijaz, 2) + [1174.7]
    phr = 4 * b; idx = 4
    while phr < D - 4 * b:
        notes = melody_walk(rng, rng.integers(3, 7), 0, 13, idx); idx = notes[-1]; tt = phr
        for j, ni in enumerate(notes):
            d = b * rng.choice([1, 2, 2, 3])
            gl = sc[notes[j - 1]] if j and rng.random() < 0.5 else None
            M.add(ney(sc[ni], d, rng, 0.7, glide_from=gl), tt, 0.05)
            tt += d
        phr = tt + b * rng.integers(2, 5)
    M.buf = M.buf + 0.4 * circ_reverb(M.buf, make_ir(3.8, 0.03, 5000))
    return M

# ---------------- 5. Persian garden (santur-like, Shur-flavoured with a koron 2nd) ----------------
def persian(D=64.0):
    rng = np.random.default_rng(55); M = Mix(D); N = M.N
    bpm = 75; b = 60 / bpm
    stream = circ_noise(N, lambda f: np.exp(-((f - 1400) / 1100) ** 2) + 0.3 * np.exp(-((f - 4000) / 2000) ** 2), rng)
    stream *= 0.05 * (1 + 0.4 * circ_noise(N, lambda f: (f < 6) * 1.0, rng) * 0.3)
    M.add(np.vstack([stream, np.roll(stream, 15000)]))
    for _ in range(40):
        tb = rng.uniform(0, D); pan = rng.uniform(-.9, .9)
        for j in range(rng.integers(2, 6)): M.add(bird(rng), tb + j * rng.uniform(0.12, 0.25), pan, 0.5)
    G = 196.0
    shur = [0, 1.5, 3, 5, 7, 8, 10]       # semitones; 1.5 = koron (quarter-flat) second
    sc = [G * 2 ** (o + s / 12) for o in range(3) for s in shur]
    t0 = 0.0; idx = 7
    while t0 < D - 0.1:
        notes = melody_walk(rng, 8, 0, 18, idx); idx = notes[-1]
        for j, ni in enumerate(notes):
            tt = t0 + j * b / 2
            riz = rng.random() < 0.25
            if riz:   # santur tremolo (riz)
                for r in range(6): M.add(modal_pluck(sc[ni], 1.2, rng, 0.7, tau=1.0), tt + r * b / 12, 0.2, 0.12 * (0.7 + 0.3 * (r % 2)))
            else:
                M.add(modal_pluck(sc[ni], 2.5, rng, 0.65, tau=1.8), tt, 0.25, 0.22)
            if j % 4 == 0: M.add(modal_pluck(sc[max(0, ni - 7)] / 2 if ni > 7 else G / 2, 3.0, rng, 0.5, tau=2.5), tt, -0.3, 0.18)
        t0 += 4 * b + (2 * b if rng.random() < 0.3 else 0)
    M.buf = M.buf + 0.3 * circ_reverb(M.buf, make_ir(2.6, 0.02, 7000))
    return M

# ---------------- 6. Tibetan bowls & chant drone ----------------
def tibetan(D=64.0):
    rng = np.random.default_rng(66); M = Mix(D); N = M.N
    wind = circ_noise(N, lambda f: 1 / (1 + (f / 500) ** 2) * (f > 60), rng) * 0.06 * (1 + 0.6 * circ_lfo(N, D, 2))
    M.add(np.vstack([wind, np.roll(wind, 20000)]))
    f0 = 73.42
    for i, t0 in enumerate(np.arange(0, D, 8.0)):
        vs = [('m', 'o', 'u'), ('a', 'o', 'm'), ('o', 'u', 'm'), ('a', 'o', 'u')][i % 4]
        M.add(voice(f0, 9.0, rng, vs, 0.003, 2.0, 2.5), t0, -0.2, 0.32)
        M.add(voice(f0 * 1.5, 9.0, rng, vs[::-1], 0.003, 2.5, 2.5), t0 + 0.5, 0.25, 0.14)
    for t0, f in [(0.5, 196), (9, 293.7), (17.2, 220), (24, 196), (33, 349.2), (40.5, 293.7), (48, 220), (56.5, 261.6)]:
        M.add(bowl(f, 20, rng, True, 0.9), t0, rng.uniform(-.6, .6), 0.55)
    M.add(bowl(146.83, 30, rng, False, 0.8), 3.0, 0.0, 0.5)
    M.add(bowl(146.83 * 1.5, 30, rng, False, 0.6), 35.0, 0.3, 0.45)
    for t0 in [12.0, 44.0]:   # tingsha (two small cymbals)
        for d in (0, 0.03): M.add(fm_bell(2637, 5, rng, 1.47, 1.2, 2.5), t0 + d, rng.uniform(-.5, .5), 0.08)
    M.buf = M.buf + 0.5 * circ_reverb(M.buf, make_ir(5.0, 0.05, 4000))
    return M

# ---------------- 7. Tanpura & bansuri (Yaman-flavoured) ----------------
def tanpura(D=64.0):
    rng = np.random.default_rng(77); M = Mix(D)
    Sa = 138.59
    cycle = 3.2; pl = [(Sa * 0.75, -0.2), (Sa, 0.0), (Sa, 0.1), (Sa / 2, -0.1)]   # Pa Sa Sa Sa(low)
    k = 0
    for t0 in np.arange(0, D, cycle / 4):
        f, pan = pl[k % 4]; M.add(tanpura_pluck(f, 5.0, rng, rng.uniform(0.85, 1.0)), t0, pan, 1.0); k += 1
    yaman = [0, 2, 4, 6, 7, 9, 11]       # N R G M# P D N
    sc = scale_freqs(Sa * 2, yaman, 2) + [Sa * 8]
    tt = 4.0; idx = 7
    while tt < D - 6:
        notes = melody_walk(rng, rng.integers(3, 6), 0, 14, idx); idx = notes[-1]
        for j, ni in enumerate(notes):
            d = rng.choice([1.2, 1.8, 2.4, 3.2])
            gl = sc[notes[j - 1]] if j and rng.random() < 0.55 else None   # meend glides
            M.add(flute(sc[ni], d, rng, 0.38, breath=0.16, vib=0.005, glide_from=gl, att=0.12), tt, 0.05)
            tt += d
        tt += rng.uniform(2.5, 4.5)
    M.buf = M.buf + 0.35 * circ_reverb(M.buf, make_ir(3.0, 0.03, 6000))
    return M

# ---------------- 8. Sacred geometry: harmonic-series choir ----------------
def sacred(D=64.0):
    rng = np.random.default_rng(88); M = Mix(D); N = M.N; t = np.arange(N) / SR
    f0 = 65.41
    M.add(sum((1 / k) * np.sin(TAU * cyc(f0 * k, D) * t) for k in (1, 2, 3)) * 0.04)
    for i, t0 in enumerate(np.arange(0, D, 8.0)):
        focus = [8, 9, 10, 12, 10, 9, 8, 6][i % 8]          # overtone-singing melody on harmonics 6..12
        M.add(voice(f0 * 2, 9.5, rng, ('o', 'a', 'e'), 0.003, 2.0, 2.5, focus=focus), t0, 0.0, 0.32)
        for k, pan in [(3, -0.6), (4, 0.6), (5, -0.3), (6, 0.3)]:
            M.add(voice(f0 * k, 9.0, rng, ('a', 'o') if k % 2 else ('o', 'a'), 0.005, 2.5, 3.0, nmax=20), t0 + 0.3 * k, pan, 0.11)
    for t0 in np.arange(2.0, D, 4.0):
        M.add(fm_bell(f0 * rng.choice([8, 10, 12, 16]), 4, rng, 2.0, 1.0, 2.5), t0, rng.uniform(-.8, .8), 0.05)
    M.buf = M.buf + 0.55 * circ_reverb(M.buf, make_ir(5.0, 0.04, 5000))
    return M

# ---------------- 9. Deep relaxation, 60 bpm ----------------
def relax(D=64.0):
    rng = np.random.default_rng(99); M = Mix(D); N = M.N
    rain = circ_noise(N, lambda f: np.exp(-((np.log(np.maximum(f, 1)) - np.log(3500)) ** 2) / 1.2), rng) * 0.035
    M.add(np.vstack([rain, np.roll(rain, 11000)]))
    prog = [[48, 55, 62, 64, 71], [45, 52, 59, 60, 67], [41, 48, 57, 60, 64], [43, 50, 55, 57, 62]]  # Cmaj9 Am9 Fmaj9 G6sus
    for bar in range(16):
        ch = prog[bar % 4]; t0 = bar * 4.0
        if bar % 1 == 0:
            for m in ch: M.add(pad_note(hz(m), 4.0, rng, 1700, 3, 7, 1.8, 3.0), t0, rng.uniform(-.4, .4), 0.1)
        M.add(pad_note(hz(ch[0] - 12), 4.0, rng, 300, 1, 0, 1.0, 2.0, 'sine'), t0, 0, 0.08)
        for beat in range(4):
            if rng.random() < 0.55:
                m = ch[rng.integers(1, 5)] + 12
                M.add(felt_piano(hz(m), 4.0, rng, 0.6), t0 + beat + rng.choice([0, 0.5]), rng.uniform(-.5, .5), 0.32)
    M.buf = M.buf + 0.45 * circ_reverb(M.buf, make_ir(4.0, 0.03, 4500))
    return M

# ---------------- 10. Cosmic journey ----------------
def journey(D=80.0):
    rng = np.random.default_rng(1010); M = Mix(D); N = M.N; t = np.arange(N) / SR
    sub = np.sin(TAU * cyc(82.4, D) * t) * 0.05 + np.sin(TAU * cyc(123.6, D) * t) * 0.03
    M.add(sub * (0.7 + 0.3 * circ_lfo(N, D, 1)))
    chords = [[40, 47, 54, 59, 66], [43, 50, 57, 62, 69], [38, 45, 52, 57, 64], [45, 52, 59, 61, 68], [41, 48, 55, 60, 67]]
    seg = D / 5
    for i, ch in enumerate(chords):
        for m in ch: M.add(pad_note(hz(m + 12), seg, rng, 1800 + 700 * (i % 3), 3, 14, 4.0, 6.0), i * seg, rng.uniform(-.7, .7), 0.1)
        for m in ch[2:]: M.add(pad_note(hz(m + 24), seg * 0.8, rng, 6000, 2, 20, 6.0, 5.0, 'sine'), i * seg + seg * 0.2, rng.uniform(-.9, .9), 0.03)
    for t0 in np.arange(1.0, D, 2.5):
        if rng.random() < 0.6:
            ch = chords[int(t0 // seg) % 5]
            M.add(fm_bell(hz(ch[rng.integers(0, 5)] + 24), 5, rng, rng.choice([1.4, 3.5, 2.0]), 1.8, 3.0), t0, rng.uniform(-.9, .9), 0.12)
    for t0 in np.arange(0, D, 2.0): M.add(drum('kick', rng, 0.25), t0, 0, 0.12)
    air = circ_noise(N, lambda f: np.exp(-((f - 800 - 0 * f) / 900) ** 2), rng) * 0.03 * (1 + circ_lfo(N, D, 3))
    M.add(np.vstack([air, np.roll(air, 13000)]))
    M.buf = circ_delay(M.buf, 0.75, 0.3, 4) * 0.8
    M.buf = M.buf + 0.5 * circ_reverb(M.buf, make_ir(6.0, 0.05, 5000))
    return M

CLIPS = {
 'amazon-night': (amazon, 'Amazonian Night — rainforest, leaf-rattle & whistled melody'),
 'kaleido-bloom': (kaleido, 'Kaleidoscope Bloom — shimmering arpeggios & pads'),
 'fractal-depths': (fractal, 'Fractal Depths — deep drone & self-similar bells'),
 'sufi-ney-daf': (sufi, 'Sufi Ney & Daf — Hijaz-flavoured flute & frame drum'),
 'persian-garden': (persian, 'Persian Garden — santur-like plucks & flowing water'),
 'himalayan-bowls': (tibetan, 'Himalayan Bowls — singing bowls & low chant drone'),
 'tanpura-bansuri': (tanpura, 'Tanpura & Bansuri — Yaman-flavoured drone & flute'),
 'harmonic-choir': (sacred, 'Harmonic Choir — overtone voices on the harmonic series'),
 'deep-relaxation': (relax, 'Deep Relaxation — 60 bpm warm pads, felt piano & rain'),
 'cosmic-journey': (journey, 'Cosmic Journey — evolving pads, bells & deep space'),
}
