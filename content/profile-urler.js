(() => {
  async function applyRememberedProfileUrls() {
    try {
      const { hostname, listingPathPattern } =
        globalThis.PROFILE_EXTRACTOR_CONFIG.website.profileUrler;
      if (location.hostname.toLowerCase() !== hostname ||
          !new RegExp(listingPathPattern, "i").test(location.pathname)) {
        return;
      }

      const settings = await chrome.storage.local.get("esnProfileUrlerEnabled");
      const profileUrlerEnabled = settings.esnProfileUrlerEnabled === true;
      if (!profileUrlerEnabled || !globalThis.ProfilePageExtractor?.toggleProfileUrls) return;

      let applyTimer;
      const applyToRows = () => {
        const rowSelector = globalThis.PROFILE_EXTRACTOR_CONFIG.website.profileUrler.rowSelector;
        const rows = document.querySelectorAll(rowSelector);
        const hasUnprocessedUsername = [...rows].some(row =>
          !row.querySelector("[data-profile-urler-link]") &&
          /\([^()]*\)\s*$/.test(String(row.textContent ?? "").replace(/\s+/g, " ").trim())
        );
        if (!hasUnprocessedUsername) return;

        globalThis.ProfilePageExtractor.toggleProfileUrls(
          globalThis.PROFILE_EXTRACTOR_CONFIG,
          true
        );
      };
      const scheduleApply = () => {
        clearTimeout(applyTimer);
        applyTimer = setTimeout(applyToRows, 100);
      };

      applyToRows();
      const observer = new MutationObserver(scheduleApply);
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
      console.error("Profile URLer could not apply the remembered setting.", error);
    }
  }

  applyRememberedProfileUrls();
})();
