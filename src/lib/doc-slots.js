export const DOC_RULES_PORTAL = {
    format: "PDF",
    minBytes: 10 * 1024,
    maxBytes: 500 * 1024,
    english: true,
    note: "All documents uploaded by the applicant including business cards, invitation letters etc. must be in English language, failing which application would be liable for rejection."
};

export const MEDICAL_M2_SLOTS = [ {
    slot: 1,
    mandatory: true,
    name: "PASSPORT PAGE",
    kind: "passport",
    text: "Copy of Passport page containing personal particulars",
    bn: "পাসপোর্টের যে পাতায় নাম, জন্মতারিখ, মেয়াদ লেখা — সেই পাতার কপি। ভিসার ফর্মে যে পাসপোর্টের তথ্য দিয়েছেন, হুবহু সেই পাসপোর্টেরই হতে হবে।"
}, {
    slot: 2,
    mandatory: true,
    name: "HOSPITAL LETTER",
    kind: "hospital",
    text: "Relevant letters signed and stamped from the hospital concerned in India should be provided on the letter head of the hospital/organisation with applicant's details. The letter should be addressed to the concerned Mission/Post",
    bn: "ভারতের হাসপাতালের চিঠি — হাসপাতালের প্যাডে, সই ও সিল সহ, আবেদনকারীর তথ্য লেখা, আর চিঠিটা মিশন বরাবর ঠিকানা করা থাকতে হবে।"
}, {
    slot: 3,
    mandatory: true,
    name: "UNDERTAKING",
    kind: "undertaking",
    text: "Duly filled Medical Visa Undertaking",
    bn: "পূরণ করা মেডিকেল ভিসা অঙ্গীকারনামা।"
}, {
    slot: 4,
    mandatory: false,
    name: "ADDRESS PROOF",
    kind: "bill",
    text: "Address proof",
    bn: "ঠিকানার প্রমাণ।"
}, {
    slot: 5,
    mandatory: false,
    name: "TICKETS",
    kind: "ticket",
    text: "Confirmed To and Fro travel tickets",
    bn: "যাওয়া-আসার নিশ্চিত টিকিট।"
}, {
    slot: 6,
    mandatory: false,
    name: "NID",
    kind: "nid",
    text: "Copy National ID Card or equivalent document",
    bn: "জাতীয় পরিচয়পত্র বা সমমানের কাগজের কপি।"
}, {
    slot: 7,
    mandatory: false,
    name: "INDIAN ORIGIN PROOF",
    kind: "other",
    text: "If the applicant is of Indian origin (born Indian) and has held an Indian passport in the past",
    bn: "ভারতীয় বংশোদ্ভূত হলে ও আগে ভারতীয় পাসপোর্ট থাকলে। বাংলাদেশিদের সাধারণত লাগে না।"
}, {
    slot: 8,
    mandatory: false,
    name: "NATIONALITY CERTIFICATE",
    kind: "other",
    text: "A copy of the 'Nationality Certificate' specifying that they have obtained their current nationality by naturalisation",
    bn: "নাগরিকত্ব সনদ — যাঁরা জন্মসূত্রে নয়, আবেদন করে নাগরিক হয়েছেন তাঁদের জন্য।"
}, {
    slot: 9,
    mandatory: false,
    name: "OTHER PASSPORT",
    kind: "other",
    text: "Copy of other nationality passport in case of double nationality.",
    bn: "দ্বৈত নাগরিকত্ব থাকলে অন্য দেশের পাসপোর্টের কপি।"
}, {
    slot: 10,
    mandatory: false,
    name: "UTILITY BILL",
    kind: "bill",
    text: "Recent utility bill or Bank statement with name and address of applicant printed on it for proof of residence",
    bn: "সাম্প্রতিক বিদ্যুৎ/গ্যাসের বিল বা ব্যাংক স্টেটমেন্ট — তাতে আবেদনকারীর নাম ও ঠিকানা ছাপা থাকতে হবে।"
}, {
    slot: 11,
    mandatory: false,
    name: "EXTRA",
    kind: "other",
    text: "",
    bn: "পাতায় এই ঘরটার কোনো বর্ণনা নেই — অতিরিক্ত কিছু দেওয়ার জায়গা।"
}, {
    slot: 12,
    mandatory: false,
    name: "FUNDS PROOF",
    kind: "bank",
    text: "Proof of availability of sufficient funds for medical & living expenses in India / Salary certificate / sponsorship",
    bn: "ভারতে চিকিৎসা ও থাকার খরচ চালানোর সামর্থ্যের প্রমাণ — ব্যাংক স্টেটমেন্ট, বেতনের সনদ বা স্পনসরশিপ।"
}, {
    slot: 13,
    mandatory: false,
    name: "ATTENDANT LETTER",
    kind: "medical",
    text: "Letter from doctor/hospital certifying the requirement of an attendant. (Medical Attendant)",
    bn: "ডাক্তার বা হাসপাতালের চিঠি, যাতে লেখা থাকবে রুগির সাথে একজন লোক লাগবে। শুধু M2/M4-এর জন্য।"
}, {
    slot: 14,
    mandatory: false,
    name: "PATIENT TREATMENT DOCS",
    kind: "medical",
    text: "documents relating to the medical treatment of patient ( Medical Attendant)",
    bn: "রুগির চিকিৎসা সংক্রান্ত কাগজপত্র। শুধু M2/M4-এর জন্য।"
}, {
    slot: 15,
    mandatory: false,
    name: "PATIENT RECORDS",
    kind: "medical",
    text: "Previous medical records of patient.",
    bn: "রুগির আগের মেডিকেল রেকর্ড।"
} ];

const MEDICAL_M1_SLOTS = MEDICAL_M2_SLOTS.filter(s => !/\(\s*Medical Attendant\s*\)/i.test(s.text)).map((s, i) => ({
    ...s,
    slot: i + 1,
    derived: true
}));

const BY_VISA = {
    "MEDICAL:M1": MEDICAL_M1_SLOTS,
    "MEDICAL:M2": MEDICAL_M2_SLOTS,
    "MEDICAL:M3": MEDICAL_M1_SLOTS,
    "MEDICAL:M4": MEDICAL_M2_SLOTS
};

const COMMON_SLOTS = [ "passport", "bill", "nid" ].map((kind, i) => {
    const s = MEDICAL_M2_SLOTS.find(x => x.kind === kind);
    return {
        ...s,
        slot: i + 1,
        mandatory: kind === "passport",
        derived: true
    };
});

export function slotsFor(category, sub) {
    const exact = BY_VISA[`${category}:${sub}`];
    if (exact) return exact;
    return COMMON_SLOTS;
}

export function slotsAreDerived(category, sub) {
    return !BY_VISA[`${category}:${sub}`] || BY_VISA[`${category}:${sub}`].some(s => s.derived);
}

export function readSlots(doc) {
    const rows = [ ...doc.querySelectorAll("tr") ].filter(tr => tr.cells && /^\d+$/.test((tr.cells[0]?.textContent || "").trim()));
    return rows.map(tr => {
        const full = (tr.cells[1]?.textContent || "").replace(/\s+/g, " ").trim();
        return {
            slot: Number(tr.cells[0].textContent.trim()),
            mandatory: /\(mandatory\)/i.test(full),
            text: full.replace(/\s*\((mandatory|optional)\)\s*$/i, "").trim(),
            uploaded: /uploaded/i.test(tr.cells[3]?.textContent || "") && !/not\s+uploaded/i.test(tr.cells[3]?.textContent || ""),
            file: tr.querySelector('input[type="file"]'),
            button: tr.querySelector('input[value="Upload Document" i], input[type="submit"]')
        };
    });
}

export function missingMandatory(doc) {
    return readSlots(doc).filter(s => s.mandatory && !s.uploaded);
}

export function matchSlot(slotText, slots = MEDICAL_M2_SLOTS) {
    const t = String(slotText || "").toLowerCase();
    if (!t) return null;
    return slots.find(s => s.text && t.startsWith(s.text.toLowerCase().slice(0, 40))) || slots.find(s => s.text && t.includes(s.text.toLowerCase().slice(0, 30))) || null;
}
