export const MIN_VISIBLE = 48;

export const EDGE = 4;

export function clampPos(pos, size, view, {fully: fully = false} = {}) {
    const w = Math.max(0, size?.width || 0);
    const h = Math.max(0, size?.height || 0);
    const vw = Math.max(0, view?.width || 0);
    const vh = Math.max(0, view?.height || 0);
    const maxRight = fully ? Math.max(EDGE, vw - w - EDGE) : Math.max(EDGE, vw - MIN_VISIBLE);
    const maxBottom = fully ? Math.max(EDGE, vh - h - EDGE) : Math.max(EDGE, vh - MIN_VISIBLE);
    const right = clamp(num(pos?.right, EDGE), EDGE, maxRight);
    const bottom = clamp(num(pos?.bottom, EDGE), EDGE, maxBottom);
    return {
        right: Math.round(right),
        bottom: Math.round(bottom)
    };
}

export function isOnScreen(pos, size, view) {
    const c = clampPos(pos, size, view);
    return c.right === Math.round(num(pos?.right, -1)) && c.bottom === Math.round(num(pos?.bottom, -1));
}

export const DEFAULT_POS = {
    right: 20,
    bottom: 20
};

function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
}
