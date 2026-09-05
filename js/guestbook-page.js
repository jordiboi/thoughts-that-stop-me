(() => {
  const status = document.querySelector("#guestbook-page-status");
  const list = document.querySelector("#guestbook-page-list");
  document.querySelector("#guestbook-back").addEventListener("click", () => {
    if (history.length > 1) history.back(); else location.href = "index.html";
  });
  const deny = (message) => {
    status.textContent = message || "Leave a signature first to visit the guest book.";
    list.replaceChildren();
  };
  (async () => {
    try {
      const response = await fetch("js/data/site-settings.json", { cache: "no-store" });
      const settings = await response.json();
      const cfg = settings.guestbook || {};
      if (!cfg.supabaseUrl || !cfg.publishableKey) throw new Error("The guest book is not connected yet.");
      const client = window.supabase.createClient(String(cfg.supabaseUrl).replace(/\/+$/, ""), cfg.publishableKey);
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session?.user) return deny();
      const { data, error } = await client.rpc("guestbook_public_entries");
      if (error) throw error;
      if (!Array.isArray(data)) return deny();
      status.textContent = data.length ? `${data.length} signature${data.length === 1 ? "" : "s"}` : "No signatures yet.";
      data.forEach((entry) => {
        const row = document.createElement("div"); row.className = "guestbook-page-entry";
        const sig = document.createElement("p"); sig.textContent = entry.signature || "";
        const time = document.createElement("time");
        const d = entry.created_at ? new Date(entry.created_at) : null;
        time.textContent = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : "";
        row.append(sig, time); list.appendChild(row);
      });
    } catch (error) {
      const msg = String(error?.message || "");
      if (msg.includes("SIGNATURE_REQUIRED") || msg.includes("BANNED")) deny("Leave a signature first to visit the guest book.");
      else status.textContent = msg || "Could not load the guest book.";
    }
  })();
})();
