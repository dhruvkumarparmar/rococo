"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Reveal animation
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal, .bento-card, .price-row, .work-card, .promo-card, .loyalty-wrap, .quote-grid article")
    .forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 65}ms`;
      revealObserver.observe(el);
    });

  // Price filters
  const filters = document.querySelectorAll(".filter-btn");
  const items = document.querySelectorAll(".price-item");
  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      filters.forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      items.forEach(item => {
        item.style.display = (filter === "all" || item.dataset.category === filter) ? "grid" : "none";
      });
    });
  });

  // Navigation
  document.querySelectorAll("#nav a").forEach(link => {
    link.addEventListener("click", () => {
      const nav = document.getElementById("nav");
      if (nav && nav.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(nav).hide();
      }
    });
  });

  // Scroll progress + kinetic typography
  const progress = document.getElementById("scrollProgress");
  const kinetic = document.querySelector(".kinetic-section");
  const kineticWords = document.querySelectorAll(".kinetic-copy span");
  const liquidNail = document.querySelector(".liquid-nail");

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = `${ratio * 100}%`;

    const topBtn = document.getElementById("backToTop");
    if (topBtn) topBtn.classList.toggle("show", window.scrollY > 700);

    if (kinetic && !reducedMotion) {
      const rect = kinetic.getBoundingClientRect();
      const travel = kinetic.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -rect.top / Math.max(travel, 1)));

      kineticWords.forEach((word, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const x = direction * (1 - p) * (36 + index * 14);
        const rotate = direction * (1 - p) * 5;
        const scale = .74 + p * .26;
        word.style.transform = `translateX(${x}px) rotate(${rotate}deg) scale(${scale})`;
        word.style.opacity = .35 + p * .65;
      });

      if (liquidNail) {
        liquidNail.style.filter = `saturate(${.75 + p * .45})`;
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const topBtn = document.getElementById("backToTop");
  if (topBtn) topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Hero parallax
  const hero = document.querySelector(".hero");
  const parallaxLayers = document.querySelectorAll(".parallax-layer");
  if (hero && !reducedMotion && window.matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("pointermove", e => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      parallaxLayers.forEach(layer => {
        const depth = Number(layer.dataset.depth || 8);
        layer.style.translate = `${x * depth}px ${y * depth}px`;
      });
    });
    hero.addEventListener("pointerleave", () => {
      parallaxLayers.forEach(layer => layer.style.translate = "");
    });
  }

  // Magnetic CTAs
  if (!reducedMotion && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        const strength = el.classList.contains("magnetic-soft") ? .12 : .22;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  // Custom cursor
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (dot && ring && !reducedMotion && window.matchMedia("(pointer:fine)").matches) {
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    window.addEventListener("pointermove", e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = `${mx}px`;
      dot.style.top = `${my}px`;
    });
    const animateCursor = () => {
      rx += (mx - rx) * .16;
      ry += (my - ry) * .16;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    document.querySelectorAll("a,button,.work-card,.bento-card").forEach(el => {
      el.addEventListener("mouseenter", () => ring.classList.add("hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
    });
  }

  // Ambient floating particles / petals
  const canvas = document.getElementById("rococoCanvas");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];

    function resizeCanvas() {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(28, Math.max(12, Math.floor(innerWidth / 55)));
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: 2 + Math.random() * 5,
        vx: -.08 + Math.random() * .16,
        vy: -.12 - Math.random() * .22,
        a: .08 + Math.random() * .13,
        phase: Math.random() * Math.PI * 2,
        pink: i % 3 === 0
      }));
    }

    function drawParticles(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * .00045 + p.phase) * .06;
        if (p.y < -20) { p.y = innerHeight + 20; p.x = Math.random() * innerWidth; }
        if (p.x < -20) p.x = innerWidth + 20;
        if (p.x > innerWidth + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(t * .0007 + p.phase) * .8);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.pink ? "#f1c0b9" : "#597e4a";
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.7, p.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    requestAnimationFrame(drawParticles);
  }

  // Booking
  const dateInput = document.getElementById("date");
  if (dateInput) {
    const today = new Date();
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    dateInput.min = local;
  }

  const form = document.getElementById("bookingForm");
  const status = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = new FormData(form);
      const subject = encodeURIComponent(`Demande ROCOCO — ${data.get("service")}`);
      const body = encodeURIComponent(
`Bonjour ROCOCO,

Nom : ${data.get("name")}
Courriel : ${data.get("email")}
Service : ${data.get("service")}
Date souhaitée : ${data.get("date")}

Détails :
${data.get("message") || ""}

Merci !`
      );
      window.location.href = `mailto:onglesrococo@gmail.com?subject=${subject}&body=${body}`;
      if (status) status.textContent = "Votre demande est prête à être envoyée.";
    });
  }
});


// Signature logo reveal and subtle 3D response.
(() => {
  const revealArt = document.getElementById("logoRevealArt");
  if (revealArt) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) revealArt.classList.add("in-view");
      });
    }, { threshold: .35 });
    observer.observe(revealArt);
  }

  const logoStage = document.querySelector(".logo-stage");
  const logoArt = document.querySelector(".hero-logo-art");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (logoStage && logoArt && !reduce && window.matchMedia("(pointer:fine)").matches) {
    logoStage.addEventListener("pointermove", e => {
      const r = logoStage.getBoundingClientRect();
      const x = ((e.clientX-r.left)/r.width-.5);
      const y = ((e.clientY-r.top)/r.height-.5);
      logoArt.style.transform = `translate(${x*10}px, ${y*10}px) rotateY(${x*7}deg) rotateX(${-y*7}deg) scale(1.025)`;
    });
    logoStage.addEventListener("pointerleave", () => {
      logoArt.style.transform = "";
    });
  }
})();


// ROCOCO loyalty reward reveal.
(() => {
  const visual = document.getElementById("loyaltyGiftVisual");
  const reward = document.getElementById("rewardWrap");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (visual) {
    const loyaltyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visual.classList.add("in-view");
          loyaltyObserver.unobserve(visual);
        }
      });
    }, { threshold: .32 });

    loyaltyObserver.observe(visual);
  }

  if (visual && reward && !reduce && window.matchMedia("(pointer:fine)").matches) {
    visual.addEventListener("pointermove", e => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      reward.style.translate = `${x * 11}px ${y * 11}px`;
    });

    visual.addEventListener("pointerleave", () => {
      reward.style.translate = "";
    });
  }
})();





// ROCOCO compact review slider
(() => {
  const slider = document.getElementById("compactReviewSlider");
  const cards = slider ? [...slider.querySelectorAll(".compact-review-card")] : [];
  const prev = document.getElementById("reviewPrev");
  const next = document.getElementById("reviewNext");
  const dotsWrap = document.getElementById("reviewDots");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!slider || !cards.length || !prev || !next || !dotsWrap) return;

  let current = 0;
  let timer;

  const visibleCount = () =>
    window.innerWidth <= 767 ? 1 :
    window.innerWidth <= 991 ? 2 : 3;

  const maxIndex = () => Math.max(0, cards.length - visibleCount());

  function buildDots(){
    dotsWrap.innerHTML = "";
    for(let i=0;i<=maxIndex();i++){
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Afficher les avis ${i+1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    }
    updateDots();
  }

  function updateDots(){
    [...dotsWrap.children].forEach((dot,i) => {
      dot.classList.toggle("active", i === current);
    });
  }

  function goTo(index){
    current = Math.max(0, Math.min(index, maxIndex()));
    const gap = 16;
    const cardWidth = cards[0].getBoundingClientRect().width;
    slider.scrollTo({
      left: current * (cardWidth + gap),
      behavior: reduce ? "auto" : "smooth"
    });
    updateDots();
    restart();
  }

  function restart(){
    clearInterval(timer);
    if (!reduce) {
      timer = setInterval(() => {
        goTo(current >= maxIndex() ? 0 : current + 1);
      }, 5000);
    }
  }

  prev.addEventListener("click", () => goTo(current <= 0 ? maxIndex() : current - 1));
  next.addEventListener("click", () => goTo(current >= maxIndex() ? 0 : current + 1));

  window.addEventListener("resize", () => {
    current = Math.min(current, maxIndex());
    buildDots();
    goTo(current);
  });

  buildDots();
  restart();
})();


// Sticky ROCOCO menu
(() => {
  const nav = document.querySelector(".rococo-nav");
  if (!nav) return;
  const update = () => nav.classList.toggle("nav-scrolled", window.scrollY > 20);
  window.addEventListener("scroll", update, {passive:true});
  update();
})();


// Premium hand orbit pointer depth
(() => {
  const orbit = document.querySelector(".nail-orbit");
  const hand = document.querySelector(".hand-orbit-art");
  const center = document.querySelector(".orbit-center-premium");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!orbit || !hand || reduce || !window.matchMedia("(pointer:fine)").matches) return;

  orbit.addEventListener("pointermove", e => {
    const r = orbit.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width-.5;
    const y = (e.clientY-r.top)/r.height-.5;

    hand.style.translate = `${x*8}px ${y*8}px`;
    hand.style.rotate = `${x*1.5}deg`;

    if(center){
      center.style.translate = `${-x*4}px ${-y*4}px`;
    }
  });

  orbit.addEventListener("pointerleave", () => {
    hand.style.translate = "";
    hand.style.rotate = "";
    if(center) center.style.translate = "";
  });
})();


// Refined micro-parallax for the elegant hand
(() => {
  const orbit = document.querySelector(".nail-orbit");
  const hand = document.querySelector(".hand-orbit-art");
  if (!orbit || !hand || !window.matchMedia("(pointer:fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  orbit.addEventListener("pointermove", e => {
    const r = orbit.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    hand.style.translate = `${x * 3}px ${y * 3}px`;
  });
  orbit.addEventListener("pointerleave", () => hand.style.translate = "");
})();


// Final polish: active navigation state / lightweight scrollspy
(() => {
  const links = [...document.querySelectorAll('.rococo-nav .nav-link[href^="#"]')];
  if (!links.length) return;

  const sections = links
    .map(link => {
      const id = link.getAttribute("href");
      const section = document.querySelector(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    links.forEach(link => {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    });

    const match = sections.find(item => item.section === visible.target);
    if (match) {
      match.link.classList.add("active");
      match.link.setAttribute("aria-current", "page");
    }
  }, {
    rootMargin:"-24% 0px -62% 0px",
    threshold:[0,.15,.35,.6]
  });

  sections.forEach(item => observer.observe(item.section));
})();


// Production initialization marker
(() => {
  document.body.classList.remove("js-loading");
  document.body.classList.add("js-ready");
})();

// Pause decorative canvas/animations when the tab is hidden to reduce CPU usage.
document.addEventListener("visibilitychange", () => {
  document.documentElement.classList.toggle("page-hidden", document.hidden);
});
