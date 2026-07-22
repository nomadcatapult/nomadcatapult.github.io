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

  // 0.5. The first downward gesture introduces the hero copy; scrolling stays locked until it finishes.
  const heroSection = document.getElementById('hero');
  const heroContent = document.getElementById('hero-intro');
  const heroScrollIndicator = document.getElementById('hero-scroll-indicator');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nomadCanvasPromo = document.getElementById('nomadcanvas');
  const canUseCanvasReveal = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (nomadCanvasPromo && canUseCanvasReveal && !reducedMotion) {
    const hideCanvasReveal = () => {
      nomadCanvasPromo.classList.remove('is-pointer-revealing');
    };

    const updateCanvasReveal = (event) => {
      const promoBounds = nomadCanvasPromo.getBoundingClientRect();
      const revealX = ((event.clientX - promoBounds.left) / promoBounds.width) * 100;
      const revealY = ((event.clientY - promoBounds.top) / promoBounds.height) * 100;

      nomadCanvasPromo.style.setProperty('--reveal-x', `${revealX}%`);
      nomadCanvasPromo.style.setProperty('--reveal-y', `${revealY}%`);
      nomadCanvasPromo.classList.add('is-pointer-revealing');
    };

    nomadCanvasPromo.addEventListener('pointermove', updateCanvasReveal);
    nomadCanvasPromo.addEventListener('pointerleave', hideCanvasReveal);
    document.addEventListener('pointermove', (event) => {
      if (!nomadCanvasPromo.contains(event.target)) hideCanvasReveal();
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

  // 3. Selected Works Category Filtering
  const filterButtons = document.querySelectorAll('.btn-filter');
  const workItems = document.querySelectorAll('.work-item');

  if (filterButtons.length > 0 && workItems.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle active button class
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        // Filter work items with visual transition
        workItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue) {
            item.style.opacity = '0';
            item.classList.remove('hidden');
            // Force reflow
            void item.offsetWidth;
            item.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            item.style.opacity = '1';
          } else {
            item.classList.add('hidden');
          }
        });
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
      nav_canvas: "NomadCanvas",
      nav_contact: "Contact",
      hero_subtitle: "Remote visual and interactive production studio for campaigns, websites, apps, games, live shows, and AI-assisted media.",
      hero_scroll_hint: "Scroll to reveal",
      hero_scroll_continue: "Scroll to explore",
      video_loading: "Loading video…",
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
      filter_cleanup: "Cleanup",
      filter_ai: "AI Concept",
      filter_interactive: "Interactive",
      cat_cgi: "3D / CGI",
      cat_motion: "Motion Design",
      cat_ai: "AI Concept Art",
      cat_cleanup: "Compositing & Cleanup",
      cat_interactive: "Interactive Media",
      badge_client: "Client Work",
      badge_personal: "Studio Project",
      badge_ai: "AI-Assisted Exploration",
      btn_details: "Details",
      btn_slider: "Interactive Slider",
      work1_title: "Aurora Serum Product Render",
      work1_summary: "Premium Octane render showing dynamic glass refraction and minimal studio neon lighting.",
      work2_title: "LAUNCH Typographic Promo",
      work2_summary: "Dynamic typography animation integrated with physical simulation ribbons and camera tracking data.",
      work3_title: "Mech Bioluminescent Forest",
      work3_summary: "Hybrid CG composition enhanced by generative AI styleframes for rapid visual prototyping.",
      work4_title: "Urban Street Invisible VFX",
      work4_summary: "Clean plate reconstruction, overhead wires removal, and custom holographic logo tracking integration.",
      work5_title: "NomadCanvas",
      work5_summary: "A lightweight, high-performance HTML5 canvas sketching application designed for digital graphics workflow.",
      banner_accent: "// HOW WE LAUNCH",
      banner_quote: "A small core team brings the right specialists together — then carries the idea from a rough brief to final delivery.",
      slider_tag: "Invisible VFX",
      slider_title: "Production Cleanup",
      slider_subtitle: "Slide to check out the details of our cleanup, objects removal, and HUD integration pipeline.",
      slider_before: "Raw Footage",
      slider_after: "Cleaned Shot",
      collab_tag: "Collaboration Formats",
      collab_title: "Flexible Team Scale",
      collab1_title: "01. Freelance Support",
      collab1_desc: "Direct backup for agencies, studios, and production houses that need senior-level support for CGI, motion design, or cleanup tasks. Fits into existing project pipelines.",
      collab2_title: "02. Project Production",
      collab2_desc: "End-to-end production assets for brands and startup teams. We handle the process from brief, styleframes, draft animations, rendering, up to the final deliverables.",
      collab3_title: "03. White-Label Partner",
      collab3_desc: "Unbranded production partner. We handle backend visual execution, CGI setups, and animations silently while your client-facing account team manages feedback.",
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
      btn_view_slider: "View Interactive Slider"
    },
    ru: {
      nav_home: "Главная",
      nav_services: "Услуги",
      nav_work: "Работы",
      nav_vfx: "VFX витрина",
      nav_collab: "Как мы работаем",
      nav_canvas: "NomadCanvas",
      nav_contact: "Контакты",
      hero_subtitle: "Удаленная студия визуального и интерактивного продакшена: кампании, сайты, приложения, игры, live-шоу и медиа с помощью ИИ.",
      hero_scroll_hint: "Прокрутите, чтобы открыть",
      hero_scroll_continue: "Прокрутите, чтобы смотреть дальше",
      video_loading: "Загрузка видео…",
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
      canvas_promo_subtitle: "Visual workspace for motion, media and ideas.",
      canvas_promo_description: "Локальное приложение с бесконечным холстом для референсов, медиа, раскадровок, заметок и таймлайнов. Проекты сохраняются в переносимом формате .nmc.",
      canvas_promo_repo: "Смотреть на GitHub",
      canvas_promo_release: "Скачать релиз",
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
      filter_cleanup: "Клинап",
      filter_ai: "ИИ-концепт",
      filter_interactive: "Интерактив",
      cat_cgi: "3D / CGI",
      cat_motion: "Моушн-дизайн",
      cat_ai: "ИИ-концепт-арт",
      cat_cleanup: "Композитинг и клинап",
      cat_interactive: "Интерактивные медиа",
      badge_client: "Коммерческий проект",
      badge_personal: "Студийный эксперимент",
      badge_ai: "ИИ-исследование",
      btn_details: "Подробнее",
      btn_slider: "Интерактивный слайдер",
      work1_title: "Рендер сыворотки Aurora",
      work1_summary: "Премиальный рендер Octane, демонстрирующий преломление в стекле и минималистичное неоновое освещение.",
      work2_title: "Типографическое промо LAUNCH",
      work2_summary: "Динамическая анимация типографики, интегрированная с физической симуляцией лент и данными трекинга камеры.",
      work3_title: "Биолюминесцентный лес с мехом",
      work3_summary: "Гибридный CG-композит, улучшенный генеративными ИИ-стайлфреймами для быстрого визуального прототипирования.",
      work4_title: "Невидимый VFX городской улицы",
      work4_summary: "Реконструкция чистого листа, удаление подвесных проводов и интеграция отслеживаемого голографического логотипа.",
      work5_title: "NomadCanvas",
      work5_summary: "Легковесное высокопроизводительное приложение для рисования на HTML5 Canvas, созданное для рабочих процессов цифровой графики.",
      banner_accent: "// КАК МЫ ЗАПУСКАЕМ ИДЕИ",
      banner_quote: "Небольшая основная команда собирает нужных специалистов и доводит идею от сырого брифа до готового запуска.",
      slider_tag: "Невидимый VFX",
      slider_title: "Производственный клинап",
      slider_subtitle: "Передвигайте ползунок, чтобы оценить качество клинапа, удаления объектов и интеграции графики.",
      slider_before: "Исходник",
      slider_after: "Результат",
      collab_tag: "Форматы сотрудничества",
      collab_title: "Гибкий масштаб команды",
      collab1_title: "01. Поддержка на фрилансе",
      collab1_desc: "Прямая поддержка для агентств, студий и продакшенов, которым нужна помощь уровня senior в задачах CGI, моушн-дизайна или клинапа. Легко встраивается в текущие пайплайны.",
      collab2_title: "02. Производство под ключ",
      collab2_desc: "Создание визуальных активов от начала до конца для брендов и стартап-команд. Мы ведем весь процесс: бриф, стайлфреймы, анимация, рендеринг и финальная сдача.",
      collab3_title: "03. White-Label партнерство",
      collab3_desc: "Небрендированный партнер по продакшену. Мы берем на себя визуальное исполнение, CGI и анимацию, в то время как ваша команда общается с клиентом напрямую.",
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
      btn_view_slider: "Открыть интерактивный слайдер"
    },
    zh: {
      nav_home: "首页",
      nav_services: "服务领域",
      nav_work: "精选作品",
      nav_vfx: "特效展示",
      nav_collab: "合作模式",
      nav_canvas: "NomadCanvas",
      nav_contact: "联系我们",
      hero_subtitle: "远程视觉与互动制作工作室，服务于广告活动、网站、应用、游戏、现场演出和 AI 辅助媒体。",
      hero_scroll_hint: "向下滚动以展开",
      hero_scroll_continue: "向下探索",
      video_loading: "视频加载中…",
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
      service_cleanup_desc: "制作级擦除钢丝、物体移除、屏幕替换、摄像机反求跟踪以及无缝视觉融合。",
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
      filter_cleanup: "合成擦除",
      filter_ai: "AI概念",
      filter_interactive: "互动",
      cat_cgi: "3D / CGI",
      cat_motion: "动态设计",
      cat_ai: "AI 概念艺术",
      cat_cleanup: "合成与擦除",
      cat_interactive: "互动媒体",
      badge_client: "客户项目",
      badge_personal: "工作室项目",
      badge_ai: "AI辅助探索",
      btn_details: "详情",
      btn_slider: "双图滑动对比",
      work1_title: "Aurora 精华液产品渲染",
      work1_summary: "优质的 Octane 渲染，展示了动态的玻璃折射和极简的室内霓虹照明。",
      work2_title: "LAUNCH 文字排版宣传片",
      work2_summary: "集成了物理模拟丝带与摄像机跟踪数据的动态排版动画。",
      work3_title: "机甲生物发光森林",
      work3_summary: "混合 CG 构图，通过生成式 AI 风格帧进行增强，以实现快速的视觉原型设计。",
      work4_title: "城市街道无形特效",
      work4_summary: "干净的背景板重建、擦除头顶电线，以及集成自定义的全息 Logo 跟踪融合。",
      work5_title: "NomadCanvas",
      work5_summary: "轻量级、高性能的 HTML5 canvas 绘图应用程序，专为数字图形工作流设计。",
      banner_accent: "// 我们如何发射创意",
      banner_quote: "小而核心的团队会为项目集结合适的专家，并将想法从初始简报推进到最终交付。",
      slider_tag: "无形特效",
      slider_title: "制作擦除清理",
      slider_subtitle: "滑动即可查看我们的擦除清理、物体移除和 HUD 集成流程的细节。",
      slider_before: "原始素材",
      slider_after: "清理后",
      collab_tag: "合作模式",
      collab_title: "灵活团队规模",
      collab1_title: "01. 自由职业支持",
      collab1_desc: "为需要 CGI、动态设计或擦除任务方面资深级支持的代理商、工作室和制作公司提供直接后盾。适应现有的项目流程。",
      collab2_title: "02. 项目制制作",
      collab2_desc: "为品牌和初创团队提供端到端的制作资产。我们处理从简报、风格帧、草稿动画、渲染，一直到最终交付的过程。",
      collab3_title: "03. 白标合作伙伴",
      collab3_desc: "无品牌制作合作伙伴。我们默默地处理后端的视觉执行、CGI 设置和动画，而您面向客户的团队负责管理反馈。",
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
      btn_view_slider: "查看双图对比"
    },
    ja: {
      nav_home: "ホーム",
      nav_services: "サービス",
      nav_work: "実績紹介",
      nav_vfx: "VFX紹介",
      nav_collab: "業務フロー",
      nav_canvas: "NomadCanvas",
      nav_contact: "お問い合わせ",
      hero_subtitle: "キャンペーン、Webサイト、アプリ、ゲーム、ライブショー、AI支援メディアを制作するリモートのビジュアル＆インタラクティブ制作スタジオ。",
      hero_scroll_hint: "スクロールして表示",
      hero_scroll_continue: "スクロールして探索",
      video_loading: "動画を読み込み中…",
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
      service_cleanup_desc: "プロダクションクオリティ of ワイヤー消し、オブジェクト除去、スクリーンはめ込み、カメラトラッキング、シームレスな実写合成。",
      service_ai_title: "AIビジュアル支援",
      service_ai_desc: "迅速なビジュアルの具現化、生成されたスタイルフレーム、コンセプトアートの探索、およびピッチ提案を加速する hybrid ワークフロー。",
      service_campaign_title: "ライブ＆キャンペーン",
      service_campaign_desc: "SNSパッケージ、ステージや音楽ショーのビジュアル、DOOHループ、プレゼン背景、サウンドと連動するスクリーンコンテンツ。",
      service_interactive_title: "インタラクティブメディア",
      service_interactive_desc: "Webサイト、クリエイティブアプリ、ゲーム、プロトタイプ、canvasツール、ビジュアルアイデアを使えるシステムにするインタラクティブプラットフォーム。",
      work_tag: "精選アセット",
      work_title: "ショーケース",
      filter_all: "すべて",
      filter_cgi: "CGI",
      filter_motion: "モーション",
      filter_cleanup: "クリンアップ",
      filter_ai: "AIコンセプト",
      filter_interactive: "インタラクティブ",
      cat_cgi: "3D / CGI",
      cat_motion: "モーションデザイン",
      cat_ai: "AIコンセプトアート",
      cat_cleanup: "コンポジット＆クリンアップ",
      cat_interactive: "インタラクティブメディア",
      badge_client: "クライアントワーク",
      badge_personal: "自主制作・実験",
      badge_ai: "AI支援・研究",
      btn_details: "詳細",
      btn_slider: "比較スライダー",
      work1_title: "Aurora美容液製品レンダリング",
      work1_summary: "ダイナミックなガラスの屈折とミニマルなスタジオネオン照明を示すプレミアムOctaneレンダリング。",
      work2_title: "LAUNCH タイポグラフィプロモ",
      work2_summary: "物理シミュレーションのリボンとカメラトラッキングデータを統合したダイナミックなタイポグラフィアニメーション。",
      work3_title: "メカ発光森林",
      work3_summary: "迅速なビジュアルプロトタイピングのために生成AIスタイルフレームによって強化されたハイブリッドCGコンポジション。",
      work4_title: "都市のストリートのインビジブルVFX",
      work4_summary: "クリーンプレート再構成、頭上電線の除去、およびカスタムホログラフィックロゴトラッキング合成。",
      work5_title: "NomadCanvas",
      work5_summary: "デジタルグラフィックスワークフロー向けに設計された、軽量で高性能なHTML5キャンバススケッチアプリケーション。",
      banner_accent: "// アイデアの打ち上げ方",
      banner_quote: "小さなコアチームが必要な専門家を集め、ラフなブリーフから最終納品までアイデアを伴走します。",
      slider_tag: "インビジブルVFX",
      slider_title: "クリンアップ",
      slider_subtitle: "スライダーを動かして、クリンアップ、オブジェクト除去、およびHUD合成パイプラインの詳細を確認してください。",
      slider_before: "未調整映像",
      slider_after: "調整後映像",
      collab_tag: "コラボレーション形式",
      collab_title: "柔軟なチーム編成",
      collab1_title: "01. フリーランスサポート",
      collab1_desc: "CGI、モーションデザイン、またはクリンアップ作業でシニアレベルのサポートを必要とするエージェンシー、スタジオ、プロダクション向けの直接的なバックアップ。既存のパイプラインに適合します。",
      collab2_title: "02. プロジェクト制作",
      collab2_desc: "ブランドやスタートアップチーム向けのエンドツーエンドの制作。ブリーフ、スタイルフレーム、ドラフトアニメーション、レンダリングから最終納品まで対応します。",
      collab3_title: "03. ホワイトレーベルパートナー",
      collab3_desc: "ブランド名を出さない制作パートナー。クライアント対応のアカウントチームがフィードバックを管理する間、バックエンドのビジュアル実行、CGIセットアップ、アニメーションをサイレントに処理します。",
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
      btn_view_slider: "比較スライダーを見る"
    }
  };

  // Active details modal project tracker
  let activeProjectId = null;

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
    'work-aurora': {
      category: { en: "CGI", ru: "CGI", zh: "CGI", ja: "CGI" },
      title: {
        en: "Aurora Serum Product Render",
        ru: "Рендер сыворотки Aurora",
        zh: "Aurora 精华液产品渲染",
        ja: "Aurora美容液製品レンダリング"
      },
      role: {
        en: "CGI Product Rendering & Material Lookdev",
        ru: "3D-рендер продукта и разработка материалов",
        zh: "CGI 产品材质渲染",
        ja: "CGI製品レンダリング＆質感開発"
      },
      client: {
        en: "Aurora Cosmetics (Client Work)",
        ru: "Aurora Cosmetics (Коммерческий проект)",
        zh: "Aurora Cosmetics (客户项目)",
        ja: "Aurora Cosmetics (クライアントワーク)"
      },
      tools: "Blender, Octane Render, Photoshop",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-glass-dropper-dripping-cosmetic-liquid-into-a-bottle-49806-large.mp4",
      images: [
        "assets/images/work_cgi.png",
        "assets/images/work_cgi_detail.png"
      ],
      desc: {
        en: "Premium 3D render exploring glass refraction, dispersion, and liquid simulation. Created a photorealistic cosmetics mockup with minimal studio lighting, focused on neon aesthetics and micro-bubbles in the glass bottle structure.",
        ru: "Премиальный 3D-рендер, исследующий преломление стекла, дисперсию света и симуляцию жидкости. Создан фотореалистичный макет косметики с минималистичным студийным освещением, акцентом на неоновую эстетику и микропузырьки в структуре стеклянного флакона.",
        zh: "优质 3D 渲染，探索玻璃折射、色散和液体模拟。创建了一个具有极简工作室照明的写实化妆品模型，专注于霓虹美学和玻璃瓶结构中的微小气泡。",
        ja: "ガラスの屈折、光の分散、液体のシミュレーションを探求するプレミアム3Dレンダリング。ネオンの美学とガラスボトルの構造に含まれるマイクロバブルに焦点を当て、ミニマルなスタジオ照明でフォトリアルな化粧品のモックアップを制作しました。"
      }
    },
    'work-launch': {
      category: { en: "Motion", ru: "Моушн", zh: "动态设计", ja: "モーション" },
      title: {
        en: "LAUNCH Typographic Promo",
        ru: "Типографическое промо LAUNCH",
        zh: "LAUNCH 文字排版宣传片",
        ja: "LAUNCH タイポグラフィプロモ"
      },
      role: {
        en: "3D Typography & Motion Graphics",
        ru: "3D-типографика и моушн-графика",
        zh: "3D 排版与动态图形设计",
        ja: "3Dタイポグラフィ＆モーショングラフィックス"
      },
      client: {
        en: "Studio Project",
        ru: "Студийный эксперимент",
        zh: "工作室项目",
        ja: "自主制作・実験"
      },
      tools: "After Effects, Cinema 4D, Typography",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-42930-large.mp4",
      images: [
        "assets/images/work_motion.png",
        "assets/images/work_motion_detail.png"
      ],
      desc: {
        en: "A promotional typographic motion design piece. Integrates complex 3D typography geometry with physical simulation ribbons running along splines, tracked with real camera moves. Sound and rhythm drive the animation speed.",
        ru: "Промо-ролик с акцентом на типографику и движение. Интегрирует сложную 3D-типографику с физическими симуляциями лент, движущихся по сплайнам, с привязкой к реальному движению камеры. Скорость анимации определяется звуком и ритмом.",
        zh: "创意文字排版宣传动态视频。将复杂的 3D 字体几何体与沿着样条曲线的物理模拟丝带相结合，并与真实的相机运动进行同步跟踪。动画节奏由音乐与音效驱动。",
        ja: "プロモーション用のタイポグラフィモーションデザイン。複雑な3Dタイポグラフィの形状と、スプラインに沿って動く物理シミュレーションのリボンを統合し、実写のカメラワークとトラッキングしました。音楽とリズムがアニメーションのスピードを駆動します。"
      }
    },
    'work-jungle': {
      category: { en: "AI Concept", ru: "ИИ-концепт", zh: "AI概念", ja: "AIコンセプト" },
      title: {
        en: "Mech Bioluminescent Forest",
        ru: "Биолюминесцентный лес с мехом",
        zh: "机甲生物发光森林",
        ja: "メカ発光森林"
      },
      role: {
        en: "AI Styleframe Exploration & CG Matte Painting",
        ru: "ИИ-стайлфреймы и CG Matte Painting",
        zh: "AI 风格帧探索与 CG 绘景",
        ja: "AIスタイルフレーム探索＆CGマットペインティング"
      },
      client: {
        en: "Studio Project",
        ru: "Студийный эксперимент",
        zh: "工作室项目",
        ja: "自主制作・実験"
      },
      tools: "ComfyUI, Photoshop, Concept Art",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-flying-through-neon-wires-and-dust-in-a-futuristic-tunnel-41712-large.mp4",
      images: [
        "assets/images/work_ai.png",
        "assets/images/work_ai_detail.png"
      ],
      desc: {
        en: "Hybrid concept art process fusing 3D blockout spaces and Generative AI detailing. By guiding ComfyUI workflows, we generated cinematic styleframes for a bioluminescent jungle forest, adding a sci-fi mech scout without manual high-poly modeling, keeping full lighting consistency.",
        ru: "Гибридный процесс создания концепт-арта, объединяющий 3D-блокинг сцены и детализацию генеративным ИИ. Управляя рабочими процессами ComfyUI, мы создали кинематографичные стайлфреймы биолюминесцентного леса, добавив научно-фантастического меха-разведчика без ручного высокополигонального моделирования, сохранив полное соответствие освещения.",
        zh: "融合 3D 场景初步搭建和生成式 AI 细节开发的混合概念艺术工作流。通过引导 ComfyUI 节点流程，我们为生物发光森林生成了电影级别的风格帧，在无需手动进行高精度模型建模的情况下，无缝集成了科幻机甲，并保持了完整的光影一致性。",
        ja: "3Dでの空間ブロックアウトと生成AIのディテール化を融合したハイブリッドなコンセプトアート構築プロセス。ComfyUIのワークフローを制御し、手作業でのハイポリゴンモデリングを行わずにSFメカ偵察機を生物発光森林のシーンに追加し、完全に一致した光影を保ちながら映画のようなスタイルフレームを生成しました。"
      }
    },
    'work-street': {
      category: { en: "VFX / Cleanup", ru: "VFX / Клинап", zh: "合成擦除", ja: "クリンアップ" },
      title: {
        en: "Urban Street Invisible VFX",
        ru: "Невидимый VFX городской улицы",
        zh: "城市街道无形特效",
        ja: "都市のストリートのインビジブルVFX"
      },
      role: {
        en: "Clean Plate Reconstruction & Hologram Tracking",
        ru: "Клинап, реконструкция пластины и трекинг голограммы",
        zh: "干净背景板重建与全息跟踪",
        ja: "クリーンプレート再構成＆ホログラム合成"
      },
      client: {
        en: "Client Work",
        ru: "Коммерческий проект",
        zh: "Коммерческий проект",
        ja: "クライアントワーク"
      },
      tools: "Nuke, Mocha Pro, Invisible VFX",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-time-lapse-of-a-busy-city-street-at-night-40292-large.mp4",
      images: [
        "assets/images/work_cleanup_after.png",
        "assets/images/work_cleanup_before.png",
        "assets/images/work_cleanup_detail.png"
      ],
      desc: {
        en: "Invisible visual effects production-grade cleanup shot. Removed overhead cable wires, background modern traffic objects, and visual clutter to reconstruct a clean plate. Integrated camera tracking data to composite a custom holographic neon sign on the brick wall facade.",
        ru: "Продакшн-клинап в категории «невидимых эффектов». Из кадра удалены подвесные провода, современные автомобили на заднем плане и визуальный мусор для полной реконструкции чистого листа. Данные трекинга камеры использованы для бесшовного композитинга голографической вывески на кирпичной стене здания.",
        zh: "专业级“无形特效”擦除清理镜头。移除了头顶缠绕的电线、背景中现代的交通工具及杂乱景物以重建干净背景板。结合了摄像机跟踪反求数据，在砖墙立面上无缝合成了自定义的全息霓虹招牌。",
        ja: "プロダクションクオリティの「インビジブルVFX」クリンアップカット。クリーンプレートを再構成するために、頭上の電線、背景の現代的な通行車、および視覚的な雑音を除去。カメラトラッキングデータを統合し、レンダリングしたカスタムホログラフィックネオン看板を煉瓦壁のファサードに合成しました。"
      }
    },
    'work-canvas': {
      category: { en: "Creative Tool", ru: "Инструмент", zh: "创意工具", ja: "ツール" },
      title: {
        en: "NomadCanvas Studio Project",
        ru: "Студийный проект NomadCanvas",
        zh: "NomadCanvas 工作室工具",
        ja: "NomadCanvas 自主制作"
      },
      role: {
        en: "Front-end Engineering & Canvas Engine",
        ru: "Фронтенд-разработка и движок рисования",
        zh: "前端工程与 Canvas 绘图引擎",
        ja: "フロントエンド開発＆キャンバスエンジン"
      },
      client: {
        en: "Studio Project",
        ru: "Студийный эксперимент",
        zh: "工作室项目",
        ja: "自主制作・実験"
      },
      tools: "Vanilla JS, HTML5 Canvas, Creative Tool",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-color-ink-dripping-in-water-underwater-closeup-41584-large.mp4",
      images: [
        "assets/images/work_canvas.png",
        "assets/images/work_canvas_detail.png"
      ],
      desc: {
        en: "Interactive graphic sketching tool built on top of vanilla HTML5 Canvas API. Designed for lightweight vector/raster drawing and concept layouts, featuring customizable brushes, infinite undo/redo stacks, layer blending modes, and rapid export options.",
        ru: "Интерактивный инструмент для графических набросков на базе чистого HTML5 Canvas API. Разработан для легковесного векторного и растрового рисования и создания концептуальных макетов. Включает настраиваемые кисти, бесконечную историю действий, режимы смешивания слоев и быстрый экспорт.",
        zh: "基于原生 HTML5 Canvas API 构建的交互式图形手绘草图工具。专为轻量级矢量/栅格绘制和概念布局而设计，支持自定义画笔、无限撤销/重做、图层混合模式以及快速导出功能。",
        ja: "ネイティブのHTML5 Canvas APIをベースに構築されたインタラクティブなグラフィックスケッチツール。軽量なベクター/ラスター描画やコンセプトレイアウト向けに設計されており、カスタムブラシ、無限のアンドゥ/リドゥ履歴、レイヤーのブレンドモード、迅速な書き出し機能を備えています。"
      }
    }
  };

  const populateModal = (projId, lang) => {
    const data = projectDetailsData[projId];
    if (!data) return;
    
    // Set dynamic text elements
    document.getElementById('modal-project-category').textContent = data.category[lang] || data.category['en'];
    document.getElementById('modal-project-title').textContent = data.title[lang] || data.title['en'];
    document.getElementById('modal-project-role').textContent = data.role[lang] || data.role['en'];
    document.getElementById('modal-project-client').textContent = data.client[lang] || data.client['en'];
    document.getElementById('modal-project-tools').textContent = data.tools;
    document.getElementById('modal-project-description').textContent = data.desc[lang] || data.desc['en'];
    
    // Show/hide before-after slider quick link action
    const sliderActionWrapper = document.getElementById('modal-slider-action-wrapper');
    if (projId === 'work-street') {
      sliderActionWrapper.style.display = 'block';
    } else {
      sliderActionWrapper.style.display = 'none';
    }

    // Media element containers
    const modalVideo = document.getElementById('modal-video');
    const modalImage = document.getElementById('modal-image');
    const thumbnailsContainer = document.getElementById('modal-thumbnails');
    
    thumbnailsContainer.innerHTML = '';
    const mediaItems = [];
    
    // 1. Loop video as primary focus media
    if (data.videoUrl) {
      mediaItems.push({
        type: 'video',
        url: data.videoUrl,
        thumb: data.images[0]
      });
    }
    
    // 2. Add sub-images for slider thumbnails
    data.images.forEach(imgUrl => {
      mediaItems.push({
        type: 'image',
        url: imgUrl,
        thumb: imgUrl
      });
    });
    
    // Dynamic media swap solver
    const showMedia = (item) => {
      if (item.type === 'video') {
        modalImage.style.display = 'none';
        modalVideo.style.display = 'block';
        modalVideo.src = item.url;
        modalVideo.play().catch(() => {});
      } else {
        modalVideo.pause();
        modalVideo.style.display = 'none';
        modalImage.style.display = 'block';
        modalImage.src = item.url;
      }
    };
    
    // Render thumbnails gallery
    mediaItems.forEach((item, index) => {
      const thumbBtn = document.createElement('button');
      thumbBtn.className = 'modal-thumb';
      if (index === 0) thumbBtn.classList.add('active');
      
      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = `Thumb ${index + 1}`;
      thumbBtn.appendChild(img);
      
      thumbBtn.addEventListener('click', () => {
        thumbnailsContainer.querySelectorAll('.modal-thumb').forEach(btn => btn.classList.remove('active'));
        thumbBtn.classList.add('active');
        showMedia(item);
      });
      
      thumbnailsContainer.appendChild(thumbBtn);
    });
    
    // Launch first asset default
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
      const modalVideo = document.getElementById('modal-video');
      if (modalVideo) {
        modalVideo.pause();
        modalVideo.src = '';
      }
      dialog.close();
      activeProjectId = null;
      document.body.style.overflow = '';
    };

    workItemCards.forEach(card => {
      const triggerBtn = card.querySelector('.btn-work-explore');
      
      const openModalHandler = (e) => {
        e.preventDefault();
        
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
      const modalVideo = document.getElementById('modal-video');
      if (modalVideo) {
        modalVideo.pause();
        modalVideo.src = '';
      }
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
