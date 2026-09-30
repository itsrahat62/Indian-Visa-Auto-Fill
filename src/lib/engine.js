import { FIELDS } from "./schema.js";

import * as F from "./filler.js";

import * as matcher from "./matcher.js";

import { detectPage, OCCUPATION_MAP, PURPOSE_CODES } from "./portal-map.js";

const yes = v => /^(y|yes|true|1)$/i.test(String(v || "").trim());

function valueFor(entry, data) {
    if (entry.value !== undefined) return entry.value;
    const v = data[entry.key] || (entry.fallbackKey ? data[entry.fallbackKey] : "") || "";
    return v && FIELDS[entry.key]?.nameSafe ? nameSafe(v) : v;
}

export function nameSafe(value) {
    return String(value).replace(/[.,'()]/g, " ").replace(/\s{2,}/g, " ").trim();
}

function wantsUpper(key, settings) {
    if (!settings.uppercase) return false;
    const def = FIELDS[key];
    if (!def) return false;
    if (def.type === "email" || def.type === "password") return false;
    return def.upper !== false;
}

function locate(entry, doc) {
    if (entry.label) {
        const el = F.findByLabel(doc, entry.label);
        if (el) return el;
    }
    return entry.ids ? F.resolveFirst(entry.ids, doc) : null;
}

async function applyEntry(entry, data, taken, report, settings, doc, waitForOptionsInline) {
    if (entry.onlyIf && !entry.onlyIf(data)) return;
    const value = valueFor(entry, data);
    if (entry.kind === "manual") {
        if (value) report(false, entry.key, null);
        return;
    }
    if (entry.kind === "radioYN") {
        if (!value) return;
        const ok = F.setRadioYN(entry.ids, value, doc);
        const el = F.resolve(yes(value) ? entry.ids[0] : entry.ids[1], doc);
        if (el) taken.add(el);
        report(ok, entry.key, el);
        return;
    }
    if (entry.kind === "radioName") {
        if (!value) return;
        let ok = false;
        for (const name of entry.ids) {
            if (F.setRadioByName(name, value, doc)) {
                ok = true;
                break;
            }
        }
        report(ok, entry.key, null);
        return;
    }
    if (entry.kind === "checkbox") {
        const box = locate(entry, doc);
        if (!box) return;
        taken.add(box);
        report(F.setCheckbox(box, yes(value)), entry.key, box);
        return;
    }
    const el = locate(entry, doc);
    if (!el || taken.has(el)) return;
    taken.add(el);
    if (!value) {
        report(null, entry.key, el);
        return;
    }
    let ok = false;
    if (entry.kind === "date") {
        ok = F.setDate(el, value);
    } else if (entry.kind === "select" || entry.kind === "selectText") {
        if (entry.waitOpts && waitForOptionsInline) await F.waitForOptions(el);
        ok = !!F.setSelect(el, value, {
            codes: entry.codes,
            extraTexts: synonyms(entry, value)
        });
    } else {
        ok = F.setText(el, value, {
            upper: wantsUpper(entry.key, settings)
        });
    }
    if (!ok && entry.waitOpts && (entry.kind === "select" || entry.kind === "selectText")) {
        const set = () => F.setSelect(el, value, {
            codes: entry.codes,
            extraTexts: synonyms(entry, value)
        });
        fillWhenOptionsArrive(el, set, 2e4, 250, entry.sticky ? () => stick(el, set) : null);
    }
    report(ok, entry.key, el);
    if (ok && entry.sticky) {
        stick(el, () => {
            if (entry.kind === "date") F.setDate(el, value); else if (entry.kind === "select" || entry.kind === "selectText") {
                F.setSelect(el, value, {
                    codes: entry.codes,
                    extraTexts: synonyms(entry, value)
                });
            } else F.setText(el, value, {
                upper: wantsUpper(entry.key, settings)
            });
        });
    }
    if (entry.pause) await F.sleep(entry.pause);
}

export function fillWhenOptionsArrive(el, apply, ms = 2e4, every = 250, onFilled = null) {
    if (!el) return 0;
    const deadline = Date.now() + ms;
    const timer = setInterval(() => {
        if (Date.now() > deadline || !el.isConnected) {
            clearInterval(timer);
            return;
        }
        if (!el.options || el.options.length <= 1) return;
        let ok = false;
        try {
            ok = !!apply();
        } catch (_) {
            clearInterval(timer);
            return;
        }
        if (!ok) return;
        clearInterval(timer);
        if (onFilled) {
            try {
                onFilled();
            } catch (_) {}
        }
    }, every);
    return timer;
}

function stick(el, reapply, ms = 6e3, every = 400) {
    if (!el) return;
    let expected = el.value;
    const deadline = Date.now() + ms;
    const timer = setInterval(() => {
        if (Date.now() > deadline || !el.isConnected) {
            clearInterval(timer);
            return;
        }
        if (el.value === expected) return;
        try {
            reapply();
            expected = el.value;
        } catch (_) {
            clearInterval(timer);
        }
    }, every);
}

function synonyms(entry, value) {
    const out = [];
    const v = String(value).toUpperCase();
    if (entry.map === "occupation") {
        const mapped = OCCUPATION_MAP[v];
        if (mapped) out.push(mapped);
    }
    if (entry.key === "purpose" || entry.key === "visaType") {
        for (const [name, codes] of Object.entries(PURPOSE_CODES)) {
            if (v.includes(name)) out.push(...codes, `(${codes[0]})`);
        }
    }
    return out;
}

export function applyGeneric(el, key, value, settings) {
    const def = FIELDS[key] || {};
    if (el.tagName === "SELECT") return !!F.setSelect(el, value);
    if (def.type === "date") return F.setDate(el, value);
    return F.setText(el, def.nameSafe ? nameSafe(value) : value, {
        upper: wantsUpper(key, settings)
    });
}

export async function runFill({data: data, settings: settings, learned: learned = {}, doc: doc = document, onField: onField, waitForOptionsInline: waitForOptionsInline = true}) {
    const stats = {
        filled: 0,
        failed: [],
        empty: [],
        page: null
    };
    const taken = new Set;
    const usedKeys = new Set;
    const report = (ok, key, el) => {
        if (ok === true) {
            stats.filled++;
            if (key) usedKeys.add(key);
        } else if (ok === false) stats.failed.push(key || "?"); else stats.empty.push(key || "?");
        onField?.(ok, key, el);
    };
    const page = detectPage(doc);
    stats.page = page;
    if (page) {
        for (const entry of page.fields) {
            try {
                await applyEntry(entry, data, taken, report, settings, doc, waitForOptionsInline);
            } catch (err) {
                console.warn("IV: field failed", entry.key, err);
            }
        }
    }
    for (const [selector, key] of Object.entries(learned)) {
        let el = null;
        try {
            el = doc.querySelector(selector);
        } catch (_) {}
        if (!el || taken.has(el) || !F.isFillable(el)) continue;
        const v = data[key];
        if (!v) {
            report(null, key, el);
            continue;
        }
        taken.add(el);
        report(applyGeneric(el, key, v, settings), key, el);
    }
    if (settings.heuristicFallback) {
        const have = new Set(Object.keys(data).filter(k => data[k] && !usedKeys.has(k)));
        const controls = matcher.collectControls(doc);
        for (const p of matcher.buildPlan(controls, have, taken)) {
            taken.add(p.ctrl.el);
            report(applyGeneric(p.ctrl.el, p.key, data[p.key], settings), p.key, p.ctrl.el);
        }
    }
    F.closeDatePickers(doc);
    return stats;
}
