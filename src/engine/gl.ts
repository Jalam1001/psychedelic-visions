export type UniformValue = number | number[] | Float32Array;

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

/** Minimal full-screen fragment shader renderer (raw WebGL1 for widest device support). */
export class ShaderRenderer {
  gl: WebGLRenderingContext;
  private prog: WebGLProgram | null = null;
  private locs = new Map<string, WebGLUniformLocation | null>();
  private buf: WebGLBuffer | null;
  error: string | null = null;

  private constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }

  static create(canvas: HTMLCanvasElement, frag: string): ShaderRenderer | null {
    const opts: WebGLContextAttributes = { antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance' };
    const gl = (canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts)) as WebGLRenderingContext | null;
    if (!gl) return null;
    const r = new ShaderRenderer(gl);
    r.setFragment(frag);
    return r;
  }

  setFragment(src: string) {
    const gl = this.gl;
    const compile = (type: number, s: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, s);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh);
        gl.deleteShader(sh);
        throw new Error(log || 'shader compile error');
      }
      return sh;
    };
    try {
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, src);
      const p = gl.createProgram()!;
      gl.attachShader(p, vs); gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, 'aPos');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link error');
      if (this.prog) gl.deleteProgram(this.prog);
      this.prog = p;
      this.locs.clear();
      this.error = null;
    } catch (e) {
      this.error = String(e);
      console.error('[shader]', e);
    }
  }

  render(width: number, height: number, uniforms: Record<string, UniformValue>) {
    const gl = this.gl;
    if (!this.prog) return;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.prog);
    for (const k in uniforms) {
      let loc = this.locs.get(k);
      if (loc === undefined) { loc = gl.getUniformLocation(this.prog, k); this.locs.set(k, loc); }
      if (!loc) continue;
      const v = uniforms[k];
      if (typeof v === 'number') gl.uniform1f(loc, v);
      else if (v.length === 2) gl.uniform2fv(loc, v as Float32List);
      else if (v.length === 3) gl.uniform3fv(loc, v as Float32List);
      else if (v.length === 4) gl.uniform4fv(loc, v as Float32List);
      else gl.uniform1fv(loc, v as Float32List);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    if (this.prog) gl.deleteProgram(this.prog);
    if (this.buf) gl.deleteBuffer(this.buf);
  }
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch { return false; }
}
