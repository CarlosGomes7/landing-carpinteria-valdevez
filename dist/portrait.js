import { coverLayout, targetGaze, damp } from './motion-math.js?v=3';

// The approved artwork remains the source of every pixel. A localized texture
// displacement animates the gaze and head; no synthetic eyes are pasted on top.
const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUV;
void main() {
  vUV = vec2((aPosition.x + 1.0) * 0.5, (1.0 - aPosition.y) * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;
const fragmentSource = `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uCrop;
uniform vec2 uOffset;
uniform vec2 uGaze;
uniform vec2 uHead;
varying vec2 vUV;
float influence(vec2 p, vec2 center, vec2 radius) {
  float d = length((p - center) / radius);
  return 1.0 - smoothstep(0.25, 1.0, d);
}
void main() {
  vec2 uv = vUV * uCrop + uOffset;
  // Different displacement strengths suggest depth without detaching the chin
  // from its supporting hand. This is a 2.5D image, not an articulated 3D rig.
  float edge = smoothstep(0.002, 0.045, uv.x) * (1.0 - smoothstep(0.955, 0.998, uv.x));
  float sides = smoothstep(0.19, 0.35, abs(uv.x - 0.52));
  float foreground = smoothstep(0.79, 0.94, uv.y);
  uv -= uHead * vec2(0.0035, 0.002) * sides * edge;
  uv -= uHead * vec2(0.0025, 0.001) * foreground * edge;
  float head = influence(uv, vec2(0.531, 0.307), vec2(0.116, 0.28));
  vec2 pivot = vec2(0.535, 0.49);
  float angle = -uHead.x * 0.028;
  mat2 turn = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 turned = turn * (uv - pivot) + pivot;
  vec2 p = mix(uv, turned, head);
  p -= uHead * vec2(0.006, 0.005) * head;
  // Pupil positions measured on the selected 1942 by 809 artwork.
  float leftEye = influence(p, vec2(0.493, 0.269), vec2(0.014, 0.025));
  float rightEye = influence(p, vec2(0.5335, 0.308), vec2(0.014, 0.025));
  p -= uGaze * vec2(0.004, 0.006) * max(leftEye, rightEye);
  gl_FragColor = texture2D(uImage, clamp(p, 0.001, 0.999));
}`;

export function initPortrait() {
  const canvas = document.querySelector('#portrait-canvas');
  const image = document.querySelector('#portrait-image');
  const stage = document.querySelector('.portrait-stage');
  const toggle = document.querySelector('#motion-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hint = document.querySelector('.gaze-hint');
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' }); } catch {}
  if (!gl) { toggle.hidden = true; if (hint) hint.hidden = true; return; }
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
  } catch (error) { console.warn('Retrato estático: animación no disponible.', error.message); toggle.hidden = true; return; }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['uCrop','uOffset','uGaze','uHead','uImage'].map(name => [name, gl.getUniformLocation(program, name)]));
  let ready = false, inView = true, paused = false, lost = false, frame = 0, previous = 0;
  let target = [0, 0], gaze = [0, 0], head = [0, 0];
  let layout = coverLayout(1, 1), rect;
  const enabled = () => ready && inView && !paused && !reducedMotion.matches && !document.hidden && !lost;
  function draw() {
    if (!ready || lost) return;
    gl.uniform2fv(uniforms.uCrop, layout.scale);
    gl.uniform2fv(uniforms.uOffset, layout.offset);
    gl.uniform2fv(uniforms.uGaze, gaze);
    gl.uniform2fv(uniforms.uHead, head);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function animate(now) {
    frame = 0;
    if (!enabled()) return;
    const dt = previous ? (now - previous) / 1000 : 1 / 60;
    previous = now;
    gaze = gaze.map((value, i) => damp(value, target[i], dt, 14));
    head = head.map((value, i) => damp(value, target[i], dt, 6));
    draw();
    const distance = gaze.reduce((sum, value, i) => sum + Math.abs(value - target[i]) + Math.abs(head[i] - target[i]), 0);
    if (distance > .0002) frame = requestAnimationFrame(animate);
    else previous = 0;
  }
  function wake() { if (enabled() && !frame) { previous = 0; frame = requestAnimationFrame(animate); } }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function neutral() { target = [0, 0]; wake(); }
  function resize() {
    rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    layout = coverLayout(rect.width, rect.height, matchMedia('(max-width:760px)').matches);
    draw();
  }
  function pointer(event) {
    if (!enabled()) return;
    if (event.pointerType === 'touch' && !stage.contains(event.target)) return;
    rect = stage.getBoundingClientRect();
    target = targetGaze(event.clientX, event.clientY, rect, layout);
    if (hint) hint.classList.add('has-interacted');
    wake();
  }
  function syncToggle() {
    toggle.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Activar movimiento' : 'Pausar movimiento';
    toggle.setAttribute('aria-label', `${label} del retrato`);
    toggle.querySelector('.motion-label').textContent = label;
    toggle.querySelector('.motion-indicator').textContent = paused ? '▷' : 'Ⅱ';
    if (!enabled()) stop(); else wake();
  }
  toggle.addEventListener('click', () => { paused = !paused; syncToggle(); });
  window.addEventListener('pointermove', pointer, { passive: true });
  window.addEventListener('pointerdown', pointer, { passive: true });
  stage.addEventListener('pointerdown', pointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', neutral);
  stage.addEventListener('pointerup', event => { if (event.pointerType === 'touch') neutral(); });
  stage.addEventListener('pointercancel', neutral);
  window.addEventListener('blur', neutral);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else wake(); });
  reducedMotion.addEventListener('change', () => {
    stop();
    target = gaze = head = [0, 0];
    draw();
    syncToggle();
  });
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) wake(); else stop(); }).observe(stage);
  new ResizeObserver(resize).observe(stage);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; stop(); canvas.classList.remove('ready'); toggle.hidden = true; });
  // Keep the accessible static portrait if the device cannot restore its context.
  function load() {
    try {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(uniforms.uImage, 0);
      ready = true; resize(); draw(); canvas.classList.add('ready');
    } catch (error) { console.warn('Retrato estático: no se pudo preparar la animación.', error.message); toggle.hidden = true; }
  }
  if (image.complete && image.naturalWidth) load(); else image.addEventListener('load', load, { once: true });
  image.addEventListener('error', () => { toggle.hidden = true; }, { once: true });
}
