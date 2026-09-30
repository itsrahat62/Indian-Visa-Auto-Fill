import { PORTAL_PAGES } from "./portal-map.js";

import { LETTER_KINDS } from "./letters.js";

import { PORTALS } from "./portals.js";

import { FIELDS } from "./schema.js";

export const BUILDS = [ "visa" ];

export function buildOfPage(id) {
    return String(id || "").startsWith("ivac-") ? "appointment" : "visa";
}

function keysOfPage(page) {
    const out = [];
    for (const f of page.fields || []) {
        if (f.key) out.push(f.key);
        if (f.fallbackKey) out.push(f.fallbackKey);
    }
    return out;
}

const OFF_PAGE = {
    visa: () => {
        const keys = new Set;
        for (const k of [ "fullName", "givenName", "surname", "passportNo", "dob", "gender", "nationality", "mission", "visaType", "medicalRole", "illness", "hospitalName", "hospitalAddress", "doctorName", "stayDistrict", "stayState", "stayDays", "arrivalDate", "attendantOf", "attendantOfPassport", "attendantRelationship", "presentHouseStreet", "presentVillageTown", "presentDistrict", "presentPostal", "presentCountry", "presentMobile", "presentPhone", "presentEmail", "medicalCertNo" ]) keys.add(k);
        for (const kind of LETTER_KINDS) for (const k of kind.needs || []) keys.add(k);
        for (const p of PORTALS) for (const k of p.needs || []) keys.add(k);
        for (const [k, f] of Object.entries(FIELDS)) if (f.group === "travel") keys.add(k);
        return keys;
    }
};

const cache = new Map;

export function keysForBuild(build) {
    if (cache.has(build)) return cache.get(build);
    const keys = new Set;
    for (const page of PORTAL_PAGES) {
        if (buildOfPage(page.id) !== build) continue;
        for (const k of keysOfPage(page)) keys.add(k);
    }
    for (const k of (OFF_PAGE[build] || (() => []))()) keys.add(k);
    for (const k of [ ...keys ]) if (!FIELDS[k]) keys.delete(k);
    cache.set(build, keys);
    return keys;
}

export function fieldInBuild(key, build) {
    if (!build) return true;
    return keysForBuild(build).has(key);
}

export function groupInBuild(group, build) {
    if (!build) return true;
    const keys = keysForBuild(build);
    return (group.fields || []).some(f => keys.has(f.key));
}

export const DOC_SECTIONS = {
    visa: {
        webFiles: false,
        portalSlots: true
    }
};

export function docSectionsFor(build) {
    return DOC_SECTIONS[build] || {
        webFiles: true,
        portalSlots: true
    };
}
