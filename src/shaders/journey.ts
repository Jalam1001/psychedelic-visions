import { COMMON } from './common';

/**
 * Infinite Psychedelic Journey: five visual "worlds" evaluated in one shader and cross-faded by weights
 * computed on the CPU with smoothstep envelopes, so transitions are always gradual (no hard cuts).
 * 0 kaleidoscope · 1 Amazonian vines/kené-inspired lattice · 2 fractal tunnel · 3 Islamic star lattice · 4 lotus mandala
 */
export const JOURNEY_FRAG = COMMON + /* glsl */ `
uniform vec4 uW; uniform float uW4; uniform float uW5; uniform float uSeed;

float sdStar(vec2 p, float r, float n, float m){
  float an = PI/n; float en = PI/m;
  vec2 acs = vec2(cos(an), sin(an)); vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2.0*an) - an;
  p = length(p)*vec2(cos(bn), abs(sin(bn)));
  p -= r*acs;
  p += ecs*clamp(-dot(p, ecs), 0.0, r*acs.y/ecs.y);
  return length(p)*sign(p.x);
}

vec4 worldKaleido(vec2 uv, float t){
  vec3 col = vec3(0.0); float m = 0.0;
  for(int L = 0; L < 2; L++){
    float fl = float(L); float dir = fl < 0.5 ? 1.0 : -1.0;
    vec2 p = kfold(rot(dir*t*0.07 + uMid*0.3)*uv, uSym)*(2.0 + fl*1.2);
    vec2 q = p*0.5; float acc = 0.0;
    for(int i = 0; i < 7; i++){ q = abs(q)/max(dot(q, q), 0.03) - vec2(0.8 + 0.1*sin(t*0.1 + uSeed), 0.6); acc += exp(-abs(q.x*q.y)*6.0); }
    float v = acc/7.0*1.3;
    col += pal(v*0.5 + fl*0.3 + t*0.05 + length(uv)*0.3)*v; m += v;
  }
  return vec4(col, m);
}

vec4 worldAmazon(vec2 uv, float t){
  vec2 p = rot(0.785)*(uv*5.0 + vec2(0.0, t*0.1));
  vec2 id = floor(p); vec2 f = fract(p) - 0.5;
  float h = hash(id + uSeed);
  float shape = mix(abs(f.x) + abs(f.y), max(abs(f.x), abs(f.y))*1.15, step(0.5, h));
  float k = smoothstep(0.05, 0.02, abs(shape - 0.42)) + 0.5*smoothstep(0.012, 0.004, abs(fract(shape*12.0) - 0.5)/12.0)*step(shape, 0.36);
  float y = 0.3*sin(uv.x*3.0 + t*0.5);
  float vine = exp(-abs(uv.y - y)*50.0) + exp(-abs(uv.y + y*0.8 - 0.2)*50.0);
  vec3 col = pal(0.1 + h*0.2)*k + pal(0.4)*vine;
  return vec4(col, k + vine);
}

vec4 worldTunnel(vec2 uv, float t){
  float r = length(uv) + 1e-3; float a = atan(uv.y, uv.x);
  vec2 q = fract(vec2(a/TAU*uSym, 0.3/r + t*0.35)) - 0.5;
  float acc = 0.0;
  for(int i = 0; i < 6; i++){ q = abs(q)/max(dot(q, q), 0.05) - vec2(1.0, 0.85); acc += exp(-abs(q.y)*5.0); }
  float v = acc/6.0;
  vec3 col = pal(v*0.6 + t*0.02)*v*2.0*smoothstep(0.0, 0.25, r);
  return vec4(col, 1.0);
}

vec3 girihLayer(vec2 p, float t){
  vec2 c = fract(p) - 0.5;
  float d = sdStar(c, 0.5, 8.0, 3.0);
  vec2 c2 = fract(p + 0.5) - 0.5;
  float d2 = sdStar(c2, 0.2, 8.0, 3.0);
  float strap = smoothstep(0.03, 0.012, abs(d)) + smoothstep(0.025, 0.01, abs(d2));
  float inner = smoothstep(0.012, 0.0, abs(sdStar(c, 0.28, 8.0, 3.0)));
  vec3 fill = d < 0.0 ? pal(0.05) * 0.55 : pal(0.55)*0.35;
  if(d2 < 0.0) fill = pal(0.8)*0.5;
  return fill + vec3(1.0, 0.95, 0.85)*strap*0.9 + pal(0.3)*inner;
}

vec4 worldGirih(vec2 uv, float t){
  float z = t*0.05;
  float s = pow(2.0, fract(z));
  vec2 p = rot(t*0.02)*uv;
  vec3 a = girihLayer(p*s*3.0, t);
  vec3 b = girihLayer(p*s*1.5, t);
  return vec4(mix(a, b, smoothstep(0.0, 1.0, fract(z))), 1.0);
}

vec4 worldLotus(vec2 uv, float t){
  float r = length(uv) + 1e-4; float a = atan(uv.y, uv.x);
  float lr = log(r)*3.0 - t*0.15;
  float bi = floor(lr); float bf = fract(lr);
  float n = 8.0*(1.0 + mod(bi, 2.0));
  float pa = fract(a/TAU*n + bi*0.5) - 0.5;
  float edge = 1.0 - pow(abs(pa)*2.0, 1.6);
  float petal = smoothstep(0.0, 0.05, edge*0.9 - bf);
  float outl = smoothstep(0.04, 0.0, abs(edge*0.9 - bf));
  vec3 col = pal(bi*0.15 + bf*0.3)*petal*0.8 + pal(bi*0.15 + 0.5)*outl;
  return vec4(col, petal + outl);
}

// Sacred-art tunnel: a public-domain artwork (Met / Rijksmuseum CC0) mapped through a log-polar zoom tunnel
vec4 worldArt(vec2 uv, float t){
  float r = length(uv); float a = atan(uv.y, uv.x);
  float sym = max(uSym, 6.0);
  float wa = abs(mod(a + t*0.08, TAU/sym) - PI/sym)*sym/PI;     // mirrored wedge 0..1
  float z = log(r + 1e-3)*0.9 - t*0.35;                          // endless inward zoom
  vec2 tp = vec2(wa*0.5 + 0.25, fract(z));
  vec2 kp = kfold(rot(-t*0.05)*uv, sym)*1.4;
  vec3 c1 = art(tp*vec2(1.0, 1.0));
  vec3 c2 = art(kp + vec2(0.1*sin(t*0.3), t*0.04));
  vec3 col = mix(c2, c1, smoothstep(0.15, 0.6, r));
  col *= 0.75 + 0.5*pow(0.5 + 0.5*sin(z*TAU*2.0), 3.0);         // light bands flowing toward you
  col += pal(t*0.06 + r)*exp(-r*5.0)*0.8;
  if(uTexOn < 0.5) return worldKaleido(uv, t);
  return vec4(col, 1.0);
}

void main(){
  vec2 uv0 = screenUV();
  vec2 uv = viewUV();
  float t = uTime;
  uv /= 1.0 + 0.55*uBass + 0.08*uPulse;
  uv *= rot(0.1*sin(t*0.2));
  vec4 acc = vec4(0.0);
  if(uW.x > 0.001) acc += worldKaleido(uv, t)*uW.x;
  if(uW.y > 0.001) acc += worldAmazon(uv, t)*uW.y;
  if(uW.z > 0.001) acc += worldTunnel(uv, t)*uW.z;
  if(uW.w > 0.001) acc += worldGirih(uv, t)*uW.w;
  if(uW4 > 0.001) acc += worldLotus(uv, t)*uW4;
  if(uW5 > 0.001) acc += worldArt(uv, t)*uW5;
  gl_FragColor = vec4(finish(acc.rgb, acc.a + 0.05, uv0), 1.0);
}
`;
