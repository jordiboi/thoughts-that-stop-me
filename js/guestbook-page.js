(() => {
  const status = document.querySelector("#guestbook-page-status");
  const list = document.querySelector("#guestbook-page-list");

  document.querySelector("#guestbook-back").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.href = "index.html";
  });

  (async () => {
    try {
      const response = await fetch("js/data/site-settings.json", { cache: "no-store" });
      const settings = await response.json();
      const cfg = settings.guestbook || {};

      if (!cfg.supabaseUrl || !cfg.publishableKey) {
        throw new Error("The guest book is not connected yet.");
      }

      const client = window.supabase.createClient(
        String(cfg.supabaseUrl).replace(/\/+$/, ""),
        cfg.publishableKey
      );

      // Beta 17: the footer link is the visitor-facing gate. Once somebody
      // reaches this page, the guest book itself simply loads its signatures.
      const { data, error } = await client.rpc("guestbook_public_entries");
      if (error) throw error;

      const entries = Array.isArray(data) ? data : [];
      status.textContent = entries.length
        ? `${entries.length} signature${entries.length === 1 ? "" : "s"}`
        : "No signatures yet.";

      list.replaceChildren();
      entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "guestbook-page-entry";

        const sig = document.createElement("p");
        sig.textContent = entry.signature || "";

        const time = document.createElement("time");
        const d = entry.created_at ? new Date(entry.created_at) : null;
        time.textContent = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : "";

        row.append(sig, time);
        list.appendChild(row);
      });
    } catch (error) {
      status.textContent = error?.message || "Could not load the guest book.";
      list.replaceChildren();
    }
  })();
})();
