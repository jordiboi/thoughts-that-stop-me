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
