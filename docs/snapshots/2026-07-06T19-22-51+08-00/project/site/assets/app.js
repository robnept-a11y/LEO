const sectionList = document.querySelector("#section-list");
const documentView = document.querySelector("#document-view");
const pageTitle = document.querySelector("#page-title");
const docStatus = document.querySelector("#doc-status");
const refreshButton = document.querySelector("#refresh-button");
const changeLogButton = document.querySelector("#change-log-button");
const mobileCurrentPage = document.querySelector("#mobile-current-page");
const mobileNavToggle = document.querySelector("#mobile-nav-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");

let indexData = null;
let currentView = { type: "section", id: "introduction" };
let tickingScrollUpdate = false;

function updateScrolledState() {
  document.body.classList.toggle("is-scrolled", window.scrollY > 24);
  tickingScrollUpdate = false;
}

function scheduleScrolledStateUpdate() {
  if (tickingScrollUpdate) return;
  tickingScrollUpdate = true;
  window.requestAnimationFrame(updateScrolledState);
}

function isStaticDeployment() {
  return !["127.0.0.1", "localhost", ""].includes(window.location.hostname);
}

function orderedSources(apiPath, staticPath) {
  return isStaticDeployment() ? [staticPath, apiPath] : [apiPath, staticPath];
}

async function fetchFirstAvailable(resources) {
  const errors = [];

  for (const resource of resources) {
    try {
      const response = await fetch(resource);
      if (response.ok) return response;
      errors.push(`${resource}: ${response.status}`);
    } catch (error) {
      errors.push(`${resource}: ${error.message}`);
    }
  }

  throw new Error(`读取失败：${errors.join("；")}`);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function flushList(output, list) {
  if (!list) return;
  const tag = list.type === "ordered" ? "ol" : "ul";
  output.push(`<${tag}>`);
  for (const item of list.items) {
    output.push(`<li>${parseInline(item)}</li>`);
  }
  output.push(`</${tag}>`);
}

function markdownToHtml(markdown) {
  const output = [];
  let paragraph = [];
  let list = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    output.push(`<p>${parseInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList(output, list);
      list = null;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList(output, list);
      list = null;
      const level = heading[1].length;
      output.push(`<h${level}>${parseInline(heading[2])}</h${level}>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    if (ordered || unordered) {
      flushParagraph();
      const type = ordered ? "ordered" : "unordered";
      if (!list || list.type !== type) {
        flushList(output, list);
        list = { type, items: [] };
      }
      list.items.push((ordered || unordered)[1]);
      continue;
    }

    flushList(output, list);
    list = null;
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList(output, list);
  return output.join("\n");
}

async function loadIndex() {
  const response = await fetchFirstAvailable(orderedSources("/api/index", "/data/docs/index.json"));
  indexData = await response.json();
  renderSectionList();
}

function renderSectionList() {
  sectionList.innerHTML = "";
  for (const section of indexData.sections) {
    const button = document.createElement("button");
    button.className = "section-button";
    button.type = "button";
    button.textContent = section.title;
    button.dataset.sectionId = section.id;
    button.addEventListener("click", () => loadSection(section.id));
    sectionList.appendChild(button);
  }
}

function setActiveNavigation(sectionId) {
  for (const button of sectionList.querySelectorAll(".section-button")) {
    button.classList.toggle("active", button.dataset.sectionId === sectionId);
  }
  changeLogButton.classList.toggle("active", sectionId === "change-log");
}

function setMobilePageLabel(label) {
  mobileCurrentPage.textContent = label;
}

function closeMobileNavigation() {
  document.body.classList.remove("is-mobile-nav-open");
  mobileNavToggle.setAttribute("aria-expanded", "false");
}

async function loadSection(sectionId) {
  const section = indexData.sections.find((item) => item.id === sectionId);
  if (!section) return;

  currentView = { type: "section", id: sectionId };
  pageTitle.textContent = section.title;
  setMobilePageLabel(section.title);
  docStatus.textContent = "正在读取";
  documentView.innerHTML = "";
  setActiveNavigation(sectionId);
  closeMobileNavigation();

  try {
    const response = await fetchFirstAvailable(orderedSources(
      `/api/doc/${encodeURIComponent(section.file)}`,
      `/data/docs/${encodeURIComponent(section.file)}`,
    ));
    const markdown = await response.text();
    documentView.innerHTML = markdownToHtml(markdown);
    docStatus.textContent = `${indexData.document.status} · ${section.file}`;
  } catch (error) {
    documentView.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    docStatus.textContent = "读取失败";
  }
}

function renderChangeLog(data) {
  const entries = data.entries
    .slice()
    .sort((left, right) => right.time.localeCompare(left.time))
    .map((entry) => {
      const changedParts = entry.changed_parts
        .map((part) => `<li><code>${escapeHtml(part)}</code></li>`)
        .join("");
      const snapshot = entry.previous_snapshot
        ? `<div>变更前快照：<code>${escapeHtml(entry.previous_snapshot)}</code></div>`
        : "<div>变更前快照：无</div>";

      return `
        <section class="change-log-entry">
          <h3>${escapeHtml(entry.title)}</h3>
          <div class="change-log-meta">
            <div>时间：${escapeHtml(entry.time)}</div>
            <div>更新者：${escapeHtml(entry.updated_by)}</div>
            ${snapshot}
          </div>
          <p>${escapeHtml(entry.reason)}</p>
          <h4>更新范围</h4>
          <ul class="file-list">${changedParts}</ul>
        </section>
      `;
    })
    .join("");

  return `<div class="change-log-list">${entries}</div>`;
}

async function loadChangeLog() {
  currentView = { type: "changelog" };
  pageTitle.textContent = "更新日志";
  setMobilePageLabel("更新日志");
  docStatus.textContent = "正在读取";
  documentView.innerHTML = "";
  setActiveNavigation("change-log");
  closeMobileNavigation();

  try {
    const response = await fetchFirstAvailable(orderedSources(
      "/api/changelog",
      "/data/change-log/index.json",
    ));
    const data = await response.json();
    documentView.innerHTML = renderChangeLog(data);
    docStatus.textContent = data.description;
  } catch (error) {
    documentView.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    docStatus.textContent = "读取失败";
  }
}

async function init() {
  try {
    await loadIndex();
    await loadSection(currentView.id);
  } catch (error) {
    pageTitle.textContent = "读取失败";
    docStatus.textContent = "请检查本地服务";
    documentView.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

refreshButton.addEventListener("click", async () => {
  await loadIndex();
  if (currentView.type === "changelog") {
    await loadChangeLog();
  } else {
    await loadSection(currentView.id);
  }
});

changeLogButton.addEventListener("click", loadChangeLog);
mobileNavToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("is-mobile-nav-open");
  mobileNavToggle.setAttribute("aria-expanded", String(isOpen));
});
primaryNavigation.addEventListener("click", (event) => {
  if (event.target.closest(".section-button")) closeMobileNavigation();
});
window.addEventListener("scroll", scheduleScrolledStateUpdate, { passive: true });
updateScrolledState();

init();
