import sys, json, base64, subprocess, os, time, numpy as np
sys.path.insert(0, '/workspace/pv-audio')
from synth import *
from compose import CLIPS
from scipy.io import wavfile
OUT = '/workspace/psychedelic-visions/public/audio'; os.makedirs(OUT, exist_ok=True)
X = 3.0   # overlap seconds appended (identical to the loop start) for the gapless dual-element player
HOP = 0.03

def envelope(buf, D):
    mono = buf.mean(axis=0); N = len(mono); hop = int(SR * HOP); win = 2048
    nf = int(D / HOP); ext = np.concatenate([mono, mono[:win]])
    w = np.hanning(win); f = np.fft.rfftfreq(win, 1 / SR)
    bands = [(20, 250), (250, 2000), (2000, 10000)]
    E = np.zeros((nf, 3)); prev = None; flux = np.zeros(nf)
    for i in range(nf):
        seg = ext[i * hop:i * hop + win] * w; S = np.abs(np.fft.rfft(seg))
        for j, (lo, hi) in enumerate(bands): E[i, j] = np.sqrt(np.mean(S[(f >= lo) & (f < hi)] ** 2))
        if prev is not None: flux[i] = np.sum(np.maximum(S[f < 400] - prev[f < 400], 0))
        prev = S
    dB = 20 * np.log10(E + 1e-9); q = np.zeros_like(dB)
    for j in range(3):
        lo, hi = np.percentile(dB[:, j], 5), np.percentile(dB[:, j], 99.5)
        q[:, j] = np.clip((dB[:, j] - lo) / max(hi - lo, 1e-6), 0, 1)
    thr = np.percentile(flux, 92); beats = [round(i * HOP, 3) for i in range(1, nf - 1) if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] > flux[i + 1]]
    b = (q * 255).round().astype(np.uint8).reshape(-1)
    return {'hop': HOP, 'frames': nf, 'bands': base64.b64encode(b.tobytes()).decode(), 'beats': beats}

def analyse(buf):
    mono = buf.mean(axis=0); S = np.abs(np.fft.rfft(mono)) ** 2; f = np.fft.rfftfreq(len(mono), 1 / SR)
    tot = S.sum(); band = lambda lo, hi: 100 * S[(f >= lo) & (f < hi)].sum() / tot
    import pyloudnorm as pyln
    hpb = np.vstack([hp(b, 300, 4) for b in buf])
    phone = pyln.Meter(SR).integrated_loudness(hpb.T)
    steps = np.abs(np.diff(buf, axis=1)).max()
    return {'phone_lufs_hp300': round(phone, 1), 'max_step': round(float(steps), 4), 'centroid_hz': round(float((S * f).sum() / tot)), 'pct_<250': round(band(20, 250), 1), 'pct_250-2k': round(band(250, 2000), 1),
            'pct_2-5k(harsh)': round(band(2000, 5000), 1), 'pct_>5k': round(band(5000, 20000), 1),
            'crest_db': round(float(20 * np.log10(np.max(np.abs(mono)) / (np.sqrt(np.mean(mono ** 2)) + 1e-12))), 1)}

meta = {}
only = sys.argv[1:] or list(CLIPS)
for key in only:
    fn, title = CLIPS[key]; t0 = time.time()
    M = fn(); D = M.D
    buf, lufs = master(M.buf)
    tp = true_peak_db(buf)
    seam = float(np.max(np.abs(buf[:, 0] - buf[:, -1])))
    full = np.concatenate([buf, buf[:, :nsamp(X)]], axis=1)
    wav = f'/tmp/{key}.wav'; wavfile.write(wav, SR, full.T.astype(np.float32))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', f'{OUT}/{key}.m4a'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '80k', f'{OUT}/{key}.mp3'], check=True)
    env = envelope(buf, D)
    json.dump({'key': key, 'loop': D, **env}, open(f'{OUT}/{key}.env.json', 'w'))
    a = analyse(buf)
    meta[key] = {'title': title, 'loop_s': D, 'file_s': D + X, 'lufs': round(lufs, 2), 'true_peak_dbtp': round(tp, 2), 'seam_step': round(seam, 4),
                 'm4a_kb': os.path.getsize(f'{OUT}/{key}.m4a') // 1024, 'mp3_kb': os.path.getsize(f'{OUT}/{key}.mp3') // 1024, **a, 'render_s': round(time.time() - t0, 1)}
    print(key, json.dumps(meta[key]), flush=True)
old = json.load(open('/workspace/pv-audio/meta.json')) if os.path.exists('/workspace/pv-audio/meta.json') else {}
old.update(meta); json.dump(old, open('/workspace/pv-audio/meta.json', 'w'), indent=1)
