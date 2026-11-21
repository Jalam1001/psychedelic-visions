import { COMMON } from './common';

/**
 * Psychedelic kaleidoscopic mandala: concentric petal bands in log-polar space flow outward forever
 * (each band is a recursive copy of the previous at a larger scale), radially mirrored with uSym and
 * textured with a kali fold fractal.
 */
export const MANDALA_FRAG = COMMON + /* glsl */ `
void main(){
  vec2 uv0 = screenUV();
  vec2 uv = viewUV();
  float t = uTime;
  uv /= 1.0 + 0.3*uBass + 0.05*uPulse;
  float r = length(uv) + 1e-4;
  float a = atan(uv.y, uv.x);
  float k = max(2.0, uLayers)*0.55;
  float lr = log(r)*k - t*0.12;              // outward flowing bands
  float bi = floor(lr); float bf = fract(lr);
  float n = uPetals*(1.0 + mod(bi, 3.0)*0.5);
  float dir = mod(bi, 2.0) < 1.0 ? 1.0 : -1.0;
  float pa = fract(a/TAU*n + bi*0.5 + dir*t*0.02*uRot*2.0 + uMid*0.05*dir) - 0.5;
  float edge = 1.0 - pow(abs(pa)*2.0, 1.6);  // petal profile
  float petal = smoothstep(0.0, 0.04, edge*0.92 - bf);
  float outline = smoothstep(0.035, 0.0, abs(edge*0.92 - bf));
  float vein = smoothstep(0.02, 0.0, abs(pa))*petal*step(0.15, bf);
  // fractal texture inside petals
  vec2 q = kfold(uv, uSym)*(2.0 + uComplex*3.0);
  float acc = 0.0;
  for(int i = 0; i < 8; i++){
    if(float(i) >= uDepth + 1.0) break;
    q = abs(q)/max(dot(q, q), 0.04) - vec2(0.9 + 0.1*sin(t*0.1), 0.62 + 0.08*cos(t*0.13));
    acc += exp(-abs(q.x*q.y)*(6.0 + uHigh*8.0));
  }
  float tex = acc/(uDepth + 1.0);
  vec3 base = pal(bi*0.13 + bf*0.25 + t*0.01);
  vec3 col = base*petal*(0.35 + tex*1.6) + pal(bi*0.13 + 0.5)*outline*1.3 + vec3(1.0)*vein*0.25;
  // dotted ring between bands
  float dots = smoothstep(0.25, 0.1, length(vec2(fract(a/TAU*n*2.0 + 0.25) - 0.5, (bf - 0.97)*6.0)));
  col += pal(bi*0.2 + 0.3)*dots;
  // bindu
  col += pal(t*0.04)*exp(-r*18.0)*1.5;
  float mask = petal + outline + dots + 0.05;
  gl_FragColor = vec4(finish(col, mask, uv0), 1.0);
}
`;
