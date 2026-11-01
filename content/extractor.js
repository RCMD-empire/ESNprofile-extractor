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

  globalThis.ProfilePageExtractor = { extract };
})();
