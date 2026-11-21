import { COMMON } from './common';

/**
 * Fractal Journey. Modes: 0 Mandelbrot, 1 Julia, 2 fractal tunnel, 3 recursive log-spiral, 4 kaleidoscopic IFS.
 * Mandelbrot/Julia use escape-time iteration z_{n+1} = z_n^2 + c with smooth (continuous) colouring
 *   nu = n - log2(log2|z|^2) + 4 and an orbit trap.
 * Precision: single-precision floats limit useful zoom to roughly 1e5x.
 */
export const FRACTAL_FRAG = COMMON + /* glsl */ `
uniform vec2 uCenter; uniform float uScale; uniform vec2 uJulia; uniform float uIter;

vec4 escape(vec2 z, vec2 c){
  float it = 0.0; float m2 = 0.0; float trap = 1e9;
  for(int i = 0; i < 900; i++){
    if(float(i) >= uIter) break;
    z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    m2 = dot(z, z);
    trap = min(trap, min(abs(z.x*z.y), abs(length(z) - 1.0)));
    if(m2 > 256.0) break;
    it += 1.0;
  }
  return vec4(it, m2, trap, 0.0);
}

vec3 colourEscape(vec4 e, out float mask){
  mask = 1.0;
  if(e.x >= uIter){ return pal(0.7 + e.z*1.5)*(0.06 + 0.25*exp(-e.z*12.0))*(0.6 + uBass); }
  float sn = e.x - log2(log2(e.y)) + 4.0;
  float tt = sn*(0.012 + 0.03*uComplex) + uTime*0.025;
  vec3 c = pal(tt)*(0.65 + 0.35*cos(sn*0.25));
  c += pal(tt + 0.5)*exp(-e.z*25.0)*(0.25 + 0.6*uHigh);
  return c*1.2;
}

void main(){
  vec2 uv0 = screenUV();
  float t = uTime;
  vec3 col; float mask = 1.0;
  if(uMode < 1.5){
    vec2 p = uCenter + uv0*uScale;
    vec4 e = uMode < 0.5 ? escape(vec2(0.0), p) : escape(p, uJulia + 0.01*vec2(uBass, uMid));
    col = colourEscape(e, mask);
  } else if(uMode < 2.5){
    // Fractal tunnel: inverse-radius depth + angular wedges, kali-folded
    vec2 uv = viewUV();
    float r = length(uv) + 1e-3;
    float a = atan(uv.y, uv.x) + t*0.05*uRot*2.0;
    vec2 q = vec2(a/TAU*uSym, 0.35/r + t*0.4*(1.0 + uBass*0.6));
    q = fract(q) - 0.5;
    float acc = 0.0;
    for(int i = 0; i < 8; i++){
      if(float(i) >= uDepth + 1.0) break;
      q = abs(q)/max(dot(q, q), 0.05) - vec2(1.0 + 0.2*sin(t*0.1), 0.85);
      acc += exp(-abs(q.y)*(4.0 + uHigh*6.0));
    }
    float v = acc/(uDepth + 1.0);
    col = pal(v*0.6 + 0.35/r*0.05 + t*0.02)*v*2.2;
    col *= smoothstep(0.0, 0.25, r);
    col += pal(t*0.05)*exp(-r*10.0)*0.8;
    mask = 1.0;
  } else if(uMode < 3.5){
    // Recursive spiral: log-polar coordinates make zoom a translation, so scaling recursion becomes a scroll
    vec2 uv = viewUV();
    float r = length(uv) + 1e-4;
    float a = atan(uv.y, uv.x);
    float lr = log(r);
    vec2 s = vec2(a/TAU, lr/TAU);
    s = mat2(1.0, -0.6, 0.6, 1.0)*s;          // shear -> logarithmic spiral arms
    s.y -= t*0.04*(1.0 + uBass);
    vec2 g = vec2(s.x*uSym, s.y*uSym);
    vec2 id = floor(g); vec2 f = fract(g) - 0.5;
    float d = length(f);
    float ring = smoothstep(0.08, 0.0, abs(d - 0.32 - 0.05*sin(t + id.y)));
    float core = smoothstep(0.2, 0.0, d - 0.05*uHigh);
    float tri = smoothstep(0.03, 0.0, abs(max(abs(f.x)*0.866 + f.y*0.5, -f.y) - 0.18));
    float v = ring + core*0.6 + tri*uComplex;
    col = pal(id.y*0.07 + id.x*0.03 + t*0.02 + d)*v*1.4;
    col += pal(lr*0.2 + t*0.03)*0.08;
  } else {
    // Kaleidoscopic IFS: repeated fold + scale + rotate (Sierpinski/Koch family)
    vec2 p = viewUV()*2.2;
    p = rot(t*0.05*uRot*2.0)*p;
    float sc = 1.8 + 0.25*uComplex;
    float trap = 1e9; float acc = 0.0;
    for(int i = 0; i < 12; i++){
      if(float(i) >= uDepth + 3.0) break;
      p = abs(p);
      if(p.x < p.y) p = p.yx;
      p = rot(0.25 + 0.15*sin(t*0.13) + uMid*0.2)*p;
      p = p*sc - vec2(1.0, 0.6)*(sc - 1.0);
      float d = length(p)*pow(sc, -float(i) - 1.0);
      trap = min(trap, d);
      acc += exp(-abs(p.y)*2.0);
    }
    float v = exp(-trap*30.0);
    col = pal(acc*0.08 + t*0.02 + v)*(v*2.0 + acc*0.05);
  }
  gl_FragColor = vec4(finish(col, mask, uv0), 1.0);
}
`;
