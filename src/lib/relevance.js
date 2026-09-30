export function visaKind(purpose = "") {
    const text = String(purpose).toUpperCase();
    const sub = (/\(([A-Z]{1,2}\d?)\)/.exec(text) || [])[1] || "";
    const category = [ "MEDICAL", "TOURIST", "BUSINESS", "STUDENT", "CONFERENCE", "EMPLOYMENT", "JOURNALIST", "TRANSIT", "ENTRY", "RESEARCH", "MISSIONARY", "PILGRIM" ].find(c => text.includes(c)) || "";
    return {
        category: category,
        sub: sub
    };
}

export const ATTENDANT_SUBS = [ "M2", "M4" ];

export function isAttendant(data = {}) {
    const {category: category, sub: sub} = visaKind(data.visaPurpose);
    if (category !== "MEDICAL") return false;
    const role = String(data.medicalRole || "").toUpperCase();
    if (role === "ATTENDANT") return true;
    if (ATTENDANT_SUBS.includes(role)) return true;
    return ATTENDANT_SUBS.includes(sub);
}

export function needsPatientId(data = {}) {
    return isAttendant(data) && !String(data.attendantOfApplicationId || "").trim();
}

const NO_EMPLOYER = [ "HOUSE WIFE", "HOUSEWIFE", "HOMEMAKER", "STUDENT", "RETIRED", "UNEMPLOYED", "NOT EMPLOYED", "CHILD", "INFANT", "MINOR" ];

export function hasEmployer(data = {}) {
    const job = String(data.occupation || "").toUpperCase().trim();
    if (!job) return true;
    return !NO_EMPLOYER.some(n => job === n || job.startsWith(n));
}

const OWNER_LABELS = {
    SELF: {
        bn: "নিজের",
        en: "own"
    },
    SPOUSE: {
        bn: "স্বামী/স্ত্রীর",
        en: "spouse's"
    },
    FATHER: {
        bn: "বাবার",
        en: "father's"
    },
    MOTHER: {
        bn: "মায়ের",
        en: "mother's"
    },
    PARENT: {
        bn: "বাবা/মায়ের",
        en: "parent's"
    },
    GUARDIAN: {
        bn: "অভিভাবকের",
        en: "guardian's"
    }
};

export function employerOwner(data = {}) {
    if (hasEmployer(data)) return {
        who: "SELF",
        guessed: false,
        ...OWNER_LABELS.SELF
    };
    const stated = String(data.occupationDetailsOf || "").toUpperCase().trim();
    if (OWNER_LABELS[stated]) return {
        who: stated,
        guessed: false,
        ...OWNER_LABELS[stated]
    };
    const job = String(data.occupation || "").toUpperCase();
    const who = /HOUSE ?WIFE|HOMEMAKER/.test(job) ? "SPOUSE" : /STUDENT|CHILD|INFANT|MINOR/.test(job) ? "FATHER" : "SELF";
    return {
        who: who,
        guessed: who !== "SELF",
        ...OWNER_LABELS[who]
    };
}

const OWNED_FIELDS = new Set([ "employerName", "designation", "employerAddress", "employerPhone" ]);

export function labelFor(field, data = {}) {
    const base = field?.label || "";
    if (!field || !OWNED_FIELDS.has(field.key)) return base;
    const owner = employerOwner(data);
    if (owner.who === "SELF") return base;
    return `${base} (${owner.bn})`;
}

const YES = v => /^(yes|y|true|1)$/i.test(String(v || "").trim());

const RULES = {
    occupationDetailsOf: d => !hasEmployer(d),
    occupationOther: d => /OTHER/i.test(String(d.occupation || "")),
    religionOther: d => /OTHER/i.test(String(d.religion || "")),
    previousSurname: d => YES(d.changedName),
    previousName: d => YES(d.changedName),
    grandparentsDetails: d => YES(d.grandparentsPak),
    refuseDetails: d => YES(d.visaRefused),
    otherPassportCountry: d => YES(d.otherPassport),
    otherPassportNo: d => YES(d.otherPassport),
    otherPassportIssueDate: d => YES(d.otherPassport),
    otherPassportPlaceOfIssue: d => YES(d.otherPassport),
    otherPassportNationality: d => YES(d.otherPassport),
    militaryOrg: d => YES(d.militaryService),
    militaryDesignation: d => YES(d.militaryService),
    militaryRank: d => YES(d.militaryService),
    militaryPosting: d => YES(d.militaryService),
    oldVisaNo: d => YES(d.hasPreviousVisa),
    oldVisaType: d => YES(d.hasPreviousVisa),
    oldVisaIssuePlace: d => YES(d.hasPreviousVisa),
    oldVisaIssueDate: d => YES(d.hasPreviousVisa),
    prevVisitAddress: d => YES(d.hasPreviousVisa),
    spouseName: d => /MARRIED|WIDOW|DIVORC/i.test(String(d.maritalStatus || "")),
    spouseNationality: d => /MARRIED/i.test(String(d.maritalStatus || "")),
    spousePrevNationality: d => /MARRIED/i.test(String(d.maritalStatus || "")),
    spousePlaceOfBirth: d => /MARRIED/i.test(String(d.maritalStatus || "")),
    spouseCountryOfBirth: d => /MARRIED/i.test(String(d.maritalStatus || "")),
    permHouseStreet: d => !YES(d.permanentSame),
    permVillageTown: d => !YES(d.permanentSame),
    permCountry: d => !YES(d.permanentSame),
    permState: d => !YES(d.permanentSame),
    permDistrict: d => !YES(d.permanentSame),
    permPostal: d => !YES(d.permanentSame),
    permPhone: d => !YES(d.permanentSame),
    medicalRole: d => visaKind(d.visaPurpose).category === "MEDICAL",
    illness: d => visaKind(d.visaPurpose).category === "MEDICAL",
    hospitalName: d => visaKind(d.visaPurpose).category === "MEDICAL",
    hospitalAddress: d => visaKind(d.visaPurpose).category === "MEDICAL",
    hospitalCity: d => visaKind(d.visaPurpose).category === "MEDICAL",
    doctorName: d => visaKind(d.visaPurpose).category === "MEDICAL",
    hospitalPhone: d => visaKind(d.visaPurpose).category === "MEDICAL",
    hospitalEmail: d => visaKind(d.visaPurpose).category === "MEDICAL",
    medicalCertNo: d => visaKind(d.visaPurpose).category === "MEDICAL",
    homeHospitalName: d => visaKind(d.visaPurpose).category === "MEDICAL",
    homeHospitalAddress: d => visaKind(d.visaPurpose).category === "MEDICAL",
    homeDoctorName: d => visaKind(d.visaPurpose).category === "MEDICAL",
    homeHospitalPhone: d => visaKind(d.visaPurpose).category === "MEDICAL",
    homeHospitalEmail: d => visaKind(d.visaPurpose).category === "MEDICAL",
    attendantOf: isAttendant,
    attendantOfPassport: isAttendant,
    attendantOfDob: isAttendant,
    attendantOfNationality: isAttendant,
    attendantOfApplicationId: isAttendant
};

export function applies(key, data = {}) {
    const rule = RULES[key];
    if (!rule) return true;
    try {
        return !!rule(data);
    } catch (_) {
        return true;
    }
}

export function relevantKeys(keys = [], data = {}) {
    return keys.filter(k => applies(k, data));
}

export function strayValues(data = {}) {
    return Object.keys(RULES).filter(k => {
        const v = data[k];
        return v !== undefined && String(v).trim() !== "" && !applies(k, data);
    });
}

export function clearStray(data = {}) {
    const out = {
        ...data
    };
    for (const k of strayValues(data)) out[k] = "";
    return out;
}
