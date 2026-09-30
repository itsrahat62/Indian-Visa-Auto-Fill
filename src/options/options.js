import { GROUPS, FIELDS } from "../lib/schema.js";

import { applies, labelFor, visaKind } from "../lib/relevance.js";

import { guideFor, PHOTO_RULES } from "../lib/guide.js";

import { renderSiteView } from "./site-view.js";

import { buildWebFileDemo } from "../lib/webfile-demo.js";

import { guideEnFor } from "../lib/guide-en.js";

import { labelBnFor } from "../lib/labels-bn.js";

import { slotsFor, slotsAreDerived, DOC_RULES_PORTAL } from "../lib/doc-slots.js";

import { DEFAULT_POS } from "../lib/widget-pos.js";

import { fileNameFor, DOC_KINDS } from "../lib/person-files.js";

import { fitToLimit, blobToDataUrl, shrinkImage, squareCrop } from "../lib/shrink.js";

import * as store from "../lib/store.js";

import { extractProfile, toDDMMYYYY } from "../lib/extract.js";

import { parseMrz, mrzToProfile } from "../lib/mrz.js";

import { LETTER_KINDS, renderLetter, nameOf } from "../lib/letters.js";

import { isInvitationLetter, parseInvitation, invitationToProfiles, travelParty } from "../lib/invitation.js";

import { PORTALS, portalsFor } from "../lib/portals.js";

import { fieldInBuild, groupInBuild, docSectionsFor } from "../lib/build-fields.js";

import { readText, looksScanned, renderPages } from "../lib/pdftext.js";

const $ = (s, r = document) => r.querySelector(s);

const $$ = (s, r = document) => [ ...r.querySelectorAll(s) ];

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[c]));

let toastTimer;

function toast(msg, ok = true) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = `toast show ${ok ? "" : "bad"}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        t.className = "toast";
    }, 3400);
}

function showTab(name) {
    const valid = $$("#nav button").map(b => b.dataset.tab);
    const tab = valid.includes(name) ? name : "import";
    $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
    $$(".tab").forEach(s => s.classList.toggle("on", s.id === `tab-${tab}`));
    if (location.hash.slice(1) !== tab) history.replaceState(null, "", `#${tab}`);
    if (tab === "profiles") {
        viewPrefs.view = null;
        viewPrefs.page = 0;
        if (current) buildEditor(current);
    }
    if (tab === "mappings") renderMappings();
    if (tab === "presets") {
        renderStays();
        renderCompanies();
    }
    if (tab === "documents") renderDocuments();
    if (tab === "letters") renderLetters();
    if (tab === "portals") renderPortals();
}

$("#nav").addEventListener("click", e => {
    const tab = e.target.closest("button")?.dataset.tab;
    if (tab) showTab(tab);
});

window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

const INDIA_STATE_KEYS = new Set([ "refIndiaState", "stayState" ]);

const INDIA_DIST_KEYS = new Set([ "refIndiaDistrict", "stayDistrict" ]);

let indiaLoaded = false;

async function loadIndiaLists() {
    if (indiaLoaded) return;
    indiaLoaded = true;
    const wanted = [ ...INDIA_STATE_KEYS, ...INDIA_DIST_KEYS ];
    if (!wanted.some(k => fieldInBuild(k, BUILD_ID))) return;
    try {
        const res = await fetch(chrome.runtime.getURL("src/lib/india-states.json"));
        const {states: states} = await res.json();
        const mk = (id, values) => {
            const dl = document.createElement("datalist");
            dl.id = id;
            dl.innerHTML = [ ...new Set(values) ].sort().map(v => `<option value="${esc(v.toUpperCase())}"></option>`).join("");
            document.body.appendChild(dl);
        };
        mk("dl-in-state", states.map(s => s.state));
        mk("dl-in-dist", states.flatMap(s => s.districts || []));
    } catch (err) {
        console.warn("India state list unavailable:", err);
    }
}

const listAttrFor = key => INDIA_STATE_KEYS.has(key) ? ' list="dl-in-state"' : INDIA_DIST_KEYS.has(key) ? ' list="dl-in-dist"' : "";

let current = null;

let saveTimer = null;

let BUILD_ID = "";

async function loadProfileSelects() {
    const list = await store.getProfiles();
    const active = await store.getActiveId();
    const opts = list.map(p => `<option value="${p.id}"${p.id === active ? " selected" : ""}>${esc(p.name)}</option>`).join("");
    $("#profSelect").innerHTML = opts || '<option value="">—</option>';
    $("#targetProfile").innerHTML = `<option value="">➕ As New Profile</option>${opts}`;
    return list;
}

const pickLabel = () => viewPrefs.lang === "en" ? "— Select —" : "— বেছে নিন —";

function fieldInput(f, data) {
    const v = esc(data[f.key] || "");
    return f.type === "textarea" ? `<textarea rows="2" data-key="${f.key}">${v}</textarea>` : f.type === "yn" || f.type === "radioYN" ? `<select data-key="${f.key}"><option value="">${pickLabel()}</option><option value="Yes"${data[f.key] === "Yes" ? " selected" : ""}>Yes</option><option value="No"${data[f.key] === "No" ? " selected" : ""}>No</option></select>` : f.opts ? `<select data-key="${f.key}"><option value="">${pickLabel()}</option>${f.opts.map(o => `<option${data[f.key] === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>` : f.suggest ? `<input type="text" data-key="${f.key}" value="${v}" list="sg-${f.key}" autocomplete="off" />` + `<datalist id="sg-${f.key}">${f.suggest.map(o => `<option value="${esc(o)}"></option>`).join("")}</datalist>` : `<input type="${f.type === "password" ? "password" : "text"}" data-key="${f.key}" value="${v}"${listAttrFor(f.key)}${f.type === "password" ? ' autocomplete="off"' : ""} ${f.type === "date" ? 'placeholder="DD/MM/YYYY"' : ""} />`;
}

const viewPrefs = {
    loaded: false,
    view: null,
    lang: "bn",
    page: 0
};

function editorBar() {
    const tab = (v, icon, label, sub) => `<button type="button" role="tab" data-pick-view="${v}"\n      class="ed-tab${viewPrefs.view === v ? " on" : ""}" aria-selected="${viewPrefs.view === v}">\n      <span class="ed-ic" aria-hidden="true">${icon}</span><span><b>${label}</b><small>${sub}</small></span></button>`;
    const lang = (v, label) => `<button type="button" data-pick-lang="${v}" class="${viewPrefs.lang === v ? "on" : ""}"\n      aria-pressed="${viewPrefs.lang === v}">${label}</button>`;
    return `<div class="ed-bar">\n      <div class="ed-tabs" role="tablist" aria-label="ফর্মের ধরন">\n        ${tab("site", "🖥", "Visa Site View", "ভিসা সাইটের মতো")}\n        ${tab("cards", "🗂", "Profile View", "বিষয় অনুযায়ী কার্ড")}\n      </div>\n      <div class="ed-side">\n        <div class="ed-lang" title="ভাষা / Language"><span aria-hidden="true">🌐</span>${lang("bn", "বাং")}${lang("en", "EN")}</div>\n        <button type="button" class="ghost ed-demo" data-demo-pdf="1" title="সব তথ্য দেওয়ার পর ওয়েব ফাইল কেমন দেখাবে — মিলিয়ে দেখার জন্য">ওয়েব ফাইলের ডেমো (PDF)</button>\n      </div>\n    </div>`;
}

function chooserHtml() {
    return `<div class="ed-choose">\n      <h2>কোনভাবে তথ্য দিতে চান?</h2>\n      <p class="lede">দুইভাবেই একই প্রোফাইল — যেকোনো সময় উপরে থেকে বদলাতে পারবেন।</p>\n      <div class="ed-opts">\n        <button type="button" class="ed-opt" data-pick-view="site">\n          <span class="ed-art ed-art-site"><i></i><i></i><i></i></span>\n          <strong>Visa Site View</strong>\n          <small>indianvisa-bangladesh.nic.in-এর পাতার মতো সাজানো — একই ক্রম, একই ঘর। প্রতিটা ঘরের পাশে (i)-তে কী দিতে হবে লেখা।</small>\n        </button>\n        <button type="button" class="ed-opt" data-pick-view="cards">\n          <span class="ed-art ed-art-cards"><i></i><i></i><i></i></span>\n          <strong>Profile View</strong>\n          <small>বিষয় অনুযায়ী ভাগ করা কার্ড — শুধু যে ঘরগুলো এই আবেদনকারীর লাগে।</small>\n        </button>\n      </div>\n    </div>`;
}

async function sitePhoto(profile, action) {
    let done = false;
    if (action === "recrop") {
        done = await recropPhoto(profile.id);
    } else {
        const file = await new Promise(resolve => {
            const inp = document.createElement("input");
            inp.type = "file";
            inp.accept = "image/jpeg,image/png,image/webp";
            inp.onchange = () => resolve(inp.files?.[0] || null);
            inp.click();
        });
        if (file) done = await framePhoto(profile.id, file);
    }
    if (!done) return;
    const fresh = (await store.getProfiles()).find(p => p.id === profile.id);
    if (fresh) {
        current = fresh;
        buildEditor(current);
    }
}

async function downloadWebFileDemo(profile) {
    const fresh = (await store.getProfiles()).find(p => p.id === profile.id) || profile;
    const rec = store.fileOfKind(fresh, "photo");
    let photo = null;
    if (rec) {
        const url = await store.readFileBytes(rec.id);
        if (url && /^data:image\/jpe?g/i.test(url)) {
            const bin = atob(url.split(",")[1]);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            photo = {
                bytes: bytes,
                w: rec.w || 350,
                h: rec.h || 350
            };
        }
    }
    const uploadedSlots = (fresh.files || []).map(f => f.slot).filter(Boolean);
    const pdf = buildWebFileDemo(fresh.data || {}, {
        photo: photo,
        uploadedSlots: uploadedSlots
    });
    const blob = new Blob([ pdf ], {
        type: "application/pdf"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const who = String(fresh.name || "applicant").replace(/[^\w .-]+/g, "").trim().replace(/\s+/g, "_");
    a.download = `DEMO_web_file_${who}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3e4);
    toast("ডেমো PDF নামানো হলো — এটা শুধু মিলিয়ে দেখার জন্য, জমা দেওয়ার কাগজ নয়");
}

async function pickEditorPref(patch) {
    Object.assign(viewPrefs, patch);
    await store.saveSettings({
        editorLang: viewPrefs.lang
    });
    buildEditor(current);
}

function buildEditor(profile) {
    const wrap = $("#editor");
    if (!profile) {
        wrap.innerHTML = '<p class="empty">No profile yet. Click "+ New Profile" above or import a passport.</p>';
        return;
    }
    if (!viewPrefs.loaded) {
        store.getSettings().then(st => {
            viewPrefs.loaded = true;
            viewPrefs.lang = st.editorLang === "en" ? "en" : "bn";
            buildEditor(profile);
        });
        return;
    }
    wrap.onclick = async e => {
        const pic = e.target.closest("img[data-view]");
        if (pic) {
            await openPreview(pic.dataset.view, pic.dataset.name || "");
            return;
        }
        const b = e.target.closest("button");
        if (b?.dataset.svPhoto) {
            await sitePhoto(profile, b.dataset.svPhoto);
            return;
        }
        if (b?.dataset.demoPdf) {
            await downloadWebFileDemo(profile);
            return;
        }
        if (b?.dataset.pickView) pickEditorPref({
            view: b.dataset.pickView
        }); else if (b?.dataset.pickLang) pickEditorPref({
            lang: b.dataset.pickLang
        }); else if (b?.dataset.svGo) {
            viewPrefs.page = Number(b.dataset.svGo) || 0;
            buildEditor(profile);
            wrap.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };
    if (!viewPrefs.view) {
        wrap.innerHTML = chooserHtml();
        return;
    }
    const data = profile.data || {};
    const renderGroup = (g, open) => {
        const shown = g.fields.filter(f => fieldInBuild(f.key, BUILD_ID) && applies(f.key, data));
        if (!shown.length) return "";
        const filled = shown.filter(f => data[f.key]).length;
        const fields = shown.map(f => {
            const v = esc(data[f.key] || "");
            const wide = f.type === "textarea";
            const input = fieldInput(f, data);
            const en = viewPrefs.lang === "en";
            const guide = en ? guideEnFor(f) || guideFor(f) : guideFor(f);
            return `<div class="f${wide ? " full" : ""}${data[f.key] ? " done" : ""}">\n          <label for="${f.key}">${esc(en ? labelFor(f, data) : labelBnFor(f))}</label>\n          ${input}\n          ${guide ? `<div class="fhint">${esc(guide)}</div>` : ""}\n        </div>`;
        }).join("");
        const complete = filled === shown.length;
        return `<details class="group"${open ? " open" : ""}>\n        <summary><span class="g-ico">${g.icon}</span> ${esc(g.title)}\n          <span class="g-count${complete ? " full" : ""}">${filled}/${shown.length}</span></summary>\n        <div class="fields">${fields}</div>\n      </details>`;
    };
    const partCount = groups => {
        let filled = 0;
        let total = 0;
        for (const g of groups) {
            const shown = g.fields.filter(f => fieldInBuild(f.key, BUILD_ID) && applies(f.key, data));
            total += shown.length;
            filled += shown.filter(f => data[f.key]).length;
        }
        return {
            filled: filled,
            total: total
        };
    };
    const part = (title, sub, allGroups, openFirst) => {
        const groups = allGroups.filter(g => groupInBuild(g, BUILD_ID));
        const body = groups.map((g, i) => renderGroup(g, openFirst && i === 0)).join("");
        if (!body) return "";
        const {filled: filled, total: total} = partCount(groups);
        return `<section class="part">\n        <header class="part-head">\n          <div>\n            <h2>${esc(title)}</h2>\n            <small>${esc(sub)}</small>\n          </div>\n          <span class="part-count${filled === total ? " full" : ""}">${filled}/${total}</span>\n        </header>\n        ${body}\n      </section>`;
    };
    let html = part("ভিসার আবেদন", "indianvisa-bangladesh.nic.in — ৯ পাতার ফর্ম", GROUPS, true);
    const shows = key => fieldInBuild(key, BUILD_ID) && applies(key, data);
    if (viewPrefs.view === "site") {
        html = renderSiteView({
            data: data,
            lang: viewPrefs.lang,
            shows: shows,
            fieldInput: f => fieldInput(f, data),
            esc: esc,
            page: viewPrefs.page,
            photo: store.fileOfKind(profile, "photo")
        });
    }
    wrap.innerHTML = editorBar() + html;
    for (const t of wrap.querySelectorAll("img[data-thumb]")) {
        store.readFileBytes(t.dataset.thumb).then(u => {
            if (u) t.src = u;
        });
    }
    wrap.oninput = onEditorInput;
    wrap.onchange = onEditorInput;
}

const GOVERNING = new Set([ "occupation", "occupationDetailsOf", "visaPurpose", "medicalRole", "maritalStatus", "permanentSame", "otherPassport", "militaryService", "hasPreviousVisa", "visaRefused", "grandparentsPak", "changedName", "religion" ]);

function onEditorInput(e) {
    const key = e.target.dataset?.key;
    if (!key || !current) return;
    let v = e.target.value;
    if (FIELDS[key]?.type === "date") {
        const conv = toDDMMYYYY(v);
        if (conv && conv !== v && /\d{4}$/.test(v)) v = conv;
    }
    current.data[key] = v;
    queueSave();
    if (GOVERNING.has(key) && e.type === "change") buildEditor(current);
}

function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        if (!current) return;
        await store.upsertProfile(current);
        const s = $("#saveState");
        s.textContent = "✓ Saved";
        s.classList.add("on");
        setTimeout(() => s.classList.remove("on"), 1400);
        await loadProfileSelects();
    }, 500);
}

async function selectProfile(id) {
    const list = await store.getProfiles();
    current = list.find(p => p.id === id) || list[0] || null;
    if (current) await store.setActiveId(current.id);
    buildEditor(current);
}

$("#profSelect").addEventListener("change", e => selectProfile(e.target.value));

$("#profNew").addEventListener("click", async () => {
    const name = prompt("Profile Name?", "New Applicant");
    if (!name) return;
    const p = await store.createProfile(name);
    await store.setActiveId(p.id);
    await loadProfileSelects();
    await selectProfile(p.id);
    toast("Profile created successfully");
});

$("#profDup").addEventListener("click", async () => {
    if (!current) return;
    const p = await store.duplicateProfile(current.id);
    await loadProfileSelects();
    await selectProfile(p.id);
    toast("Profile duplicated");
});

$("#profDel").addEventListener("click", async () => {
    if (!current) return;
    if (!confirm(`Delete profile "${current.name}"? This cannot be undone.`)) return;
    await store.deleteProfile(current.id);
    await loadProfileSelects();
    await selectProfile(await store.getActiveId() || "");
    toast("Profile deleted");
});

let pending = null;

const drop = $("#drop");

$("#pick").addEventListener("click", e => {
    e.stopPropagation();
    $("#file").click();
});

drop.addEventListener("click", () => $("#file").click());

drop.addEventListener("dragover", e => {
    e.preventDefault();
    drop.classList.add("over");
});

drop.addEventListener("dragleave", () => drop.classList.remove("over"));

drop.addEventListener("drop", e => {
    e.preventDefault();
    drop.classList.remove("over");
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
});

$("#file").addEventListener("change", e => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
});

function progress(pct, msg) {
    const box = $("#progress");
    box.hidden = false;
    $("#progress .bar i").style.width = `${Math.round(pct * 100)}%`;
    $(".ptxt").textContent = msg;
}

async function handleFile(file) {
    $("#review").hidden = true;
    try {
        let text = "";
        const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
        if (isPdf) {
            progress(.15, "Opening PDF…");
            text = await readText(file);
            if (looksScanned(text)) {
                progress(.25, "Scanned document — Running fast OCR…");
                const canvases = await renderPages(file, {
                    maxPages: 2
                });
                const {recogniseAll: recogniseAll} = await (import("../lib/ocr.js"));
                text = await recogniseAll(canvases, (p, s) => progress(.3 + p * .65, `OCR: ${s}`));
            } else {
                progress(.8, "Text extracted ✓");
            }
        } else {
            progress(.2, "Preparing image…");
            const {recognise: recognise, fileToImage: fileToImage} = await (import("../lib/ocr.js"));
            const img = await fileToImage(file);
            text = await recognise(img, (p, s) => progress(.2 + p * .75, `OCR: ${s}`));
        }
        progress(1, "Complete ✓");
        setTimeout(() => {
            $("#progress").hidden = true;
        }, 700);
        const result = extractProfile(text);
        if (!result.filled) {
            toast("Could not parse text. Please provide a clearer scan or paste MRZ.", false);
            return;
        }
        showReview(result);
    } catch (err) {
        console.error(err);
        $("#progress").hidden = true;
        toast(`Failed to read file: ${err.message}`, false);
    }
}

function showReview(result) {
    pending = result;
    const warn = new Set(result.mrz?.warnings || []);
    $("#reviewMeta").textContent = `${result.filled} fields · ${result.source === "application" ? "Previous Application" : "Passport"}` + (result.mrz ? ` · MRZ ${result.mrz.confidence}` : "");
    $("#reviewList").innerHTML = Object.entries(result.data).map(([k, v]) => `\n      <label class="rrow${warn.has(k) ? " warn" : ""}">\n        <input type="checkbox" checked data-k="${k}" />\n        <span style="flex:1;min-width:0">\n          <span class="rk">${esc(FIELDS[k]?.labelBn || k)}</span>\n          <input class="rv" data-v="${k}" value="${esc(v)}" />\n        </span>\n        ${warn.has(k) ? '<span class="warn-chip">Verify</span>' : ""}\n      </label>`).join("");
    $("#newName").value = result.suggestedName;
    $("#review").hidden = false;
    $("#review").scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

$("#saveImport").addEventListener("click", async () => {
    if (!pending) return;
    const picked = {};
    for (const cb of $$("#reviewList input[type=checkbox]")) {
        if (!cb.checked) continue;
        const k = cb.dataset.k;
        const v = $(`#reviewList input[data-v="${k}"]`)?.value?.trim();
        if (v) picked[k] = v;
    }
    if (!Object.keys(picked).length) {
        toast("No fields selected", false);
        return;
    }
    const targetId = $("#targetProfile").value;
    if (targetId) {
        const list = await store.getProfiles();
        const p = list.find(x => x.id === targetId);
        Object.assign(p.data, picked);
        await store.upsertProfile(p);
        await store.setActiveId(p.id);
        toast(`Profile "${p.name}" updated ✓`);
    } else {
        const p = await store.createProfile($("#newName").value.trim() || "Imported", picked);
        await store.setActiveId(p.id);
        toast(`Profile "${p.name}" created ✓`);
    }
    if (fieldInBuild("attendantOfApplicationId", BUILD_ID)) {
        const givenTo = await store.linkPatientApplicationId(picked.passportNo, picked.applicationId);
        if (givenTo.length) {
            toast(`রুগির Application Id ${givenTo.join(" ও ")}-এর ঘরেও বসানো হলো ✓`);
        }
    }
    pending = null;
    $("#review").hidden = true;
    await loadProfileSelects();
    await selectProfile(await store.getActiveId());
    showTab("profiles");
});

$("#mrzGo").addEventListener("click", () => {
    const raw = $("#mrzText").value;
    const mrz = parseMrz(raw);
    if (!mrz) {
        toast("Could not parse MRZ — please enter both lines", false);
        return;
    }
    const data = mrzToProfile(mrz);
    showReview({
        data: data,
        mrz: mrz,
        source: "passport",
        filled: Object.keys(data).length,
        suggestedName: [ data.givenName, data.surname ].filter(Boolean).join(" ") || "MRZ Profile"
    });
});

const STAY_FIELDS = [ [ "name", "Hotel / Place Name" ], [ "address", "Address" ], [ "state", "State", "dl-in-state" ], [ "district", "District", "dl-in-dist" ], [ "phone", "Phone" ] ];

const COMP_FIELDS = [ [ "name", "Company Name" ], [ "address", "Address" ], [ "phone", "Phone" ], [ "email", "Email" ], [ "website", "Website" ], [ "signee", "Designation / Signee" ] ];

function renderCardList(el, items, fields, onChange) {
    el.innerHTML = items.map((item, i) => `\n    <div class="card" data-i="${i}">\n      <div class="ctitle">${esc(item[fields[0][0]] || "(Unnamed)")}<button data-del="${i}">🗑</button></div>\n      ${fields.map(([k, lbl, dl]) => `<input data-f="${k}" placeholder="${esc(lbl)}"${dl ? ` list="${dl}"` : ""} value="${esc(item[k] || "")}" />`).join("")}\n    </div>`).join("") || '<p class="empty">No entries yet.</p>';
    el.oninput = e => {
        const card = e.target.closest(".card");
        const f = e.target.dataset.f;
        if (!card || !f) return;
        items[+card.dataset.i][f] = e.target.value;
        onChange(items);
    };
    el.onclick = e => {
        const del = e.target.dataset.del;
        if (del === undefined) return;
        items.splice(+del, 1);
        onChange(items);
        renderCardList(el, items, fields, onChange);
    };
}

async function renderStays() {
    const items = await store.getStays();
    renderCardList($("#stayList"), items, STAY_FIELDS, store.saveStays);
}

$("#stayAdd").addEventListener("click", async () => {
    const items = await store.getStays();
    items.push({});
    await store.saveStays(items);
    renderStays();
});

async function renderCompanies() {
    const items = await store.getCompanies();
    renderCardList($("#compList"), items, COMP_FIELDS, store.saveCompanies);
}

$("#compAdd").addEventListener("click", async () => {
    const items = await store.getCompanies();
    items.push({});
    await store.saveCompanies(items);
    renderCompanies();
});

async function renderMappings() {
    const all = await store.getAllLearned();
    const pages = Object.entries(all);
    const box = $("#mapList");
    if (!pages.length) {
        box.innerHTML = '<p class="empty">No taught mappings yet.</p>';
        return;
    }
    box.innerHTML = pages.map(([pk, map]) => `\n    <div class="mpage">\n      <h3>${esc(pk)}</h3>\n      ${Object.entries(map).map(([sel, key]) => `\n        <div class="mrow">\n          <code>${esc(sel)}</code>\n          <span>→ ${esc(FIELDS[key]?.labelBn || key)}</span>\n          <button data-pk="${esc(pk)}" data-sel="${esc(sel)}">✕</button>\n        </div>`).join("")}\n    </div>`).join("");
    box.onclick = async e => {
        const btn = e.target.closest("button[data-sel]");
        if (!btn) return;
        const all2 = await store.getAllLearned();
        delete all2[btn.dataset.pk][btn.dataset.sel];
        if (!Object.keys(all2[btn.dataset.pk]).length) delete all2[btn.dataset.pk];
        await chrome.storage.local.set({
            learned: all2
        });
        renderMappings();
        toast("Mapping deleted");
    };
}

const SETTING_GROUPS = [ {
    title: "Visa form",
    sub: "indianvisa-bangladesh.nic.in",
    build: "visa",
    rows: [ {
        key: "visaMode",
        type: "choice",
        title: "How much should it do on its own?",
        desc: "Captchas are always yours, and the final Submit is never pressed."
    }, {
        key: "uppercase",
        title: "Type in capitals",
        desc: "The portal wants names and addresses in capitals."
    } ]
}, {
    title: "The panel",
    sub: "On the visa form pages",
    rows: [ {
        key: "widget",
        title: "Show the floating panel",
        desc: "The draggable panel on portal pages."
    }, {
        key: "resetWidgetPos",
        type: "action",
        title: "Put the panel back in the corner",
        desc: "If it has ended up off the edge of the window, this returns it to the bottom right.",
        button: "Reset position"
    }, {
        key: "highlight",
        title: "Flash filled fields green",
        desc: "So you can see what was filled and what was not."
    } ]
} ];

const SETTING_ROWS = SETTING_GROUPS.flatMap(g => g.rows);

const settingGroupsFor = build => SETTING_GROUPS.filter(g => !g.build || !build || g.build === build);

async function renderSettings() {
    const s = await store.getSettings();
    $("#settingsList").innerHTML = settingGroupsFor(BUILD_ID).map(g => `\n    <h2 class="sgroup">${esc(g.title)}<small>${esc(g.sub)}</small></h2>\n    ${g.rows.map(r => r.type === "choice" ? `\n    <div class="srow choice">\n      <div class="stxt"><strong>${esc(r.title)}</strong><small>${esc(r.desc)}</small>\n        <div class="modes">\n          ${store.VISA_MODES.map(m => `\n            <label class="mode${store.visaModeOf(s) === m.id ? " on" : ""}">\n              <input type="radio" name="visaMode" value="${m.id}"${store.visaModeOf(s) === m.id ? " checked" : ""} />\n              <span class="mode-t">${esc(m.nameBn)}</span>\n              <span class="mode-d">${esc(m.descBn)}</span>\n            </label>`).join("")}\n        </div>\n      </div>\n    </div>` : `\n    <div class="srow${r.warn ? " warn" : ""}">\n      <div class="stxt"><strong>${esc(r.title)}</strong><small>${esc(r.desc)}</small></div>\n      ${r.type === "choice" ? "" : r.type === "action" ? `<button class="ghost" data-act="${r.key}">${esc(r.button || "Do it")}</button>` : r.type === "select" ? `<select data-s="${r.key}" style="width:auto">${r.opts.map(([v, l]) => `<option value="${v}"${s[r.key] === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>` : r.type === "date" ? `<input type="date" data-s="${r.key}" value="${esc(s[r.key] || "")}" style="width:auto" />` : r.type === "number" ? `<input type="number" data-s="${r.key}" value="${esc(String(s[r.key] ?? ""))}" min="${r.min}" max="${r.max}" style="width:6em" />` : `<label class="sw"><input type="checkbox" data-s="${r.key}"${s[r.key] ? " checked" : ""} /><i></i></label>`}\n    </div>`).join("")}`).join("");
    $("#settingsList").onclick = async e => {
        const act = e.target.closest("button")?.dataset.act;
        if (!act) return;
        if (act === "resetWidgetPos") {
            await store.saveSettings({
                widgetPos: {
                    ...DEFAULT_POS
                }
            });
            toast("Panel moved back to the bottom right — reload the portal page to see it");
            return;
        }
    };
    $("#settingsList").onchange = async e => {
        if (e.target.name === "visaMode") {
            const mode = await store.setVisaMode(e.target.value);
            if (!mode) return;
            chrome.runtime.sendMessage({
                type: "IV_SET_AUTO",
                which: "visa",
                on: mode.autoVisa
            }, () => void chrome.runtime.lastError);
            await renderSettings();
            toast(`ভিসা ফর্ম: ${mode.nameBn}`);
            return;
        }
        const key = e.target.dataset.s;
        if (!key) return;
        let value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        if (e.target.type === "number") {
            const row = SETTING_ROWS.find(r => r.key === key) || {};
            value = Math.min(row.max ?? 1e9, Math.max(row.min ?? 0, Number(value) || row.min || 0));
            e.target.value = value;
        }
        await store.saveSettings({
            [key]: value
        });
        toast("Settings saved successfully ✓");
    };
}

const DOC_KB = n => `${Math.round(n / 1024)}KB`;

let docProfileId = null;

async function renderDocuments() {
    const profiles = await store.getProfiles();
    const sel = $("#docProfSelect");
    if (!profiles.length) {
        $("#docSlots").innerHTML = '<p class="empty">No profile yet — add one under Profiles first.</p>';
        sel.innerHTML = "";
        return;
    }
    docProfileId = docProfileId && profiles.some(p => p.id === docProfileId) ? docProfileId : await store.getActiveId() || profiles[0].id;
    sel.innerHTML = profiles.map(p => `<option value="${p.id}"${p.id === docProfileId ? " selected" : ""}>${esc(p.name)}</option>`).join("");
    const profile = profiles.find(p => p.id === docProfileId);
    const data = profile?.data || {};
    const {category: category, sub: sub} = visaKind(data.visaPurpose);
    const slots = slotsFor(category, sub);
    const derived = slotsAreDerived(category, sub);
    $("#docRules").textContent = `${DOC_RULES_PORTAL.format} · ${DOC_KB(DOC_RULES_PORTAL.minBytes)}–${DOC_KB(DOC_RULES_PORTAL.maxBytes)}` + " · সব কাগজ ইংরেজিতে হতে হবে, নইলে আবেদন বাতিল হতে পারে।" + " বড় ফাইল নিজে থেকেই ছোট হয়ে যাবে, আর নাম বদলে ঘরের নাম অনুযায়ী বসবে।" + (derived ? ` (${data.visaPurpose || "এই ভিসার"} আপলোড পাতাটা এখনো দেখা হয়নি — নিচের তালিকা মেডিকেল ভিসার পাতা থেকে মিলিয়ে বানানো, তাই ক্রমিক নম্বর আলাদা হতে পারে। আসল আপলোডের সময় নম্বর পাতা থেকেই পড়া হবে।)` : "");
    const files = store.personFiles(profile);
    const held = new Map(files.map(f => [ f.slot || 0, f ]));
    const done = slots.filter(s => held.has(s.slot)).length;
    const need = slots.filter(s => s.mandatory && !held.has(s.slot)).length;
    $("#docCount").textContent = slots.length ? `${done} / ${slots.length} দেওয়া আছে${need ? ` — ${need}টা বাধ্যতামূলক ঘর এখনো খালি` : " — বাধ্যতামূলক সব ঠিক আছে"}` : "";
    const show = docSectionsFor(BUILD_ID);
    const photoHtml = !show.portalSlots ? "" : (() => {
        const p = store.fileOfKind(profile, "photo");
        const where = String(data.photoCrop || "UPPER").toUpperCase();
        return `\n      <h2 class="sgroup">ছবি<small>indianvisa-bangladesh.nic.in ▸ Upload Photograph</small></h2>\n      <div class="doc-slot must${p ? " have" : ""}">\n        ${p ? `<img class="doc-thumb" data-thumb="${esc(p.id)}" alt="" title="দেখুন" data-view="${esc(p.id)}" data-name="${esc(p.name)}" />` : '<div class="doc-n">◍</div>'}\n        <div class="doc-body">\n          <div class="doc-name">PHOTOGRAPH <span class="doc-must">অবশ্যই লাগবে</span></div>\n          <div class="doc-bn">JPEG, বর্গাকার, কমপক্ষে ৩৫০×৩৫০, ১০KB–১MB। এখানে দিলে নিজে থেকেই\n            বর্গাকার করে ছোট করে নেবে, আর পোর্টালের কাটার ঘরটাও\n            <b>${esc(where)}</b> অনুযায়ী বসিয়ে দেবে।</div>\n          ${p ? `<div class="doc-file">✓ ${esc(p.name)} <span class="doc-size">${DOC_KB(p.size)}${p.w ? ` · ${p.w}×${p.h}` : ""}</span></div>` : '<div class="doc-none">কোনো ছবি দেওয়া হয়নি</div>'}\n          <details class="manual" style="margin-top:8px">\n            <summary>ছবির নিয়মগুলো (${PHOTO_RULES.length}টা)</summary>\n            <ul class="nope" style="margin-top:8px">\n              ${PHOTO_RULES.map(r => `<li>${r.must ? "<b>অবশ্যই:</b> " : ""}${esc(r.bn)}</li>`).join("")}\n            </ul>\n          </details>\n        </div>\n        <div class="doc-act">\n          ${p?.id ? `<button class="ghost" data-view="${esc(p?.id)}" data-name="${esc(p?.name)}" title="দেখুন">দেখুন</button>` : ""}\n          ${p ? '<button class="ghost" data-recrop="1" title="আসল ছবি থেকে কাটার ঘরটা আবার বসান">ক্রপ বদলান</button>' : ""}\n          <button class="ghost" data-photo="1">${p ? "বদলান" : "ছবি দিন"}</button>\n          ${p ? `<button class="ghost danger" data-del="${esc(p.id)}">✕</button>` : ""}\n        </div>\n      </div>`;
    })();
    let webHtml = "";
    $("#docSlots").innerHTML = photoHtml + webHtml + (!show.portalSlots ? "" : slots.map(s => {
        const f = held.get(s.slot);
        return `<div class="doc-slot${s.mandatory ? " must" : ""}${f ? " have" : ""}">\n      <div class="doc-n">${s.slot}</div>\n      <div class="doc-body">\n        <div class="doc-name">${esc(s.name)}${s.mandatory ? ' <span class="doc-must">অবশ্যই লাগবে</span>' : ""}</div>\n        <div class="doc-bn">${esc(s.bn)}</div>\n        ${s.text ? `<div class="doc-en">${esc(s.text)}</div>` : ""}\n        ${f ? `<div class="doc-file">✓ ${esc(f.name)} <span class="doc-size">${DOC_KB(f.size)}${f.shrunkFrom ? ` (was ${DOC_KB(f.shrunkFrom)})` : ""}</span></div>` : '<div class="doc-none">কোনো ফাইল দেওয়া হয়নি</div>'}\n      </div>\n      <div class="doc-act">\n        ${f?.id ? `<button class="ghost" data-view="${esc(f?.id)}" data-name="${esc(f?.name)}" title="দেখুন">দেখুন</button>` : ""}\n        <button class="ghost" data-add="${s.slot}">${f ? "বদলান" : "ফাইল দিন"}</button>\n        ${f ? `<button class="ghost danger" data-del="${f.id}">✕</button>` : ""}\n      </div>\n    </div>`;
    }).join(""));
    for (const t of $$("#docSlots img[data-thumb]")) {
        store.readFileBytes(t.dataset.thumb).then(u => {
            if (u) t.src = u;
        });
    }
}

$("#docProfSelect")?.addEventListener("change", e => {
    docProfileId = e.target.value;
    renderDocuments();
});

let pendingSlot = null;

async function openPreview(id, name) {
    const dataUrl = await store.readFileBytes(id);
    if (!dataUrl) {
        toast("ফাইলটা পাওয়া গেল না", false);
        return;
    }
    const blob = await (await fetch(dataUrl)).blob();
    const url = URL.createObjectURL(blob);
    const isPdf = /pdf/i.test(blob.type) || /.pdf$/i.test(name);
    const wrap = document.createElement("div");
    wrap.className = "pv-wrap";
    wrap.innerHTML = `\n    <div class="pv-box" role="dialog" aria-modal="true" aria-label="${esc(name)}">\n      <header>\n        <div class="pv-t"><strong>${esc(name || "Document")}</strong><small>${DOC_KB(blob.size)}${isPdf ? " · PDF" : ""}</small></div>\n        <button class="ghost" data-pv="tab">নতুন ট্যাবে</button>\n        <button class="ghost" data-pv="close" title="বন্ধ করুন">✕</button>\n      </header>\n      <div class="pv-body">${isPdf ? `<iframe src="${url}#view=FitH" title="${esc(name)}"></iframe>` : `<img src="${url}" alt="${esc(name)}" />`}</div>\n    </div>`;
    const close = () => {
        wrap.remove();
        URL.revokeObjectURL(url);
        document.removeEventListener("keydown", onKey);
    };
    const onKey = e => {
        if (e.key === "Escape") close();
    };
    wrap.addEventListener("click", e => {
        if (e.target === wrap || e.target.closest('[data-pv="close"]')) close(); else if (e.target.closest('[data-pv="tab"]')) window.open(url, "_blank");
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(wrap);
    wrap.querySelector('[data-pv="close"]').focus();
}

$("#docSlots")?.addEventListener("click", async e => {
    const b = e.target.closest("button, img[data-view]");
    if (!b) return;
    if (b.dataset.recrop) {
        if (await recropPhoto(docProfileId)) await renderDocuments();
        return;
    }
    if (b.dataset.view) {
        await openPreview(b.dataset.view, b.dataset.name || "");
        return;
    }
    if (b.dataset.del) {
        await store.removePersonFile(docProfileId, b.dataset.del);
        await renderDocuments();
        return;
    }
    if (b.dataset.add) {
        pendingSlot = Number(b.dataset.add);
        $("#docFileInput").click();
    }
    if (b.dataset.photo) {
        pendingPhoto = true;
        pendingSlot = null;
        $("#docFileInput").click();
    }
});

let pendingPhoto = false;

$("#docFileInput")?.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (pendingPhoto) {
        pendingPhoto = false;
        if (!file) return;
        await framePhoto(docProfileId, file);
        await renderDocuments();
        return;
    }
    if (!file) return;
    const profiles = await store.getProfiles();
    const profile = profiles.find(p => p.id === docProfileId);
    const data = profile?.data || {};
    if (pendingSlot == null) return;
    const {category: category, sub: sub} = visaKind(data.visaPurpose);
    const slot = slotsFor(category, sub).find(s => s.slot === pendingSlot);
    if (!slot) return;
    const notes = [];
    let blob = file;
    try {
        const fitted = await fitToLimit(file, {
            maxBytes: DOC_RULES_PORTAL.maxBytes
        });
        if (fitted.blob && fitted.blob !== file) {
            blob = fitted.blob;
            notes.push(fitted.gaveUp ? `${DOC_KB(file.size)} থেকে ${DOC_KB(blob.size)} — তবু ${DOC_KB(DOC_RULES_PORTAL.maxBytes)}-এর নিচে নামেনি` : `${DOC_KB(file.size)} → ${DOC_KB(blob.size)}`);
        }
    } catch (err) {
        toast(`ফাইলটা ছোট করা গেল না: ${err.message}`);
        return;
    }
    const name = fileNameFor(data, slot.kind, {
        original: file.name,
        mime: blob.type,
        slotName: slot.name
    });
    if (name !== file.name) notes.push(`নাম: ${name}`);
    await store.addPersonFile(profile.id, {
        kind: slot.kind,
        slot: slot.slot,
        name: name,
        originalName: file.name,
        mime: blob.type,
        size: blob.size,
        shrunkFrom: blob === file ? 0 : file.size,
        dataUrl: await blobToDataUrl(blob)
    }, {
        multiple: true
    });
    pendingSlot = null;
    await renderDocuments();
    toast(notes.length ? `ঘর ${slot.slot}: ${notes.join(" · ")}` : `ঘর ${slot.slot}-এ দেওয়া হলো`);
});

$("#doExport").addEventListener("click", async () => {
    const pass = $("#expPass").value;
    const {encrypted: encrypted, body: body} = await store.exportAll(pass || null, {
        documents: $("#expDocs")?.checked
    });
    const stamp = (new Date).toISOString().slice(0, 10);
    const blob = new Blob([ body ], {
        type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visa-autofill-backup-${stamp}${encrypted ? "-locked" : ""}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4e3);
    toast(encrypted ? "Encrypted backup downloaded ✓" : "Backup downloaded ✓");
});

$("#doImport").addEventListener("click", async () => {
    const file = $("#impFile").files?.[0];
    const msg = $("#impMsg");
    if (!file) {
        msg.className = "msg bad";
        msg.textContent = "Please choose a backup file.";
        return;
    }
    try {
        const res = await store.importAll(await file.text(), $("#impPass").value || null, {
            merge: $("#impMerge").checked
        });
        msg.className = "msg ok";
        msg.textContent = [ `${res.profiles} profiles restored`, res.documents ? `${res.documents} documents restored` : "", res.dropped ? `${res.dropped} document(s) were not in this backup — add them again` : "" ].filter(Boolean).join(". ") + ".";
        await loadProfileSelects();
        await selectProfile(await store.getActiveId());
        await renderSettings();
        toast("Backup restored successfully ✓");
    } catch (err) {
        msg.className = "msg bad";
        msg.textContent = err.message;
    }
});

let letterProfileId = null;

let companionIds = new Set;

function companionsFrom(profiles, ids, exceptId) {
    return profiles.filter(p => ids.has(p.id) && p.id !== exceptId).map(p => ({
        name: nameOf(p.data || {}) || p.name,
        passportNo: (p.data || {}).passportNo || ""
    })).filter(c => c.name);
}

async function renderLetters() {
    const profiles = await store.getProfiles();
    const sel = $("#letterProfSelect");
    const list = $("#letterList");
    if (!profiles.length) {
        list.innerHTML = '<p class="empty">No profile yet — add one under Profiles first.</p>';
        sel.innerHTML = "";
        $("#companionList").innerHTML = "";
        return;
    }
    letterProfileId = letterProfileId && profiles.some(p => p.id === letterProfileId) ? letterProfileId : await store.getActiveId() || profiles[0].id;
    sel.innerHTML = profiles.map(p => `<option value="${p.id}"${p.id === letterProfileId ? " selected" : ""}>${esc(p.name)}</option>`).join("");
    const profile = profiles.find(p => p.id === letterProfileId);
    const data = profile?.data || {};
    const others = profiles.filter(p => p.id !== letterProfileId);
    if (!companionIds.size && data.medicalCertNo) {
        for (const p of others) {
            if ((p.data || {}).medicalCertNo === data.medicalCertNo) companionIds.add(p.id);
        }
    }
    $("#companionList").innerHTML = others.length ? others.map(p => {
        const on = companionIds.has(p.id);
        const pass = (p.data || {}).passportNo || "";
        return `<label class="chip${on ? " on" : ""}">` + `<input type="checkbox" data-companion="${esc(p.id)}"${on ? " checked" : ""} />` + `${esc(p.name)}${pass ? ` <small>${esc(pass)}</small>` : ""}</label>`;
    }).join("") : '<p class="empty">Only one profile on file — nothing to travel with yet.</p>';
    const isAttendant = /M2|M3|M4|ATTENDANT/i.test(`${data.medicalRole || ""} ${data.visaType || ""}`);
    const patientProfile = isAttendant ? profiles.find(p => (p.data || {}).passportNo && (p.data || {}).passportNo === data.attendantOfPassport) : null;
    const patient = patientProfile ? {
        ...patientProfile.data,
        relationship: relationshipOf(patientProfile, profile)
    } : null;
    const opts = {
        companions: companionsFrom(profiles, companionIds, letterProfileId),
        isAttendant: isAttendant && !!patient,
        patient: patient
    };
    list.innerHTML = LETTER_KINDS.map(kind => {
        const missing = kind.needs.filter(k => !String(data[k] || "").trim());
        const ok = missing.length === 0;
        return `\n      <div class="act${ok ? "" : " off"}">\n        <div class="act-top">\n          <div class="act-ic">✎</div>\n          <div>\n            <div class="act-name">${esc(kind.nameBn)}</div>\n            <div class="act-sub">${esc(kind.name)}</div>\n          </div>\n        </div>\n        <div class="act-why">${esc(kind.whyBn)}</div>\n        ${ok ? "" : `<div class="act-need">এখনো লাগবে: ${missing.map(k => esc(labelFor(FIELDS[k] || {
            key: k,
            label: k
        }, data))).join(", ")}</div>`}\n        <div class="act-foot">\n          <button class="primary" data-letter="${esc(kind.id)}"${ok ? "" : " disabled"}>PDF নামান</button>\n          <button class="ghost" data-letter-preview="${esc(kind.id)}"${ok ? "" : " disabled"}>দেখুন</button>\n        </div>\n      </div>`;
    }).join("");
    letterOpts = opts;
    letterData = data;
}

let letterOpts = null;

let letterData = null;

function relationshipOf(patientProfile, attendantProfile) {
    const a = attendantProfile?.data || {};
    return a.attendantRelationship || a.relationship || "";
}

function letterFor(id) {
    const kind = LETTER_KINDS.find(k => k.id === id);
    if (!kind || !letterData) return null;
    return kind.make(letterData, letterOpts || {});
}

$("#letterProfSelect").addEventListener("change", e => {
    letterProfileId = e.target.value;
    renderLetters();
});

$("#companionList").addEventListener("change", e => {
    const id = e.target.dataset?.companion;
    if (!id) return;
    if (e.target.checked) companionIds.add(id); else companionIds.delete(id);
    renderLetters();
});

$("#letterList").addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const download = btn.dataset.letter;
    const preview = btn.dataset.letterPreview;
    const letter = letterFor(download || preview);
    if (!letter) return;
    try {
        const bytes = renderLetter(letter);
        const url = URL.createObjectURL(new Blob([ bytes ], {
            type: "application/pdf"
        }));
        if (preview) {
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 6e4);
        } else {
            const a = document.createElement("a");
            a.href = url;
            a.download = `${letter.title}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast(`${letter.title}.pdf তৈরি ✓`);
        }
    } catch (err) {
        toast(`চিঠি বানানো গেল না: ${err.message}`, false);
    }
});

const CORNERS = {
    se: {
        ax: b => b.x,
        ay: b => b.y,
        sx: 1,
        sy: 1
    },
    nw: {
        ax: b => b.x + b.side,
        ay: b => b.y + b.side,
        sx: -1,
        sy: -1
    },
    ne: {
        ax: b => b.x,
        ay: b => b.y + b.side,
        sx: 1,
        sy: -1
    },
    sw: {
        ax: b => b.x + b.side,
        ay: b => b.y,
        sx: -1,
        sy: 1
    }
};

const MIN_SEL = 36;

async function framePhoto(profileId, file, initial = null) {
    const profile = (await store.getProfiles()).find(p => p.id === profileId);
    if (!profile) return false;
    const data = profile.data || {};
    const kind = DOC_KINDS.find(k => k.key === "photo");
    const ANCHOR = {
        TOP: 0,
        UPPER: .12,
        CENTRE: .5,
        LOWER: .75
    };
    const anchorY = ANCHOR[String(data.photoCrop || "UPPER").toUpperCase()] ?? .12;
    let chosen;
    try {
        chosen = await openCrop(file, {
            anchorY: anchorY,
            minPx: kind.minPx,
            initial: initial
        });
    } catch (err) {
        toast(`ছবিটা খোলা গেল না: ${err.message}`, false);
        return false;
    }
    if (!chosen) return false;
    let out;
    try {
        out = await shrinkImage(file, {
            maxBytes: kind.maxBytes,
            square: true,
            minPx: kind.minPx,
            anchorY: anchorY,
            crop: chosen
        });
    } catch (err) {
        toast(`ছবিটা তৈরি করা গেল না: ${err.message}`, false);
        return false;
    }
    if (out.width < kind.minPx || out.height < kind.minPx) {
        toast(`ছবিটা ছোট — ${out.width}×${out.height}, দরকার অন্তত ${kind.minPx}×${kind.minPx}। বড় ছবি দিন।`, false);
        return false;
    }
    const name = fileNameFor(data, "photo", {
        original: file.name,
        mime: "image/jpeg"
    });
    await store.addPersonFile(profile.id, {
        kind: "photo",
        slot: 0,
        name: name,
        originalName: file.name,
        mime: "image/jpeg",
        size: out.blob.size,
        w: out.width,
        h: out.height,
        shrunkFrom: out.blob === file ? 0 : file.size,
        dataUrl: await blobToDataUrl(out.blob)
    }, {
        multiple: false
    });
    await keepPhotoSource(profile.id, file, chosen);
    toast(`ছবি তৈরি: ${out.width}×${out.height}, ${DOC_KB(out.blob.size)}${out.gaveUp ? " — ১MB-র নিচে নামেনি" : ""}`);
    return true;
}

async function keepPhotoSource(profileId, file, crop) {
    const bmp = await createImageBitmap(file);
    const MAX = 2400;
    const k = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    let dataUrl;
    if (k < 1) {
        const c = document.createElement("canvas");
        c.width = Math.round(bmp.width * k);
        c.height = Math.round(bmp.height * k);
        const g = c.getContext("2d");
        g.imageSmoothingQuality = "high";
        g.drawImage(bmp, 0, 0, c.width, c.height);
        dataUrl = c.toDataURL("image/jpeg", .92);
    } else {
        dataUrl = await blobToDataUrl(file);
    }
    const scaled = {
        x: Math.round(crop.x * k),
        y: Math.round(crop.y * k),
        side: Math.round(crop.side * k)
    };
    await store.setPhotoSource(profileId, {
        dataUrl: dataUrl,
        name: file.name,
        w: Math.round(bmp.width * k),
        h: Math.round(bmp.height * k),
        crop: scaled
    });
    bmp.close?.();
}

async function recropPhoto(profileId) {
    const src = await store.getPhotoSource(profileId);
    if (!src?.dataUrl) {
        toast("এই ছবির আসলটা রাখা নেই (আগের ভার্সনে দেওয়া) — একবার নতুন করে ছবি দিন, তারপর থেকে যেকোনো সময় ক্রপ বদলানো যাবে", false);
        return false;
    }
    const blob = await (await fetch(src.dataUrl)).blob();
    const file = new File([ blob ], src.name || "photo.jpg", {
        type: blob.type || "image/jpeg"
    });
    return framePhoto(profileId, file, src.crop);
}

function openCrop(file, {anchorY: anchorY = .12, minPx: minPx = 350, initial: initial = null} = {}) {
    return new Promise((resolve, reject) => {
        const wrap = $("#cropWrap");
        const stage = $("#cropStage");
        const img = $("#cropImg");
        const sel = $("#cropSel");
        const sizeOut = $("#cropSize");
        const url = URL.createObjectURL(file);
        let scale = 1;
        let area = null;
        let box = null;
        const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
        function draw() {
            sel.style.left = `${box.x}px`;
            sel.style.top = `${box.y}px`;
            sel.style.width = `${box.side}px`;
            sel.style.height = `${box.side}px`;
            const px = Math.round(box.side * scale);
            sizeOut.textContent = `${px} × ${px} px`;
            sizeOut.classList.toggle("bad", px < minPx);
            sizeOut.title = px < minPx ? `পোর্টাল অন্তত ${minPx}×${minPx} চায়` : "";
            const pv = $("#cropPrev");
            if (pv && img.naturalWidth) {
                const src = toSource();
                const g = pv.getContext("2d");
                g.imageSmoothingQuality = "high";
                g.fillStyle = "#fff";
                g.fillRect(0, 0, pv.width, pv.height);
                g.drawImage(img, src.x, src.y, src.side, src.side, 0, 0, pv.width, pv.height);
            }
        }
        function measure() {
            const s = stage.getBoundingClientRect();
            const i = img.getBoundingClientRect();
            area = {
                x: i.left - s.left,
                y: i.top - s.top,
                w: i.width,
                h: i.height
            };
            scale = img.naturalWidth / (i.width || 1);
        }
        function suggest() {
            const side = Math.min(area.w, area.h);
            return {
                x: area.x + (area.w - side) / 2,
                y: area.y + (area.h - side) * clamp(anchorY, 0, 1),
                side: side
            };
        }
        function moveBy(from, dx, dy) {
            box.x = clamp(from.x + dx, area.x, area.x + area.w - from.side);
            box.y = clamp(from.y + dy, area.y, area.y + area.h - from.side);
        }
        function resizeBy(from, dx, dy, corner) {
            const c = CORNERS[corner];
            const ax = c.ax(from);
            const ay = c.ay(from);
            const want = from.side + Math.max(dx * c.sx, dy * c.sy);
            const roomX = c.sx > 0 ? area.x + area.w - ax : ax - area.x;
            const roomY = c.sy > 0 ? area.y + area.h - ay : ay - area.y;
            const side = clamp(want, MIN_SEL, Math.min(roomX, roomY));
            box.side = side;
            box.x = c.sx > 0 ? ax : ax - side;
            box.y = c.sy > 0 ? ay : ay - side;
        }
        function grab(e, corner) {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const from = {
                ...box
            };
            const onMove = ev => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                if (corner) resizeBy(from, dx, dy, corner); else moveBy(from, dx, dy);
                draw();
            };
            const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
        }
        const onPointerDown = e => {
            const h = e.target.closest(".h");
            const corner = h && [ "nw", "ne", "sw", "se" ].find(c => h.classList.contains(c));
            grab(e, corner || null);
        };
        const onResize = () => {
            const before = {
                ...box
            };
            const wasArea = area;
            measure();
            const k = area.w / (wasArea.w || 1);
            box = {
                x: area.x + (before.x - wasArea.x) * k,
                y: area.y + (before.y - wasArea.y) * k,
                side: before.side * k
            };
            draw();
        };
        const onKey = e => {
            if (e.key === "Escape") finish(null);
            if (e.key === "Enter") finish(toSource());
        };
        function toSource() {
            const side = Math.round(box.side * scale);
            return {
                x: Math.round((box.x - area.x) * scale),
                y: Math.round((box.y - area.y) * scale),
                side: side
            };
        }
        let settled = false;
        function finish(value) {
            if (settled) return;
            settled = true;
            wrap.hidden = true;
            sel.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("keydown", onKey);
            $("#cropCancel").onclick = null;
            $("#cropReset").onclick = null;
            $("#cropSave").onclick = null;
            img.removeAttribute("src");
            URL.revokeObjectURL(url);
            resolve(value);
        }
        const fromSource = r => {
            const side = Math.min(r.side / scale, area.w, area.h);
            return {
                x: clamp(area.x + r.x / scale, area.x, area.x + area.w - side),
                y: clamp(area.y + r.y / scale, area.y, area.y + area.h - side),
                side: side
            };
        };
        img.onload = () => {
            measure();
            box = initial && initial.side > 0 ? fromSource(initial) : suggest();
            draw();
            sel.addEventListener("pointerdown", onPointerDown);
            window.addEventListener("resize", onResize);
            document.addEventListener("keydown", onKey);
            $("#cropCancel").onclick = () => finish(null);
            $("#cropReset").onclick = () => {
                box = suggest();
                draw();
            };
            $("#cropSave").onclick = () => finish(toSource());
        };
        img.onerror = () => {
            wrap.hidden = true;
            URL.revokeObjectURL(url);
            reject(new Error("ছবিটা পড়া গেল না — JPG বা PNG দিন"));
        };
        wrap.hidden = false;
        img.src = url;
    });
}

let inviteLetter = null;

let invitePeople = [];

$("#invitePick")?.addEventListener("click", () => $("#inviteFile").click());

$("#inviteClear")?.addEventListener("click", () => {
    inviteLetter = null;
    invitePeople = [];
    renderInvite();
});

$("#inviteFile")?.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const state = $("#inviteState");
    state.textContent = "চিঠিটা পড়া হচ্ছে…";
    try {
        const text = await readText(file);
        if (looksScanned(text)) {
            throw new Error("এটা স্ক্যান করা কপি, ভেতরে লেখা নেই। হাসপাতাল যে PDF ফাইলটা পাঠিয়েছে হুবহু সেটাই দিন।");
        }
        if (!isInvitationLetter(text)) {
            throw new Error('ইনভাইটেশন লেটার বলে চেনা গেল না — ভেতরে "Invitation Letter", "Reference No" আর রোগীর ঘরগুলো পাওয়া যায়নি।');
        }
        const inv = parseInvitation(text);
        const people = invitationToProfiles(inv);
        if (!people.length) throw new Error("চিঠিতে পাসপোর্ট নম্বরসহ কারও নাম পাওয়া গেল না।");
        const saved = await store.getProfiles();
        for (const p of people) {
            const mine = saved.find(s => (s.data || {}).passportNo && String((s.data || {}).passportNo).toUpperCase() === String(p.passportNo).toUpperCase());
            p.profileName = mine?.name || "";
            p.data = {
                ...mine?.data || {},
                ...p.data
            };
        }
        inviteLetter = inv;
        invitePeople = people;
        renderInvite();
        const who = people.length === 1 ? "১ জন" : `${people.length} জন`;
        toast(`${inv.stream === "AYUSH" ? "AYUSH" : "মেডিকেল"} ইনভাইটেশন পড়া হলো — ${who} পাওয়া গেছে`);
    } catch (err) {
        inviteLetter = null;
        invitePeople = [];
        renderInvite();
        state.textContent = "";
        toast(err.message, false);
    }
});

const ROLE_BN = {
    M1: "রোগী",
    M2: "অ্যাটেনডেন্ট",
    M3: "রোগী (AYUSH)",
    M4: "অ্যাটেনডেন্ট (AYUSH)"
};

function renderInvite() {
    const box = $("#inviteWho");
    const clear = $("#inviteClear");
    const state = $("#inviteState");
    if (!box) return;
    if (!inviteLetter) {
        box.innerHTML = "";
        clear.hidden = true;
        state.textContent = "";
        return;
    }
    clear.hidden = false;
    const inv = inviteLetter;
    state.textContent = [ inv.certNo && `Ref ${inv.certNo}`, inv.hospital.name ].filter(Boolean).join(" · ");
    box.innerHTML = invitePeople.map((person, i) => {
        const d = person.data;
        const role = ROLE_BN[d.medicalRole] || (person.role === "patient" ? "রোগী" : "অ্যাটেনডেন্ট");
        const rel = person.role === "attendant" && person.relationship ? ` — চিঠিতে: ${esc(person.relationship)}` : "";
        const short = new Set;
        const buttons = LETTER_KINDS.map(kind => {
            const missing = kind.needs.filter(k => !String(d[k] || "").trim());
            for (const k of missing) short.add(k);
            return `<button class="${kind.id === "cover" ? "primary" : "ghost"}" ` + `data-invite-letter="${esc(kind.id)}" data-who="${i}"` + `${missing.length ? " disabled" : ""}>${esc(kind.nameBn)}</button>`;
        }).join("");
        const need = short.size ? `<div class="act-need">এখনো লাগবে: ${[ ...short ].map(k => esc(labelFor(FIELDS[k] || {
            key: k,
            label: k
        }, d))).join(", ")} — Profiles ট্যাবে বসিয়ে নিন।</div>` : "";
        return `\n      <div class="act">\n        <div class="act-top">\n          <div class="act-ic">${person.role === "patient" ? "✚" : "👤"}</div>\n          <div>\n            <div class="act-name">${esc(person.name)}</div>\n            <div class="act-sub">${esc(role)}${rel}</div>\n          </div>\n        </div>\n        <div class="act-why">\n          পাসপোর্ট ${esc(person.passportNo)}\n          ${person.profileName ? ` · সেভ করা প্রোফাইল: ${esc(person.profileName)}` : " · এই নামে সেভ করা প্রোফাইল নেই"}\n        </div>\n        ${need}\n        <div class="act-foot">${buttons}</div>\n      </div>`;
    }).join("") + (invitePeople.length > 1 ? `<div class="act">\n         <div class="act-top"><div class="act-ic">⤓</div>\n           <div><div class="act-name">সবার সবগুলো</div>\n           <div class="act-sub">${invitePeople.length * LETTER_KINDS.length}টি PDF</div></div></div>\n         <div class="act-why">চিঠিতে থাকা প্রত্যেকের কভার লেটার ও আন্ডারটেকিং একসাথে নামবে। ব্রাউজার একবার\n           “একাধিক ফাইল নামাবেন?” জিজ্ঞেস করতে পারে — হ্যাঁ দিন।</div>\n         <div class="act-foot"><button class="primary" data-invite-all="1">সব PDF নামান</button></div>\n       </div>` : "");
}

function inviteLetterFor(person, kindId) {
    const kind = LETTER_KINDS.find(k => k.id === kindId);
    if (!kind) return null;
    const letter = kind.make(person.data, travelParty(invitePeople, person));
    return {
        name: `${letter.title}.pdf`,
        bytes: renderLetter(letter)
    };
}

function savePdf(name, bytes) {
    const url = URL.createObjectURL(new Blob([ bytes ], {
        type: "application/pdf"
    }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

$("#inviteWho")?.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    try {
        if (btn.dataset.inviteAll) {
            let n = 0;
            for (const person of invitePeople) {
                for (const kind of LETTER_KINDS) {
                    const missing = kind.needs.filter(k => !String(person.data[k] || "").trim());
                    if (missing.length) continue;
                    const out = inviteLetterFor(person, kind.id);
                    if (!out) continue;
                    savePdf(out.name, out.bytes);
                    n++;
                    await new Promise(r => setTimeout(r, 250));
                }
            }
            toast(n ? `${n}টি PDF তৈরি ✓` : "কারও তথ্য সম্পূর্ণ নয় — উপরে দেখুন কী লাগবে", !!n);
            return;
        }
        const kindId = btn.dataset.inviteLetter;
        const person = invitePeople[Number(btn.dataset.who)];
        if (!kindId || !person) return;
        const out = inviteLetterFor(person, kindId);
        if (!out) return;
        savePdf(out.name, out.bytes);
        toast(`${out.name} তৈরি ✓`);
    } catch (err) {
        toast(`চিঠি বানানো গেল না: ${err.message}`, false);
    }
});

let portalProfileId = null;

async function renderPortals() {
    const profiles = await store.getProfiles();
    const sel = $("#portalProfSelect");
    const list = $("#portalList");
    if (!profiles.length) {
        list.innerHTML = '<p class="empty">No profile yet — add one under Profiles first.</p>';
        sel.innerHTML = "";
        return;
    }
    portalProfileId = portalProfileId && profiles.some(p => p.id === portalProfileId) ? portalProfileId : await store.getActiveId() || profiles[0].id;
    sel.innerHTML = profiles.map(p => `<option value="${p.id}"${p.id === portalProfileId ? " selected" : ""}>${esc(p.name)}</option>`).join("");
    const data = profiles.find(p => p.id === portalProfileId)?.data || {};
    const rows = portalsFor(data).filter(p => !p.hidden);
    list.innerHTML = rows.map(p => `\n    <div class="act${p.ok ? "" : " off"}">\n      <div class="act-top">\n        <div class="act-ic">${esc(p.icon)}</div>\n        <div>\n          <div class="act-name">${esc(p.nameBn)}</div>\n          <div class="act-sub">${esc(p.name)}${p.optional ? " · ঐচ্ছিক" : ""}</div>\n        </div>\n      </div>\n      <div class="act-why">${esc(p.whyBn)}</div>\n      ${p.ok ? "" : `<div class="act-need">এখনো লাগবে: ${p.missing.map(k => esc(labelFor(FIELDS[k] || {
        key: k,
        label: k
    }, data))).join(", ")}</div>`}\n      <div class="act-foot">\n        <button class="primary" data-portal="${esc(p.id)}"${p.ok ? "" : " disabled"}>খুলুন ও ভরুন</button>\n      </div>\n    </div>`).join("");
}

$("#portalProfSelect").addEventListener("change", e => {
    portalProfileId = e.target.value;
    renderPortals();
});

$("#portalList").addEventListener("click", async e => {
    const id = e.target.closest("button")?.dataset.portal;
    if (!id) return;
    const portal = PORTALS.find(p => p.id === id);
    if (!portal) return;
    await store.setActiveId(portalProfileId);
    await loadProfileSelects();
    window.open(portal.url, "_blank");
    toast(`${portal.nameBn} খোলা হলো — ক্যাপচা আপনি দেবেন`);
});

(async function init() {
    try {
        const {BUILD: BUILD, BUILD_NAME: BUILD_NAME} = await (import("../lib/build.js"));
        if (BUILD) {
            for (const el of $$("[data-build]")) {
                if (el.dataset.build !== BUILD) el.remove();
            }
            document.body.dataset.build = BUILD;
            BUILD_ID = BUILD;
        }
        if (BUILD_NAME) {
            document.title = BUILD_NAME;
            const words = BUILD_NAME.split(" ");
            const head = $("#brandName");
            const sub = $("#brandSub");
            if (head && sub) {
                head.textContent = words.slice(0, 2).join(" ");
                sub.textContent = words.slice(2).join(" ") || "Settings";
            }
        }
    } catch (_) {}
    await loadIndiaLists();
    await loadProfileSelects();
    await selectProfile(await store.getActiveId());
    await renderSettings();
    const hash = location.hash.slice(1);
    showTab(hash === "welcome" ? "help" : hash);
    if (hash === "welcome" && !(await store.getProfiles()).length) {
        setTimeout(() => toast("Welcome! Go to Profiles to set your details."), 600);
    }
})();
