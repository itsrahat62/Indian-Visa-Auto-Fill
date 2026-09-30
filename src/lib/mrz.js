const FILLER = /</g;

const WEIGHTS = [ 7, 3, 1 ];

const CHARVAL = c => {
    if (c === "<") return 0;
    if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
    if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
    return -1;
};

export function checkDigit(str) {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        const v = CHARVAL(str[i]);
        if (v < 0) return -1;
        sum += v * WEIGHTS[i % 3];
    }
    return sum % 10;
}

const NUM_FIX = {
    O: "0",
    Q: "0",
    D: "0",
    I: "1",
    L: "1",
    Z: "2",
    S: "5",
    B: "8",
    G: "6",
    T: "7"
};

const ALPHA_FIX = {
    0: "O",
    1: "I",
    2: "Z",
    5: "S",
    8: "B",
    6: "G"
};

const toNum = s => s.replace(/[A-Z]/g, c => NUM_FIX[c] ?? c);

const toAlpha = s => s.replace(/[0-9]/g, c => ALPHA_FIX[c] ?? c);

const isCandidate = l => l.length >= 36 && l.length <= 60 && /^[A-Z0-9<]+$/.test(l);

const looksLine1 = l => l[0] === "P" && l.includes("<<") && (l.match(/</g) || []).length >= 4;

const looksLine2 = l => /^[A-Z0-9<]{9}[0-9<][A-Z<]{3}[0-9]{6}[0-9<][MF<]/.test(l);

export function findMrzLines(text) {
    const lines = String(text || "").toUpperCase().split(/\r?\n/).map(l => l.replace(/\s+/g, "")).filter(isCandidate);
    for (let i = 0; i < lines.length - 1; i++) {
        if (looksLine1(lines[i]) && looksLine2(lines[i + 1])) {
            return [ pad44(lines[i]), pad44(lines[i + 1]) ];
        }
    }
    for (let i = 0; i < lines.length - 1; i++) {
        const a = lines[i];
        if (looksLine2(lines[i + 1]) && (a[0] === "P" || (a.match(/</g) || []).length >= 3)) {
            return [ pad44(a), pad44(lines[i + 1]) ];
        }
    }
    return null;
}

const pad44 = l => l.length >= 44 ? l.slice(0, 44) : l.padEnd(44, "<");

function yymmddToParts(s) {
    if (!/^\d{6}$/.test(s)) return null;
    const yy = +s.slice(0, 2);
    const mm = +s.slice(2, 4);
    const dd = +s.slice(4, 6);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return {
        yy: yy,
        mm: mm,
        dd: dd
    };
}

const p2 = n => String(n).padStart(2, "0");

export function parseMrz(text) {
    const lines = findMrzLines(text);
    if (!lines) return null;
    const [l1, l2] = lines;
    const warnings = [];
    const issuer3 = toAlpha(l1.slice(2, 5)).replace(FILLER, "");
    const namePart = l1.slice(5);
    const [rawSur, rawGiven = ""] = namePart.split("<<");
    const surname = rawSur.replace(FILLER, " ").trim();
    const givenName = rawGiven.replace(FILLER, " ").trim();
    let passportNo = l2.slice(0, 9);
    const ppCheck = l2[9];
    const nationality3 = toAlpha(l2.slice(10, 13)).replace(FILLER, "");
    let dobRaw = toNum(l2.slice(13, 19));
    const dobCheck = l2[19];
    const sexChar = l2[20];
    let expRaw = toNum(l2.slice(21, 27));
    const expCheck = l2[27];
    const personalNo = l2.slice(28, 42).replace(FILLER, "").trim();
    if (String(checkDigit(passportNo)) !== ppCheck) {
        const fixed = passportNo.replace(/^([A-Z0-9]{2})([A-Z0-9]{7})$/, (_, a, b) => toAlpha(a) + toNum(b));
        if (String(checkDigit(fixed)) === ppCheck) passportNo = fixed; else warnings.push("passportNo");
    }
    if (String(checkDigit(dobRaw)) !== dobCheck) warnings.push("dob");
    if (String(checkDigit(expRaw)) !== expCheck) warnings.push("passportExpiryDate");
    const dobP = yymmddToParts(dobRaw);
    const expP = yymmddToParts(expRaw);
    if (!dobP) warnings.push("dob");
    if (!expP) warnings.push("passportExpiryDate");
    const nowYY = (new Date).getFullYear() % 100;
    const dobYear = dobP ? dobP.yy > nowYY ? 1900 + dobP.yy : 2e3 + dobP.yy : null;
    const expYear = expP ? expP.yy < 70 ? 2e3 + expP.yy : 1900 + expP.yy : null;
    const uniqWarn = [ ...new Set(warnings) ];
    const confidence = uniqWarn.length === 0 ? "high" : uniqWarn.length === 1 ? "medium" : "low";
    return {
        surname: surname,
        givenName: givenName,
        passportNo: passportNo.replace(FILLER, "").trim(),
        nationality3: nationality3,
        issuer3: issuer3,
        dob: dobP ? `${p2(dobP.dd)}/${p2(dobP.mm)}/${dobYear}` : "",
        gender: sexChar === "F" ? "FEMALE" : sexChar === "M" ? "MALE" : "",
        expiry: expP ? `${p2(expP.dd)}/${p2(expP.mm)}/${expYear}` : "",
        personalNo: personalNo,
        confidence: confidence,
        warnings: uniqWarn
    };
}

export const ISO3_NAME = {
    BGD: "BANGLADESH",
    IND: "INDIA",
    PAK: "PAKISTAN",
    NPL: "NEPAL",
    LKA: "SRI LANKA",
    BTN: "BHUTAN",
    MDV: "MALDIVES",
    MMR: "MYANMAR",
    CHN: "CHINA",
    USA: "UNITED STATES OF AMERICA",
    GBR: "UNITED KINGDOM",
    CAN: "CANADA",
    AUS: "AUSTRALIA",
    MYS: "MALAYSIA",
    SGP: "SINGAPORE",
    SAU: "SAUDI ARABIA",
    ARE: "UNITED ARAB EMIRATES",
    QAT: "QATAR",
    KWT: "KUWAIT",
    OMN: "OMAN"
};

export function mrzToProfile(mrz) {
    if (!mrz) return {};
    const out = {
        surname: mrz.surname,
        givenName: mrz.givenName,
        fullName: [ mrz.givenName, mrz.surname ].filter(Boolean).join(" "),
        passportNo: mrz.passportNo,
        dob: mrz.dob,
        gender: mrz.gender,
        passportExpiryDate: mrz.expiry
    };
    const nat = ISO3_NAME[mrz.nationality3];
    if (nat) {
        out.nationality = nat;
        out.passportCountryOfIssue = ISO3_NAME[mrz.issuer3] || nat;
    }
    if (mrz.personalNo && /^\d{10,17}$/.test(mrz.personalNo)) out.citizenshipNo = mrz.personalNo;
    for (const k of Object.keys(out)) if (!out[k]) delete out[k];
    return out;
}
