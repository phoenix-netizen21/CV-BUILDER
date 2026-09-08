// gradient-waves.js
// Vanilla WebGL2 implementation of @react-bits/GradientWaves-JS-CSS
// High-performance 3D raymarched ocean waves with interactive mouse parallax,
// crest illumination, horizon fog, and subtle grain texture.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GradientWaves = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_OPTIONS = {
    horizonColor: '#5227FF',
    waveColor: '#FF9FFC',
    crestColor: '#FFFFFF',
    speed: 0.4,
    amplitude: 2.5,
    waveScale: 0.6,
    waveRatio: 0.9,
    swell: 35,
    turbulence: 20,
    tilt: 1.11,
    zoom: 1.0,
    height: 5.5,
    fogDepth: 15,
    detail: 'medium',
    brightness: 1.0,
    opacity: 1.0,
    mouseInteraction: true,
    parallaxStrength: 0.5,
    grain: true,
    grainIntensity: 0.05
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ];
  };

  const detailToSteps = (detail) => {
    if (detail === 'low') return 40.0;
    if (detail === 'high') return 110.0;
    return 70.0;
  };

  const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function init(containerOrCanvas, userOptions = {}) {
    const options = Object.assign({}, DEFAULT_OPTIONS, userOptions);

    let canvas;
    let isAutoCanvas = false;

    if (!containerOrCanvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'gradient-waves-canvas';
      canvas.className = 'gradient-waves-canvas';
      document.body.insertBefore(canvas, document.body.firstChild);
      isAutoCanvas = true;
    } else if (containerOrCanvas instanceof HTMLCanvasElement) {
      canvas = containerOrCanvas;
    } else {
      const container = typeof containerOrCanvas === 'string'
        ? document.querySelector(containerOrCanvas)
        : containerOrCanvas;
      if (!container) return null;
      canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      container.appendChild(canvas);
    }

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.warn('WebGL2 not supported on this browser/hardware. GradientWaves background disabled.');
      return null;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }

    // Full-screen triangle covering the screen
    const triangleCoords = new Float32Array([
      -1.0, -1.0,
       3.0, -1.0,
      -1.0,  3.0
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleCoords, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations lookup
    const locs = {
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
      uAmplitude: gl.getUniformLocation(program, 'uAmplitude'),
      uWaveScale: gl.getUniformLocation(program, 'uWaveScale'),
      uWaveRatio: gl.getUniformLocation(program, 'uWaveRatio'),
      uSwell: gl.getUniformLocation(program, 'uSwell'),
      uTurbulence: gl.getUniformLocation(program, 'uTurbulence'),
      uTilt: gl.getUniformLocation(program, 'uTilt'),
      uZoom: gl.getUniformLocation(program, 'uZoom'),
      uHeight: gl.getUniformLocation(program, 'uHeight'),
      uFogDepth: gl.getUniformLocation(program, 'uFogDepth'),
      uSteps: gl.getUniformLocation(program, 'uSteps'),
      uBrightness: gl.getUniformLocation(program, 'uBrightness'),
      uOpacity: gl.getUniformLocation(program, 'uOpacity'),
      uGrain: gl.getUniformLocation(program, 'uGrain'),
      uGrainIntensity: gl.getUniformLocation(program, 'uGrainIntensity'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uParallax: gl.getUniformLocation(program, 'uParallax'),
      uEnableMouse: gl.getUniformLocation(program, 'uEnableMouse'),
      uHorizonColor: gl.getUniformLocation(program, 'uHorizonColor'),
      uWaveColor: gl.getUniformLocation(program, 'uWaveColor'),
      uCrestColor: gl.getUniformLocation(program, 'uCrestColor')
    };

    // Resize handler
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = isAutoCanvas
        ? { width: window.innerWidth, height: window.innerHeight }
        : canvas.getBoundingClientRect();

      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };

    window.addEventListener('resize', resize);
    resize();

    // Mouse tracking & smooth interpolation
    const currentMouse = [0.5, 0.5];
    const targetMouse = [0.5, 0.5];

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMouse[0] = Math.max(0.0, Math.min(1.0, x));
      targetMouse[1] = Math.max(0.0, Math.min(1.0, y));
    };

    const onPointerLeave = () => {
      targetMouse[0] = 0.5;
      targetMouse[1] = 0.5;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // Render loop state
    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const t0 = performance.now();

    const loop = (t) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Smooth mouse damping
      const tx = options.mouseInteraction ? targetMouse[0] : 0.5;
      const ty = options.mouseInteraction ? targetMouse[1] : 0.5;
      currentMouse[0] += 0.05 * (tx - currentMouse[0]);
      currentMouse[1] += 0.05 * (ty - currentMouse[1]);

      // Set uniforms
      gl.uniform2f(locs.iResolution, canvas.width, canvas.height);
      gl.uniform1f(locs.iTime, (t - t0) * 0.001);

      gl.uniform1f(locs.uSpeed, options.speed);
      gl.uniform1f(locs.uAmplitude, options.amplitude);
      gl.uniform1f(locs.uWaveScale, options.waveScale);
      gl.uniform1f(locs.uWaveRatio, options.waveRatio);
      gl.uniform1f(locs.uSwell, options.swell);
      gl.uniform1f(locs.uTurbulence, options.turbulence);
      gl.uniform1f(locs.uTilt, options.tilt);
      gl.uniform1f(locs.uZoom, options.zoom);
      gl.uniform1f(locs.uHeight, options.height);
      gl.uniform1f(locs.uFogDepth, options.fogDepth);
      gl.uniform1f(locs.uSteps, detailToSteps(options.detail));
      gl.uniform1f(locs.uBrightness, options.brightness);
      gl.uniform1f(locs.uOpacity, options.opacity);
      gl.uniform1f(locs.uGrain, options.grain ? 1.0 : 0.0);
      gl.uniform1f(locs.uGrainIntensity, options.grainIntensity);
      gl.uniform2f(locs.uMouse, currentMouse[0], currentMouse[1]);
      gl.uniform1f(locs.uParallax, options.parallaxStrength);
      gl.uniform1i(locs.uEnableMouse, options.mouseInteraction ? 1 : 0);

      const hc = hexToRgb(options.horizonColor);
      const wc = hexToRgb(options.waveColor);
      const cc = hexToRgb(options.crestColor);
      gl.uniform3f(locs.uHorizonColor, hc[0], hc[1], hc[2]);
      gl.uniform3f(locs.uWaveColor, wc[0], wc[1], wc[2]);
      gl.uniform3f(locs.uCrestColor, cc[0], cc[1], cc[2]);

      // Draw full-screen triangle
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLoc);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) {
        raf = requestAnimationFrame(loop);
      }
    };

    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    // Tab visibility handling
    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart();
      else tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();

    // Destroy / update API
    return {
      canvas,
      setOptions(newOptions) {
        Object.assign(options, newOptions);
      },
      destroy() {
        tryStop();
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerleave', onPointerLeave);
        document.removeEventListener('visibilitychange', onVisibility);
        if (canvas.parentNode && isAutoCanvas) {
          canvas.parentNode.removeChild(canvas);
        }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    };
  }

  // Auto-initialize background on DOMContentLoaded
  let instance = null;
  function autoInit() {
    if (instance) return;
    instance = init(null, DEFAULT_OPTIONS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  return {
    init,
    getInstance: () => instance
  };
});
