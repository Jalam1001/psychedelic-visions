import { COMMON } from './common';

/**
 * Psychedelic kaleidoscope: three counter-rotating layers, each folded into uSym mirrored wedges,
 * textured with an escape-time "kali" fold fractal (z -> |z|/|z|^2 - c), fbm domain warping and rings.
 * Modes: 0 crystal, 1 nebula, 2 jewel facets.
 */
export const KALEIDOSCOPE_FRAG = COMMON + /* glsl */ `
void main(){
  vec2 uv0 = screenUV();
  vec2 uv = viewUV();
  float t = uTime;
  uv /= 1.0 + 0.35*uBass + 0.05*uPulse;              // bass -> geometric expansion
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
    vec3 c = pal(v*0.45 + length(p)*0.05 + fl*0.21 + t*0.015);
    float w = 1.0/(1.0 + fl*0.8);
    col += c*v*w; mask += v*w;
  }
  col += pal(t*0.03 + 0.5)*exp(-r0*6.0)*(0.35 + 0.6*uBass);
  gl_FragColor = vec4(finish(col*0.34, mask*1.5 + 0.1, uv0), 1.0);
}
`;
