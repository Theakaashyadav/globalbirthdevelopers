import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ORIGIN = "https://globalbirthdevelopers.com";
const CANONICAL_HOST = "globalbirthdevelopers.com";
const SHARED_FRAGMENTS = ["header.html", "footer.html", "floating.html"];
const SHARED_NAV_FRAGMENTS = ["header.html", "footer.html"];
const errors = [];
const warnings = [];

const addError = (area, subject, message) => errors.push({ area, subject, message });
const addWarning = (area, subject, message) => warnings.push({ area, subject, message });

const decode = (value = "") => value
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, "\"")
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    try {
      return String.fromCodePoint(Number.parseInt(hex, 16));
    } catch {
      return match;
    }
  })
  .replace(/&#([0-9]+);/g, (match, decimal) => {
    try {
      return String.fromCodePoint(Number.parseInt(decimal, 10));
    } catch {
      return match;
    }
  });

const attributeEntries = (tag) => {
  const result = [];
  const body = tag
    .replace(/^<\s*\/?\s*[^\s>]+/, "")
    .replace(/\/?\s*>$/, "");
  const pattern = /([^\s=<>/"'\x60]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+)))?/g;
  let match;
  while ((match = pattern.exec(body))) {
    result.push({
      name: match[1].toLowerCase(),
      value: decode(match[2] ?? match[3] ?? match[4] ?? "")
    });
  }
  return result;
};
const attrs = (tag) => {
  const result = {};
  for (const attribute of attributeEntries(tag)) {
    if (!(attribute.name in result)) result[attribute.name] = attribute.value;
  }
  return result;
};

const tagEntries = (html, name) => {
  const pattern = new RegExp("<" + name + "\\b[^>]*>", "gi");
  return [...html.matchAll(pattern)].map((match) => ({
    tag: match[0],
    attrs: attrs(match[0]),
    index: match.index ?? 0
  }));
};

const pairedTagEntries = (html, name) => {
  const pattern = new RegExp("<" + name + "\\b[^>]*>([\\s\\S]*?)</" + name + ">", "gi");
  return [...html.matchAll(pattern)].map((match) => ({
    tag: match[0],
    openTag: match[0].slice(0, match[0].indexOf(">") + 1),
    attrs: attrs(match[0].slice(0, match[0].indexOf(">") + 1)),
    inner: match[1],
    index: match.index ?? 0
  }));
};

const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, "");
const markupOnly = (html) => stripComments(html)
  .replace(/<script\b[\s\S]*?<\/script>/gi, "")
  .replace(/<style\b[\s\S]*?<\/style>/gi, "");
const textOnly = (html) => decode(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const firstContent = (html, name) => textOnly(pairedTagEntries(stripComments(html), name)[0]?.inner ?? "");
const elementInner = (html, name) => pairedTagEntries(html, name)[0]?.inner ?? "";
const hasToken = (value, token) => (value ?? "").toLowerCase().split(/[\s,]+/).includes(token);
const canonicalFor = (filename) => filename === "index.html" ? ORIGIN + "/" : ORIGIN + "/" + filename;

const metaValues = (page, attribute, key) => page.metaTags
  .filter((entry) => (entry.attrs[attribute] ?? "").toLowerCase() === key.toLowerCase())
  .map((entry) => (entry.attrs.content ?? "").trim());
const metaValue = (page, attribute, key) => metaValues(page, attribute, key)[0] ?? "";
const linkValues = (page, rel) => page.linkTags
  .filter((entry) => (entry.attrs.rel ?? "").toLowerCase().split(/\s+/).includes(rel.toLowerCase()))
  .map((entry) => (entry.attrs.href ?? "").trim());

const isoTodayInIndia = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return value.year + "-" + value.month + "-" + value.day;
};
const TODAY = isoTodayInIndia();

const validIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

const walkFiles = (directory, relative = "") => {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && (entry.name.startsWith(".") || entry.name === "node_modules")) continue;
    const relativePath = path.posix.join(relative, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walkFiles(absolutePath, relativePath));
    if (entry.isFile()) found.push(relativePath);
  }
  return found;
};

const allFiles = walkFiles(ROOT);
const exactFiles = new Set(allFiles);
const lowerFileMap = new Map();
for (const filename of allFiles) {
  const lower = filename.toLowerCase();
  lowerFileMap.set(lower, [...(lowerFileMap.get(lower) ?? []), filename]);
}
for (const [lower, filenames] of lowerFileMap) {
  if (filenames.length > 1) {
    addError("files", lower, "case-insensitive filename collision: " + filenames.join(", "));
  }
}

const rootHtmlFiles = fs.readdirSync(ROOT)
  .filter((name) => name.toLowerCase().endsWith(".html") && fs.statSync(path.join(ROOT, name)).isFile())
  .sort((a, b) => a.localeCompare(b));

const pages = rootHtmlFiles.map((filename) => {
  const html = fs.readFileSync(path.join(ROOT, filename), "utf8");
  const markup = markupOnly(html);
  const metaTags = tagEntries(markup, "meta");
  const linkTags = tagEntries(markup, "link");
  const title = firstContent(markup, "title");
  const robots = metaTags
    .filter((entry) => (entry.attrs.name ?? "").toLowerCase() === "robots")
    .map((entry) => entry.attrs.content ?? "")
    .join(",")
    .toLowerCase();
  const googlebot = metaTags
    .filter((entry) => (entry.attrs.name ?? "").toLowerCase() === "googlebot")
    .map((entry) => entry.attrs.content ?? "")
    .join(",")
    .toLowerCase();
  const canonical = linkTags
    .filter((entry) => (entry.attrs.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"))
    .map((entry) => entry.attrs.href ?? "")[0] ?? "";
  const publicPage = !SHARED_FRAGMENTS.includes(filename);
  const indexDirectives = robots + "," + googlebot;
  const noindex = hasToken(indexDirectives, "noindex") || hasToken(indexDirectives, "none");
  return {
    filename,
    html,
    markup,
    metaTags,
    linkTags,
    title,
    description: metaTags.find((entry) => (entry.attrs.name ?? "").toLowerCase() === "description")?.attrs.content ?? "",
    robots,
    googlebot,
    canonical,
    publicPage,
    indexable: publicPage && filename !== "404.html" && !noindex,
    schemaNodes: [],
    schemaTypes: new Set(),
    schemaModified: "",
    articlePublished: ""
  };
});

const pageByFilename = new Map(pages.map((page) => [page.filename.toLowerCase(), page]));
const publicPages = pages.filter((page) => page.publicPage);
const indexablePages = pages.filter((page) => page.indexable);

const collectSchemaNodes = (value, result = [], seen = new Set()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return result;
  seen.add(value);
  if (!Array.isArray(value) && value["@type"]) result.push(value);
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaNodes(item, result, seen);
  } else {
    for (const item of Object.values(value)) collectSchemaNodes(item, result, seen);
  }
  return result;
};

const schemaTypesFor = (node) => {
  const value = node?.["@type"];
  return Array.isArray(value) ? value : value ? [value] : [];
};

const hasSchemaOrgContext = (document) => {
  const roots = Array.isArray(document) ? document : [document];
  return roots.length > 0 && roots.every((root) => {
    const context = root && typeof root === "object" ? root["@context"] : null;
    const values = Array.isArray(context) ? context : [context];
    return values.some((value) => {
      if (typeof value === "string") return /^https?:\/\/schema\.org\/?$/i.test(value);
      return value && typeof value === "object" && /^https?:\/\/schema\.org\/?$/i.test(value["@vocab"] ?? "");
    });
  });
};

for (const page of pages) {
  const scripts = pairedTagEntries(stripComments(page.html), "script")
    .filter((entry) => (entry.attrs.type ?? "").toLowerCase() === "application/ld+json");
  for (const [index, script] of scripts.entries()) {
    try {
      const parsed = JSON.parse(script.inner);
      if (!hasSchemaOrgContext(parsed)) {
        addError("schema", page.filename, "JSON-LD block " + (index + 1) + " is missing a Schema.org @context");
      }
      page.schemaNodes.push(...collectSchemaNodes(parsed));
    } catch (error) {
      addError("schema", page.filename, "invalid JSON-LD block " + (index + 1) + " (" + error.message + ")");
    }
  }
  for (const node of page.schemaNodes) {
    for (const type of schemaTypesFor(node)) page.schemaTypes.add(type);
  }
  const canonicalSchemaNodes = page.schemaNodes.filter((node) => {
    if (!page.canonical) return false;
    const url = node.url ?? "";
    const id = node["@id"] ?? "";
    return url === page.canonical || id === page.canonical || String(id).startsWith(page.canonical + "#");
  });
  const primaryPageTypes = /^blog-.+\.html$/i.test(page.filename)
    ? ["BlogPosting"]
    : page.filename === "blogs.html"
      ? ["CollectionPage"]
      : ["AboutPage", "ContactPage", "WebPage", "CollectionPage"];
  const intendedPrimaryNodes = page.schemaNodes.filter((node) =>
    schemaTypesFor(node).some((type) => primaryPageTypes.includes(type)));
  if (intendedPrimaryNodes.length > 1) {
    addError("schema", page.filename, "multiple primary page-schema nodes; expected at most one");
  }
  if (intendedPrimaryNodes.length === 1 && !canonicalSchemaNodes.includes(intendedPrimaryNodes[0])) {
    addError("schema", page.filename, "primary page-schema node does not identify the page canonical");
  }
  if (intendedPrimaryNodes.length === 1
      && Object.hasOwn(intendedPrimaryNodes[0], "dateModified")
      && !validIsoDate(intendedPrimaryNodes[0].dateModified ?? "")) {
    addError("schema", page.filename, "primary page-schema dateModified must be YYYY-MM-DD when present");
  }
  const primaryNode = intendedPrimaryNodes.length === 1
    && canonicalSchemaNodes.includes(intendedPrimaryNodes[0])
    && validIsoDate(intendedPrimaryNodes[0].dateModified ?? "")
    ? intendedPrimaryNodes[0]
    : undefined;
  page.schemaModified = primaryNode?.dateModified ?? "";
  const article = page.schemaNodes.find((node) => schemaTypesFor(node).includes("BlogPosting"));
  page.articlePublished = article?.datePublished ?? metaValue(page, "property", "article:published_time");
}

const validAbsoluteHttps = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const validateMediaReference = (area, subject, label, value) => {
  if (!value) return;
  let url;
  try {
    url = new URL(value);
  } catch {
    addError(area, subject, label + " is not an absolute URL: " + value);
    return;
  }
  if (url.protocol !== "https:") addError(area, subject, label + " must use HTTPS: " + value);
  const hostname = url.hostname.toLowerCase();
  if (![CANONICAL_HOST, "www." + CANONICAL_HOST].includes(hostname)) return;
  if (hostname !== CANONICAL_HOST) addError(area, subject, label + " uses the www origin: " + value);

  let relative;
  try {
    relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  } catch {
    addError(area, subject, label + " contains an invalid encoded path: " + value);
    return;
  }
  if (!relative || relative.endsWith("/")) {
    addError(area, subject, label + " must reference a file: " + value);
    return;
  }
  relative = path.posix.normalize(relative);
  const candidates = lowerFileMap.get(relative.toLowerCase()) ?? [];
  if (!exactFiles.has(relative) && candidates.length === 0) {
    addError(area, subject, label + " references a missing same-origin file: " + value);
  } else if (!exactFiles.has(relative) && candidates.length === 1) {
    addError(area, subject, label + " path case differs from disk: " + value + " -> " + candidates[0]);
  }
};

const validateCoreMetadata = (page) => {
  const subject = page.filename;
  if (!/^<!doctype\s+html>/i.test(page.html.trimStart())) addError("document", subject, "missing HTML5 doctype");

  const htmlTag = tagEntries(page.markup, "html")[0];
  if (!htmlTag?.attrs.lang) addError("document", subject, "missing html lang attribute");

  const charsets = page.metaTags.filter((entry) => "charset" in entry.attrs);
  if (charsets.length !== 1 || (charsets[0]?.attrs.charset ?? "").toLowerCase() !== "utf-8") {
    addError("metadata", subject, "expected one UTF-8 charset declaration");
  }

  const viewport = metaValues(page, "name", "viewport");
  if (viewport.length !== 1 || !/width\s*=\s*device-width/i.test(viewport[0])) {
    addError("metadata", subject, "expected one mobile viewport declaration");
  }

  const titleTags = pairedTagEntries(page.markup, "title");
  if (titleTags.length !== 1 || !page.title) addError("metadata", subject, "expected one non-empty title");
  if (page.title && (page.title.length < 25 || page.title.length > 65)) {
    addWarning("metadata", subject, "title length is " + page.title.length + " characters (review SERP clarity)");
  }

  const descriptions = metaValues(page, "name", "description");
  if (descriptions.length !== 1 || !descriptions[0]) addError("metadata", subject, "expected one non-empty meta description");
  if (descriptions[0] && (descriptions[0].length < 70 || descriptions[0].length > 170)) {
    addWarning("metadata", subject, "meta description length is " + descriptions[0].length + " characters");
  }

  const robotsValues = metaValues(page, "name", "robots");
  if (robotsValues.length !== 1 || !robotsValues[0]) addError("indexability", subject, "expected one robots meta directive");
  const robotsTokens = robotsValues.flatMap((value) => value.toLowerCase().split(/[\s,]+/));
  if (robotsTokens.includes("index") && (robotsTokens.includes("noindex") || robotsTokens.includes("none"))) {
    addError("indexability", subject, "robots meta contains conflicting index/noindex directives");
  }
  const googlebotValues = metaValues(page, "name", "googlebot");
  if (googlebotValues.length > 1) addError("indexability", subject, "multiple googlebot meta directives");
  const googlebotTokens = googlebotValues.flatMap((value) => value.toLowerCase().split(/[\s,]+/));
  if (googlebotTokens.includes("index") && (googlebotTokens.includes("noindex") || googlebotTokens.includes("none"))) {
    addError("indexability", subject, "googlebot meta contains conflicting index/noindex directives");
  }
  if (robotsTokens.includes("index") && (googlebotTokens.includes("noindex") || googlebotTokens.includes("none"))) {
    addWarning("indexability", subject, "googlebot-specific noindex overrides the generic index directive");
  }
  if (["404.html", "gallery.html"].includes(subject)
      && ![...robotsTokens, ...googlebotTokens].some((token) => ["noindex", "none"].includes(token))) {
    addError("indexability", subject, "must remain noindex");
  }

  const h1s = pairedTagEntries(page.markup, "h1").map((entry) => textOnly(entry.inner)).filter(Boolean);
  if (h1s.length !== 1) addError("headings", subject, "expected one non-empty H1, found " + h1s.length);

  const mainCount = tagEntries(page.markup, "main").length;
  if (mainCount !== 1) {
    const add = page.indexable ? addError : addWarning;
    add("semantics", subject, "expected one main landmark, found " + mainCount);
  }

  if (/\bREPLACE_[A-Z0-9_-]+\b/.test(page.html)) {
    addError("publishing", subject, "contains an unreplaced template placeholder");
  }

  if (!page.indexable) return;

  const canonicals = linkValues(page, "canonical");
  if (canonicals.length !== 1 || !canonicals[0]) addError("canonical", subject, "expected one canonical link");
  if (page.canonical && page.canonical !== canonicalFor(subject)) {
    addError("canonical", subject, "canonical is " + page.canonical + "; expected " + canonicalFor(subject));
  }
  if (page.canonical && !validAbsoluteHttps(page.canonical)) {
    addError("canonical", subject, "canonical must be an absolute HTTPS URL");
  }

  const requiredOg = ["og:type", "og:locale", "og:site_name", "og:title", "og:description", "og:url"];
  for (const property of requiredOg) {
    const values = metaValues(page, "property", property);
    if (values.length !== 1 || !values[0]) addError("social", subject, "expected one non-empty " + property + " tag");
  }
  const ogUrl = metaValue(page, "property", "og:url");
  if (ogUrl && ogUrl !== page.canonical) addError("social", subject, "og:url does not match canonical");
  const ogImage = metaValue(page, "property", "og:image");
  if (ogImage) validateMediaReference("social", subject, "og:image", ogImage);
  if (!ogImage) addWarning("social", subject, "og:image is not set");
  if (ogImage && !metaValue(page, "property", "og:image:alt")) addWarning("social", subject, "og:image:alt is not set");

  const requiredTwitter = ["twitter:card", "twitter:title", "twitter:description"];
  for (const name of requiredTwitter) {
    const values = metaValues(page, "name", name);
    if (values.length !== 1 || !values[0]) addError("social", subject, "expected one non-empty " + name + " tag");
  }
  const twitterCard = metaValue(page, "name", "twitter:card");
  if (twitterCard && !["summary", "summary_large_image"].includes(twitterCard)) {
    addError("social", subject, "unsupported twitter:card value " + twitterCard);
  }
  const twitterImage = metaValue(page, "name", "twitter:image");
  if (twitterImage) validateMediaReference("social", subject, "twitter:image", twitterImage);
  if (twitterCard === "summary_large_image" && !twitterImage) addError("social", subject, "summary_large_image card is missing twitter:image");
  if (twitterImage && !metaValue(page, "name", "twitter:image:alt")) {
    addWarning("social", subject, "twitter:image:alt is not set");
  }

  if (metaValue(page, "property", "og:type") === "article") {
    const publishedValues = metaValues(page, "property", "article:published_time");
    const modifiedValues = metaValues(page, "property", "article:modified_time");
    const published = publishedValues[0] ?? "";
    const modified = modifiedValues[0] ?? "";
    if (publishedValues.length !== 1) addError("freshness", subject, "expected exactly one article:published_time tag");
    if (modifiedValues.length !== 1) addError("freshness", subject, "expected exactly one article:modified_time tag");
    if (!validIsoDate(published)) addError("freshness", subject, "article:published_time must be YYYY-MM-DD");
    if (!validIsoDate(modified)) addError("freshness", subject, "article:modified_time must be YYYY-MM-DD");
    if (validIsoDate(published) && published > TODAY) addError("freshness", subject, "article publication date is in the future");
    if (validIsoDate(published) && validIsoDate(modified) && modified < published) {
      addError("freshness", subject, "article modified date precedes publication date");
    }
    if (validIsoDate(modified) && modified > TODAY) addError("freshness", subject, "article modified date is in the future");
  }
};

const idInventory = (markup) => {
  const counts = new Map();
  for (const match of markup.matchAll(/<[a-z][^>]*>/gi)) {
    const attributes = attrs(match[0]);
    if (!("id" in attributes)) continue;
    const id = attributes.id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
};

const isNestedInLabel = (markup, index) => {
  const before = markup.slice(0, index).toLowerCase();
  return before.lastIndexOf("<label") > before.lastIndexOf("</label>");
};

const hasAccessibleName = (entry, ids) => {
  if ((entry.attrs["aria-label"] ?? "").trim()) return true;
  if ((entry.attrs.title ?? "").trim()) return true;
  const labelledBy = (entry.attrs["aria-labelledby"] ?? "").trim().split(/\s+/).filter(Boolean);
  if (labelledBy.length && labelledBy.every((id) => ids.has(id))) return true;
  if (textOnly(entry.inner ?? "")) return true;
  return tagEntries(entry.inner ?? "", "img").some((image) => (image.attrs.alt ?? "").trim());
};

const summarizeReferences = (references) => {
  const unique = [...new Set(references)];
  const sample = unique.slice(0, 2).join(", ");
  return unique.length + " image(s)" + (sample ? " (for example: " + sample + ")" : "");
};

const validateAccessibilityAndImages = (document) => {
  const subject = document.filename;
  const markup = document.markup;
  const ids = idInventory(markup);
  for (const match of markup.matchAll(/<[a-z][^>]*>/gi)) {
    const idAttributes = attributeEntries(match[0]).filter((attribute) => attribute.name === "id");
    if (idAttributes.length > 1) addError("accessibility", subject, "element contains duplicate id attributes");
  }
  for (const [id, count] of ids) {
    if (id && count > 1) addError("accessibility", subject, "duplicate id " + id + " appears " + count + " times");
  }

  for (const match of markup.matchAll(/<[a-z][^>]*>/gi)) {
    const attributes = attrs(match[0]);
    if (!("aria-labelledby" in attributes)) continue;
    const references = attributes["aria-labelledby"].split(/\s+/).filter(Boolean);
    for (const reference of references) {
      if (!ids.has(reference)) addError("accessibility", subject, "aria-labelledby references missing id " + reference);
    }
  }

  const skipLinks = pairedTagEntries(markup, "a")
    .filter((entry) => hasToken(entry.attrs.class, "skip-link"));
  const mainEntries = pairedTagEntries(markup, "main");
  const mainTargetIds = new Set();
  if (mainEntries.length === 1) {
    if (mainEntries[0].attrs.id) mainTargetIds.add(mainEntries[0].attrs.id);
    for (const id of idInventory(mainEntries[0].inner).keys()) mainTargetIds.add(id);
  }
  if (document.publicPage) {
    if (!skipLinks.length) {
      addWarning("accessibility", subject, "missing keyboard skip link");
    } else {
      for (const skip of skipLinks) {
        const href = skip.attrs.href ?? "";
        if (!href.startsWith("#") || href.length === 1) {
          addError("accessibility", subject, "skip link must reference a local fragment target");
        } else {
          let target = href.slice(1);
          try {
            target = decodeURIComponent(target);
          } catch {
            addError("accessibility", subject, "skip link has an invalid encoded target " + href);
          }
          if (target && !ids.has(target)) {
            addError("accessibility", subject, "skip-link target #" + target + " does not exist");
          } else if (target && mainEntries.length === 1 && !mainTargetIds.has(target)) {
            addError("accessibility", subject, "skip-link target #" + target + " is outside the main landmark");
          }
        }
      }
    }
  }

  const labelEntries = tagEntries(markup, "label");
  const labelFor = new Set(labelEntries.map((entry) => entry.attrs.for).filter(Boolean));
  const formControlIds = new Set(["button", "input", "meter", "output", "progress", "select", "textarea"]
    .flatMap((name) => tagEntries(markup, name))
    .map((entry) => entry.attrs.id)
    .filter(Boolean));
  for (const label of labelEntries) {
    if (label.attrs.for && !formControlIds.has(label.attrs.for)) {
      addError("forms", subject, "label references missing form control #" + label.attrs.for);
    }
  }
  for (const elementName of ["input", "select", "textarea"]) {
    for (const entry of tagEntries(markup, elementName)) {
      const type = (entry.attrs.type ?? "").toLowerCase();
      if (elementName === "input" && ["hidden", "button", "submit", "reset"].includes(type)) continue;
      const labelledBy = (entry.attrs["aria-labelledby"] ?? "").split(/\s+/).filter(Boolean);
      const labelled = Boolean((entry.attrs["aria-label"] ?? "").trim())
        || (labelledBy.length > 0 && labelledBy.every((id) => ids.has(id)))
        || Boolean(entry.attrs.id && labelFor.has(entry.attrs.id))
        || isNestedInLabel(markup, entry.index)
        || (elementName === "input" && type === "image" && Boolean((entry.attrs.alt ?? "").trim()));
      if (!labelled) {
        const identifier = entry.attrs.name ?? entry.attrs.id ?? "(unnamed)";
        addError("forms", subject, elementName + " " + identifier + " has no associated label or accessible name");
      }
      if (elementName === "input" && type === "image" && !(entry.attrs.alt ?? "").trim()) {
        addError("forms", subject, "input type=image requires non-empty alt text");
      }
      if (elementName === "input" && type === "image" && !(entry.attrs.src ?? "").trim()) {
        addError("forms", subject, "input type=image requires a non-empty src");
      }
    }
  }

  for (const elementName of ["a", "button"]) {
    for (const entry of pairedTagEntries(markup, elementName)) {
      if (!hasAccessibleName(entry, ids)) {
        addError("accessibility", subject, elementName + " element has no accessible name");
      }
      if (entry.attrs.target === "_blank" && !hasToken(entry.attrs.rel, "noopener")) {
        addError("security", subject, "target=_blank link missing noopener: " + (entry.attrs.href ?? "unknown URL"));
      }
    }
  }

  const missingDimensions = [];
  const missingDecoding = [];
  for (const image of tagEntries(markup, "img")) {
    const source = image.attrs.src ?? "(missing src)";
    if ("src" in image.attrs && !image.attrs.src.trim()) addError("images", subject, "image has an empty src attribute");
    if (!("src" in image.attrs)) addWarning("images", subject, "image has no initial src (confirm it is populated dynamically): " + source);
    if (!("alt" in image.attrs)) addError("images", subject, "image missing alt attribute: " + source);
    if (!/^[1-9]\d*$/.test(image.attrs.width ?? "") || !/^[1-9]\d*$/.test(image.attrs.height ?? "")) missingDimensions.push(source);
    if (!image.attrs.decoding) missingDecoding.push(source);
    if (image.attrs.decoding && !["async", "sync", "auto"].includes(image.attrs.decoding.toLowerCase())) {
      addWarning("images", subject, "invalid decoding value on " + source);
    }
    if (image.attrs.loading && !["lazy", "eager"].includes(image.attrs.loading.toLowerCase())) {
      addWarning("images", subject, "invalid loading value on " + source);
    }
  }
  if (missingDimensions.length) addWarning("images", subject, summarizeReferences(missingDimensions) + " missing intrinsic width/height");
  if (missingDecoding.length) addWarning("images", subject, summarizeReferences(missingDecoding) + " missing a decoding hint");

  for (const iframe of tagEntries(markup, "iframe")) {
    if (!(iframe.attrs.title ?? "").trim()) addWarning("accessibility", subject, "iframe missing a title attribute: " + (iframe.attrs.src ?? "unknown source"));
  }
};

const walkSchemaUrls = (value, callback, seen = new Set()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) walkSchemaUrls(item, callback, seen);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (["@id", "url", "item"].includes(key) && typeof item === "string") callback(key, item);
    walkSchemaUrls(item, callback, seen);
  }
};

const collectSchemaMediaUrls = (value, result = new Set(), mediaContext = false, seen = new Set()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return result;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      if (mediaContext && typeof item === "string") result.add(item);
      else collectSchemaMediaUrls(item, result, mediaContext, seen);
    }
    return result;
  }
  for (const [key, item] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    const keyStartsMedia = ["image", "logo", "thumbnailurl", "contenturl", "primaryimageofpage"].includes(normalizedKey);
    const nextMediaContext = mediaContext || keyStartsMedia;
    if (typeof item === "string" && (keyStartsMedia || (mediaContext && ["url", "contenturl"].includes(normalizedKey)))) {
      result.add(item);
    }
    if (item && typeof item === "object") collectSchemaMediaUrls(item, result, nextMediaContext, seen);
  }
  return result;
};

const validateSchema = (page) => {
  if (!page.indexable) return;
  const subject = page.filename;
  const isBlogArticle = /^blog-.+\.html$/i.test(subject);
  if (!page.schemaNodes.length) {
    addWarning("schema", subject, "no JSON-LD structured data");
  }

  for (const node of page.schemaNodes) {
    walkSchemaUrls(node, (key, value) => {
      if (!/^https?:\/\//i.test(value)) {
        addError("schema", subject, key + " must be an absolute URL: " + value);
        return;
      }
      try {
        const url = new URL(value);
        if (url.hostname === "www." + CANONICAL_HOST || (url.hostname === CANONICAL_HOST && url.protocol !== "https:")) {
          addError("schema", subject, key + " uses a non-canonical origin: " + value);
        }
        if (url.hostname === CANONICAL_HOST && url.pathname.toLowerCase() === "/index.html") {
          addWarning("schema", subject, key + " uses duplicate homepage URL /index.html");
        }
        if (url.hostname === CANONICAL_HOST) {
          let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
          if (!relative || relative.endsWith("/")) relative += "index.html";
          relative = path.posix.normalize(relative);
          const candidates = lowerFileMap.get(relative.toLowerCase()) ?? [];
          if (!exactFiles.has(relative) && candidates.length === 0) {
            addError("schema", subject, key + " references a missing same-origin path: " + value);
          } else if (!exactFiles.has(relative) && candidates.length === 1) {
            addError("schema", subject, key + " path case differs from disk: " + value + " -> " + candidates[0]);
          }
        }
      } catch {
        addError("schema", subject, key + " is not a valid URL: " + value);
      }
    });
  }
  const schemaMediaUrls = new Set();
  for (const node of page.schemaNodes) collectSchemaMediaUrls(node, schemaMediaUrls);
  for (const value of schemaMediaUrls) validateMediaReference("schema", subject, "structured-data image", value);

  if (isBlogArticle) {
    if (metaValue(page, "property", "og:type") !== "article") {
      addError("social", subject, "blog articles must use og:type=article");
    }
    const articles = page.schemaNodes.filter((node) => schemaTypesFor(node).includes("BlogPosting"));
    const breadcrumbs = page.schemaNodes.filter((node) => schemaTypesFor(node).includes("BreadcrumbList"));
    const article = articles[0];
    const breadcrumb = breadcrumbs[0];
    const visibleH1 = firstContent(page.markup, "h1");
    const titleYears = page.title.match(/\b20\d{2}\b/g) ?? [];
    for (const year of titleYears) {
      if (!visibleH1.includes(year)) {
        addWarning("freshness", subject, "title adds " + year + " without matching visible year-specific scope; manually verify it is not year-only freshness");
      }
    }
    if (articles.length !== 1) addError("schema", subject, "blog article requires exactly one BlogPosting; found " + articles.length);
    if (breadcrumbs.length !== 1) addError("schema", subject, "blog article requires exactly one BreadcrumbList; found " + breadcrumbs.length);
    if (article) {
      for (const field of ["headline", "description", "inLanguage"]) {
        if (typeof article[field] !== "string" || !article[field].trim()) addError("schema", subject, "BlogPosting is missing " + field);
      }
      const articleImages = collectSchemaMediaUrls({ image: article.image });
      if (!article.image || (Array.isArray(article.image) && article.image.length === 0) || !articleImages.size) {
        addError("schema", subject, "BlogPosting is missing a usable image URL");
      }
      if (!article.author || !(article.author.name ?? "").trim()) addError("schema", subject, "BlogPosting author requires a name");
      if (!article.publisher || !(article.publisher.name ?? "").trim()) addError("schema", subject, "BlogPosting publisher requires a name");
      if (article["@id"] !== page.canonical + "#article") addError("schema", subject, "BlogPosting @id must be canonical#article");
      if ((article.headline ?? "") !== visibleH1) addWarning("schema", subject, "BlogPosting headline does not exactly match the visible H1");
      const entity = article.mainEntityOfPage;
      const entityId = typeof entity === "string" ? entity : entity?.["@id"];
      if (entityId !== page.canonical) addError("schema", subject, "BlogPosting mainEntityOfPage does not match canonical");
      for (const field of ["datePublished", "dateModified"]) {
        if (!validIsoDate(article[field] ?? "")) addError("schema", subject, "BlogPosting " + field + " must be YYYY-MM-DD");
        if (validIsoDate(article[field] ?? "") && article[field] > TODAY) addError("schema", subject, "BlogPosting " + field + " is in the future");
      }
      if (article.dateModified && article.datePublished && article.dateModified < article.datePublished) {
        addError("schema", subject, "BlogPosting dateModified precedes datePublished");
      }
      const publishedMeta = metaValue(page, "property", "article:published_time");
      const modifiedMeta = metaValue(page, "property", "article:modified_time");
      if (!validIsoDate(publishedMeta)) addError("freshness", subject, "article:published_time must be YYYY-MM-DD");
      if (!validIsoDate(modifiedMeta)) addError("freshness", subject, "article:modified_time must be YYYY-MM-DD");
      if (validIsoDate(publishedMeta) && article.datePublished !== publishedMeta) addError("schema", subject, "published date differs between metadata and JSON-LD");
      if (validIsoDate(modifiedMeta) && article.dateModified !== modifiedMeta) addError("schema", subject, "modified date differs between metadata and JSON-LD");
      const visibleDates = tagEntries(page.markup, "time").map((entry) => entry.attrs.datetime).filter(Boolean);
      if (article.datePublished && !visibleDates.includes(article.datePublished)) addError("freshness", subject, "published date is not exposed in a visible time element");
      if (article.dateModified !== article.datePublished && article.dateModified && !visibleDates.includes(article.dateModified)) {
        addError("freshness", subject, "modified date is not exposed in a visible time element");
      }
    }
    if (breadcrumb) {
      const items = Array.isArray(breadcrumb.itemListElement) ? breadcrumb.itemListElement : [];
      if (items.length < 2) addError("schema", subject, "BreadcrumbList requires at least two items");
      items.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          addError("schema", subject, "BreadcrumbList entry " + (index + 1) + " must be an object");
          return;
        }
        if (!schemaTypesFor(item).includes("ListItem")) addError("schema", subject, "BreadcrumbList entry " + (index + 1) + " must be a ListItem");
        if (item.position !== index + 1) addError("schema", subject, "BreadcrumbList positions are not contiguous");
        if (typeof item.name !== "string" || !item.name.trim()) addError("schema", subject, "BreadcrumbList entry " + (index + 1) + " is missing name");
        if (typeof item.item !== "string" || !item.item.trim()) addError("schema", subject, "BreadcrumbList entry " + (index + 1) + " is missing item URL");
      });
      if (items[0]?.item !== ORIGIN + "/") addError("schema", subject, "first BreadcrumbList item must be the canonical homepage");
      const lastItem = items[items.length - 1]?.item;
      if (lastItem !== page.canonical) addError("schema", subject, "final BreadcrumbList item does not match canonical");
    }
  }

  if (subject === "blogs.html") {
    const collections = page.schemaNodes.filter((node) => schemaTypesFor(node).includes("CollectionPage"));
    const discoveredItemLists = page.schemaNodes.filter((node) => schemaTypesFor(node).includes("ItemList"));
    const collection = collections[0];
    const discoveredItemList = discoveredItemLists[0];
    let linkedItemList;
    if (collection) {
      const mainEntity = collection.mainEntity;
      if (mainEntity && typeof mainEntity === "object" && schemaTypesFor(mainEntity).includes("ItemList")) {
        linkedItemList = mainEntity;
      } else {
        const mainEntityId = typeof mainEntity === "string" ? mainEntity : mainEntity?.["@id"];
        if (mainEntityId) {
          linkedItemList = page.schemaNodes.find((node) =>
            schemaTypesFor(node).includes("ItemList") && node["@id"] === mainEntityId);
        }
      }
    }
    const itemList = linkedItemList ?? discoveredItemList;
    if (collections.length !== 1) addError("schema", subject, "requires exactly one CollectionPage; found " + collections.length);
    if (discoveredItemLists.length !== 1) addError("schema", subject, "requires exactly one ItemList; found " + discoveredItemLists.length);
    if (collection && !linkedItemList) addError("schema", subject, "CollectionPage mainEntity must link to the ItemList");
    if (collection && collection["@id"] !== page.canonical + "#collection") {
      addError("schema", subject, "CollectionPage @id must be canonical#collection");
    }
    if (collection && collection.url !== page.canonical) addError("schema", subject, "CollectionPage URL must match canonical");
    if (collection && !validIsoDate(collection.dateModified ?? "")) {
      addError("schema", subject, "CollectionPage dateModified must be YYYY-MM-DD");
    }
    if (collection && validIsoDate(collection.dateModified ?? "") && collection.dateModified > TODAY) {
      addError("schema", subject, "CollectionPage dateModified is in the future");
    }
    if (itemList) {
      const items = Array.isArray(itemList.itemListElement) ? itemList.itemListElement : [];
      if (itemList.numberOfItems !== items.length) addError("schema", subject, "ItemList numberOfItems does not match itemListElement length");
      items.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          addError("schema", subject, "ItemList entry " + (index + 1) + " must be an object");
          return;
        }
        if (!schemaTypesFor(item).includes("ListItem")) addError("schema", subject, "ItemList entry " + (index + 1) + " must be a ListItem");
        if (item.position !== index + 1) addError("schema", subject, "ItemList positions are not contiguous");
        if (typeof item.name !== "string" || !item.name.trim()) addError("schema", subject, "ItemList entry " + (index + 1) + " is missing name");
        if (typeof item.url !== "string" || !item.url.trim()) addError("schema", subject, "ItemList entry " + (index + 1) + " is missing URL");
      });
      const visibleCards = pairedTagEntries(page.markup, "article")
        .filter((entry) => hasToken(entry.attrs.class, "blog-card"))
        .map((entry) => {
          const href = pairedTagEntries(entry.inner, "a")
            .map((anchor) => anchor.attrs.href)
            .find((candidate) => {
              if (!candidate) return false;
              try {
                return /^blog-.+\.html$/i.test(path.posix.basename(new URL(candidate, ORIGIN + "/blogs.html").pathname));
              } catch {
                return false;
              }
            });
          const timeEntries = tagEntries(entry.inner, "time");
          return {
            url: href ? new URL(href, ORIGIN + "/blogs.html").href : "",
            name: firstContent(entry.inner, "h2"),
            date: timeEntries[0]?.attrs.datetime ?? "",
            timeCount: timeEntries.length
          };
        });
      if (visibleCards.length !== items.length) addError("schema", subject, "visible blog-card count does not match ItemList length");
      for (const [index, card] of visibleCards.entries()) {
        if (!card.url) addError("publishing", subject, "blog card " + (index + 1) + " is missing an article link");
        if (!card.name) addError("publishing", subject, "blog card " + (index + 1) + " is missing its H2");
        if (card.timeCount !== 1 || !validIsoDate(card.date)) addError("freshness", subject, "blog card " + (index + 1) + " requires one valid time datetime");
        const target = indexablePages.find((candidate) => candidate.canonical === card.url);
        if (!target || !target.schemaTypes.has("BlogPosting")) {
          addError("publishing", subject, "blog card " + (index + 1) + " does not link to an indexable BlogPosting");
        } else if (card.date !== target.articlePublished) {
          addError("freshness", subject, "blog card date differs from article publication date for " + target.filename);
        }
        if (index > 0 && validIsoDate(card.date) && validIsoDate(visibleCards[index - 1].date) && card.date > visibleCards[index - 1].date) {
          addError("freshness", subject, "blog cards are not ordered newest first");
        }
      }
      const schemaUrls = items.map((item) => item?.url);
      const cardUrls = visibleCards.map((card) => card.url);
      if (JSON.stringify(cardUrls) !== JSON.stringify(schemaUrls)) {
        addError("schema", subject, "ItemList URLs/order do not match visible blog-card URLs/order");
      }
      items.forEach((item, index) => {
        if (visibleCards[index] && item && typeof item === "object" && item.name !== visibleCards[index].name) {
          addError("schema", subject, "ItemList name differs from visible card H2 at position " + (index + 1));
        }
      });
      const publishedArticleUrls = indexablePages
        .filter((candidate) => candidate.schemaTypes.has("BlogPosting"))
        .map((candidate) => candidate.canonical)
        .sort();
      if (JSON.stringify([...schemaUrls].sort()) !== JSON.stringify(publishedArticleUrls)) {
        addError("schema", subject, "ItemList must contain every indexable BlogPosting URL exactly once");
      }

      const featured = pairedTagEntries(page.markup, "article")
        .find((entry) => hasToken(entry.attrs.class, "featured-story"));
      if (!featured) {
        addError("publishing", subject, "missing featured story");
      } else {
        const featuredHref = pairedTagEntries(featured.inner, "a")
          .map((anchor) => anchor.attrs.href)
          .find((candidate) => {
            if (!candidate) return false;
            try {
              return /^blog-.+\.html$/i.test(path.posix.basename(new URL(candidate, ORIGIN + "/blogs.html").pathname));
            } catch {
              return false;
            }
          });
        const featuredUrl = featuredHref ? new URL(featuredHref, ORIGIN + "/blogs.html").href : "";
        const featuredTimes = tagEntries(featured.inner, "time");
        const featuredDate = featuredTimes[0]?.attrs.datetime ?? "";
        if (!visibleCards[0] || featuredUrl !== visibleCards[0].url) addError("publishing", subject, "featured story does not link to the first/newest blog card");
        if (featuredTimes.length !== 1 || featuredDate !== visibleCards[0]?.date) addError("freshness", subject, "featured story date does not match the first/newest blog card");
      }
      const newestDate = visibleCards.map((card) => card.date).filter(validIsoDate).sort().at(-1) ?? "";
      if (collection && newestDate && collection.dateModified < newestDate) {
        addError("freshness", subject, "CollectionPage dateModified predates the newest card");
      }
    }
  }
};

for (const page of publicPages) {
  validateCoreMetadata(page);
  validateAccessibilityAndImages(page);
  validateSchema(page);
}

for (const fragmentName of SHARED_FRAGMENTS) {
  const fragmentPath = path.join(ROOT, fragmentName);
  if (!fs.existsSync(fragmentPath)) {
    addError("shared fragments", fragmentName, "file is missing");
    continue;
  }
  validateAccessibilityAndImages({
    filename: fragmentName,
    html: fs.readFileSync(fragmentPath, "utf8"),
    markup: markupOnly(fs.readFileSync(fragmentPath, "utf8")),
    publicPage: false
  });
}

for (const page of publicPages) {
  const pageIds = idInventory(page.markup);
  const idOwners = new Map();
  for (const id of pageIds.keys()) idOwners.set(id, new Set([page.filename]));
  for (const fragmentName of SHARED_FRAGMENTS) {
    const mountId = path.posix.basename(fragmentName, ".html");
    const fragmentPath = path.join(ROOT, fragmentName);
    if (!pageIds.has(mountId) || !fs.existsSync(fragmentPath)) continue;
    const fragmentIds = idInventory(markupOnly(fs.readFileSync(fragmentPath, "utf8")));
    for (const id of fragmentIds.keys()) {
      if (!id) continue;
      const owners = idOwners.get(id) ?? new Set();
      owners.add(fragmentName);
      idOwners.set(id, owners);
    }
  }
  for (const [id, owners] of idOwners) {
    if (owners.size > 1) {
      addError("accessibility", page.filename, "id " + id + " collides after shared fragments are injected (" + [...owners].join(", ") + ")");
    }
  }
}

for (const field of ["title", "description", "canonical"]) {
  const groups = new Map();
  for (const page of indexablePages) {
    const value = page[field];
    if (!value) continue;
    groups.set(value, [...(groups.get(value) ?? []), page.filename]);
  }
  for (const [value, filenames] of groups) {
    if (filenames.length > 1) addError("duplicates", field, filenames.join(", ") + " share: " + value);
  }
}

for (const field of ["h1", "og:title", "og:description"]) {
  const groups = new Map();
  for (const page of indexablePages) {
    const value = field === "h1"
      ? firstContent(page.markup, "h1")
      : metaValue(page, "property", field);
    if (!value) continue;
    groups.set(value, [...(groups.get(value) ?? []), page.filename]);
  }
  for (const [value, filenames] of groups) {
    if (filenames.length > 1) addWarning("duplicates", field, filenames.join(", ") + " share: " + value);
  }
}

const resolveReference = (rawReference, sourceFilename) => {
  const value = decode((rawReference ?? "").trim());
  if (!value || /^(?:data:|mailto:|tel:|javascript:|blob:)/i.test(value)) return { skip: true, value };
  let url;
  try {
    url = new URL(value, ORIGIN + "/" + sourceFilename.replaceAll("\\", "/"));
  } catch {
    return { invalid: true, value };
  }
  if (!["http:", "https:"].includes(url.protocol)) return { skip: true, value, url };
  const hostname = url.hostname.toLowerCase();
  if (![CANONICAL_HOST, "www." + CANONICAL_HOST].includes(hostname)) return { external: true, value, url };

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { invalid: true, value, url };
  }
  let relative = pathname.replace(/^\/+/, "");
  if (!relative || relative.endsWith("/")) relative += "index.html";
  relative = path.posix.normalize(relative);
  if (relative.startsWith("../") || path.posix.isAbsolute(relative)) return { invalid: true, value, url };

  const exact = exactFiles.has(relative) ? relative : "";
  const candidates = lowerFileMap.get(relative.toLowerCase()) ?? [];
  const actual = exact || (candidates.length === 1 ? candidates[0] : "");
  let fragment = "";
  if (url.hash.length > 1) {
    try {
      fragment = decodeURIComponent(url.hash.slice(1));
    } catch {
      return { invalid: true, value, url };
    }
  }
  return {
    value,
    url,
    relative,
    actual,
    exists: Boolean(actual),
    caseMismatch: Boolean(actual && actual !== relative),
    fragment
  };
};

const idsByFile = new Map();
for (const page of pages) idsByFile.set(page.filename.toLowerCase(), new Set(idInventory(page.markup).keys()));
for (const fragmentName of SHARED_FRAGMENTS) {
  if (!fs.existsSync(path.join(ROOT, fragmentName))) continue;
  idsByFile.set(fragmentName.toLowerCase(), new Set(idInventory(markupOnly(fs.readFileSync(path.join(ROOT, fragmentName), "utf8"))).keys()));
}

const validateReference = (sourceFilename, rawReference, kind) => {
  const result = resolveReference(rawReference, sourceFilename);
  if (result.skip || result.external) {
    if (result.external && result.url?.protocol === "http:") {
      addWarning("assets and links", sourceFilename, "external " + kind + " uses HTTP: " + result.value);
    }
    if (result.skip && /^javascript:/i.test(result.value) && kind === "link") {
      addWarning("internal links", sourceFilename, "javascript: link should be a button when it performs an action");
    }
    return result;
  }
  if (result.invalid) {
    addError("assets and links", sourceFilename, "invalid " + kind + " reference: " + result.value);
    return result;
  }
  if (!result.exists) {
    addError("assets and links", sourceFilename, "missing internal " + kind + ": " + result.value);
    return result;
  }
  if (result.caseMismatch) {
    addError("assets and links", sourceFilename, kind + " path case differs from disk and may break on production: " + result.value + " -> " + result.actual);
  }
  if (result.url.protocol !== "https:" || result.url.hostname.toLowerCase() !== CANONICAL_HOST) {
    addWarning("internal links", sourceFilename, "internal " + kind + " uses a redirecting origin: " + result.value);
  }
  const rawPath = result.value.split(/[?#]/, 1)[0];
  if (rawPath && result.url.pathname.toLowerCase() === "/index.html") {
    addWarning("internal links", sourceFilename, "internal " + kind + " uses duplicate homepage URL " + result.value);
  }
  if (kind === "link" && result.value === "#") {
    addWarning("internal links", sourceFilename, "placeholder href=# link");
  }
  if (result.fragment) {
    const targetIds = idsByFile.get(result.actual.toLowerCase());
    if (targetIds && !targetIds.has(result.fragment)) {
      addError("internal links", sourceFilename, "missing fragment target " + result.value);
    }
  }
  if (kind === "link") {
    const targetPage = pageByFilename.get(result.actual.toLowerCase());
    if (targetPage && targetPage.filename !== sourceFilename && !targetPage.indexable && targetPage.filename !== "404.html") {
      addWarning("internal links", sourceFilename, "links to noindex page " + result.value);
    }
  }
  return result;
};

const scanReferences = (document) => {
  const markup = document.markup;
  const resourceMarkup = stripComments(document.html ?? markup);
  for (const anchor of tagEntries(markup, "a")) {
    if (!("href" in anchor.attrs)) addWarning("internal links", document.filename, "anchor is missing href");
    else if (!anchor.attrs.href.trim()) addWarning("internal links", document.filename, "anchor has an empty href");
    else validateReference(document.filename, anchor.attrs.href, "link");
  }

  const simpleAssets = [
    ["img", "src"],
    ["script", "src"],
    ["link", "href"],
    ["iframe", "src"],
    ["source", "src"],
    ["video", "src"],
    ["video", "poster"],
    ["audio", "src"],
    ["track", "src"],
    ["embed", "src"],
    ["object", "data"],
    ["input", "src"]
  ];
  for (const [tagName, attribute] of simpleAssets) {
    const sourceMarkup = tagName === "script" ? resourceMarkup : markup;
    const entries = tagName === "script" ? pairedTagEntries(sourceMarkup, tagName) : tagEntries(sourceMarkup, tagName);
    for (const entry of entries) {
      if (attribute in entry.attrs && !entry.attrs[attribute].trim()) {
        addError("assets and links", document.filename, tagName + " has an empty " + attribute + " attribute");
      } else if (entry.attrs[attribute]) {
        validateReference(document.filename, entry.attrs[attribute], "asset");
      }
    }
  }
  for (const tagName of ["img", "source"]) {
    for (const entry of tagEntries(markup, tagName)) {
      const srcset = entry.attrs.srcset ?? "";
      for (const candidate of srcset.split(",").map((part) => part.trim().split(/\s+/, 1)[0]).filter(Boolean)) {
        validateReference(document.filename, candidate, "asset");
      }
    }
  }
  for (const match of markup.matchAll(/<[a-z][^>]*>/gi)) {
    const style = attrs(match[0]).style ?? "";
    for (const asset of style.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi)) {
      const reference = asset[1] ?? asset[2] ?? asset[3] ?? "";
      if (reference && !reference.startsWith("#") && !/^var\(/i.test(reference)) {
        validateReference(document.filename, reference, "asset");
      }
    }
  }
  for (const styleBlock of pairedTagEntries(resourceMarkup, "style")) {
    const activeStyle = styleBlock.inner.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const asset of activeStyle.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi)) {
      const reference = asset[1] ?? asset[2] ?? asset[3] ?? "";
      if (reference && !reference.startsWith("#") && !/^var\(/i.test(reference)) {
        validateReference(document.filename, reference, "asset");
      }
    }
    for (const imported of activeStyle.matchAll(/@import\s+(?!url\()["']([^"']+)["']/gi)) {
      validateReference(document.filename, imported[1], "asset");
    }
  }
};

for (const page of publicPages) scanReferences(page);
for (const fragmentName of SHARED_FRAGMENTS) {
  const fragmentPath = path.join(ROOT, fragmentName);
  if (!fs.existsSync(fragmentPath)) continue;
  scanReferences({
    filename: fragmentName,
    html: fs.readFileSync(fragmentPath, "utf8"),
    markup: markupOnly(fs.readFileSync(fragmentPath, "utf8"))
  });
}

const commonScriptPath = path.join(ROOT, "js", "common.js");
if (!fs.existsSync(commonScriptPath)) {
  addError("shared fragments", "js/common.js", "shared-fragment loader is missing");
} else {
  const commonScript = fs.readFileSync(commonScriptPath, "utf8");
  const isJavaScriptCodePosition = (source, targetIndex) => {
    let state = "code";
    let escaped = false;
    let regexCharacterClass = false;
    const slashStartsRegex = (index) => {
      const before = source.slice(0, index).trimEnd();
      if (!before) return true;
      const previous = before.at(-1);
      if (/[([{=,:;!?&|+\-*%^~<>]/.test(previous)) return true;
      const previousWord = before.match(/([A-Za-z_$][\w$]*)$/)?.[1] ?? "";
      return ["return", "throw", "case", "delete", "void", "typeof", "instanceof", "in", "of", "yield", "await"].includes(previousWord);
    };
    for (let index = 0; index < targetIndex; index += 1) {
      const character = source[index];
      const next = source[index + 1];
      if (state === "line-comment") {
        if (character === "\n" || character === "\r") state = "code";
        continue;
      }
      if (state === "block-comment") {
        if (character === "*" && next === "/") {
          state = "code";
          index += 1;
        }
        continue;
      }
      if (state === "regex") {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === "[") {
          regexCharacterClass = true;
        } else if (character === "]") {
          regexCharacterClass = false;
        } else if (character === "/" && !regexCharacterClass) {
          state = "code";
        }
        continue;
      }
      if (state !== "code") {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === state) {
          state = "code";
        }
        continue;
      }
      if (character === "/" && next === "/") {
        state = "line-comment";
        index += 1;
      } else if (character === "/" && next === "*") {
        state = "block-comment";
        index += 1;
      } else if (character === "/" && slashStartsRegex(index)) {
        state = "regex";
        regexCharacterClass = false;
      } else if (["'", "\"", "`"].includes(character)) {
        state = character;
      }
    }
    return state === "code";
  };
  for (const fragmentName of SHARED_FRAGMENTS) {
    const mountId = path.posix.basename(fragmentName, ".html");
    const loaderPattern = new RegExp("(^|[;{}\\r\\n])(\\s*)loadComponent\\(\\s*['\"]" + mountId + "['\"]\\s*,\\s*['\"]" + fragmentName.replace(".", "\\.") + "['\"]\\s*\\)", "gm");
    const realLoaderCall = [...commonScript.matchAll(loaderPattern)]
      .some((match) => isJavaScriptCodePosition(commonScript, (match.index ?? 0) + match[1].length + match[2].length));
    if (!realLoaderCall) addError("shared fragments", "js/common.js", "does not load " + fragmentName + " into #" + mountId);
  }
}

for (const page of indexablePages) {
  const pageIds = idInventory(page.markup);
  for (const fragmentName of SHARED_FRAGMENTS) {
    const mountId = path.posix.basename(fragmentName, ".html");
    if (!pageIds.has(mountId)) addError("shared fragments", page.filename, "missing #" + mountId + " mount for " + fragmentName);
  }
  const commonScript = pairedTagEntries(stripComments(page.html), "script")
    .filter((entry) => {
      const type = (entry.attrs.type ?? "").trim().toLowerCase().split(";", 1)[0];
      return !type || ["module", "text/javascript", "application/javascript", "text/ecmascript", "application/ecmascript"].includes(type);
    })
    .map((entry) => entry.attrs.src)
    .filter(Boolean)
    .map((source) => resolveReference(source, page.filename))
    .some((result) => result?.actual?.toLowerCase() === "js/common.js");
  if (!commonScript) addError("shared fragments", page.filename, "does not load js/common.js");
}

for (const cssFile of allFiles.filter((filename) => filename.toLowerCase().endsWith(".css"))) {
  const css = fs.readFileSync(path.join(ROOT, cssFile), "utf8");
  const activeCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of activeCss.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi)) {
    const reference = match[1] ?? match[2] ?? match[3] ?? "";
    if (reference.startsWith("#") || /^var\(/i.test(reference)) continue;
    validateReference(cssFile, reference, "asset");
  }
  for (const match of activeCss.matchAll(/@import\s+(?!url\()["']([^"']+)["']/gi)) {
    validateReference(cssFile, match[1], "asset");
  }
}

const contextualInbound = new Map(indexablePages.map((page) => [page.filename, new Set()]));
const sharedInbound = new Map(indexablePages.map((page) => [page.filename, new Set()]));

for (const page of indexablePages) {
  const main = elementInner(page.markup, "main").replace(/<nav\b[\s\S]*?<\/nav>/gi, "");
  for (const anchor of tagEntries(main, "a")) {
    const result = resolveReference(anchor.attrs.href, page.filename);
    if (!result?.exists) continue;
    const target = pageByFilename.get(result.actual.toLowerCase());
    if (target?.indexable && target.filename !== page.filename) {
      contextualInbound.get(target.filename)?.add(page.filename);
    }
  }
}

for (const fragmentName of SHARED_NAV_FRAGMENTS) {
  const fragmentPath = path.join(ROOT, fragmentName);
  if (!fs.existsSync(fragmentPath)) continue;
  const markup = markupOnly(fs.readFileSync(fragmentPath, "utf8"));
  for (const anchor of tagEntries(markup, "a")) {
    const result = resolveReference(anchor.attrs.href, fragmentName);
    if (!result?.exists) continue;
    const target = pageByFilename.get(result.actual.toLowerCase());
    if (target?.indexable) sharedInbound.get(target.filename)?.add(fragmentName);
  }
}

for (const page of indexablePages) {
  if (page.filename === "index.html") continue;
  const contextual = contextualInbound.get(page.filename) ?? new Set();
  const shared = sharedInbound.get(page.filename) ?? new Set();
  if (contextual.size === 0 && shared.size > 0) {
    addWarning("internal links", page.filename, "no contextual inbound link; discoverable only through " + [...shared].join(", "));
  }
  if (contextual.size === 0 && shared.size === 0) {
    addWarning("internal links", page.filename, "no contextual or shared-navigation inbound link (sitemap-only orphan risk)");
  }
}

const xmlBlockEntries = (xml, tagName) => {
  const pattern = new RegExp("<" + tagName + "\\b[^>]*>([\\s\\S]*?)</" + tagName + ">", "g");
  return [...xml.matchAll(pattern)].map((match) => ({
    tag: match[0],
    openTag: match[0].slice(0, match[0].indexOf(">") + 1),
    attrs: attrs(match[0].slice(0, match[0].indexOf(">") + 1)),
    inner: match[1],
    index: match.index ?? 0
  }));
};
const xmlTagEntries = (xml, tagName) => {
  const pattern = new RegExp("<" + tagName + "\\b[^>]*>", "g");
  return [...xml.matchAll(pattern)].map((match) => ({ tag: match[0], attrs: attrs(match[0]), index: match.index ?? 0 }));
};
const xmlInner = (xml, tagName) => xmlBlockEntries(xml, tagName)[0]?.inner ?? "";
const xmlText = (xml, tagName) => {
  let value = xmlInner(xml, tagName).trim();
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  if (cdata) value = cdata[1];
  return decode(value).trim();
};
const invalidXmlAmpersand = (xml) => {
  const withoutCdata = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  return /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/.test(withoutCdata);
};

const sitemapPath = path.join(ROOT, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  addError("sitemap", "sitemap.xml", "file is missing");
} else {
  const sitemap = stripComments(fs.readFileSync(sitemapPath, "utf8"));
  if (!/<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/.test(sitemap)) {
    addError("sitemap", "sitemap.xml", "missing the standard sitemap urlset namespace");
  }
  if (xmlBlockEntries(sitemap, "urlset").length !== 1) addError("sitemap", "sitemap.xml", "expected one complete urlset root element");
  if (invalidXmlAmpersand(sitemap)) addError("sitemap", "sitemap.xml", "contains an unescaped ampersand");
  const entries = xmlBlockEntries(sitemap, "url").map((block, index) => {
    if (xmlBlockEntries(block.inner, "loc").length !== 1) addError("sitemap", "URL entry " + (index + 1), "expected exactly one loc");
    if (xmlBlockEntries(block.inner, "lastmod").length !== 1) addError("sitemap", "URL entry " + (index + 1), "expected exactly one lastmod");
    return {
      loc: xmlText(block.inner, "loc"),
      lastmod: xmlText(block.inner, "lastmod")
    };
  });
  const locations = entries.map((entry) => entry.loc);
  const expected = new Map(indexablePages.map((page) => [page.canonical, page]));
  for (const [url] of expected) {
    if (!locations.includes(url)) addError("sitemap", "sitemap.xml", "missing indexable URL " + url);
  }
  for (const url of locations) {
    if (!expected.has(url)) addError("sitemap", "sitemap.xml", "contains non-indexable, redirecting or unknown URL " + url);
    if (/\/index\.html(?:$|[?#])/i.test(url)) addError("sitemap", "sitemap.xml", "contains duplicate homepage URL " + url);
  }
  if (new Set(locations).size !== locations.length) addError("sitemap", "sitemap.xml", "contains duplicate loc values");
  for (const entry of entries) {
    if (!validIsoDate(entry.lastmod)) {
      addError("sitemap", entry.loc || "unknown URL", "lastmod must be a real YYYY-MM-DD date");
      continue;
    }
    if (entry.lastmod > TODAY) addError("sitemap", entry.loc, "lastmod is in the future");
    const page = expected.get(entry.loc);
    if (page?.schemaModified && entry.lastmod !== page.schemaModified) {
      addError("sitemap", entry.loc, "lastmod " + entry.lastmod + " differs from page/schema dateModified " + page.schemaModified);
    }
  }
}

const robotsPath = path.join(ROOT, "robots.txt");
if (!fs.existsSync(robotsPath)) {
  addError("robots", "robots.txt", "file is missing");
} else {
  const robots = fs.readFileSync(robotsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s*#.*$/, ""))
    .join("\n");
  if (!/^User-agent:\s*\*$/im.test(robots)) addError("robots", "robots.txt", "missing wildcard user-agent group");
  if (!/^Allow:\s*\/\s*$/im.test(robots)) addError("robots", "robots.txt", "must allow the public site");
  const disallowed = [...robots.matchAll(/^Disallow:\s*(\S*)\s*$/gim)].map((match) => match[1]).filter(Boolean).sort();
  const expectedDisallowed = ["/scripts/", "/templates/"];
  if (JSON.stringify(disallowed) !== JSON.stringify(expectedDisallowed)) {
    addError("robots", "robots.txt", "Disallow rules must be only /templates/ and /scripts/; found " + (disallowed.join(", ") || "none"));
  }
  if (!new RegExp("^Sitemap:\\s*" + ORIGIN.replace(/[.*+?^$|()[\]{}\\]/g, "\\$&") + "/sitemap\\.xml$", "im").test(robots)) {
    addError("robots", "robots.txt", "missing canonical sitemap declaration");
  }
}

const htaccessPath = path.join(ROOT, ".htaccess");
if (!fs.existsSync(htaccessPath)) {
  addWarning("server", ".htaccess", "file is missing; configure equivalent canonicalization and headers on the live server");
} else {
  const htaccess = fs.readFileSync(htaccessPath, "utf8");
  const activeHtaccess = htaccess
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");
  const rewriteHasFlag = (match, expected) => Boolean(match && match[1]
    .split(",")
    .map((flag) => flag.trim().toUpperCase())
    .includes(expected.toUpperCase()));
  const redirectHas301 = (match) => rewriteHasFlag(match, "R=301");
  const indexRuleMatch = activeHtaccess.match(/RewriteRule\s+\^index\\\.html\$\s+https:\/\/globalbirthdevelopers\.com\/\s+\[([^\]]+)\]/i);
  const originRuleMatch = activeHtaccess.match(/RewriteRule\s+\^\s+https:\/\/globalbirthdevelopers\.com%\{REQUEST_URI\}\s+\[([^\]]+)\]/i);
  const galleryRuleMatch = activeHtaccess.match(/RewriteRule\s+\^type\/gallery\/\?\$\s+https:\/\/globalbirthdevelopers\.com\/gallery\.html\s+\[([^\]]+)\]/i);
  const indexRule = indexRuleMatch?.index ?? -1;
  const originRule = originRuleMatch?.index ?? -1;
  const devRuleMatch = activeHtaccess.match(/RewriteRule[^\r\n]*templates\|scripts[^\r\n]*\[([^\]]+)\]/i);

  if (!/RewriteCond\s+%\{THE_REQUEST\}[^\r\n]*index\\\.html/i.test(activeHtaccess)
      || indexRule < 0
      || !redirectHas301(indexRuleMatch)
      || !rewriteHasFlag(indexRuleMatch, "L")) {
    addError("server", ".htaccess", "missing loop-safe /index.html to / permanent redirect");
  }
  if (originRule < 0
      || !redirectHas301(originRuleMatch)
      || !rewriteHasFlag(originRuleMatch, "L")
      || !/RewriteCond\s+%\{HTTPS\}\s+!=on\s+\[[^\]]*\bOR\b[^\]]*\]/i.test(activeHtaccess)
      || !/RewriteCond\s+%\{HTTP_HOST\}\s+!\^globalbirthdevelopers\\\.com\$\s+\[[^\]]*\bNC\b[^\]]*\]/i.test(activeHtaccess)) {
    addError("server", ".htaccess", "missing HTTPS/non-www origin normalization");
  }
  if (!galleryRuleMatch || !redirectHas301(galleryRuleMatch) || !rewriteHasFlag(galleryRuleMatch, "L")) {
    addError("server", ".htaccess", "legacy /type/gallery/ redirect must be a permanent direct redirect");
  }
  if (indexRule >= 0 && originRule >= 0 && indexRule > originRule) {
    addError("server", ".htaccess", "/index.html rule must precede origin normalization to avoid redirect chains");
  }
  if (!devRuleMatch || !hasToken(devRuleMatch[1], "f")) {
    addError("server", ".htaccess", "missing access protection for templates/ and scripts/");
  }
  if (devRuleMatch && indexRule >= 0 && (devRuleMatch.index ?? Number.POSITIVE_INFINITY) > indexRule) {
    addError("server", ".htaccess", "development-source protection must precede public redirects");
  }
  if (!/package\(\?:-lock\)\?\\\.json/i.test(activeHtaccess) || !/\\\.md/i.test(activeHtaccess)) {
    addWarning("server", ".htaccess", "development manifest/document protection is incomplete");
  }
  if (!/\\\.env/i.test(activeHtaccess)) addWarning("server", ".htaccess", ".env file protection is not explicit");
  const fileMatchBlocks = [...activeHtaccess.matchAll(/<FilesMatch\s+(["'])(.*?)\1\s*>([\s\S]*?)<\/FilesMatch>/gi)]
    .map((match) => ({ pattern: match[2], body: match[3] }));
  const fileMatchApplies = (block, filename) => {
    try {
      const caseInsensitive = /^\(\?i\)/.test(block.pattern);
      const pattern = caseInsensitive ? block.pattern.replace(/^\(\?i\)/, "") : block.pattern;
      return new RegExp(pattern, caseInsensitive ? "i" : "").test(filename);
    } catch {
      return false;
    }
  };
  const setsNoindexFollow = (block) => /Header\s+always\s+set\s+X-Robots-Tag\s+"noindex,\s*follow"/i.test(block.body);
  const noindexHeaderPattern = /(?:^|\n)\s*Header\s+(?:(?:always|onsuccess)\s+)?(?:set|add|append|merge|setifempty)\s+X-Robots-Tag\b[^\r\n#]*\bnoindex\b/im;
  const setsNoindex = (block) => noindexHeaderPattern.test(block.body);
  const fragmentHeaderBlock = fileMatchBlocks.find((block) =>
    ["404.html", "header.html", "footer.html", "floating.html"].every((filename) => fileMatchApplies(block, filename))
    && setsNoindexFollow(block));
  const feedHeaderBlock = fileMatchBlocks.find((block) => fileMatchApplies(block, "feed.xml") && setsNoindexFollow(block));
  if (!fragmentHeaderBlock || !feedHeaderBlock) {
    addError("server", ".htaccess", "missing noindex HTTP headers for shared fragments and feed.xml");
  }
  const allowedNoindexHeaderTargets = new Set(["404.html", ...SHARED_FRAGMENTS, "feed.xml"]);
  const forbiddenNoindexHeaderTargets = [...publicPages.map((page) => page.filename), "sitemap.xml", "robots.txt"]
    .filter((filename) => !allowedNoindexHeaderTargets.has(filename));
  for (const block of fileMatchBlocks.filter(setsNoindex)) {
    const affectedPublicFiles = forbiddenNoindexHeaderTargets.filter((filename) => fileMatchApplies(block, filename));
    if (affectedPublicFiles.length) {
      addError("server", ".htaccess", "X-Robots-Tag noindex FilesMatch also covers public files: " + affectedPublicFiles.join(", "));
    }
  }
  const unscopedHtaccess = activeHtaccess.replace(/<FilesMatch\s+(["']).*?\1\s*>[\s\S]*?<\/FilesMatch>/gi, "");
  if (noindexHeaderPattern.test(unscopedHtaccess)) {
    addError("server", ".htaccess", "X-Robots-Tag noindex must not be applied globally");
  }
}

const rssDay = (value) => {
  const match = value.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+\d{2}:\d{2}:\d{2}\s+[+-]\d{4}$/);
  if (!match || Number.isNaN(Date.parse(value))) return "";
  const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  const day = match[4] + "-" + months[match[3]] + "-" + match[2];
  if (!validIsoDate(day)) return "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(day + "T00:00:00Z").getUTCDay()];
  return weekday === match[1] ? day : "";
};

const feedPath = path.join(ROOT, "feed.xml");
if (!fs.existsSync(feedPath)) {
  addError("feed", "feed.xml", "file is missing");
} else {
  const feed = stripComments(fs.readFileSync(feedPath, "utf8"));
  if (invalidXmlAmpersand(feed)) addError("feed", "feed.xml", "contains an unescaped ampersand");
  if (!/<rss\b[^>]*version=["']2\.0["']/.test(feed)) addError("feed", "feed.xml", "missing RSS 2.0 declaration");
  if (!/xmlns:atom=["']http:\/\/www\.w3\.org\/2005\/Atom["']/.test(feed)) addError("feed", "feed.xml", "missing Atom namespace");
  if (xmlBlockEntries(feed, "rss").length !== 1) addError("feed", "feed.xml", "expected one complete rss root element");
  if (xmlBlockEntries(feed, "channel").length !== 1) addError("feed", "feed.xml", "expected one complete channel element");
  const channel = xmlInner(feed, "channel");
  const channelWithoutItems = channel.replace(/<item\b[\s\S]*?<\/item>/g, "");
  for (const field of ["title", "link", "description", "language", "lastBuildDate"]) {
    if (!xmlText(channelWithoutItems, field)) addError("feed", "feed.xml", "channel is missing " + field);
  }
  if (xmlText(channelWithoutItems, "link") !== ORIGIN + "/blogs.html") {
    addError("feed", "feed.xml", "channel link must be the canonical blog index");
  }
  const selfLink = xmlTagEntries(channelWithoutItems, "atom:link")
    .find((entry) => (entry.attrs.rel ?? "").toLowerCase() === "self");
  if (selfLink?.attrs.href !== ORIGIN + "/feed.xml" || selfLink?.attrs.type !== "application/rss+xml") {
    addError("feed", "feed.xml", "Atom self link is missing or incorrect");
  }

  const channelImage = xmlBlockEntries(channelWithoutItems, "image")[0];
  if (!channelImage) {
    addWarning("feed", "feed.xml", "channel image is not set");
  } else {
    const imageUrl = xmlText(channelImage.inner, "url");
    const imageTitle = xmlText(channelImage.inner, "title");
    const imageLink = xmlText(channelImage.inner, "link");
    if (!imageUrl || !imageTitle || !imageLink) addError("feed", "feed.xml", "channel image requires url, title and link");
    if (imageUrl) validateReference("feed.xml", imageUrl, "asset");
    if (imageLink !== ORIGIN + "/blogs.html") addError("feed", "feed.xml", "channel image link must be the canonical blog index");
    const imageWidthText = xmlText(channelImage.inner, "width");
    const imageHeightText = xmlText(channelImage.inner, "height");
    const imageWidth = /^\d+$/.test(imageWidthText) ? Number(imageWidthText) : Number.NaN;
    const imageHeight = /^\d+$/.test(imageHeightText) ? Number(imageHeightText) : Number.NaN;
    if (!Number.isInteger(imageWidth) || imageWidth < 1 || imageWidth > 144) addWarning("feed", "feed.xml", "channel image width should be an integer from 1 to 144");
    if (!Number.isInteger(imageHeight) || imageHeight < 1 || imageHeight > 400) addWarning("feed", "feed.xml", "channel image height should be an integer from 1 to 400");
  }

  const buildDate = xmlText(channelWithoutItems, "lastBuildDate");
  const buildTime = Date.parse(buildDate);
  const buildDay = rssDay(buildDate);
  if (!buildDay) addError("feed", "feed.xml", "lastBuildDate must be a valid RFC 822-style date");
  if (buildDay && buildDay > TODAY) addError("feed", "feed.xml", "lastBuildDate is in the future");

  const items = xmlBlockEntries(channel, "item").map((entry) => {
    const guid = xmlBlockEntries(entry.inner, "guid")[0];
    return {
      title: xmlText(entry.inner, "title"),
      link: xmlText(entry.inner, "link"),
      description: xmlText(entry.inner, "description"),
      guid: textOnly(guid?.inner ?? ""),
      guidIsPermalink: (guid?.attrs.ispermalink ?? "").toLowerCase(),
      pubDate: xmlText(entry.inner, "pubDate")
    };
  });
  if (!items.length) addError("feed", "feed.xml", "contains no items");
  const itemLinks = items.map((item) => item.link);
  if (new Set(itemLinks).size !== itemLinks.length) addError("feed", "feed.xml", "contains duplicate item links");

  let previousTime = Number.POSITIVE_INFINITY;
  for (const [index, item] of items.entries()) {
    const subject = "item " + (index + 1);
    if (!item.title) addError("feed", subject, "missing title");
    if (!item.description) addError("feed", subject, "missing description");
    if (!item.link) addError("feed", subject, "missing link");
    if (item.guid !== item.link || item.guidIsPermalink !== "true") {
      addError("feed", subject, "GUID must be the canonical permalink");
    }
    const publicationDay = rssDay(item.pubDate);
    const publicationTime = publicationDay ? Date.parse(item.pubDate) : Number.NaN;
    if (!publicationDay) addError("feed", subject, "pubDate must be a valid RFC 822-style date");
    if (publicationDay && publicationDay > TODAY) addError("feed", subject, "pubDate is in the future");
    if (!Number.isNaN(publicationTime) && publicationTime > previousTime) {
      addError("feed", "feed.xml", "items are not ordered newest first");
    }
    if (!Number.isNaN(publicationTime)) previousTime = publicationTime;
    if (!Number.isNaN(buildTime) && !Number.isNaN(publicationTime) && buildTime < publicationTime) {
      addError("feed", "feed.xml", "lastBuildDate predates " + item.link);
    }
    const target = indexablePages.find((page) => page.canonical === item.link);
    if (!target || !target.schemaTypes.has("BlogPosting")) {
      addError("feed", subject, "link is not an indexable BlogPosting URL: " + item.link);
    } else {
      if (rssDay(item.pubDate) !== target.articlePublished) {
        addError("feed", subject, "pubDate differs from article publication date for " + target.filename);
      }
      const h1 = firstContent(target.markup, "h1");
      if (item.title !== h1) addError("feed", subject, "title differs from the visible article H1 for " + target.filename);
    }
  }

  const blogArticles = indexablePages.filter((page) => page.schemaTypes.has("BlogPosting"));
  for (const article of blogArticles) {
    if (!itemLinks.includes(article.canonical)) addError("feed", "feed.xml", "missing published article " + article.canonical);
  }
  if (items.length && buildDate && rssDay(buildDate) !== rssDay(items[0].pubDate)) {
    addWarning("feed", "feed.xml", "lastBuildDate day differs from the newest item publication day");
  }
}

const templateFiles = allFiles.filter((filename) => filename.startsWith("templates/") && filename.toLowerCase().endsWith(".html"));
if (!templateFiles.length) addWarning("publishing", "templates/", "no HTML publishing template found");
const requiredTemplatePlaceholders = [
  "REPLACE_ROBOTS_BEFORE_PUBLISHING",
  "REPLACE_META_TITLE",
  "REPLACE_META_DESCRIPTION",
  "REPLACE_LOCATION",
  "REPLACE_FILENAME",
  "REPLACE_SOCIAL_DESCRIPTION",
  "REPLACE_ABSOLUTE_1200X630_IMAGE_URL",
  "REPLACE_SOCIAL_IMAGE_ALT",
  "REPLACE_YYYY-MM-DD",
  "REPLACE_SECTION",
  "REPLACE_ARTICLE_HEADLINE",
  "REPLACE_SCHEMA_DESCRIPTION",
  "REPLACE_SHORT_BREADCRUMB",
  "REPLACE_VISIBLE_DATE",
  "REPLACE_CONTENT_IMAGE_URL",
  "REPLACE_ARTICLE_LEAD",
  "REPLACE_CTA_HEADING"
];
for (const filename of templateFiles) {
  const html = fs.readFileSync(path.join(ROOT, filename), "utf8");
  const markup = markupOnly(html);
  const templatePage = {
    metaTags: tagEntries(markup, "meta")
  };
  const robots = metaValue(templatePage, "name", "robots").toLowerCase();
  if (!hasToken(robots, "noindex")) addError("publishing", filename, "template must remain noindex before copying");
  for (const placeholder of requiredTemplatePlaceholders) {
    if (!html.includes(placeholder)) addError("publishing", filename, "missing required placeholder " + placeholder);
  }
  if (pairedTagEntries(markup, "h1").length !== 1) addError("publishing", filename, "template requires exactly one H1");
  if (pairedTagEntries(markup, "main").length !== 1) addError("publishing", filename, "template requires exactly one main landmark");
  const templateTitles = pairedTagEntries(markup, "title");
  if (templateTitles.length !== 1 || !templateTitles[0].inner.includes("REPLACE_META_TITLE")) {
    addError("publishing", filename, "template title must contain REPLACE_META_TITLE");
  }
  const templateCanonicals = tagEntries(markup, "link")
    .filter((entry) => hasToken(entry.attrs.rel, "canonical"));
  if (templateCanonicals.length !== 1 || !(templateCanonicals[0].attrs.href ?? "").includes("REPLACE_FILENAME")) {
    addError("publishing", filename, "template canonical must contain REPLACE_FILENAME");
  }
  for (const [attribute, name] of [
    ["name", "description"],
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["property", "og:image:alt"],
    ["property", "article:published_time"],
    ["property", "article:modified_time"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
    ["name", "twitter:image:alt"]
  ]) {
    const values = metaValues(templatePage, attribute, name);
    if (values.length !== 1 || !values[0]) addError("publishing", filename, "template requires one non-empty " + name + " tag");
  }
  validateAccessibilityAndImages({ filename, html, markup, publicPage: true });

  const templateSchemaTypes = new Set();
  const templateSchemaTypeCounts = new Map();
  const templateSchemaBlocks = pairedTagEntries(stripComments(html), "script")
    .filter((entry) => (entry.attrs.type ?? "").toLowerCase() === "application/ld+json");
  for (const [index, block] of templateSchemaBlocks.entries()) {
    try {
      const parsed = JSON.parse(block.inner);
      if (!hasSchemaOrgContext(parsed)) addError("publishing", filename, "template JSON-LD block " + (index + 1) + " lacks Schema.org @context");
      for (const node of collectSchemaNodes(parsed)) {
        for (const type of schemaTypesFor(node)) {
          templateSchemaTypes.add(type);
          templateSchemaTypeCounts.set(type, (templateSchemaTypeCounts.get(type) ?? 0) + 1);
        }
      }
    } catch (error) {
      addError("publishing", filename, "invalid template JSON-LD block " + (index + 1) + " (" + error.message + ")");
    }
  }
  for (const type of ["BlogPosting", "BreadcrumbList"]) {
    if (!templateSchemaTypes.has(type)) addError("publishing", filename, "template JSON-LD is missing " + type);
    if ((templateSchemaTypeCounts.get(type) ?? 0) > 1) addError("publishing", filename, "template JSON-LD has duplicate " + type + " nodes");
  }
  for (const [tagName, attribute] of [["link", "href"], ["script", "src"]]) {
    const entries = tagName === "script"
      ? pairedTagEntries(stripComments(html), tagName)
      : tagEntries(stripComments(html), tagName);
    for (const entry of entries) {
      const reference = entry.attrs[attribute] ?? "";
      if (!reference || reference.includes("REPLACE_")) continue;
      validateReference(path.posix.basename(filename), reference, "asset");
    }
  }
  for (const anchor of tagEntries(markup, "a")) {
    const reference = anchor.attrs.href ?? "";
    if (!reference || reference.includes("REPLACE_")) continue;
    if (reference.startsWith("#")) {
      let targetId = "";
      try {
        targetId = decodeURIComponent(reference.slice(1));
      } catch {
        addError("publishing", filename, "template anchor has an invalid fragment: " + reference);
        continue;
      }
      const templateIds = new Set(idInventory(markup).keys());
      if (!targetId || !templateIds.has(targetId)) addError("publishing", filename, "template anchor has no matching target: " + reference);
      continue;
    }
    validateReference(path.posix.basename(filename), reference, "link");
  }
}

const uniqueIssues = (issues) => {
  const seen = new Set();
  return issues
    .filter((issue) => {
      const key = issue.area + "\u0000" + issue.subject + "\u0000" + issue.message;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.area.localeCompare(b.area)
      || a.subject.localeCompare(b.subject)
      || a.message.localeCompare(b.message));
};

const printIssues = (label, issues) => {
  const finalIssues = uniqueIssues(issues);
  console.log(label + ": " + finalIssues.length);
  let currentArea = "";
  for (const issue of finalIssues) {
    if (issue.area !== currentArea) {
      currentArea = issue.area;
      console.log("  [" + currentArea + "]");
    }
    console.log("    " + issue.subject + ": " + issue.message);
  }
  return finalIssues;
};

const contextualTargets = [...contextualInbound.values()].filter((sources) => sources.size > 0).length;
const sharedTargets = [...sharedInbound.values()].filter((sources) => sources.size > 0).length;
console.log("SEO audit: " + indexablePages.length + " indexable pages, " + publicPages.length + " public HTML documents, " + SHARED_FRAGMENTS.length + " shared fragments");
console.log("Link model: " + contextualTargets + " page(s) have contextual inbound links; " + sharedTargets + " page(s) appear in shared navigation");
const finalErrors = printIssues("Errors", errors);
const finalWarnings = printIssues("Warnings", warnings);
console.log(finalErrors.length ? "Result: FAIL (fix errors before deployment)" : "Result: PASS" + (finalWarnings.length ? " with reviewable warnings" : ""));

if (finalErrors.length) process.exitCode = 1;
