const FILLABLE_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="password"]), select, textarea';

export const NEVER_FILL = /captcha|turnstile|otp/i;

export function createRefillGuard(doc, isFillable, maxPasses = 8) {
    const offered = new WeakSet;
    let passes = 0;
    const controls = () => doc.querySelectorAll(FILLABLE_SELECTOR);
    const skip = el => NEVER_FILL.test(`${el.id || ""} ${el.name || ""}`);
    return {
        markAll() {
            for (const el of controls()) offered.add(el);
        },
        hasUnseen() {
            for (const el of controls()) {
                if (offered.has(el)) continue;
                if (skip(el)) continue;
                if (!isFillable(el)) continue;
                return true;
            }
            return false;
        },
        canRun() {
            return passes < maxPasses;
        },
        countRun() {
            passes++;
        },
        get passes() {
            return passes;
        }
    };
}
