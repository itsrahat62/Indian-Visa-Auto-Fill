(async function() {
    "use strict";
    if (window.__ivAutofillPro) return;
    window.__ivAutofillPro = true;
    const U = p => chrome.runtime.getURL(p);
    function tell(msg, onReply) {
        if (!store?.contextAlive?.()) return false;
        try {
            if (onReply) {
                chrome.runtime.sendMessage(msg, reply => {
                    void chrome.runtime?.lastError;
                    onReply(reply);
                });
            } else {
                chrome.runtime.sendMessage(msg);
            }
            return true;
        } catch (_) {
            return false;
        }
    }
    const ORPHANED = "এক্সটেনশনটা নতুন করে লোড হয়েছে — পাতাটা একবার রিফ্রেশ করুন (F5)";
    let schema, F, matcher, portal, store, engine, guardLib, domWait, doctor, wpos, docs, relevance, shrink;
    let BUILD = "";
    try {
        [schema, F, matcher, portal, store, engine, guardLib, domWait, doctor, wpos, docs, relevance, shrink] = await Promise.all([ import(U("src/lib/schema.js")), import(U("src/lib/filler.js")), import(U("src/lib/matcher.js")), import(U("src/lib/portal-map.js")), import(U("src/lib/store.js")), import(U("src/lib/engine.js")), import(U("src/lib/refill-guard.js")), import(U("src/lib/dom-wait.js")), import(U("src/lib/submit-doctor.js")), import(U("src/lib/widget-pos.js")), import(U("src/lib/doc-slots.js")), import(U("src/lib/relevance.js")), import(U("src/lib/shrink.js")) ]);
    } catch (err) {
        console.error(`[Visa Autofill] Could not load its own modules on ${location.host}. ` + 'Add this host to "web_accessible_resources" in manifest.json, then reload the extension.', err);
        return;
    }
    try {
        if (store.contextAlive()) BUILD = (await (import(U("src/lib/build.js")))).BUILD || "";
    } catch (_) {}
    const {FIELDS: FIELDS} = schema;
    const STR = {
        en: {
            fill: "Auto-Fill Page",
            filling: "Filling…",
            teach: "Teach",
            teachOn: "Stop Teaching",
            profile: "Profile",
            noProfile: "No Profile Selected",
            settings: "Settings",
            add: "New Profile",
            filled: "fields filled",
            missed: "would not fill",
            unknownPage: "Page not recognized",
            noValue: "not in profile",
            addInProfile: "Add to the profile",
            captcha: "Please complete the CAPTCHA manually.",
            teachHint: "Click the field you want to teach · Esc to exit",
            pick: "What is this field?",
            search: "Search…",
            clear: "Remove Mapping",
            cancel: "Cancel",
            saved: "Learned",
            tempId: "Application ID",
            copied: "Copied"
        }
    };
    let booted = false;
    let settings = await store.getSettings();
    let T = STR[settings.lang] || STR.en;
    const label = key => (false ? FIELDS[key]?.labelBn : FIELDS[key]?.label) || FIELDS[key]?.label || key;
    async function fillPage({silent: silent = false, fast: fast = false} = {}) {
        settings = await store.getSettings();
        T = STR[settings.lang] || STR.en;
        const profile = await store.getActiveProfile();
        if (!profile) {
            toast(T.noProfile, false);
            return null;
        }
        const data = await store.resolvedData(profile, settings);
        const learned = await store.getLearned(location.href);
        if (BUILD !== "appointment" && relevance.needsPatientId(data)) {
            const who = data.attendantOf ? ` (${data.attendantOf})` : "";
            logit(`রুগির Application Id নেই${who} — M2/M4 ফর্ম এটা ছাড়া নেয় না`, "warn");
            toast("আগে রুগির Application Id দিন — রুগির আবেদন সাবমিট হলে ১২ অক্ষরের " + "আইডিটা পাওয়া যায়, নয়তো তাঁর ওয়েব ফাইলটা Import-এ দিন", false);
        }
        window.dispatchEvent(new CustomEvent("iv-fill-start"));
        setBusy(true);
        let stats;
        try {
            stats = await engine.runFill({
                data: data,
                settings: settings,
                learned: learned,
                doc: document,
                waitForOptionsInline: !fast,
                onField: (ok, _key, el) => {
                    if (settings.highlight && el && ok !== null) F.flash(el, ok);
                }
            });
        } finally {
            window.dispatchEvent(new CustomEvent("iv-fill-end"));
            setBusy(false);
        }
        if (stats.page?.id === "photo-upload") {
            if (await attachPhoto()) return stats;
        }
        if (stats.page?.id === "photo-crop") {
            if (await setPortalCrop()) return stats;
        }
        if (stats.page?.id === "doc-upload") {
            const sent = await uploadNextDocument();
            if (sent) return stats;
        }
        sessionStorage.setItem("iv_session", "1");
        if (!silent) showResult(stats);
        focusCaptcha();
        return stats;
    }
    let captchaWatchCleanup = null;
    let captchaTimeoutTimer = null;
    let captchaCompleted = false;
    function findCaptchaInput() {
        return document.querySelector('#captcha, #CaptchaInputAnswer, input[id*="captcha" i], input[name*="captcha" i]');
    }
    function captchaHasValue(input) {
        return !!(input && (input.value || "").trim());
    }
    function holdCaptchaFocus(input) {
        const doc = input.ownerDocument;
        let tries = 0;
        const grab = () => {
            if (++tries > 8 || !input.isConnected) return clearInterval(timer);
            const active = doc.activeElement;
            const free = !active || active === doc.body || active === doc.documentElement || host && active === host;
            if (active === input) return;
            if (!free) return clearInterval(timer);
            try {
                input.focus({
                    preventScroll: true
                });
            } catch (_) {}
        };
        const timer = setInterval(grab, 250);
        grab();
    }
    function isCaptchaCompleted(input) {
        return captchaHasValue(input) && input.value !== input.dataset.ivGuess;
    }
    function focusCaptcha() {
        const input = findCaptchaInput();
        if (!input) return;
        input.classList.add("iv-captcha-focus");
        const img = document.querySelector('img[id*="captcha" i], img[src*="aptcha"]');
        if (img) img.classList.add("iv-captcha-zoom");
        try {
            input.scrollIntoView({
                block: "center",
                behavior: "smooth"
            });
        } catch (_) {}
        holdCaptchaFocus(input);
        if (isCaptchaCompleted(input)) {
            captchaCompleted = true;
            return;
        }
        captchaCompleted = false;
        toast(T.captcha, true);
        if (els.stat) {
            const pageTitle = portal.detectPage(document)?.title || "Visa Form";
            els.stat.innerHTML = `<div class="pg">${esc(pageTitle)}</div>` + `<div class="bad" style="font-weight:bold;margin-top:4px;">⚠️ ${esc(T.captcha)}</div>`;
        }
        setupCaptchaWatch(input);
    }
    function setupCaptchaWatch(input) {
        if (!input) return;
        if (captchaWatchCleanup) captchaWatchCleanup();
        const CAPTCHA_TIMEOUT_MS = 12e4;
        if (captchaTimeoutTimer) clearTimeout(captchaTimeoutTimer);
        captchaTimeoutTimer = setTimeout(() => {
            if (!captchaCompleted) {
                toast("CAPTCHA timeout: Please enter CAPTCHA and submit manually", false);
                if (els.stat) {
                    els.stat.innerHTML += `<div class="bad" style="margin-top:2px;">CAPTCHA completion timeout (120s)</div>`;
                }
            }
        }, CAPTCHA_TIMEOUT_MS);
        const goOn = () => {
            captchaCompleted = true;
            if (captchaTimeoutTimer) clearTimeout(captchaTimeoutTimer);
            cleanup();
            toast("CAPTCHA typed ✓ Continuing…", true);
            if (els.stat) {
                els.stat.innerHTML = '<div class="ok" style="font-weight:bold;">CAPTCHA typed ✓ Continuing…</div>';
            }
            setTimeout(() => {
                if (IS_VISA && settings.autoAdvance === true) clickNext();
            }, 400);
        };
        const checkAndResume = ev => {
            if (!ev || ev.type !== "keydown") return;
            if (ev.key !== "Enter" && ev.keyCode !== 13) return;
            if (!captchaHasValue(input)) return;
            goOn();
        };
        const cleanup = () => {
            input.removeEventListener("input", checkAndResume);
            input.removeEventListener("keyup", checkAndResume);
            input.removeEventListener("change", checkAndResume);
            input.removeEventListener("paste", checkAndResume);
            input.removeEventListener("keydown", checkAndResume);
            captchaWatchCleanup = null;
        };
        input.addEventListener("input", checkAndResume);
        input.addEventListener("keyup", checkAndResume);
        input.addEventListener("change", checkAndResume);
        input.addEventListener("paste", checkAndResume);
        input.addEventListener("keydown", checkAndResume);
        captchaWatchCleanup = cleanup;
    }
    async function uploadNextDocument() {
        const rows = docs.readSlots(document).filter(r => r.file && r.button && !r.uploaded);
        if (!rows.length) {
            const left = docs.missingMandatory(document);
            logit(left.length ? `${left.length} mandatory document(s) still missing — add them under Documents` : "every document on this page is already uploaded", left.length ? "warn" : "ok");
            confirmDocuments();
            return false;
        }
        const profile = await store.getActiveProfile();
        if (!profile) {
            logit("no profile selected", "warn");
            return false;
        }
        const held = store.personFiles(profile);
        if (!held.length) {
            logit("no documents prepared for this profile — see the Documents tab", "warn");
            return false;
        }
        const {category: category, sub: sub} = relevance.visaKind(profile.data?.visaPurpose);
        const ours = docs.slotsFor(category, sub);
        for (const row of rows) {
            const mine = docs.matchSlot(row.text, ours);
            if (!mine) continue;
            const rec = held.find(f => f.slot === mine.slot);
            if (!rec) continue;
            const dataUrl = await store.readFileBytes(rec.id);
            if (!dataUrl) {
                logit(`${rec.name} is recorded but its contents are gone`, "warn");
                continue;
            }
            await attach(row.file, {
                dataUrl: dataUrl,
                name: rec.name,
                mime: rec.mime
            });
            logit(`${row.slot}. ${rec.name} — sending`, "ok");
            toast(`${rec.name} পাঠানো হচ্ছে…`, true);
            row.button.click();
            return true;
        }
        logit(`${rows.length} box(es) left, but nothing prepared matches them`, "warn");
        return false;
    }
    async function attachPhoto() {
        const box = document.getElementById("image_error_id") || document.querySelector('input[type="file"][name*="image" i]');
        if (!box) return false;
        const profile = await store.getActiveProfile();
        const rec = profile && store.fileOfKind(profile, "photo");
        if (!rec) {
            logit("no photograph on this profile — add one under Documents", "warn");
            toast("এই প্রোফাইলে ছবি দেওয়া নেই — Documents-এ গিয়ে দিন", false);
            return false;
        }
        const dataUrl = await store.readFileBytes(rec.id);
        if (!dataUrl) {
            logit(`${rec.name} is recorded but its contents are gone`, "warn");
            return false;
        }
        await attach(box, {
            dataUrl: dataUrl,
            name: rec.name,
            mime: rec.mime
        });
        logit(`${rec.name} attached${rec.w ? ` (${rec.w}x${rec.h})` : ""}`, "ok");
        const go = document.getElementById("continue") || [ ...document.querySelectorAll('input[type="submit"]') ].find(b => /upload photo/i.test(b.value || ""));
        if (go && settings.autoAdvance === true) {
            logit("pressing Upload Photo", "ok");
            toast("ছবি বসানো হলো — Upload Photo চাপা হচ্ছে", true);
            go.click();
        } else {
            toast("ছবি বসানো হলো — Upload Photo চাপুন, পরের পাতায় কাটাটা বসে যাবে", true);
        }
        return true;
    }
    const CROP_ANCHOR = {
        TOP: 0,
        UPPER: .12,
        CENTRE: .5,
        LOWER: .75
    };
    let cropping = false;
    async function setPortalCrop() {
        if (cropping) return true;
        cropping = true;
        try {
            return await placePortalCrop();
        } finally {
            cropping = false;
        }
    }
    async function placePortalCrop() {
        const img = document.getElementById("target");
        if (!img) return false;
        await domWait.waitFor(() => img.complete && img.naturalWidth, {
            timeout: 15e3,
            every: 150
        });
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
            logit("the photo has not finished loading yet", "warn");
            return false;
        }
        let x = 0;
        let y = 0;
        let side = Math.min(w, h);
        let why = "the whole photo — it went up square";
        if (w !== h) {
            const profile = await store.getActiveProfile();
            const choice = String(profile?.data?.photoCrop || "UPPER").toUpperCase();
            const anchorY = CROP_ANCHOR[choice] ?? CROP_ANCHOR.UPPER;
            ({x: x, y: y, side: side} = shrink.squareCrop(w, h, anchorY));
            why = `${choice.toLowerCase()} — this photo is not square`;
        }
        const box = id => document.getElementById(id);
        if (!box("x1") || !box("y2")) {
            logit("the crop boxes are not on this page", "warn");
            return false;
        }
        const ready = await domWait.waitFor(() => document.querySelector(".jcrop-holder") && box("w").value !== "", {
            timeout: 15e3,
            every: 150
        });
        if (!ready) {
            logit("the page cropper never finished starting", "warn");
            toast("পোর্টালের কাটার ঘরটা চালু হয়নি — পাতাটা রিফ্রেশ করে আবার চাপুন", false);
            return false;
        }
        const COORDS = [ "x1", "y1", "x2", "y2", "w", "h" ];
        const before = COORDS.map(id => box(id).value);
        for (const id of COORDS) box(id).value = "";
        F.bridge("jcrop", {
            id: "target",
            rect: [ x, y, x + side, y + side ]
        });
        const landed = Number(await domWait.waitFor(() => box("w").value, {
            timeout: 2e3,
            every: 50
        }) || 0);
        if (Math.abs(landed - side) > 2) {
            if (!landed) COORDS.forEach((id, i) => {
                box(id).value = before[i];
            });
            logit(`the cropper did not take the selection (asked ${side}, it says ${landed || "nothing"})`, "warn");
            toast("কাটার ঘরটা নিজে থেকে বসেনি — হাতে টেনে নিন", false);
            return false;
        }
        logit(`crop set to ${side}x${side} at ${x},${y} — ${why}`, "ok");
        const save = [ ...document.querySelectorAll('input[type="submit"], button') ].find(b => /crop and save/i.test(b.value || b.textContent || ""));
        if (save && settings.autoAdvance === true) {
            logit("pressing Crop and Save", "ok");
            toast(`কাটা বসানো হলো (${side}×${side}) — Crop and Save চাপা হচ্ছে`, true);
            setTimeout(() => save.click(), 300);
        } else {
            toast(`কাটা বসানো হলো (${side}×${side}) — দেখে নিয়ে Crop and Save চাপুন`, true);
        }
        return true;
    }
    function confirmDocuments() {
        const box = document.getElementById("verifyDoc");
        if (!box || box.checked) return;
        const left = docs.missingMandatory(document);
        if (left.length) {
            logit(`not confirming yet — ${left.length} mandatory document(s) still missing`, "warn");
            return;
        }
        F.setCheckbox(box, true);
        logit("all mandatory documents are up — confirmation ticked", "ok");
        const go = document.getElementById("continue");
        if (go && /confirm/i.test(go.value || go.textContent || "") && settings.autoAdvance === true) {
            logit("pressing Confirm", "ok");
            toast("সব কাগজ আপলোড — Confirm চাপা হচ্ছে", true);
            setTimeout(() => go.click(), 400);
        } else {
            toast("সব বাধ্যতামূলক কাগজ আপলোড হয়েছে — টিক দেওয়া হলো। Confirm আপনি চাপবেন।", true);
        }
    }
    async function attach(box, entry) {
        const blob = await (await fetch(entry.dataUrl)).blob();
        const type = entry.mime || blob.type || "application/pdf";
        const fallback = type.startsWith("image/") ? "photo.jpg" : "application.pdf";
        const file = new File([ blob ], entry.name || fallback, {
            type: type
        });
        const dt = new DataTransfer;
        dt.items.add(file);
        box.files = dt.files;
        box.dispatchEvent(new Event("change", {
            bubbles: true
        }));
        box.dispatchEvent(new Event("input", {
            bubbles: true
        }));
    }
    const logLines = [];
    const LOG_MAX = 60;
    const sameEvent = (a, b) => a.replace(/\d+/g, "#") === b.replace(/\d+/g, "#");
    function logit(text, kind = "") {
        const at = (new Date).toTimeString().slice(0, 8);
        const msg = String(text);
        const last = logLines[logLines.length - 1];
        if (last && last.kind === kind && sameEvent(last.text, msg)) {
            last.at = at;
            last.text = msg;
            last.n = (last.n || 1) + 1;
        } else {
            logLines.push({
                at: at,
                text: msg,
                kind: kind,
                n: 1
            });
            if (logLines.length > LOG_MAX) logLines.shift();
        }
        renderLog();
    }
    function renderLog() {
        if (!els.loglist) return;
        els.loglist.innerHTML = logLines.length ? logLines.map(l => `<div class="lg ${l.kind}"><span>${l.at}</span>${esc(l.text)}` + `${l.n > 1 ? ` <i>×${l.n}</i>` : ""}</div>`).reverse().join("") : '<div class="lg dim">Nothing yet.</div>';
    }
    let host, root, els = {}, busy = false, minimised = false;
    async function setMinimised(on) {
        minimised = !!on;
        if (els.wrap) els.wrap.classList.toggle("min", minimised);
        const btn = els.wrap && els.wrap.querySelector('[data-act="min"]');
        if (btn) {
            btn.textContent = minimised ? "▢" : "–";
            btn.title = minimised ? "open" : "minimise";
        }
        await store.saveSettings({
            widgetMin: minimised
        });
    }
    function buildWidget() {
        if (host) return;
        if (!store.contextAlive()) return;
        host = document.createElement("div");
        host.id = "iv-widget-host";
        host.style.cssText = "all:initial;position:fixed;z-index:2147483600;";
        (document.body || document.documentElement).appendChild(host);
        root = host.attachShadow({
            mode: "open"
        });
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = U("src/content/widget.css");
        root.appendChild(link);
        if (!document.getElementById("iv-fonts")) {
            const faces = document.createElement("style");
            faces.id = "iv-fonts";
            const bn = "U+0951-0952, U+0964-0965, U+0980-09FE, U+200C-200D, U+25CC";
            faces.textContent = '@property --iv-edge-angle{syntax:"<angle>";initial-value:0deg;inherits:false}' + `@font-face{font-family:"IV Inter";src:url("${U("vendor/fonts/inter-latin-wght.woff2")}") format("woff2");font-weight:100 900;font-display:swap}` + [ 400, 500, 600, 700 ].map(w => `@font-face{font-family:"IV Hind Siliguri";src:url("${U(`vendor/fonts/hind-siliguri-bengali-${w}.woff2`)}") format("woff2");font-weight:${w};font-display:swap;unicode-range:${bn}}`).join("");
            (document.head || document.documentElement).appendChild(faces);
        }
        let titleName = "VISA <b>AUTO FILL</b>", titleSub = "INDIANVISA-BANGLADESH.NIC.IN";
        const wrap = document.createElement("div");
        wrap.className = "w";
        wrap.innerHTML = `\n      <div class="bar" part="bar" data-act="bar">\n        <span class="grip" title="drag"></span>\n        <img class="logo" src="${U("icons/icon48.png")}" alt="" />\n        <span class="titles">\n          <span class="name">${titleName}</span>\n          <span class="sub">${titleSub}</span>\n        </span>\n        <button class="x" data-act="min" title="minimise">–</button>\n        <button class="x" data-act="hide" title="hide until the next page">✕</button>\n      </div>\n      <div class="tabs">\n        <button class="tab on" data-tab="run">RUN</button>\n        <button class="tab" data-tab="log">LOG</button>\n        <button class="tab" data-act="options">CONFIG</button>\n      </div>\n      <div class="body" data-pane="run">\n        <div class="stat"></div>\n        <div class="row">\n          <select class="prof" data-act="profile"></select>\n          <button class="ico" data-act="options" title="${T.settings}">⚙</button>\n        </div>\n        <button class="go" data-act="fill" data-only="visa" data-build="visa">${T.fill}</button>\n\n        <div class="row2">\n          <button class="mini" data-act="teach" data-only="visa" data-build="visa">✎ ${T.teach}</button>\n          <button class="mini" data-act="guide">📖 Guide</button>\n        </div>\n        <div class="auto"></div>\n        <div class="tid"></div>\n      </div>\n      <div class="body log" data-pane="log" hidden>\n        <div class="loglist"></div>\n        <button class="mini" data-act="log-clear">Clear</button>\n      </div>\n      <div class="toast"></div>`;
        root.appendChild(wrap);
        els = {
            wrap: wrap,
            prof: wrap.querySelector(".prof"),
            go: wrap.querySelector(".go"),
            auto: wrap.querySelector(".auto"),
            stat: wrap.querySelector(".stat"),
            tid: wrap.querySelector(".tid"),
            loglist: wrap.querySelector(".loglist"),
            toast: wrap.querySelector(".toast"),
            teach: wrap.querySelector('[data-act="teach"]')
        };
        wrap.addEventListener("click", onWidgetClick);
        els.prof.addEventListener("change", async () => {
            await store.setActiveId(els.prof.value);
            toast(els.prof.selectedOptions[0]?.text || "", true);
        });
        if (BUILD) {
            for (const el of wrap.querySelectorAll("[data-build]")) {
                if (el.dataset.build !== BUILD) el.remove();
            }
            wrap.dataset.build = BUILD;
        }
        makeDraggable(wrap.querySelector(".bar"));
        positionWidget();
        minimised = settings.widgetMin === true;
        wrap.classList.toggle("min", minimised);
        const mb = wrap.querySelector('[data-act="min"]');
        if (mb) {
            mb.textContent = minimised ? "▢" : "–";
            mb.title = minimised ? "open" : "minimise";
        }
    }
    const {clampPos: clampPos, DEFAULT_POS: DEFAULT_POS} = wpos;
    function widgetBox() {
        const r = host.getBoundingClientRect();
        return {
            size: {
                width: r.width || 340,
                height: r.height || 200
            },
            view: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    function positionWidget() {
        const {size: size, view: view} = widgetBox();
        const stored = settings.widgetPos || DEFAULT_POS;
        const p = clampPos(stored, size, view, {
            fully: true
        });
        host.style.right = `${p.right}px`;
        host.style.bottom = `${p.bottom}px`;
        host.style.left = "auto";
        host.style.top = "auto";
        if (p.right !== stored.right || p.bottom !== stored.bottom) {
            settings.widgetPos = p;
            store.saveSettings({
                widgetPos: p
            });
        }
    }
    function makeDraggable(handle) {
        let sx = 0, sy = 0, sr = 0, sb = 0, dragging = false, moved = false;
        handle.addEventListener("click", e => {
            if (moved) {
                e.stopPropagation();
                moved = false;
            }
        }, true);
        handle.addEventListener("mousedown", e => {
            if (e.target.dataset.act && e.target.dataset.act !== "bar") return;
            dragging = true;
            moved = false;
            sx = e.clientX;
            sy = e.clientY;
            const r = host.getBoundingClientRect();
            sr = window.innerWidth - r.right;
            sb = window.innerHeight - r.bottom;
            e.preventDefault();
        });
        window.addEventListener("mousemove", e => {
            if (!dragging) return;
            if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) moved = true;
            const {size: size, view: view} = widgetBox();
            const p = clampPos({
                right: sr - (e.clientX - sx),
                bottom: sb - (e.clientY - sy)
            }, size, view);
            host.style.right = `${p.right}px`;
            host.style.bottom = `${p.bottom}px`;
        });
        window.addEventListener("mouseup", async () => {
            if (!dragging) return;
            dragging = false;
            const r = host.getBoundingClientRect();
            const {size: size, view: view} = widgetBox();
            const p = clampPos({
                right: window.innerWidth - r.right,
                bottom: window.innerHeight - r.bottom
            }, size, view);
            settings.widgetPos = p;
            await store.saveSettings({
                widgetPos: p
            });
        });
    }
    async function onWidgetClick(e) {
        const tab = e.target.closest("[data-tab]");
        if (tab) {
            const want = tab.dataset.tab;
            for (const b of els.wrap.querySelectorAll("[data-tab]")) b.classList.toggle("on", b === tab);
            for (const pane of els.wrap.querySelectorAll("[data-pane]")) pane.hidden = pane.dataset.pane !== want;
            if (want === "log") renderLog();
            return;
        }
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (!act) return;
        switch (act) {
          case "fill":
            if (!busy) await fillPage({
                fast: true
            });
            break;

          case "teach":
            toggleTeach();
            break;

          case "options":
            if (!tell({
                type: "IV_OPEN_OPTIONS"
            })) toast(ORPHANED, false);
            break;

          case "min":
            await setMinimised(!minimised);
            break;

          case "bar":
            if (minimised) await setMinimised(false);
            break;

          case "hide":
            host.style.display = "none";
            break;

          case "log-clear":
            logLines.length = 0;
            renderLog();
            break;

          case "guide":
            if (!tell({
                type: "IV_OPEN_DOCS"
            })) toast(ORPHANED, false);
            break;
        }
    }
    function nextButton() {
        const cands = [ ...document.querySelectorAll('input[type="submit"], button') ].filter(b => !(host && host.contains(b))).filter(b => b.offsetParent !== null || b.getClientRects().length);
        const text = b => (b.value || b.textContent || "").replace(/\s+/g, " ").trim();
        const rank = t => /^save and continue$/i.test(t) ? 4 : /^(continue booking|confirm (and|&) continue)$/i.test(t) ? 3 : /^continue$/i.test(t) ? 3 : /^(next|proceed)$/i.test(t) ? 2 : /save and continue/i.test(t) ? 1 : 0;
        let best = null, score = 0;
        for (const b of cands) {
            if (/exit/i.test(text(b))) continue;
            const s = rank(text(b));
            if (s > score) {
                best = b;
                score = s;
            }
        }
        return best;
    }
    function clickNext() {
        const btn = nextButton();
        if (btn) btn.click(); else toast("No Save and Continue button on this page", false);
    }
    let advanced = false;
    function maybeAdvance(stats) {
        if (advanced || !settings.autoAdvance || !IS_VISA) return;
        if (!stats || stats.failed.length || stats.empty.length) return;
        const captchaInput = findCaptchaInput();
        if (captchaInput && !isCaptchaCompleted(captchaInput)) {
            toast(T.captcha, true);
            return;
        }
        const btn = nextButton();
        if (!btn || /verified/i.test(btn.value || btn.textContent || "")) return;
        advanced = true;
        toast("Everything filled — continuing", true);
        setTimeout(() => btn.click(), 400);
    }
    function setBusy(on) {
        busy = on;
        if (!els.go) return;
        els.go.textContent = on ? T.filling : T.fill;
        els.go.classList.toggle("busy", on);
    }
    async function refreshProfiles() {
        if (!els.prof) return;
        const list = await store.getProfiles();
        const active = await store.getActiveId();
        els.prof.innerHTML = list.length ? list.map(p => `<option value="${p.id}"${p.id === active ? " selected" : ""}>${esc(p.name)}</option>`).join("") : `<option value="">${T.noProfile}</option>`;
    }
    function showResult(stats) {
        if (!els.stat) return;
        const page = stats.page ? stats.page.title : T.unknownPage;
        const miss = stats.failed.length;
        const blank = stats.empty.length;
        const names = keys => keys.slice(0, 6).map(k => esc(label(k))).join(", ") + (keys.length > 6 ? ` +${keys.length - 6}` : "");
        els.stat.innerHTML = `<b>${stats.filled}</b> ${T.filled}` + (miss ? ` · <span class="bad">${miss} ${T.missed}</span>` : "") + (blank ? ` · <span class="blank">${blank} ${T.noValue}</span>` : "") + `<div class="pg">${esc(page)}</div>` + (miss ? `<div class="misslist">${names(stats.failed)}</div>` : "") + (blank ? `<div class="blanklist">${T.addInProfile}: ${names(stats.empty)}</div>` : "");
    }
    let toastTimer = null;
    function toast(msg, ok = true) {
        logit(msg, ok ? "" : "no");
        const el = els.toast;
        if (!el) return;
        el.textContent = msg;
        el.className = `toast show ${ok ? "" : "bad"}`;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            if (el.isConnected) el.className = "toast";
        }, 3200);
    }
    const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
    let teaching = false;
    let hoverEl = null;
    function toggleTeach(force) {
        if (!root) return;
        teaching = force === undefined ? !teaching : force;
        document.documentElement.classList.toggle("iv-teaching", teaching);
        if (els.teach) els.teach.textContent = teaching ? `✕ ${T.teachOn}` : `✎ ${T.teach}`;
        if (teaching) {
            document.addEventListener("mouseover", onTeachHover, true);
            document.addEventListener("click", onTeachClick, true);
            document.addEventListener("keydown", onTeachKey, true);
            toast(T.teachHint, true);
        } else {
            document.removeEventListener("mouseover", onTeachHover, true);
            document.removeEventListener("click", onTeachClick, true);
            document.removeEventListener("keydown", onTeachKey, true);
            hoverEl?.classList.remove("iv-teach-hover");
            hoverEl = null;
        }
    }
    function teachTarget(node) {
        const el = node?.closest?.("input, select, textarea");
        if (!el) return null;
        if (host && host.contains(node)) return null;
        if (el.type === "hidden" || el.type === "submit" || el.type === "button") return null;
        return el;
    }
    function onTeachHover(e) {
        const el = teachTarget(e.target);
        if (el === hoverEl) return;
        hoverEl?.classList.remove("iv-teach-hover");
        hoverEl = el;
        hoverEl?.classList.add("iv-teach-hover");
    }
    function onTeachKey(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            toggleTeach(false);
            closePicker();
        }
    }
    function onTeachClick(e) {
        const el = teachTarget(e.target);
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        openPicker(el);
    }
    let picker = null;
    async function openPicker(el) {
        closePicker();
        const learned = await store.getLearned(location.href);
        const selector = matcher.selectorFor(el);
        const current = learned[selector] || "";
        const suggested = matcher.suggestKeys(el, 3);
        picker = document.createElement("div");
        picker.className = "picker";
        picker.innerHTML = `\n      <div class="p-head">\n        <div class="p-title">${T.pick}</div>\n        <div class="p-sub">${esc(F.haystackFor(el).slice(0, 90))}</div>\n      </div>\n      <input class="p-search" placeholder="${T.search}" />\n      <div class="p-list"></div>\n      <div class="p-foot">\n        <button class="p-clear">${T.clear}</button>\n        <button class="p-cancel">${T.cancel}</button>\n      </div>`;
        root.appendChild(picker);
        const list = picker.querySelector(".p-list");
        const search = picker.querySelector(".p-search");
        const render = (q = "") => {
            const nq = q.trim().toLowerCase();
            const rows = [];
            const seen = new Set;
            const push = (key, tag) => {
                if (seen.has(key)) return;
                seen.add(key);
                rows.push(`<button class="p-row${key === current ? " cur" : ""}" data-key="${key}">\n            <span>${esc(label(key))}</span>\n            <em>${esc(FIELDS[key].groupTitle)}${tag ? ` · ${tag}` : ""}</em>\n          </button>`);
            };
            if (!nq) suggested.forEach(k => push(k, "★"));
            for (const key of Object.keys(FIELDS)) {
                const hay = `${key} ${FIELDS[key].label} ${FIELDS[key].labelBn} ${FIELDS[key].groupTitle}`.toLowerCase();
                if (!nq || hay.includes(nq)) push(key);
            }
            list.innerHTML = rows.join("") || '<div class="p-none">—</div>';
        };
        render();
        search.addEventListener("input", () => render(search.value));
        setTimeout(() => search.focus(), 30);
        list.addEventListener("click", async ev => {
            const key = ev.target.closest("[data-key]")?.dataset.key;
            if (!key) return;
            await store.learn(location.href, selector, key);
            toast(`${T.saved}: ${label(key)}`, true);
            closePicker();
        });
        picker.querySelector(".p-clear").addEventListener("click", async () => {
            await store.learn(location.href, selector, null);
            toast(T.clear, true);
            closePicker();
        });
        picker.querySelector(".p-cancel").addEventListener("click", closePicker);
    }
    function closePicker() {
        picker?.remove();
        picker = null;
    }
    function scanTempId() {
        if (!els.tid) return;
        const m = document.body?.innerText?.match(/(?:Temporary\s+)?Application\s*(?:ID|Id)\s*[:\-]?\s*([A-Z]{2,4}[A-Z0-9]{6,18})/);
        if (!m) return;
        const id = m[1];
        els.tid.innerHTML = `<span class="tid-l">${T.tempId}</span><code>${esc(id)}</code><button class="tid-c" title="copy">⧉</button>`;
        els.tid.querySelector(".tid-c").addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(id);
                toast(T.copied, true);
            } catch (_) {}
        });
    }
    chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
        (async () => {
            switch (msg?.type) {
              case "IV_FILL":
                {
                    const s = await fillPage({
                        silent: !!msg.silent,
                        fast: true
                    });
                    respond({
                        ok: !!s,
                        filled: s?.filled || 0,
                        failed: s?.failed || [],
                        page: s?.page?.id || null
                    });
                    break;
                }

              case "IV_TEACH":
                toggleTeach();
                respond({
                    ok: true
                });
                break;

              case "IV_PING":
                {
                    const page = portal.detectPage(document);
                    respond({
                        ok: true,
                        page: page ? {
                            id: page.id,
                            title: page.title,
                            titleBn: page.titleBn
                        } : null
                    });
                    break;
                }

              case "IV_REFRESH":
                settings = await store.getSettings();
                T = STR.en;
                await refreshProfiles();
                respond({
                    ok: true
                });
                break;

              case "IV_SHOW":
                if (host) host.style.display = "";
                respond({
                    ok: true
                });
                break;

              default:
                respond({
                    ok: false
                });
            }
        })();
        return true;
    });
    const IS_VISA = /(^|\.)(indianvisa-bangladesh\.nic\.in|indianvisaonline\.gov\.in)$/i.test(location.host);
    let SITE_NAME = IS_VISA ? "Visa Form" : "";
    let FILL_KEY = IS_VISA ? "fillVisa" : null;
    function panelEnabled(s) {
        if (IS_VISA) return s.autoVisa === true;
        return false;
    }
    function fillEnabled(s) {
        if (!panelEnabled(s)) return false;
        return s[FILL_KEY] !== false;
    }
    const widgetWanted = () => settings.widget !== false && window.top === window.self && panelEnabled(settings);
    function destroyWidget() {
        if (!host) return;
        clearTimeout(toastTimer);
        host.remove();
        host = null;
        root = null;
        els = {};
    }
    function showAutoState() {
        if (!els.auto) return;
        const on = fillEnabled(settings);
        els.auto.className = `auto ${on ? "on" : "off"}`;
        els.auto.innerHTML = `<span class="auto-t">${on ? "⚡" : "⏸"} Auto-fill ${on ? "ON" : "OFF"}` + `${SITE_NAME ? ` — ${esc(SITE_NAME)}` : ""}</span>` + `<label class="sw"><input type="checkbox"${on ? " checked" : ""}><span class="sl"></span></label>`;
        els.auto.querySelector("input").addEventListener("change", async e => {
            const want = e.target.checked;
            await store.saveSettings({
                [FILL_KEY]: want
            });
            toast(want ? "Auto-fill on" : "Auto-fill off — use the button", true);
        });
    }
    function showPageName() {
        if (!els.stat) return;
        const page = portal.detectPage(document);
        if (page) els.stat.innerHTML = `<div class="pg">${esc(page.title)}</div>`;
    }
    async function syncWidget() {
        if (!widgetWanted()) {
            destroyWidget();
            return;
        }
        const fresh = !host;
        buildWidget();
        if (!host) {
            teardownIfOrphaned();
            return;
        }
        host.style.display = "";
        if (fresh) {
            await refreshProfiles();
            scanTempId();
            showPageName();
            renderLog();
        }
        showAutoState();
        installSubmitDoctor();
    }
    chrome.storage.onChanged.addListener(async changes => {
        try {
            if (teardownIfOrphaned()) return;
            if (changes.profiles || changes.activeProfileId) await refreshProfiles();
            if (changes.settings) {
                settings = await store.getSettings();
                T = STR.en;
                if (booted) {
                    if (fillEnabled(settings)) startAuto(); else stopAuto();
                    await syncWidget();
                }
            }
        } catch (_) {
            teardownIfOrphaned();
        }
    });
    const guard = guardLib.createRefillGuard(document, F.isFillable);
    async function autoFill(silent) {
        if (busy || !guard.canRun() || !store.contextAlive()) return;
        guard.countRun();
        try {
            const stats = await fillPage({
                silent: silent
            });
            maybeAdvance(stats);
        } finally {
            guard.markAll();
        }
    }
    let doctorArmed = false;
    function reportBlockedSubmit() {
        const bad = doctor.collectBlockers(document);
        if (!bad.length) return;
        const first = bad[0].el;
        try {
            first.scrollIntoView({
                block: "center",
                behavior: "smooth"
            });
        } catch (_) {
            first.scrollIntoView();
        }
        try {
            first.focus({
                preventScroll: true
            });
        } catch (_) {}
        const prevOutline = first.style.outline;
        first.style.outline = "3px solid #ef4444";
        first.style.outlineOffset = "2px";
        setTimeout(() => {
            first.style.outline = prevOutline;
            first.style.outlineOffset = "";
        }, 4e3);
        toast(`Not saved — ${bad.length} field(s) need fixing`, false);
        if (els.stat) {
            els.stat.innerHTML = `<span class="bad">Save blocked — ${bad.length} problem(s)</span>` + `<div class="misslist">${bad.slice(0, 6).map(b => esc(b.text)).join("<br>")}</div>`;
        }
    }
    function installSubmitDoctor() {
        if (doctorArmed || !IS_VISA) return;
        doctorArmed = true;
        document.addEventListener("submit", e => {
            setTimeout(() => {
                if (e.defaultPrevented && panelEnabled(settings)) reportBlockedSubmit();
            }, 0);
        }, false);
    }
    let observer = null;
    let debounce = null;
    function startAuto() {
        if (observer) return;
        setTimeout(() => {
            if (observer) autoFill(false);
        }, 600);
        observer = new MutationObserver(() => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                if (teardownIfOrphaned()) return;
                if (guard.hasUnseen()) autoFill(true);
            }, 700);
        });
        const attach = () => {
            if (document.body) observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        };
        if (document.body) attach(); else document.addEventListener("DOMContentLoaded", attach);
    }
    function stopAuto() {
        clearTimeout(debounce);
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }
    function teardownIfOrphaned() {
        if (store.contextAlive()) return false;
        stopAuto();
        clearInterval(aliveTimer);
        if (els.wrap) {
            els.wrap.classList.add("min");
            if (els.auto) {
                els.auto.className = "auto off";
                els.auto.textContent = "⟳ Extension reloaded — refresh this page";
            }
        }
        return true;
    }
    const aliveTimer = setInterval(teardownIfOrphaned, 2e3);
    booted = true;
    const quietly = p => Promise.resolve(p).catch(() => {
        teardownIfOrphaned();
    });
    if (IS_VISA && window === window.top && panelEnabled(settings) && /\/visa\/(index\.html)?$/i.test(location.pathname)) {
        tell({
            type: "IV_REG_BOUNCED"
        }, r => {
            if (!r?.bounced) return;
            const form = document.forms.OnlineForm;
            const req = document.getElementById("ser_req_id");
            if (!form || !req) return;
            const recent = JSON.parse(sessionStorage.getItem("iv_reg_tries") || "[]").filter(t => Date.now() - t < 6e4);
            if (recent.length >= 2) {
                logit("the portal keeps sending Registration back here — press Online Visa Application", "warn");
                return;
            }
            sessionStorage.setItem("iv_reg_tries", JSON.stringify([ ...recent, Date.now() ]));
            logit("Registration link came back to the home page — going in the way the portal wants", "ok");
            req.value = "1";
            form.submit();
        });
    }
    await quietly(syncWidget());
    if (fillEnabled(settings)) startAuto();
})().catch(err => {
    const orphaned = /Extension context invalidated|context invalidated/i.test(err?.message || "");
    if (!orphaned) console.error("IV: content script stopped", err);
});
