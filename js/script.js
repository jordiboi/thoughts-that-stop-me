/* ================================================================
   SHARED SITE BEHAVIOR
   ================================================================ */

(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");

  /*
    Keep the main public menu identical on every page, including older
    generated category/review pages.
  */
  const syncMainNavigation = () => {
    if (!navigation) return;
    const path = window.location.pathname.toLowerCase();
    const inPages = path.includes("/pages/");
    const inNestedPages = /\/pages\/(?:categories|reviews|studies|writing)\//.test(path);
    const root = inNestedPages ? "../../" : (inPages ? "../" : "");
    const active =
      (/\/pages\/(?:categories|reviews)\//.test(path) || /\/pages\/videos\.html$/.test(path)) ? "videos" :
      (/\/pages\/writing(?:\/|\.html$)/.test(path)) ? "writing" :
      (/\/pages\/projects\.html$/.test(path)) ? "projects" :
      (/\/pages\/studies(?:\/|\.html$)/.test(path)) ? "studies" : "home";

    const links = [
      ["home", "Home", `${root}index.html`],
      ["videos", "Videos", `${root}pages/videos.html`],
      ["writing", "Writing", `${root}pages/writing.html`],
      ["projects", "Projects", `${root}pages/projects.html`],
      ["studies", "My Studies", `${root}pages/studies.html`]
    ];
    navigation.innerHTML = links.map(([key, label, href]) =>
      `<a${key === active ? ' class="active"' : ""} href="${href}">${label}</a>`
    ).join("");
  };
  syncMainNavigation();

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }



  /*
    "I was here" guestbook.
    GitHub Pages cannot store visitor data by itself, so Beta 11 can connect
    this small public widget to a Supabase project. The public site receives
    only the publishable key; the elevated secret key stays in local admin.
  */
  let guestbookSettings = null;

  const renderGuestbook = (settings) => {
    guestbookSettings = settings && settings.guestbook ? settings.guestbook : {};
    document.querySelectorAll(".site-footer, .home-footer").forEach((footer) => {
      if (footer.querySelector(".guestbook-footer")) return;

      const box = document.createElement("div");
      box.className = "guestbook-footer";
      box.innerHTML = `
        <button class="guestbook-action" type="button">
          <span>I was here</span>
          <span class="guestbook-plus" aria-hidden="true">+</span>
        </button>
        <div class="guestbook-signature-row">
          <input type="text" maxlength="160" aria-label="Leave a signature" placeholder="Leave a signature (optional)">
          <button type="button">Sign</button>
        </div>
        <p class="guestbook-note" aria-live="polite"></p>
      `;
      footer.prepend(box);

      const action = box.querySelector(".guestbook-action");
      const plus = box.querySelector(".guestbook-plus");
      const signatureRow = box.querySelector(".guestbook-signature-row");
      const signatureInput = signatureRow.querySelector("input");
      const signButton = signatureRow.querySelector("button");
      const note = box.querySelector(".guestbook-note");

      const joined = localStorage.getItem("tts-i-was-here") === "1";
      if (joined) {
        action.disabled = true;
        plus.textContent = "✓";
        signatureRow.classList.add("is-open");
      }

      let clientPromise = null;
      const getClient = async () => {
        const url = String(guestbookSettings.supabaseUrl || "").trim().replace(/\/+$/, "");
        const key = String(guestbookSettings.publishableKey || "").trim();
        if (!url || !key) throw new Error("The guestbook is not connected yet.");

        if (!clientPromise) {
          clientPromise = new Promise((resolve, reject) => {
            if (window.supabase && window.supabase.createClient) {
              return resolve(window.supabase.createClient(url, key));
            }
            const lib = document.createElement("script");
            lib.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            lib.onload = () => resolve(window.supabase.createClient(url, key));
            lib.onerror = () => reject(new Error("Could not load the guestbook service."));
            document.head.appendChild(lib);
          });
        }
        return clientPromise;
      };

      const getSignedInUser = async (client) => {
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData && sessionData.session && sessionData.session.user) {
          return sessionData.session.user;
        }
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        return data.user;
      };

      action.addEventListener("click", async () => {
        action.disabled = true;
        note.textContent = "Leaving your mark...";
        try {
          const client = await getClient();
          const user = await getSignedInUser(client);
          const { error } = await client
            .from("guestbook_entries")
            .insert({ user_id: user.id, signature: "" });

          // 23505 means this same anonymous browser identity already exists.
          if (error && error.code !== "23505") throw error;

          localStorage.setItem("tts-i-was-here", "1");
          plus.textContent = "✓";
          signatureRow.classList.add("is-open");
          note.textContent = error ? "You were already counted. You can still update your signature." : "You were here :)";
          signatureInput.focus();
        } catch (error) {
          action.disabled = false;
          note.textContent = error.message || "Could not reach the guestbook.";
        }
      });

      signButton.addEventListener("click", async () => {
        signButton.disabled = true;
        note.textContent = "Saving signature...";
        try {
          const client = await getClient();
          const user = await getSignedInUser(client);
          const { error } = await client
            .from("guestbook_entries")
            .update({ signature: signatureInput.value.trim() })
            .eq("user_id", user.id);
          if (error) throw error;
          localStorage.setItem("tts-i-was-here", "1");
          action.disabled = true;
          plus.textContent = "✓";
          note.textContent = "Signature saved.";
        } catch (error) {
          note.textContent = error.message || "Could not save the signature.";
        } finally {
          signButton.disabled = false;
        }
      });
    });
  };

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
        renderGuestbook(settings || {});
        const section = detectPublicSection();
        if (section && settings && settings.pages && settings.pages[section] === false) {
          showUnderConstruction();
          return;
        }

        const homeText = document.querySelector("[data-home-text]");
        if (homeText && settings && typeof settings.homeText === "string") {
          const paragraphs = settings.homeText
            .split(/\n\s*\n/)
            .map((part) => part.trim())
            .filter(Boolean);
          const heading = document.createElement("h2");
          heading.textContent = "Welcome";
          const explore = document.createElement("a");
          explore.className = "outline-button";
          explore.href = "#explore";
          explore.textContent = "Explore";
          homeText.replaceChildren(heading);
          paragraphs.forEach((text) => {
            const p = document.createElement("p");
            p.textContent = text;
            homeText.appendChild(p);
          });
          homeText.appendChild(explore);
        }
      })
      .catch(() => {
        // If settings cannot be loaded, keep the page available rather than
        // accidentally hiding public content.
        renderGuestbook({});
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
