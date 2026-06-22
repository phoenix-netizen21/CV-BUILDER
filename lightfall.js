// lightfall.js
// Vanilla WebGL implementation of the interactive Lightfall background animation.
// Strictly optimized for GLSL ES 1.00/WebGL 1.0 compatibility.

(function () {
  const MAX_COLORS = 8;

  const hexToRGB = (hex) => {
    const c = hex.replace('#', '').padEnd(6, '0');
    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;
    return [r, g, b];
  };

  const prepColors = (input) => {
    const base = (input && input.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']).slice(0, MAX_COLORS);
    const count = base.length;
    const arr = [];
    for (let i = 0; i < MAX_COLORS; i++) {
      arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
    }
    const avg = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      avg[0] += arr[i][0];
      avg[1] += arr[i][1];
      avg[2] += arr[i][2];
    }
    avg[0] /= count;
    avg[1] /= count;
    avg[2] /= count;
    return { arr, count, avg };
  };

  const vertexShaderSource = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;

    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform float iTime;

    uniform vec3  uColor0;
    uniform vec3  uColor1;
    uniform vec3  uColor2;
    uniform vec3  uColor3;
    uniform vec3  uColor4;
    uniform vec3  uColor5;
    uniform vec3  uColor6;
    uniform vec3  uColor7;
    uniform int   uColorCount;

    uniform vec3  uBgColor;
    uniform vec3  uMouseColor;
    uniform float uSpeed;
    uniform int   uStreakCount;
    uniform float uStreakWidth;
    uniform float uStreakLength;
    uniform float uGlow;
    uniform float uDensity;
    uniform float uTwinkle;
    uniform float uZoom;
    uniform float uBgGlow;
    uniform float uOpacity;
    uniform float uMouseEnabled;
    uniform float uMouseStrength;
    uniform float uMouseRadius;

    varying vec2 vUv;

    vec3 palette(float h) {
      int count = uColorCount;
      if (count < 1) count = 1;
      int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
      if (idx <= 0) return uColor0;
      if (idx == 1) return uColor1;
      if (idx == 2) return uColor2;
      if (idx == 3) return uColor3;
      if (idx == 4) return uColor4;
      if (idx == 5) return uColor5;
      if (idx == 6) return uColor6;
      return uColor7;
    }

    vec3 tanhv(vec3 x) {
      vec3 e = exp(-2.0 * x);
      return (1.0 - e) / (1.0 + e);
    }

    vec2 sceneC(vec2 frag, vec2 r) {
      vec2 P = (frag + frag - r) / r.x;
      float z = 0.0;
      float d = 1000.0;
      vec4 O = vec4(0.0);
      for (int k = 0; k < 39; k++) {
        if (d <= 0.0001) break;
        O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
        d = 1.0 - sqrt(length(O * O));
        z += d;
      }
      return vec2(O.x, atan(O.z, O.y));
    }

    void mainImage(out vec4 o, vec2 C) {
      vec2 r = iResolution.xy;
      vec2 uv0 = (C + C - r) / r.x;
      float T = 0.1 * iTime * uSpeed + 9.0;
      float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
      vec2 Y = vec2(0.005, 6.28318530718 / angRings);

      vec2 c0 = sceneC(C, r);
      vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
      vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
      vec2 dCx = cdx - c0;
      vec2 dCy = cdy - c0;
      dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
      dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
      vec2 fw = abs(dCx) + abs(dCy);
      C = c0;

      vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
      vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1000.0 * dot(P, P) + 6.0), 0.0);

      float mGlow = 0.0;
      if (uMouseEnabled > 0.5) {
        vec2 mN = (iMouse + iMouse - r) / r.x;
        float md = length(uv0 - mN);
        mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 0.0001)) * uMouseStrength;
        O.rgb += uMouseColor * mGlow * 0.25;
      }

      float zr = 0.0005 * uStreakWidth;
      vec2 rr = vec2(max(length(fw), 0.00001));
      float tail = 19.0 / max(uStreakLength, 0.05);

      for (int m = 0; m < 16; m++) {
        if (m >= uStreakCount) break;
        float jf = float(m) + 1.0;
        float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
        vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
        Pp -= floor(Pp / Y + vec2(0.5)) * Y;
        float h = fract(8663.0 * ic);
        vec3 col = palette(h);
        float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
        weight *= (1.0 + mGlow * 2.0);
        vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - vec2(zr);
        vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
        O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
        C.x += Y.x / 8.0;
      }

      vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
      o = vec4(colr, uOpacity);
    }

    void main() {
      vec4 color;
      mainImage(color, vUv * iResolution.xy);
      gl_FragColor = color;
    }
  `;

  document.addEventListener("DOMContentLoaded", () => {
    // Canvas setup
    const canvas = document.createElement("canvas");
    canvas.id = "lightfall-canvas";
    document.body.insertBefore(canvas, document.body.firstChild);

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL not supported, Lightfall background is disabled.");
      return;
    }

    // Resize handling
    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    // Shader creation helpers
    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compiler failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("WebGL program link failed:", gl.getProgramInfoLog(program));
      return;
    }

    // Geometry buffers (2 triangles for full-screen quad)
    const vertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1
    ]);
    const uvs = new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLocation = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations lookup
    const iResolutionLoc = gl.getUniformLocation(program, "iResolution");
    const iMouseLoc = gl.getUniformLocation(program, "iMouse");
    const iTimeLoc = gl.getUniformLocation(program, "iTime");

    const uColorCountLoc = gl.getUniformLocation(program, "uColorCount");
    const uBgColorLoc = gl.getUniformLocation(program, "uBgColor");
    const uMouseColorLoc = gl.getUniformLocation(program, "uMouseColor");
    const uSpeedLoc = gl.getUniformLocation(program, "uSpeed");
    const uStreakCountLoc = gl.getUniformLocation(program, "uStreakCount");
    const uStreakWidthLoc = gl.getUniformLocation(program, "uStreakWidth");
    const uStreakLengthLoc = gl.getUniformLocation(program, "uStreakLength");
    const uGlowLoc = gl.getUniformLocation(program, "uGlow");
    const uDensityLoc = gl.getUniformLocation(program, "uDensity");
    const uTwinkleLoc = gl.getUniformLocation(program, "uTwinkle");
    const uZoomLoc = gl.getUniformLocation(program, "uZoom");
    const uBgGlowLoc = gl.getUniformLocation(program, "uBgGlow");
    const uOpacityLoc = gl.getUniformLocation(program, "uOpacity");
    const uMouseEnabledLoc = gl.getUniformLocation(program, "uMouseEnabled");
    const uMouseStrengthLoc = gl.getUniformLocation(program, "uMouseStrength");
    const uMouseRadiusLoc = gl.getUniformLocation(program, "uMouseRadius");

    const uColorLocs = [];
    for (let i = 0; i < MAX_COLORS; i++) {
      uColorLocs.push(gl.getUniformLocation(program, `uColor${i}`));
    }

    // Mouse interactive coordinates
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    window.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) * window.devicePixelRatio;
      targetMouseY = (rect.height - (e.clientY - rect.top)) * window.devicePixelRatio;
    });

    // Default configuration (Matching requested properties)
    const config = {
      colors: ['#A6C8FF', '#5227FF', '#FF9FFC'],
      backgroundColor: "#000000",
      speed: 0.5,
      streakCount: 2,
      streakWidth: 1.0,
      streakLength: 1.0,
      glow: 1.0,
      density: 0.6,
      twinkle: 1.0,
      zoom: 3.0,
      backgroundGlow: 0.5,
      opacity: 1.0,
      mouseEnabled: 1.0,
      mouseStrength: 0.5,
      mouseRadius: 1.0,
      mouseDampening: 0.15
    };

    // Render loop
    const loop = (time) => {
      // Mouse dampening interpolation
      const dt = 0.016; // Approx 60fps
      const tau = Math.max(1e-4, config.mouseDampening);
      const factor = 1 - Math.exp(-dt / tau);
      mouseX += (targetMouseX - mouseX) * factor;
      mouseY += (targetMouseY - mouseY) * factor;

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Bind attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLocation);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(uvLocation);

      // Set global resolution, time, mouse coordinates
      gl.uniform3f(iResolutionLoc, canvas.width, canvas.height, 1.0);
      gl.uniform2f(iMouseLoc, mouseX, mouseY);
      gl.uniform1f(iTimeLoc, time * 0.001);

      // Prepare and bind colors
      const { arr, count, avg } = prepColors(config.colors);
      gl.uniform1i(uColorCountLoc, count);
      gl.uniform3fv(uBgColorLoc, hexToRGB(config.backgroundColor));
      gl.uniform3fv(uMouseColorLoc, avg);

      for (let i = 0; i < MAX_COLORS; i++) {
        gl.uniform3fv(uColorLocs[i], arr[i]);
      }

      // Bind all other parameters
      gl.uniform1f(uSpeedLoc, config.speed);
      gl.uniform1i(uStreakCountLoc, Math.max(1, Math.min(16, Math.round(config.streakCount))));
      gl.uniform1f(uStreakWidthLoc, config.streakWidth);
      gl.uniform1f(uStreakLengthLoc, config.streakLength);
      gl.uniform1f(uGlowLoc, config.glow);
      gl.uniform1f(uDensityLoc, config.density);
      gl.uniform1f(uTwinkleLoc, config.twinkle);
      gl.uniform1f(uZoomLoc, config.zoom);
      gl.uniform1f(uBgGlowLoc, config.backgroundGlow);
      gl.uniform1f(uOpacityLoc, config.opacity);
      gl.uniform1f(uMouseEnabledLoc, config.mouseEnabled);
      gl.uniform1f(uMouseStrengthLoc, config.mouseStrength);
      gl.uniform1f(uMouseRadiusLoc, config.mouseRadius);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  });
})();
