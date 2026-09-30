import { parseMrz, mrzToProfile } from "./mrz.js";

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

const p2 = n => String(n).padStart(2, "0");

export function toDDMMYYYY(raw) {
    if (!raw) return "";
    const s = String(raw).trim().toUpperCase();
    let m;
    if (m = s.match(/^(\d{1,2})[-/. ]([A-Z]{3})[A-Z]*[-/. ](\d{4})$/)) {
        const mm = MONTHS[m[2]];
        return mm ? `${p2(+m[1])}/${p2(mm)}/${m[3]}` : "";
    }
    if (m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)) return `${p2(+m[3])}/${p2(+m[2])}/${m[1]}`;
    if (m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)) return `${p2(+m[1])}/${p2(+m[2])}/${m[3]}`;
    return "";
}

const clean = s => String(s || "").replace(/\s+/g, " ").trim();

const upper = s => clean(s).toUpperCase();

const digits = s => String(s || "").replace(/\D+/g, "");

function grab(text, re, fn = clean) {
    const m = text.match(re);
    if (!m) return "";
    const v = fn(m[1]);
    return v && v !== "-" && !/^N\/?A$/i.test(v) ? v : "";
}

export function detectDocType(text) {
    const t = String(text || "");
    if (/Surname\s*\(As in Passport\)|Application\s*(Id|Detail)|Temporary Application ID|Indian Visa Application/i.test(t)) {
        return "application";
    }
    if (/^P[<A-Z]/m.test(t.replace(/\s/g, "")) || /Passport\s*No|MACHINE READABLE|Given Name/i.test(t)) {
        return "passport";
    }
    return "unknown";
}

const LABELS = [ "Surname \\(As in Passport\\)", "Given Name/?s? \\(As in Passport\\)", "Previous/other Name if any", "Previous Name", "Citizenship ?/ ?National ID No", "Educational Qualification", "Visible identification marks", "Nationality by Birth/ ?Naturalization", "Current Nationality", "Place of Birth Town/City", "Country of Birth", "Date of Birth", "Marital Status", "Religion", "Gender", "Passport No\\.?", "Place of Issue", "Date of Issue", "Date of Expiry", "Present Address", "Permanent Address", "Postal ?/ ?Zip Code", "Mobile ?/ ?Cell No\\.?", "Phone No\\.?", "Phone Number", "Email", "State ?/ ?Province", "District", "State", "Village/Town/City", "House No\\./Street", "Father'?s Name", "Mother'?s Name", "Spouse Name", "Spouse'?s Name", "Present Occupation", "Designation ?/? ?Rank", "Designation", "Employer name ?/ ?business", "Employer Name", "Employer Address", "Past Occupation,? if any", "Past occupation", "Type Of Visa Required", "Type of Visa", "No of Entries", "No\\. of Entries", "Period of Visa", "Expected Date of Journey", "Port Of Arrival", "Port of Exit", "Places to be [Vv]isited", "Visa Number", "Visa Issued Place", "Have You Ever visited India", "Address where [Yy]ou stayed in India", "Cities in India Visited", "Countries visited in", "Hospital Name", "Doctor Name", "Medical Certificate No\\.?", "Application Id", "Web Registration Date", "Required Detail" ].join("|");

const END = `(?=\\s{2,}|\\n|\\s+(?:${LABELS})\\b|$)`;

function parseApplicationPdf(text) {
    const T = text.replace(/\r/g, "");
    const d = {};
    d.surname = grab(T, new RegExp(`Surname\\s*(?:\\(As in Passport\\))?\\s*[:\\n]?\\s*([A-Z][A-Z\\s'.-]{0,40}?)${END}`, "i"), upper);
    d.givenName = grab(T, new RegExp(`Given Name[s]?\\s*(?:\\(As in Passport\\))?\\s*[:\\n]?\\s*([A-Z][A-Z\\s'.-]{0,60}?)${END}`, "i"), upper);
    d.previousName = grab(T, /Previous Name\s*[:\n]?\s*([A-Z][A-Z\s'.-]{1,60})/i, upper);
    d.gender = grab(T, /\bGender\s*[:\n]?\s*(MALE|FEMALE|TRANSGENDER|M|F)\b/i, v => ({
        M: "MALE",
        F: "FEMALE"
    }[upper(v)] || upper(v)));
    d.dob = toDDMMYYYY(grab(T, /Date of Birth\s*(?:\([^)]*\))?\s*[:\n]?\s*([\d]{1,2}[-/.][A-Za-z0-9]{2,3}[-/.][\d]{2,4})/i));
    d.townOfBirth = grab(T, new RegExp(`(?:Town\\s*\\/?\\s*City of Birth|Place of Birth)\\s*[:\\n]?\\s*([A-Z][A-Z\\s.-]{1,40}?)${END}`, "i"), upper);
    d.countryOfBirth = grab(T, new RegExp(`Country of Birth\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{2,40}?)${END}`, "i"), upper);
    d.citizenshipNo = grab(T, /(?:Citizenship\s*\/?\s*National\s*Id\s*No\.?|National\s*ID(?:\s*No\.?)?|Personal\s*No\.?)\s*[:\n]?\s*([\d\s-]{10,25})/i, digits);
    d.religion = grab(T, new RegExp(`\\bReligion\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{2,25}?)${END}`, "i"), upper);
    d.education = grab(T, new RegExp(`Educational Qualification\\s*[:\\n]?\\s*([A-Z][A-Z\\s/.]{2,40}?)${END}`, "i"), upper);
    d.nationality = grab(T, new RegExp(`\\bNationality\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{2,40}?)${END}`, "i"), upper);
    d.identificationMarks = grab(T, new RegExp(`Visible identification marks\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{1,40}?)${END}`, "i"), upper);
    d.maritalStatus = grab(T, new RegExp(`Marital Status\\s*[:\\n]?\\s*([A-Z][A-Z\\s/]{2,25}?)${END}`, "i"), upper);
    d.passportNo = grab(T, /Passport\s*(?:No\.?|Number)\s*[:\n]?\s*([A-Z]{0,3}\s?[0-9][0-9A-Z-]{5,11})\b/i, v => upper(v).replace(/[\s-]/g, ""));
    d.passportPlaceOfIssue = grab(T, new RegExp(`Place of Issue\\s*[:\\n]?\\s*([A-Z][A-Z\\s.-]{2,40}?)${END}`, "i"), upper);
    d.passportIssueDate = toDDMMYYYY(grab(T, /Date of Issue\s*(?:\([^)]*\))?\s*[:\n]?\s*([\d]{1,2}[-/.][A-Za-z0-9]{2,3}[-/.][\d]{2,4})/i));
    d.passportExpiryDate = toDDMMYYYY(grab(T, /Date of Expiry\s*(?:\([^)]*\))?\s*[:\n]?\s*([\d]{1,2}[-/.][A-Za-z0-9]{2,3}[-/.][\d]{2,4})/i));
    d.presentEmail = grab(T, /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/, v => clean(v).toLowerCase());
    d.presentMobile = grab(T, /Mobile\s*\/?\s*(?:Cell)?\s*No\.?\s*[:\n]?\s*(\+?[\d\s-]{7,18})/i, digits);
    d.presentPhone = grab(T, /Phone\s*No\.?\s*[:\n]?\s*(\+?[\d\s-]{6,18})/i, digits);
    d.presentPostal = grab(T, /(?:Postal\s*\/?\s*Zip Code|Postal Code|Zip Code)\s*[:\n]?\s*(\d{4,8})/i, digits);
    d.presentHouseStreet = grab(T, new RegExp(`Present Address\\s*[:\\n]?\\s*(.{4,80}?)${END}`, "is"), upper);
    d.presentDistrict = grab(T, new RegExp(`\\bDistrict\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{2,25}?)${END}`, "i"), upper);
    d.presentState = grab(T, new RegExp(`(?:State\\s*\\/?\\s*Province|\\bState\\b|\\bDivision\\b)\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{2,25}?)${END}`, "i"), upper);
    d.fatherName = grab(T, new RegExp(`Father'?s?\\s*Name\\s*[:\\n]?\\s*([A-Z][A-Z\\s.'-]{2,50}?)${END}`, "i"), upper);
    d.fatherPlaceOfBirth = grab(T, /Father[\s\S]{0,120}?Place of Birth\s*[:\n]?\s*([A-Z][A-Z\s.-]{2,35})/i, upper);
    d.motherName = grab(T, new RegExp(`Mother'?s?\\s*Name\\s*[:\\n]?\\s*([A-Z][A-Z\\s.'-]{2,50}?)${END}`, "i"), upper);
    d.motherPlaceOfBirth = grab(T, /Mother[\s\S]{0,120}?Place of Birth\s*[:\n]?\s*([A-Z][A-Z\s.-]{2,35})/i, upper);
    d.spouseName = grab(T, new RegExp(`Spouse'?s?\\s*Name\\s*[:\\n]?\\s*([A-Z][A-Z\\s.'-]{2,50}?)${END}`, "i"), upper);
    d.occupation = grab(T, new RegExp(`Present Occupation\\s*[:\\n]?\\s*([A-Z][A-Z\\s/&.-]{2,40}?)${END}`, "i"), upper);
    d.designation = grab(T, new RegExp(`Designation\\s*\\/?\\s*Rank\\s*[:\\n]?\\s*([A-Z][A-Z\\s/&.-]{2,40}?)${END}`, "i"), upper);
    d.employerName = grab(T, new RegExp(`Employer\\s*(?:name\\s*\\/?\\s*business|Name)\\s*[:\\n]?\\s*(.{2,60}?)${END}`, "i"), upper);
    d.employerAddress = grab(T, new RegExp(`Employer Address\\s*[:\\n]?\\s*(.{4,90}?)${END}`, "is"), upper);
    d.pastOccupation = grab(T, new RegExp(`Past occupation[^:\\n]*[:\\n]?\\s*([A-Z][A-Z\\s/&.-]{2,40}?)${END}`, "i"), upper);
    d.visaType = grab(T, new RegExp(`Type of Visa\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{2,30}?)${END}`, "i"), upper);
    d.noOfEntries = grab(T, /No\.?\s*of Entries\s*[:\n]?\s*([A-Z]+)/i, upper);
    d.durationDays = grab(T, /Period of Visa[^\d]{0,20}(\d{1,3})/i, clean);
    d.portOfArrival = grab(T, new RegExp(`Port Of Arrival[^\\n]*?\\b(?:BY\\s+(?:AIR|ROAD|RAIL|SEA)\\s*\\/?\\s*)?([A-Z][A-Z\\s]{2,25}?)${END}`, "i"), upper);
    d.placesToVisit = grab(T, new RegExp(`Places (?:to be|likely to be) [Vv]isited\\s*[:\\n]?\\s*([A-Z][A-Z\\s,]{2,60}?)${END}`, "i"), upper);
    const visited = grab(T, /Have You Ever visited India\s*\??\s*[:\n]?\s*(YES|NO)/i, upper);
    if (visited) d.visitedIndia = visited === "YES" ? "Yes" : "No";
    if (d.visitedIndia === "Yes") {
        d.prevAddressIndia = grab(T, new RegExp(`Address where [Yy]ou stayed in\\s*India\\s*[:\\n]?\\s*(.{4,90}?)${END}`, "is"), upper);
        d.prevCitiesVisited = grab(T, new RegExp(`Cities in India Visited\\s*[:\\n]?\\s*([A-Z][A-Z\\s,]{2,60}?)${END}`, "i"), upper);
        d.prevVisaNo = grab(T, /Visa Number\s*[:\n]?\s*([A-Z0-9]{4,20})/i, upper);
        d.prevVisaPlaceOfIssue = grab(T, new RegExp(`Visa Issued Place\\s*[:\\n]?\\s*([A-Z][A-Z\\s]{2,25}?)${END}`, "i"), upper);
        d.prevVisaIssueDate = toDDMMYYYY(grab(T, /Visa Issued Place[\s\S]{0,60}?Date of Issue\s*[:\n]?\s*([\d]{1,2}[-/.][A-Za-z0-9]{2,3}[-/.][\d]{2,4})/i));
    }
    d.countriesVisited10y = grab(T, new RegExp(`Countries visited in (?:the )?last 10 years\\s*[:\\n]?\\s*([A-Z][A-Z,\\s]{2,80}?)${END}`, "i"), upper);
    if (/MEDICAL VISA/i.test(T)) {
        d.hospitalName = grab(T, new RegExp(`Hospital Name\\s*[:\\n]?\\s*(.{2,60}?)${END}`, "i"), upper);
        d.hospitalAddress = grab(T, new RegExp(`Hospital Name[\\s\\S]{0,80}?Address\\s*[:\\n]?\\s*(.{4,90}?)${END}`, "is"), upper);
        d.doctorName = grab(T, new RegExp(`Doctor Name\\s*[:\\n]?\\s*(.{2,50}?)${END}`, "i"), upper);
        d.hospitalPhone = grab(T, /Doctor Name[\s\S]{0,60}?Phone\s*\/?\s*Fax\s*[:\n]?\s*([\d\s-]{6,18})/i, digits);
        d.medicalCertNo = grab(T, /Medical Certificate No\.?\s*[:\n]?\s*([A-Z0-9-]{2,25})/i, upper);
        d.illness = grab(T, new RegExp(`(?:Nature of illness|Details)\\s*[:\\n]?\\s*([A-Z][A-Z\\s,.-]{2,60}?)${END}`, "i"), upper);
    }
    d.refIndiaName = grab(T, new RegExp(`Reference (?:Name )?in India\\s*[:\\n]?\\s*(.{2,50}?)${END}`, "i"), upper);
    d.refIndiaAddress = grab(T, new RegExp(`Reference (?:Name )?in India[\\s\\S]{0,80}?Address\\s*[:\\n]?\\s*(.{4,90}?)${END}`, "is"), upper);
    d.refHomeName = grab(T, new RegExp(`Reference (?:Name )?in Bangladesh\\s*[:\\n]?\\s*(.{2,50}?)${END}`, "i"), upper);
    d.refHomeAddress = grab(T, new RegExp(`Reference (?:Name )?in Bangladesh[\\s\\S]{0,80}?Address\\s*[:\\n]?\\s*(.{4,90}?)${END}`, "is"), upper);
    return d;
}

const WEB_SECTIONS = [ [ "personal", "A. Personal Particulars", "B. Passport Details" ], [ "passport", "B. Passport Details", "C. Applicant's Contact Details" ], [ "contact", "C. Applicant's Contact Details", "D. Family Details" ], [ "family", "D. Family Details", "E. Details of Visa Sought" ], [ "visa", "E. Details of Visa Sought", "F. Previous Visit Details" ], [ "previous", "F. Previous Visit Details", "G. Profession" ], [ "work", "G. Profession", "H. Address of Place of Stay" ], [ "stay", "H. Address of Place of Stay", "I. Details of Two Reference" ], [ "reference", "I. Details of Two Reference", "I. DOCUMENTS UPLOADED" ] ];

const INDIAN_STATES = [ "ANDAMAN AND NICOBAR ISLANDS", "ARUNACHAL PRADESH", "HIMACHAL PRADESH", "JAMMU AND KASHMIR", "DADRA AND NAGAR HAVELI", "MADHYA PRADESH", "ANDHRA PRADESH", "UTTAR PRADESH", "WEST BENGAL", "TAMIL NADU", "MAHARASHTRA", "CHHATTISGARH", "UTTARAKHAND", "PUDUCHERRY", "LAKSHADWEEP", "CHANDIGARH", "TELANGANA", "KARNATAKA", "RAJASTHAN", "MEGHALAYA", "JHARKHAND", "NAGALAND", "MANIPUR", "MIZORAM", "TRIPURA", "GUJARAT", "HARYANA", "DELHI", "PUNJAB", "KERALA", "ODISHA", "ASSAM", "BIHAR", "SIKKIM", "LADAKH", "GOA" ].sort((a, b) => b.length - a.length);

export function isWebFile(text) {
    const t = String(text || "");
    return /Web Registration Date/i.test(t) && /HIGH COMMISSION OF INDIA/i.test(t) && /Visa Application Form/i.test(t);
}

function cut(T, from, to) {
    const a = T.indexOf(from);
    if (a < 0) return "";
    const start = a + from.length;
    const b = to ? T.indexOf(to, start) : -1;
    return b < 0 ? T.slice(start) : T.slice(start, b);
}

const val = s => {
    const v = upper(s);
    return /^(NOT APPLICABLE|N\/?A|NIL|NONE|-|\.)$/i.test(v) ? "" : v;
};

function splitTrailingPhone(s) {
    const m = clean(s).match(/^(.*?)[\s,]*(\+?\d[\d\s-]{5,18})$/);
    return m && m[1] ? [ val(m[1]), digits(m[2]) ] : [ val(s), "" ];
}

function splitBySharedPrefix(nameLine, addressLine) {
    const word = s => clean(s).replace(/[,.]/g, "").toUpperCase();
    const a = clean(nameLine).split(" ").filter(Boolean);
    const b = word(addressLine).split(" ").filter(Boolean);
    let n = 0;
    while (n < a.length && n < b.length && word(a[n]) === b[n]) n++;
    if (n < 2 || n >= a.length) return null;
    return [ val(a.slice(0, n).join(" ")), val(a.slice(n).join(" ")) ];
}

function splitAtState(line) {
    const L = upper(line);
    for (const st of INDIAN_STATES) {
        const i = L.indexOf(st);
        if (i < 0) continue;
        return {
            before: val(L.slice(0, i)),
            state: st,
            after: val(L.slice(i + st.length))
        };
    }
    return null;
}

function parseWebFile(text) {
    const T = clean(text);
    const d = {};
    const notes = [];
    const S = {};
    for (const [key, from, to] of WEB_SECTIONS) S[key] = cut(T, from, to);
    const pick = (src, re, fn = val) => grab(src, re, fn);
    const date = (src, re) => toDDMMYYYY(grab(src, re, clean));
    d.applicationId = pick(T, /Application Id\s*:?\s*([A-Z0-9]{8,16})\b/, upper);
    const A = S.personal;
    d.surname = pick(A, /Surname \(As in Passport\)\s+(.+?)\s+Given Name/);
    d.givenName = pick(A, /Given Name \(As in Passport\)\s+(.+?)\s+Previous\/other Name/);
    d.previousName = pick(A, /Previous\/other Name if any\s+(.+?)\s+Gender/);
    d.gender = pick(A, /Gender\s+(MALE|FEMALE|TRANSGENDER)/);
    d.maritalStatus = pick(A, /Marital Status\s+(.+?)\s+Date of Birth/);
    d.dob = date(A, /Date of Birth\s+(\d{1,2}-[A-Z]{3}-\d{4})/);
    d.religion = pick(A, /Religion\s+(.+?)\s+Place of Birth/);
    d.townOfBirth = pick(A, /Place of Birth Town\/City\s+(.+?)\s+Country of Birth/);
    d.countryOfBirth = pick(A, /Country of Birth\s+(.+?)\s+Citizenship/);
    d.citizenshipNo = pick(A, /Citizenship\s*\/\s*National ID No\s+([\d\s-]{6,25}?)\s+Educational/, digits);
    d.education = pick(A, /Educational Qualification\s+(.+?)\s+Visible identification/);
    d.identificationMarks = pick(A, /Visible identification marks\s+(.+?)\s+Current Nationality/);
    d.nationality = pick(A, /Current Nationality\s+(.+?)\s+Nationality by Birth/);
    d.nationalityBy = pick(A, /Nationality by Birth\/\s*Naturalization\s+(.+?)\s+Any Other/);
    d.previousNationality = pick(A, /Any Other Previous\/Past Nationality\s+(.+?)$/);
    const B = S.passport;
    d.passportNo = pick(B, /Passport No\.?\s+([A-Z]{0,3}\s?\d{5,10})\b/, v => upper(v).replace(/\s/g, ""));
    d.passportIssueDate = date(B, /Date of Issue[^)]*\)\s+(\d{1,2}-[A-Z]{3}-\d{4})/);
    d.passportPlaceOfIssue = pick(B, /Place of Issue\s+(.+?)\s+Date of Expiry/);
    d.passportExpiryDate = date(B, /Date of Expiry[^)]*\)\s+(\d{1,2}-[A-Z]{3}-\d{4})/);
    d.otherPassport = /\(if yes ,please fill in the following\)\s*NO\b/i.test(B) ? "No" : "";
    const C = S.contact;
    d.presentHouseStreet = pick(C, /^\s*Present\s+(.+?)\s+Phone No\b/);
    d.presentPhone = pick(C, /Phone No\s+(\+?[\d\s-]{6,18}?)\s+Address\b/, digits);
    d.presentVillageTown = pick(C, /Phone No\s+\+?[\d\s-]{6,18}?\s+Address\s+(.+?)\s+Mobile\s*\/\s*Cell No/);
    d.presentMobile = pick(C, /Mobile\s*\/\s*Cell No\s+(\+?[\d\s-]{7,20}?)\s/, digits);
    const cityLine = pick(C, /Mobile\s*\/\s*Cell No\s+\+?[\d\s-]{7,20}?\s+(.+?)\s+Email address/);
    if (cityLine) {
        const m = cityLine.match(/^(.*?)[\s,]*(\d{4})$/);
        d.presentPostal = m ? m[2] : "";
        const place = (m ? m[1] : cityLine).split(",").map(clean).filter(Boolean);
        d.presentDistrict = val(place[0] || "");
        d.presentCountry = val(place[1] || "");
    }
    d.presentEmail = pick(C, /Email address\s+(\S+@\S+)/, v => clean(v).toLowerCase());
    const perm = cut(C, "Permanent", "");
    if (perm) {
        d.permHouseStreet = pick(perm, /^\s*(.+?)\s+Address\b/);
        const words = clean(pick(perm, /\sAddress\s+(.+?)$/)).split(" ").filter(Boolean);
        d.permDistrict = val(words.slice(-1)[0] || "");
        d.permVillageTown = val(words.slice(0, -1).join(" ")) || d.permDistrict;
    }
    const D = S.family;
    const relative = who => {
        const m = D.match(new RegExp(`${who}\\s+(.+?)\\s+([A-Z]{3,})\\s+\\2\\s+(.+?)\\s+(?=Father's|Mother's|Spouse|Were your|$)`));
        if (!m) return null;
        const place = clean(m[3]).split(" ");
        return {
            name: val(m[1]),
            nat: val(m[2]),
            town: val(place.slice(0, -1).join(" ")),
            country: val(place.slice(-1)[0] || "")
        };
    };
    for (const [who, key] of [ [ "Father's", "father" ], [ "Mother's", "mother" ], [ "Spouse", "spouse" ] ]) {
        const r = relative(who);
        if (!r) continue;
        d[`${key}Name`] = r.name;
        d[`${key}Nationality`] = r.nat;
        d[`${key}PrevNationality`] = r.nat;
        d[`${key}PlaceOfBirth`] = r.town;
        d[`${key}CountryOfBirth`] = r.country;
    }
    const pak = pick(D, /belong to Pakistan held area\s*:?\s*(YES|NO)\b/);
    if (pak) d.grandparentsPak = pak === "YES" ? "Yes" : "No";
    const E = S.visa;
    d.visaType = pick(E, /Type Of Visa Required\s+(.+?)\s+No of Entries/);
    d.noOfEntries = pick(E, /No of Entries\s+(.+?)\s+Period of Visa/);
    d.durationDays = pick(E, /Period of Visa\s*\(\s*Month\s*\)\s*(\d{1,3})/, clean);
    d.arrivalDate = date(E, /Expected Date of Journey\s+(\d{1,2}-[A-Z]{3}-\d{4})/);
    d.portOfArrival = pick(E, /Port Of Arrival\s+(.+?)\s+Port of Exit/);
    d.portOfExit = pick(E, /Port of Exit\s+(.+?)\s+(?:Required Detail|$)/);
    d.medicalCertNo = pick(E, /Medical Certificate No\.?\s+([A-Z0-9-]{4,25})\b/);
    d.hospitalName = pick(E, /(?<!Residence )Hospital Name\s+(.+?)\s+Address\s/);
    d.hospitalAddress = pick(E, /(?<!Residence )Hospital Name\s+.+?\s+Address\s+(.+?)\s+Doctor Name/);
    d.doctorName = pick(E, /(?<!Residence )Doctor Name\s+(.+?)\s+Phone\/Fax/);
    d.hospitalPhone = pick(E, /(?<!Residence )Doctor Name\s+.+?\s+Phone\/Fax\s+([\d+\s-]{6,20}?)\s+Email ID/, digits);
    d.hospitalEmail = pick(E, /(?<!Residence )Email ID\s+(\S+@\S+)/, v => clean(v).toLowerCase());
    d.homeHospitalName = pick(E, /Residence Hospital Name\s+(.+?)\s+Residence Address/);
    d.homeHospitalAddress = pick(E, /Residence Address\s+(.+?)\s+Residence Doctor Name/);
    d.homeDoctorName = pick(E, /Residence Doctor Name\s+(.+?)\s+Residence Phone/);
    d.homeHospitalPhone = pick(E, /Residence Phone\/Fax\s+([\d+\s-]{6,20}?)\s+Residence Email/, digits);
    d.homeHospitalEmail = pick(E, /Residence Email\s+(\S+@\S+)/, v => clean(v).toLowerCase());
    d.illness = pick(E, /Nature of Illness\s+(.+?)\s+Purpose of Visit/);
    d.visaPurpose = pick(E, /Purpose of Visit\s*:?\s*(.+?)$/);
    const Fs = S.previous;
    const been = pick(Fs, /Have You Ever visited India\s*\??\s*(YES|NO)\b/);
    if (been) d.hasPreviousVisa = been === "YES" ? "Yes" : "No";
    const refused = pick(Fs, /deported from India\s*\??\s*(YES|NO)\b/);
    if (refused) d.visaRefused = refused === "YES" ? "Yes" : "No";
    if (d.hasPreviousVisa === "Yes") {
        d.prevVisitAddress = pick(Fs, /Address where You stayed in India\s+(.+?)\s+Cities in India Visited/);
        d.oldVisaNo = pick(Fs, /Visa Number\s+([A-Z0-9]{4,20})\b/);
        d.oldVisaIssuePlace = pick(Fs, /Visa Issued Place\s+(.+?)\s+Date of Issue/);
        d.oldVisaIssueDate = date(Fs, /Visa Issued Place\s+.+?\s+Date of Issue\s+(\d{1,2}-[A-Z]{3}-\d{4})/);
    }
    d.countriesVisited = pick(Fs, /Countries visited in last 10 years\s+(.+?)\s+Have you been refused/);
    const G = S.work;
    d.occupationDetailsOf = pick(G, /Details\s*:?\s*of\s+([A-Za-z]+)/, v => clean(v).toLowerCase());
    d.occupation = pick(G, /Present Occupation\s+(.+?)\s+Designation/);
    d.designation = pick(G, /Designation\/Rank\s+(.+?)\s+Employer name/);
    d.employerName = pick(G, /Employer name\/business\s+(.+?)\s+Employer Address/);
    const empCell = pick(G, /Employer Address\s+Phone Number\s+(.+?)\s+Past occupation/);
    if (empCell) [d.employerAddress, d.employerPhone] = splitTrailingPhone(empCell);
    d.pastOccupation = pick(G, /Past occupation if any\s+(.+?)\s+Are\/have you worked/);
    const forces = pick(G, /Para Military forces\s*\??\s*(YES|NO)\b/);
    if (forces) d.militaryService = forces === "YES" ? "Yes" : "No";
    const R = S.reference;
    const phones = clean(pick(R, /Phone Number\s+(.+?)$/, clean)).match(/\+?\d[\d-]{5,18}/g) || [];
    d.refIndiaPhone = digits(phones[0] || "");
    d.refHomePhone = digits(phones[1] || "");
    const addrLine = pick(R, /\bAddress\s+(.+?)\s+Phone Number/, clean);
    let indiaAddr = "";
    if (addrLine) {
        const byPin = clean(addrLine).match(/^(.*?\b\d{6})\s+(.*)$/);
        const rest = byPin ? clean(byPin[2]) : "";
        indiaAddr = byPin ? val(byPin[1]) : "";
        const st = rest ? splitAtState(rest) : null;
        if (st) {
            const words = st.before.split(" ").filter(Boolean);
            d.refIndiaAddress = indiaAddr;
            d.refIndiaDistrict = val(words.slice(-1)[0] || "");
            d.refIndiaState = st.state;
            d.refHomeAddress = val(words.slice(0, -1).join(" "));
            d.refHomeAddress2 = st.after;
        } else {
            notes.push("দুই রেফারেন্সের ঠিকানা একসাথে ছাপা — আলাদা করা গেল না, হাতে বসান।");
        }
    }
    const nameLine = pick(R, /\bName\s+(.+?)\s+Address\b/, clean);
    const split = nameLine && indiaAddr ? splitBySharedPrefix(nameLine, indiaAddr) : null;
    if (split) [d.refIndiaName, d.refHomeName] = split; else if (nameLine) notes.push("দুই রেফারেন্সের নাম একসাথে ছাপা — আলাদা করা গেল না, হাতে বসান।");
    const H = S.stay;
    const row = pick(H, /Phone No\s+1\s+(.+?)\s+2\s*\.\s*,/, clean);
    if (row) {
        let body = clean(row);
        const mail = body.match(/(\S+@\S+)\s*$/);
        if (mail) {
            d.stayEmail = clean(mail[1]).toLowerCase();
            body = clean(body.slice(0, mail.index));
        }
        const tel = body.match(/(\+?\d[\d\s-]{5,18})[\s,]*$/);
        if (tel) {
            d.stayPhone = digits(tel[1]);
            body = clean(body.slice(0, tel.index));
        }
        const st = splitAtState(body);
        if (st) {
            d.stayState = st.state;
            body = st.before;
            const words = body.split(" ");
            d.stayDistrict = val(words.slice(-1)[0] || "");
            body = clean(words.slice(0, -1).join(" "));
        }
        const known = [ d.refIndiaName, d.hospitalName ].filter(Boolean);
        const lead = known.find(k => upper(body).startsWith(upper(k)));
        if (lead) {
            d.stayName = val(lead);
            d.stayAddress = val(body.slice(lead.length));
        } else {
            d.stayAddress = val(body);
            if (body) notes.push("হোটেল/থাকার জায়গার নাম আর ঠিকানা একসাথে ছাপা — নামটা হাতে আলাদা করুন।");
        }
    }
    return {
        d: d,
        notes: notes
    };
}

function parsePassportPage(text) {
    const T = text.replace(/\r/g, "");
    const d = {};
    d.passportPlaceOfIssue = grab(T, new RegExp(`(?:Authority|Issuing Authority|Place of Issue)\\s*[:\\n]?\\s*([A-Z][A-Z\\s,.-]{2,35}?)${END}`, "i"), upper);
    d.passportIssueDate = toDDMMYYYY(grab(T, /(?:Date of Issue|Issue Date)\s*[:\n]?\s*([\d]{1,2}\s*[-/. ]\s*[A-Za-z0-9]{2,3}\s*[-/. ]\s*[\d]{2,4})/i));
    d.passportExpiryDate = toDDMMYYYY(grab(T, /(?:Date of Expiry|Expiry Date)\s*[:\n]?\s*([\d]{1,2}\s*[-/. ]\s*[A-Za-z0-9]{2,3}\s*[-/. ]\s*[\d]{2,4})/i));
    d.townOfBirth = grab(T, new RegExp(`(?:Place of Birth|Birth Place)\\s*[:\\n]?\\s*([A-Z][A-Z\\s.-]{2,35}?)${END}`, "i"), upper);
    d.fatherName = grab(T, new RegExp(`(?:Father'?s? Name|Name of Father)\\s*[:\\n]?\\s*([A-Z][A-Z\\s.'-]{2,45}?)${END}`, "i"), upper);
    d.motherName = grab(T, new RegExp(`(?:Mother'?s? Name|Name of Mother)\\s*[:\\n]?\\s*([A-Z][A-Z\\s.'-]{2,45}?)${END}`, "i"), upper);
    d.spouseName = grab(T, new RegExp(`(?:Spouse'?s? Name|Name of Spouse)\\s*[:\\n]?\\s*([A-Z][A-Z\\s.'-]{2,45}?)${END}`, "i"), upper);
    d.citizenshipNo = grab(T, /(?:Personal No\.?|National ID|NID)\s*[:\n]?\s*([\d\s-]{10,20})/i, digits);
    d.presentHouseStreet = grab(T, new RegExp(`(?:Present Address|Address)\\s*[:\\n]?\\s*(.{6,80}?)${END}`, "i"), upper);
    d.surname = grab(T, new RegExp(`Surname\\s*[:\\n]?\\s*([A-Z][A-Z\\s'-]{1,40}?)${END}`, "i"), upper);
    d.givenName = grab(T, new RegExp(`Given Name[s]?\\s*[:\\n]?\\s*([A-Z][A-Z\\s'-]{1,50}?)${END}`, "i"), upper);
    return d;
}

export function extractProfile(text) {
    const mrz = parseMrz(text);
    const web = isWebFile(text);
    const type = web ? "webfile" : detectDocType(text);
    let data = {};
    let notes = [];
    if (web) ({d: data, notes: notes} = parseWebFile(text)); else if (type === "application") data = parseApplicationPdf(text); else data = parsePassportPage(text);
    if (mrz) {
        const fromMrz = mrzToProfile(mrz);
        for (const [k, v] of Object.entries(fromMrz)) {
            const suspect = mrz.warnings.includes(k);
            if (!suspect || !data[k]) data[k] = v;
        }
    }
    for (const k of Object.keys(data)) if (!data[k]) delete data[k];
    return {
        data: data,
        source: type,
        mrz: mrz,
        notes: notes,
        filled: Object.keys(data).length,
        suggestedName: [ data.givenName, data.surname ].filter(Boolean).join(" ") || "Imported Profile"
    };
}
