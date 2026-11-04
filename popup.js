const CONFIG = globalThis.PROFILE_EXTRACTOR_CONFIG;
const FORMATTER = globalThis.ProfileRowFormatter;

const elements = {
  statusBadge: document.getElementById("statusBadge"),
  pageTitle: document.getElementById("pageTitle"),
  pageUrl: document.getElementById("pageUrl"),
  message: document.getElementById("message"),
  profileUrlerButton: document.getElementById("profileUrlerButton"),
  extractButton: document.getElementById("extractButton"),
  results: document.getElementById("results"),
  resultsDetails: document.getElementById("resultsDetails"),
  fieldCount: document.getElementById("fieldCount"),
  preview: document.getElementById("preview"),
  copyButton: document.getElementById("copyButton")
};

let activeTab = null;
let extractedProfile = null;
let profileUrlerEnabled = false;

function setStatus(label, type = "neutral") {
  elements.statusBadge.textContent = label;
  elements.statusBadge.className = `badge ${type}`;
}

function setMessage(message, type = "") {
  elements.message.textContent = message;
  elements.message.className = `message ${type}`.trim();
}

function isSupportedPageUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function isSupportedListingPageUrl(url) {
  if (!isSupportedPageUrl(url)) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.toLowerCase() === CONFIG.website.profileUrler.hostname &&
      new RegExp(CONFIG.website.profileUrler.listingPathPattern, "i").test(parsedUrl.pathname);
  } catch {
    return false;
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

function renderPreview(profile) {
  elements.preview.replaceChildren();
  elements.resultsDetails.open = false;

  for (const column of CONFIG.fields) {
    const value = profile.data[column.key] || "";
    const row = document.createElement("div");
    row.className = "preview-row";

    const label = document.createElement("div");
    label.className = "preview-label";
    label.textContent = column.label;

    const content = document.createElement("div");
    content.className = `preview-value${value ? "" : " empty"}`;
    content.textContent = value || "Not found";

    row.append(label, content);
    elements.preview.append(row);
  }

  elements.fieldCount.textContent = `${profile.matchedFields}/${profile.totalFields} fields found`;
  elements.results.classList.remove("hidden");
}

async function setProfileUrler(enabled) {
  elements.profileUrlerButton.disabled = true;
  setStatus("Working…");
  setMessage(enabled ? "Generating profile URLs in the member rows…" : "Removing generated profile URLs…");

  try {
    activeTab = await getActiveTab();
    if (!activeTab || !isSupportedListingPageUrl(activeTab.url)) {
      throw new Error("Open an ESN member listing page ending in /alumni, /pending_members, or /members.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["content/extractor.js"]
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (configuration, isEnabled) => {
        if (!globalThis.ProfilePageExtractor?.toggleProfileUrls) {
          throw new Error("The Profile URLer could not be initialized.");
        }
        return globalThis.ProfilePageExtractor.toggleProfileUrls(configuration, isEnabled);
      },
      args: [CONFIG, enabled]
    });

    const result = results?.[0]?.result;
    if (!result) throw new Error("The page did not return Profile URLer results.");

    profileUrlerEnabled = result.enabled;
    elements.profileUrlerButton.textContent = profileUrlerEnabled
      ? "Disable Profile URLer"
      : "Enable Profile URLer";
    setStatus(profileUrlerEnabled ? "URLs added" : "URLs removed", "success");
    setMessage(
      profileUrlerEnabled
        ? `Added ${result.generated} profile URL${result.generated === 1 ? "" : "s"} to ${result.rows} member row${result.rows === 1 ? "" : "s"}.`
        : "Generated profile URLs were removed from the member rows.",
      "success"
    );
  } catch (error) {
    setStatus("Unable to update", "error");
    setMessage(error.message || "An unexpected Profile URLer error occurred.", "error");
  } finally {
    elements.profileUrlerButton.disabled = !isSupportedListingPageUrl(activeTab?.url);
  }
}

async function extractCurrentProfile() {
  elements.extractButton.disabled = true;
  elements.results.classList.add("hidden");
  extractedProfile = null;
  setStatus("Working…");
  setMessage("Reading the currently open page…");

  try {
    activeTab = await getActiveTab();

    if (!activeTab || !isSupportedPageUrl(activeTab.url)) {
      throw new Error("Open an ordinary website profile page in the active tab first.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["content/extractor.js"]
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (configuration) => {
        if (!globalThis.ProfilePageExtractor) {
          throw new Error("The page extractor could not be initialized.");
        }
        return globalThis.ProfilePageExtractor.extract(configuration);
      },
      args: [CONFIG]
    });

    const result = results?.[0]?.result;
    if (!result) throw new Error("The page did not return extraction results.");

    elements.pageTitle.textContent = result.pageTitle || "Untitled page";
    elements.pageUrl.textContent = result.pageUrl || activeTab.url;

    if (!result.isProfilePage) {
      setStatus("Not detected", "error");
      setMessage("This does not look like a supported profile page. Check that you are logged in and viewing an individual profile.", "error");
      return;
    }

    extractedProfile = result;
    renderPreview(result);
    setStatus("Profile detected", "success");
    setMessage("Profile data extracted. Review the values, then copy the spreadsheet row.", "success");
  } catch (error) {
    setStatus("Unable to extract", "error");
    setMessage(error.message || "An unexpected extraction error occurred.", "error");
  } finally {
    elements.extractButton.disabled = false;
  }
}

async function copySpreadsheetRow() {
  if (!extractedProfile) return;

  const spreadsheetOutput = FORMATTER.toSpreadsheet(
    extractedProfile.data,
    CONFIG.outputColumns,
    CONFIG.spreadsheet
  );

  try {
    await navigator.clipboard.writeText(spreadsheetOutput);
    setMessage("Copied! Select the destination cell in Excel or Google Sheets and paste.", "success");
  } catch {
    setMessage("Clipboard access failed. Check Chrome's clipboard permission and try again.", "error");
  }
}

async function initializePopup() {
  activeTab = await getActiveTab();

  if (activeTab) {
    elements.pageTitle.textContent = activeTab.title || "Current tab";
    elements.pageUrl.textContent = activeTab.url || "";
  } else {
    elements.pageTitle.textContent = "No active tab";
    elements.pageUrl.textContent = "";
  }

  elements.profileUrlerButton.disabled = !isSupportedListingPageUrl(activeTab?.url);
}

elements.extractButton.addEventListener("click", extractCurrentProfile);
elements.profileUrlerButton.addEventListener("click", () => setProfileUrler(!profileUrlerEnabled));
elements.copyButton.addEventListener("click", copySpreadsheetRow);
initializePopup();
