export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

let bridgeReady = false;

export function bridge(op, payload) {
    if (!bridgeReady) bridgeReady = true;
    try {
        window.dispatchEvent(new CustomEvent("iv-page-cmd", {
            detail: {
                op: op,
                ...payload
            }
        }));
    } catch (_) {}
}

const CSSISH = /[#.\[\]:>\s,]/;

export function resolve(target, root = document) {
    if (!target) return null;
    if (target instanceof Element) return target;
    if (CSSISH.test(target)) {
        try {
            const el = root.querySelector(target);
            if (el) return el;
        } catch (_) {}
    }
    return root.getElementById?.(target) || root.querySelector?.(`[id="${cssEscape(target)}"]`) || root.querySelector?.(`[name="${cssEscape(target)}"]`) || null;
}

function cssEscape(s) {
    return String(s).replace(/["\\]/g, "\\$&");
}

export function resolveFirst(ids, root = document) {
    for (const id of ids || []) {
        const el = resolve(id, root);
        if (el && isFillable(el)) return el;
    }
    return null;
}

export function isWidgetSearchBox(el) {
    if (!el || el.tagName !== "INPUT") return false;
    if (el.classList.contains("chosen-search-input") || el.classList.contains("select2-search__field")) return true;
    return !!(el.closest && el.closest(".chosen-container, .chosen-search, .select2-container, .select2-search"));
}

export function isFillable(el) {
    if (!el) return false;
    if (el.disabled || el.readOnly) return false;
    if (el.type === "hidden") return false;
    if (isWidgetSearchBox(el)) return false;
    const enhanced = el.tagName === "SELECT" && (el.classList.contains("select2-hidden-accessible") || el.classList.contains("chosen-select") || el.id && el.ownerDocument.getElementById(`${el.id}_chosen`) || el.nextElementSibling && /\b(chosen|select2)-container\b/.test(el.nextElementSibling.className || ""));
    if (!enhanced && el.offsetParent === null && el.getClientRects().length === 0) return false;
    return true;
}

function nativeSet(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value); else el.value = value;
}

export function fire(el, {blur: blur = true} = {}) {
    for (const type of [ "input", "change" ]) {
        el.dispatchEvent(new Event(type, {
            bubbles: true,
            composed: true
        }));
    }
    el.dispatchEvent(new KeyboardEvent("keyup", {
        bubbles: true
    }));
    if (blur) {
        try {
            if (el.ownerDocument.activeElement === el) el.blur();
        } catch (_) {}
        el.dispatchEvent(new Event("blur", {
            bubbles: true
        }));
    }
    if (el.id || el.name) bridge("change", {
        id: el.id || el.name
    });
}

export function closeDatePickers(root = document) {
    for (const sel of [ "#ui-datepicker-div", ".ui-datepicker", ".datepicker.dropdown-menu" ]) {
        for (const el of root.querySelectorAll(sel)) {
            if (el.style.display !== "none") el.style.display = "none";
        }
    }
    bridge("closepicker", {});
}

export function setText(el, value, {upper: upper = false} = {}) {
    if (!el || value == null || value === "") return false;
    let v = String(value);
    if (upper) v = v.toUpperCase();
    if (el.maxLength > 0 && v.length > el.maxLength) v = v.slice(0, el.maxLength);
    if (el.value === v) return true;
    try {
        el.focus({
            preventScroll: true
        });
    } catch (_) {}
    nativeSet(el, v);
    fire(el);
    return true;
}

const MONTHS = [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ];

export function parseDate(input) {
    if (!input) return null;
    const s = String(input).trim().toUpperCase();
    let m;
    if (m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)) return {
        y: +m[1],
        m: +m[2],
        d: +m[3]
    };
    if (m = s.match(/^(\d{1,2})[-/.]([A-Z]{3})[A-Z]*[-/.](\d{2,4})$/)) {
        const mi = MONTHS.indexOf(m[2]);
        if (mi < 0) return null;
        return {
            d: +m[1],
            m: mi + 1,
            y: fixYear(+m[3])
        };
    }
    if (m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)) return {
        d: +m[1],
        m: +m[2],
        y: fixYear(+m[3])
    };
    return null;
}

function fixYear(y) {
    if (y > 999) return y;
    return y > 40 ? 1900 + y : 2e3 + y;
}

const p2 = n => String(n).padStart(2, "0");

export function fmtDate(parts, style) {
    if (!parts) return "";
    const {d: d, m: m, y: y} = parts;
    switch (style) {
      case "iso":
        return `${y}-${p2(m)}-${p2(d)}`;

      case "dd-mmm-yyyy":
        return `${p2(d)}-${MONTHS[m - 1]}-${y}`;

      case "mm/dd/yyyy":
        return `${p2(m)}/${p2(d)}/${y}`;

      default:
        return `${p2(d)}/${p2(m)}/${y}`;
    }
}

export function dateStyleFor(el) {
    if (!el) return "dd/mm/yyyy";
    if (el.type === "date") return "iso";
    const hint = norm([ el.placeholder, el.title, el.getAttribute("data-format"), el.className ].join(" "));
    if (/dd\s*mmm\s*yyyy|d\s*mmm\s*y/.test(hint)) return "dd-mmm-yyyy";
    if (/mm\s*dd\s*yyyy/.test(hint)) return "mm/dd/yyyy";
    if (/yyyy\s*mm\s*dd/.test(hint)) return "iso";
    const cur = String(el.value || "").trim();
    if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(cur)) return "dd-mmm-yyyy";
    if (/^\d{4}-\d{2}-\d{2}$/.test(cur)) return "iso";
    return "dd/mm/yyyy";
}

export function setDate(el, value) {
    const parts = parseDate(value);
    if (!el || !parts) return false;
    const ok = setText(el, fmtDate(parts, dateStyleFor(el)));
    closeDatePickers(el.ownerDocument || document);
    return ok;
}

export async function waitForOptions(el, timeout = 4e3) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
        if (el.options && el.options.length > 1) return true;
        await sleep(120);
    }
    return el.options && el.options.length > 1;
}

const startsWithWord = (text, q) => text.startsWith(q) && (text.length === q.length || text[q.length] === " ");

const containsWord = (text, q) => {
    for (let i = text.indexOf(q); i !== -1; i = text.indexOf(q, i + 1)) {
        const openLeft = i === 0 || text[i - 1] === " ";
        const openRight = i + q.length === text.length || text[i + q.length] === " ";
        if (openLeft && openRight) return true;
    }
    return false;
};

export function setSelect(el, value, {codes: codes = null, extraTexts: extraTexts = []} = {}) {
    if (!el || !el.options || value == null || value === "") return null;
    const raw = String(value).trim();
    const want = norm(raw);
    if (!want) return null;
    const code = codes ? codes[raw.toUpperCase()] || null : null;
    const candidates = [ raw, ...extraTexts || [] ].filter(Boolean);
    const wants = candidates.map(norm).filter(Boolean);
    const opts = Array.from(el.options).filter(o => o.index > 0 || norm(o.text) === want);
    const byText = test => opts.find(o => wants.some(w => test(norm(o.text), w)));
    let hit = null;
    if (code) hit = opts.find(o => String(o.value).toUpperCase() === String(code).toUpperCase());
    if (!hit) hit = opts.find(o => String(o.value).toUpperCase() === raw.toUpperCase());
    if (!hit) hit = byText((t, w) => t === w);
    if (!hit) hit = byText(startsWithWord);
    if (!hit) hit = byText(containsWord);
    if (!hit) {
        const tokens = want.split(" ").filter(t => t.length > 2);
        if (tokens.length) hit = opts.find(o => {
            const t = norm(o.text);
            return tokens.every(k => t.includes(k));
        });
    }
    if (!hit) return null;
    if (el.value !== hit.value) {
        try {
            el.focus({
                preventScroll: true
            });
        } catch (_) {}
        nativeSet(el, hit.value);
        el.selectedIndex = hit.index;
    }
    fire(el, {
        blur: false
    });
    bridge("select2", {
        id: el.id || el.name
    });
    return hit.text;
}

const YES_RE = /^(y|yes|true|1)$/i;

export function setRadioYN(ids, value, root = document) {
    const v = String(value || "").trim();
    if (!v) return false;
    const wantYes = YES_RE.test(v);
    const [yesId, noId] = ids;
    const el = resolve(wantYes ? yesId : noId, root);
    if (!el) return false;
    clickControl(el);
    if (!el.checked && el.name) setRadioByName(el.name, wantYes ? "YES" : "NO", root);
    return !!el.checked;
}

export function setRadioByName(name, value, root = document) {
    const v = norm(value);
    if (!v) return false;
    const group = root.querySelectorAll(`input[type="radio"][name="${cssEscape(name)}"]`);
    if (!group.length) return false;
    const wantYes = YES_RE.test(String(value).trim());
    for (const r of group) {
        const rv = norm(r.value);
        const label = norm(labelTextFor(r));
        const isYes = rv === "y" || rv === "yes" || rv === "1" || rv === "true" || label === "yes";
        const isNo = rv === "n" || rv === "no" || rv === "0" || rv === "false" || label === "no";
        if (wantYes && isYes || !wantYes && isNo || rv === v || label === v) return clickControl(r);
    }
    return false;
}

export function clickControl(el) {
    if (!el) return false;
    if (el.checked && el.type === "radio") {
        fire(el, {
            blur: false
        });
        return true;
    }
    try {
        el.focus({
            preventScroll: true
        });
    } catch (_) {}
    el.checked = true;
    el.dispatchEvent(new MouseEvent("click", {
        bubbles: true
    }));
    fire(el, {
        blur: false
    });
    bridge("click", {
        id: el.id || el.name
    });
    return true;
}

export function setCheckbox(el, on) {
    if (!el) return false;
    const want = !!on;
    if (!!el.checked === want) return true;
    try {
        el.focus({
            preventScroll: true
        });
    } catch (_) {}
    el.dispatchEvent(new MouseEvent("click", {
        bubbles: true
    }));
    if (!!el.checked !== want) el.checked = want;
    fire(el, {
        blur: false
    });
    return !!el.checked === want;
}

const tidyLabel = s => String(s || "").replace(/\s+/g, " ").replace(/\s*\*\s*$/, "").trim();

export function labelTextFor(el) {
    const doc = el.ownerDocument || document;
    const bits = [];
    if (el.id) {
        const lab = doc.querySelector(`label[for="${cssEscape(el.id)}"]`);
        if (lab) bits.push(lab.textContent);
    }
    const wrap = el.closest("label");
    if (wrap) bits.push(wrap.textContent);
    if (bits.length) return tidyLabel(bits.join(" "));
    let node = el.parentElement;
    for (let i = 0; i < 4 && node; i++, node = node.parentElement) {
        const labs = node.querySelectorAll("label");
        if (!labs.length) continue;
        const controls = node.querySelectorAll('input:not([type="hidden"]), select, textarea');
        if (labs.length === 1 && controls.length === 1 && controls[0] === el) {
            return tidyLabel(labs[0].textContent);
        }
        break;
    }
    return "";
}

export function findByLabel(doc, re) {
    for (const el of doc.querySelectorAll("input, select, textarea")) {
        if (el.type === "hidden" || !isFillable(el)) continue;
        const text = labelTextFor(el);
        if (text && re.test(text)) return el;
    }
    return null;
}

export function haystackFor(el) {
    const bits = [ el.name, el.id, el.placeholder, el.getAttribute?.("aria-label"), el.title, labelTextFor(el) ];
    const cell = el.closest("td, th");
    if (cell) {
        let prev = cell.previousElementSibling;
        let hops = 0;
        while (prev && hops++ < 2) {
            bits.push(prev.textContent);
            prev = prev.previousElementSibling;
        }
        const row = cell.closest("tr");
        if (row && !bits.filter(Boolean).length) bits.push(row.textContent);
    }
    const group = el.closest(".form-group, .row, .field, .col-md-6, .col-sm-6, div");
    if (group) {
        const lab = group.querySelector("label, .control-label, .form-label, b, strong");
        if (lab && !lab.contains(el)) bits.push(lab.textContent);
    }
    const section = el.closest("fieldset, section, .panel, .card, table");
    if (section) {
        const head = section.querySelector("legend, caption, h1, h2, h3, h4, .panel-heading, .card-header, th");
        if (head && !head.contains(el)) bits.push(head.textContent);
    }
    return bits.filter(Boolean).join(" | ").replace(/\s+/g, " ").slice(0, 600);
}

export function flash(el, ok = true) {
    if (!el) return;
    const target = el.tagName === "SELECT" && el.classList.contains("select2-hidden-accessible") ? el.nextElementSibling || el : el;
    target.classList.add(ok ? "iv-filled" : "iv-missed");
    setTimeout(() => target.classList.remove("iv-filled", "iv-missed"), 2600);
}
