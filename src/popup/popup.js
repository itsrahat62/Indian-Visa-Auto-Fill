import { getProfiles, getActiveId, setActiveId, getSettings, getActiveProfile, personFiles } from "../lib/store.js";

import { visaKind } from "../lib/relevance.js";

import { slotsFor } from "../lib/doc-slots.js";

import { modeFor, LABEL, HOME, VISA } from "../lib/mode.js";

const $ = id => document.getElementById(id);

let tab = null;

async function activeTab() {
    const [t] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    return t || null;
}

function ask(msg) {
    return new Promise(resolve => {
        if (!tab?.id) return resolve(null);
        chrome.tabs.sendMessage(tab.id, msg, res => {
            void chrome.runtime.lastError;
            resolve(res || null);
        });
    });
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

async function loadProfiles() {
    const list = await getProfiles();
    const active = await getActiveId();
    const sel = $("profile");
    if (!list.length) {
        sel.innerHTML = '<option value="">— No profile yet —</option>';
        return;
    }
    sel.innerHTML = list.map(p => `<option value="${p.id}"${p.id === active ? " selected" : ""}>${esc(p.name)}</option>`).join("");
}

$("profile")?.addEventListener("change", async e => {
    await setActiveId(e.target.value);
    await ask({
        type: "IV_REFRESH"
    });
    await loadWebFile();
});

async function loadWebFile() {
    const nameEl = $("webFileName");
    if (!nameEl) return;
    const profile = await getActiveProfile();
    if (!profile) {
        nameEl.textContent = "No profile selected";
        return;
    }
    const files = personFiles(profile);
    if (!files.length) {
        nameEl.textContent = `No files for ${profile.name} yet`;
        return;
    }
    const {category: category, sub: sub} = visaKind(profile.data?.visaPurpose || "");
    const missing = slotsFor(category, sub).filter(s => s.mandatory && !files.some(f => f.slot === s.slot)).length;
    nameEl.textContent = missing ? `${files.length} file(s) — ${missing} required document(s) still missing` : `${files.length} file(s) — every required document is here`;
}

$("openDocs")?.addEventListener("click", async () => {
    const profile = await getActiveProfile();
    if (profile) await setActiveId(profile.id);
    chrome.tabs.create({
        url: chrome.runtime.getURL("src/options/options.html#documents")
    });
    window.close();
});

document.querySelector(".quick")?.addEventListener("click", async e => {
    const tab = e.target.closest("button")?.dataset.open;
    if (!tab) return;
    const profile = await getActiveProfile();
    if (profile) await setActiveId(profile.id);
    chrome.tabs.create({
        url: chrome.runtime.getURL(`src/options/options.html#${tab}`)
    });
    window.close();
});

let mode = "";

let buildName = "";

function showMode(m) {
    mode = m;
    $("visaMode").hidden = m !== VISA;
    $("noMode").hidden = !!m;
    const title = $("modeTitle");
    if (!title) return;
    const icon = m ? `${LABEL[m].icon} ` : "";
    title.textContent = buildName || "Indian Visa Autofill PRO";
    if (icon) title.textContent = icon + title.textContent;
}

async function loadAutoMode() {
    const s = await getSettings();
    const visaOn = !!s.autoVisa;
    let anyOn = visaOn;
    let footerText = mode === VISA && visaOn ? "Filling as you go" : "Local only — nothing leaves this computer";
    const set = (cardId, subId, toggleId, on, text) => {
        const t = $(toggleId);
        if (t) t.checked = on;
        const c = $(cardId);
        if (c) c.classList.toggle("on", on);
        const b = $(subId);
        if (b) b.textContent = text;
    };
    set("visaCard", "visaSub", "visaToggle", visaOn, visaOn ? "On — each page fills as you open it" : "Off — use the button below instead");
    const dot = $("statusDot");
    if (dot) dot.className = anyOn ? "dot auto" : "dot active";
    const footer = $("footerText");
    if (footer) footer.textContent = footerText;
}

function wireAuto(toggleId, which, onText, offText) {
    $(toggleId)?.addEventListener("change", e => {
        const on = e.target.checked;
        chrome.runtime.sendMessage({
            type: "IV_SET_AUTO",
            which: which,
            on: on
        }, async () => {
            void chrome.runtime.lastError;
            await loadAutoMode();
            $("result").textContent = on ? onText : offText;
        });
    });
}

wireAuto("visaToggle", "visa", "Each nic.in page will fill as you open it. Nothing is submitted for you.", 'Off — use "Fill this page" when you want it.');

$("open-visa")?.addEventListener("click", () => {
    chrome.tabs.create({
        url: HOME[VISA]
    });
    window.close();
});

async function refreshPageState() {
    const el = $("pageState");
    if (!el) return;
    if (!mode) {
        el.textContent = "No portal page open";
        return;
    }
    const res = await ask({
        type: "IV_PING"
    });
    el.textContent = res?.page ? res.page.title : LABEL[mode].site;
}

$("fill")?.addEventListener("click", async () => {
    const res = await ask({
        type: "IV_FILL"
    });
    if (!res?.ok) {
        $("result").innerHTML = '<span class="bad">Could not fill — reload page or check profile.</span>';
        return;
    }
    const f = res.failed?.length || 0;
    $("result").innerHTML = `<b>${res.filled}</b> fields filled${f ? ` · <span class="bad">${f} empty</span>` : " ✓"}`;
});

$("edit")?.addEventListener("click", () => openOpts("profiles"));

$("settings")?.addEventListener("click", () => openOpts("settings"));

$("guide-btn")?.addEventListener("click", () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("src/docs/docs.html")
    });
    window.close();
});

function openOpts(hash) {
    chrome.tabs.create({
        url: chrome.runtime.getURL(`src/options/options.html#${hash}`)
    });
    window.close();
}

(async function init() {
    tab = await activeTab();
    const {BUILD: BUILD, BUILD_NAME: BUILD_NAME} = await import("../lib/build.js").catch(() => ({
        BUILD: "",
        BUILD_NAME: ""
    }));
    if (BUILD_NAME) {
        buildName = BUILD_NAME;
        document.title = BUILD_NAME;
    }
    if (BUILD) {
        for (const el of document.querySelectorAll("[data-build]")) {
            if (el.dataset.build !== BUILD) el.remove();
        }
        document.body.dataset.build = BUILD;
    }
    showMode(modeFor(tab?.url) || BUILD || "");
    await loadProfiles();
    await loadAutoMode();
    await loadWebFile();
    await refreshPageState();
})();
