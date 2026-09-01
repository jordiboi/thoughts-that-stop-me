/* ================================================================
   VIDEO LIBRARY

   Builds a category page from video-data.js and lets visitors:
   - search videos
   - show all videos or only videos with written reviews
   - switch between detailed list view and compact grid view
   ================================================================ */

(() => {
  const pageCategory = document.body.dataset.category;
  const videoList = document.querySelector("#video-library-list");
  const searchInput = document.querySelector("#video-search-input");
  const searchStatus = document.querySelector("#video-search-status");
  const emptyMessage = document.querySelector("#video-search-empty");
  const searchBox = document.querySelector(".video-search");

  if (!pageCategory || !videoList) {
    return;
  }

  const allVideos = Array.isArray(window.VIDEO_LIBRARY)
    ? window.VIDEO_LIBRARY
    : [];

  const categoryRegistry = Array.isArray(window.VIDEO_CATEGORIES)
    ? window.VIDEO_CATEGORIES
    : [];

  let reviewsOnly = false;
  let gridView = false;

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

  const hasWrittenReview = (video) => {
    const review = video && video.review ? video.review : {};

    const html = typeof review.html === "string"
      ? review.html
          .replace(/<br\s*\/?\s*>/gi, "")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/gi, " ")
          .trim()
      : "";

    const text = typeof review.text === "string"
      ? review.text.trim()
      : "";

    return html.length > 0 || text.length > 0;
  };

  const normalizedPageCategory = normalizeSlug(pageCategory);
  const isAllVideosPage = normalizedPageCategory === "all-videos";

  const categoryVideos = allVideos
    .filter((video) => {
      if (isAllVideosPage) {
        /*
          The All videos page intentionally ignores category membership.
          Its only public requirement is that the video is published.
        */
        return video.published !== false;
      }

      return (
        isPubliclyValid(video) &&
        getVideoCategories(video).includes(normalizedPageCategory)
      );
    })
    .sort((videoA, videoB) => {
      const dateA = new Date(videoA.createdAt || 0).getTime();
      const dateB = new Date(videoB.createdAt || 0).getTime();

      // Newest videos first.
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
    item.dataset.hasReview = String(hasWrittenReview(video));

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

  const createViewControls = () => {
    if (!searchBox) {
      return { reviewsButton: null, viewButton: null };
    }

    let controls = searchBox.querySelector(".video-view-controls");

    if (!controls) {
      controls = document.createElement("div");
      controls.className = "video-view-controls";

      const reviewsButton = document.createElement("button");
      reviewsButton.type = "button";
      reviewsButton.className = "video-view-button";
      reviewsButton.dataset.action = "reviews";

      const viewButton = document.createElement("button");
      viewButton.type = "button";
      viewButton.className = "video-view-button";
      viewButton.dataset.action = "view";

      controls.append(reviewsButton, viewButton);
      searchBox.appendChild(controls);
    }

    return {
      reviewsButton: controls.querySelector('[data-action="reviews"]'),
      viewButton: controls.querySelector('[data-action="view"]')
    };
  };

  const { reviewsButton, viewButton } = createViewControls();

  const updateControlLabels = () => {
    if (reviewsButton) {
      reviewsButton.textContent = reviewsOnly
        ? "Show all"
        : "With reviews only";

      reviewsButton.setAttribute(
        "aria-pressed",
        String(reviewsOnly)
      );
    }

    if (viewButton) {
      viewButton.textContent = gridView
        ? "List view"
        : "Grid view";

      viewButton.setAttribute(
        "aria-pressed",
        String(gridView)
      );
    }
  };

  const updateViewMode = () => {
    videoList.classList.toggle(
      "video-library-grid",
      gridView
    );
  };

  const updateFilters = () => {
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

      const matchesSearch =
        searchTerm === "" ||
        searchableText.includes(searchTerm);

      const matchesReviewFilter =
        !reviewsOnly || item.dataset.hasReview === "true";

      const isVisible = matchesSearch && matchesReviewFilter;

      item.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (emptyMessage) {
      emptyMessage.hidden = visibleCount !== 0;

      const heading = emptyMessage.querySelector("h3");
      const paragraph = emptyMessage.querySelector("p");

      if (visibleCount === 0 && reviewsOnly && searchTerm === "") {
        if (heading) heading.textContent = "No reviewed videos yet";
        if (paragraph) {
          paragraph.textContent =
            "Switch to Show all to see videos without a written review.";
        }
      } else {
        if (heading) heading.textContent = "No videos found";
        if (paragraph) {
          paragraph.textContent =
            "Try another title, creator, subject, or keyword.";
        }
      }
    }

    if (searchStatus) {
      const modeDescription = reviewsOnly
        ? "reviewed"
        : "published";

      if (searchTerm === "") {
        searchStatus.textContent =
          `${visibleCount} ${modeDescription} ${
            visibleCount === 1 ? "video" : "videos"
          }`;
      } else {
        searchStatus.textContent =
          `${visibleCount} matching ${
            visibleCount === 1 ? "video" : "videos"
          }`;
      }
    }
  };

  renderVideos();
  updateControlLabels();
  updateViewMode();
  updateFilters();

  if (searchInput) {
    searchInput.addEventListener("input", updateFilters);
  }

  if (reviewsButton) {
    reviewsButton.addEventListener("click", () => {
      reviewsOnly = !reviewsOnly;
      updateControlLabels();
      updateFilters();
    });
  }

  if (viewButton) {
    viewButton.addEventListener("click", () => {
      gridView = !gridView;
      updateControlLabels();
      updateViewMode();
    });
  }
})();
