import { gsap } from "gsap";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

/**
 * Vanilla JS adapter for the React Bits PillNav component.
 * The application uses hash routing, so links are regular anchors instead of
 * react-router Links. GSAP still drives the pill reveal, hover circle and menu.
 */
export function mountPillNav(container, options = {}) {
  if (!container) return () => {};

  const {
    logo,
    logoAlt = "Logo",
    items = [],
    activeHref,
    className = "",
    ease = "power3.easeOut",
    baseColor = "#ffffff",
    pillColor = "#120f17",
    hoveredPillTextColor = "#120f17",
    pillTextColor,
    onMobileMenuClick,
    initialLoadAnimation = true,
    ariaLabel = "Primary navigation",
  } = options;
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.createElement("div");
  root.className = "pill-nav-root";

  const nav = document.createElement("nav");
  nav.className = `pill-nav ${className}`.trim();
  nav.setAttribute("aria-label", ariaLabel);
  nav.style.setProperty("--base", baseColor);
  nav.style.setProperty("--pill-bg", pillColor);
  nav.style.setProperty("--hover-text", hoveredPillTextColor);
  nav.style.setProperty("--pill-text", resolvedPillTextColor);

  const logoLink = logo
    ? document.createElement("a")
    : null;
  if (logoLink) {
    logoLink.className = "pill-logo";
    logoLink.href = items[0]?.href || "#/";
    logoLink.setAttribute("aria-label", "Home");
    const image = document.createElement("img");
    image.src = logo;
    image.alt = logoAlt;
    logoLink.append(image);
    nav.append(logoLink);
  }

  const desktopItems = document.createElement("div");
  desktopItems.className = "pill-nav-items desktop-only";
  const list = document.createElement("ul");
  list.className = "pill-list";
  list.setAttribute("role", "list");
  desktopItems.append(list);
  nav.append(desktopItems);

  const mobileButton = document.createElement("button");
  mobileButton.type = "button";
  mobileButton.className = "pill-menu-button mobile-only";
  mobileButton.setAttribute("aria-label", "Toggle menu");
  mobileButton.setAttribute("aria-expanded", "false");
  mobileButton.innerHTML = '<span class="hamburger-line"></span><span class="hamburger-line"></span>';
  nav.append(mobileButton);
  root.append(nav);

  const popover = document.createElement("div");
  popover.className = "pill-mobile-popover mobile-only";
  popover.setAttribute("aria-hidden", "true");
  popover.style.setProperty("--base", baseColor);
  popover.style.setProperty("--pill-bg", pillColor);
  popover.style.setProperty("--hover-text", hoveredPillTextColor);
  popover.style.setProperty("--pill-text", resolvedPillTextColor);
  const mobileList = document.createElement("ul");
  mobileList.className = "pill-mobile-list";
  popover.append(mobileList);
  root.append(popover);
  container.replaceChildren(root);

  const circleRefs = [];
  const timelineRefs = [];
  const activeTweenRefs = [];
  const enterHandlers = [];
  const leaveHandlers = [];
  const mobileLinkEntries = [];
  const desktopLinks = [];
  let logoTween = null;
  let isMobileMenuOpen = false;

  items.forEach((item, index) => {
    const label = escapeHtml(item.label);
    const href = item.href || "#/";
    const isActive = activeHref === href;
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.className = `pill-nav-link${isActive ? " is-active" : ""}`;
    link.href = href;
    link.setAttribute("aria-label", item.ariaLabel || item.label || "Navigation");
    if (isActive) link.setAttribute("aria-current", "page");
    link.innerHTML = `<span class="pill-hover-circle" aria-hidden="true"></span><span class="pill-label-stack"><span class="pill-label">${label}</span><span class="pill-label-hover" aria-hidden="true">${label}</span></span>`;
    listItem.append(link);
    list.append(listItem);
    desktopLinks.push(link);
    circleRefs[index] = link.querySelector(".pill-hover-circle");

    const enter = () => handleEnter(index);
    const leave = () => handleLeave(index);
    enterHandlers[index] = enter;
    leaveHandlers[index] = leave;
    link.addEventListener("mouseenter", enter);
    link.addEventListener("mouseleave", leave);
    link.addEventListener("focus", enter);
    link.addEventListener("blur", leave);

    const mobileItem = document.createElement("li");
    const mobileLink = document.createElement("a");
    mobileLink.className = `pill-mobile-link${isActive ? " is-active" : ""}`;
    mobileLink.href = href;
    mobileLink.textContent = item.label || "";
    if (isActive) mobileLink.setAttribute("aria-current", "page");
    const closeMobile = () => closeMobileMenu();
    mobileLink.addEventListener("click", closeMobile);
    mobileLinkEntries.push([mobileLink, closeMobile]);
    mobileItem.append(mobileLink);
    mobileList.append(mobileItem);
  });

  const layout = () => {
    if (window.innerWidth > 1024) {
      desktopItems.style.removeProperty("width");
      desktopItems.style.removeProperty("opacity");
    }
    circleRefs.forEach((circle, index) => {
      const pill = circle?.parentElement;
      if (!circle || !pill) return;
      const rect = pill.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (!width || !height) return;
      const radius =
        (width * width) / 4 / (2 * height) + height / 2;
      const diameter = Math.ceil(radius * 2) + 2;
      const delta =
        Math.ceil(
          radius -
            Math.sqrt(Math.max(0, radius * radius - (width * width) / 4)),
        ) + 1;
      const originY = diameter - delta;
      circle.style.width = `${diameter}px`;
      circle.style.height = `${diameter}px`;
      circle.style.bottom = `-${delta}px`;
      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: `50% ${originY}px`,
      });
      const label = pill.querySelector(".pill-label");
      const hoverLabel = pill.querySelector(".pill-label-hover");
      if (label) gsap.set(label, { y: 0 });
      if (hoverLabel) gsap.set(hoverLabel, { y: height + 12, opacity: 0 });
      timelineRefs[index]?.kill();
      const timeline = gsap.timeline({ paused: true });
      timeline.to(
        circle,
        { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" },
        0,
      );
      if (label)
        timeline.to(
          label,
          { y: -(height + 8), duration: 2, ease, overwrite: "auto" },
          0,
        );
      if (hoverLabel) {
        gsap.set(hoverLabel, { y: Math.ceil(height + 100), opacity: 0 });
        timeline.to(
          hoverLabel,
          { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" },
          0,
        );
      }
      timelineRefs[index] = timeline;
    });
  };

  const handleEnter = (index) => {
    const timeline = timelineRefs[index];
    if (!timeline) return;
    if (reducedMotion.matches) {
      gsap.set(circleRefs[index], { scale: 1.2 });
      return;
    }
    activeTweenRefs[index]?.kill();
    activeTweenRefs[index] = timeline.tweenTo(timeline.duration(), {
      duration: 0.3,
      ease,
      overwrite: "auto",
    });
  };

  const handleLeave = (index) => {
    const timeline = timelineRefs[index];
    if (!timeline) return;
    if (reducedMotion.matches) {
      gsap.set(circleRefs[index], { scale: 0 });
      return;
    }
    activeTweenRefs[index]?.kill();
    activeTweenRefs[index] = timeline.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: "auto",
    });
  };

  const handleLogoEnter = () => {
    const image = logoLink?.querySelector("img");
    if (!image) return;
    logoTween?.kill();
    logoTween = gsap.to(image, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: "auto",
    });
  };
  logoLink?.addEventListener("mouseenter", handleLogoEnter);

  const setPopoverVisibility = (visible) => {
    popover.style.visibility = visible ? "visible" : "hidden";
    popover.setAttribute("aria-hidden", String(!visible));
  };

  function openMobileMenu() {
    isMobileMenuOpen = true;
    root.classList.add("is-mobile-open");
    mobileButton.setAttribute("aria-expanded", "true");
    const lines = mobileButton.querySelectorAll(".hamburger-line");
    if (reducedMotion.matches) {
      lines[0].style.transform = "rotate(45deg) translateY(3px)";
      lines[1].style.transform = "rotate(-45deg) translateY(-3px)";
      gsap.set(popover, { opacity: 1, y: 0, visibility: "visible" });
    } else {
      gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
      gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      gsap.fromTo(
        popover,
        { opacity: 0, y: 10, scaleY: 1 },
        {
          opacity: 1,
          y: 0,
          scaleY: 1,
          duration: 0.3,
          ease,
          transformOrigin: "top center",
          onStart: () => setPopoverVisibility(true),
        },
      );
    }
    setPopoverVisibility(true);
    onMobileMenuClick?.();
  }

  function closeMobileMenu() {
    if (!isMobileMenuOpen) return;
    isMobileMenuOpen = false;
    root.classList.remove("is-mobile-open");
    mobileButton.setAttribute("aria-expanded", "false");
    const lines = mobileButton.querySelectorAll(".hamburger-line");
    if (reducedMotion.matches) {
      lines[0].style.transform = "";
      lines[1].style.transform = "";
      gsap.set(popover, { opacity: 0, y: 10, visibility: "hidden" });
    } else {
      gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
      gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      gsap.to(popover, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease,
        transformOrigin: "top center",
        onComplete: () => setPopoverVisibility(false),
      });
    }
    setPopoverVisibility(false);
  }

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) closeMobileMenu();
    else openMobileMenu();
  };
  mobileButton.addEventListener("click", toggleMobileMenu);
  const onKeydown = (event) => {
    if (event.key === "Escape" && isMobileMenuOpen) {
      closeMobileMenu();
      mobileButton.focus();
    }
  };
  document.addEventListener("keydown", onKeydown);
  const onResize = () => {
    layout();
    if (window.innerWidth > 768) closeMobileMenu();
  };
  window.addEventListener("resize", onResize);
  const onMotionChange = () => layout();
  reducedMotion.addEventListener?.("change", onMotionChange);

  setPopoverVisibility(false);
  layout();
  document.fonts?.ready.then(layout).catch(() => {});
  if (initialLoadAnimation && !reducedMotion.matches) {
    if (logoLink) {
      gsap.fromTo(logoLink, { scale: 0 }, { scale: 1, duration: 0.6, ease });
    }
    gsap.fromTo(
      desktopItems,
      { width: 0, opacity: 0 },
      { width: "auto", opacity: 1, duration: 0.6, ease },
    );
  }

  return () => {
    timelineRefs.forEach((timeline) => timeline?.kill());
    activeTweenRefs.forEach((tween) => tween?.kill());
    logoTween?.kill();
    desktopLinks.forEach((link, index) => {
      link.removeEventListener("mouseenter", enterHandlers[index]);
      link.removeEventListener("mouseleave", leaveHandlers[index]);
      link.removeEventListener("focus", enterHandlers[index]);
      link.removeEventListener("blur", leaveHandlers[index]);
    });
    mobileLinkEntries.forEach(([link, handler]) => link.removeEventListener("click", handler));
    logoLink?.removeEventListener("mouseenter", handleLogoEnter);
    mobileButton.removeEventListener("click", toggleMobileMenu);
    document.removeEventListener("keydown", onKeydown);
    window.removeEventListener("resize", onResize);
    reducedMotion.removeEventListener?.("change", onMotionChange);
    container.replaceChildren();
  };
}
