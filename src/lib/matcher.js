import { FIELDS, normalise } from "./schema.js";

import { haystackFor, isFillable } from "./filler.js";

const SKIP_TYPES = new Set([ "hidden", "submit", "button", "reset", "image", "file", "password" ]);

const CAPTCHA_RE = /captcha|verificationcode|securitycode/i;

export function collectControls(root = document) {
    const out = [];
    const nodes = root.querySelectorAll("input, select, textarea");
    for (const el of nodes) {
        if (el.tagName === "INPUT" && SKIP_TYPES.has(el.type)) continue;
        if (el.type === "radio" || el.type === "checkbox") continue;
        if (CAPTCHA_RE.test(`${el.id} ${el.name}`)) continue;
        if (!isFillable(el)) continue;
        const hay = haystackFor(el);
        out.push({
            el: el,
            hay: hay,
            hayN: normalise(hay),
            kind: el.tagName === "SELECT" ? "select" : el.tagName === "TEXTAREA" ? "textarea" : "text"
        });
    }
    return out;
}

function hasWords(hay, phrase) {
    const p = normalise(phrase);
    if (!p) return false;
    return ` ${hay} `.includes(` ${p} `);
}

export function score(field, ctrl) {
    const m = field.match;
    if (!m) return 0;
    const hay = ctrl.hayN;
    if (!hay) return 0;
    for (const bad of m.not || []) {
        if (hasWords(hay, bad)) return 0;
    }
    for (const need of m.all || []) {
        if (!hasWords(hay, need)) return 0;
    }
    let best = 0;
    for (const phrase of m.any || []) {
        const p = normalise(phrase);
        if (!p) continue;
        if (hasWords(hay, p)) best = Math.max(best, p.length);
    }
    if (!best) return 0;
    let s = best + 10;
    const idName = normalise(`${ctrl.el.id} ${ctrl.el.name}`);
    if (idName && idName.split(" ").includes(normalise(field.key))) s += 40;
    const wantsSelect = field.type === "select" || field.type === "yn";
    if (wantsSelect && ctrl.kind === "select") s += 8; else if (wantsSelect && ctrl.kind !== "select") s -= 6;
    if (field.type === "textarea" && ctrl.kind === "textarea") s += 4;
    if (field.type === "email" && ctrl.el.type === "email") s += 6;
    if (field.type === "tel" && ctrl.el.type === "tel") s += 4;
    if (field.type === "date" && (ctrl.el.type === "date" || /date/i.test(ctrl.el.id + ctrl.el.name))) s += 6;
    return s;
}

const MIN_SCORE = 14;

export function buildPlan(controls, have, taken = new Set, keySubset = null) {
    const keys = (keySubset || Object.keys(FIELDS)).filter(k => have.has(k));
    const pairs = [];
    for (const ctrl of controls) {
        if (taken.has(ctrl.el)) continue;
        for (const key of keys) {
            const s = score(FIELDS[key], ctrl);
            if (s >= MIN_SCORE) pairs.push({
                key: key,
                ctrl: ctrl,
                s: s
            });
        }
    }
    pairs.sort((a, b) => b.s - a.s);
    const usedEl = new Set;
    const usedKey = new Set;
    const plan = [];
    for (const p of pairs) {
        if (usedEl.has(p.ctrl.el) || usedKey.has(p.key)) continue;
        usedEl.add(p.ctrl.el);
        usedKey.add(p.key);
        plan.push(p);
    }
    return plan;
}

export function suggestKeys(el, limit = 3) {
    const ctrl = {
        el: el,
        hay: haystackFor(el),
        hayN: normalise(haystackFor(el)),
        kind: el.tagName === "SELECT" ? "select" : el.tagName === "TEXTAREA" ? "textarea" : "text"
    };
    return Object.keys(FIELDS).map(key => ({
        key: key,
        s: score(FIELDS[key], ctrl)
    })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map(x => x.key);
}

export function selectorFor(el) {
    if (el.id) return `#${cssEsc(el.id)}`;
    if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name.replace(/["\\]/g, "\\$&")}"]`;
    const path = [];
    let node = el;
    while (node && node.nodeType === 1 && path.length < 6) {
        let part = node.tagName.toLowerCase();
        const parent = node.parentElement;
        if (parent) {
            const sibs = Array.from(parent.children).filter(c => c.tagName === node.tagName);
            if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(node) + 1})`;
        }
        path.unshift(part);
        node = node.parentElement;
        if (node && node.id) {
            path.unshift(`#${cssEsc(node.id)}`);
            break;
        }
    }
    return path.join(" > ");
}

function cssEsc(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/([^\w-])/g, "\\$1");
}
