import { PdfDoc } from "./pdfdoc.js";

const clean = s => String(s || "").replace(/\s+/g, " ").trim();

const has = s => !!clean(s);

export function todayStr(now = new Date) {
    const p2 = n => String(n).padStart(2, "0");
    return `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

export function nameOf(d = {}) {
    const joined = [ d.givenName, d.surname ].filter(Boolean).join(" ");
    return clean(d.fullName) || clean(joined) || "";
}

export function listOf(items) {
    const xs = items.filter(has).map(clean);
    if (xs.length <= 1) return xs[0] || "";
    return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

const MISSION_CITY = {
    BGDD: "DHAKA",
    BGDC: "CHITTAGONG",
    BGDK: "KHULNA",
    BGDR: "RAJSHAHI",
    BGDS: "SYLHET"
};

function missionCity(d = {}) {
    const m = clean(d.mission).toUpperCase();
    return MISSION_CITY[m] || (m.startsWith("BANGLADESH-") ? m.slice(11) : m) || "DHAKA";
}

function companionPhrase(companions = []) {
    const bits = companions.filter(c => has(c.name)).map(c => has(c.passportNo) ? `**${clean(c.name)}** (Passport No. **${clean(c.passportNo)}**)` : `**${clean(c.name)}**`);
    return listOf(bits);
}

export function medicalCoverLetter(data = {}, opts = {}) {
    const {companions: companions = [], isAttendant: isAttendant = false, patient: patient = null, now: now = new Date} = opts;
    const name = nameOf(data);
    const passport = clean(data.passportNo);
    const blocks = [];
    const P = (text, o) => blocks.push({
        kind: "paragraph",
        text: text,
        ...o
    });
    const T = (text, o) => blocks.push({
        kind: "text",
        text: text,
        ...o
    });
    T("To");
    T("The Visa Officer");
    T("High Commission of India");
    T(`${missionCity(data)}, Bangladesh`, {
        after: 14
    });
    blocks.push({
        kind: "heading",
        text: "Subject: Application for Indian Medical Visa.",
        after: 14
    });
    T("Dear Sir/Madam,", {
        after: 10
    });
    const hospital = clean(data.hospitalName);
    const where = clean(data.hospitalAddress);
    const district = [ clean(data.stayDistrict), clean(data.stayState) ].filter(has).join(", ");
    const illness = clean(data.illness);
    if (isAttendant && patient) {
        const pName = nameOf(patient);
        let s = `My name is **${name}**`;
        if (passport) s += `, holder of Bangladesh Passport No. **${passport}**`;
        s += ". I respectfully submit my application for an Indian Medical Attendant Visa";
        if (has(pName)) {
            s += ` to accompany **${pName}**`;
            if (has(patient.passportNo)) s += ` (Passport No. **${clean(patient.passportNo)}**)`;
        }
        if (has(illness)) s += `, who is travelling for **${illness}**`;
        if (has(hospital)) s += ` at **${hospital}**`;
        if (has(where)) s += `, located at **${where}**`;
        if (has(district) && !where.toUpperCase().includes(district.toUpperCase())) s += `, **${district}**`;
        s += ".";
        const rel = clean(patient.relationship);
        if (rel) {
            const g = clean(patient.gender).toUpperCase();
            const whose = g === "FEMALE" ? "her" : g === "MALE" ? "his" : "";
            s += whose ? ` I am ${whose} **${rel.toLowerCase()}**.` : ` I am the **${rel.toLowerCase()}** of **${pName}**.`;
        }
        P(s, {
            after: 10
        });
    } else {
        let s = `My name is **${name}**`;
        if (passport) s += `, holder of Bangladesh Passport No. **${passport}**`;
        s += ". I respectfully submit my application for an Indian Medical Visa";
        if (has(illness)) s += ` to receive treatment for **${illness}**`;
        if (has(hospital)) s += ` at **${hospital}**`;
        if (has(where)) s += `, located at **${where}**`;
        if (has(district) && !where.toUpperCase().includes(district.toUpperCase())) s += `, **${district}**`;
        P(`${s}.`, {
            after: 10
        });
    }
    const withMe = companionPhrase(companions);
    if (has(withMe)) {
        P(`I will be accompanied by my medical attendant(s), namely ${withMe}, ` + "who will assist me during my travel and stay in India. The medical invitation and " + "appointment letter from the hospital have been attached herewith for your kind perusal.", {
            after: 10
        });
    } else if (!isAttendant) {
        P("The medical invitation and appointment letter from the hospital have been attached " + "herewith for your kind perusal.", {
            after: 10
        });
    }
    P(isAttendant ? "I assure you that I will not overstay in India. I will comply with all visa regulations " + "and return to Bangladesh immediately upon the completion of the treatment. All expenses " + "related to my travel, accommodation and stay will be fully borne by us." : "I assure you that neither my attendants nor I will overstay in India. We will comply with " + "all visa regulations and return to Bangladesh immediately upon the completion of my " + "treatment. All expenses related to my travel, accommodation, and medical procedures will " + "be fully borne by me.", {
        after: 10
    });
    P(isAttendant ? "I kindly request you to favorably consider my application and grant me the necessary " + "Medical Attendant Visa, so that I may accompany the patient for this essential treatment." : "I kindly request you to favorably consider my application and grant me the necessary " + "Medical Visa, along with visa(s) for my accompanying attendant(s), so that I may undergo " + "this essential treatment.", {
        after: 10
    });
    P("Thank you very much for your time and kind consideration. I look forward to your positive " + "response.", {
        after: 14
    });
    T("Yours faithfully,", {
        after: 42
    });
    blocks.push({
        kind: "signature"
    });
    T(name, {
        bold: true
    });
    if (passport) T(`Passport No: ${passport}`);
    const phone = clean(data.presentMobile) || clean(data.presentPhone);
    if (phone) T(`Mobile: ${phone}`);
    if (has(data.presentEmail)) T(`Email: ${clean(data.presentEmail)}`);
    T(`Date: ${todayStr(now)}`);
    return {
        title: `${name} - Medical Cover Letter`,
        blocks: blocks
    };
}

const BLANK = "______________________";

function homeAddress(d = {}) {
    return [ d.presentHouseStreet, d.presentVillageTown, d.presentDistrict, d.presentPostal, d.presentCountry ].map(clean).filter(Boolean).join(", ");
}

export function datePlusDays(ddmmyyyy, days) {
    const m = clean(ddmmyyyy).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const n = parseInt(days, 10);
    if (!m || !Number.isFinite(n) || n <= 0) return "";
    const dt = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    dt.setUTCDate(dt.getUTCDate() + n);
    const p2 = x => String(x).padStart(2, "0");
    return `${p2(dt.getUTCDate())}/${p2(dt.getUTCMonth() + 1)}/${dt.getUTCFullYear()}`;
}

export function medicalUndertaking(data = {}, opts = {}) {
    const {companions: companions = [], patient: patient = null, isAttendant: isAttendant = false, now: now = new Date} = opts;
    const name = nameOf(data);
    const passport = clean(data.passportNo);
    const blocks = [];
    const P = (text, o) => blocks.push({
        kind: "paragraph",
        text: text,
        ...o
    });
    const T = (text, o) => blocks.push({
        kind: "text",
        text: text,
        ...o
    });
    const section = (n, t) => blocks.push({
        kind: "text",
        text: `${n}. ${t}`,
        bold: true,
        after: 4
    });
    const fill = v => has(v) ? `**${clean(v)}**` : BLANK;
    blocks.push({
        kind: "heading",
        text: "VISA UNDERTAKING FORM",
        centre: true,
        after: 12
    });
    P("I, the undersigned, hereby submit this undertaking in support of my application for an " + "Indian visa.", {
        justify: false,
        after: 12
    });
    section(1, "Personal Details");
    T(`Full Name: ${fill(name)}`, {
        indent: 16
    });
    T(`Passport Number: ${fill(passport)}`, {
        indent: 16
    });
    T(`Nationality: ${fill(data.nationality)}`, {
        indent: 16
    });
    T(`Date of Birth: ${fill(data.dob)}`, {
        indent: 16
    });
    T(`Address: ${fill(homeAddress(data))}`, {
        indent: 16,
        after: 10
    });
    section(2, "Purpose of Visit");
    let purpose = "MEDICAL TREATMENT";
    if (isAttendant && patient) {
        const pName = nameOf(patient);
        purpose = `accompanying ${has(pName) ? pName : "the patient"} as a medical attendant`;
        if (has(patient.illness)) purpose += ` for ${clean(patient.illness)}`;
        if (has(patient.hospitalName)) purpose += ` at ${clean(patient.hospitalName)}`;
    } else {
        if (has(data.illness)) purpose += ` — ${clean(data.illness)}`;
        if (has(data.hospitalName)) purpose += ` at ${clean(data.hospitalName)}`;
        if (has(data.doctorName)) purpose += `, under ${clean(data.doctorName)}`;
    }
    P(`I wish to visit India for the purpose of ${fill(purpose)}.`, {
        indent: 16,
        after: 10
    });
    section(3, "Duration of Stay");
    const from = clean(data.arrivalDate);
    const days = clean(data.stayDays);
    const to = datePlusDays(from, days);
    P(`I intend to stay in India from ${fill(from)} to ${fill(to)}, for a total period of ` + `${has(days) ? `**${days} days**` : BLANK}.`, {
        indent: 16,
        after: 10
    });
    section(4, "Return to Home Country");
    const home = clean(data.presentCountry) || clean(data.nationality) || "BANGLADESH";
    P("I undertake to return to my home country immediately upon the completion of my visit, and I " + "confirm that I have no intention of overstaying my visa in India. I will return to " + `**${home}**.`, {
        indent: 16,
        after: 10
    });
    const withMe = companionPhrase(companions);
    if (has(withMe)) {
        P(`I will be accompanied by ${withMe}, whose applications are submitted alongside mine.`, {
            indent: 16,
            after: 10
        });
    }
    section(5, "Compliance with Indian Laws");
    P("I hereby pledge to fully comply with the laws, regulations, and customs of India during my " + "stay. I acknowledge that I will not engage in any activity that is prohibited under Indian " + "law and will respect the local customs and culture.", {
        indent: 16,
        after: 10
    });
    section(6, "Acknowledgment and Declaration");
    P("I understand that any violation of Indian laws or regulations may lead to the cancellation " + "of my visa and may affect my future eligibility for a visa to India.", {
        indent: 16,
        after: 7
    });
    P("I declare that all information provided in my visa application is accurate and truthful to " + "the best of my knowledge. I understand that providing false or misleading information may " + "result in the denial of my visa application.", {
        indent: 16,
        after: 7
    });
    P("I undertake to adhere to all the terms and conditions of my visa and will ensure that I " + "leave India before the expiration of my authorized stay.", {
        indent: 16,
        after: 20
    });
    T("Signature of Applicant:", {
        after: 26
    });
    blocks.push({
        kind: "signature"
    });
    T(name, {
        bold: true
    });
    if (passport) T(`Passport No: ${passport}`);
    T(`Date: ${todayStr(now)}`);
    T(`Place: ${missionCity(data)}, Bangladesh`);
    return {
        title: `${name} - Visa Undertaking`,
        doc: {
            margin: {
                top: 56,
                right: 56,
                bottom: 50,
                left: 56
            },
            leading: 1.32
        },
        blocks: blocks
    };
}

export function renderLetter(letter) {
    const doc = new PdfDoc(letter.doc || {});
    for (const b of letter.blocks) {
        if (b.kind === "gap") doc.gap(b.points || 12); else if (b.kind === "signature") doc.signatureLine(250, {
            after: 6
        }); else if (b.kind === "heading") doc.heading(b.text, {
            after: b.after || 0,
            centre: !!b.centre
        }); else if (b.kind === "text") doc.text(b.text, {
            bold: b.bold,
            after: b.after || 0,
            indent: b.indent || 0
        }); else doc.paragraph(b.text, {
            after: b.after || 0,
            indent: b.indent || 0,
            justify: b.justify !== false
        });
    }
    return doc.build();
}

export const LETTER_KINDS = [ {
    id: "cover",
    name: "Medical Cover Letter",
    nameBn: "মেডিকেল কভার লেটার",
    make: medicalCoverLetter,
    needs: [ "passportNo", "hospitalName" ],
    whyBn: "ভিসা অফিসারের নামে চিঠি — কে যাচ্ছেন, কেন যাচ্ছেন, কে সাথে যাচ্ছেন। ইনভাইটেশন লেটার থেকে হাসপাতাল ও রোগের তথ্য নিজেই বসে যায়।"
}, {
    id: "undertaking",
    name: "Visa Undertaking Form",
    nameBn: "ভিসা আন্ডারটেকিং ফর্ম",
    make: medicalUndertaking,
    needs: [ "passportNo" ],
    whyBn: "হাইকমিশনের নিজের ছয় ভাগের ফর্মটাই — শুধু ফাঁকা ঘরগুলো আগে থেকেই ভরা। ফেরার তারিখ যাত্রার তারিখ ও থাকার দিন থেকে হিসাব হয়। নিচের সইটা আপনার।"
} ];
