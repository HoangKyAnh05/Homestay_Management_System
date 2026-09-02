/* ==========================================================================
   KOMOREBI SANCTUARY • APPLICATION CONTROLLER (React Integrated)
   Integrates ThreeUI 3D Engine, Web Audio, GSAP & Interactions
   ========================================================================== */

import { KomorebiScene } from './LandingThreeScene.js';
import { ZenAudioEngine } from './LandingAudioEngine.js';

export const VILLAS_DATA = {
  'glass-pine': {
    id: 'glass-pine',
    name: 'The Glass Pine Pavilion',
    badge: 'Most Popular',
    price: 3850000,
    area: '85m²',
    guests: '2 - 3 Khách',
    view: 'Thung Lũng Mây & Rừng Thông Cổ',
    images: [
      '/landing/images/homestay/1mc2t12000szinjjtbc1b-r-800-800-r5.webp',
      '/landing/images/homestay/721039566.webp',
      '/landing/images/homestay/ava-mau-nha-homestay-dep-800x800.jpg'
    ],
    description: 'Căn nhà kính lọt thỏm giữa cụm thông trăm tuổi, bồn sục onsen gỗ pơ-mu ngoài ban công kính nhìn thẳng xuống thung lũng bồng bềnh mây. Không gian được thiết kế theo phong cách tối giản Wabi-Sabi tôn vinh vẻ đẹp nguyên bản của đá và gỗ tự nhiên.',
    features: [
      'Bồn tắm khoáng nóng Onsen Pơ-mu ngoài trời ngắm mây',
      'Vách kính Low-E tràn viền 3 hướng chống chói và cách âm tuyệt đối',
      'Giường ngủ King-size nệm cao su non bọc vải lanh tự nhiên',
      'Hệ thống sưởi sàn đá bazan ấm áp trong mùa đông sương giá',
      'Lò sưởi củi thông thật và quầy bar trà Shan Tuyết thủ công',
      'Starlink High-Speed WiFi & Loa Bluetooth Bang & Olufsen'
    ]
  },
  'cloud-crest': {
    id: 'cloud-crest',
    name: 'Cloud Crest Loft',
    badge: 'Best Sunrise',
    price: 4200000,
    area: '110m²',
    guests: '2 - 4 Khách',
    view: 'Mỏm Đá Cao Nhất • Đón Bình Minh',
    images: [
      '/landing/images/homestay/homestay-quan-1-2.png',
      '/landing/images/homestay/homestay-quan-1-8.png'
    ],
    description: 'Tọa lạc tại điểm cao nhất của khuôn viên, căn gác lửng kính sở hữu sân hiên ngắm bình minh triệu đô và trần kính giếng trời ngắm dải ngân hà lấp lánh mỗi đêm.',
    features: [
      'Sân hiên gỗ Teak 40m² vươn ra khoảng không săn mây buổi sớm',
      'Kính thiên văn khúc xạ chuyên nghiệp Celestron ngắm sao',
      'Phòng xông hơi khô Sauna gỗ tuyết tùng Phần Lan riêng biệt',
      'Bồn tắm đá nguyên khối đục thủ công hướng thung lũng',
      'Bữa sáng Floating Breakfast phục vụ tận hồ bơi nước ấm'
    ]
  },
  'mizu-stream': {
    id: 'mizu-stream',
    name: 'Mizu Stream Retreat',
    badge: 'Riverside Calm',
    price: 4650000,
    area: '135m²',
    guests: '4 - 6 Khách (Gia đình)',
    view: 'Bên Bờ Suối Mơ Róc Rách',
    images: [
      '/landing/images/homestay/homestay-vinh-hy-2.png',
      '/landing/images/homestay/images-1.jpg'
    ],
    description: 'Dinh thự gỗ 2 tầng nép mình dưới rặng tre và bên cạnh dòng suối Mơ trong vắt. Tiếng nước chảy róc rách suốt ngày đêm mang lại cảm giác an yên tuyệt đối cho cả gia đình.',
    features: [
      '2 phòng ngủ Master độc lập có phòng tắm kính riêng',
      'Bếp đảo sang trọng trang bị đầy đủ dụng cụ nấu ăn cao cấp',
      'Trà đình nổi giữa hồ cá Koi và vườn sỏi thiền Nhật Bản',
      'Hồ ngâm khoáng nóng sục khí Jacuzzi duy trì 38°C quanh năm',
      'Phòng sinh hoạt chung với máy chiếu phim 4K 120-inch'
    ]
  },
  'aether-dome': {
    id: 'aether-dome',
    name: 'Aether Star Observatory',
    badge: 'Signature Dome',
    price: 5200000,
    area: '150m²',
    guests: '2 - 4 Khách',
    view: 'Vòm Kính Toàn Cảnh 360°',
    images: [
      '/landing/images/homestay/images-2.jpg',
      '/landing/images/homestay/images-3.jpg'
    ],
    description: 'Kiệt tác mái vòm kính geodesic chịu lực tọa lạc trên đỉnh đồi lộng gió. Nơi ranh giới giữa nội thất sang trọng và vũ trụ huyền ảo được xóa nhòa hoàn toàn.',
    features: [
      'Hồ bơi vô cực nước ấm sưởi nhiệt tràn viền nhìn ra mây ngàn',
      'Quản gia riêng (Butler) phục vụ trà đạo và ẩm thực 24/7',
      'Hầm rượu vang mini với tuyển chọn vang mộc biodynamic',
      'Nội thất bespoke từ da bò Ý và gỗ óc chó Bắc Mỹ nguyên tấm',
      'Đặc quyền đưa đón xe Limousine sang trọng khứ hồi miễn phí'
    ]
  }
};

export class LandingApp {
  constructor() {
    this.scene = null;
    this.audio = null;
    this.lenis = null;
    this.isDestroyed = false;
    this.animationFrameIds = [];
    this.intervals = [];
    this.listeners = [];

    this.init();
  }

  init() {
    // 1. Init 3D Three.js Scene
    this.scene = new KomorebiScene('webgl-canvas');

    // 2. Init Procedural Sound Engine
    this.audio = new ZenAudioEngine();

    // 3. Init Lucide Icons
    if (window.lucide) {
      try {
        window.lucide.createIcons();
      } catch (e) {}
    }

    // 4. Advanced Motion Systems
    this.initLenis();
    this.initPreloader();
    this.initCustomCursor();
    this.initMagneticAttraction();
    this.initMarquee();
    this.initImageTrail();
    this.initMicroAudio();

    // 5. Bind UI Listeners
    this.bindHeaderScroll();
    this.bindMoodSelector();
    this.bindAudioControls();
    this.bindVillaFilters();
    this.bind3DTilt();
    this.bindModalsAndDrawers();
    this.bindTourModal();
    this.bindScrollAnimations();
    this.initLocationMap();
  }

  addListener(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    this.listeners.push({ target, type, handler, options });
  }

  /* GSAP ScrollTrigger Orchestration */
  bindScrollAnimations() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const progressBar = document.getElementById('scroll-progress');

    // 1. Global Scroll Progress Bar & Three.js Camera Linking
    ScrollTrigger.create({
      id: 'landingScrollTrigger',
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const progress = self.progress;
        const velocity = self.getVelocity();

        if (progressBar) {
          progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
        }

        if (this.scene) {
          this.scene.setScrollProgress(progress, velocity);
        }
      }
    });

    // 2. Hero Section Subtle Parallax on Scroll (without fading out opacity)
    gsap.to('.hero-content', {
      y: 80,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });

    gsap.to('#booking-dock', {
      y: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'center top',
        end: 'bottom top',
        scrub: 1
      }
    });

    // Helper for fail-safe ScrollTrigger entrance animations
    const animateEntrance = (selector, triggerSelector, yOffset = 35, staggerTime = 0.1) => {
      const elements = document.querySelectorAll(selector);
      const triggerEl = document.querySelector(triggerSelector || selector);
      if (!elements.length || !triggerEl) return;

      gsap.fromTo(elements,
        { y: yOffset, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: staggerTime,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: triggerEl,
            start: 'top 92%',
            toggleActions: 'play none none none',
            once: true,
            onRefresh: (self) => {
              // If already scrolled past the trigger (e.g. hash link #location), show immediately
              if (self.progress > 0 || self.scroll() > self.start) {
                gsap.set(elements, { opacity: 1, y: 0 });
              }
            }
          }
        }
      );
    };

    // 3. Section Badges and Titles
    animateEntrance('.section-badge:not(#panorama-section .section-badge)', '.section-badge:not(#panorama-section .section-badge)', 20, 0);
    animateEntrance('.section-title:not(#panorama-section .section-title)', '.section-title:not(#panorama-section .section-title)', 25, 0);

    // 4. Philosophy Cards
    animateEntrance('.philo-card', '.philosophy-grid', 45, 0.12);

    // 5. Villas Stacking Cards
    const stackCards = gsap.utils.toArray('.villa-card.stack-card');
    stackCards.forEach((card, i) => {
      if (i < stackCards.length - 1) {
        const nextCard = stackCards[i + 1];
        gsap.to(card, {
          scale: 0.94 - (i * 0.02),
          opacity: 0.65,
          filter: 'brightness(0.6) blur(0.5px)',
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.6,
          }
        });
      }
    });

    // Parallax zoom within villa card image wrapper
    document.querySelectorAll('.villa-card').forEach((card) => {
      const img = card.querySelector('.villa-img');
      if (img) {
        gsap.fromTo(img, 
          { yPercent: -5, scale: 1.02 },
          {
            yPercent: 5,
            scale: 1.07,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2
            }
          }
        );
      }
    });

    // 6. Sensory Sound Box
    animateEntrance('.sensory-box', '.sensory-section', 35, 0);

    // 7. Experiences Grid Cards
    animateEntrance('.exp-card', '.exp-grid', 45, 0.12);

    // 8. Reviews Cards
    animateEntrance('.review-card', '.reviews-slider', 35, 0.1);

    // 9. Premium Asymmetric Scenery Gallery Grid
    animateEntrance('.scenery-card', '.scenery-grid', 45, 0.12);

    // 10. Location & Map Section
    animateEntrance('.location-content', '.location-section', 35, 0);
    animateEntrance('.location-map-card', '.location-section', 35, 0);

    // 11. Pre-footer CTA Banner
    animateEntrance('.cta-banner-card', '.cta-banner-section', 35, 0);

    // Safety net: IntersectionObserver to guarantee all cards become visible even if ScrollTrigger is out of sync
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'none';
          }
        });
      }, { rootMargin: '100px' });

      document.querySelectorAll('.philo-card, .scenery-card, .exp-card, .review-card, .location-content, .location-map-card, .sensory-box, .cta-banner-card').forEach((el) => {
        observer.observe(el);
      });
    }

    // Refresh ScrollTrigger after layouts render
    setTimeout(() => {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, 200);
    setTimeout(() => {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, 800);
  }

  /* 1. Lenis Smooth Inertia Scroll */
  initLenis() {
    const Lenis = window.Lenis;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (typeof Lenis === 'undefined') return;

    try {
      this.lenis = new Lenis({
        duration: 0.75,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.1,
      });

      if (ScrollTrigger) {
        this.lenis.on('scroll', ScrollTrigger.update);
      }

      if (gsap) {
        this.lenisRaf = (time) => {
          if (this.lenis) this.lenis.raf(time * 1000);
        };
        gsap.ticker.add(this.lenisRaf);
        gsap.ticker.lagSmoothing(500, 33);
      }
    } catch (e) {}
  }

  /* 2. Cinematic Countdown Preloader */
  initPreloader() {
    const preloader = document.getElementById('preloader');
    const counterEl = document.getElementById('preloader-counter');
    const statusEl = document.getElementById('preloader-status');
    const fillEl = document.getElementById('preloader-bar-fill');
    const gsap = window.gsap;
    if (!preloader || !counterEl || !fillEl) return;

    let progress = { value: 0 };
    if (!gsap) {
      preloader.classList.add('loaded');
      return;
    }

    gsap.to(progress, {
      value: 100,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        const val = Math.floor(progress.value);
        counterEl.textContent = `${val < 10 ? '0' + val : val}%`;
        fillEl.style.width = `${val}%`;

        if (statusEl) {
          if (val > 40 && val < 75) {
            statusEl.textContent = 'ĐANG ĐỊNH HÌNH THUNG LŨNG MÂY...';
          } else if (val >= 75) {
            statusEl.textContent = 'HOÀN TẤT TRẢI NGHIỆM 3D';
          }
        }
      },
      onComplete: () => {
        preloader.classList.add('loaded');
        this.animateHeroEntrance();
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }
    });
  }

  /* Kinetic Hero Entrance & Text Scramble */
  animateHeroEntrance() {
    const gsap = window.gsap;
    if (!gsap) return;

    const badgeText = document.querySelector('.badge-text');
    if (badgeText) {
      this.scrambleText(badgeText, "22°20'N 103°50'E • ĐỘ CAO 1,650M TRÊN MỰC NƯỚC BIỂN", 1.0);
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.title-sub', {
      y: 25,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      delay: 0.1
    })
    .fromTo('.title-main', {
      y: 35,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.9
    }, '-=0.6')
    .fromTo('.hero-description', {
      y: 20,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8
    }, '-=0.7')
    .fromTo('.hero-actions .liquid-btn, .hero-actions .ghost-btn', {
      y: 15,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 0.7
    }, '-=0.6')
    .fromTo('.hero-stats .stat-item', {
      y: 15,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      stagger: 0.08,
      duration: 0.7
    }, '-=0.6')
    .fromTo('#booking-dock', {
      y: 25,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out(1.2)'
    }, '-=0.5');

    tl.eventCallback('onComplete', () => {
      gsap.set('.hero-content, .title-sub, .title-main, .hero-description, .hero-actions, .hero-stats, #booking-dock', {
        opacity: 1
      });
    });
  }

  scrambleText(element, finalString, duration = 1.0) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789°•/\'';
    const length = finalString.length;
    let iteration = 0;
    const interval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(interval);
        return;
      }
      element.innerText = finalString
        .split('')
        .map((char, index) => {
          if (index < iteration) {
            return finalString[index];
          }
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iteration >= length) {
        clearInterval(interval);
        element.innerText = finalString;
      }
      iteration += 2.0;
    }, 25);
    this.intervals.push(interval);
  }

  /* 3. Custom Interactive Magnetic Cursor (GPU Translate3d) */
  initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    const dot = document.getElementById('cursor-dot');
    const cursorText = document.getElementById('cursor-text');
    if (!cursor || !dot) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    };
    this.addListener(window, 'mousemove', onMouseMove, { passive: true });

    const renderCursor = () => {
      if (this.isDestroyed) return;
      cursorX += (mouseX - cursorX) * 0.22;
      cursorY += (mouseY - cursorY) * 0.22;

      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;

      const id = requestAnimationFrame(renderCursor);
      this.animationFrameIds.push(id);
    };
    const id = requestAnimationFrame(renderCursor);
    this.animationFrameIds.push(id);

    const onMouseOver = (e) => {
      const target = e.target.closest('[data-cursor]');
      const isBtn = e.target.closest('button, .liquid-btn, .ghost-btn, a, input, select');

      if (target) {
        cursor.classList.add('active-hover');
        cursorText.textContent = target.dataset.cursor || 'XEM';
      } else if (isBtn) {
        cursor.classList.add('button-hover');
      }
    };

    const onMouseOut = (e) => {
      const target = e.target.closest('[data-cursor]');
      const isBtn = e.target.closest('button, .liquid-btn, .ghost-btn, a, input, select');

      if (target) {
        cursor.classList.remove('active-hover');
        cursorText.textContent = '';
      }
      if (isBtn) {
        cursor.classList.remove('button-hover');
      }
    };

    const onMouseLeave = () => {
      cursor.style.opacity = '0';
      dot.style.opacity = '0';
    };

    const onMouseEnter = () => {
      cursor.style.opacity = '1';
      dot.style.opacity = '1';
    };

    this.addListener(document, 'mouseleave', onMouseLeave);
    this.addListener(document, 'mouseenter', onMouseEnter);
    this.addListener(document, 'mouseover', onMouseOver);
    this.addListener(document, 'mouseout', onMouseOut);
  }

  /* 4. Magnetic Attraction on Buttons */
  initMagneticAttraction() {
    const gsap = window.gsap;
    if (!gsap) return;
    const magneticBtns = document.querySelectorAll('.liquid-btn, .ghost-btn, .mood-btn, .sound-toggle-btn');
    magneticBtns.forEach((btn) => {
      const onMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.2,
          ease: 'power2.out'
        });
      };

      const onLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'power2.out'
        });
      };

      this.addListener(btn, 'mousemove', onMove, { passive: true });
      this.addListener(btn, 'mouseleave', onLeave);
    });
  }

  /* 5. Infinite Kinetic Marquee */
  initMarquee() {
    // Marquee is now completely driven by GPU CSS keyframe animation for 60 FPS
  }

  /* 7. Hover Image Trail */
  initImageTrail() {
    const trailContainer = document.getElementById('image-trail-container');
    const targetAreas = document.querySelectorAll('.philosophy-section, .experiences-section');
    const gsap = window.gsap;
    if (!trailContainer || targetAreas.length === 0 || !gsap) return;

    const trailImages = [
      '/landing/images/homestay/mau-nha-homestay-dep-22.jpg',
      '/landing/images/an-uong-thu-gian/du-lich-am-thuc-1.jpg',
      '/landing/images/vui-choi-giai-tri/dich-vu-vui-choi-giai-tri.jpg',
      '/landing/images/van-hoa-trai-nghiem/du-lich-trai-nghiem-6.jpg',
      '/landing/images/thien-nhien-kham-pha/images.jpg'
    ];

    let lastX = 0;
    let lastY = 0;
    let imgIdx = 0;

    targetAreas.forEach((area) => {
      const onMove = (e) => {
        const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if (dist > 95) {
          lastX = e.clientX;
          lastY = e.clientY;

          const imgEl = document.createElement('div');
          imgEl.className = 'trail-img';
          imgEl.style.left = `${e.clientX}px`;
          imgEl.style.top = `${e.clientY}px`;
          imgEl.innerHTML = `<img src="${trailImages[imgIdx % trailImages.length]}" alt="Komorebi Trail" />`;
          trailContainer.appendChild(imgEl);
          imgIdx++;

          gsap.fromTo(imgEl, 
            { scale: 0.4, opacity: 0.85, rotation: (Math.random() - 0.5) * 20 },
            {
              scale: 1.0,
              opacity: 0,
              y: -30,
              duration: 1.0,
              ease: 'power2.out',
              onComplete: () => imgEl.remove()
            }
          );
        }
      };
      this.addListener(area, 'mousemove', onMove);
    });
  }

  /* 8. Micro-audio Mechanical Feedback */
  initMicroAudio() {
    const onClick = (e) => {
      const btn = e.target.closest('button, .liquid-btn, .ghost-btn, .tab-btn, .track-btn, .mood-btn, select');
      if (btn && this.audio) {
        this.audio.playClick(650);
      }
    };
    this.addListener(document, 'click', onClick);

    document.querySelectorAll('.tab-btn, .mood-btn, .track-btn').forEach((el) => {
      const onEnter = () => {
        if (this.audio) this.audio.playClick(1100);
      };
      this.addListener(el, 'mouseenter', onEnter);
    });
  }

  /* Header scroll */
  bindHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    this.addListener(window, 'scroll', onScroll);
  }

  /* Mood / Time Switcher */
  bindMoodSelector() {
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach((btn) => {
      const onClick = () => {
        moodBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const mood = btn.dataset.mood;
        document.documentElement.dataset.theme = mood;
        if (this.scene) {
          this.scene.setMood(mood);
        }

        const weatherEl = document.getElementById('live-weather');
        if (weatherEl) {
          if (mood === 'night') {
            weatherEl.innerHTML = '<i data-lucide="moon"></i><span>15°C • Đêm Trời Trong & Trăng Sáng</span>';
          } else if (mood === 'sunset') {
            weatherEl.innerHTML = '<i data-lucide="sunset"></i><span>19°C • Hoàng Hôn Nắng Vàng Rực Rỡ</span>';
          } else if (mood === 'dawn') {
            weatherEl.innerHTML = '<i data-lucide="cloud-fog"></i><span>14°C • Sương Mù & Biển Mây Buổi Sớm</span>';
          }
          if (window.lucide) window.lucide.createIcons();
        }
      };
      this.addListener(btn, 'click', onClick);
    });
  }

  /* Ambient Sound Controls */
  bindAudioControls() {
    const soundToggle = document.getElementById('sound-toggle');
    const zenCircle = document.getElementById('zen-circle');
    const zenIcon = document.getElementById('zen-play-icon');
    const volumeSlider = document.getElementById('sensory-volume');
    const trackBtns = document.querySelectorAll('.track-btn');

    const updateAudioState = (playing) => {
      if (playing) {
        soundToggle?.classList.add('playing');
        if (zenIcon) zenIcon.setAttribute('data-lucide', 'pause');
      } else {
        soundToggle?.classList.remove('playing');
        if (zenIcon) zenIcon.setAttribute('data-lucide', 'play');
      }
      if (window.lucide) window.lucide.createIcons();
    };

    if (soundToggle) {
      this.addListener(soundToggle, 'click', () => {
        const playing = this.audio.toggle();
        updateAudioState(playing);
      });
    }

    if (zenCircle) {
      this.addListener(zenCircle, 'click', () => {
        const playing = this.audio.toggle();
        updateAudioState(playing);
      });
    }

    if (volumeSlider) {
      this.addListener(volumeSlider, 'input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.audio.setVolume(val);
      });
    }

    trackBtns.forEach((btn) => {
      this.addListener(btn, 'click', () => {
        trackBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const soundType = btn.dataset.sound;
        this.audio.play(soundType);
        updateAudioState(true);
      });
    });
  }

  /* 3D Tilt Effect on Cards */
  bind3DTilt() {
    const tiltCards = document.querySelectorAll('[data-tilt]');
    tiltCards.forEach((card) => {
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      };

      const onLeave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      };

      this.addListener(card, 'mousemove', onMove);
      this.addListener(card, 'mouseleave', onLeave);
    });
  }

  /* Filter Villa Tabs */
  bindVillaFilters() {
    const tabs = document.querySelectorAll('.tab-btn');
    const cards = document.querySelectorAll('.villa-card.stack-card');

    tabs.forEach((tab) => {
      this.addListener(tab, 'click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        let visibleIdx = 1;
        cards.forEach((card) => {
          if (filter === 'all' || card.dataset.category.includes(filter)) {
            card.style.display = 'flex';
            card.style.setProperty('--card-index', visibleIdx);
            visibleIdx++;
          } else {
            card.style.display = 'none';
          }
        });
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
      });
    });
  }

  /* Modals & Drawer */
  bindModalsAndDrawers() {
    const headerBtn = document.getElementById('header-book-btn');
    const heroBtn = document.getElementById('hero-explore-btn');
    const dockBtn = document.getElementById('dock-submit-btn');

    if (headerBtn) {
      this.addListener(headerBtn, 'click', () => {
        if (window.goToBookingPage) {
          window.goToBookingPage();
        } else {
          window.location.assign('/rooms');
        }
      });
    }
    if (heroBtn) {
      this.addListener(heroBtn, 'click', () => {
        document.getElementById('villas')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (dockBtn) {
      this.addListener(dockBtn, 'click', () => {
        if (window.goToBookingPage) {
          window.goToBookingPage();
        } else {
          window.location.assign('/rooms');
        }
      });
    }

    const drawerClose = document.getElementById('drawer-close-btn');
    const drawerOverlay = document.getElementById('booking-drawer-overlay');
    if (drawerClose && drawerOverlay) {
      this.addListener(drawerClose, 'click', () => drawerOverlay.classList.remove('active'));
      this.addListener(drawerOverlay, 'click', (e) => {
        if (e.target === drawerOverlay) drawerOverlay.classList.remove('active');
      });
    }

    const modalClose = document.getElementById('modal-close-btn');
    const modalOverlay = document.getElementById('villa-modal-overlay');
    if (modalClose && modalOverlay) {
      this.addListener(modalClose, 'click', () => modalOverlay.classList.remove('active'));
      this.addListener(modalOverlay, 'click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
      });
    }
  }

  /* 3D Virtual Tour Modal */
  bindTourModal() {
    const tourBtn = document.getElementById('virtual-tour-btn');
    const tourOverlay = document.getElementById('tour-modal-overlay');
    const tourClose = document.getElementById('tour-modal-close-btn');
    const camToggle = document.getElementById('hud-camera-toggle');

    if (tourBtn && tourOverlay) {
      this.addListener(tourBtn, 'click', () => tourOverlay.classList.add('active'));
      if (tourClose) this.addListener(tourClose, 'click', () => tourOverlay.classList.remove('active'));
      this.addListener(tourOverlay, 'click', (e) => {
        if (e.target === tourOverlay) tourOverlay.classList.remove('active');
      });
    }

    if (camToggle) {
      this.addListener(camToggle, 'click', () => {
        if (this.scene && this.scene.camera) {
          this.scene.camera.position.z = this.scene.camera.position.z === 8 ? 5.5 : 8;
          this.showToast('Đã chuyển đổi tiêu cự camera 3D');
        }
      });
    }
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    if (toast && msgEl) {
      msgEl.innerHTML = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
    }
  }

  initLocationMap() {
    const mapCard = document.querySelector('.location-map-card');
    const shield = document.getElementById('map-shield');
    if (!mapCard || !shield) return;

    this.addListener(shield, 'click', () => {
      shield.classList.add('unlocked');
    });

    this.addListener(mapCard, 'mouseleave', () => {
      shield.classList.remove('unlocked');
    });
  }

  destroy() {
    this.isDestroyed = true;

    // 1. Remove all event listeners
    this.listeners.forEach(({ target, type, handler, options }) => {
      try {
        target.removeEventListener(type, handler, options);
      } catch (e) {}
    });
    this.listeners = [];

    // 2. Clear intervals & requestAnimationFrames
    this.intervals.forEach((id) => clearInterval(id));
    this.intervals = [];
    this.animationFrameIds.forEach((id) => cancelAnimationFrame(id));
    this.animationFrameIds = [];

    // 3. Destroy 3D scene & audio
    if (this.scene) {
      this.scene.destroy();
      this.scene = null;
    }
    if (this.audio) {
      this.audio.destroy();
      this.audio = null;
    }

    // 4. Kill GSAP ScrollTriggers & Lenis
    if (window.ScrollTrigger) {
      try {
        const triggers = window.ScrollTrigger.getAll();
        triggers.forEach((t) => t.kill());
      } catch (e) {}
    }
    if (window.gsap && this.lenisRaf) {
      try {
        window.gsap.ticker.remove(this.lenisRaf);
      } catch (e) {}
    }
    if (this.lenis) {
      try {
        this.lenis.destroy();
      } catch (e) {}
      this.lenis = null;
    }

    // 5. Clean custom cursor
    const cursor = document.getElementById('custom-cursor');
    const dot = document.getElementById('cursor-dot');
    if (cursor) cursor.remove();
    if (dot) dot.remove();
  }
}
