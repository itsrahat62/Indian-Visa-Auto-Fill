export const DOC_KINDS = [ {
    key: "webfile",
    label: "WEB FILE",
    labelBn: "ওয়েব ফাইল",
    accept: "application/pdf",
    maxBytes: 500 * 1024,
    guess: /web\s*file|webfile|ওয়েব|^BGDD/i,
    keepName: true
}, {
    key: "photo",
    label: "PHOTO",
    labelBn: "ছবি",
    accept: "image/jpeg",
    maxBytes: 1024 * 1024,
    guess: /photo|image|picture|\bpic\b|ছবি|ফটো/i,
    square: true,
    minPx: 350
}, {
    key: "passport",
    label: "PASSPORT",
    labelBn: "পাসপোর্ট",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /passport|পাসপোর্ট/i
}, {
    key: "nid",
    label: "NID",
    labelBn: "জাতীয় পরিচয়পত্র",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /(?:^|[^a-z])nid(?:[^a-z]|$)|national\s*id|smart\s*card|এনআইডি|জাতীয়\s*পরিচয়/i
}, {
    key: "birth",
    label: "BIRTH CERTIFICATE",
    labelBn: "জন্ম নিবন্ধন",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /birth|জন্ম/i
}, {
    key: "marriage",
    label: "MARRIAGE CERTIFICATE",
    labelBn: "কাবিননামা",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /marriage|nikah|kabin|কাবিন|বিবাহ|নিকাহ/i
}, {
    key: "bill",
    label: "UTILITY BILL",
    labelBn: "বিদ্যুৎ/গ্যাস বিল",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /utility|electric|\bgas\b|\bbill\b|বিদ্যুৎ|গ্যাস|বিল/i
}, {
    key: "bank",
    label: "BANK STATEMENT",
    labelBn: "ব্যাংক স্টেটমেন্ট",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /bank|statement|solvency|ব্যাংক|স্টেটমেন্ট/i
}, {
    key: "tin",
    label: "TIN CERTIFICATE",
    labelBn: "টিআইএন",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /\btin\b|tax|টিআইএন|কর/i
}, {
    key: "employer",
    label: "EMPLOYER CERTIFICATE",
    labelBn: "চাকরির প্রত্যয়নপত্র",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /employer|employment|\bnoc\b|office\s*letter|চাকরি|প্রত্যয়ন/i
}, {
    key: "student",
    label: "STUDENT CERTIFICATE",
    labelBn: "শিক্ষা সনদ",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /student|school|college|admission|শিক্ষা|ছাত্র/i
}, {
    key: "business",
    label: "TRADE LICENCE",
    labelBn: "ট্রেড লাইসেন্স",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /trade\s*licen|business|ব্যবসা|ট্রেড/i
}, {
    key: "hospital",
    label: "HOSPITAL LETTER",
    labelBn: "হাসপাতালের চিঠি",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /hospital|appointment\s*letter|cmc|vellore|হাসপাতাল/i
}, {
    key: "medical",
    label: "MEDICAL REPORT",
    labelBn: "মেডিকেল রিপোর্ট",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /medical|diagnos|prescription|doctor|report|মেডিকেল|চিকিৎসা|ডাক্তার|রিপোর্ট/i
}, {
    key: "invitation",
    label: "INVITATION LETTER",
    labelBn: "আমন্ত্রণপত্র",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /invitation|invite|আমন্ত্রণ|দাওয়াত/i
}, {
    key: "undertaking",
    label: "UNDERTAKING",
    labelBn: "অঙ্গীকারনামা",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /undertaking|অঙ্গীকার/i
}, {
    key: "oldvisa",
    label: "OLD VISA",
    labelBn: "পুরনো ভিসা",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /old\s*visa|previous\s*visa|পুরনো\s*ভিসা/i
}, {
    key: "ticket",
    label: "TICKET",
    labelBn: "টিকিট",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /ticket|flight|টিকিট/i
}, {
    key: "hotel",
    label: "HOTEL BOOKING",
    labelBn: "হোটেল বুকিং",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: /hotel|booking|হোটেল/i
}, {
    key: "other",
    label: "DOCUMENT",
    labelBn: "অন্যান্য",
    accept: "application/pdf,image/*",
    maxBytes: 500 * 1024,
    guess: null
} ];

const BY_KEY = new Map(DOC_KINDS.map(k => [ k.key, k ]));

export function kindOf(key) {
    return BY_KEY.get(key) || BY_KEY.get("other");
}

export function maxBytesFor(key) {
    return kindOf(key).maxBytes;
}

export function guessKind(filename) {
    const name = String(filename || "");
    if (!name) return "";
    for (const k of DOC_KINDS) {
        if (k.guess && k.guess.test(name)) return k.key;
    }
    return "";
}

export function asciiName(text) {
    return String(text || "").replace(/[^\x20-\x7E]/g, " ").replace(/[^A-Za-z0-9 .-]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

export function nameIsSafe(filename) {
    const name = String(filename || "");
    if (!name) return false;
    return /^[A-Za-z0-9 ._-]+$/.test(name);
}

export function extensionOf(filename, mime = "") {
    const m = /\.([A-Za-z0-9]{1,5})$/.exec(String(filename || ""));
    if (m) return `.${m[1].toLowerCase()}`;
    if (/pdf/i.test(mime)) return ".pdf";
    if (/png/i.test(mime)) return ".png";
    if (/jpe?g/i.test(mime)) return ".jpg";
    return "";
}

export function fileNameFor(data = {}, kindKey = "other", opts = {}) {
    const {original: original = "", mime: mime = "", index: index = 0, slotName: slotName = ""} = opts;
    const kind = kindOf(kindKey);
    const ext = extensionOf(original, mime) || ".pdf";
    if (kind.keepName && nameIsSafe(original)) return original;
    const person = asciiName(data.fullName || [ data.givenName, data.surname ].filter(Boolean).join(" ") || data.passportNo || "APPLICANT");
    const what = asciiName(slotName) || kind.label;
    const suffix = index > 0 ? ` ${index + 1}` : "";
    return `${person} ${what}${suffix}${ext}`.replace(/\s+/g, " ");
}

export function needsRename(filename, data, kindKey, opts = {}) {
    if (!nameIsSafe(filename)) return true;
    const want = fileNameFor(data, kindKey, {
        ...opts,
        original: filename
    });
    return String(filename).toUpperCase() !== want.toUpperCase();
}

const kb = n => `${Math.round(n / 1024)}KB`;

export function checkDoc(file = {}, data = {}, kindKey = "other") {
    const kind = kindOf(kindKey);
    const fixable = [];
    const errors = [];
    const name = file.name || "";
    if (!name) errors.push("No file chosen");
    if (!file.size) errors.push("That file is empty");
    if (name && !nameIsSafe(name)) {
        fixable.push(`Rename to "${fileNameFor(data, kindKey, {
            original: name,
            mime: file.mime
        })}"`);
    } else if (name && needsRename(name, data, kindKey)) {
        fixable.push(`Rename to "${fileNameFor(data, kindKey, {
            original: name,
            mime: file.mime
        })}"`);
    }
    if (file.size > kind.maxBytes) {
        fixable.push(`Shrink from ${kb(file.size)} to under ${kb(kind.maxBytes)}`);
    }
    if (kind.square && file.width && file.height) {
        if (file.width !== file.height) fixable.push(`Crop square — it is ${file.width}×${file.height}`);
        if (Math.min(file.width, file.height) < kind.minPx) {
            errors.push(`Too small: ${file.width}×${file.height}, the portal wants at least ${kind.minPx}×${kind.minPx}`);
        }
    }
    return {
        ok: errors.length === 0,
        fixable: fixable,
        errors: errors
    };
}
