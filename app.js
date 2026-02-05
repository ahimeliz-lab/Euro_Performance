const IMAGE_MANIFEST = [];

const CANDIDATE_FILENAMES = [
  "hero.jpg",
  "hero.jpeg",
  "hero.png",
  "shop.jpg",
  "shop-front.jpg",
  "shopfront.jpg",
  "garage.jpg",
  "service-bay.jpg",
  "front.jpg",
  "exterior.jpg",
  "interior.jpg",
  "workshop.jpg",
  "car.jpg",
  "car-1.jpg",
  "car1.jpg",
  "vehicle.jpg",
  "auto.jpg",
  "euro.jpg",
  "showroom.jpg",
  "engine.jpg",
  "engine-1.jpg",
  "engine1.jpg",
  "engine2.jpg",
  "audi.jpg",
  "bmw.jpg",
  "mercedes.jpg",
  "vw.jpg",
  "porsche.jpg",
  "maserati.jpg",
  "q5.jpg",
  "golf r.jpg",
  "golf rr.jpg",
  "mk6 gti.jpg",
  "range rover.jpg",
  "Audi.jpg",
  "BMW.jpg",
  "Engine.jpg",
  "Engine1.jpg",
  "Engine2.jpg",
  "Golf R.jpg",
  "Golf RR.jpg",
  "Maserati.jpg",
  "MK6 GTI.jpg",
  "Porsche.jpg",
  "Q5.jpg",
  "Range rover.jpg"
];

const BASE_PATHS = [
  "assets/",
  "assets/gallery/",
  "assets/images/",
  "assets/img/",
  "galery/",
  "galery/logo/",
  ""
];

const MAX_GALLERY_ITEMS = 12;
const TRANSITION_DURATION = 900;
const TRANSITION_SCROLL_DELAY = 0.48;
const SCROLL_PADDING = 16;

const state = {
  images: []
};

const navState = {
  isTransitioning: false,
  pendingTarget: null,
  activeId: null,
  navLinks: [],
  sectionLinks: [],
  sections: [],
  observer: null,
  resizeHandler: null,
  prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  setupNavigation();
  setupScrollSpy();
  setupScrollReveal();
  setupCounters();
  setupForm();
  setupServicesMenu();
  setupLightbox();
  initImages();
  handleInitialHash();
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navState.navLinks = Array.from(navLinks);

  navState.navLinks.forEach((link) => {
    if (shouldSkipNavigation(link)) return;
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      navigateTo(hash, { push: true, animate: true, focus: true });
    });
  });

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduceQuery.addEventListener("change", (event) => {
    navState.prefersReducedMotion = event.matches;
  });

  window.addEventListener("popstate", () => {
    const hash = window.location.hash;
    if (hash) {
      navigateTo(hash, { push: false, animate: !navState.prefersReducedMotion, focus: true });
      return;
    }
    scrollToTop({ animate: !navState.prefersReducedMotion });
  });

  window.addEventListener("hashchange", () => {
    if (navState.isTransitioning) return;
    const hash = window.location.hash;
    if (!hash) return;
    navigateTo(hash, { push: false, animate: false, focus: true });
  });
}

function shouldSkipNavigation(link) {
  if (!link) return true;
  if (link.classList.contains("skip-link")) return true;
  if (link.dataset.noTransition === "true") return true;
  return false;
}

function handleInitialHash() {
  const hash = window.location.hash;
  if (!hash) return;
  const target = document.querySelector(hash);
  if (!target) return;
  requestAnimationFrame(() => {
    scrollToSection(target, { behavior: "auto" });
    updateActiveLink(hash);
  });
}

function navigateTo(hash, options = {}) {
  const id = normalizeHash(hash);
  if (!id) return;
  const target = document.querySelector(id);
  if (!target) return;

  if (navState.isTransitioning) {
    navState.pendingTarget = { id, options };
    return;
  }

  if (options.push) {
    history.pushState(null, "", id);
  }

  updateActiveLink(id);

  const shouldAnimate = options.animate && !navState.prefersReducedMotion;
  if (shouldAnimate) {
    playTransition(() => {
      scrollToSection(target, { behavior: "auto" });
    }, () => {
      finalizeNavigation(target, options.focus);
    });
    return;
  }

  const behavior = navState.prefersReducedMotion ? "auto" : "smooth";
  scrollToSection(target, { behavior });
  finalizeNavigation(target, options.focus);
}

function playTransition(onMid, onComplete) {
  const overlay = document.getElementById("pageTransition");
  if (!overlay) {
    onMid();
    onComplete();
    return;
  }

  navState.isTransitioning = true;
  document.body.classList.add("is-transitioning");

  overlay.classList.remove("is-active");
  void overlay.offsetWidth;
  overlay.classList.add("is-active");

  const midDelay = Math.round(TRANSITION_DURATION * TRANSITION_SCROLL_DELAY);

  window.setTimeout(() => {
    onMid();
  }, midDelay);

  window.setTimeout(() => {
    overlay.classList.remove("is-active");
    document.body.classList.remove("is-transitioning");
    navState.isTransitioning = false;
    onComplete();

    if (navState.pendingTarget) {
      const pending = navState.pendingTarget;
      navState.pendingTarget = null;
      navigateTo(pending.id, pending.options);
    }
  }, TRANSITION_DURATION);
}

function finalizeNavigation(target, shouldFocus) {
  if (shouldFocus) {
    focusSectionHeading(target);
  }
  markIncomingSection(target);
}

function scrollToSection(target, { behavior }) {
  const offset = getHeaderOffset();
  const top = window.scrollY + target.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

function scrollToTop({ animate }) {
  const behavior = animate && !navState.prefersReducedMotion ? "smooth" : "auto";
  window.scrollTo({ top: 0, behavior });
}

function getHeaderOffset() {
  const header = document.querySelector(".site-header");
  const height = header ? header.getBoundingClientRect().height : 0;
  return height + SCROLL_PADDING;
}

function focusSectionHeading(section) {
  const heading = section.querySelector(".section-title, h2, h1");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

function markIncomingSection(section) {
  section.classList.remove("is-incoming");
  void section.offsetWidth;
  section.classList.add("is-incoming");
  window.setTimeout(() => {
    section.classList.remove("is-incoming");
  }, 650);
}

function setupScrollSpy() {
  navState.sectionLinks = navState.navLinks.filter((link) => link.closest(".nav"));
  const sectionIds = navState.sectionLinks
    .map((link) => link.getAttribute("href"))
    .filter((href) => href && href.startsWith("#"));
  navState.sections = sectionIds
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  if (!navState.sections.length) return;

  rebuildScrollSpy();

  if (!navState.resizeHandler) {
    navState.resizeHandler = debounce(() => {
      rebuildScrollSpy();
    }, 160);
    window.addEventListener("resize", navState.resizeHandler);
  }
}

function rebuildScrollSpy() {
  if (navState.observer) {
    navState.observer.disconnect();
  }

  const offset = getHeaderOffset() + 6;
  navState.observer = new IntersectionObserver(
    (entries) => {
      if (navState.isTransitioning) return;
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const active = visible[0].target;
      const id = `#${active.id}`;
      if (id !== navState.activeId) {
        updateActiveLink(id);
        history.replaceState(null, "", id);
      }
    },
    {
      rootMargin: `-${offset}px 0px -55% 0px`,
      threshold: [0.2, 0.4, 0.6, 0.8]
    }
  );

  navState.sections.forEach((section) => navState.observer.observe(section));
}

function updateActiveLink(id) {
  navState.activeId = id;
  navState.sectionLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === id;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function normalizeHash(hash) {
  if (!hash) return null;
  if (hash.startsWith("#")) return hash;
  return `#${hash}`;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

function setupScrollReveal() {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  reveals.forEach((el) => observer.observe(el));
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = Number(el.dataset.count || 0);
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = value.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => observer.observe(el));
}

function setupForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const success = document.getElementById("form-success");
  if (!form || !status || !success) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    success.hidden = true;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const errors = [];
    const name = payload.name ? payload.name.trim() : "";
    const phone = payload.phone ? payload.phone.trim() : "";
    const vehicle = payload.vehicle ? payload.vehicle.trim() : "";
    const message = payload.message ? payload.message.trim() : "";

    clearInputErrors(form);

    if (!name) {
      errors.push("Please add your name.");
      markInputError(form, "name");
    }
    if (!phone) {
      errors.push("Please add a phone number.");
      markInputError(form, "phone");
    }
    if (!vehicle) {
      errors.push("Please add your vehicle.");
      markInputError(form, "vehicle");
    }
    if (!message) {
      errors.push("Please add a brief message.");
      markInputError(form, "message");
    }

    if (errors.length) {
      status.textContent = errors[0];
      return;
    }

    console.log("Contact form payload:", payload);
    form.reset();
    success.hidden = false;
  });
}

function setupServicesMenu() {
  const menu = document.querySelector("[data-service-menu]");
  if (!menu) return;

  const tabs = Array.from(menu.querySelectorAll(".service-tab"));
  const panels = Array.from(menu.querySelectorAll(".service-panel"));
  const panelWrap = menu.querySelector(".services-panels");

  if (!tabs.length || !panels.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const activate = (tab) => {
    if (!tab) return;
    const targetId = tab.getAttribute("aria-controls");
    const target = panels.find((panel) => panel.id === targetId);
    if (!target) return;

    tabs.forEach((btn) => {
      const isActive = btn === tab;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      btn.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel === target;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    if (panelWrap && !prefersReducedMotion) {
      panelWrap.classList.remove("is-switching");
      void panelWrap.offsetWidth;
      panelWrap.classList.add("is-switching");
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate(tab);
      }
    });
  });

  const defaultTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
  activate(defaultTab);
}

function markInputError(form, name) {
  const input = form.querySelector(`[name="${name}"]`);
  if (!input) return;
  input.classList.add("input-error");
  input.setAttribute("aria-invalid", "true");
}

function clearInputErrors(form) {
  form.querySelectorAll(".input-error").forEach((el) => {
    el.classList.remove("input-error");
    el.removeAttribute("aria-invalid");
  });
}

function setupLightbox() {
  const lightbox = document.getElementById("lightbox");
  const closeBtn = document.getElementById("lightbox-close");
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  if (!lightbox || !closeBtn || !img || !caption) return;

  const close = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    img.src = "";
  };

  closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".gallery-item");
    if (!button) return;
    const src = button.dataset.full;
    const text = button.dataset.caption || "";
    if (!src) return;
    img.src = src;
    caption.textContent = text;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  });
}

async function initImages() {
  const images = await discoverImages();
  state.images = images;

  if (!images.length) {
    buildPlaceholderGallery();
    hideBeforeAfter();
    return;
  }

  const hero = selectHeroImage(images);
  if (hero) {
    document.documentElement.style.setProperty("--hero-image", `url('${hero.src}')`);
  }

  buildGallery(images);
  buildBeforeAfter(images);
}

async function discoverImages() {
  const names = mergeCandidateNames();
  const candidates = buildCandidatePaths(names);
  const results = await Promise.all(candidates.map(loadImage));
  const unique = new Map();

  results.forEach((item) => {
    if (!item) return;
    if (!unique.has(item.src)) {
      unique.set(item.src, item);
    }
  });

  return Array.from(unique.values());
}

function mergeCandidateNames() {
  const names = [];
  const pushName = (name) => {
    if (!name) return;
    const clean = name.trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (names.some((n) => n.toLowerCase() === key)) return;
    names.push(clean);
  };

  IMAGE_MANIFEST.forEach(pushName);
  CANDIDATE_FILENAMES.forEach(pushName);
  return names;
}

function buildCandidatePaths(names) {
  const paths = [];
  names.forEach((name) => {
    const hasPath = name.includes("/") || name.includes("\\");
    const cleanName = name.replace(/\\/g, "/");
    const encodedName = cleanName
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    if (hasPath) {
      paths.push(encodedName);
      return;
    }

    BASE_PATHS.forEach((base) => {
      paths.push(`${base}${encodedName}`);
    });
  });

  return paths;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        src,
        name: extractName(src),
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function extractName(src) {
  const parts = decodeURIComponent(src).split("/");
  return parts[parts.length - 1] || src;
}

function selectHeroImage(images) {
  const scored = images
    .filter((img) => !/logo/i.test(img.name))
    .map((img) => ({
      img,
      score: scoreName(img.name)
    }))
    .sort((a, b) => b.score - a.score);

  return scored.length ? scored[0].img : images[0];
}

function scoreName(name) {
  const lower = name.toLowerCase();
  let score = 0;
  if (/(shop|front|garage|service|bay|exterior)/.test(lower)) score += 4;
  if (/(car|audi|bmw|mercedes|vw|golf|porsche|maserati|q5|range)/.test(lower)) score += 3;
  if (/(engine|motor)/.test(lower)) score += 1;
  if (/logo/.test(lower)) score -= 6;
  return score;
}

function buildGallery(images) {
  const grid = document.getElementById("gallery-grid");
  const status = document.getElementById("gallery-status");
  if (!grid) return;

  const usable = images.filter((img) => !/logo/i.test(img.name));
  if (!usable.length) {
    buildPlaceholderGallery();
    return;
  }

  const limited = usable.slice(0, MAX_GALLERY_ITEMS);
  grid.innerHTML = "";
  limited.forEach((img, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-item";
    button.dataset.full = img.src;
    button.dataset.caption = img.name;
    button.setAttribute("aria-label", `Open image ${index + 1}`);

    const imageEl = document.createElement("img");
    imageEl.src = img.src;
    imageEl.alt = img.name || `Gallery image ${index + 1}`;
    imageEl.loading = "lazy";

    button.appendChild(imageEl);
    grid.appendChild(button);
  });

  if (status) {
    status.textContent = `${limited.length} images loaded from local folders.`;
  }
}

function buildBeforeAfter(images) {
  const section = document.getElementById("before-after");
  const grid = document.getElementById("before-after-grid");
  if (!section || !grid) return;

  const pairs = findBeforeAfterPairs(images);
  if (!pairs.length) {
    hideBeforeAfter();
    return;
  }

  grid.innerHTML = "";
  pairs.forEach((pair, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "before-after";

    const title = document.createElement("h3");
    title.textContent = `Before / After ${index + 1}`;

    const inner = document.createElement("div");
    inner.className = "before-after-inner";

    inner.appendChild(buildBeforeAfterFigure(pair.before, "Before"));
    inner.appendChild(buildBeforeAfterFigure(pair.after, "After"));

    wrapper.appendChild(title);
    wrapper.appendChild(inner);
    grid.appendChild(wrapper);
  });
}

function buildBeforeAfterFigure(image, label) {
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  img.src = image.src;
  img.alt = `${label}: ${image.name}`;

  const caption = document.createElement("figcaption");
  caption.textContent = label;

  figure.appendChild(img);
  figure.appendChild(caption);
  return figure;
}

function findBeforeAfterPairs(images) {
  const map = new Map();

  images.forEach((img) => {
    const lower = img.name.toLowerCase();
    const match = lower.match(/(.*)(before|after)(.*)\.(\w+)$/);
    if (!match) return;
    const base = `${match[1]}${match[3]}`.replace(/[-_\s]+/g, " ").trim();
    if (!map.has(base)) {
      map.set(base, { before: null, after: null });
    }
    const entry = map.get(base);
    if (match[2] === "before") {
      entry.before = img;
    } else {
      entry.after = img;
    }
  });

  return Array.from(map.values()).filter((pair) => pair.before && pair.after);
}

function hideBeforeAfter() {
  const section = document.getElementById("before-after");
  if (section) {
    section.style.display = "none";
  }
}

function buildPlaceholderGallery() {
  const grid = document.getElementById("gallery-grid");
  const status = document.getElementById("gallery-status");
  if (!grid) return;

  grid.innerHTML = "";
  const placeholders = [
    "Shop Front",
    "Diagnostics",
    "European Service",
    "Engine Care",
    "Inspection",
    "Delivery"
  ];

  placeholders.forEach((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-item";
    button.dataset.full = createPlaceholderSvg(label, index);
    button.dataset.caption = label;

    const imageEl = document.createElement("img");
    imageEl.src = createPlaceholderSvg(label, index);
    imageEl.alt = `${label} placeholder`;
    button.appendChild(imageEl);
    grid.appendChild(button);
  });

  if (status) {
    status.textContent = "No local images were found. Showing placeholders.";
  }
}

function createPlaceholderSvg(label, index) {
  const colors = ["#c24c3f", "#1f6f78", "#7a4a8f", "#4c6b9f", "#3a6f4e", "#9a6a2f"];
  const accent = colors[index % colors.length];
  const safeLabel = label.replace(/&/g, "and");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0f1218" />
          <stop offset="1" stop-color="#2d3642" />
        </linearGradient>
      </defs>
      <rect width="600" height="420" fill="url(#g)" />
      <circle cx="520" cy="80" r="120" fill="${accent}" opacity="0.25" />
      <text x="40" y="210" fill="#f4f5f7" font-family="Avenir Next, Segoe UI, sans-serif" font-size="28">${safeLabel}</text>
      <text x="40" y="250" fill="#cdd2d9" font-family="Avenir Next, Segoe UI, sans-serif" font-size="16">Drop images into /assets and update IMAGE_MANIFEST</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/*
Tuning:
- TRANSITION_DURATION controls the overlay timing. Keep it in sync with --transition-duration in styles.css.
- TRANSITION_SCROLL_DELAY controls when the scroll happens (0.45 to 0.55 feels best).
- To change the wipe style, edit @keyframes wipe-diagonal in styles.css.
*/
