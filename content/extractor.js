/*
 * Runs inside the active profile tab.
 * Receives selectors from the extension popup and returns plain data only.
 */
(() => {
  function readText(selector) {
    if (!selector) return "";
    const element = document.querySelector(selector);
    return element ? cleanText(element.textContent) : "";
  }

  function readLink(selector) {
    if (!selector) return "";
    const element = document.querySelector(selector);
    if (!element) return "";

    const href = element.getAttribute("href");
    if (href) {
      try {
        return new URL(href, document.baseURI).href;
      } catch {
        return href.trim();
      }
    }
    return cleanText(element.textContent);
  }

  function cleanText(value) {
    return String(value ?? "").replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  function isSupportedListingPage(config) {
    const urler = config.website.profileUrler;
    if (!urler || location.hostname.toLowerCase() !== urler.hostname) return false;

    return new RegExp(urler.listingPathPattern, "i").test(location.pathname);
  }

  function profileUrlFromRow(row) {
    const text = cleanText(row.textContent);
    const usernameMatch = text.match(/\(([^()]*)\)\s*$/);
    if (!usernameMatch) return "";

    const username = usernameMatch[1]
      .trim()
      .replace(/[._@]/g, "")
      .replace(/\s+/g, "-");

    return username ? `https://accounts.esn.org/user/${encodeURIComponent(username)}` : "";
  }

  function toggleProfileUrls(config, enabled) {
    if (!isSupportedListingPage(config)) {
      throw new Error("Profile URLer is only available on the supported member listing pages.");
    }

    const rows = document.querySelectorAll(config.website.profileUrler.rowSelector);
    let generated = 0;

    for (const row of rows) {
      row.querySelectorAll("[data-profile-urler-link]").forEach(link => link.remove());
      if (!enabled) continue;

      const profileUrl = profileUrlFromRow(row);
      if (!profileUrl) continue;

      const separator = document.createElement("br");
      separator.dataset.profileUrlerLink = "true";
      const link = document.createElement("a");
      link.href = profileUrl;
      link.textContent = profileUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.dataset.profileUrlerLink = "true";
      link.className = "profile-urler-link";
      row.append(separator, link);
      generated += 1;
    }

    return { enabled, rows: rows.length, generated };
  }

  function extract(config) {
    const signatureMatches = config.website.pageSignatureSelectors
      .filter(selector => document.querySelector(selector)).length;

    const data = {
      name: readText(config.selectors.name),
      username: readText(config.selectors.username),
      email: readText(config.selectors.email),
      linkedin: readLink(config.selectors.linkedin),
      instagram: readLink(config.selectors.instagram),
      facebook: readLink(config.selectors.facebook)
    };

    const matchedFields = Object.values(data).filter(value => value !== "").length;

    return {
      isProfilePage: signatureMatches >= 1 && Boolean(data.username || data.name),
      signatureMatches,
      pageTitle: document.title,
      pageUrl: location.href,
      data,
      matchedFields,
      totalFields: Object.keys(data).length
    };
  }

  globalThis.ProfilePageExtractor = { extract, toggleProfileUrls };
})();
