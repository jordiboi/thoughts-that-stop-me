/* ================================================================
   CATEGORY LIBRARY

   Builds the Videos-page category list from category-data.js.

   Default order:
   1. Author's favorite categories first
   2. All other categories alphabetically

   Visitors can switch to a completely alphabetical A–Z order.
   Search works in both sorting modes.
   ================================================================ */

(() => {
  /* ================================================================
     1. DOM ELEMENTS
     ================================================================ */

  const categoryList = document.querySelector("#category-list");
  const searchInput = document.querySelector("#category-search-input");
  const searchStatus = document.querySelector("#category-search-status");
  const emptyMessage = document.querySelector("#category-empty");
  const sortButton = document.querySelector("#category-sort-button");

  if (!categoryList) {
    return;
  }

  /* ================================================================
     2. DATA AND STATE
     ================================================================ */

  const allCategories = Array.isArray(window.VIDEO_CATEGORIES)
    ? window.VIDEO_CATEGORIES
    : [];

  const videos = Array.isArray(window.VIDEO_LIBRARY)
    ? window.VIDEO_LIBRARY
    : [];

  const categories = allCategories.filter((category) => {
    const slug = String(category.slug || "");

    return videos.some((video) => {
      if (video.published === false) return false;

      const videoCategories = Array.isArray(video.categories)
        ? video.categories
        : video.category
          ? [video.category]
          : [];

      return videoCategories.includes(slug);
    });
  });

  /*
    false = favorites first, followed by alphabetical categories
    true  = all categories in strict alphabetical order
  */
  let alphabeticalOnly = false;

  /* ================================================================
     3. HELPER FUNCTIONS
     ================================================================ */

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

  const compareAlphabetically = (categoryA, categoryB) => {
    return String(categoryA.name || "").localeCompare(
      String(categoryB.name || ""),
      "en",
      {
        sensitivity: "base"
      }
    );
  };

  const getSortedCategories = () => {
    const sortedCategories = [...categories];

    /*
      When alphabeticalOnly is true, favorites are ignored and every
      category is placed in strict alphabetical order.
    */
    if (alphabeticalOnly) {
      return sortedCategories.sort(compareAlphabetically);
    }

    /*
      Default order:
      - favorites first
      - alphabetical order inside both groups
    */
    return sortedCategories.sort((categoryA, categoryB) => {
      const favoriteA = categoryA.favorite === true;
      const favoriteB = categoryB.favorite === true;

      if (favoriteA !== favoriteB) {
        return favoriteA ? -1 : 1;
      }

      return compareAlphabetically(categoryA, categoryB);
    });
  };

  const updateSortButton = () => {
    if (!sortButton) {
      return;
    }

    sortButton.setAttribute(
      "aria-pressed",
      String(alphabeticalOnly)
    );

    sortButton.textContent = alphabeticalOnly
      ? "Showing: A → Z"
      : "Showing: ★ Recommended";

    sortButton.title = alphabeticalOnly
      ? "Switch to author's favorites first"
      : "Switch to strict alphabetical order";
  };

  /* ================================================================
     4. CATEGORY RENDERING
     ================================================================ */

  const renderCategories = () => {
    categoryList.innerHTML = "";

    const sortedCategories = getSortedCategories();

    sortedCategories.forEach((category, index) => {
      const link = document.createElement("a");

      link.className = "category-link card";
      link.href = category.page || "#";

      /*
        These values are stored for the search feature.
      */
      link.dataset.search = [
        category.name,
        category.slug,
        category.description
      ].join(" ");

      const favoriteStar =
        category.favorite === true
          ? `
            <span
              class="category-favorite-star"
              aria-label="Author's favorite"
              title="Author's favorite"
            >
              ★
            </span>
          `
          : "";

      link.innerHTML = `
        <div>
          <span class="category-number">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <h3>
            ${favoriteStar}
            ${escapeHTML(
              category.name || "Untitled category"
            )}
          </h3>

          <p>
            ${escapeHTML(
              category.description ||
              `Browse videos filed under ${
                category.name || "this category"
              }.`
            )}
          </p>
        </div>

        <span
          class="category-arrow"
          aria-hidden="true"
        >
          →
        </span>
      `;

      categoryList.appendChild(link);
    });

    if (emptyMessage) {
      emptyMessage.hidden = categories.length !== 0;
    }
  };

  /* ================================================================
     5. SEARCHING
     ================================================================ */

  const updateSearch = () => {
    const searchTerm = normalizeSearchText(
      searchInput ? searchInput.value : ""
    );

    const links = Array.from(
      categoryList.querySelectorAll(".category-link")
    );

    let visibleCount = 0;

    links.forEach((link) => {
      const searchableText = normalizeSearchText(
        `${link.dataset.search || ""} ${
          link.textContent || ""
        }`
      );

      const isMatch =
        searchTerm === "" ||
        searchableText.includes(searchTerm);

      link.hidden = !isMatch;

      if (isMatch) {
        visibleCount += 1;
      }
    });

    /*
      Show the special no-results message when categories exist,
      but none match the visitor's search.
    */
    categoryList.classList.toggle(
      "no-results",
      links.length > 0 && visibleCount === 0
    );

    if (searchStatus) {
      if (searchTerm === "") {
        searchStatus.textContent =
          `${links.length} ${
            links.length === 1
              ? "category"
              : "categories"
          }`;
      } else {
        searchStatus.textContent =
          `${visibleCount} matching ${
            visibleCount === 1
              ? "category"
              : "categories"
          }`;
      }
    }
  };

  /* ================================================================
     6. EVENT LISTENERS
     ================================================================ */

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      updateSearch
    );
  }

  if (sortButton) {
    sortButton.addEventListener("click", () => {
      alphabeticalOnly = !alphabeticalOnly;

      /*
        Rebuild the list in the newly selected order, then reapply
        the visitor's current search.
      */
      renderCategories();
      updateSortButton();
      updateSearch();
    });
  }

  /* ================================================================
     7. INITIALIZATION
     ================================================================ */

  renderCategories();
  updateSortButton();
  updateSearch();
})();