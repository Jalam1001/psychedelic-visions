"""Tiny offline synthesis toolkit for seamless (circular) soundtrack loops. All original material."""
import numpy as np, scipy.signal as ss
from scipy.ndimage import maximum_filter1d, uniform_filter1d
SR = 44100
TAU = 2 * np.pi

def tv(n): return np.arange(n) / SR
def nsamp(d): return int(round(d * SR))
def cyc(f, D): return max(1, round(f * D)) / D           # snap to whole cycles per loop
def hz(note_midi): return 440.0 * 2 ** ((note_midi - 69) / 12)
def cents(f, c): return f * 2 ** (c / 1200)

class Mix:
    """Stereo circular buffer: anything running past the end wraps to the start -> perfect loop."""
    def __init__(s, D):
        s.D = D; s.N = nsamp(D); s.buf = np.zeros((2, s.N))
    def add(s, x, t0=0.0, pan=0.0, gain=1.0):
        x = np.asarray(x, dtype=np.float64)
        if x.ndim == 1:
            a = (pan + 1) * np.pi / 4
            x = np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)
        x = x * gain
        i0 = nsamp(t0) % s.N; k = 0; n = x.shape[1]
        while k < n:
            m = min(n - k, s.N - i0)
            s.buf[:, i0:i0 + m] += x[:, k:k + m]
            k += m; i0 = 0
        return s
    def addmix(s, other, gain=1.0): s.buf += other.buf * gain; return s

# ---------- envelopes ----------
def env_adsr(n, a=0.01, d=0.1, sl=0.7, r=0.3, hold=None):
    t = tv(n); dur = n / SR
    hold = dur - r if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-4), sl + (1 - sl) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((t - hold) / max(r, 1e-4), 0, 1)
    return e * (1 - rel) ** 2
def env_perc(n, a=0.003, tau=0.5):
    t = tv(n); return np.minimum(t / a, 1) * np.exp(-np.maximum(t - a, 0) / tau)

# ---------- oscillators ----------
def phase(freq, n):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) == 0 else freq
    return TAU * np.cumsum(f) / SR
def additive(f0, amps, n, ratios=None, detune=None, fcontour=None):
    """Sum of partials. fcontour (array) multiplies f0 over time (vibrato/glide)."""
    out = np.zeros(n); fc = np.ones(n) if fcontour is None else fcontour
    for i, a in enumerate(amps):
        r = (i + 1) if ratios is None else ratios[i]
        if f0 * r > 15000 or a == 0: continue
        out += a * np.sin(phase(f0 * r * fc, n) + i * 1.7)
    return out
def saw_naive(freq, n, ph0=0.0):
    p = (np.cumsum(np.broadcast_to(freq, (n,)) / SR) + ph0) % 1.0
    return 2 * p - 1
def lp(x, fc, order=2):
    sos = ss.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'); return ss.sosfilt(sos, x)
def hp(x, fc, order=2):
    sos = ss.butter(order, fc, 'high', fs=SR, output='sos'); return ss.sosfilt(sos, x)
def bp(x, lo, hi, order=2):
    sos = ss.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'); return ss.sosfilt(sos, x)

# ---------- circular (loop-safe) processors ----------
def circ_noise(N, shape_fn, rng, color=0.0):
    X = np.fft.rfft(rng.standard_normal(N)); f = np.fft.rfftfreq(N, 1 / SR)
    g = shape_fn(f) * np.where(f > 0, (np.maximum(f, 1) / 1000) ** (-color / 2), 0)
    y = np.fft.irfft(X * g, N); return y / (np.std(y) + 1e-12)
def circ_lfo(N, D, cycles, ph=0.0):
    return np.sin(TAU * cycles * np.arange(N) / N + ph)
def make_ir(rt=4.0, pre=0.02, damp=6000, rng=None, width=1.0):
    rng = rng or np.random.default_rng(1)
    n = nsamp(rt * 1.2); t = tv(n)
    ir = np.zeros((2, n + nsamp(pre)))
    for c in range(2):
        x = rng.standard_normal(n) * np.exp(-6.9 * t / rt)
        # darker tail: blend a lowpassed copy in over time
        x = x * np.exp(-t * 0.6) + lp(x, damp * 0.35) * (1 - np.exp(-t * 0.6))
        ir[c, nsamp(pre):] = x
    ir[1] = ir[1] * width + ir[0] * (1 - width)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)
def circ_reverb(buf, ir):
    N = buf.shape[1]; out = np.zeros_like(buf)
    irp = np.zeros((2, N)); m = min(N, ir.shape[1]); irp[:, :m] = ir[:, :m]
    for c in range(2):
        mono = buf[c] if c == 0 else buf[1]
        out[c] = np.fft.irfft(np.fft.rfft(mono) * np.fft.rfft(irp[c]), N)
    return out
def circ_delay(buf, d, fb=0.4, n=6, pingpong=True, damp=None):
    out = buf.copy(); N = buf.shape[1]; k = nsamp(d)
    x = buf.copy()
    for i in range(1, n + 1):
        x = np.roll(x, k, axis=1) * fb
        if damp: x = np.vstack([lp(np.concatenate([x[c, -2000:], x[c]]), damp, 1)[2000:] for c in range(2)])
        if pingpong and i % 2 == 1: out += x[::-1]
        else: out += x
    return out

def master(buf, target_lufs=-14.0, ceiling_db=-1.2):
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    buf = buf - buf.mean(axis=1, keepdims=True)
    buf = np.vstack([hp(np.concatenate([b[-SR:], b]), 28)[SR:] for b in buf])  # rumble cut (circular-safe)
    for _ in range(4):
        l = meter.integrated_loudness(buf.T)
        buf *= 10 ** ((target_lufs - l) / 20)
        buf = limiter(buf, 10 ** (ceiling_db / 20))
    return buf, meter.integrated_loudness(buf.T)
def limiter(buf, ceil, look=0.005, rel=0.12):
    pk = np.max(np.abs(buf), axis=0)
    pk = maximum_filter1d(pk, nsamp(look * 2) + 1, mode='wrap')
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    g = -maximum_filter1d(-g, nsamp(rel), mode='wrap')        # hold the reduction for the release window
    g = uniform_filter1d(g, nsamp(rel / 2), mode='wrap')       # smooth
    g = np.minimum(g, ceil / np.maximum(np.max(np.abs(buf), axis=0), 1e-9) + 0 * g)
    return buf * g
def true_peak_db(buf):
    up = ss.resample_poly(buf, 4, 1, axis=1); return 20 * np.log10(np.max(np.abs(up)) + 1e-12)

# ---------- instruments (mono outputs) ----------
def flute(f, dur, rng, vel=1.0, breath=0.12, vib=0.007, glide_from=None, harm=(1, .32, .1, .04), att=0.07, vibrate=5.2):
    n = nsamp(dur + 0.4); t = tv(n)
    fc = np.ones(n)
    if glide_from: fc = 1 + (glide_from / f - 1) * np.exp(-t / 0.09)
    v = vib * np.clip((t - 0.25) / 0.4, 0, 1) * np.sin(TAU * vibrate * t + rng.uniform(0, 6))
    fc = fc * (1 + v)
    e = env_adsr(n, att, 0.3, 0.8, 0.25, hold=dur)
    tone = additive(f, harm, n, fcontour=fc)
    br = bp(rng.standard_normal(n), f * 0.8, f * 3.5) * 0.6 + hp(rng.standard_normal(n), 3000) * 0.08
    am = 1 + 0.08 * np.sin(TAU * 3.1 * t)
    return (tone + breath * br) * e * vel * am
def ney(f, dur, rng, vel=1.0, glide_from=None):
    return flute(f, dur, rng, vel, breath=0.42, vib=0.009, glide_from=glide_from, harm=(1, .55, .3, .16, .08, .04), att=0.22, vibrate=4.6)
def modal_pluck(f, dur, rng, bright=0.6, B=0.0004, tau=1.6, nparts=14, detune_c=1.5):
    n = nsamp(dur); t = tv(n); out = np.zeros(n)
    for s in (-detune_c, detune_c):
        fs = cents(f, s)
        for k in range(1, nparts + 1):
            fk = k * fs * np.sqrt(1 + B * k * k)
            if fk > 14000: break
            a = (1 / k ** 1.1) * np.exp(-(k - 1) * (1 - bright) * 0.5)
            out += a * np.sin(TAU * fk * t + rng.uniform(0, 6)) * np.exp(-t / (tau / (1 + 0.32 * (k - 1))))
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t / 0.004) * 0.25
    return (out * np.minimum(t / 0.002, 1) + click) * 0.5
def bowl(f, dur, rng, strike=True, vel=1.0):
    n = nsamp(dur); t = tv(n); out = np.zeros(n)
    ratios = [1, 2.76, 5.40, 8.93, 13.34]; amps = [1, .55, .3, .16, .08]; taus = [16, 10, 6.5, 4, 2.6]
    for r, a, ta in zip(ratios, amps, taus):
        beat = rng.uniform(0.4, 1.8)
        out += a * (np.sin(TAU * f * r * t + rng.uniform(0, 6)) + 0.8 * np.sin(TAU * (f * r + beat) * t + rng.uniform(0, 6))) * np.exp(-t / ta)
    att = env_perc(n, 0.004, 1e9) if strike else np.clip(t / 1.8, 0, 1)
    if not strike: out *= 0.7 + 0.3 * np.sin(TAU * 0.7 * t)
    if strike: out += lp(rng.standard_normal(n), 900) * np.exp(-t / 0.01) * 0.3
    return out * att * vel * 0.35
def tanpura_pluck(f, dur, rng, vel=1.0):
    n = nsamp(dur); t = tv(n); out = np.zeros(n)
    for k in range(1, 48):
        fk = k * f * (1 + 0.00025 * k)
        if fk > 9000: break
        base = 1 / k ** 0.75
        bloom = 1 if k < 4 else (0.25 + 0.75 * np.clip((t - 0.04 * k ** 0.5) / (0.35 + 0.05 * k), 0, 1) * np.exp(-t / (2.0 + 6 / k)))
        out += base * bloom * np.sin(TAU * fk * t + rng.uniform(0, 6))
    return out * env_perc(n, 0.006, 2.6) * vel * 0.12
def drum(kind, rng, vel=1.0, f=72.0):
    if kind == 'dum':
        n = nsamp(1.2); t = tv(n)
        body = np.sin(phase(f * (1 + 1.2 * np.exp(-t / 0.025)), n)) * np.exp(-t / 0.38)
        thump = lp(rng.standard_normal(n), 500) * np.exp(-t / 0.03) * 0.5
        return (body + thump) * vel * 0.9
    if kind == 'tek':
        n = nsamp(0.5); t = tv(n)
        s = bp(rng.standard_normal(n), 1800, 7000) * np.exp(-t / 0.035) + 0.35 * np.sin(TAU * 410 * t) * np.exp(-t / 0.07)
        return s * vel * 0.5
    if kind == 'jingle':
        n = nsamp(0.45); t = tv(n)
        g = 1 + 0.6 * np.sin(TAU * 38 * t)
        return bp(rng.standard_normal(n), 5500, 12000) * np.exp(-t / 0.12) * g * vel * 0.18
    if kind == 'shaker':
        n = nsamp(0.25); t = tv(n)
        return bp(rng.standard_normal(n), 2800, 9000) * np.minimum(t / 0.012, 1) * np.exp(-t / 0.06) * vel * 0.3
    if kind == 'kick':
        n = nsamp(0.7); t = tv(n)
        return np.sin(phase(52 * (1 + 2.5 * np.exp(-t / 0.03)), n)) * np.exp(-t / 0.25) * vel
def cricket(rng, dur=0.6):
    n = nsamp(dur); t = tv(n); fc = rng.uniform(3800, 5200); rate = rng.uniform(25, 40)
    gate = (np.sin(TAU * rate * t) > 0.2).astype(float); gate = lp(gate, 300, 1)
    chirp = np.clip(np.sin(TAU * t / dur * rng.integers(2, 4)), 0, 1)
    return np.sin(TAU * fc * t) * gate * chirp * 0.08
def frog(rng):
    n = nsamp(0.35); t = tv(n); f = rng.uniform(280, 480)
    pulses = (np.sin(TAU * rng.uniform(45, 70) * t) > 0.3).astype(float)
    return bp(saw_naive(f, n) * pulses, f * 0.8, f * 4) * np.sin(np.pi * t / t[-1]) * 0.25
def bird(rng):
    n = nsamp(rng.uniform(0.08, 0.18)); t = tv(n); f0 = rng.uniform(2600, 4200); f1 = f0 * rng.uniform(0.6, 1.4)
    fr = f0 + (f1 - f0) * t / t[-1]
    return np.sin(phase(fr * (1 + 0.03 * np.sin(TAU * 60 * t)), n)) * np.sin(np.pi * t / t[-1]) ** 2 * 0.12
def pad_note(f, dur, rng, cutoff=1800, voices=3, det=9, att=1.5, rel=2.5, kind='saw'):
    n = nsamp(dur + rel); out = np.zeros(n)
    for v in range(voices):
        fv = cents(f, (v - (voices - 1) / 2) * det)
        if kind == 'saw': out += saw_naive(fv, n, rng.uniform())
        else: out += np.sin(phase(fv, n) + rng.uniform(0, 6)) + 0.3 * np.sin(2 * phase(fv, n))
    out = lp(lp(out / voices, cutoff), cutoff)
    return out * env_adsr(n, att, 1.0, 0.85, rel, hold=dur)
FORMANTS = {'a': [(730, 1, 90), (1090, .5, 110), (2440, .25, 160)], 'o': [(450, 1, 80), (800, .45, 90), (2830, .12, 160)],
            'u': [(325, 1, 70), (700, .25, 80), (2530, .08, 160)], 'e': [(530, 1, 80), (1840, .5, 120), (2480, .3, 160)],
            'i': [(270, 1, 60), (2290, .4, 140), (3010, .3, 180)], 'm': [(250, 1, 90), (1200, .03, 200), (2500, .01, 200)]}
def formant_gain(freq, vowel):
    g = np.full_like(freq, 0.015)
    for fc, a, bw in FORMANTS[vowel]: g += a * np.exp(-0.5 * ((freq - fc) / bw) ** 2)
    return g
def voice(f, dur, rng, vowels=('a', 'o'), vib=0.004, att=1.2, rel=1.5, focus=None, nmax=80):
    """Additive formant voice; vowels morph across the note; optional 'focus' = overtone-singing emphasis (harmonic index curve)."""
    n = nsamp(dur + rel); t = tv(n); out = np.zeros(n)
    fc = 1 + vib * np.sin(TAU * 5.0 * t + rng.uniform(0, 6)) * np.clip(t / 1.0, 0, 1)
    ctrl = np.linspace(0, len(vowels) - 1, n)
    for k in range(1, nmax):
        fk = k * f
        if fk > 6000: break
        gk = np.zeros(n)
        for vi, vw in enumerate(vowels):
            w = np.clip(1 - np.abs(ctrl - vi), 0, 1)
            gk += w * formant_gain(np.array([fk]), vw)[0]
        if focus is not None: gk = gk * 0.5 + 1.4 * np.exp(-0.5 * ((k - focus) / 0.45) ** 2) * (k > 3)
        out += gk * np.sin(phase(fk * fc, n) + rng.uniform(0, 6)) / np.sqrt(k)
    return out * env_adsr(n, att, 1, 0.9, rel, hold=dur) * 0.6
def felt_piano(f, dur, rng, vel=0.8):
    n = nsamp(dur); t = tv(n); out = np.zeros(n)
    for k in range(1, 10):
        fk = k * f * np.sqrt(1 + 0.0003 * k * k)
        out += (vel ** (0.5 + k * 0.2)) / k ** 1.3 * np.sin(TAU * fk * t) * np.exp(-t / (3.0 / k ** 0.8))
    return out * np.minimum(t / 0.006, 1) * 0.5
def fm_bell(f, dur, rng, ratio=3.5, index=2.5, tau=3.0):
    n = nsamp(dur); t = tv(n)
    I = index * np.exp(-t / (tau * 0.4))
    return np.sin(TAU * f * t + I * np.sin(TAU * f * ratio * t)) * env_perc(n, 0.002, tau) * 0.3
def soft_arp(f, dur, rng):
    n = nsamp(dur); t = tv(n)
    s = additive(f, [1, 0, .3, 0, .15, 0, .07], n)
    return lp(s, 3500) * env_perc(n, 0.004, 0.35) * 0.5
