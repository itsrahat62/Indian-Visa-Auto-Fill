const clean = s => String(s || "").replace(/\s+/g, " ").trim();

const upper = s => clean(s).toUpperCase();

const digits = s => String(s || "").replace(/\D+/g, "");

const lower = s => clean(s).toLowerCase();

const val = s => {
    const v = clean(s);
    return /^(not applicable|n\/?a|nil|none|-|\.)$/i.test(v) ? "" : v;
};

const MONTHS = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    JUN: 6,
    JUL: 7,
    AUG: 8,
    SEP: 9,
    OCT: 10,
    NOV: 11,
    DEC: 12
};

function toDate(raw) {
    const s = upper(raw);
    let m;
    if (m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)) {
        return `${String(+m[1]).padStart(2, "0")}/${String(+m[2]).padStart(2, "0")}/${m[3]}`;
    }
    if (m = s.match(/^(\d{1,2})[-/]([A-Z]{3})[A-Z]*[-/](\d{4})$/)) {
        const mm = MONTHS[m[2]];
        return mm ? `${String(+m[1]).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${m[3]}` : "";
    }
    return "";
}

export function isInvitationLetter(text) {
    const t = String(text || "");
    return /Invitation Letter/i.test(t) && /(File )?Reference No/i.test(t) && /(Details of (the )?Patient|Nodal Officer Details)/i.test(t);
}

const AYUSH_SYSTEMS = /\b(AYUSH|AYURVED(?:A|IC)|PANCHAKARMA|NATUROPATHY|UNANI|SIDDHA|SOWA[\s-]?RIGPA|HOM(?:O)?EOPATH(?:Y|IC)|YOGA(?:\s*(?:&|AND)\s*NATUROPATHY)?)\b/i;

function streamOf({hospital: hospital = {}, treatment: treatment = {}}) {
    const said = [ hospital.name, treatment.department, treatment.diagnosis, treatment.doctor ].filter(Boolean).join(" | ");
    return AYUSH_SYSTEMS.test(said) ? "AYUSH" : "MEDICAL";
}

function cut(T, from, to) {
    const i = T.search(from instanceof RegExp ? from : new RegExp(from));
    if (i < 0) return "";
    const head = T.slice(i).match(from instanceof RegExp ? from : new RegExp(from))[0];
    const start = i + head.length;
    const rest = T.slice(start);
    if (!to) return rest;
    const j = rest.search(to instanceof RegExp ? to : new RegExp(to));
    return j < 0 ? rest : rest.slice(0, j);
}

function grab(src, re, fn = val) {
    const m = String(src).match(re);
    return m ? fn(m[1]) : "";
}

function readPerson(S) {
    const p = {};
    p.surname = grab(S, /Surname\s+(.+?)\s+Given\s*[Nn]ame/, upper);
    p.givenName = grab(S, /Given\s*[Nn]ame\s+(.+?)\s+Gender/, upper);
    p.gender = grab(S, /Gender\s+(MALE|FEMALE|TRANSGENDER)/i, upper);
    p.dob = toDate(grab(S, /Date of Birth\s+([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{4})/, clean));
    p.nationality = grab(S, /Nationality\s+(.+?)\s+Passport No/, upper);
    p.passportNo = grab(S, /Passport No\.?\s+([A-Z]{0,3}\s?\d{5,10})\b/i, v => upper(v).replace(/\s/g, ""));
    p.addressHome = grab(S, /.*Address in Native Country\s+(.+?)\s+Address(?:\s*\/\s*Reference)? in India/);
    p.addressIndia = grab(S, /Address in India\s+(.+?)\s+State\b/);
    p.state = grab(S, /\bState\s+(.+?)\s+City\s*\/\s*District/, upper);
    p.district = grab(S, /City\s*\/\s*District\s+(.+?)\s+Pin Code/, upper);
    p.pin = grab(S, /Pin Code\s+(\d{6})\b/, digits);
    p.phoneHome = grab(S, /Contact Number \(i?n Native\s*Country\)\s+([\d+\s-]{6,20}?)\s+Contact Number/i, digits);
    p.phoneIndia = grab(S, /Contact Number \(i?n India\)\s+([\d+\s-]{6,20}?)\s+(?:Email|Relationship|$)/i, digits);
    p.email = grab(S, /Email Id\s+(\S+@\S+)/i, lower);
    p.relationship = grab(S, /Relationship with the patient\s+(.+?)$/i, upper);
    return p;
}

export function parseInvitation(text) {
    const T = clean(text);
    const H = cut(T, /Hospital Details/i, /Nodal Officer Details/i);
    const N = cut(T, /Nodal Officer Details/i, /Details of the Patient/i);
    const P = cut(T, /Details of the Patient/i, /Details of Treatment/i);
    const R = cut(T, /Details of Treatment/i, /Details of Attendant/i);
    const A = cut(T, /Details of Attendant/i, /\(Authorised Signatory\)/i);
    const out = {
        certNo: grab(T, /File Reference No\.?\s*:?\s*([A-Z0-9]{6,20})\b/i, upper),
        generatedOn: toDate(grab(T, /Generated on\s*:?\s*([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{4})/i, clean)),
        hospital: {
            id: grab(H, /Hospital ID\s+(\S+)\s+Reg\./i, upper),
            regNo: grab(H, /Reg\. No\. of Hospital\s+(\S+)/i, upper),
            name: grab(H, /\bName\s+(.+?)\s+Address\b/i, upper),
            address: grab(H, /\bAddress\s+(.+?)\s+City\s*\/\s*District/i, upper),
            district: grab(H, /City\s*\/\s*District\s+(.+?)\s+State\b/i, upper),
            state: grab(H, /\bState\s+(.+?)\s+Phone no/i, upper),
            phone: grab(H, /Phone no\.?\s+([\d+\s-]{6,20}?)\s+Mobile no/i, digits)
        },
        nodal: {
            name: grab(N, /\bName\s+(.+?)\s+Designation/i, upper),
            designation: grab(N, /Designation\s+(.+?)\s+Contact Number/i, upper),
            phone: grab(N, /Contact Number\s+([\d+\s-]{6,20}?)\s+Email/i, digits),
            email: grab(N, /Email\s+(\S+@\S+)/i, lower)
        },
        patient: readPerson(P),
        treatment: {
            diagnosis: grab(R, /Diagnosis\s*\/\s*Proposed Treatment\s+(.+?)\s+Name of Doctor/i, upper),
            doctor: grab(R, /Name of Doctor\s+(.+?)\s+Department/i, upper),
            department: grab(R, /Department \(Speciality\)\s+(.+?)\s+Cost of Treatment/i, upper),
            costRs: grab(R, /Cost of Treatment \(Rs\.\)\s+([\d,]+)/i, digits),
            treatmentDays: grab(R, /Duration of Treatment in Hospital\s*\(days\)\s*(\d{1,4})/i, clean),
            stayDays: grab(R, /Tentative duration of Stay\s*\(Days\)\s*(\d{1,4})/i, clean)
        },
        attendants: []
    };
    const marks = [ ...A.matchAll(/Sr No\.?\s*(\d+)/gi) ];
    for (let i = 0; i < marks.length; i++) {
        const from = marks[i].index + marks[i][0].length;
        const to = i + 1 < marks.length ? marks[i + 1].index : A.length;
        const person = readPerson(A.slice(from, to));
        person.srNo = Number(marks[i][1]);
        if (person.passportNo || person.surname) out.attendants.push(person);
    }
    out.stream = streamOf(out);
    return out;
}

export function personToProfile(person, inv, {isPatient: isPatient = false} = {}) {
    const d = {};
    const set = (k, v) => {
        if (v) d[k] = v;
    };
    set("surname", person.surname);
    set("givenName", person.givenName);
    set("fullName", [ person.givenName, person.surname ].filter(Boolean).join(" "));
    set("gender", person.gender);
    set("dob", person.dob);
    set("nationality", person.nationality);
    set("passportNo", person.passportNo);
    set("presentMobile", person.phoneHome);
    set("presentEmail", person.email);
    const role = inv.stream === "AYUSH" ? isPatient ? "M3" : "M4" : isPatient ? "M1" : "M2";
    set("medicalRole", role);
    set("visaType", `MEDICAL VISA (${role})`);
    set("medicalCertNo", inv.certNo);
    set("hospitalName", inv.hospital.name);
    set("hospitalAddress", inv.hospital.address);
    set("hospitalCity", inv.hospital.district);
    set("hospitalPhone", inv.hospital.phone);
    set("hospitalEmail", inv.nodal.email);
    set("doctorName", inv.treatment.doctor);
    set("illness", inv.treatment.diagnosis);
    set("stayDays", inv.treatment.stayDays);
    set("stayName", inv.hospital.name);
    set("stayAddress", inv.hospital.address);
    set("stayState", person.state || inv.hospital.state);
    set("stayDistrict", person.district || inv.hospital.district);
    set("stayPhone", inv.hospital.phone);
    set("stayEmail", inv.nodal.email);
    set("refIndiaName", inv.hospital.name);
    set("refIndiaAddress", inv.hospital.address);
    set("refIndiaState", person.state || inv.hospital.state);
    set("refIndiaDistrict", person.district || inv.hospital.district);
    set("refIndiaPhone", inv.hospital.phone);
    if (!isPatient) {
        set("attendantOf", [ inv.patient.givenName, inv.patient.surname ].filter(Boolean).join(" "));
        set("attendantOfPassport", inv.patient.passportNo);
        set("attendantOfDob", inv.patient.dob);
        set("attendantOfNationality", inv.patient.nationality);
        set("attendantRelationship", person.relationship);
    }
    return d;
}

export function invitationToProfiles(inv) {
    const out = [ {
        passportNo: inv.patient.passportNo,
        name: [ inv.patient.givenName, inv.patient.surname ].filter(Boolean).join(" "),
        role: "patient",
        relationship: "",
        data: personToProfile(inv.patient, inv, {
            isPatient: true
        })
    } ];
    for (const a of inv.attendants) {
        out.push({
            passportNo: a.passportNo,
            name: [ a.givenName, a.surname ].filter(Boolean).join(" "),
            role: "attendant",
            relationship: a.relationship,
            data: personToProfile(a, inv)
        });
    }
    return out.filter(p => p.passportNo);
}

export function travelParty(people, person) {
    const patient = people.find(p => p.role === "patient");
    const isAttendant = person.role === "attendant";
    return {
        companions: isAttendant ? [] : people.filter(p => p !== person && p.role === "attendant").map(p => ({
            name: p.name,
            passportNo: p.passportNo
        })),
        isAttendant: isAttendant && !!patient,
        patient: isAttendant && patient ? {
            ...patient.data,
            relationship: person.relationship
        } : null
    };
}
