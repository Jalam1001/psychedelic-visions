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
#define PI 3.14159265
#define TAU 6.28318531
vec3 pal(float t){ return clamp(uPA + uPB*cos(TAU*(uPC*t + uPD + uHue)), 0.0, 1.0); }
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
  col = 1.0 - exp(-col*1.25);
  col = pow(col, vec3(1.3));            // deepen shadows, richer colour
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 0.35 + 0.75*uIntensity);
  col *= uBright*(1.0 + 0.06*uPulse);
  col = mix(uBg, col, clamp(mask, 0.0, 1.0));
  col *= 1.0 - 0.35*smoothstep(0.55, 1.3, length(uv));
  return col;
}
`;
