export const VISA = "visa";

export const NEITHER = "";

const VISA_HOSTS = /(^|\.)indianvisa-bangladesh\.nic\.in$|(^|\.)indianvisaonline\.gov\.in$/i;

export function modeFor(url) {
    let host = "";
    try {
        host = new URL(String(url || "")).hostname;
    } catch (_) {
        return NEITHER;
    }
    if (VISA_HOSTS.test(host)) return VISA;
    return NEITHER;
}

export const LABEL = {
    [VISA]: {
        en: "Visa form",
        bn: "ভিসা ফর্ম",
        icon: "📝",
        site: "indianvisa-bangladesh.nic.in"
    }
};

export const HOME = {
    [VISA]: "https://indianvisa-bangladesh.nic.in/visa/index.html"
};

export function showsIn(belongs, mode) {
    if (!belongs || belongs === "both") return true;
    return belongs === mode;
}

export const SETTING_MODE = {
    autoVisa: VISA,
    autoAdvance: VISA
};
