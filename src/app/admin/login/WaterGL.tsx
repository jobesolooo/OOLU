"use client";

import { useEffect, useRef } from "react";

/**
 * Falling water drawn on the GPU (WebGL fragment shader).
 *
 * mode "curtain": a full, opaque waterfall that tears open down the middle as
 *   `partAt`→`partAt+partFor` seconds pass (the walk-through entrance).
 * mode "shimmer": light, transparent streaks and droplets laid over the photo's
 *   own waterfall so the background feels alive.
 *
 * If WebGL isn't available the canvas simply stays empty.
 */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 r;        // canvas size in px
uniform float t;       // seconds
uniform float part;    // 0 = closed curtain, 1 = fully parted
uniform float mode;    // 0 = curtain, 1 = shimmer

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / r;
  uv.y = 1.0 - uv.y;                       // 0 at top, 1 at bottom
  float asp = r.x / r.y;
  vec2 p = vec2(uv.x * asp, uv.y);

  // gentle sideways wobble so streams aren't ruler-straight
  float wob = (fbm(vec2(p.y * 2.0 - t * 0.6, p.x * 0.5)) - 0.5) * 0.04;
  float x = p.x + wob;

  // three layers of streaks, stretched tall, falling at different speeds
  float s1 = fbm(vec2(x * 42.0, p.y * 1.4 - t * 3.2));
  float s2 = fbm(vec2(x * 110.0 + 3.0, p.y * 3.0 - t * 5.4));
  float s3 = fbm(vec2(x * 16.0 + 7.0, p.y * 0.7 - t * 2.1));
  float streaks = smoothstep(0.48, 0.86, s1) * 0.65 + smoothstep(0.55, 0.92, s2) * 0.55 + smoothstep(0.42, 0.8, s3) * 0.45;

  // the curtain is thicker in some places than others (and that slowly shifts)
  float sheet = smoothstep(0.3, 0.7, fbm(vec2(x * 2.6, t * 0.15)));
  // pulses of heavier water travelling down
  float surge = smoothstep(0.45, 0.75, fbm(vec2(x * 4.0, p.y * 1.2 - t * 2.6)));

  // droplets: sparse bright points falling fast
  vec2 g = vec2(x * 55.0, p.y * 11.0 - t * 10.0);
  vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  float h = hash(id);
  float drop = step(0.9, h) * smoothstep(0.16, 0.0, length(f * vec2(1.0, 0.28)));

  // foam where the water lands
  float foamZone = smoothstep(0.62, 1.0, uv.y);
  float foam = foamZone * smoothstep(0.35, 0.8, fbm(vec2(x * 7.0 - t * 0.4, uv.y * 9.0 - t * 2.4))) * 1.3;

  // lavender light behind the falls
  float glow = exp(-length((uv - vec2(0.5, 0.48)) * vec2(asp * 0.85, 1.0)) * 2.4);

  vec3 waterCol = vec3(0.80, 0.78, 1.0);
  float lum = streaks * (0.55 + 0.55 * sheet) + surge * 0.18 + drop * 1.3 + foam * 0.6;

  if (mode > 0.5) {
    // shimmer: only the brightest streaks and droplets, transparent elsewhere
    float bright = smoothstep(0.35, 1.1, streaks) * (0.5 + 0.5 * sheet) + drop * 1.2;
    float a = clamp(bright * 0.45, 0.0, 0.75);
    gl_FragColor = vec4(waterCol * a, a);
    return;
  }

  vec3 deep = vec3(0.03, 0.025, 0.055) + vec3(0.20, 0.16, 0.42) * glow * (0.55 + part);
  vec3 col = deep + waterCol * lum * 0.9;

  // parting: a ragged gap opens from the centre outwards
  float edge = abs(uv.x - 0.5) * 2.0;
  float rag = (fbm(vec2(uv.y * 5.0, t * 1.5)) - 0.5) * 0.22;
  float open = mix(-0.3, 1.25, part); // fully closed until parting starts
  float keep = smoothstep(open - 0.06, open + 0.06, edge + rag);
  // bright spray along the torn edges
  float lip = (1.0 - abs(keep * 2.0 - 1.0)) * step(0.001, part);
  col += waterCol * lip * 0.55;

  float a = max(keep, lip * 0.6);
  gl_FragColor = vec4(col * a, a);
}`;

export function WaterGL({
  mode,
  className,
  partAt = 1.5,
  partFor = 1.1,
  stopAfter,
  scale = 0.6,
  fps = 60,
}: {
  mode: "curtain" | "shimmer";
  className?: string;
  /** seconds after mount when the curtain starts to part */
  partAt?: number;
  partFor?: number;
  /** stop drawing after this many seconds (saves battery once the intro is over) */
  stopAfter?: number;
  /** render resolution relative to CSS pixels */
  scale?: number;
  /** frame-rate cap (the background shimmer doesn't need 60) */
  fps?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const uPart = gl.getUniformLocation(prog, "part");
    const uMode = gl.getUniformLocation(prog, "mode");
    gl.uniform1f(uMode, mode === "shimmer" ? 1 : 0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uR, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();
    let raf = 0;
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    let last = 0;
    const minGap = 1000 / fps - 2;
    const frame = (now: number) => {
      if (now - last < minGap) {
        raf = requestAnimationFrame(frame);
        return;
      }
      last = now;
      const s = (now - start) / 1000;
      gl.uniform1f(uT, s + 3.7);
      gl.uniform1f(uPart, ease(Math.min(1, Math.max(0, (s - partAt) / partFor))));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (stopAfter === undefined || s < stopAfter) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // pause when the tab is hidden
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      // Free GPU memory but keep the context usable: React (dev) mounts effects twice,
      // and a lost context can't be revived on the same canvas.
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [mode, partAt, partFor, stopAfter, scale, fps]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
