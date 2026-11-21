import { COMMON } from './common';

/**
 * Psychedelic kaleidoscope: three counter-rotating layers, each folded into uSym mirrored wedges,
 * textured with an escape-time "kali" fold fractal (z -> |z|/|z|^2 - c), fbm domain warping and rings.
 * Modes: 0 crystal, 1 nebula, 2 jewel facets, 3 source art (a licensed public-domain artwork folded into the mirrors).
 */
export const KALEIDOSCOPE_FRAG = COMMON + /* glsl */ `
void main(){
  vec2 uv0 = screenUV();
  vec2 uv = viewUV();
  float t = uTime;
  uv /= 1.0 + 0.6*uBass + 0.08*uPulse;               // bass -> geometric expansion
  uv *= rot(0.15*sin(t*0.23))*(1.0 + 0.12*sin(t*0.31));  // breathing sway & zoom
  // zoom-tunnel warp: radial log-zoom that keeps flowing outward
  float rr = length(uv); uv *= 1.0 + 0.25*uComplex*sin(log(rr + 0.05)*3.0 - t*1.4);
  float r0 = length(uv);
  vec3 col = vec3(0.0); float mask = 0.0;
  float detail = 0.5 + uComplex*1.5 + uHigh*0.5;      // highs -> finer detail
  for(int L = 0; L < 3; L++){
    float fl = float(L);
    float dir = mod(fl, 2.0) < 0.5 ? 1.0 : -1.0;       // counter-rotating layers
    float ang = dir*(t*(0.06 + 0.035*fl)*uRot*2.0 + uMid*0.35 + fl*0.6);  // mids -> rotation
    vec2 p = rot(ang)*uv;
    p = kfold(p, uSym);
    p *= (1.0 + fl*0.55)*(1.0 + detail);
    p += 0.12*uComplex*vec2(sin(p.y*3.0 + t*0.7), cos(p.x*3.0 - t*0.6));  // morphing
    vec2 q = p*0.55;
    float acc = 0.0; float trap = 10.0;
    for(int i = 0; i < 10; i++){
      if(float(i) >= uDepth + 2.0) break;
      q = abs(q)/max(dot(q, q), 0.03) - vec2(0.82 + 0.12*sin(t*0.11 + fl*1.7), 0.58 + 0.12*cos(t*0.09 + fl));
      trap = min(trap, abs(length(q) - 0.6));
      acc += exp(-abs(q.x*q.y)*(5.0 + uHigh*8.0));
    }
    float n = fbm(p*1.2 + vec2(t*0.12, -t*0.08) + fl*3.1);
    float rings = 0.5 + 0.5*sin(length(p)*6.0 - t*1.1*dir + n*5.0);
    float v = acc/(uDepth + 2.0)*1.3 + exp(-trap*7.0)*0.8 + rings*n*0.35;
    if(uMode > 0.5 && uMode < 1.5){ v = mix(v, fbm(p*2.0 + v) * 1.4, 0.55); }
    if(uMode > 1.5){ v = floor(v*5.0 + 0.5)/5.0 + 0.15*smoothstep(0.02, 0.0, abs(fract(v*5.0) - 0.5) - 0.47); }
    vec3 c = pal(v*0.45 + length(p)*0.05 + fl*0.21 + t*0.04);
    float w = 1.0/(1.0 + fl*0.8);
    col += c*v*w; mask += v*w;
  }
  col += pal(t*0.05 + 0.5)*exp(-r0*5.0)*(0.5 + 0.9*uBass);
  col += pal(t*0.07)*0.25*pow(0.5 + 0.5*sin(length(uv)*14.0 - t*3.0), 6.0)*(0.4 + uBass);  // outward light ripples
  col *= 0.42;
  if(uMode > 2.5 && uTexOn > 0.5){
    // Source art: the artwork itself sits between the mirrors, flowing and breathing; fractal light rides on top
    float ra = length(uv);
    vec2 ap = kfold(rot(t*0.07*(0.3 + uRot) + uMid*0.3)*uv, uSym);
    ap *= 1.25 + 0.12*sin(t*0.45 - ra*5.0) + 0.2*uBass;
    ap += vec2(0.06*sin(t*0.3), 0.0) + vec2(0.0, fract(t*0.03)*2.0);   // slow drift through the painting
    vec3 a = art(ap);
    float fr = clamp(mask*0.6, 0.0, 1.5);
    col = a*(0.38 + 0.22*fr) + col*0.22;
  }
  gl_FragColor = vec4(finish(col, (uMode > 2.5 && uTexOn > 0.5) ? 1.0 : mask*1.5 + 0.1, uv0), 1.0);
}
`;
