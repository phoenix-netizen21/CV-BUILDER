// js/ui/magic-bento.js
// Vanilla JS implementation of @react-bits/MagicBento-JS-CSS
// Features:
// - textAutoHide: smooth opacity transition for descriptions on hover
// - enableStars: floating glowing particle stars with GSAP physics or CSS fallback
// - enableSpotlight: dynamic 60fps radial spotlight tracking cursor across container & cards
// - enableBorderGlow: dual-layer border illumination using -webkit-mask-composite
// - enableTilt / enableMagnetism: optional 3D perspective transforms
// - clickEffect: expanding radial wave ripple originating from click coordinates
// - auto-observer: automatically initializes newly mounted option menus

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MagicBento = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_CONFIG = {
    cardSelector: '.magic-bento-card, .template-choice-card, .category-choice-card, .add-section-card:not(.disabled), .saved-cv-card',
    glowColor: '132, 0, 255',
    spotlightRadius: 380,
    particleCount: 12,
    enableBorderGlow: true,
    enableSpotlight: true,
    enableStars: true,
    clickEffect: true,
    enableTilt: false,
    enableMagnetism: false,
    textAutoHide: false,
    disableAnimations: false
  };

  // Helper to create a glowing particle element
  function createParticle(x, y, color = DEFAULT_CONFIG.glowColor) {
    const el = document.createElement('div');
    el.className = 'magic-bento-particle';
    el.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgb(${color});
      box-shadow: 0 0 8px rgba(${color}, 0.9), 0 0 14px rgba(${color}, 0.4);
      pointer-events: none;
      z-index: 10;
      left: ${x}px;
      top: ${y}px;
      opacity: 0;
      transform: scale(0);
      transition: opacity 0.3s ease;
    `;
    return el;
  }

  // Attach MagicBento effect to a container or selector
  function attach(containerOrSelector, userOptions = {}) {
    const container = typeof containerOrSelector === 'string'
      ? document.querySelector(containerOrSelector)
      : containerOrSelector;

    if (!container) return;

    const config = Object.assign({}, DEFAULT_CONFIG, userOptions);
    container.classList.add('bento-section');

    const cards = container.querySelectorAll(config.cardSelector);
    cards.forEach(card => setupCard(card, config));

    if (config.enableSpotlight && !container._bentoSpotlightAttached) {
      setupContainerSpotlight(container, config);
      container._bentoSpotlightAttached = true;
    }

    return () => {
      // Cleanup hook
    };
  }

  // Setup an individual card
  function setupCard(card, config) {
    if (card._bentoCardInitialized) return;
    card._bentoCardInitialized = true;

    card.classList.add('magic-bento-card');
    if (config.enableBorderGlow) {
      card.classList.add('magic-bento-card--border-glow');
    }
    if (config.textAutoHide) {
      card.classList.add('magic-bento-auto-hide');
    }
    card.style.setProperty('--glow-color', config.glowColor);
    card.style.setProperty('--glow-radius', `${config.spotlightRadius}px`);

    let isHovered = false;
    let activeParticles = [];
    let particleTimeouts = [];

    // Particle Stars Generator
    const spawnParticles = () => {
      if (!config.enableStars || config.disableAnimations) return;

      const rect = card.getBoundingClientRect();
      const count = config.particleCount;

      for (let i = 0; i < count; i++) {
        const timeout = setTimeout(() => {
          if (!isHovered) return;

          const px = Math.random() * rect.width;
          const py = Math.random() * rect.height;
          const particle = createParticle(px, py, config.glowColor);
          card.appendChild(particle);
          activeParticles.push(particle);

          if (window.gsap) {
            window.gsap.fromTo(particle, 
              { scale: 0, opacity: 0 }, 
              { scale: 1, opacity: 0.95, duration: 0.3, ease: 'back.out(1.7)' }
            );

            window.gsap.to(particle, {
              x: (Math.random() - 0.5) * 50,
              y: (Math.random() - 0.5) * 50,
              duration: 2 + Math.random() * 2,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true
            });

            window.gsap.to(particle, {
              opacity: 0.25,
              duration: 1 + Math.random() * 0.8,
              ease: 'power1.inOut',
              repeat: -1,
              yoyo: true
            });
          } else {
            particle.style.opacity = '0.9';
            particle.style.transform = 'scale(1)';
          }
        }, i * 110);

        particleTimeouts.push(timeout);
      }
    };

    const clearParticles = () => {
      particleTimeouts.forEach(clearTimeout);
      particleTimeouts = [];

      activeParticles.forEach(p => {
        if (window.gsap) {
          window.gsap.to(p, {
            scale: 0,
            opacity: 0,
            duration: 0.25,
            onComplete: () => {
              if (p.parentNode) p.parentNode.removeChild(p);
            }
          });
        } else {
          if (p.parentNode) p.parentNode.removeChild(p);
        }
      });
      activeParticles = [];
    };

    // Direct Mouse Enter
    card.addEventListener('mouseenter', () => {
      isHovered = true;
      card.style.setProperty('--glow-intensity', '1');
      spawnParticles();
    });

    // Direct Mouse Move (guarantees instantaneous tracking under cursor)
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const relativeX = (x / rect.width) * 100;
      const relativeY = (y / rect.height) * 100;

      card.style.setProperty('--glow-x', `${relativeX}%`);
      card.style.setProperty('--glow-y', `${relativeY}%`);
      card.style.setProperty('--glow-intensity', '1');

      if (config.enableTilt && window.gsap && !config.disableAnimations) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        window.gsap.to(card, {
          rotateX,
          rotateY,
          duration: 0.15,
          ease: 'power2.out',
          transformPerspective: 800
        });
      }

      if (config.enableMagnetism && window.gsap && !config.disableAnimations) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const magnetX = (x - centerX) * 0.04;
        const magnetY = (y - centerY) * 0.04;
        window.gsap.to(card, {
          x: magnetX,
          y: magnetY,
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    });

    // Mouse Leave
    card.addEventListener('mouseleave', () => {
      isHovered = false;
      card.style.setProperty('--glow-intensity', '0');
      clearParticles();

      if (config.enableTilt && window.gsap) {
        window.gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
      }
      if (config.enableMagnetism && window.gsap) {
        window.gsap.to(card, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      }
    });

    // Click Ripple Effect
    card.addEventListener('click', (e) => {
      if (!config.clickEffect || config.disableAnimations) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.className = 'magic-bento-ripple';
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${config.glowColor}, 0.5) 0%, rgba(${config.glowColor}, 0.2) 35%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 100;
        transform: scale(0);
        opacity: 1;
      `;

      card.appendChild(ripple);

      if (window.gsap) {
        window.gsap.fromTo(ripple, 
          { scale: 0, opacity: 1 }, 
          { scale: 1, opacity: 0, duration: 0.65, ease: 'power2.out', onComplete: () => ripple.remove() }
        );
      } else {
        ripple.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        requestAnimationFrame(() => {
          ripple.style.transform = 'scale(1)';
          ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 650);
      }
    });
  }

  // Global spotlight tracking across container
  function setupContainerSpotlight(container, config) {
    const radius = config.spotlightRadius;
    const proximity = radius * 0.5;
    const fadeDistance = radius * 0.85;

    const handleMouseMove = (e) => {
      const cards = container.querySelectorAll(config.cardSelector);
      if (!cards.length) return;

      const rect = container.getBoundingClientRect();
      const mouseInside =
        e.clientX >= rect.left - 50 &&
        e.clientX <= rect.right + 50 &&
        e.clientY >= rect.top - 50 &&
        e.clientY <= rect.bottom + 50;

      if (!mouseInside) {
        cards.forEach(c => c.style.setProperty('--glow-intensity', '0'));
        return;
      }

      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;

        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        const relativeX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
        const relativeY = ((e.clientY - cardRect.top) / cardRect.height) * 100;

        card.style.setProperty('--glow-x', `${relativeX}%`);
        card.style.setProperty('--glow-y', `${relativeY}%`);
        card.style.setProperty('--glow-intensity', glowIntensity.toFixed(2));
        card.style.setProperty('--glow-radius', `${radius}px`);
      });
    };

    const handleMouseLeave = () => {
      const cards = container.querySelectorAll(config.cardSelector);
      cards.forEach(c => c.style.setProperty('--glow-intensity', '0'));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);
  }

  // Scan and attach to all primary option menus across the CV Builder
  function initAllOptionMenus() {
    // 1. Template Choice Menu (Design Panel)
    attach('.template-choice-grid', {
      cardSelector: '.template-choice-card',
      glowColor: '132, 0, 255',
      particleCount: 8,
      spotlightRadius: 340,
      clickEffect: true,
      enableBorderGlow: true,
      enableStars: true
    });

    // 2. Category Presets (Create CV Modal)
    attach('#create-preset-grid', {
      cardSelector: '.category-choice-card',
      glowColor: '132, 0, 255',
      particleCount: 10,
      spotlightRadius: 380,
      clickEffect: true,
      enableBorderGlow: true,
      enableStars: true
    });

    // 3. Add Section Menu (Add Section Modal)
    attach('#add-section-grid', {
      cardSelector: '.add-section-card:not(.disabled)',
      glowColor: '132, 0, 255',
      particleCount: 8,
      spotlightRadius: 360,
      clickEffect: true,
      enableBorderGlow: true,
      enableStars: true
    });

    // 4. Saved CVs Drafts Menu (Welcome Screen)
    attach('#saved-cvs-grid', {
      cardSelector: '.saved-cv-card',
      glowColor: '132, 0, 255',
      particleCount: 12,
      spotlightRadius: 420,
      clickEffect: true,
      enableBorderGlow: true,
      enableStars: true
    });
  }

  // Live MutationObserver to automatically bind MagicBento whenever option menus are injected
  let observerStarted = false;
  function startObserver() {
    if (observerStarted || typeof MutationObserver === 'undefined') return;
    observerStarted = true;

    const observer = new MutationObserver(() => {
      initAllOptionMenus();
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // Automatically start observer
  startObserver();

  return {
    attach,
    initAllOptionMenus
  };
});
