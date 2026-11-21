import { COMMON } from './common';

/**
 * Amazonian Visions — original procedural interpretations INSPIRED BY (not reproducing) the visual
 * organisation of Shipibo-Konibo kené: thick primary lines, thin parallel infill lines, stepped
 * diamonds and crosses on a diagonal lattice; combined with vines, leaves and luminous colour.
 * Modes: 0 kené-inspired lattice, 1 vine mandala, 2 visionary forest, 3 serpent river.
 */
export const AMAZONIAN_FRAG = COMMON + /* glsl */ `
// Kené-inspired line field. Returns line intensity.
float keneField(vec2 p, float seed){
  p = rot(0.7853982)*p;                      // diagonal lattice
  vec2 id = floor(p); vec2 f = fract(p) - 0.5;
  float h = hash(id + seed*17.3);
  float l1 = abs(f.x) + abs(f.y);            // diamonds
  float li = max(abs(f.x), abs(f.y));        // squares / stepped crosses
  float shape = mix(l1, li*1.15, step(0.5, h));
  float thick = smoothstep(0.055, 0.025, abs(shape - 0.42));
  // thick lattice bars connecting cells (continuous meandering paths)
  float bar = smoothstep(0.05, 0.02, abs(f.y))*step(0.35, hash(id + seed + 3.1)) + smoothstep(0.05, 0.02, abs(f.x))*step(0.6, hash(id + seed + 7.7));
  bar *= step(0.42, max(abs(f.x), abs(f.y)) + 0.1);
  // thin parallel infill lines inside the primary motif
  float N = 4.0 + floor(h*3.0);
  float dIn = abs(fract(shape*N/0.42) - 0.5)*0.42/N;
  float thin = smoothstep(0.012, 0.004, dIn)*step(shape, 0.36);
  // central cross
  float cross = smoothstep(0.03, 0.012, min(abs(f.x), abs(f.y)))*step(li, 0.12);
  return clamp(thick + bar*0.9 + thin*0.55 + cross, 0.0, 1.0);
}

float vine(vec2 p, float k, float t, out float leaf){
  float y = 0.35*sin(p.x*1.3*k + t*0.4 + k*2.0) + 0.12*sin(p.x*3.1 + t*0.3*k);
  float dy = 0.35*1.3*k*cos(p.x*1.3*k + t*0.4 + k*2.0);
  float d = abs(p.y - y)/sqrt(1.0 + dy*dy);
  // leaves at intervals along the vine
  float s = p.x*2.0 + k*1.7;
  float idx = floor(s); float fs = fract(s) - 0.5;
  float side = mod(idx, 2.0) < 1.0 ? 1.0 : -1.0;
  vec2 lp = vec2(fs*0.5, (p.y - y)*side - 0.09);
  lp = rot(0.6)*lp;
  float le = length(lp*vec2(1.0, 2.6));
  leaf = smoothstep(0.08, 0.06, le)*smoothstep(0.0, 0.02, abs(lp.y) + 0.004);
  return d;
}

void main(){
  vec2 uv0 = screenUV();
  vec2 uv = viewUV();
  float t = uTime;
  uv /= 1.0 + 0.25*uBass + 0.04*uPulse;
  vec3 col = vec3(0.0); float mask = 0.0;
  float scale = 3.0 + uComplex*6.0 + uHigh*0.8;
  // Gradual emergence: each generation grows outward from the centre in a soft noisy wave
  float phase = t*0.045;
  float gen = floor(phase); float fr = fract(phase);
  float wave = smoothstep(fr*2.4 - 0.35, fr*2.4, length(uv) + 0.25*fbm(uv*3.0 + gen));
  vec2 p = uv;
  if(uMode > 0.5 && uMode < 1.5){ p = kfold(rot(t*0.03*uRot*2.0)*uv, uSym); }
  if(uMode < 1.5){
    float kA = keneField(p*scale + vec2(0.0, t*0.05), gen + 1.0);
    float kB = keneField(p*scale + vec2(0.0, t*0.05), gen);
    float k = mix(kA, kB, wave);
    vec3 kc = mix(pal(0.05 + gen*0.13), pal(0.55 + gen*0.13), smoothstep(0.3, 0.7, fbm(p*1.5 + t*0.05)));
    col += kc*k*0.9; mask += k;
    // vines & leaves weaving through
    for(int i = 0; i < 4; i++){
      float fi = float(i);
      float leaf;
      vec2 vp = rot(fi*0.8 + (uMode > 0.5 ? 0.0 : 0.2))*p*1.4 + vec2(0.0, fi*0.4 - 0.6);
      float d = vine(vp, 1.0 + fi*0.35, t, leaf);
      float glow = exp(-d*60.0)*0.9 + exp(-d*14.0)*0.25;
      col += pal(0.3 + fi*0.15 + t*0.01)*(glow + leaf*0.8);
      mask += glow + leaf;
    }
  } else if(uMode < 2.5){
    // Visionary forest: domain-warped fbm with glowing veins and flower-eyes
    vec2 q = uv*2.0;
    vec2 w = vec2(fbm(q + t*0.06), fbm(q + vec2(5.2, 1.3) - t*0.05));
    float n = fbm(q + 2.5*w + uMid*0.5);
    float vein = smoothstep(0.03, 0.0, abs(n - 0.5) - 0.002) + 0.5*smoothstep(0.02, 0.0, abs(fract(n*6.0) - 0.5)*0.17 - 0.004);
    col += pal(n + t*0.02)*n*0.6 + pal(n + 0.5)*vein*1.2;
    vec2 g = q*1.5; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
    f += 0.25*(vec2(hash(id), hash(id + 1.3)) - 0.5);
    float rr = length(f); float aa = atan(f.y, f.x);
    float petals = 0.18 + 0.06*cos(aa*(5.0 + floor(hash(id)*4.0)) + t);
    float flower = smoothstep(0.02, 0.0, rr - petals*(0.6 + 0.4*wave))*step(0.55, hash(id + gen));
    col += pal(hash(id) + 0.2)*flower*(0.8 + uHigh);
    mask = 0.6 + vein + flower;
  } else {
    // Serpent river: a sinuous band carrying kené-inspired scales through jungle texture
    float y = 0.3*sin(uv.x*2.0 + t*0.3) + 0.1*sin(uv.x*5.0 - t*0.4);
    float d = abs(uv.y - y);
    float band = smoothstep(0.24, 0.2, d);
    vec2 sp = vec2(uv.x*6.0 - t*0.6, (uv.y - y)*6.0);
    float k = keneField(sp*0.9 + vec2(0.0, 0.5), gen);
    float jungle = fbm(uv*4.0 + vec2(t*0.03, 0.0));
    float lf; float vd = vine(uv*2.0 + vec2(0.0, 0.9), 1.4, t, lf); float vd2 = vine(uv*2.0 - vec2(0.0, 0.9), 1.1, -t, lf);
    col += pal(0.35 + jungle*0.3)*jungle*0.35*(1.0 - band);
    col += pal(0.05 + t*0.01)*band*(0.25 + k*1.1);
    col += pal(0.6)*smoothstep(0.012, 0.0, abs(d - 0.22))*1.2;
    col += pal(0.25)*(exp(-vd*50.0) + exp(-vd2*50.0) + lf);
    mask = 0.45 + band + jungle*0.5;
  }
  gl_FragColor = vec4(finish(col, mask, uv0), 1.0);
}
`;
