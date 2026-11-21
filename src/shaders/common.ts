/** Shared GLSL (WebGL1 / GLSL ES 1.00) uniforms and helpers used by every shader program. */
export const COMMON = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform float uSym; uniform float uComplex; uniform float uDepth; uniform float uRot;
uniform float uZoom; uniform vec2 uPan; uniform float uBright; uniform float uIntensity;
uniform float uMode; uniform float uHue; uniform vec3 uBg;
uniform vec3 uPA; uniform vec3 uPB; uniform vec3 uPC; uniform vec3 uPD;
uniform float uBass; uniform float uMid; uniform float uHigh; uniform float uPulse;
uniform float uPetals; uniform float uLayers;
uniform vec3 uSw[6]; uniform float uSwMix;
uniform sampler2D uTex; uniform float uTexOn; uniform float uBackdrop;
#define PI 3.14159265
#define TAU 6.28318531
vec3 cpal(float t){ return clamp(uPA + uPB*cos(TAU*(uPC*t + uPD + uHue)), 0.0, 1.0); }
// Cyclic smooth gradient through the 6 swatch colours (real colours sampled from source artworks)
vec3 spal(float t){
  float x = fract(t + uHue)*6.0; vec3 c = vec3(0.0); float ws = 0.0;
  for(int i = 0; i < 6; i++){
    float d = abs(x - float(i)); d = min(d, 6.0 - d);
    float w = smoothstep(1.0, 0.0, d); c += uSw[i]*w; ws += w;
  }
  return c/max(ws, 1e-3);
}
vec3 pal(float t){ return mix(cpal(t), spal(t), uSwMix); }
// Source-art texture lookup with gentle saturation lift (mirrored repeat)
vec3 art(vec2 p){
  vec2 q = abs(fract(p*0.5 + 0.5)*2.0 - 1.0);
  vec3 c = texture2D(uTex, q).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return clamp(mix(vec3(l), c, 1.5), 0.0, 1.0);
}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for(int i = 0; i < 5; i++){ v += a*noise(p); p = m*p; a *= 0.5; } return v; }
// Radial mirror fold into one of n wedges (kaleidoscope reflection group D_n)
vec2 kfold(vec2 p, float n){ float a = atan(p.y, p.x); float r = length(p); float s = TAU/n;
  a = mod(a, s); a = abs(a - 0.5*s); return r*vec2(cos(a), sin(a)); }
vec2 screenUV(){ return (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x, uRes.y); }
vec2 viewUV(){ return screenUV()/uZoom - uPan; }
vec3 finish(vec3 col, float mask, vec2 uv){
  vec3 glow = col*col*0.35;                            // cheap bloom: bright areas bleed light
  col = 1.0 - exp(-(col + glow)*1.35);                 // filmic-ish tonemap
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 1.05 + 0.55*uIntensity);     // vivid saturation
  col = clamp(col, 0.0, 1.0);
  col = mix(col, col*col*(3.0 - 2.0*col), 0.45);       // S-curve contrast
  col *= uBright*(1.0 + 0.06*uPulse);
  vec3 bgc = uBg;
  if(uBackdrop > 0.001 && uTexOn > 0.5){
    // atmospheric backdrop: a real artwork / space photo, slowly drifting and breathing behind the geometry
    vec2 bp = rot(0.02*sin(uTime*0.03))*uv*(0.95 - 0.06*sin(uTime*0.05)) + vec2(0.03*sin(uTime*0.02), 0.0);
    bgc = mix(uBg, art(bp)*(0.75 + 0.25*uBass), uBackdrop);
  }
  col = mix(bgc, col, clamp(mask, 0.0, 1.0));
  col *= 1.0 - 0.25*smoothstep(0.7, 1.4, length(uv));
  return col;
}
`;
