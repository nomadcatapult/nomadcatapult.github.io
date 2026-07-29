const REPO_URL = 'https://github.com/nomadcatapult/nomadcanvas-releases';
const RELEASES_URL = 'https://github.com/nomadcatapult/nomadcanvas-releases/releases';

document.addEventListener('DOMContentLoaded', () => {

  // 0. Appearance Preference
  const themeToggle = document.getElementById('theme-toggle');
  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('nomad_theme', theme);

    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.title = isDark ? 'Light theme' : 'Dark theme';
    }
  };

  const savedTheme = localStorage.getItem('nomad_theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(savedTheme || systemTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  const nomadCanvasLinks = {
    'nomadcanvas-repo-link': REPO_URL,
    'nomadcanvas-release-link': RELEASES_URL
  };

  Object.entries(nomadCanvasLinks).forEach(([id, url]) => {
    const link = document.getElementById(id);
    if (!link || !url) return;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.removeAttribute('aria-disabled');
    link.classList.remove('is-disabled');
  });

  // YouTube requires an identifiable embedding origin. Assign the player URL
  // after the page has its final origin so the same embed works on GitHub Pages
  // and in an HTTP local preview.
  const archiveShowreelPlayer = document.getElementById('archive-showreel-player');
  const archiveShowreelId = archiveShowreelPlayer?.dataset.videoId;

  if (archiveShowreelPlayer && archiveShowreelId) {
    const hasHttpOrigin = ['http:', 'https:'].includes(window.location.protocol);
    const archivePlayerOrigin = hasHttpOrigin
      ? window.location.origin
      : 'https://nomadcatapult.github.io';
    const archivePlayerReferrer = hasHttpOrigin
      ? window.location.href
      : 'https://nomadcatapult.github.io/';
    const archivePlayerParams = new URLSearchParams({
      rel: '0',
      playsinline: '1',
      enablejsapi: '1',
      origin: archivePlayerOrigin,
      widget_referrer: archivePlayerReferrer
    });

    archiveShowreelPlayer.src = `https://www.youtube.com/embed/${archiveShowreelId}?${archivePlayerParams}`;
  }

  // 0.5. The first downward gesture introduces the hero copy; scrolling stays locked until it finishes.
  const heroSection = document.getElementById('hero');
  const heroContent = document.getElementById('hero-intro');
  const heroScrollIndicator = document.getElementById('hero-scroll-indicator');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nomadCanvasPromo = document.getElementById('nomadcanvas');
  const archiveSection = document.getElementById('archive');
  const canUseCanvasParallax = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (archiveSection && !reducedMotion) {
    // The year glides within these limits as the archive passes through the viewport.
    const archiveYearLimits = {
      minX: -20,
      maxX: 32,
      minY: 14,
      maxY: -24
    };
    let archiveYearCurrentX = 0;
    let archiveYearCurrentY = 0;
    let archiveYearTargetX = 0;
    let archiveYearTargetY = 0;
    let archiveYearFrame;

    const clampArchiveYearProgress = (value) => Math.min(1, Math.max(0, value));

    const renderArchiveYearParallax = () => {
      archiveYearCurrentX += (archiveYearTargetX - archiveYearCurrentX) * 0.12;
      archiveYearCurrentY += (archiveYearTargetY - archiveYearCurrentY) * 0.12;
      archiveSection.style.setProperty('--archive-year-shift-x', `${archiveYearCurrentX.toFixed(2)}px`);
      archiveSection.style.setProperty('--archive-year-shift-y', `${archiveYearCurrentY.toFixed(2)}px`);

      if (
        Math.abs(archiveYearTargetX - archiveYearCurrentX) > 0.1 ||
        Math.abs(archiveYearTargetY - archiveYearCurrentY) > 0.1
      ) {
        archiveYearFrame = window.requestAnimationFrame(renderArchiveYearParallax);
      } else {
        archiveYearFrame = undefined;
      }
    };

    const updateArchiveYearParallax = () => {
      const archiveBounds = archiveSection.getBoundingClientRect();
      const travelDistance = window.innerHeight + archiveBounds.height;
      const progress = clampArchiveYearProgress((window.innerHeight - archiveBounds.top) / travelDistance);

      archiveYearTargetX = archiveYearLimits.minX + (archiveYearLimits.maxX - archiveYearLimits.minX) * progress;
      archiveYearTargetY = archiveYearLimits.minY + (archiveYearLimits.maxY - archiveYearLimits.minY) * progress;

      if (archiveYearFrame === undefined) {
        archiveYearFrame = window.requestAnimationFrame(renderArchiveYearParallax);
      }
    };

    window.addEventListener('scroll', updateArchiveYearParallax, { passive: true });
    window.addEventListener('resize', updateArchiveYearParallax);
    updateArchiveYearParallax();
  }

  if (nomadCanvasPromo && canUseCanvasParallax && !reducedMotion) {
    let parallaxFrame;
    let parallaxX = 0;
    let parallaxY = 0;

    const renderCanvasParallax = () => {
      nomadCanvasPromo.style.setProperty('--canvas-parallax-x', `${parallaxX}px`);
      nomadCanvasPromo.style.setProperty('--canvas-parallax-y', `${parallaxY}px`);
      parallaxFrame = undefined;
    };

    const updateCanvasParallax = (event) => {
      const promoBounds = nomadCanvasPromo.getBoundingClientRect();
      const horizontal = (event.clientX - promoBounds.left) / promoBounds.width - 0.5;
      const vertical = (event.clientY - promoBounds.top) / promoBounds.height - 0.5;

      parallaxX = horizontal * -36;
      parallaxY = vertical * -24;
      nomadCanvasPromo.classList.add('is-canvas-parallax');

      if (parallaxFrame === undefined) {
        parallaxFrame = window.requestAnimationFrame(renderCanvasParallax);
      }
    };

    const resetCanvasParallax = () => {
      parallaxX = 0;
      parallaxY = 0;
      nomadCanvasPromo.classList.remove('is-canvas-parallax');

      if (parallaxFrame === undefined) {
        parallaxFrame = window.requestAnimationFrame(renderCanvasParallax);
      }
    };

    nomadCanvasPromo.addEventListener('pointermove', updateCanvasParallax);
    nomadCanvasPromo.addEventListener('pointerleave', resetCanvasParallax);
    document.addEventListener('pointermove', (event) => {
      if (!nomadCanvasPromo.contains(event.target)) resetCanvasParallax();
    });
  }

  // On phones the hero copy is shown immediately (to fill the space below the
  // shorter video band) and scrolling is never intercepted — same as the
  // reduced-motion path.
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const isPhoneViewport = viewportWidth > 0 && viewportWidth <= 768;
  const heroIntroStatic = reducedMotion || isPhoneViewport;
  let heroIntroRevealed = heroIntroStatic;
  let heroIntroAnimating = false;
  let heroIntroTransitionTimer;
  let touchStartY = null;

  const setHeroScrollHint = (isRevealed) => {
    if (!heroScrollIndicator) return;
    const currentLang = document.documentElement.getAttribute('lang') || 'en';
    const scrollHint = heroScrollIndicator.querySelector('.scroll-hint');
    heroScrollIndicator.querySelector('a')?.setAttribute(
      'aria-label',
      isRevealed ? 'Scroll down to explore the site' : 'Scroll down to reveal the studio introduction'
    );
    if (scrollHint) {
      scrollHint.textContent = isRevealed
        ? translations[currentLang]?.hero_scroll_continue || 'Scroll to explore'
        : translations[currentLang]?.hero_scroll_hint || 'Scroll to reveal';
    }
  };

  const finishHeroIntroTransition = () => {
    heroIntroAnimating = false;
    window.clearTimeout(heroIntroTransitionTimer);
  };

  const startHeroIntroTransition = () => {
    heroIntroAnimating = true;
    window.clearTimeout(heroIntroTransitionTimer);
    heroIntroTransitionTimer = window.setTimeout(finishHeroIntroTransition, 950);
  };

  const revealHeroIntro = () => {
    if (heroIntroStatic || !heroSection || window.scrollY > 4) return false;
    if (heroIntroAnimating) return true;
    if (heroIntroRevealed) return false;

    heroIntroRevealed = true;
    heroSection.classList.add('hero-intro-revealed');
    setHeroScrollHint(true);
    startHeroIntroTransition();

    return true;
  };

  const hideHeroIntro = () => {
    if (heroIntroStatic || !heroSection || window.scrollY > 4) return false;
    if (heroIntroAnimating) return true;
    if (!heroIntroRevealed) return false;

    heroIntroRevealed = false;
    heroSection.classList.remove('hero-intro-revealed');
    setHeroScrollHint(false);
    startHeroIntroTransition();
    return true;
  };

  if (heroIntroRevealed && heroSection) {
    heroSection.classList.add('hero-intro-revealed');
    // The scroll hint text is set by setLanguage() (which runs after the
    // translations table is defined) based on heroIntroRevealed.
  }

  heroContent?.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform' && heroIntroAnimating) finishHeroIntroTransition();
  });

  heroScrollIndicator?.querySelector('a')?.addEventListener('click', (event) => {
    if (revealHeroIntro()) event.preventDefault();
  });

  window.addEventListener('wheel', (event) => {
    if (event.deltaY > 0 && revealHeroIntro()) event.preventDefault();
    if (event.deltaY < 0 && hideHeroIntro()) event.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'PageDown', ' '].includes(event.key) && revealHeroIntro()) event.preventDefault();
    if (['ArrowUp', 'PageUp'].includes(event.key) && hideHeroIntro()) event.preventDefault();
  });

  window.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0]?.clientY ?? null;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    const touchY = event.touches[0]?.clientY;
    if (touchStartY !== null && touchY !== undefined && touchStartY - touchY > 28 && revealHeroIntro()) {
      event.preventDefault();
    }
    if (touchStartY !== null && touchY !== undefined && touchY - touchStartY > 28 && hideHeroIntro()) {
      event.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    touchStartY = null;
  }, { passive: true });
  
  // 1. Mobile Menu Toggle
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && header) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      header.classList.toggle('nav-open');
    });

    // Close menu when clicking navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside of header
    document.addEventListener('click', (e) => {
      if (header.classList.contains('nav-open') && !header.contains(e.target)) {
        header.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 2. Before / After VFX Comparison Slider
  const sliderRange = document.getElementById('vfx-slider-range');
  const sliderContainer = document.getElementById('vfx-slider-container');

  if (sliderRange && sliderContainer) {
    const updateSlider = () => {
      const val = sliderRange.value;
      sliderContainer.style.setProperty('--split-percent', `${val}%`);
    };

    // Listen to range input changes
    sliderRange.addEventListener('input', updateSlider);
    sliderRange.addEventListener('change', updateSlider);
  }

  // The source contains raw footage and final VFX side by side. Both halves are
  // drawn from one decoded frame, so a timing mismatch is not possible.
  const comparisonVideo = document.getElementById('vfx-comparison-video');
  const comparisonCanvas = document.getElementById('vfx-comparison-canvas');
  const playVfxButton = document.getElementById('vfx-play-button');
  const comparisonPlaceholder = document.getElementById('vfx-video-placeholder');
  let redrawVfxComparison = () => {};
  let resumeVfxComparison = () => {};

  if (comparisonVideo && comparisonCanvas && sliderContainer) {
    let comparisonInView = false;
    let comparisonManuallyPaused = false;
    let comparisonLoadRequested = false;
    let frameRequestPending = false;
    const comparisonContext = comparisonCanvas.getContext('2d', { alpha: false });

    const updatePlaybackButton = (isPlaying) => {
      if (!playVfxButton) return;
      playVfxButton.classList.toggle('is-playing', isPlaying);
      const labelKey = isPlaying ? 'slider_pause' : 'slider_play';
      playVfxButton.setAttribute('data-i18n-aria', labelKey);
      playVfxButton.setAttribute('aria-label', isPlaying ? 'Pause VFX comparison' : 'Play VFX comparison');
    };

    const pauseComparison = () => {
      comparisonVideo.pause();
      updatePlaybackButton(false);
      redrawVfxComparison();
    };

    const comparisonIsVisible = () => (
      comparisonInView || document.getElementById('vfx-comparison-modal')?.open
    );

    const requestComparisonLoad = () => {
      if (comparisonLoadRequested) return;
      comparisonLoadRequested = true;
      const source = comparisonVideo.dataset.videoSrc;
      if (!source) return;
      comparisonVideo.src = source;
      comparisonPlaceholder?.classList.add('is-loading');
      comparisonVideo.load();
    };

    const resizeComparisonCanvas = () => {
      const bounds = comparisonCanvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * pixelRatio));
      const height = Math.max(1, Math.round(bounds.height * pixelRatio));

      if (comparisonCanvas.width !== width || comparisonCanvas.height !== height) {
        comparisonCanvas.width = width;
        comparisonCanvas.height = height;
      }
    };

    redrawVfxComparison = () => {
      if (!comparisonContext) return;
      resizeComparisonCanvas();

      const { width, height } = comparisonCanvas;
      comparisonContext.fillStyle = '#0c0e11';
      comparisonContext.fillRect(0, 0, width, height);

      if (comparisonVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        || !comparisonVideo.videoWidth || !comparisonVideo.videoHeight) return;

      const sourceHalfWidth = comparisonVideo.videoWidth / 2;
      const splitPosition = Math.max(0, Math.min(1, Number(sliderRange?.value || 50) / 100));

      // Final VFX is the base image; original footage is clipped on top.
      comparisonContext.drawImage(
        comparisonVideo,
        sourceHalfWidth, 0, sourceHalfWidth, comparisonVideo.videoHeight,
        0, 0, width, height
      );
      comparisonContext.save();
      comparisonContext.beginPath();
      comparisonContext.rect(0, 0, width * splitPosition, height);
      comparisonContext.clip();
      comparisonContext.drawImage(
        comparisonVideo,
        0, 0, sourceHalfWidth, comparisonVideo.videoHeight,
        0, 0, width, height
      );
      comparisonContext.restore();
    };

    const scheduleComparisonFrame = () => {
      if (frameRequestPending || comparisonVideo.paused || comparisonVideo.ended) return;
      frameRequestPending = true;
      const renderFrame = () => {
        frameRequestPending = false;
        redrawVfxComparison();
        scheduleComparisonFrame();
      };

      if ('requestVideoFrameCallback' in comparisonVideo) {
        comparisonVideo.requestVideoFrameCallback(renderFrame);
      } else {
        window.requestAnimationFrame(renderFrame);
      }
    };

    const playComparison = () => {
      if (comparisonVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        requestComparisonLoad();
        updatePlaybackButton(false);
        return;
      }

      if (comparisonVideo.ended) comparisonVideo.currentTime = 0;
      const playAttempt = comparisonVideo.play();
      if (playAttempt) {
        playAttempt.catch(() => updatePlaybackButton(false));
      }
    };

    resumeVfxComparison = () => {
      if (comparisonIsVisible() && !comparisonManuallyPaused && !document.hidden) {
        playComparison();
      }
    };

    const visibilityObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
        comparisonInView = entries.some(entry => entry.isIntersecting);
        if (comparisonIsVisible() && !comparisonManuallyPaused) {
          resumeVfxComparison();
        } else if (!comparisonIsVisible()) {
          pauseComparison();
        }
      }, { threshold: 0.35 })
      : null;

    if (visibilityObserver) {
      visibilityObserver.observe(sliderContainer);
    } else {
      comparisonInView = true;
      resumeVfxComparison();
    }

    playVfxButton?.addEventListener('click', () => {
      if (comparisonVideo.paused) {
        comparisonManuallyPaused = false;
        playComparison();
      } else {
        comparisonManuallyPaused = true;
        pauseComparison();
      }
    });

    comparisonVideo.addEventListener('loadeddata', redrawVfxComparison);
    comparisonVideo.addEventListener('loadstart', () => {
      comparisonPlaceholder?.classList.add('is-loading');
    });
    comparisonVideo.addEventListener('canplay', () => {
      if (playVfxButton) playVfxButton.disabled = false;
      comparisonPlaceholder?.classList.add('is-ready');
      redrawVfxComparison();
      resumeVfxComparison();
    });
    comparisonVideo.addEventListener('playing', () => {
      updatePlaybackButton(true);
      scheduleComparisonFrame();
    });
    comparisonVideo.addEventListener('pause', () => {
      updatePlaybackButton(false);
      redrawVfxComparison();
    });
    comparisonVideo.addEventListener('ended', () => {
      comparisonVideo.currentTime = 0;
      if (comparisonIsVisible() && !comparisonManuallyPaused) {
        playComparison();
      }
    });
    comparisonVideo.addEventListener('error', () => {
      comparisonPlaceholder?.classList.remove('is-loading');
      comparisonPlaceholder?.classList.add('has-error');
    });
    sliderRange?.addEventListener('input', redrawVfxComparison);
    sliderRange?.addEventListener('change', redrawVfxComparison);
    new ResizeObserver(redrawVfxComparison).observe(sliderContainer);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseComparison();
      } else if (comparisonIsVisible() && !comparisonManuallyPaused) {
        playComparison();
      }
    });
  }

  // A brief first-view hint makes the comparison interaction discoverable.
  const comparisonHint = document.getElementById('vfx-compare-hint');
  const comparisonHintKey = 'nomad_vfx_hint_seen';
  let comparisonHintTimer;

  const dismissComparisonHint = () => {
    if (!comparisonHint) return;
    comparisonHint.classList.remove('is-visible');
    window.clearTimeout(comparisonHintTimer);
    localStorage.setItem(comparisonHintKey, 'true');
  };

  if (comparisonHint && sliderContainer && !localStorage.getItem(comparisonHintKey)) {
    const showComparisonHint = () => {
      comparisonHint.classList.add('is-visible');
      comparisonHintTimer = window.setTimeout(dismissComparisonHint, 3200);
      hintObserver?.disconnect();
    };

    const hintObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) showComparisonHint();
      }, { threshold: 0.45 })
      : null;

    if (hintObserver) {
      hintObserver.observe(sliderContainer);
    } else {
      showComparisonHint();
    }

    sliderRange?.addEventListener('input', dismissComparisonHint, { once: true });
  }

  // Move the existing comparison into a large dialog so it keeps its video
  // state and slider position instead of creating a second video pair.
  const expandVfxButton = document.getElementById('vfx-expand-button');
  const vfxModal = document.getElementById('vfx-comparison-modal');
  const vfxModalFrame = document.getElementById('vfx-modal-frame');
  const closeVfxModalButton = document.getElementById('vfx-modal-close');
  let sliderPlaceholder = null;

  const returnVfxComparison = () => {
    if (!sliderContainer || !sliderPlaceholder?.parentNode) return;
    sliderPlaceholder.parentNode.insertBefore(sliderContainer, sliderPlaceholder);
    sliderPlaceholder.remove();
    sliderPlaceholder = null;
    window.requestAnimationFrame(redrawVfxComparison);
    expandVfxButton?.focus();
  };

  if (sliderContainer && expandVfxButton && vfxModal && vfxModalFrame && closeVfxModalButton) {
    expandVfxButton.addEventListener('click', () => {
      if (vfxModal.open) return;
      sliderPlaceholder = document.createComment('VFX comparison location');
      sliderContainer.parentNode.insertBefore(sliderPlaceholder, sliderContainer);
      vfxModalFrame.appendChild(sliderContainer);
      vfxModal.showModal();
      window.requestAnimationFrame(() => {
        redrawVfxComparison();
        resumeVfxComparison();
      });
      closeVfxModalButton.focus();
    });

    closeVfxModalButton.addEventListener('click', () => vfxModal.close());
    vfxModal.addEventListener('close', returnVfxComparison);
    vfxModal.addEventListener('click', (event) => {
      if (event.target === vfxModal) vfxModal.close();
    });
  }

  // 3. Selected Works Category Filtering
  const filterButtons = document.querySelectorAll('.btn-filter');
  const workGrid = document.getElementById('work-grid');
  const workItems = workGrid?.querySelectorAll('.work-item') || [];
  const allWorkItems = Array.from(workItems);
  const featuredWorkStage = workGrid?.querySelector('.featured-work-stage');
  const featuredWorkStageEnd = featuredWorkStage?.querySelector('.featured-work-placeholder--right');
  const workRail = document.getElementById('work-rail');
  const workRailShell = document.getElementById('work-rail-shell');
  const workRailEnd = workRail?.querySelector('.work-rail-cta--right');
  const workRailPrevious = document.getElementById('work-rail-previous');
  const workRailNext = document.getElementById('work-rail-next');

  const workMatchesFilter = (item, filterValue) => {
    const categories = (item.getAttribute('data-category') || '').split(/\s+/);
    return filterValue === 'all' || categories.includes(filterValue);
  };

  // LADA is the preferred lead whenever it belongs to the active filter. For
  // every other filter, the first matching project in source order takes the
  // lead automatically. A future card may opt into a stronger lead preference
  // by receiving a higher data-feature-priority value.
  const chooseFeaturedWork = matchingItems => matchingItems.reduce((featured, item) => {
    const featurePriority = Number(item.dataset.featurePriority) || 0;
    const featuredPriority = Number(featured?.dataset.featurePriority) || 0;
    return featurePriority > featuredPriority ? item : featured;
  }, matchingItems[0]);

  const applyWorkFilter = (filterValue, animate = false) => {
    const matchingItems = allWorkItems.filter(item => workMatchesFilter(item, filterValue));
    const featuredWork = chooseFeaturedWork(matchingItems);
    const railItems = matchingItems.filter(item => item !== featuredWork);

    // Restore the authored project order before extracting the active lead.
    // This keeps the CTA cells on the true outside edges even after switching
    // through several filters.
    if (workRail && workRailEnd) {
      allWorkItems.forEach(item => workRail.insertBefore(item, workRailEnd));
    }

    if (featuredWork && featuredWorkStage) {
      if (featuredWorkStageEnd) {
        featuredWorkStage.insertBefore(featuredWork, featuredWorkStageEnd);
      } else {
        featuredWorkStage.appendChild(featuredWork);
      }
    }

    allWorkItems.forEach(item => {
      const isVisible = matchingItems.includes(item);
      item.classList.toggle('hidden', !isVisible);
      item.classList.toggle('work-item--featured', item === featuredWork);

      if (animate && isVisible) {
        item.style.opacity = '0';
        void item.offsetWidth;
        item.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        item.style.opacity = '1';
      } else if (!isVisible) {
        item.style.opacity = '';
      }
    });

    if (featuredWorkStage) featuredWorkStage.hidden = !featuredWork;
    if (workRailShell) workRailShell.hidden = railItems.length === 0;
    if (workRail) workRail.scrollTo({ left: 0, behavior: 'auto' });

    window.requestAnimationFrame(updateWorkRailControls);
  };

  const updateWorkRailControls = () => {
    if (!workRail || !workRailPrevious || !workRailNext) return;

    if (workRailShell?.hidden) {
      workRailPrevious.hidden = true;
      workRailNext.hidden = true;
      return;
    }

    const maxScrollLeft = Math.max(0, workRail.scrollWidth - workRail.clientWidth);
    // Ignore the tiny measurement difference caused by scrollbar/padding so
    // controls never appear as two disabled buttons when the rail fits.
    const hasOverflow = maxScrollLeft > 24;
    const atStart = workRail.scrollLeft <= 8;
    const atEnd = workRail.scrollLeft >= maxScrollLeft - 8;

    workRailPrevious.hidden = !hasOverflow;
    workRailNext.hidden = !hasOverflow;
    workRailPrevious.disabled = atStart;
    workRailNext.disabled = atEnd;
  };

  const scrollWorkRail = direction => {
    if (!workRail) return;

    workRail.scrollBy({
      left: direction * Math.max(workRail.clientWidth * 0.78, 260),
      behavior: 'smooth'
    });
  };

  if (workRail && workRailPrevious && workRailNext) {
    workRailPrevious.addEventListener('click', () => scrollWorkRail(-1));
    workRailNext.addEventListener('click', () => scrollWorkRail(1));
    workRail.addEventListener('scroll', updateWorkRailControls, { passive: true });
    workRail.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollWorkRail(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollWorkRail(1);
      }
    });

    window.addEventListener('resize', updateWorkRailControls);
    window.requestAnimationFrame(updateWorkRailControls);
  }

  applyWorkFilter('all');

  if (filterButtons.length > 0 && allWorkItems.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle active button class
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');
        applyWorkFilter(filterValue, true);
      });
    });
  }

  // 4. Mute / Unmute Hero Video Background
  const muteBtn = document.getElementById('video-mute-toggle');
  const video = document.getElementById('hero-video');
  const iconMute = document.getElementById('icon-mute');
  const replayBtn = document.getElementById('video-replay');

  // Keep the loading state perceptible over the poster, including when a
  // cached video becomes ready before the first paint. It is removed only
  // after playback begins (or by the safe timeout if playback cannot start).
  if (video && heroSection) {
    const minimumLoaderVisibleMs = 700;
    const loaderStartedAt = performance.now();
    let videoReadyTimer;
    const markVideoReady = () => {
      const remaining = minimumLoaderVisibleMs - (performance.now() - loaderStartedAt);
      window.clearTimeout(videoReadyTimer);
      videoReadyTimer = window.setTimeout(
        () => heroSection.classList.add('video-ready'),
        Math.max(0, remaining)
      );
    };

    if (video.readyState >= 3 && !video.paused) {
      markVideoReady();
    } else {
      video.addEventListener('playing', markVideoReady, { once: true });
      video.addEventListener('error', markVideoReady, { once: true });
      window.setTimeout(markVideoReady, 8000);
    }
  }

  if (replayBtn && video) {
    replayBtn.addEventListener('click', () => {
      video.currentTime = 0;
      const played = video.play();
      if (played && typeof played.catch === 'function') played.catch(() => {});
    });
  }

  if (muteBtn && video) {
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      
      // Update SVG icon representation
      if (video.muted) {
        iconMute.innerHTML = '<path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM12 4L9.91 6.09 12 8.18V4zm-8.27-.27L2.46 5.00 7.46 10H3v4h3l5 5v-6.27l4.02 4.02c-.52.39-1.11.7-1.76.88v2.06c1.2-.28 2.28-.88 3.16-1.68l2.12 2.12 1.27-1.27L3.73 3.73zM19 12c0 .87-.18 1.69-.49 2.44l1.5 1.5c.62-1.18.99-2.5.99-3.94 0-4.38-3.12-8.04-7.27-8.81v2.09c2.99.73 5.27 3.4 5.27 6.72z"/>';
        muteBtn.setAttribute('aria-label', 'Unmute video background');
      } else {
        iconMute.innerHTML = '<path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
        muteBtn.setAttribute('aria-label', 'Mute video background');
      }
    });
  }

  // 5. Translation Dictionary & Language Switcher Logic
  const translations = {
    en: {
      nav_home: "Home",
      nav_services: "Services",
      nav_work: "Selected Work",
      nav_vfx: "VFX Showcase",
      nav_collab: "How We Work",
      nav_archive: "Archive",
      nav_canvas: "NomadCanvas",
      nav_contact: "Contact",
      hero_subtitle: "Remote visual and interactive production studio for campaigns, websites, apps, games, live shows, and media — combining hands-on craft with AI-assisted workflows.",
      hero_scroll_hint: "Scroll to reveal",
      hero_scroll_continue: "Scroll to explore",
      video_loading: "Loading video…",
      video_badge: "Video",
      video_play: "Play video",
      video_pause: "Pause video",
      video_retry: "Try again",
      video_comparison: "VFX video comparison",
      canvas_tag: "Made for makers",
      canvas_title: "NomadCanvas",
      canvas_lead: "A focused drawing space for designers, authors, and creators — from the first loose sketch to a shareable visual idea.",
      canvas_text: "Shape concepts with responsive brushes, flexible layers, quick colour control, and a calm interface that keeps the canvas at the centre.",
      canvas_feature_1: "Sketch, paint, annotate and explore",
      canvas_feature_2: "Brushes, layers and fast exports",
      canvas_feature_3: "Built for desktop creative flow",
      canvas_download_label: "Downloads are on the way",
      canvas_download_macos: "macOS · soon",
      canvas_download_windows: "Windows · soon",
      canvas_download_linux: "Linux · soon",
      canvas_promo_subtitle: "Visual workspace for motion, media and ideas.",
      canvas_promo_description: "A local app with an infinite canvas for references, media, storyboards, notes, and timelines. Projects are saved in the portable .nmc format.",
      canvas_promo_repo: "View on GitHub",
      canvas_promo_release: "Download release",
      archive_tag: "// Archive Stratum · 2021",
      archive_title: "Before “generate” became a button.",
      archive_description: "A personal CGI showreel from 2021. No prompts — just taste, tools, and a slightly unreasonable number of polygons.",
      archive_meta_format: "Pre-AI Showreel",
      archive_meta_aria: "Showreel information",
      archive_link: "Watch on YouTube ↗",
      motto: "Direct execution.<br>Flexible studio scale.",
      lead_text: "We help agencies, brands, and creative teams turn raw ideas into finished visuals, interactive experiences, tools, games, websites, and show content.",
      body_text: "Nomad Catapult operates as a remote-first creative production partner for any screen, stage, or playable surface. For focused tasks, you work directly with a senior artist for speed and efficiency. For larger productions, we assemble specialists across visual design, development, animation, sound, and AI-assisted workflows.",
      services_tag: "What We Launch",
      services_title: "Visual Capabilities",
      service_motion_title: "Motion Design",
      service_motion_desc: "Dynamic animated graphics, bold 3D typography, explainers, commercial titles, and high-impact social cutdowns.",
      service_cgi_title: "3D / CGI",
      service_cgi_desc: "High-end product visual renders, atmospheric look development, stylized abstract scenes, and animated commercial visual loops.",
      service_cleanup_title: "Compositing & Cleanup",
      service_cleanup_desc: "Production-grade wire removals, object removal, screen replacements, camera tracking, and seamless visual integration.",
      service_ai_title: "AI-Assisted Visuals",
      service_ai_desc: "Rapid visual ideation, generated styleframes, concept art exploration, and hybrid workflows accelerating pitch proposals.",
      service_campaign_title: "Live & Campaign Assets",
      service_campaign_desc: "Social packages, stage and music show visuals, DOOH loops, presentation backgrounds, and sound-aware screen content.",
      service_interactive_title: "Interactive Media",
      service_interactive_desc: "Websites, creative apps, games, prototypes, canvas tools, and interactive platforms where visual ideas become usable systems.",
      work_tag: "Selected Missions",
      work_title: "Visual Showcase",
      filter_all: "All",
      filter_cgi: "CGI",
      filter_motion: "Motion",
      filter_animation: "Animation",
      filter_cleanup: "Cleanup",
      filter_ai: "AI Concept",
      filter_interactive: "Interactive",
      work_rail_cta_left: "Your project could be next.",
      work_rail_cta_right: "Let’s make it happen.",
      work_rail_aria: "Selected projects",
      work_rail_previous: "Show previous projects",
      work_rail_next: "Show next projects",
      cat_cgi: "3D / CGI",
      cat_3d_compositing: "3D / CGI / Compositing",
      cat_motion: "Motion Design",
      cat_ai: "AI Concept Art",
      cat_animation: "Animation & Storyboards",
      cat_all: "Complete production pipeline",
      cat_cleanup: "Compositing & Cleanup",
      cat_interactive: "Interactive Media",
      cat_social: "2D Animation / Social Ad",
      cat_3d_motion_ai: "3D / Motion / AI Film",
      badge_client: "Client Work",
      badge_personal: "Studio Project",
      badge_ai: "AI-Assisted Exploration",
      btn_details: "Details",
      btn_slider: "Interactive Slider",
      work1_title: "Film Company Logo Intro",
      work1_summary: "A glowing particle comet collides with a planet, igniting its surface before the planet transforms into the company logo.",
      work2_title: "Dragon Mountain — Animated Series",
      work2_summary: "A 22-minute family adventure animation produced through a complete end-to-end pipeline. The pilot episode is currently in production.",
      work3_title: "Somat — TV Commercial",
      work3_summary: "Full-CG product commercial for Somat, combining dishwasher interior shots, product animation, and compositing for broadcast.",
      work5_title: "Yerevan — Diseased Trees PSA",
      work5_summary: "A hand-drawn public-service animation for the Yerevan Municipality, warning residents about the danger of diseased, pest-infested city trees and urging timely treatment.",
      work6_title: "LADA 2026 Dealer Conference",
      work6_summary: "Three minutes of stage content for the LADA brand and new model reveal — neon wireframe vehicles, light-trail environments, and AI-generated sequences, delivered on a compressed conference schedule.",
      work7_title: "LadyBag — TV Commercial",
      work7_summary: "A CGI toy commercial aired between cartoons on a kids' TV channel — full-CG flying toys composited into live-action bedrooms, with particle FX and green-screen screen replacement for broadcast.",
      banner_accent: "// HOW WE LAUNCH",
      banner_quote: "A small core team brings the right specialists together — then carries the idea from a rough brief to final delivery.",
      slider_tag: "Full-Cycle VFX",
      slider_title: "From Shoot to Final Frame",
      slider_subtitle: "A full-cycle VFX example — from original footage through camera tracking, compositing, 3D integration, cleanup, screen replacement, and targeted eye retouching.",
      slider_before: "Original Footage",
      slider_after: "Final VFX Shot",
      slider_hint: "Drag the divider to compare",
      slider_expand: "Open VFX comparison in full screen",
      slider_close: "Close full-screen VFX comparison",
      slider_play: "Play VFX comparison",
      slider_pause: "Pause VFX comparison",
      collab_tag: "Collaboration Formats",
      collab_title: "Flexible Team Scale",
      collab_tabs_aria: "Choose a collaboration format",
      collab1_name: "Freelance Support",
      collab1_title: "01. Freelance Support",
      collab1_desc: "Direct backup for agencies, studios, and production houses that need senior-level support for CGI, motion design, or cleanup tasks. Fits into existing project pipelines.",
      collab1_team: "One senior specialist",
      collab1_process: "Inside your existing pipeline",
      collab1_result: "Focused production support",
      collab2_name: "Project Production",
      collab2_title: "02. Project Production",
      collab2_desc: "End-to-end production assets for brands and startup teams. We handle the process from brief, styleframes, draft animations, rendering, up to the final deliverables.",
      collab2_team: "Core team + selected specialists",
      collab2_process: "From brief to final delivery",
      collab2_result: "Complete production package",
      collab3_name: "White-Label",
      collab3_title: "03. White-Label Partner",
      collab3_desc: "Unbranded production partner. We handle backend visual execution, CGI setups, and animations silently while your client-facing account team manages feedback.",
      collab3_team: "Dedicated backend crew",
      collab3_process: "Behind your client-facing team",
      collab3_result: "Unbranded, ready-to-deliver assets",
      collab_team_label: "Team",
      collab_process_label: "Process",
      collab_result_label: "Result",
      contact_tag: "Let's Connect",
      contact_title: "Have a launch or production gap?",
      contact_lead: "We turn pitch decks, rough concepts, visual guidelines, and interactive ideas into finished production assets. Reach out to coordinate your next visual or media project.",
      direct_email: "Direct Email:",
      telegram_channel: "Telegram Channel:",
      form_name: "Name",
      form_email: "Email Address",
      form_project: "Project Details",
      btn_send: "Send Message",
      footer_text: "&copy; 2026 Nomad Catapult. All rights reserved. Remote Visual & Interactive Production Studio.",
      placeholder_name: "Your name",
      placeholder_email: "hello@company.com",
      placeholder_project: "Briefly describe your visuals, website, app, game, live show, sound, or production scale requirements...",
      form_launching: "Launching Message...",
      form_success: "Message sent successfully! We'll get back to you within 24 hours.",
      modal_role: "Role / Services",
      modal_client: "Client / Type",
      modal_tools: "Tools & Tech",
      modal_overview: "Overview",
      modal_video_aria: "{title}: video {index}",
      modal_image_aria: "{title}: image {index}",
      btn_view_slider: "View Interactive Slider"
    },
    ru: {
      nav_home: "Главная",
      nav_services: "Услуги",
      nav_work: "Работы",
      nav_vfx: "VFX витрина",
      nav_collab: "Как мы работаем",
      nav_archive: "Архив",
      nav_canvas: "NomadCanvas",
      nav_contact: "Контакты",
      hero_subtitle: "Удалённая студия визуального и интерактивного продакшена для кампаний, сайтов, приложений, игр, live-шоу и медиа — соединяем ручную работу и ИИ-инструменты.",
      hero_scroll_hint: "Прокрутите, чтобы открыть",
      hero_scroll_continue: "Прокрутите, чтобы смотреть дальше",
      video_loading: "Загрузка видео…",
      video_badge: "Видео",
      video_play: "Смотреть видео",
      video_pause: "Поставить видео на паузу",
      video_retry: "Повторить",
      video_comparison: "VFX-сравнение в видео",
      canvas_tag: "Для тех, кто создаёт",
      canvas_title: "NomadCanvas",
      canvas_lead: "Пространство для рисования для дизайнеров, авторов и креаторов — от первого наброска до визуальной идеи, которой хочется поделиться.",
      canvas_text: "Развивайте концепты с отзывчивыми кистями, гибкими слоями, быстрым выбором цвета и спокойным интерфейсом, в котором главное место остаётся холсту.",
      canvas_feature_1: "Скетчи, рисование, заметки и поиск идей",
      canvas_feature_2: "Кисти, слои и быстрый экспорт",
      canvas_feature_3: "Создано для творческого desktop-потока",
      canvas_download_label: "Загрузки уже готовятся",
      canvas_download_macos: "macOS · скоро",
      canvas_download_windows: "Windows · скоро",
      canvas_download_linux: "Linux · скоро",
      canvas_promo_subtitle: "Визуальное рабочее пространство для моушна, медиа и идей.",
      canvas_promo_description: "Локальное приложение с бесконечным холстом для референсов, медиа, раскадровок, заметок и таймлайнов. Проекты сохраняются в переносимом формате .nmc.",
      canvas_promo_repo: "Смотреть на GitHub",
      canvas_promo_release: "Скачать релиз",
      archive_tag: "// Архивный слой · 2021",
      archive_title: "До того, как «сгенерировать» стало кнопкой.",
      archive_description: "Личный CGI-шоурил 2021 года. Никаких промптов — только вкус, инструменты и слегка чрезмерное количество полигонов.",
      archive_meta_format: "Шоурил до AI-эры",
      archive_meta_aria: "Информация о шоуриле",
      archive_link: "Смотреть на YouTube ↗",
      motto: "Прямая работа.<br>Гибкий масштаб студии.",
      lead_text: "Мы помогаем агентствам, брендам и творческим командам превращать сырые идеи в готовые визуалы, интерактивные форматы, инструменты, игры, сайты и шоу-контент.",
      body_text: "Nomad Catapult работает как удаленный творческий production-партнер для любых экранов, сцен и playable-поверхностей. Для точечных задач вы работаете напрямую со старшим художником. Для крупных проектов мы собираем специалистов по визуальному дизайну, разработке, анимации, звуку и AI-assisted workflow.",
      services_tag: "Наши возможности",
      services_title: "Визуальные направления",
      service_motion_title: "Моушн-дизайн",
      service_motion_desc: "Динамическая анимационная графика, смелая 3D-типографика, эксплейнеры, коммерческие титры и эффектные видеоролики для соцсетей.",
      service_cgi_title: "3D / CGI",
      service_cgi_desc: "Высококлассные рендеры продуктов, атмосферный лук-девелопмент, стилизованные абстрактные сцены и анимированные рекламные циклы.",
      service_cleanup_title: "Композитинг и клинап",
      service_cleanup_desc: "Профессиональное удаление тросов и лишних объектов, замена экранов, трекинг камер и бесшовный композитинг графики.",
      service_ai_title: "ИИ-графика",
      service_ai_desc: "Быстрая визуализация идей, генерация стайлфреймов, исследование концепт-артов и гибридные пайплайны для ускорения подготовки питчей.",
      service_campaign_title: "Live и кампании",
      service_campaign_desc: "Пакеты для соцсетей, визуалы для сцен и музыкальных шоу, DOOH-лупы, презентационные фоны и экранный контент, связанный со звуком.",
      service_interactive_title: "Интерактивные медиа",
      service_interactive_desc: "Сайты, креативные приложения, игры, прототипы, canvas-инструменты и интерактивные платформы, где визуальные идеи становятся рабочими системами.",
      work_tag: "Избранные кейсы",
      work_title: "Портфолио работ",
      filter_all: "Все",
      filter_cgi: "CGI",
      filter_motion: "Моушн",
      filter_animation: "Анимация",
      filter_cleanup: "Клинап",
      filter_ai: "ИИ-концепт",
      filter_interactive: "Интерактив",
      work_rail_cta_left: "Здесь может быть ваш проект.",
      work_rail_cta_right: "Давайте сделаем его вместе.",
      work_rail_aria: "Избранные проекты",
      work_rail_previous: "Показать предыдущие проекты",
      work_rail_next: "Показать следующие проекты",
      cat_cgi: "3D / CGI",
      cat_3d_compositing: "3D / CGI / Композитинг",
      cat_motion: "Моушн-дизайн",
      cat_animation: "Анимация и раскадровки",
      cat_all: "Полный цикл производства",
      cat_ai: "ИИ-концепт-арт",
      cat_cleanup: "Композитинг и клинап",
      cat_interactive: "Интерактивные медиа",
      cat_social: "2D-анимация / Соцреклама",
      cat_3d_motion_ai: "3D / Моушн / AI-фильм",
      badge_client: "Коммерческий проект",
      badge_personal: "Студийный проект",
      badge_ai: "ИИ-исследование",
      btn_details: "Подробнее",
      btn_slider: "Интерактивный слайдер",
      work1_title: "Интро кинокомпании",
      work1_summary: "Комета из светящихся частиц врезается в планету: поверхность вспыхивает, и планета плавно превращается в логотип компании.",
      work2_title: "Анимационный сериал Dragon Mountain",
      work2_summary: "22-минутный семейный приключенческий мультфильм полного цикла производства. Пилотный эпизод находится в производстве.",
      work3_title: "Somat — ТВ-реклама",
      work3_summary: "Полностью 3D-реклама Somat: сцены внутри посудомоечной машины, продукт и композитинг для телеэфира.",
      work5_title: "Ереван — соцролик о больных деревьях",
      work5_summary: "Рисованный социальный ролик для мэрии Еревана: он предупреждает жителей об опасности больных, заражённых вредителями городских деревьев и призывает вовремя их лечить.",
      work6_title: "Дилерская конференция LADA 2026",
      work6_summary: "Три минуты сценического контента для презентации бренда и новой модельной линейки LADA — неоновые wireframe-автомобили, световые трассы и AI-генерация, собранные в сжатые сроки подготовки конференции.",
      work7_title: "LadyBag — ТВ-реклама",
      work7_summary: "Рекламный ролик с CGI-игрушками, который выходит между мультфильмами на детском телеканале: полностью 3D-игрушки, вписанные в живую съёмку детских комнат, с эффектами частиц и заменой экранов, снятых на хромакее, — для эфирной выдачи.",
      banner_accent: "// КАК МЫ ЗАПУСКАЕМ ИДЕИ",
      banner_quote: "Небольшая основная команда собирает нужных специалистов и доводит идею от сырого брифа до готового запуска.",
      slider_tag: "Полный VFX-пайплайн",
      slider_title: "От съёмки до финального кадра",
      slider_subtitle: "Пример полного VFX-цикла: от исходного материала — к трекингу камеры, композитингу, интеграции 3D-графики, клинапу, замене экранов и точечной ретуши глаз.",
      slider_before: "Исходный материал",
      slider_after: "Финальный VFX-кадр",
      slider_hint: "Потяните разделитель, чтобы сравнить",
      slider_expand: "Открыть VFX-сравнение в полный экран",
      slider_close: "Закрыть полноэкранное VFX-сравнение",
      slider_play: "Включить VFX-сравнение",
      slider_pause: "Поставить VFX-сравнение на паузу",
      collab_tag: "Форматы сотрудничества",
      collab_title: "Гибкий масштаб команды",
      collab_tabs_aria: "Выберите формат сотрудничества",
      collab1_name: "Фриланс-поддержка",
      collab1_title: "01. Поддержка на фрилансе",
      collab1_desc: "Прямая поддержка для агентств, студий и продакшенов, которым нужна помощь уровня senior в задачах CGI, моушн-дизайна или клинапа. Легко встраивается в текущие пайплайны.",
      collab1_team: "Один senior-специалист",
      collab1_process: "Внутри вашего текущего пайплайна",
      collab1_result: "Точечная поддержка продакшена",
      collab2_name: "Продакшен проекта",
      collab2_title: "02. Производство под ключ",
      collab2_desc: "Создание визуальных активов от начала до конца для брендов и стартап-команд. Мы ведем весь процесс: бриф, стайлфреймы, анимация, рендеринг и финальная сдача.",
      collab2_team: "Основная команда + профильные специалисты",
      collab2_process: "От брифа до финальной сдачи",
      collab2_result: "Полный комплект материалов",
      collab3_name: "Продакшен без брендинга",
      collab3_title: "03. Продакшен без брендинга",
      collab3_desc: "Мы остаемся за кадром и берем на себя визуальный продакшен, CGI и анимацию, пока ваша команда ведет коммуникацию с клиентом.",
      collab3_team: "Команда за кадром",
      collab3_process: "Работаем под именем вашей команды",
      collab3_result: "Готовые материалы без нашего брендинга",
      collab_team_label: "Команда",
      collab_process_label: "Процесс",
      collab_result_label: "Результат",
      contact_tag: "Связаться с нами",
      contact_title: "Предстоит запуск или нужна помощь в продакшене?",
      contact_lead: "Мы превращаем питч-деки, черновые концепты, визуальные гайдлайны и интерактивные идеи в готовые production-активы. Свяжитесь с нами, чтобы обсудить следующий визуальный или медиа-проект.",
      direct_email: "Прямой Email:",
      telegram_channel: "Канал в Telegram:",
      form_name: "Имя",
      form_email: "Электронная почта",
      form_project: "Детали проекта",
      btn_send: "Отправить сообщение",
      footer_text: "&copy; 2026 Nomad Catapult. Все права защищены. Удаленная студия визуального и интерактивного продакшена.",
      placeholder_name: "Ваше имя",
      placeholder_email: "hello@company.com",
      placeholder_project: "Кратко опишите визуал, сайт, приложение, игру, live-шоу, звук или требования к масштабу команды...",
      form_launching: "Отправка сообщения...",
      form_success: "Сообщение успешно отправлено! Мы свяжемся с вами в течение 24 часов.",
      modal_role: "Роль / Услуги",
      modal_client: "Клиент / Тип",
      modal_tools: "Инструменты и технологии",
      modal_overview: "Описание проекта",
      modal_video_aria: "{title}: видео {index}",
      modal_image_aria: "{title}: изображение {index}",
      btn_view_slider: "Открыть интерактивный слайдер"
    },
    zh: {
      nav_home: "首页",
      nav_services: "服务领域",
      nav_work: "精选作品",
      nav_vfx: "特效展示",
      nav_collab: "合作模式",
      nav_archive: "档案",
      nav_canvas: "NomadCanvas",
      nav_contact: "联系我们",
      hero_subtitle: "为广告活动、网站、应用、游戏、现场演出和媒体提供视觉与互动制作的远程工作室，融合手工创作与 AI 辅助工作流。",
      hero_scroll_hint: "向下滚动以展开",
      hero_scroll_continue: "向下探索",
      video_loading: "视频加载中…",
      video_badge: "视频",
      video_play: "播放视频",
      video_pause: "暂停视频",
      video_retry: "重试",
      video_comparison: "VFX 视频对比",
      canvas_tag: "为创作者而作",
      canvas_title: "NomadCanvas",
      canvas_lead: "为设计师、作者和创作者打造的专注绘画空间——从最初的草图到可分享的视觉想法。",
      canvas_text: "借助灵敏画笔、灵活图层、快速配色与安静界面发展概念，让画布始终处于中心。",
      canvas_feature_1: "草图、绘画、标注与探索",
      canvas_feature_2: "画笔、图层与快速导出",
      canvas_feature_3: "为桌面端创作流程打造",
      canvas_download_label: "下载版本即将推出",
      canvas_download_macos: "macOS · 即将推出",
      canvas_download_windows: "Windows · 即将推出",
      canvas_download_linux: "Linux · 即将推出",
      canvas_promo_subtitle: "面向动效、媒体与灵感的视觉工作空间。",
      canvas_promo_description: "一款本地应用，提供无限画布来整理参考、媒体、分镜、笔记和时间线。项目以可移植的 .nmc 格式保存。",
      canvas_promo_repo: "在 GitHub 查看",
      canvas_promo_release: "下载发行版",
      archive_tag: "// 档案层 · 2021",
      archive_title: "在“生成”变成按钮之前。",
      archive_description: "2021 年的个人 CGI 作品集短片。没有提示词，只有审美、工具和略显过量的多边形。",
      archive_meta_format: "AI 前的作品集短片",
      archive_meta_aria: "作品集短片信息",
      archive_link: "在 YouTube 观看 ↗",
      motto: "直接执行。<br>灵活的工作室规模。",
      lead_text: "我们帮助代理商、品牌和创意团队将初步想法转化为完成的视觉内容、互动体验、工具、游戏、网站和演出内容。",
      body_text: "Nomad Catapult 是面向各种屏幕、舞台和可交互界面的远程创意制作伙伴。对于聚焦任务，您直接与资深艺术家协作以获得速度和效率。对于更大的制作，我们会组建设计、开发、动画、声音和 AI 辅助流程方面的专家团队。",
      services_tag: "我们发布",
      services_title: "视觉能力",
      service_motion_title: "动态设计",
      service_motion_desc: "动态动画图形、大胆的 3D 排版、解说视频、商业片头以及高影响力的社交剪辑。",
      service_cgi_title: "3D / CGI",
      service_cgi_desc: "高端产品视觉渲染、大气的外观开发、风格化的抽象场景以及动画商业视觉循环。",
      service_cleanup_title: "合成与擦除",
      service_cleanup_desc: "制作级的钢丝擦除、物体移除、屏幕替换、摄像机跟踪与无缝视觉融合。",
      service_ai_title: "AI 视觉开发",
      service_ai_desc: "快速的视觉构思、生成的风格化帧、概念艺术探索，以及加速竞标提案的混合工作流。",
      service_campaign_title: "现场与活动资产",
      service_campaign_desc: "社交媒体套件、舞台和音乐演出视觉、DOOH 循环、演示背景，以及与声音联动的屏幕内容。",
      service_interactive_title: "互动媒体",
      service_interactive_desc: "网站、创意应用、游戏、原型、canvas 工具，以及把视觉想法变成可用系统的互动平台。",
      work_tag: "精选项目",
      work_title: "视觉展示",
      filter_all: "全部",
      filter_cgi: "CGI",
      filter_motion: "动态设计",
      filter_animation: "动画",
      filter_cleanup: "合成擦除",
      filter_ai: "AI概念",
      filter_interactive: "互动",
      work_rail_cta_left: "这里可以是你的项目。",
      work_rail_cta_right: "让我们一起实现它。",
      work_rail_aria: "精选项目",
      work_rail_previous: "显示上一组项目",
      work_rail_next: "显示下一组项目",
      cat_cgi: "3D / CGI",
      cat_3d_compositing: "3D / CGI / 合成",
      cat_motion: "动态设计",
      cat_animation: "动画与分镜设计",
      cat_all: "完整制作流程",
      cat_ai: "AI 概念艺术",
      cat_cleanup: "合成与擦除",
      cat_interactive: "互动媒体",
      cat_social: "2D 动画 / 公益广告",
      cat_3d_motion_ai: "3D / 动态影像 / AI",
      badge_client: "客户项目",
      badge_personal: "工作室项目",
      badge_ai: "AI辅助探索",
      btn_details: "详情",
      btn_slider: "双图滑动对比",
      work1_title: "电影公司标志片头",
      work1_summary: "一颗由发光粒子组成的彗星撞击行星，点燃其表面，随后行星化为公司标志。",
      work2_title: "《龙之山》— 动画系列",
      work2_summary: "一部面向全家观众的22分钟冒险动画，涵盖从创意开发到后期制作的完整流程。目前试播集正在制作中。",
      work3_title: "Somat — 电视广告",
      work3_summary: "为 Somat 制作的全 CG 产品广告，结合洗碗机内部场景、产品动画与合成，用于电视播出。",
      work5_title: "埃里温 — 病树公益广告",
      work5_summary: "为埃里温市政府制作的手绘公益动画，提醒居民警惕病树及虫害树木的危险，呼吁及时治疗。",
      work6_title: "LADA 2026 经销商大会",
      work6_summary: "为 LADA 品牌与全新车型发布制作的三分钟舞台内容——霓虹线框车身、光轨场景与 AI 生成镜头，在紧张的会议筹备周期内交付。",
      work7_title: "LadyBag — 电视广告",
      work7_summary: "面向儿童电视频道、在动画片之间播出的 CGI 玩具广告：全 CG 飞行玩具合成到实拍儿童房间中，配以粒子特效和绿幕屏幕替换，用于电视播出。",
      banner_accent: "// 我们如何发射创意",
      banner_quote: "精干的核心团队汇集合适的专家，把想法从初步简报推进到最终交付。",
      slider_tag: "全流程 VFX",
      slider_title: "从拍摄到最终画面",
      slider_subtitle: "完整 VFX 流程示例：从原始素材到摄像机跟踪、合成、3D 图形整合、清理、屏幕替换和局部眼部修饰。",
      slider_before: "原始素材",
      slider_after: "最终 VFX 镜头",
      slider_hint: "拖动分隔线进行对比",
      slider_expand: "全屏打开 VFX 对比",
      slider_close: "关闭全屏 VFX 对比",
      slider_play: "播放 VFX 对比",
      slider_pause: "暂停 VFX 对比",
      collab_tag: "合作模式",
      collab_title: "灵活团队规模",
      collab_tabs_aria: "选择合作模式",
      collab1_name: "自由职业支持",
      collab1_title: "01. 自由职业支持",
      collab1_desc: "为需要 CGI、动态设计或擦除任务方面资深级支持的代理商、工作室和制作公司提供直接后盾。适应现有的项目流程。",
      collab1_team: "一位资深专项专家",
      collab1_process: "接入您现有的制作流程",
      collab1_result: "精准的制作支持",
      collab2_name: "项目制作",
      collab2_title: "02. 项目制制作",
      collab2_desc: "为品牌和初创团队提供端到端的制作资产。我们处理从简报、风格帧、草稿动画、渲染，一直到最终交付的过程。",
      collab2_team: "核心团队＋按需专家",
      collab2_process: "从需求简报到最终交付",
      collab2_result: "完整的制作成果包",
      collab3_name: "白标合作",
      collab3_title: "03. 白标合作伙伴",
      collab3_desc: "无品牌制作合作伙伴。我们默默地处理后端的视觉执行、CGI 设置和动画，而您面向客户的团队负责管理反馈。",
      collab3_team: "专属后端制作团队",
      collab3_process: "配合您的客户沟通团队",
      collab3_result: "无品牌、可直接交付的素材",
      collab_team_label: "团队",
      collab_process_label: "流程",
      collab_result_label: "成果",
      contact_tag: "联系我们",
      contact_title: "有发布计划或制作缺口？",
      contact_lead: "我们将路演PPT、粗略概念、视觉指南和互动想法转化为完成的制作资产。联系我们以协调您的下一个视觉或媒体项目。",
      direct_email: "直接邮箱:",
      telegram_channel: "电报频道:",
      form_name: "姓名",
      form_email: "电子邮件",
      form_project: "项目详情",
      btn_send: "发送消息",
      footer_text: "&copy; 2026 Nomad Catapult。版权所有。远程视觉与互动制作工作室。",
      placeholder_name: "姓名",
      placeholder_email: "hello@company.com",
      placeholder_project: "简单描述您的视觉、网站、应用、游戏、现场演出、声音或团队规模需求...",
      form_launching: "正在发送消息...",
      form_success: "消息发送成功！我们将在 24 小时内回复您。",
      modal_role: "角色 / 服务",
      modal_client: "客户 / 类型",
      modal_tools: "工具与技术",
      modal_overview: "项目概述",
      modal_video_aria: "{title}：视频 {index}",
      modal_image_aria: "{title}：图片 {index}",
      btn_view_slider: "查看双图对比"
    },
    ja: {
      nav_home: "ホーム",
      nav_services: "サービス",
      nav_work: "実績紹介",
      nav_vfx: "VFX紹介",
      nav_collab: "業務フロー",
      nav_archive: "アーカイブ",
      nav_canvas: "NomadCanvas",
      nav_contact: "お問い合わせ",
      hero_subtitle: "キャンペーン、Webサイト、アプリ、ゲーム、ライブショー、メディアのためのリモート型ビジュアル＆インタラクティブ制作スタジオ。人の手による制作とAI支援ワークフローを組み合わせます。",
      hero_scroll_hint: "スクロールして表示",
      hero_scroll_continue: "スクロールして探索",
      video_loading: "動画を読み込み中…",
      video_badge: "動画",
      video_play: "動画を再生",
      video_pause: "動画を一時停止",
      video_retry: "もう一度試す",
      video_comparison: "VFX動画比較",
      canvas_tag: "つくる人のために",
      canvas_title: "NomadCanvas",
      canvas_lead: "デザイナー、作家、クリエイターのための集中できる描画スペース。最初のラフスケッチから共有したくなるビジュアルアイデアまで支えます。",
      canvas_text: "反応のよいブラシ、柔軟なレイヤー、すばやい色選び、キャンバスに集中できる静かなインターフェースでコンセプトを育てます。",
      canvas_feature_1: "スケッチ、ペイント、注釈、アイデア探索",
      canvas_feature_2: "ブラシ、レイヤー、すばやい書き出し",
      canvas_feature_3: "デスクトップの創作フローのために設計",
      canvas_download_label: "ダウンロード版を準備中",
      canvas_download_macos: "macOS · 準備中",
      canvas_download_windows: "Windows · 準備中",
      canvas_download_linux: "Linux · 準備中",
      canvas_promo_subtitle: "モーション、メディア、アイデアのためのビジュアルワークスペース。",
      canvas_promo_description: "リファレンス、メディア、絵コンテ、メモ、タイムラインを整理できる無限キャンバスのローカルアプリです。プロジェクトは持ち運べる .nmc 形式で保存されます。",
      canvas_promo_repo: "GitHub で見る",
      canvas_promo_release: "リリースをダウンロード",
      archive_tag: "// アーカイブ層 · 2021",
      archive_title: "「生成」がボタンになる前。",
      archive_description: "2021年の個人CGIショーリール。プロンプトはなし。あるのは感覚と道具、そして少し多すぎるポリゴン。",
      archive_meta_format: "AI以前のショーリール",
      archive_meta_aria: "ショーリール情報",
      archive_link: "YouTubeで見る ↗",
      motto: "ダイレクトな実行力。<br>柔軟なスタジオ規模。",
      lead_text: "エージェンシー、ブランド、クリエイティブチームのラフなアイデアを、完成したビジュアル、インタラクティブ体験、ツール、ゲーム、Webサイト、ショーコンテンツへと形にします。",
      body_text: "Nomad Catapultは、あらゆるスクリーン、ステージ、プレイ可能な面に対応するリモートのクリエイティブ制作パートナーです。集中した作業ではシニアアーティストと直接連携し、より大きな制作ではビジュアルデザイン、開発、アニメーション、サウンド、AI支援ワークフローの専門家を編成します。",
      services_tag: "制作領域",
      services_title: "ビジュアルケイパビリティ",
      service_motion_title: "モーションデザイン",
      service_motion_desc: "ダイナミックなアニメーショングラフィックス、大胆な3Dタイポグラフィ、エクスプレイナー、商業用タイトル、インパクトのあるSNS用短尺動画。",
      service_cgi_title: "3D / CGI",
      service_cgi_desc: "ハイエンドな製品ビジュアルレンダリング、アトモスフェリックなルックデベロップメント、スタイライズドされた抽象的シーン、商業用ループアニメーション。",
      service_cleanup_title: "コンポジット＆クリンアップ",
      service_cleanup_desc: "プロダクションクオリティのワイヤー除去、オブジェクト除去、スクリーン差し替え、カメラトラッキング、シームレスな実写合成。",
      service_ai_title: "AIビジュアル支援",
      service_ai_desc: "迅速なビジュアルの具現化、生成されたスタイルフレーム、コンセプトアートの探索、およびピッチ提案を加速するハイブリッドワークフロー。",
      service_campaign_title: "ライブ＆キャンペーン",
      service_campaign_desc: "SNSパッケージ、ステージや音楽ショーのビジュアル、DOOHループ、プレゼン背景、サウンドと連動するスクリーンコンテンツ。",
      service_interactive_title: "インタラクティブメディア",
      service_interactive_desc: "Webサイト、クリエイティブアプリ、ゲーム、プロトタイプ、canvasツール、ビジュアルアイデアを使えるシステムにするインタラクティブプラットフォーム。",
      work_tag: "精選アセット",
      work_title: "ショーケース",
      filter_all: "すべて",
      filter_cgi: "CGI",
      filter_motion: "モーション",
      filter_animation: "アニメーション",
      filter_cleanup: "クリンアップ",
      filter_ai: "AIコンセプト",
      filter_interactive: "インタラクティブ",
      work_rail_cta_left: "ここに、あなたのプロジェクトを。",
      work_rail_cta_right: "一緒に形にしましょう。",
      work_rail_aria: "主なプロジェクト",
      work_rail_previous: "前のプロジェクトを表示",
      work_rail_next: "次のプロジェクトを表示",
      cat_cgi: "3D / CGI",
      cat_3d_compositing: "3D / CGI / コンポジット",
      cat_motion: "モーションデザイン",
      cat_animation: "アニメーション＆絵コンテ",
      cat_all: "フルサイクル制作",
      cat_ai: "AIコンセプトアート",
      cat_cleanup: "コンポジット＆クリンアップ",
      cat_interactive: "インタラクティブメディア",
      cat_social: "2Dアニメーション / 社会広告",
      cat_3d_motion_ai: "3D / モーション / AI映像",
      badge_client: "クライアントワーク",
      badge_personal: "自主制作プロジェクト",
      badge_ai: "AI支援・研究",
      btn_details: "詳細",
      btn_slider: "比較スライダー",
      work1_title: "映画会社のロゴイントロ",
      work1_summary: "発光する粒子でできた彗星が惑星に衝突して表面を燃え上がらせ、やがて惑星が会社のロゴへと変化します。",
      work2_title: "ドラゴン・マウンテン — アニメーションシリーズ",
      work2_summary: "22分構成のファミリー向け冒険アニメーション。企画からポストプロダクションまで一貫して制作し、現在パイロット版を制作中です。",
      work3_title: "Somat — テレビCM",
      work3_summary: "食器洗い機内部のシーン、製品アニメーション、コンポジットを組み合わせた、SomatのフルCGテレビCM。",
      work5_title: "エレバン — 病んだ樹木の啓発動画",
      work5_summary: "エレバン市役所のために制作した手描きの啓発アニメーション。病気や害虫に侵された街路樹の危険性を住民に伝え、早めの治療を呼びかけます。",
      work6_title: "LADA 2026 ディーラーカンファレンス",
      work6_summary: "LADAのブランドと新型ラインナップ発表のための3分間のステージ映像。ネオンのワイヤーフレーム車両、ライトトレイル空間、AI生成カットを、限られた準備期間の中で仕上げました。",
      work7_title: "LadyBag — テレビCM",
      work7_summary: "子ども向けテレビ局でアニメの合間に放送される CGI おもちゃの CM。フル CG の飛行おもちゃを実写の子ども部屋に合成し、パーティクル演出とグリーンバックのスクリーン置き換えを加えて放送用に仕上げました。",
      banner_accent: "// アイデアの打ち上げ方",
      banner_quote: "小さなコアチームが必要な専門家を集め、ラフなブリーフから最終納品までアイデアを伴走します。",
      slider_tag: "フルサイクル VFX",
      slider_title: "撮影から最終フレームまで",
      slider_subtitle: "オリジナル映像からカメラトラッキング、コンポジット、3Dグラフィック統合、クリンアップ、画面差し替え、目元の細かなレタッチまでを含むVFX制作例です。",
      slider_before: "オリジナル映像",
      slider_after: "最終 VFX ショット",
      slider_hint: "仕切りをドラッグして比較",
      slider_expand: "VFX比較を全画面で開く",
      slider_close: "全画面 VFX 比較を閉じる",
      slider_play: "VFX比較を再生",
      slider_pause: "VFX比較を一時停止",
      collab_tag: "コラボレーション形式",
      collab_title: "柔軟なチーム編成",
      collab_tabs_aria: "コラボレーション形式を選択",
      collab1_name: "フリーランスサポート",
      collab1_title: "01. フリーランスサポート",
      collab1_desc: "CGI、モーションデザイン、またはクリンアップ作業でシニアレベルのサポートを必要とするエージェンシー、スタジオ、プロダクション向けの直接的なバックアップ。既存のパイプラインに適合します。",
      collab1_team: "シニアスペシャリスト1名",
      collab1_process: "既存の制作パイプラインに参加",
      collab1_result: "必要な工程を的確にサポート",
      collab2_name: "プロジェクト制作",
      collab2_title: "02. プロジェクト制作",
      collab2_desc: "ブランドやスタートアップチーム向けのエンドツーエンドの制作。ブリーフ、スタイルフレーム、ドラフトアニメーション、レンダリングから最終納品まで対応します。",
      collab2_team: "コアチーム＋必要な専門スタッフ",
      collab2_process: "ブリーフから最終納品まで",
      collab2_result: "完成した制作パッケージ",
      collab3_name: "ホワイトレーベル",
      collab3_title: "03. ホワイトレーベルパートナー",
      collab3_desc: "ブランド名を出さない制作パートナー。クライアント対応のアカウントチームがフィードバックを管理する間、バックエンドのビジュアル実行、CGIセットアップ、アニメーションをサイレントに処理します。",
      collab3_team: "専任バックエンド制作チーム",
      collab3_process: "クライアント対応チームの後方で進行",
      collab3_result: "ブランド表記なしの納品可能素材",
      collab_team_label: "チーム",
      collab_process_label: "プロセス",
      collab_result_label: "成果",
      contact_tag: "お問い合わせ",
      contact_title: "制作のご相談はこちら",
      contact_lead: "ピッチブック、ラフコンセプト、ビジュアルガイドライン、インタラクティブなアイデアを完成した制作アセットに変えます。次のビジュアルまたはメディアプロジェクトについてご相談ください。",
      direct_email: "直通メール:",
      telegram_channel: "テレグラムチャンネル:",
      form_name: "名前",
      form_email: "メールアドレス",
      form_project: "プロジェクト詳細",
      btn_send: "送信",
      footer_text: "&copy; 2026 Nomad Catapult. All rights reserved. リモートビジュアル＆インタラクティブ制作スタジオ。",
      placeholder_name: "お名前",
      placeholder_email: "hello@company.com",
      placeholder_project: "ビジュアル、Webサイト、アプリ、ゲーム、ライブショー、サウンド、チーム規模の要件を簡単にご記入ください...",
      form_launching: "送信中...",
      form_success: "送信されました！24時間以内にご連絡します。",
      modal_role: "役割・サービス",
      modal_client: "クライアント・タイプ",
      modal_tools: "使用ツール・技術",
      modal_overview: "プロジェクト概要",
      modal_video_aria: "{title}：動画 {index}",
      modal_image_aria: "{title}：画像 {index}",
      btn_view_slider: "比較スライダーを見る"
    }
  };

  // Active details modal project tracker
  let activeProjectId = null;
  let refreshCollabAnimatedText = () => {};

  // Switch Language Function
  const setLanguage = (lang) => {
    if (!translations[lang]) return;
    
    // Set html attribute
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('nomad_lang', lang);
    
    // Update active state in both selectors
    document.querySelectorAll('.btn-lang').forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Text Elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        // Handle line breaks in motto or other tags
        if (key === 'motto') {
          el.innerHTML = translations[lang][key];
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (translations[lang][key]) {
        el.setAttribute('aria-label', translations[lang][key]);
      }
    });

    if (heroIntroRevealed) {
      const scrollHint = heroScrollIndicator?.querySelector('.scroll-hint');
      if (scrollHint) scrollHint.textContent = translations[lang].hero_scroll_continue;
    }

    // Update Form Inputs Placeholders
    const inputName = document.getElementById('form-name');
    const inputEmail = document.getElementById('form-email');
    const inputProject = document.getElementById('form-project');

    if (inputName) inputName.placeholder = translations[lang].placeholder_name;
    if (inputEmail) inputEmail.placeholder = translations[lang].placeholder_email;
    if (inputProject) inputProject.placeholder = translations[lang].placeholder_project;

    // Refresh details modal content if it is open
    if (activeProjectId) {
      populateModal(activeProjectId, lang);
    }

    refreshCollabAnimatedText();
  };

  // Language buttons click events
  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering header click close handlers
      const selectedLang = btn.getAttribute('data-lang');
      setLanguage(selectedLang);
    });
  });

  // Initialize Language (Check localStorage -> Check Browser Navigator -> Fallback to English)
  const savedLanguage = localStorage.getItem('nomad_lang');
  const browserLanguage = navigator.language.slice(0, 2);
  const initialLanguage = savedLanguage || (translations[browserLanguage] ? browserLanguage : 'en');
  setLanguage(initialLanguage);

  // Collaboration format switcher
  const collabExplorer = document.querySelector('[data-collab-explorer]');
  if (collabExplorer) {
    const collabSection = collabExplorer.closest('.collab-section');
    const collabTabsShell = collabExplorer.querySelector('.collab-tabs-shell');
    const collabTabList = collabExplorer.querySelector('[role="tablist"]');
    const collabStage = collabExplorer.querySelector('.collab-stage');
    const collabTabs = [...collabExplorer.querySelectorAll('[role="tab"]')];
    const collabPanels = [...collabExplorer.querySelectorAll('[role="tabpanel"]')];
    const collabBackdrops = [...(collabSection?.querySelectorAll('[data-collab-backdrop]') || [])];
    let activeCollabIndex = Math.max(0, collabTabs.findIndex(tab => tab.classList.contains('is-active')));
    let collabLeavingTimer = null;
    let collabShellTimer = null;
    let collabTextGlassTimer = null;

    const positionCollabIndicator = (index = activeCollabIndex) => {
      const activeTab = collabTabs[index];
      if (!collabTabList || !activeTab) return;

      collabTabList.style.setProperty('--collab-indicator-x', `${activeTab.offsetLeft}px`);
      collabTabList.style.setProperty('--collab-indicator-width', `${activeTab.offsetWidth}px`);
    };

    const warmCollabPanel = (index) => {
      const image = collabBackdrops[index];
      if (image && !image.complete && typeof image.decode === 'function') {
        image.decode().catch(() => {});
      }
    };

    const preloadCollabBackdrops = () => {
      collabBackdrops.forEach(image => {
        image.loading = 'eager';
        if (!image.complete && typeof image.decode === 'function') {
          image.decode().catch(() => {});
        }
      });
    };

    if ('IntersectionObserver' in window && collabSection) {
      const collabPreloadObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        preloadCollabBackdrops();
        collabPreloadObserver.disconnect();
      }, { rootMargin: '600px 0px' });
      collabPreloadObserver.observe(collabSection);
    } else {
      preloadCollabBackdrops();
    }

    const splitCollabTextIntoCharacters = (element) => {
      const existingAccessibleText = element.querySelector('.collab-accessible-text')?.textContent;
      const text = (existingAccessibleText || element.textContent).replace(/\s+/g, ' ').trim();
      if (!text) return;

      element.removeAttribute('aria-label');
      const accessibleText = document.createElement('span');
      accessibleText.className = 'collab-accessible-text';
      accessibleText.textContent = text;

      const animatedText = document.createElement('span');
      animatedText.className = 'collab-animated-text';
      animatedText.setAttribute('aria-hidden', 'true');
      const fragment = document.createDocumentFragment();
      const characters = [];
      const hasWhitespace = /\s/.test(text);
      const tokens = hasWhitespace ? text.split(/(\s+)/) : Array.from(text);
      const delayStep = element.classList.contains('collab-desc')
        ? 6
        : element.classList.contains('collab-type')
          ? 28
          : 14;

      tokens.forEach(token => {
        if (!token) return;

        if (/^\s+$/.test(token)) {
          const space = document.createElement('span');
          space.className = 'collab-space';
          space.setAttribute('aria-hidden', 'true');
          space.textContent = token;
          fragment.append(space);
          return;
        }

        const word = document.createElement('span');
        word.className = 'collab-word';
        word.setAttribute('aria-hidden', 'true');

        Array.from(token).forEach(character => {
          const characterSpan = document.createElement('span');
          characterSpan.className = 'collab-char';
          characterSpan.textContent = character;
          characterSpan.style.setProperty(
            '--collab-char-delay',
            `${Math.min(characters.length * delayStep, 720)}ms`
          );
          characters.push(characterSpan);
          word.append(characterSpan);
        });

        fragment.append(word);
      });

      const characterCount = characters.length;
      characters.forEach((characterSpan, characterIndex) => {
        characterSpan.style.setProperty(
          '--collab-char-exit-delay',
          `${Math.min((characterCount - characterIndex - 1) * 2, 160)}ms`
        );
      });

      animatedText.append(fragment);
      element.replaceChildren(accessibleText, animatedText);
    };

    refreshCollabAnimatedText = () => {
      collabPanels.forEach(panel => {
        panel.querySelectorAll('.collab-type, .collab-desc, .collab-facts dd')
          .forEach(splitCollabTextIntoCharacters);
      });
      window.requestAnimationFrame(() => positionCollabIndicator(activeCollabIndex));
    };

    refreshCollabAnimatedText();

    const activateCollabPanel = (index, moveFocus = false) => {
      if (index < 0 || index >= collabTabs.length) return;

      if (index === activeCollabIndex) {
        positionCollabIndicator(index);
        if (moveFocus) collabTabs[index].focus();
        return;
      }

      const previousIndex = activeCollabIndex;
      const direction = index > previousIndex ? 'forward' : 'backward';
      if (collabSection) collabSection.dataset.collabDirection = direction;
      collabExplorer.classList.add('has-switched');

      window.clearTimeout(collabLeavingTimer);
      window.clearTimeout(collabShellTimer);
      window.clearTimeout(collabTextGlassTimer);
      collabPanels.forEach(panel => panel.classList.remove('is-leaving'));
      collabBackdrops.forEach(backdrop => backdrop.classList.remove('is-leaving'));

      if (collabTabsShell) {
        collabTabsShell.classList.remove('is-moving');
        void collabTabsShell.offsetWidth;
        collabTabsShell.classList.add('is-moving');
        collabShellTimer = window.setTimeout(() => {
          collabTabsShell.classList.remove('is-moving');
        }, 700);
      }

      if (collabStage) {
        collabStage.classList.remove('is-text-changing');
        void collabStage.offsetWidth;
        collabStage.classList.add('is-text-changing');
        collabTextGlassTimer = window.setTimeout(() => {
          collabStage.classList.remove('is-text-changing');
        }, 1140);
      }

      collabPanels[previousIndex]?.classList.add('is-leaving');
      collabBackdrops[previousIndex]?.classList.add('is-leaving');

      collabTabs.forEach((tab, tabIndex) => {
        const isActive = tabIndex === index;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });

      collabPanels.forEach((panel, panelIndex) => {
        const isActive = panelIndex === index;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', String(!isActive));
        panel.tabIndex = isActive ? 0 : -1;
        panel.inert = !isActive;
      });

      collabBackdrops.forEach((backdrop, backdropIndex) => {
        backdrop.classList.toggle('is-active', backdropIndex === index);
      });

      activeCollabIndex = index;
      warmCollabPanel(index);
      positionCollabIndicator(index);

      collabLeavingTimer = window.setTimeout(() => {
        collabPanels[previousIndex]?.classList.remove('is-leaving');
        collabBackdrops[previousIndex]?.classList.remove('is-leaving');
      }, 1500);

      if (moveFocus) {
        collabTabs[index].focus();
      }
    };

    collabTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateCollabPanel(index));
      tab.addEventListener('pointerenter', () => warmCollabPanel(index), { passive: true });
      tab.addEventListener('focus', () => warmCollabPanel(index));

      tab.addEventListener('keydown', (event) => {
        let nextIndex = index;

        if (event.key === 'ArrowRight') nextIndex = (index + 1) % collabTabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + collabTabs.length) % collabTabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = collabTabs.length - 1;
        if (nextIndex === index && !['Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        activateCollabPanel(nextIndex, true);
      });
    });

    collabPanels.forEach((panel, panelIndex) => {
      panel.inert = panelIndex !== activeCollabIndex;
    });
    positionCollabIndicator(activeCollabIndex);
    warmCollabPanel(activeCollabIndex);

    if ('ResizeObserver' in window && collabTabList) {
      const collabIndicatorObserver = new ResizeObserver(() => {
        positionCollabIndicator(activeCollabIndex);
      });
      collabIndicatorObserver.observe(collabTabList);
      collabTabs.forEach(tab => collabIndicatorObserver.observe(tab));
    }

    document.fonts?.ready.then(() => positionCollabIndicator(activeCollabIndex));
  }

  // 6. Scroll Link Highlighting & Header Visibility
  const sections = document.querySelectorAll('section[id]');
  
  const handleScrollEffects = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Show/hide fixed header based on scroll position
    if (scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }



    const scrollYWithOffset = scrollY + 150; // offset for nav header height
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop;
      const sectionId = current.getAttribute('id');
      const navLink = document.getElementById(`nav-link-${sectionId === 'before-after' ? 'slider' : sectionId}`);

      if (navLink) {
        if (scrollYWithOffset > sectionTop && scrollYWithOffset <= sectionTop + sectionHeight) {
          navLinks.forEach(link => link.classList.remove('active'));
          navLink.classList.add('active');
        }
      }
    });
  };

  window.addEventListener('scroll', handleScrollEffects);
  // Run on startup to initialize headers and snapping states
  handleScrollEffects();

  // 7. Contact Form Submission Handling
  const contactForm = document.getElementById('portfolio-contact-form');
  const statusMsg = document.getElementById('form-status-msg');

  if (contactForm && statusMsg) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const currentLang = document.documentElement.getAttribute('lang') || 'en';
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      
      submitBtn.disabled = true;
      submitBtn.textContent = translations[currentLang].form_launching;
      statusMsg.textContent = '';
      statusMsg.className = 'form-status-msg';

      // Simulate network request
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = translations[currentLang].btn_send;
        
        statusMsg.textContent = translations[currentLang].form_success;
        statusMsg.className = 'form-status-msg success';
        
        // Reset form
        contactForm.reset();
      }, 1200);
    });
  }

  // 8. Project Details Modal Logic & Data
  const projectDetailsData = {
    'work-lada': {
      category: { en: "Motion / CGI / AI", ru: "Моушн / CGI / AI", zh: "动态 / CGI / AI", ja: "モーション / CGI / AI" },
      title: {
        en: "LADA 2026 Dealer Conference",
        ru: "Дилерская конференция LADA 2026",
        zh: "LADA 2026 经销商大会",
        ja: "LADA 2026 ディーラーカンファレンス"
      },
      role: {
        en: "Art Direction & Lead Animator",
        ru: "Арт-директор и ведущий аниматор",
        zh: "艺术指导兼动画总监",
        ja: "アートディレクター兼リードアニメーター"
      },
      client: {
        en: "LADA — Dealer Conference 2026 (Client Work)",
        ru: "LADA — Дилерская конференция 2026 (Коммерческий проект)",
        zh: "LADA — 2026 经销商大会 (客户项目)",
        ja: "LADA — ディーラーカンファレンス2026 (クライアントワーク)"
      },
      tools: "Blender, After Effects, DaVinci Resolve, AI Generation",
      fit: "contain",
      // Every frame of this project is 2.4:1, so the stage takes that shape
      // instead of padding a 16:9 box with bars.
      stageAspect: "12 / 5",
      videos: [
        { url: "assets/video/lada2026/lada_2026_01.mp4", thumb: "assets/images/work_lada_v01.jpg" },
        { url: "assets/video/lada2026/lada_2026_02.mp4", thumb: "assets/images/work_lada_v02.jpg" },
        { url: "assets/video/lada2026/lada_2026_03.mp4", thumb: "assets/images/work_lada_v03.jpg" },
        { url: "assets/video/lada2026/lada_2026_04.mp4", thumb: "assets/images/work_lada_v04.jpg" }
      ],
      images: [
        "assets/images/work_lada_01.jpg",
        "assets/images/work_lada_02.jpg",
        "assets/images/work_lada_03.jpg",
        "assets/images/work_lada_04.jpg"
      ],
      desc: {
        en: "Three minutes of stage content opening the LADA dealer conference and introducing the brand platform together with the new model line-up. The visual system is built around neon wireframe vehicles, light-trail road environments, a nationwide dealer-network map, and abstract energy sequences, mixing classic CG animation with AI-generated shots. A three-person team — an art director/lead animator, a second motion designer, and an editor — delivered it on a compressed conference schedule.",
        ru: "Три минуты сценического контента, открывающего дилерскую конференцию LADA и представляющего платформу бренда вместе с новой модельной линейкой. Визуальная система построена на неоновых wireframe-автомобилях, световых трассах, карте дилерской сети и абстрактных энергетических секвенциях — классическая CG-анимация в связке с AI-генерацией. Команда из трёх человек — арт-директор и ведущий аниматор, второй моушн-дизайнер и монтажёр — выполнила проект в сжатые сроки подготовки конференции.",
        zh: "为 LADA 经销商大会制作的三分钟开场舞台内容，用于发布品牌平台与全新车型阵容。视觉体系由霓虹线框车身、光轨道路场景、全国经销商网络地图以及抽象能量段落构成，将传统 CG 动画与 AI 生成镜头结合。三人团队——艺术指导兼动画总监、第二位动态设计师和一位剪辑师——在紧张的会议筹备周期内完成交付。",
        ja: "LADAディーラーカンファレンスのオープニングを飾る3分間のステージ映像。ブランドプラットフォームと新型ラインナップを紹介する内容です。ネオンのワイヤーフレーム車両、ライトトレイルの走行空間、全国ディーラー網のマップ、抽象的なエネルギー表現でビジュアルを構成し、従来のCGアニメーションとAI生成カットを組み合わせました。アートディレクター兼リードアニメーター、モーションデザイナー、エディターの3名体制で、限られたカンファレンス準備期間の中で仕上げています。"
      }
    },
    'work-comet': {
      category: { en: "CGI", ru: "CGI", zh: "CGI", ja: "CGI" },
      title: {
        en: "Film Company Logo Intro",
        ru: "Интро кинокомпании",
        zh: "电影公司标志片头",
        ja: "映画会社のロゴイントロ"
      },
      role: {
        en: "Full CGI Intro & Logo Animation",
        ru: "Полностью CGI интро и анимация логотипа",
        zh: "全 CGI 片头与 Logo 动画",
        ja: "フル CGI イントロ＆ロゴアニメーション"
      },
      client: {
        en: "Film Distribution Company (Client Work)",
        ru: "Кинопрокатная компания (Коммерческий проект)",
        zh: "电影发行公司（客户项目）",
        ja: "映画配給会社（クライアント案件）"
      },
      tools: "Blender",
      videoUrl: "assets/video/comet25_01.mp4",
      images: [
        "assets/images/comet25_img01.jpg",
        "assets/images/comet25_img02.jpg",
        "assets/images/comet25_img03.jpg",
        "assets/images/comet25_img04.jpg",
        "assets/images/comet25_img05.jpg",
        "assets/images/comet25_img06.jpg",
        "assets/images/comet25_img07.jpg"
      ],
      desc: {
        en: "Cinematic 3D intro created for a film distribution company. A comet made of glowing particles collides with a planet, igniting its surface and gradually filling it with energy. As the camera pulls back, the illuminated planet seamlessly transforms into the company logo.",
        ru: "Кинематографичное 3D-интро для кинопрокатной компании. Комета из светящихся частиц врезается в планету: поверхность вспыхивает и постепенно наполняется энергией. Камера отъезжает — и сияющая планета плавно превращается в логотип компании.",
        zh: "为电影发行公司制作的电影质感 3D 片头。一颗由发光粒子组成的彗星撞击行星，点燃其表面，能量随之蔓延并逐渐充满整颗星球。随着镜头缓缓拉远，发光的行星自然地化为公司标志。",
        ja: "映画配給会社のために制作したシネマティックな3Dイントロ。発光する粒子でできた彗星が惑星に衝突し、その表面を燃え上がらせながら、やがて全体をエネルギーで満たしていきます。カメラが引いていくにつれ、輝く惑星がそのままなめらかに会社のロゴへと変化します。"
      }
    },
    'work-gd': {
      category: { en: "Animation & Storyboards", ru: "Анимация и раскадровки", zh: "动画与分镜设计", ja: "アニメーション＆絵コンテ" },
      title: {
        en: "Dragon Mountain — Animated Series",
        ru: "Анимационный сериал Dragon Mountain",
        zh: "《龙之山》— 动画系列",
        ja: "ドラゴン・マウンテン — アニメーションシリーズ"
      },
      role: {
        en: "Full-Cycle Animation Production",
        ru: "Полный цикл производства анимации",
        zh: "动画全流程制作",
        ja: "アニメーション制作全般"
      },
      client: {
        en: "Studio Project",
        ru: "Студийный проект",
        zh: "工作室项目",
        ja: "自主制作プロジェクト"
      },
      tools: "Procreate, Moho, After Effects, Blender",
      mediaLayout: "vertical-grid",
      videoAspect: "9 / 16",
      videos: [
        { url: "assets/video/work_dm_01.mp4", poster: "assets/images/work_dm_01_th.jpg" },
        { url: "assets/video/work_dm_02.mp4", poster: "assets/images/work_dm_02_th.jpg" },
        { url: "assets/video/work_dm_03.mp4", poster: "assets/images/work_dm_03_th.jpg" }
      ],
      images: [
        "assets/images/work_dm.jpg",
        "assets/images/work_dm_chars.jpg"
      ],
     desc: {
        en: "Dragon Mountain is a 22-minute animated adventure series for the whole family. The story follows four teenagers who are transported to a mysterious parallel world filled with strange creatures, ancient mysteries, humour and unexpected challenges. The project covers the complete production pipeline, from concept development, writing and visual design to animation, compositing and post-production. The pilot episode is currently in production.",
        ru: "«Dragon Mountain» — 22-минутный приключенческий анимационный сериал для всей семьи. История рассказывает о четырёх подростках, которые попадают в загадочный параллельный мир, наполненный необычными существами, древними тайнами, юмором и неожиданными испытаниями. Проект охватывает полный цикл производства — от разработки концепции, сценария и визуального стиля до анимации, композитинга и постпродакшена. Пилотный эпизод находится в производстве.",  
        zh: "《龙之山》是一部面向全家观众的22分钟冒险动画系列。故事讲述四名少年意外进入一个神秘的平行世界，那里充满了奇异生物、古老谜团、幽默情节和意想不到的挑战。项目涵盖完整的动画制作流程，包括概念开发、剧本创作、视觉设计、动画制作、合成与后期制作。目前，试播集正在制作中。",
        ja: "『ドラゴン・マウンテン』は、家族で楽しめる22分構成の冒険アニメーションシリーズです。物語は、4人の少年少女が不思議な生き物、古代の謎、ユーモア、そして予想外の試練に満ちた並行世界へ迷い込むところから始まります。企画開発、脚本、ビジュアルデザイン、アニメーション、コンポジット、ポストプロダクションまで、制作工程全体を手がけています。現在、パイロットエピソードを制作中です。"
      }
    },
    'work-somat': {
      category: { en: "3D / CGI / Compositing", ru: "3D / CGI / Композитинг", zh: "3D / CGI / 合成", ja: "3D / CGI / コンポジット" },
      title: {
        en: "Somat — TV Commercial",
        ru: "Somat — ТВ-реклама",
        zh: "Somat — 电视广告",
        ja: "Somat — テレビCM"
      },
      role: {
        en: "Full CG Production & Compositing",
        ru: "Полный 3D-продакшен и композитинг",
        zh: "全 CG 制作与合成",
        ja: "フルCG制作＆コンポジット"
      },
      client: {
        en: "Somat (Client Work)",
        ru: "Somat (Коммерческий проект)",
        zh: "Somat（客户项目）",
        ja: "Somat（クライアントワーク）"
      },
      tools: "3D / CGI / Compositing",
      videos: [
        { url: "assets/video/somat/somat_01.mp4", thumb: "assets/images/work_somat_01.jpg" },
        { url: "assets/video/somat/somat_02.mp4", thumb: "assets/images/work_somat_02.jpg" },
        { url: "assets/video/somat/somat_03.mp4", thumb: "assets/images/work_somat_03.jpg" },
        { url: "assets/video/somat/somat_04.mp4", thumb: "assets/images/work_somat.jpg" }
      ],
      desc: {
        en: "A television commercial for Somat dishwasher detergent. Full-CG shots of the dishwasher interior and product were created and composited for the final broadcast delivery.",
        ru: "Телевизионный рекламный ролик для средств Somat для посудомоечных машин. Полностью 3D-сцены с интерьером посудомоечной машины и продуктом собраны в финальный рекламный ролик с помощью композитинга.",
        zh: "为 Somat 洗碗机洗涤剂制作的电视广告。洗碗机内部和产品的画面均以全 CG 完成，并通过合成制作成最终电视广告。",
        ja: "Somatの食器洗い機用洗剤のテレビCM。食器洗い機内部と製品のショットをフルCGで制作し、コンポジットを経て最終放送用映像に仕上げました。"
      }
    },
    'work-erevan': {
      category: {
        en: "2D Animation / Social Ad",
        ru: "2D-анимация / Соцреклама",
        zh: "2D 动画 / 公益广告",
        ja: "2Dアニメーション / 社会広告"
      },
      title: {
        en: "Yerevan — Diseased Trees PSA",
        ru: "Ереван — соцролик о больных деревьях",
        zh: "埃里温 — 病树公益广告",
        ja: "エレバン — 病んだ樹木の啓発動画"
      },
      role: {
        en: "Illustration & 2D Animation",
        ru: "Иллюстрация и 2D-анимация",
        zh: "插画与 2D 动画",
        ja: "イラスト＆2Dアニメーション"
      },
      client: {
        en: "Yerevan Municipality (Client Work)",
        ru: "Мэрия Еревана (Коммерческий проект)",
        zh: "埃里温市政府（客户项目）",
        ja: "エレバン市役所（クライアントワーク）"
      },
      tools: "Illustration / 2D Animation / Motion Graphics",
      videos: [
        { url: "assets/video/erevan/erevan_01.mp4", thumb: "assets/images/work_erevan_v01.jpg" },
        { url: "assets/video/erevan/erevan_02.mp4", thumb: "assets/images/work_erevan_v02.jpg" }
      ],
      images: [
        "assets/images/work_erevan_01.jpg",
        "assets/images/work_erevan_02.jpg"
      ],
      desc: {
        en: "A public-service animation for the Yerevan Municipality raising awareness about the danger of diseased, pest-infested city trees. The film pairs a warm, hand-drawn illustrative style with a clear explainer structure, showing how untreated trees weakened by pests such as nematodes threaten the health of the urban environment and the people living around them, and calling on residents to have their trees examined and treated in time. The project covered illustration, character design, and full 2D animation.",
        ru: "Социальный анимационный ролик для мэрии Еревана, посвящённый опасности больных и заражённых вредителями городских деревьев. Ролик сочетает тёплую рисованную иллюстрацию с понятной структурой эксплейнера: он показывает, как невылеченные деревья, ослабленные вредителями вроде нематод, угрожают здоровью городской среды и живущих рядом людей, и призывает жителей вовремя обследовать и лечить деревья. Проект охватывал иллюстрацию, дизайн персонажей и полную 2D-анимацию.",
        zh: "为埃里温市政府制作的公益动画，旨在提高公众对城市中病树及虫害树木危险性的认识。影片将温暖的手绘插画风格与清晰的科普讲解结构相结合，展示未经治疗、被线虫等害虫侵蚀而衰弱的树木如何威胁城市环境以及周边居民的健康，并呼吁居民及时检查和治疗树木。项目涵盖插画、角色设计与完整的 2D 动画制作。",
        ja: "エレバン市役所のために制作した、病気や害虫に侵された街路樹の危険性を伝える啓発アニメーション。温かみのある手描きイラストの作風と分かりやすいエクスプレイナー構成を組み合わせ、線虫などの害虫で弱った未処置の樹木が都市環境とそこで暮らす人々の健康をどのように脅かすかを描き、住民に樹木の点検と早めの治療を呼びかけます。イラスト、キャラクターデザイン、2Dアニメーション全般を担当しました。"
      }
    },
    'work-ladybag': {
      category: { en: "3D / CGI / Compositing", ru: "3D / CGI / Композитинг", zh: "3D / CGI / 合成", ja: "3D / CGI / コンポジット" },
      title: {
        en: "LadyBag — TV Commercial",
        ru: "LadyBag — ТВ-реклама",
        zh: "LadyBag — 电视广告",
        ja: "LadyBag — テレビCM"
      },
      role: {
        en: "CGI, VFX & Compositing",
        ru: "CGI, VFX и композитинг",
        zh: "CGI、视觉特效与合成",
        ja: "CGI・VFX・コンポジット"
      },
      client: {
        en: "TV Channel (Client Work)",
        ru: "Телеканал (Коммерческий проект)",
        zh: "电视频道（客户项目）",
        ja: "テレビ局（クライアントワーク）"
      },
      tools: "3D / CGI / VFX / Compositing",
      mediaLayout: "process-verticals",
      processVideo: { url: "assets/video/ladybag/ladybag_01.mp4", poster: "assets/images/work_ladybag_01.jpg" },
      verticalVideos: [
        { url: "assets/video/ladybag/ladybag_02.mp4", poster: "assets/images/work_ladybag_02.jpg" },
        { url: "assets/video/ladybag/ladybag_03.mp4", poster: "assets/images/work_ladybag_03.jpg" }
      ],
      desc: {
        en: "A television commercial made for a children's TV channel, designed to run between cartoon blocks and advertise a line of toy products. Full-CG flying toys were modelled, animated, and composited into live-action footage of kids' bedrooms, combined with magical particle effects and green-screen replacement of the on-set TV screens. The project covered 3D, VFX, and final compositing for broadcast delivery. The vertical clips show before/after breakdowns; the landscape clip walks through the process.",
        ru: "Телевизионный рекламный ролик для детского телеканала, рассчитанный на показ между блоками мультфильмов и рекламирующий линейку игрушек. Летающие игрушки полностью созданы в 3D, анимированы и вписаны в живую съёмку детских комнат, дополнены волшебными эффектами частиц и заменой экранов телевизоров, снятых на хромакее. Проект охватывал 3D, VFX и финальный композитинг для эфирной выдачи. Вертикальные ролики показывают сравнение «до/после», горизонтальный — процесс работы.",
        zh: "为某儿童电视频道制作的电视广告，设计用于在动画片段之间播出，宣传一系列玩具产品。飞行玩具全部以 3D 建模、动画并合成到实拍的儿童房间画面中，结合魔法粒子特效以及对拍摄现场电视绿幕的屏幕替换。项目涵盖 3D、视觉特效以及最终合成，用于电视播出。竖版短片展示前后对比，横版短片则呈现制作流程。",
        ja: "子ども向けテレビ局のために制作したテレビCMで、アニメ番組の合間に放送し、おもちゃ製品のラインナップを宣伝することを目的としています。飛行するおもちゃはすべて3Dでモデリング・アニメーションし、実写の子ども部屋の映像に合成。魔法のようなパーティクルエフェクトや、撮影現場のテレビのグリーンバックによるスクリーン置き換えを組み合わせました。3D、VFX、そして放送用の最終コンポジットまでを担当しました。縦型クリップはビフォーアフター、横型クリップは制作プロセスを紹介しています。"
      }
    }
  };

  const getVideoCopy = key => {
    const lang = document.documentElement.getAttribute('lang') || 'en';
    return translations[lang]?.[key] || translations.en[key] || '';
  };

  const createProjectVideoLoader = () => {
    const loader = document.createElement('span');
    loader.className = 'project-video-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');

    const spinner = document.createElement('span');
    spinner.className = 'project-video-loader-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'project-video-loader-text';
    label.dataset.i18n = 'video_loading';
    label.textContent = getVideoCopy('video_loading');

    loader.append(spinner, label);
    return loader;
  };

  const prepareProjectVideo = ({ video, source, host, playButton, onPlaying }) => {
    video.dataset.videoSrc = source;
    video.removeAttribute('poster');
    video.preload = 'auto';
    video.controls = false;
    video.removeAttribute('src');

    const setLoading = isLoading => host.classList.toggle('is-loading', isLoading);
    const setRetryLabel = () => playButton.setAttribute('aria-label', getVideoCopy('video_retry'));

    const play = () => {
      const needsLoad = !video.getAttribute('src') || video.error;
      host.classList.remove('has-error');
      setLoading(needsLoad || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA);
      playButton.disabled = true;

      if (needsLoad) {
        video.src = video.dataset.videoSrc;
        video.preload = 'auto';
        video.load();
      }

      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {
          setLoading(false);
          host.classList.add('has-error');
          playButton.disabled = false;
          setRetryLabel();
        });
      }
    };

    playButton.setAttribute('aria-label', getVideoCopy('video_play'));
    video.addEventListener('loadstart', () => setLoading(true));
    video.addEventListener('loadeddata', () => {
      setLoading(false);
      host.classList.remove('has-error');
      playButton.disabled = false;
    });
    video.addEventListener('waiting', () => {
      if (!video.paused) setLoading(true);
    });
    video.addEventListener('playing', () => {
      setLoading(false);
      host.classList.remove('has-error');
      host.classList.add('has-started', 'is-playing');
      video.controls = true;
      playButton.disabled = false;
      onPlaying?.();
    });
    video.addEventListener('pause', () => host.classList.remove('is-playing'));
    video.addEventListener('ended', () => host.classList.remove('is-playing'));
    video.addEventListener('error', () => {
      setLoading(false);
      host.classList.remove('has-started', 'is-playing');
      host.classList.add('has-error');
      video.controls = false;
      playButton.disabled = false;
      setRetryLabel();
    });
    video.addEventListener('click', () => {
      if (!host.classList.contains('has-started')) play();
    });
    playButton.addEventListener('click', play);

    // Load the selected/visible clip immediately so the browser can paint a
    // decoded first frame instead of stretching the low-resolution thumbnail.
    setLoading(true);
    video.src = video.dataset.videoSrc;
    video.load();
  };

  const modalVideoElement = document.getElementById('modal-video');
  const modalVideoGate = document.getElementById('modal-video-gate');
  const modalVideoGatePlay = document.getElementById('modal-video-gate-play');

  const setModalVideoGateLabel = key => {
    const label = modalVideoGatePlay?.querySelector('[data-i18n]');
    if (label) label.textContent = getVideoCopy(key);
    modalVideoGatePlay?.setAttribute('aria-label', getVideoCopy(key));
  };

  const resetModalVideoGate = () => {
    if (!modalVideoGate) return;
    modalVideoGate.hidden = true;
    modalVideoGate.classList.remove('is-loading', 'has-error', 'is-ready');
    if (modalVideoGatePlay) modalVideoGatePlay.disabled = false;
    setModalVideoGateLabel('video_play');
  };

  const prepareModalVideo = item => {
    if (!modalVideoElement || !modalVideoGate || !modalVideoGatePlay) return;

    modalVideoElement.pause();
    modalVideoElement.removeAttribute('src');
    modalVideoElement.load();
    modalVideoElement.dataset.videoSrc = item.url;
    modalVideoElement.removeAttribute('poster');
    modalVideoElement.preload = 'auto';
    modalVideoElement.controls = false;
    modalVideoGate.hidden = false;
    modalVideoGate.classList.remove('has-error', 'is-ready');
    modalVideoGate.classList.add('is-loading');
    modalVideoGatePlay.disabled = false;
    setModalVideoGateLabel('video_play');
    modalVideoElement.src = item.url;
    modalVideoElement.load();
  };

  const playPreparedModalVideo = () => {
    if (!modalVideoElement || !modalVideoGate || !modalVideoGatePlay) return;
    const source = modalVideoElement.dataset.videoSrc;
    if (!source) return;

    const needsLoad = !modalVideoElement.getAttribute('src') || modalVideoElement.error;
    modalVideoGate.classList.remove('has-error');
    modalVideoGate.classList.toggle(
      'is-loading',
      needsLoad || modalVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    );
    modalVideoGatePlay.disabled = true;

    if (needsLoad) {
      modalVideoElement.src = source;
      modalVideoElement.preload = 'auto';
      modalVideoElement.load();
    }

    const playAttempt = modalVideoElement.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        modalVideoGate.classList.remove('is-loading');
        modalVideoGate.classList.add('has-error');
        modalVideoGatePlay.disabled = false;
        setModalVideoGateLabel('video_retry');
      });
    }
  };

  modalVideoGatePlay?.addEventListener('click', playPreparedModalVideo);
  modalVideoElement?.addEventListener('click', () => {
    if (!modalVideoGate?.classList.contains('is-ready')) playPreparedModalVideo();
  });
  modalVideoElement?.addEventListener('loadstart', () => modalVideoGate?.classList.add('is-loading'));
  modalVideoElement?.addEventListener('loadeddata', () => {
    modalVideoGate?.classList.remove('is-loading', 'has-error');
    if (modalVideoGatePlay) modalVideoGatePlay.disabled = false;
  });
  modalVideoElement?.addEventListener('waiting', () => {
    if (!modalVideoElement.paused) modalVideoGate?.classList.add('is-loading');
  });
  modalVideoElement?.addEventListener('playing', () => {
    modalVideoGate?.classList.remove('is-loading', 'has-error');
    modalVideoGate?.classList.add('is-ready');
    modalVideoElement.controls = true;
    if (modalVideoGatePlay) modalVideoGatePlay.disabled = false;
  });
  modalVideoElement?.addEventListener('error', () => {
    modalVideoGate?.classList.remove('is-loading', 'is-ready');
    modalVideoGate?.classList.add('has-error');
    modalVideoElement.controls = false;
    if (modalVideoGatePlay) modalVideoGatePlay.disabled = false;
    setModalVideoGateLabel('video_retry');
  });

  const stopAllProjectModalVideos = (clearSources = false) => {
    const modal = document.getElementById('project-details-modal');
    if (!modal) return;

    modal.querySelectorAll('video').forEach(video => {
      video.pause();

      if (clearSources) {
        video.removeAttribute('src');
        video.load();
      }
    });

    if (clearSources) resetModalVideoGate();
  };

  const populateModal = (projId, lang) => {
    const data = projectDetailsData[projId];
    if (!data) return;

    // Stop and unload media left by the previously opened project.
    stopAllProjectModalVideos(true);

    // Set dynamic text elements.
    document.getElementById('modal-project-category').textContent = data.category[lang] || data.category.en;
    document.getElementById('modal-project-title').textContent = data.title[lang] || data.title.en;
    document.getElementById('modal-project-role').textContent = data.role[lang] || data.role.en;
    document.getElementById('modal-project-client').textContent = data.client[lang] || data.client.en;
    document.getElementById('modal-project-tools').textContent = data.tools;
    document.getElementById('modal-project-description').textContent = data.desc[lang] || data.desc.en;

    // Show/hide before-after slider quick link action.
    const sliderActionWrapper = document.getElementById('modal-slider-action-wrapper');
    sliderActionWrapper.style.display = projId === 'work-street' ? 'block' : 'none';

    const heroMedia = document.getElementById('modal-hero-media');
    const modalVideo = document.getElementById('modal-video');
    const modalImage = document.getElementById('modal-image');
    const thumbnailsContainer = document.getElementById('modal-thumbnails');
    const verticalGallery = document.getElementById('modal-vertical-gallery');
    const horizontalGallery = document.getElementById('modal-horizontal-gallery');

    if (
      !heroMedia ||
      !modalVideo ||
      !modalImage ||
      !thumbnailsContainer ||
      !verticalGallery ||
      !horizontalGallery
    ) return;

    const images = Array.isArray(data.images) ? data.images : [];
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const useVerticalGallery = data.mediaLayout === 'vertical-grid' && videos.length > 0;
    const useProcessVerticals = data.mediaLayout === 'process-verticals';

    thumbnailsContainer.innerHTML = '';
    verticalGallery.innerHTML = '';
    horizontalGallery.innerHTML = '';

    modalVideo.style.display = 'none';
    modalImage.style.display = 'none';
    modalImage.removeAttribute('src');

    heroMedia.hidden = useVerticalGallery || useProcessVerticals;
    thumbnailsContainer.hidden = useVerticalGallery || useProcessVerticals;
    verticalGallery.hidden = !useVerticalGallery && !useProcessVerticals;
    horizontalGallery.hidden = !useVerticalGallery || images.length === 0;
    verticalGallery.classList.toggle('modal-vertical-gallery--pv', useProcessVerticals);

    /* Process + verticals mode ---------------------------------------------
       Used by projects with mediaLayout: "process-verticals": a landscape
       process clip and the portrait before/after clips shown together in one
       equal-height row. Each plays on click; starting one pauses the others. */
    if (useProcessVerticals) {
      const localizedTitle = data.title[lang] || data.title.en;
      const ariaTemplate = translations[lang]?.modal_video_aria || translations.en.modal_video_aria;
      const buildAria = index =>
        ariaTemplate.replace('{title}', localizedTitle).replace('{index}', String(index + 1));

      // Only one clip plays at a time across the whole row.
      const pauseOthers = current => {
        verticalGallery.querySelectorAll('video').forEach(other => {
          if (other !== current) other.pause();
        });
      };

      const buildClip = (clip, { cardClass, videoClass, ariaIndex }) => {
        const card = document.createElement('div');
        card.className = cardClass;

        const video = document.createElement('video');
        video.className = videoClass;
        video.poster = clip.poster || '';
        video.playsInline = true;
        video.loop = true;
        video.controls = false;

        const playButton = document.createElement('button');
        playButton.className = 'modal-pv-play';
        playButton.type = 'button';
        playButton.setAttribute('aria-label', buildAria(ariaIndex));
        playButton.innerHTML = '<span aria-hidden="true">▶</span>';

        prepareProjectVideo({
          video,
          source: clip.url,
          host: card,
          playButton,
          onPlaying: () => {
            pauseOthers(video);
          }
        });

        card.appendChild(video);
        card.appendChild(createProjectVideoLoader());
        card.appendChild(playButton);
        return card;
      };

      // Landscape process clip first, then the portrait before/after clips —
      // all shown together in one equal-height row (no switching or scrolling).
      const process = data.processVideo;
      if (process?.url) {
        verticalGallery.appendChild(buildClip(process, {
          cardClass: 'modal-pv-process',
          videoClass: 'modal-pv-process-video',
          ariaIndex: 0
        }));
      }

      const clips = Array.isArray(data.verticalVideos) ? data.verticalVideos : [];
      clips.forEach((clip, index) => {
        if (!clip?.url) return;
        verticalGallery.appendChild(buildClip(clip, {
          cardClass: 'modal-pv-vertical',
          videoClass: 'modal-pv-vertical-video',
          ariaIndex: index + 1
        }));
      });

      return;
    }

    /* Portrait-video mode --------------------------------------------------
       Only projects with mediaLayout: "vertical-grid" use this branch.
       Existing landscape projects continue through the original viewer below. */
    if (useVerticalGallery) {
      verticalGallery.style.setProperty('--vertical-video-aspect', data.videoAspect || '9 / 16');
      const localizedTitle = data.title[lang] || data.title.en;
      const formatMediaAriaLabel = (key, index) => {
        const template = translations[lang]?.[key] || translations.en[key];
        return template
          .replace('{title}', localizedTitle)
          .replace('{index}', String(index + 1));
      };

      videos.forEach((clip, index) => {
        if (!clip?.url) return;

        const card = document.createElement('article');
        card.className = 'modal-vertical-card';

        const frame = document.createElement('div');
        frame.className = 'modal-vertical-video-frame';

        const video = document.createElement('video');
        video.className = 'modal-vertical-video';
        video.poster = clip.poster || clip.thumb || images[0] || '';
        video.playsInline = true;
        video.loop = clip.loop !== false;
        video.muted = clip.muted === true;
        video.controls = false;

        const indexLabel = document.createElement('span');
        indexLabel.className = 'modal-vertical-index';
        indexLabel.textContent = String(index + 1).padStart(2, '0');

        const playButton = document.createElement('button');
        playButton.className = 'modal-vertical-play';
        playButton.type = 'button';
        playButton.setAttribute(
          'aria-label',
          formatMediaAriaLabel('modal_video_aria', index)
        );
        playButton.innerHTML = '<span aria-hidden="true">▶</span>';

        prepareProjectVideo({
          video,
          source: clip.url,
          host: card,
          playButton,
          onPlaying: () => {
            verticalGallery.querySelectorAll('video').forEach(otherVideo => {
              if (otherVideo !== video) otherVideo.pause();
            });
          }
        });

        frame.appendChild(video);
        frame.appendChild(indexLabel);
        frame.appendChild(createProjectVideoLoader());
        frame.appendChild(playButton);
        card.appendChild(frame);
        verticalGallery.appendChild(card);
      });

      /* Landscape stills shown below the portrait clips. */
      images.forEach((imageUrl, index) => {
        if (!imageUrl) return;

        const figure = document.createElement('figure');
        figure.className = 'modal-horizontal-card';

        const image = document.createElement('img');
        image.className = 'modal-horizontal-image';
        image.src = imageUrl;
        image.alt = formatMediaAriaLabel('modal_image_aria', index);
        image.loading = 'lazy';

        figure.appendChild(image);
        horizontalGallery.appendChild(figure);
      });

      return;
    }

    /* Standard landscape mode -------------------------------------------- */
    const mediaItems = [];
    const fallbackThumb = images[0] || '';

    if (videos.length > 0) {
      videos.forEach(clip => {
        if (!clip?.url) return;

        mediaItems.push({
          type: 'video',
          url: clip.url,
          thumb: clip.thumb || clip.poster || fallbackThumb
        });
      });
    } else if (data.videoUrl) {
      mediaItems.push({
        type: 'video',
        url: data.videoUrl,
        thumb: fallbackThumb
      });
    }

    images.forEach(imgUrl => {
      mediaItems.push({
        type: 'image',
        url: imgUrl,
        thumb: imgUrl
      });
    });

    // Every video is shown in full inside the project stage. Stills retain the
    // project's existing crop preference.
    const imageFit = data.fit === 'contain' ? 'contain' : 'cover';
    modalVideo.style.objectFit = 'contain';
    modalImage.style.objectFit = imageFit;
    heroMedia.style.aspectRatio = data.stageAspect || '';

    const showMedia = item => {
      if (item.type === 'video') {
        heroMedia.classList.add('is-letterboxed');
        modalImage.style.display = 'none';
        modalVideo.style.display = 'block';
        modalVideo.muted = true;
        modalVideo.loop = true;
        // A poster and explicit play gate keep the media recognisable without
        // starting a network request until the visitor chooses this clip.
        prepareModalVideo(item);
      } else {
        heroMedia.classList.toggle('is-letterboxed', imageFit === 'contain');
        modalVideo.pause();
        modalVideo.removeAttribute('src');
        modalVideo.load();
        resetModalVideoGate();
        modalVideo.style.display = 'none';
        modalImage.style.display = 'block';
        modalImage.src = item.url;
      }
    };

    mediaItems.forEach((item, index) => {
      const thumbBtn = document.createElement('button');
      thumbBtn.className = 'modal-thumb';
      thumbBtn.type = 'button';
      thumbBtn.dataset.mediaType = item.type;
      thumbBtn.setAttribute(
        'aria-label',
        `${item.type === 'video' ? 'Open video' : 'Open image'} ${index + 1}`
      );
      if (index === 0) thumbBtn.classList.add('active');

      if (item.thumb) {
        const img = document.createElement('img');
        img.src = item.thumb;
        img.alt = '';
        thumbBtn.appendChild(img);
      } else {
        const fallbackIcon = document.createElement('span');
        fallbackIcon.className = 'modal-thumb-fallback';
        fallbackIcon.textContent = item.type === 'video' ? '▶' : '•';
        thumbBtn.appendChild(fallbackIcon);
      }

      if (item.type === 'video') {
        const videoMarker = document.createElement('span');
        videoMarker.className = 'modal-thumb-video-marker';
        videoMarker.setAttribute('aria-hidden', 'true');
        videoMarker.textContent = '▶';
        thumbBtn.appendChild(videoMarker);
      }

      thumbBtn.addEventListener('click', () => {
        thumbnailsContainer.querySelectorAll('.modal-thumb').forEach(btn => btn.classList.remove('active'));
        thumbBtn.classList.add('active');
        showMedia(item);
      });

      thumbnailsContainer.appendChild(thumbBtn);
    });

    if (mediaItems.length > 0) {
      showMedia(mediaItems[0]);
    }
  };

  // Event handlers setup
  const dialog = document.getElementById('project-details-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const workItemCards = document.querySelectorAll('.work-item');
  
  if (dialog && closeBtn) {
    const closeModal = () => {
      stopAllProjectModalVideos(true);
      document.getElementById('modal-vertical-gallery')?.replaceChildren();

      if (dialog.open) dialog.close();
      activeProjectId = null;
      document.body.style.overflow = '';
    };

    workItemCards.forEach(card => {
      const triggerBtn = card.querySelector('.btn-work-explore');
      
      const openModalHandler = (e) => {
        e.preventDefault();

        // The Details chip sits inside the image container, so a tap runs both
        // listeners; showModal() on an already open dialog throws.
        if (dialog.open) return;

        const projId = card.id;
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        activeProjectId = projId;
        
        populateModal(projId, currentLang);
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      };

      if (triggerBtn) {
        triggerBtn.addEventListener('click', openModalHandler);
      }
      
      const imgContainer = card.querySelector('.work-img-container');
      if (imgContainer) {
        imgContainer.addEventListener('click', (e) => {
          if (e.target.tagName !== 'A' && !e.target.classList.contains('work-badge')) {
            openModalHandler(e);
          }
        });
      }
    });

    closeBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking on the backdrop area
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        closeModal();
      }
    });
    
    // Clean up media streams if browser forces close (Esc key)
    dialog.addEventListener('cancel', () => {
      stopAllProjectModalVideos(true);
      document.getElementById('modal-vertical-gallery')?.replaceChildren();
      activeProjectId = null;
      document.body.style.overflow = '';
    });
    
    // Quick link solver for street cleanup slider redirection
    const sliderLink = document.getElementById('modal-slider-link');
    if (sliderLink) {
      sliderLink.addEventListener('click', () => {
        closeModal();
      });
    }
  }

  // 9. Easter Egg: Overscroll Cat Animation Logic
  const easterEggCat = document.getElementById('easter-egg-cat');
  let isCatTriggered = false;

  if (easterEggCat) {
    window.addEventListener('scroll', () => {
      // Ignore scroll updates while the trigger animation is playing
      if (isCatTriggered) return;

      // scrollY goes negative on macOS/iOS when pulling down past the top
      if (window.scrollY < 0) {
        const pullDistance = Math.abs(window.scrollY);
        
        // Threshold reached: trigger full animation
        if (pullDistance > 80) {
          isCatTriggered = true;
          
          // Smooth springy transition for full reveal
          easterEggCat.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          easterEggCat.style.transform = `translateX(-50%) translateY(0)`; // fully reveal
          
          // TODO for Lottie integration:
          // lottieAnimation.playSegments([triggerFrame, endFrame], true);
          
          // Hang for 1.5 seconds, then crawl back
          setTimeout(() => {
            easterEggCat.style.transition = 'transform 0.5s ease-in-out';
            easterEggCat.style.transform = `translateX(-50%) translateY(-100%)`; // crawl back
            
            // Release lock after retract is finished
            setTimeout(() => {
              isCatTriggered = false;
              easterEggCat.style.transition = 'transform 0.05s linear'; // revert to tracking speed
            }, 500);
          }, 1500);

        } else {
          // Proportional tracking before threshold
          easterEggCat.style.transition = 'transform 0.05s linear';
          easterEggCat.style.transform = `translateX(-50%) translateY(calc(-100% + ${pullDistance}px))`;
          
          // TODO for Lottie integration:
          // let progress = Math.min(pullDistance / 80, 1);
          // lottieAnimation.goToAndStop(progress * triggerFrame, true);
        }
      } else {
        // Reset when not overscrolling
        easterEggCat.style.transition = 'transform 0.05s linear';
        easterEggCat.style.transform = `translateX(-50%) translateY(-100%)`;
      }
    }, { passive: true });
  }

});
