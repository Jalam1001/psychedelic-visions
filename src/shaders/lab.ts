import { COMMON } from './common';

/**
 * Sound & Vision Lab visuals. These are ARTISTIC mappings, not physical cymatics simulations.
 * Mode 0: Chladni-style standing-wave figure  cos(nπx)cos(mπy) − cos(mπx)cos(nπy), (n,m) derived from frequency.
 * Mode 1: harmonic series rings (radius ∝ 1/k for the k-th partial).
 * Mode 2: audio-reactive Julia set, c driven by band energies.
 */
export const LAB_FRAG = COMMON + /* glsl */ `
uniform float uFreq; uniform float uHarm; uniform float uBeat;
void main(){
  vec2 uv0 = screenUV();
  vec2 uv = viewUV();
  float t = uTime;
  vec3 col = vec3(0.0); float mask = 0.0;
  if(uMode < 0.5){
    float k = log2(max(uFreq, 20.0)/55.0)*3.0;
    float n = 1.0 + floor(k); float m = n + 1.0 + floor(fract(k)*3.0);
    vec2 p = uv*1.6;
    float phase = 0.15*sin(TAU*uBeat*t*0.25);
    float v = cos(n*PI*p.x)*cos(m*PI*p.y) - cos(m*PI*p.x)*cos(n*PI*p.y) + phase;
    float line = smoothstep(0.08 + uHigh*0.05, 0.0, abs(v));
    float inside = step(max(abs(p.x), abs(p.y)), 1.0);
    col = pal(n*0.07 + abs(v)*0.2 + t*0.01)*line*1.4*inside + pal(0.6)*0.06*inside;
    col += pal(0.1)*smoothstep(0.01, 0.0, abs(max(abs(p.x), abs(p.y)) - 1.0));
    mask = inside*(0.3 + line) + 0.05;
  } else if(uMode < 1.5){
    float r = length(uv); float a = atan(uv.y, uv.x);
    for(int i = 1; i <= 16; i++){
      float fi = float(i);
      if(fi > uHarm) break;
      float rr = 0.75/fi;
      float wob = 0.012*sin(a*fi*2.0 + t*fi*0.5)*(1.0 + uMid*2.0);
      float line = exp(-abs(r - rr - wob)*(140.0 + fi*10.0));
      col += pal(fi*0.08 + t*0.01)*line*(1.2/sqrt(fi));
      mask += line;
    }
    col += pal(0.5)*exp(-r*8.0)*uBass;
  } else {
    vec2 z = uv*2.2;
    vec2 c = vec2(-0.75 + 0.2*uBass, 0.12 + 0.25*uMid) + 0.05*vec2(cos(t*0.2), sin(t*0.23));
    float it = 0.0; float m2 = 0.0;
    for(int i = 0; i < 200; i++){
      z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
      m2 = dot(z, z);
      if(m2 > 64.0) break;
      it += 1.0;
    }
    float sn = it - log2(log2(max(m2, 1.0001))) + 4.0;
    col = it >= 199.0 ? vec3(0.02) : pal(sn*0.03 + t*0.02 + uHigh*0.2)*1.1;
    mask = 1.0;
  }
  gl_FragColor = vec4(finish(col, mask, uv0), 1.0);
}
`;
