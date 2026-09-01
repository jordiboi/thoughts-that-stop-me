/* ================================================================
   SHARED SITE BEHAVIOR
   ================================================================ */

(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }


  /*
    Public section switchboard.
    General Editor writes js/data/site-settings.json.
    Inactive sections stay visible in navigation, but their content becomes
    a simple Under construction message.
  */
  const detectPublicSection = () => {
    const path = window.location.pathname.toLowerCase();
    if (/\/pages\/(?:categories|reviews)\//.test(path) || /\/pages\/videos\.html$/.test(path)) return "videos";
    if (/\/pages\/writing(?:\/|\.html$)/.test(path)) return "writing";
    if (/\/pages\/projects\.html$/.test(path)) return "projects";
    if (/\/pages\/studies(?:\/|\.html$)/.test(path)) return "studies";
    if (/\/index\.html$/.test(path) || /\/thoughts-that-stop-me\/?$/.test(path) || path === "/") return "home";
    return null;
  };

  const showUnderConstruction = () => {
    document.querySelectorAll(".study-subnav-wrap").forEach((node) => node.remove());
    const main = document.querySelector("main");
    if (!main) return;
    main.className = "inner-main construction-main";
    main.innerHTML = `
      <section class="page-heading construction-panel">
        <p class="eyebrow">Not quite ready</p>
        <h1>Under construction :)</h1>
        <p>I'm still working on this part of the site. Please check back later.</p>
      </section>`;
    document.body.classList.add("section-under-construction");
  };

  const currentScriptUrl = document.currentScript && document.currentScript.src;
  if (currentScriptUrl) {
    const settingsUrl = new URL("data/site-settings.json", currentScriptUrl);
    fetch(settingsUrl, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((settings) => {
        const section = detectPublicSection();
        if (section && settings && settings.pages && settings.pages[section] === false) {
          showUnderConstruction();
        }
      })
      .catch(() => {
        // If settings cannot be loaded, keep the page available rather than
        // accidentally hiding public content.
      });
  }


  document.querySelectorAll("#year").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  /*
    Home-page inactivity effect.
    The other page families keep their backgrounds visible at all times.
  */
  const IDLE_TIME = 30_000;

  if (document.body.classList.contains("home-page")) {
    let idleTimer;

    const enterIdleMode = () => {
      document.body.classList.add("is-idle");
    };

    const resetIdleTimer = () => {
      document.body.classList.remove("is-idle");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(enterIdleMode, IDLE_TIME);
    };

    [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll"
    ].forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();
  }
})();
