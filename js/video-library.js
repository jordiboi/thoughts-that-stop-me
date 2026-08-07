/* ================================================================
   VIDEO LIBRARY

   Builds a category page from video-data.js and filters the entries
   while the visitor types.
   ================================================================ */

(() => {
  const pageCategory = document.body.dataset.category;
  const videoList = document.querySelector("#video-library-list");
  const searchInput = document.querySelector("#video-search-input");
  const searchStatus = document.querySelector("#video-search-status");
  const emptyMessage = document.querySelector("#video-search-empty");

  if (!pageCategory || !videoList) {
    return;
  }

  const allVideos = Array.isArray(window.VIDEO_LIBRARY)
    ? window.VIDEO_LIBRARY
    : [];

  const categoryRegistry = Array.isArray(window.VIDEO_CATEGORIES)
    ? window.VIDEO_CATEGORIES
    : [];

  const normalizeSlug = (value) => {
    return String(value)
      .toLocaleLowerCase("en")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const normalizeSearchText = (value) => {
    return String(value)
      .toLocaleLowerCase("en")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const escapeHTML = (value) => {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const validCategorySlugs = new Set(
    categoryRegistry.map((category) => normalizeSlug(category.slug))
  );

  const getVideoCategories = (video) => {
    if (Array.isArray(video.categories)) {
      return video.categories
        .map(normalizeSlug)
        .filter(Boolean);
    }

    // Compatibility with older exported data.
    if (video.category) {
      return [normalizeSlug(video.category)];
    }

    return [];
  };

  const isPubliclyValid = (video) => {
    const categories = getVideoCategories(video);

    return (
      video.published !== false &&
      categories.length > 0 &&
      categories.every((slug) => validCategorySlugs.has(slug))
    );
  };

  const categoryVideos = allVideos
  .filter((video) => {
    return (
      isPubliclyValid(video) &&
      getVideoCategories(video).includes(
        normalizeSlug(pageCategory)
      )
    );
  })
  .sort((videoA, videoB) => {
    const dateA = new Date(
      videoA.createdAt || 0
    ).getTime();

    const dateB = new Date(
      videoB.createdAt || 0
    ).getTime();

    /*
      Larger and newer timestamps come first.
    */
    return dateB - dateA;
  });

  const getThumbnailURL = (video) => {
    if (video.customThumbnail) {
      return video.customThumbnail;
    }

    return `https://img.youtube.com/vi/${
      encodeURIComponent(video.youtubeId)
    }/hqdefault.jpg`;
  };

  const createVideoEntry = (video) => {
    const item = document.createElement("li");
    item.className = "video-library-item";

    item.dataset.search = [
      video.title,
      video.creator,
      video.description,
      ...(Array.isArray(video.keywords) ? video.keywords : [])
    ].join(" ");

    const title = escapeHTML(video.title || "Untitled video");
    const creator = escapeHTML(video.creator || "");
    const description = escapeHTML(video.description || "");
    const reviewPage = escapeHTML(video.reviewPage || "#");
    const thumbnail = escapeHTML(getThumbnailURL(video));

    item.innerHTML = `
      <a class="video-library-link" href="${reviewPage}">
        <div class="video-entry-number" aria-hidden="true"></div>

        <article class="video-entry-content">
          <h3>${title}</h3>

          <div class="video-entry-details">
            <img
              class="video-thumbnail"
              src="${thumbnail}"
              alt="Thumbnail for ${title}"
              loading="lazy"
            >

            <div class="video-description">
              ${
                creator
                  ? `<p class="video-creator">By ${creator}</p>`
                  : ""
              }

              <p>${description}</p>

              <span class="video-entry-action">
                Watch and read my thoughts →
              </span>
            </div>
          </div>
        </article>
      </a>
    `;

    return item;
  };

  const renderVideos = () => {
    videoList.innerHTML = "";

    categoryVideos.forEach((video) => {
      videoList.appendChild(createVideoEntry(video));
    });
  };

  const updateSearch = () => {
    const searchTerm = normalizeSearchText(
      searchInput ? searchInput.value : ""
    );

    const items = Array.from(
      videoList.querySelectorAll(".video-library-item")
    );

    let visibleCount = 0;

    items.forEach((item) => {
      const searchableText = normalizeSearchText(
        item.dataset.search || ""
      );

      const isMatch =
        searchTerm === "" ||
        searchableText.includes(searchTerm);

      item.hidden = !isMatch;

      if (isMatch) {
        visibleCount += 1;
      }
    });

    if (emptyMessage) {
      emptyMessage.hidden = visibleCount !== 0;
    }

    if (searchStatus) {
      if (searchTerm === "") {
        searchStatus.textContent =
          `${items.length} ${items.length === 1 ? "video" : "videos"}`;
      } else {
        searchStatus.textContent =
          `${visibleCount} matching ${
            visibleCount === 1 ? "video" : "videos"
          }`;
      }
    }
  };

  renderVideos();
  updateSearch();

  if (searchInput) {
    searchInput.addEventListener("input", updateSearch);
  }
})();
