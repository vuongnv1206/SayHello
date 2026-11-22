# Chạy: python3 scripts/tao-nhac.py (cần numpy và ffmpeg). Ghi 3 file mp3 vào thư mục hiện tại.
# Tự sáng tác và tổng hợp 3 bản nhạc nền (không dùng mẫu âm thanh có bản quyền)
import numpy as np, subprocess, sys
SR = 32000
def midi(n): return 440 * 2 ** ((n - 69) / 12)
NOTE = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11}
def n(s):  # 'C4'
    name, octv = s[:-1], int(s[-1]); return 12 * (octv + 1) + NOTE[name]

def voice(kind, f, dur, vel):
    t = np.arange(int(SR * dur)) / SR
    if kind == 'box':   # hộp nhạc: sine trong, bồi âm cao, tắt nhanh
        w = np.sin(2*np.pi*f*t) + .35*np.sin(2*np.pi*f*3.01*t)*np.exp(-t*9) + .15*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*14)
        env = np.exp(-t * 3.2) * np.minimum(1, t * 400)
    elif kind == 'piano':
        w = sum(a*np.sin(2*np.pi*f*k*(1+.0004*k*k)*t)*np.exp(-t*(1.2+k*.9)) for k, a in [(1,1),(2,.45),(3,.22),(4,.12),(5,.06)])
        env = np.minimum(1, t * 250) * (0.7*np.exp(-t*1.1) + 0.3*np.exp(-t*.25))
    elif kind == 'pad':
        w = sum(np.sin(2*np.pi*f*d*t + p) for d, p in [(1,0),(1.003,1),(0.997,2),(2.001,.5)]) / 3
        a = min(1.2, dur/3); env = np.minimum(1, t/a) * np.minimum(1, (dur - t)/a)
    elif kind == 'bass':
        w = np.sin(2*np.pi*f*t) + .2*np.sin(2*np.pi*f*2*t)
        env = np.minimum(1, t*80) * np.exp(-t*1.4)
    return w * env * vel

def render(events, total):
    out = np.zeros(int(SR * (total + 4)))
    for (start, kind, note, dur, vel) in events:
        s = voice(kind, midi(note), dur + (2.5 if kind in ('box','piano') else 0.2), vel)
        i = int(start * SR); out[i:i+len(s)] += s[:len(out)-i]
    # hồi âm đơn giản (comb + allpass)
    rev = np.zeros_like(out)
    for d, g in [(0.0297,.78),(0.0371,.76),(0.0411,.74),(0.0437,.72)]:
        k = int(d*SR); y = out.copy()
        for i in range(k, len(y), k): y[i:i+k] += g * y[i-k:i][:len(y[i:i+k])]
        rev += y
    mix = out + .18 * rev / 4
    mix = mix[:int(SR*total)]
    fade = int(SR*3); mix[-fade:] *= np.linspace(1, 0, fade)
    mix[:int(SR*.05)] *= np.linspace(0,1,int(SR*.05))
    return mix / np.max(np.abs(mix)) * .85

def save(name, mix):
    pcm = (mix * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','s16le','-ar',str(SR),'-ac','1','-i','-','-b:a','80k','-ac','1',name], input=pcm, check=True)

def chord(root, kind):
    r = n(root); return [r, r + (3 if kind == 'm' else 4), r + 7]

# 1. Hộp nhạc: vòng hòa âm kiểu Canon (D A Bm F#m G D G A), rải hợp âm + giai điệu tự viết
def hop_nhac():
    prog = [('D4',''),('A3',''),('B3','m'),('F#3','m'),('G3',''),('D4',''),('G3',''),('A3','')]
    mel = [['F#5','E5','D5','E5'],['C#5','E5','A4','C#5'],['D5','F#5','B4','D5'],['C#5','A4','F#4','A4'],
           ['B4','D5','G5','F#5'],['F#5','A5','D5','F#5'],['G5','B5','E5','D5'],['C#5','E5','A5','G5']]
    beat = .52; ev = []; t = 0
    for rep in range(4):
        for (root, k), m in zip(prog, mel):
            c = chord(root, k)
            ev.append((t, 'bass', c[0]-12, beat*4, .5))
            arp = [c[0], c[1], c[2], c[1]+12, c[2], c[1], c[2], c[0]+12]
            for i, a in enumerate(arp): ev.append((t + i*beat/2, 'box', a+12, beat, .22))
            if rep > 0:
                for i, mm in enumerate(m): ev.append((t + i*beat, 'box', n(mm)+(12 if rep==3 else 0) - (0 if rep<3 else 12), beat, .42))
            t += beat * 4
    return ev, t

# 2. Dạo bước: piano nhịp ba (valse) giọng Fa trưởng, vòng I-vi-IV-V-iii-vi-ii-V
def dao_buoc():
    prog = [('F3',''),('D3','m'),('Bb2',''),('C3',''),('A2','m'),('D3','m'),('G2','m'),('C3','')]
    mel = [['A4','C5','F5'],['F5','E5','D5'],['D5','C5','Bb4'],['G4','A4','Bb4'],['C5','E5','A5'],['A5','G5','F5'],['Bb4','D5','G5'],['E5','D5','C5']]
    beat = .6; ev = []; t = 0
    for rep in range(4):
        for (root, k), m in zip(prog, mel):
            c = chord(root, k)
            ev.append((t, 'piano', c[0], beat, .55))
            for i in (1, 2): ev.append((t + i*beat, 'piano', c[1]+12, beat, .22)); ev.append((t + i*beat, 'piano', c[2]+12, beat, .2))
            if rep in (1, 2, 3):
                for i, mm in enumerate(m): ev.append((t + i*beat, 'piano', n(mm) + (12 if rep == 3 and i == 2 else 0), beat*1.2, .45))
            if rep == 2: ev.append((t + 2.5*beat, 'piano', n(m[1]), beat*.5, .25))
            t += beat * 3
    return ev, t

# 3. Bình minh: pad ấm + piano thưa, Đô trưởng C-G/B-Am-F
def binh_minh():
    prog = [('C3',''),('G2',''),('A2','m'),('F2',''),('C3',''),('E2','m'),('F2',''),('G2','')]
    mel = [['E5','G5'],['D5','B4'],['C5','E5'],['A4','C5'],['G5','E5'],['B4','G4'],['A4','F5'],['D5','G4']]
    bar = 3.2; ev = []; t = 0
    for rep in range(3):
        for (root, k), m in zip(prog, mel):
            c = chord(root, k)
            for x in c: ev.append((t, 'pad', x+12, bar, .16))
            ev.append((t, 'bass', c[0]-12 if c[0] > 40 else c[0], bar, .45))
            for i, a in enumerate([c[0]+24, c[2]+12, c[1]+24, c[2]+12]): ev.append((t + i*bar/4, 'piano', a, bar/4, .18))
            if rep > 0:
                ev.append((t, 'piano', n(m[0]), bar/2, .42)); ev.append((t + bar/2, 'piano', n(m[1]), bar/2, .38))
            t += bar
    return ev, t

for fn, name in [(hop_nhac, 'hop-nhac.mp3'), (dao_buoc, 'dao-buoc.mp3'), (binh_minh, 'binh-minh.mp3')]:
    ev, total = fn(); save(name, render(ev, total + 2)); print(name, round(total, 1), 's')
