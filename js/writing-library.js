/* ================================================================
   WRITING LIBRARY
   ================================================================ */

(() => {
  const list = document.querySelector("#writing-list");
  const searchInput = document.querySelector("#writing-search-input");
  const searchStatus = document.querySelector("#writing-search-status");
  const emptyMessage = document.querySelector("#writing-empty");

  if (!list) {
    return;
  }

  const entries = Array.isArray(window.WRITING_LIBRARY)
    ? window.WRITING_LIBRARY
        .filter((entry) => entry.published !== false)
        .sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        })
    : [];

  const escapeHTML = (value) => {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const normalizeSearchText = (value) => {
    return String(value)
      .toLocaleLowerCase("en")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const renderEntries = () => {
    list.innerHTML = "";

    entries.forEach((entry) => {
      const article = document.createElement("article");
      article.className = "writing-entry manuscript-card";

      article.dataset.search = [
        entry.title,
        entry.category,
        entry.preview,
        ...(Array.isArray(entry.keywords) ? entry.keywords : [])
      ].join(" ");

      const title = escapeHTML(entry.title || "Untitled");
      const category = escapeHTML(entry.category || "Writing");
      const preview = escapeHTML(entry.preview || "");
      const page = escapeHTML(entry.page || "#");
      const date = entry.createdAt
        ? new Date(entry.createdAt).toLocaleDateString()
        : "";

      article.innerHTML = `
        <p class="entry-type">${category}</p>
        <h3>${title}</h3>
        ${date ? `<p class="entry-date">${escapeHTML(date)}</p>` : ""}
        ${preview ? `<p>${preview}</p>` : ""}
        <a class="text-link" href="${page}">Read more →</a>
      `;

      list.appendChild(article);
    });

    if (emptyMessage) {
      emptyMessage.hidden = entries.length !== 0;
    }
  };

  const updateSearch = () => {
    const term = normalizeSearchText(searchInput ? searchInput.value : "");
    const cards = Array.from(list.querySelectorAll(".writing-entry"));
    let visible = 0;

    cards.forEach((card) => {
      const match =
        term === "" ||
        normalizeSearchText(
          `${card.dataset.search || ""} ${card.textContent || ""}`
        ).includes(term);

      card.hidden = !match;

      if (match) {
        visible += 1;
      }
    });

    if (emptyMessage && entries.length > 0) {
      emptyMessage.hidden = visible !== 0;
      emptyMessage.querySelector("h3").textContent =
        visible === 0 ? "No matching writing found" : "No writing available";
      emptyMessage.querySelector("p").textContent =
        visible === 0
          ? "Try another title, category, or keyword."
          : "Create an entry with the Writing Editor.";
    }

    if (searchStatus) {
      searchStatus.textContent =
        term === ""
          ? `${cards.length} ${cards.length === 1 ? "entry" : "entries"}`
          : `${visible} matching ${visible === 1 ? "entry" : "entries"}`;
    }
  };

  renderEntries();
  updateSearch();

  if (searchInput) {
    searchInput.addEventListener("input", updateSearch);
  }
})();
