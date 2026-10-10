/* Self-contained WebGL 1 scene. Progressive enhancement; the CSS scene is its fallback.
   No continuous render loop, analytics, third-party dependencies or remote assets. */
(() => {
  'use strict';
  const host = document.querySelector('[data-infra-scene]');
  const hero = document.querySelector('[data-scroll-scene]');
  if (!host || !hero || !window.WebGLRenderingContext) return;
  const desktop = window.matchMedia('(min-width: 900px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'infra-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  if (!desktop.matches || reduced.matches) return;

  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: true, powerPreference: 'low-power' }); }
  catch (_error) { return; }
  if (!gl) return;

  const vert = `
    attribute vec3 a_position;
    attribute vec3 a_color;
    attribute float a_layer;
    uniform mat4 u_projection;
    uniform vec2 u_rotation;
    uniform float u_progress;
    varying vec3 v_color;
    void main() {
      vec3 p = a_position;
      p.y += (a_layer - 1.0) * u_progress * 0.68;
      float cx = cos(u_rotation.x), sx = sin(u_rotation.x);
      p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
      float cy = cos(u_rotation.y), sy = sin(u_rotation.y);
      p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
      p.z -= 7.4;
      gl_Position = u_projection * vec4(p, 1.0);
      v_color = a_color;
    }`;
  const frag = `
    precision mediump float;
    varying vec3 v_color;
    void main() { gl_FragColor = vec4(v_color, 1.0); }`;

  function shader(type, source) {
    const object = gl.createShader(type);
    gl.shaderSource(object, source);
    gl.compileShader(object);
    if (!gl.getShaderParameter(object, gl.COMPILE_STATUS)) {
      gl.deleteShader(object);
      return null;
    }
    return object;
  }
  const v = shader(gl.VERTEX_SHADER, vert), f = shader(gl.FRAGMENT_SHADER, frag);
  if (!v || !f) return;
  const program = gl.createProgram();
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  const vertices = [];
  const faces = [
    [0, 1, 2, 3, 1.00], [5, 4, 7, 6, 0.40],
    [4, 0, 3, 7, 0.61], [1, 5, 6, 2, 0.76],
    [3, 2, 6, 7, 0.77], [4, 5, 1, 0, 0.69]
  ];
  function box(x, y, z, width, height, depth, layer, rgb) {
    const w = width / 2, h = height / 2, d = depth / 2;
    const p = [
      [x-w,y+h,z-d], [x+w,y+h,z-d], [x+w,y+h,z+d], [x-w,y+h,z+d],
      [x-w,y-h,z-d], [x+w,y-h,z-d], [x+w,y-h,z+d], [x-w,y-h,z+d]
    ];
    for (const face of faces) {
      const color = rgb.map(channel => Math.min(1, channel * face[4]));
      for (const index of [face[0],face[1],face[2],face[0],face[2],face[3]]) {
        vertices.push(...p[index], ...color, layer);
      }
    }
  }
  const plates = [
    { y:-1.42, layer:0, rgb:[0.88,0.52,0.30] },
    { y:0, layer:1, rgb:[0.55,0.73,0.84] },
    { y:1.42, layer:2, rgb:[0.32,0.63,0.96] }
  ];
  for (const plate of plates) {
    box(0,plate.y,0,4.5,.18,2.85,plate.layer,plate.rgb);
    for (const x of [-1.35,0,1.35]) {
      box(x,plate.y+.20,-.50,.45,.31,.44,plate.layer,[.86,.93,.97]);
      box(x,plate.y+.15,.55,.60,.19,.26,plate.layer,plate.rgb.map(c => Math.min(1,c*1.12)));
    }
  }
  for (const x of [-1.85,1.85]) for (const z of [-1.02,1.02]) {
    box(x,0,z,.065,2.9,.065,1,[.37,.52,.65]);
  }
  const buffer = gl.createBuffer();
  if (!buffer) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.useProgram(program);
  const stride = 7 * Float32Array.BYTES_PER_ELEMENT;
  for (const [name,size,offset] of [['a_position',3,0],['a_color',3,12],['a_layer',1,24]]) {
    const location = gl.getAttribLocation(program, name);
    if (location < 0) return;
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location,size,gl.FLOAT,false,stride,offset);
  }
  const projection = gl.getUniformLocation(program,'u_projection');
  const rotation = gl.getUniformLocation(program,'u_rotation');
  const progress = gl.getUniformLocation(program,'u_progress');
  if (!projection || !rotation || !progress) return;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0,0,0,0);
  host.insertBefore(canvas,host.firstChild);
  host.classList.add('webgl-ready');
  host.dataset.renderMode = 'webgl';

  let frame = 0, pointerX = 0, pointerY = 0, active = true;
  function render() {
    frame = 0;
    if (!active || !desktop.matches || reduced.matches || document.hidden) return;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.min(1800, Math.max(1,Math.round(bounds.width * ratio)));
    const height = Math.min(1200, Math.max(1,Math.round(bounds.height * ratio)));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      gl.viewport(0,0,width,height);
    }
    const heroRect = hero.getBoundingClientRect();
    const travel = Math.max(1,heroRect.height + window.innerHeight);
    const amount = Math.max(0,Math.min(1,(window.innerHeight-heroRect.top)/travel));
    const aspect = width / height, near=.1, far=40, scale=1/Math.tan(Math.PI/7);
    const matrix = new Float32Array([
      scale/aspect,0,0,0, 0,scale,0,0,
      0,0,(far+near)/(near-far),-1,
      0,0,(2*far*near)/(near-far),0
    ]);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(projection,false,matrix);
    gl.uniform2f(rotation,.42 + pointerY*.14 + amount*.08,-.48 + pointerX*.18 + amount*.27);
    gl.uniform1f(progress,amount);
    gl.drawArrays(gl.TRIANGLES,0,vertices.length/7);
  }
  function requestRender() {
    if (!frame && active) frame = window.requestAnimationFrame(render);
  }
  function preferenceChange() {
    const enabled = desktop.matches && !reduced.matches;
    host.classList.toggle('webgl-ready',enabled);
    host.dataset.renderMode = enabled ? 'webgl' : 'css';
    if (enabled) requestRender();
  }
  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    pointerX = Math.max(-1,Math.min(1,(event.clientX-r.left)/Math.max(r.width,1)*2-1));
    pointerY = Math.max(-1,Math.min(1,(event.clientY-r.top)/Math.max(r.height,1)*2-1));
    requestRender();
  },{ passive:true });
  hero.addEventListener('pointerleave',() => { pointerX=0;pointerY=0;requestRender(); });
  window.addEventListener('scroll',requestRender,{ passive:true });
  window.addEventListener('resize',requestRender,{ passive:true });
  document.addEventListener('visibilitychange',requestRender);
  desktop.addEventListener('change',preferenceChange);
  reduced.addEventListener('change',preferenceChange);
  canvas.addEventListener('webglcontextlost',event => {
    event.preventDefault();
    active=false;
    if (frame) window.cancelAnimationFrame(frame);
    host.classList.remove('webgl-ready');
    host.dataset.renderMode = 'css';
  });
  if ('ResizeObserver' in window) new ResizeObserver(requestRender).observe(host);
  requestRender();
})();
