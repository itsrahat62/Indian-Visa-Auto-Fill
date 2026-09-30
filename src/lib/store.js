import { emptyProfile, SMART_DEFAULTS, FIELD_KEYS } from "./schema.js";

const DEFAULT_SETTINGS = {
    lang: "en",
    highlight: true,
    smartDefaults: true,
    heuristicFallback: true,
    autoAdvance: false,
    uppercase: true,
    widget: true,
    widgetPos: {
        right: 20,
        bottom: 20
    },
    autoVisa: false
};

const KEYS = {
    profiles: "profiles",
    active: "activeProfileId",
    settings: "settings",
    learned: "learned",
    stays: "stays",
    companies: "companies"
};

export function contextAlive() {
    try {
        return !!(chrome.runtime && chrome.runtime.id);
    } catch (_) {
        return false;
    }
}

async function get(key, fallback) {
    if (!contextAlive()) return fallback;
    try {
        const o = await chrome.storage.local.get(key);
        return o[key] === undefined ? fallback : o[key];
    } catch (_) {
        return fallback;
    }
}

async function set(key, value) {
    if (!contextAlive()) return value;
    try {
        await chrome.storage.local.set({
            [key]: value
        });
    } catch (_) {}
    return value;
}

async function remove(key) {
    if (!contextAlive()) return;
    try {
        await chrome.storage.local.remove(key);
    } catch (_) {}
}

export async function getSettings() {
    const s = {
        ...DEFAULT_SETTINGS,
        ...await get(KEYS.settings, {})
    };
    return s;
}

export async function saveSettings(patch) {
    const next = {
        ...await getSettings(),
        ...patch
    };
    return set(KEYS.settings, next);
}

export const VISA_MODES = [ {
    id: "off",
    autoVisa: false,
    autoAdvance: false,
    name: "Off",
    nameBn: "বন্ধ",
    descBn: 'নিজে থেকে কিছু হবে না। পাতা খুললে খালিই থাকবে — প্যানেলের "Fill this page" চাপলে তবেই ভরবে।'
}, {
    id: "autofill",
    autoVisa: true,
    autoAdvance: false,
    name: "Autofill, I press Save",
    nameBn: "অটোফিল, Save আমি চাপবো",
    descBn: 'প্রতিটা পাতা খোলামাত্র নিজে থেকে ভরে যাবে, কিন্তু থেমে থাকবে। আপনি দেখে নিয়ে "Save and Continue" চাপবেন। প্রথমবার আবেদনের সময় এটাই ভালো।'
}, {
    id: "full",
    autoVisa: true,
    autoAdvance: true,
    name: "Full automatic",
    nameBn: "পূর্ণ অটো",
    descBn: 'ভরবে, তারপর নিজেই "Save and Continue" চেপে পরের পাতায় যাবে। ক্যাপচাওয়ালা পাতায় থেমে যাবে, আর শেষ Submit কখনোই চাপবে না।'
} ];

export function visaModeOf(settings = {}) {
    if (!settings.autoVisa) return "off";
    return settings.autoAdvance ? "full" : "autofill";
}

export async function setVisaMode(id) {
    const m = VISA_MODES.find(x => x.id === id);
    if (!m) return null;
    await saveSettings({
        autoVisa: m.autoVisa,
        autoAdvance: m.autoAdvance
    });
    return m;
}

export async function getProfiles() {
    const list = await get(KEYS.profiles, []);
    return Array.isArray(list) ? list : [];
}

export async function saveProfiles(list) {
    return set(KEYS.profiles, list);
}

export async function getActiveId() {
    const id = await get(KEYS.active, null);
    const list = await getProfiles();
    if (id && list.some(p => p.id === id)) return id;
    return list[0]?.id || null;
}

export async function setActiveId(id) {
    return set(KEYS.active, id);
}

export async function getActiveProfile() {
    const list = await getProfiles();
    const id = await getActiveId();
    return list.find(p => p.id === id) || null;
}

export async function upsertProfile(profile) {
    const list = await getProfiles();
    const i = list.findIndex(p => p.id === profile.id);
    const rec = {
        ...profile,
        updatedAt: Date.now()
    };
    if (i >= 0) list[i] = rec; else list.push(rec);
    await saveProfiles(list);
    if (!await getActiveId()) await setActiveId(rec.id);
    return rec;
}

export async function linkPatientApplicationId(patientPassport, applicationId) {
    const passport = String(patientPassport || "").trim().toUpperCase();
    const id = String(applicationId || "").trim().toUpperCase();
    if (!passport || !id) return [];
    const list = await getProfiles();
    const given = [];
    for (const p of list) {
        const d = p.data || {};
        if (String(d.attendantOfPassport || "").trim().toUpperCase() !== passport) continue;
        if (String(d.attendantOfApplicationId || "").trim()) continue;
        d.attendantOfApplicationId = id;
        p.updatedAt = Date.now();
        given.push(p.name);
    }
    if (given.length) await saveProfiles(list);
    return given;
}

export async function createProfile(name, data = {}) {
    const p = emptyProfile(name || "New Applicant");
    Object.assign(p.data, data);
    return upsertProfile(p);
}

export async function deleteProfile(id) {
    const list = (await getProfiles()).filter(p => p.id !== id);
    await saveProfiles(list);
    await remove(PHOTO_SRC_KEY(id));
    if (await get(KEYS.active, null) === id) await setActiveId(list[0]?.id || null);
    return list;
}

export async function duplicateProfile(id, newName) {
    const src = (await getProfiles()).find(p => p.id === id);
    if (!src) return null;
    const copy = emptyProfile(newName || `${src.name} (copy)`);
    copy.data = {
        ...src.data
    };
    copy.color = src.color;
    return upsertProfile(copy);
}

export async function nextProfile() {
    const list = await getProfiles();
    if (list.length < 2) return await getActiveProfile();
    const id = await getActiveId();
    const i = list.findIndex(p => p.id === id);
    const next = list[(i + 1) % list.length];
    await setActiveId(next.id);
    return next;
}

const FILE_KEY = id => `file:${id}`;

function newFileId() {
    return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function personFiles(profile) {
    return Array.isArray(profile?.files) ? profile.files : [];
}

export async function readFileBytes(id) {
    const rec = await get(FILE_KEY(id), null);
    return rec?.dataUrl || "";
}

export async function addPersonFile(profileId, file, {multiple: multiple = false} = {}) {
    const list = await getProfiles();
    const p = list.find(x => x.id === profileId);
    if (!p) return {
        ok: false,
        reason: "No such profile"
    };
    const id = newFileId();
    await set(FILE_KEY(id), {
        dataUrl: file.dataUrl,
        addedAt: Date.now()
    });
    const rec = {
        id: id,
        kind: file.kind || "other",
        slot: file.slot || 0,
        name: file.name,
        originalName: file.originalName || file.name,
        mime: file.mime || "",
        size: file.size || 0,
        shrunkFrom: file.shrunkFrom || 0,
        w: file.w || 0,
        h: file.h || 0,
        addedAt: Date.now()
    };
    const kept = rec.slot ? personFiles(p).filter(f => f.slot !== rec.slot) : multiple ? personFiles(p) : personFiles(p).filter(f => f.kind !== rec.kind);
    const dropped = personFiles(p).filter(f => !kept.includes(f));
    p.files = [ ...kept, rec ];
    p.updatedAt = Date.now();
    await saveProfiles(list);
    for (const old of dropped) await remove(FILE_KEY(old.id));
    return {
        ok: true,
        file: rec,
        replaced: dropped.length
    };
}

export async function removePersonFile(profileId, fileId) {
    const list = await getProfiles();
    const p = list.find(x => x.id === profileId);
    if (!p) return [];
    const gone = personFiles(p).find(f => f.id === fileId);
    p.files = personFiles(p).filter(f => f.id !== fileId);
    p.updatedAt = Date.now();
    await saveProfiles(list);
    await remove(FILE_KEY(fileId));
    if (gone?.kind === "photo") await remove(PHOTO_SRC_KEY(profileId));
    return p.files;
}

const PHOTO_SRC_KEY = profileId => `photoSrc:${profileId}`;

export async function getPhotoSource(profileId) {
    return get(PHOTO_SRC_KEY(profileId), null);
}

export async function setPhotoSource(profileId, src) {
    return set(PHOTO_SRC_KEY(profileId), src);
}

export function fileOfKind(profile, kind) {
    return personFiles(profile).find(f => f.kind === kind) || null;
}

export async function resolvedData(profile, settings) {
    const s = settings || await getSettings();
    const src = profile?.data || {};
    const out = {};
    for (const k of FIELD_KEYS) out[k] = (src[k] ?? "").toString().trim();
    if (s.smartDefaults) {
        for (const [k, v] of Object.entries(SMART_DEFAULTS)) if (!out[k]) out[k] = v;
    }
    if (!out.fullName && (out.givenName || out.surname)) {
        out.fullName = [ out.givenName, out.surname ].filter(Boolean).join(" ");
    }
    if (!out.emailConfirm) out.emailConfirm = out.presentEmail;
    const sameAsPresent = /^(y|yes|true|1)$/i.test(out.permanentSame || "");
    if (sameAsPresent || !out.permHouseStreet) {
        out.permHouseStreet ||= out.presentHouseStreet;
        out.permVillageTown ||= out.presentVillageTown;
        out.permState ||= out.presentState;
        out.permDistrict ||= out.presentDistrict;
        out.permPostal ||= out.presentPostal;
        out.permPhone ||= out.presentPhone;
    }
    if (!out.portOfExit) out.portOfExit = out.portOfArrival;
    if (!out.employerPhone) out.employerPhone = out.presentPhone;
    return out;
}

export function pageKey(url) {
    try {
        const u = new URL(url);
        return `${u.host}${u.pathname}`.toLowerCase();
    } catch (_) {
        return String(url || "").toLowerCase();
    }
}

export async function getLearned(url) {
    const all = await get(KEYS.learned, {});
    return all[pageKey(url)] || {};
}

export async function getAllLearned() {
    return get(KEYS.learned, {});
}

export async function learn(url, selector, fieldKey) {
    const all = await get(KEYS.learned, {});
    const pk = pageKey(url);
    all[pk] = all[pk] || {};
    if (fieldKey) all[pk][selector] = fieldKey; else delete all[pk][selector];
    if (!Object.keys(all[pk]).length) delete all[pk];
    return set(KEYS.learned, all);
}

export async function clearLearned(pk) {
    const all = await get(KEYS.learned, {});
    if (pk) delete all[pk]; else return set(KEYS.learned, {});
    return set(KEYS.learned, all);
}

export const getStays = () => get(KEYS.stays, []);

export const saveStays = v => set(KEYS.stays, v);

export const getCompanies = () => get(KEYS.companies, []);

export const saveCompanies = v => set(KEYS.companies, v);

const MAGIC = "IVAP-BACKUP-1";

export async function exportAll(passphrase, {documents: documents = false} = {}) {
    const profiles = await getProfiles();
    const bytes = {};
    if (documents) {
        for (const p of profiles) {
            for (const f of personFiles(p)) {
                const b = await readFileBytes(f.id);
                if (b) bytes[f.id] = b;
            }
        }
    }
    const payload = {
        magic: MAGIC,
        exportedAt: (new Date).toISOString(),
        profiles: profiles,
        documents: bytes,
        settings: await getSettings(),
        learned: await getAllLearned(),
        stays: await getStays(),
        companies: await getCompanies()
    };
    if (!passphrase) return {
        encrypted: false,
        body: JSON.stringify(payload, null, 2)
    };
    const enc = await encrypt(JSON.stringify(payload), passphrase);
    return {
        encrypted: true,
        body: JSON.stringify({
            magic: MAGIC,
            encrypted: true,
            ...enc
        }, null, 2)
    };
}

export async function importAll(text, passphrase, {merge: merge = true} = {}) {
    let obj = JSON.parse(text);
    if (obj.encrypted) {
        if (!passphrase) throw new Error("This backup is password protected. Please enter your passphrase.");
        obj = JSON.parse(await decrypt(obj, passphrase));
    }
    if (obj.magic !== MAGIC) throw new Error("This file is not a valid backup for this extension.");
    const incoming = Array.isArray(obj.profiles) ? obj.profiles : [];
    if (merge) {
        const cur = await getProfiles();
        const byId = new Map(cur.map(p => [ p.id, p ]));
        for (const p of incoming) {
            const old = byId.get(p.id);
            if (!old || (p.updatedAt || 0) >= (old.updatedAt || 0)) byId.set(p.id, p);
        }
        await saveProfiles([ ...byId.values() ]);
    } else {
        await saveProfiles(incoming);
    }
    if (obj.settings) await saveSettings(obj.settings);
    if (obj.learned) await set(KEYS.learned, {
        ...merge ? await getAllLearned() : {},
        ...obj.learned
    });
    if (obj.stays) await saveStays(obj.stays);
    if (obj.companies) await saveCompanies(obj.companies);
    if (!await getActiveId()) await setActiveId((await getProfiles())[0]?.id || null);
    const carried = obj.documents && typeof obj.documents === "object" ? obj.documents : {};
    for (const [id, dataUrl] of Object.entries(carried)) {
        if (dataUrl) await set(FILE_KEY(id), {
            dataUrl: dataUrl,
            addedAt: Date.now()
        });
    }
    const after = await getProfiles();
    let dropped = 0;
    for (const p of after) {
        const keep = [];
        for (const f of personFiles(p)) {
            if (await readFileBytes(f.id)) keep.push(f); else dropped++;
        }
        p.files = keep;
    }
    if (dropped) await saveProfiles(after);
    return {
        profiles: incoming.length,
        documents: Object.keys(carried).length,
        dropped: dropped
    };
}

const te = new TextEncoder;

const td = new TextDecoder;

async function deriveKey(passphrase, salt) {
    const base = await crypto.subtle.importKey("raw", te.encode(passphrase), "PBKDF2", false, [ "deriveKey" ]);
    return crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt: salt,
        iterations: 25e4,
        hash: "SHA-256"
    }, base, {
        name: "AES-GCM",
        length: 256
    }, false, [ "encrypt", "decrypt" ]);
}

async function encrypt(plaintext, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const buf = await crypto.subtle.encrypt({
        name: "AES-GCM",
        iv: iv
    }, key, te.encode(plaintext));
    return {
        salt: b64(salt),
        iv: b64(iv),
        data: b64(new Uint8Array(buf))
    };
}

async function decrypt({salt: salt, iv: iv, data: data}, passphrase) {
    const key = await deriveKey(passphrase, unb64(salt));
    try {
        const buf = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: unb64(iv)
        }, key, unb64(data));
        return td.decode(buf);
    } catch (_) {
        throw new Error("Wrong passphrase, or the backup file is corrupted.");
    }
}

const b64 = u8 => btoa(String.fromCharCode(...u8));

const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
