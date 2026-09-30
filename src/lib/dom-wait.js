export function waitFor(fn, {timeout: timeout = 8e3, every: every = 60} = {}) {
    return new Promise(resolve => {
        let done = false;
        const finish = v => {
            if (!done) {
                done = true;
                clearInterval(t);
                resolve(v);
            }
        };
        const tick = () => {
            let v = null;
            try {
                v = fn();
            } catch (_) {
                v = null;
            }
            if (v) finish(v);
        };
        const t = setInterval(tick, every);
        setTimeout(() => finish(null), timeout);
        tick();
    });
}

export const isVisible = el => !!el && !el.disabled && (el.offsetParent !== null || el.getClientRects().length > 0);

export const textOf = el => (el.textContent || el.value || "").replace(/\s+/g, " ").trim();

export function actionable(doc, skipRoot = null) {
    return [ ...doc.querySelectorAll('button, input[type="submit"], input[type="button"], a[role="button"]') ].filter(el => !(skipRoot && skipRoot.contains(el))).filter(isVisible);
}

export function findButton(doc, re, {skipRoot: skipRoot = null} = {}) {
    const cands = actionable(doc, skipRoot);
    let best = null;
    let bestScore = 0;
    for (const el of cands) {
        const t = textOf(el);
        if (!t || !re.test(t)) continue;
        const m = t.match(re);
        const hit = m && m[0] || "";
        const score = t.toLowerCase() === hit.toLowerCase() ? 3 : t.toLowerCase().startsWith(hit.toLowerCase()) ? 2 : 1;
        if (score > bestScore) {
            best = el;
            bestScore = score;
        }
    }
    return best;
}

export function waitForButton(doc, re, opts = {}) {
    const {skipRoot: skipRoot = null, timeout: timeout = 8e3} = opts;
    return waitFor(() => findButton(doc, re, {
        skipRoot: skipRoot
    }), {
        timeout: timeout
    });
}

const DIALOG_SELECTOR = [ '[role="dialog"]', '[aria-modal="true"]', ".modal", ".ReactModal__Content", '[class*="modal" i]', '[class*="popup" i]', ".fixed.inset-0" ].join(",");

export function closeDialogs(doc, skipRoot = null) {
    let closed = 0;
    for (const dialog of doc.querySelectorAll(DIALOG_SELECTOR)) {
        if (skipRoot && skipRoot.contains(dialog)) continue;
        if (!isVisible(dialog)) continue;
        const btn = [ ...dialog.querySelectorAll('button, [role="button"], svg, a') ].filter(el => !(skipRoot && skipRoot.contains(el))).find(el => {
            const aria = (el.getAttribute("aria-label") || "").toLowerCase();
            const cls = (el.getAttribute("class") || "").toLowerCase();
            const t = textOf(el).toLowerCase();
            return /^(close|dismiss)\b/.test(aria) || /(^|[\s-])(close|dismiss)([\s-]|$)/.test(cls) || t === "×" || t === "✕" || t === "x" || t === "close" || t === "ok" || t === "got it";
        });
        const target = btn && (btn.closest('button, a, [role="button"]') || btn);
        if (target && isVisible(target)) {
            target.click();
            closed++;
        }
    }
    return closed;
}
