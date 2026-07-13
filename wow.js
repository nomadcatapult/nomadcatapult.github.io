document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Custom Cursor ---
  const cursor = document.getElementById('custom-cursor');
  const supportsCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const heroVideo = document.getElementById('hero-video');

  if (cursor && supportsCustomCursor) {
    document.body.classList.add('custom-cursor-active');
    const cursorText = cursor.querySelector('.cursor-text');
    let mouse = { x: 0, y: 0 };
    let cursorObj = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!cursor.classList.contains('visible')) {
        cursor.classList.add('visible');
      }
    });

    // The small amount of lag is intentional, but the cursor remains compact on controls.
    gsap.ticker.add(() => {
      cursorObj.x += (mouse.x - cursorObj.x) * 0.15;
      cursorObj.y += (mouse.y - cursorObj.y) * 0.15;
      cursor.style.transform = `translate(${cursorObj.x}px, ${cursorObj.y}px) translate(-50%, -50%)`;
    });

    const interactiveElements = document.querySelectorAll('a, button, .btn, .work-item');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hovered');
        cursorText.textContent = el.classList.contains('work-item') ? 'VIEW' : '';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovered');
        cursorText.textContent = '';
      });
    });

    if (heroVideo) {
      heroVideo.addEventListener('mouseenter', () => {
        cursor.classList.add('hovered');
        cursorText.textContent = 'WATCH';
      });
      heroVideo.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovered');
        cursorText.textContent = '';
      });
    }
  }

  // --- 2. Magnetic Buttons ---
  const magneticElements = document.querySelectorAll('.btn, .nav-link, .logo a');
  
  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      // Calculate mouse position relative to the center of the element
      const x = (e.clientX - rect.left) - rect.width / 2;
      const y = (e.clientY - rect.top) - rect.height / 2;
      
      // Move element towards mouse (damping factor 0.3)
      gsap.to(el, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    el.addEventListener('mouseleave', () => {
      // Return to original position
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.3)'
      });
    });
  });

  // --- 3. GSAP Scroll Logic & Typography Zoom ---
  gsap.registerPlugin(ScrollTrigger);

  const heroSection = document.getElementById('hero');
  const zoomContainer = document.getElementById('hero-zoom-container');
  const zoomText = document.getElementById('hero-zoom-text');
  
  let videoEnded = false;
  let zoomScrollTrigger = null;

  if (heroVideo && heroSection && zoomContainer) {
    
    // Pause video if scrolled away before it ends
    ScrollTrigger.create({
      trigger: heroSection,
      start: "top top",
      end: "bottom center",
      onLeave: () => {
        if (!videoEnded) {
          heroVideo.pause();
        }
      },
      onEnterBack: () => {
        if (!videoEnded) {
          heroVideo.play();
        }
      }
    });

    // When video ends, show the text and enable zoom effect
    heroVideo.addEventListener('ended', () => {
      videoEnded = true;
      zoomContainer.classList.add('active');
      
      // Animate text appearance
      gsap.fromTo(zoomText, 
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.5, ease: 'power3.out' }
      );

      // Create pinning and zooming ScrollTrigger
      zoomScrollTrigger = ScrollTrigger.create({
        trigger: heroSection,
        start: "top top",
        end: "+=2000", // 2000px of scrolling for the zoom
        pin: true,
        animation: gsap.to(zoomText, {
          scale: 150, // Scale up infinitely
          opacity: 0, // Fade out as we pass through
          ease: "power2.in",
          duration: 1
        }),
        scrub: 1
      });
    });
  }

  // --- 4. WebGL Shaders (Three.js) ---
  const initWebGL = () => {
    if (typeof THREE === 'undefined') return;

    // Background Noise Shader
    const bgContainer = document.getElementById('webgl-container');
    if (bgContainer) {
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      bgContainer.appendChild(renderer.domElement);

      const geometry = new THREE.PlaneGeometry(2, 2);
      const uniforms = {
        u_time: { value: 0.0 },
        u_mouse: { value: new THREE.Vector2() },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      };

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        transparent: true,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec2 u_mouse;
          uniform vec2 u_resolution;
          varying vec2 vUv;

          // Simple random function for noise
          float random(vec2 st) {
              return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
          }

          void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            
            // Mouse interaction distance
            float dist = distance(st, u_mouse);
            
            // Generate animated grain
            vec2 noisePos = st * vec2(u_resolution.x/10.0, u_resolution.y/10.0) + u_time * 0.5;
            float noise = random(noisePos) * 0.06;
            
            // Glow around mouse
            float glow = smoothstep(0.5, 0.0, dist) * 0.08;
            
            // Base dark blueish tint (matching site bg)
            vec3 color = vec3(0.03, 0.035, 0.04) + glow + noise;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });

      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);

      let targetMouse = new THREE.Vector2();
      window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX / window.innerWidth;
        targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
      });

      const renderBg = (time) => {
        uniforms.u_time.value = time * 0.001;
        // Smoothly follow mouse
        uniforms.u_mouse.value.lerp(targetMouse, 0.05);
        
        renderer.render(scene, camera);
        requestAnimationFrame(renderBg);
      };
      requestAnimationFrame(renderBg);

      window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
      });
    }

    // Hero Video Distortion Shader
    const heroVideoContainer = document.querySelector('.hero-video-container');
    if (heroVideoContainer && heroVideo) {
      // Prepare video texture
      heroVideo.crossOrigin = "anonymous";
      const videoTexture = new THREE.VideoTexture(heroVideo);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;

      const vScene = new THREE.Scene();
      // Create a camera that exactly matches the container size
      const vCamera = new THREE.OrthographicCamera(
        heroVideoContainer.clientWidth / -2, 
        heroVideoContainer.clientWidth / 2, 
        heroVideoContainer.clientHeight / 2, 
        heroVideoContainer.clientHeight / -2, 
        1, 1000
      );
      vCamera.position.z = 10;

      const vRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      vRenderer.setSize(heroVideoContainer.clientWidth, heroVideoContainer.clientHeight);
      vRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      // Add canvas absolute to container
      vRenderer.domElement.style.position = 'absolute';
      vRenderer.domElement.style.top = '0';
      vRenderer.domElement.style.left = '0';
      vRenderer.domElement.style.width = '100%';
      vRenderer.domElement.style.height = '100%';
      vRenderer.domElement.style.zIndex = '5'; // Below overlay but above original video
      
      heroVideoContainer.appendChild(vRenderer.domElement);
      document.body.classList.add('video-webgl-active');

      const vGeometry = new THREE.PlaneGeometry(heroVideoContainer.clientWidth, heroVideoContainer.clientHeight, 32, 32);
      
      const vUniforms = {
        u_texture: { value: videoTexture },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_time: { value: 0.0 },
        u_pointerEnergy: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(heroVideoContainer.clientWidth, heroVideoContainer.clientHeight) }
      };

      const vMaterial = new THREE.ShaderMaterial({
        uniforms: vUniforms,
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D u_texture;
          uniform vec2 u_mouse;
          uniform float u_time;
          uniform float u_pointerEnergy;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;
            vec2 pointerVector = uv - u_mouse;
            float distanceToPointer = length(pointerVector);
            vec2 pointerDirection = pointerVector / max(distanceToPointer, 0.0001);

            // A glassy ripple travels out from the pointer instead of producing random streaks.
            float focus = exp(-distanceToPointer * 7.0);
            float primaryWave = sin(distanceToPointer * 48.0 - u_time * 4.2);
            float secondaryWave = sin(distanceToPointer * 82.0 - u_time * 6.1 + 1.4);
            float waveStrength = mix(0.35, 1.0, u_pointerEnergy);
            float distortion = (primaryWave * 0.010 + secondaryWave * 0.003) * focus * waveStrength;
            vec2 rippleUv = clamp(uv + pointerDirection * distortion, 0.001, 0.999);

            float rgbSplit = focus * (0.0015 + u_pointerEnergy * 0.0035);
            vec4 colorR = texture2D(u_texture, rippleUv + vec2(rgbSplit, 0.0));
            vec4 colorG = texture2D(u_texture, rippleUv);
            vec4 colorB = texture2D(u_texture, rippleUv - vec2(rgbSplit, 0.0));

            // Thin acid-lime rings make the interaction legible without covering the footage.
            float ringPattern = 1.0 - smoothstep(0.0, 0.16, abs(sin(distanceToPointer * 40.0 - u_time * 4.0)));
            float ringGlow = ringPattern * exp(-distanceToPointer * 6.5) * (0.04 + u_pointerEnergy * 0.16);
            vec3 rippleColor = vec3(colorR.r, colorG.g, colorB.b) + vec3(0.52, 1.0, 0.08) * ringGlow;

            gl_FragColor = vec4(rippleColor, 1.0);
          }
        `
      });

      const vPlane = new THREE.Mesh(vGeometry, vMaterial);
      vScene.add(vPlane);

      let vTargetMouse = new THREE.Vector2(0.5, 0.5);
      let vPointerEnergy = 0.0;
      
      heroVideoContainer.addEventListener('mousemove', (e) => {
        const rect = heroVideoContainer.getBoundingClientRect();
        const nextMouse = new THREE.Vector2(
          (e.clientX - rect.left) / rect.width,
          1.0 - ((e.clientY - rect.top) / rect.height)
        );

        // Faster movement creates a slightly stronger pulse, then fades naturally.
        vPointerEnergy = Math.min(1.0, Math.max(vPointerEnergy, nextMouse.distanceTo(vTargetMouse) * 16.0));
        vTargetMouse.copy(nextMouse);
      });

      heroVideoContainer.addEventListener('mouseleave', () => {
        // Return to center after the last ripple dissipates.
        vTargetMouse.x = 0.5;
        vTargetMouse.y = 0.5;
      });

      const renderVideo = (time) => {
        vUniforms.u_time.value = time * 0.001;
        vUniforms.u_mouse.value.lerp(vTargetMouse, 0.1);
        vPointerEnergy *= 0.94;
        vUniforms.u_pointerEnergy.value += (vPointerEnergy - vUniforms.u_pointerEnergy.value) * 0.12;
        
        vRenderer.render(vScene, vCamera);
        requestAnimationFrame(renderVideo);
      };
      requestAnimationFrame(renderVideo);

      window.addEventListener('resize', () => {
        const w = heroVideoContainer.clientWidth;
        const h = heroVideoContainer.clientHeight;
        
        vRenderer.setSize(w, h);
        vUniforms.u_resolution.value.set(w, h);
        
        vCamera.left = w / -2;
        vCamera.right = w / 2;
        vCamera.top = h / 2;
        vCamera.bottom = h / -2;
        vCamera.updateProjectionMatrix();
        
        // Re-generate geometry on resize to keep proportions
        vPlane.geometry.dispose();
        vPlane.geometry = new THREE.PlaneGeometry(w, h, 32, 32);
      });
    }
  };

  // Give DOM a moment to settle, then initialize WebGL
  setTimeout(initWebGL, 100);
});
