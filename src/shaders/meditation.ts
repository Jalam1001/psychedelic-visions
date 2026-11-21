import { COMMON } from './common';

/** Meditation: slow breathing rosette; uBreath (0..1) follows the chosen breathing pattern. */
export const MEDITATION_FRAG = COMMON + /* glsl */ `
uniform float uBreath;
void main(){
  vec2 uv0 = screenUV();
  vec2 uv = viewUV();
  float t = uTime;
  float s = 0.8 + 0.35*uBreath;
  uv /= s;
  float r = length(uv); float a = atan(uv.y, uv.x);
  vec3 col = vec3(0.0); float mask = 0.0;
  for(int i = 0; i < 7; i++){
    float fi = float(i);
    if(fi >= uLayers) break;
    float rr = 0.12 + fi*0.1;
    float n = uPetals + fi*2.0;
    float dir = mod(fi, 2.0) < 1.0 ? 1.0 : -1.0;
    float ang = a + dir*t*0.02 + fi*0.3;
    float petal = rr + 0.04*cos(ang*n)*(0.5 + 0.5*uBreath);
    float line = exp(-abs(r - petal)*120.0)*0.7 + exp(-abs(r - petal)*18.0)*0.12;
    col += pal(fi*0.09 + t*0.005)*line;
    mask += line;
  }
  col += pal(0.5 + t*0.004)*exp(-r*5.0)*(0.25 + 0.35*uBreath);
  gl_FragColor = vec4(finish(col*0.9, mask + 0.2, uv0), 1.0);
}
`;
