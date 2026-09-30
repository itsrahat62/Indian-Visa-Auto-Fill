import { FIELDS } from "../lib/schema.js";

import { PORTAL_PAGES } from "../lib/portal-map.js";

import { guideFor } from "../lib/guide.js";

import { guideEnFor } from "../lib/guide-en.js";

import { labelBnFor } from "../lib/labels-bn.js";

export const SITE_PAGES = [ {
    id: "home",
    en: "Online Visa Application",
    bn: "অনলাইন ভিসা আবেদন — রেজিস্ট্রেশন"
}, {
    id: "personal",
    en: "Applicant Details Form",
    bn: "আবেদনকারীর তথ্য",
    sections: {
        surname: [ "Applicant Details", "আবেদনকারীর তথ্য" ],
        passportNo: [ "Passport Details", "পাসপোর্টের তথ্য" ]
    }
}, {
    id: "address",
    en: "Address, Family and Profession",
    bn: "ঠিকানা, পরিবার ও পেশা",
    sections: {
        presentHouseStreet: [ "Present Address", "বর্তমান ঠিকানা" ],
        permanentSame: [ "Permanent Address", "স্থায়ী ঠিকানা" ],
        fatherName: [ "Father's Details", "বাবার তথ্য" ],
        motherName: [ "Mother's Details", "মায়ের তথ্য" ],
        maritalStatus: [ "Applicant's Marital Status", "বৈবাহিক অবস্থা" ],
        grandparentsPak: [ "Pakistan Nationality", "পাকিস্তানি নাগরিকত্ব" ],
        occupation: [ "Profession / Occupation Details of Applicant", "পেশা" ],
        militaryService: [ "Military / Police / Security Service", "সামরিক / পুলিশ / নিরাপত্তা বাহিনী" ]
    }
}, {
    id: "visa-details",
    en: "Visa Details",
    bn: "ভিসার তথ্য",
    sections: {
        durationDays: [ "Details of Visa Sought", "যে ভিসা চাইছেন" ],
        hospitalName: [ "Hospital in India", "ভারতের হাসপাতাল" ],
        attendantOf: [ "Patient Details (for attendants)", "রুগির তথ্য (সাথে যাওয়া লোকের জন্য)" ],
        homeHospitalName: [ "Hospital in Bangladesh", "বাংলাদেশের হাসপাতাল" ],
        refIndiaName: [ "Reference in India", "ভারতে রেফারেন্স" ],
        refHomeName: [ "Reference in Bangladesh", "বাংলাদেশে রেফারেন্স" ],
        hasPreviousVisa: [ "Previous Visa / Currently Valid Visa Details", "আগের ভিসা" ],
        countriesVisited: [ "Other Information", "অন্যান্য তথ্য" ]
    }
}, {
    id: "declaration",
    en: "Additional Questions",
    bn: "অতিরিক্ত প্রশ্ন (ঘোষণা)"
}, {
    id: "photo",
    en: "Upload Photograph",
    bn: "ছবি আপলোড"
}, {
    id: "stay",
    en: "Place of Stay in India",
    bn: "ভারতে থাকার জায়গা"
} ];

const SITE_TEXT = {
    mission: {
        label: "Indian Mission/Office",
        req: true
    },
    presentEmail: {
        label: "Email ID",
        req: true
    },
    arrivalDate: {
        label: "Expected Date of Arrival",
        req: true
    },
    visaPurpose: {
        label: "Visiting India for",
        req: true
    },
    surname: {
        label: "Surname (as shown in your Passport)",
        hint: "Surname/Family Name (As in Passport)"
    },
    givenName: {
        label: "Given Name/s (Complete as in Passport)",
        req: true,
        hint: "Given Name/s (exactly as in Passport)"
    },
    changedName: {
        label: "Have you ever changed your name?",
        hint: "If You have ever changed your Name Please tell us."
    },
    gender: {
        label: "Gender",
        req: true,
        hint: "Gender"
    },
    dob: {
        label: "Date of Birth",
        req: true,
        hint: "Date of Birth as in Passport in DD/MM/YYYY format"
    },
    townOfBirth: {
        label: "Town/City of birth",
        req: true,
        hint: "Province/Town/City of birth"
    },
    countryOfBirth: {
        label: "Country/Region of birth",
        req: true,
        hint: "Country/Region of birth"
    },
    citizenshipNo: {
        label: "Citizenship/National Id No.",
        req: true,
        hint: "If not applicable Please Type NA"
    },
    religion: {
        label: "Religion",
        req: true,
        hint: "If Others .Please specify"
    },
    identificationMarks: {
        label: "Visible identification marks",
        req: true,
        hint: "Visible identification marks"
    },
    education: {
        label: "Educational Qualification",
        req: true,
        hint: "Educational Qualification"
    },
    nationality: {
        label: "Nationality",
        req: true,
        hint: "Nationality"
    },
    nationalityBy: {
        label: "Did you acquire Nationality by birth or by naturalization?",
        req: true,
        hint: "Did you acquire Nationality by birth or by naturalization?"
    },
    passportNo: {
        label: "Passport Number",
        req: true,
        hint: "Applicant's Passport Number"
    },
    passportPlaceOfIssue: {
        label: "Place of Issue",
        req: true,
        hint: "Place of Issue"
    },
    passportIssueDate: {
        label: "Date of Issue",
        req: true
    },
    passportExpiryDate: {
        label: "Date of Expiry",
        req: true
    },
    otherPassport: {
        label: "Any other valid Passport/Identity Certificate(IC) held",
        hint: "If Yes Please give Details"
    }
};

const SITE_RULES = {
    arrivalDate: [ 0, "Please enter expected arrival date" ],
    citizenshipNo: [ 1, "If not applicable Please Type NA" ],
    countriesVisited: [ 0, "" ],
    countryOfBirth: [ 1, "Country of birth" ],
    designation: [ 0, "Designation" ],
    dob: [ 0, "" ],
    durationDays: [ 1, "" ],
    education: [ 1, "Educational Qualification" ],
    employerAddress: [ 1, "Address" ],
    employerName: [ 1, "Employer Name / Business" ],
    employerPhone: [ 0, "Phone" ],
    fatherCountryOfBirth: [ 1, "Country of birth" ],
    fatherName: [ 1, "Applicant's Father Number" ],
    fatherNationality: [ 1, "Father's Nationality" ],
    fatherPlaceOfBirth: [ 1, "Place of birth" ],
    fatherPrevNationality: [ 0, "Previous Nationality of Father" ],
    gender: [ 1, "Gender" ],
    givenName: [ 1, "Given Name/s (As in Passport)" ],
    grandparentsDetails: [ 1, "If Yes, give details" ],
    grandparentsPak: [ 0, "" ],
    hasPreviousVisa: [ 0, "If yes,give details" ],
    identificationMarks: [ 1, "Visible identification marks" ],
    maritalStatus: [ 1, "Applicant´s Maritial Status" ],
    militaryDesignation: [ 1, "Designation" ],
    militaryOrg: [ 1, "Organization" ],
    militaryPosting: [ 1, "Place of Posting" ],
    militaryRank: [ 1, "Rank" ],
    militaryService: [ 0, "If yes,give details" ],
    mission: [ 1, "" ],
    motherCountryOfBirth: [ 1, "Country of birth" ],
    motherName: [ 1, "Applicant's Mother Name" ],
    motherNationality: [ 1, "Mother's Nationality" ],
    motherPlaceOfBirth: [ 1, "Place of birth" ],
    motherPrevNationality: [ 0, "Previous Nationality of Mother" ],
    nationality: [ 1, "" ],
    nationalityBy: [ 1, "Did you acquire Nationality by birth or by naturalization?" ],
    noOfEntries: [ 1, "" ],
    occupation: [ 1, "If Others,please specify" ],
    occupationDetailsOf: [ 1, "In case of HouseWife/Student/Minor Please specify Spouse/Parent's Occupation details." ],
    occupationOther: [ 1, "" ],
    oldVisaIssueDate: [ 1, "Date of Issue" ],
    oldVisaIssuePlace: [ 0, "Place of Issue" ],
    oldVisaNo: [ 0, "Last Indian Visa no / Currently valid Visa no" ],
    oldVisaType: [ 1, "Type of Visa" ],
    passportExpiryDate: [ 0, "In DD/MM/YYYY format" ],
    passportIssueDate: [ 1, "In DD/MM/YYYY format" ],
    passportNo: [ 1, "Applicant's Passport Number" ],
    passportPlaceOfIssue: [ 1, "Place of Issue" ],
    pastOccupation: [ 0, "Specify if others" ],
    permDistrict: [ 0, "State/Province/District" ],
    permHouseStreet: [ 1, "Applicant's Permanent Address(with Postal/Zip Code)" ],
    permVillageTown: [ 0, "Village/Town/City" ],
    placesToVisit: [ 1, "Cities in India visited (comma separated)" ],
    portOfArrival: [ 1, "" ],
    portOfExit: [ 1, "" ],
    presentCountry: [ 1, "Country" ],
    presentDistrict: [ 1, "State/Province/District" ],
    presentEmail: [ 0, "" ],
    presentHouseStreet: [ 1, "Applicant's Present Address. Maximum 35 characters (Each Line)" ],
    presentMobile: [ 1, "Mobile Number" ],
    presentPhone: [ 1, "One Contact No is Mandatory" ],
    presentPostal: [ 1, "Postal/Zip Code" ],
    presentVillageTown: [ 1, "Village/Town/City" ],
    previousNationality: [ 1, "Specify Previous Nationality" ],
    prevVisitAddress: [ 1, "" ],
    refHomeAddress: [ 0, "" ],
    refHomeAddress2: [ 0, "" ],
    refHomeName: [ 0, "" ],
    refHomePhone: [ 1, "Phone no" ],
    refIndiaAddress: [ 0, "" ],
    refIndiaName: [ 0, "" ],
    refIndiaPhone: [ 1, "Phone no" ],
    refuseDetails: [ 0, "" ],
    religion: [ 1, "If Others .Please specify" ],
    saarcVisited: [ 0, "If yes,give details" ],
    spouseCountryOfBirth: [ 1, "Spouse country of birth" ],
    spouseName: [ 1, "Spouse Name" ],
    spouseNationality: [ 1, "Spouse Nationality" ],
    spousePlaceOfBirth: [ 1, "Spouse place of birth" ],
    spousePrevNationality: [ 0, "Spouse Previous Nationality" ],
    surname: [ 0, "Surname/Family Name (As in Passport)" ],
    townOfBirth: [ 1, "Province/Town/City of birth" ],
    visaRefused: [ 0, "If yes,give details" ]
};

const SITE_LAYOUT = {
    home: {
        heading: "Online Visa Application",
        rows: [ [ "mission", "", 0, "" ], [ "nationality", "", 0, "" ], [ "dob", "", 0, "" ], [ "presentEmail", "", 0, "" ], [ "arrivalDate", "", 0, "" ], [ "visaPurpose", "Visiting India for", 1, "" ] ]
    },
    personal: {
        heading: "Applicant Details Form",
        rows: [ [ "§", "Applicant Details", "আবেদনকারীর তথ্য" ], [ "surname", "Surname (as shown in your Passport)", 0, "Surname/Family Name (As in Passport)" ], [ "givenName", "Given Name/s (Complete as in Passport)", 1, "Given Name/s (exactly as in Passport)" ], [ "changedName", "Have you ever changed your name?", 0, "If You have ever changed your Name Please tell us." ], [ "previousSurname", "Previous Surname", 1, "Previous Surname" ], [ "previousName", "Previous Name", 1, "Previous given name" ], [ "gender", "Gender", 1, "Gender" ], [ "dob", "Date of Birth", 1, "Date of Birth as in Passport in DD/MM/YYYY format", "fixed" ], [ "townOfBirth", "Town/City of birth", 1, "Province/Town/City of birth" ], [ "countryOfBirth", "Country/Region of birth", 1, "Country/Region of birth" ], [ "citizenshipNo", "Citizenship/National Id No.", 1, "If not applicable Please Type NA" ], [ "religion", "Religion", 1, "If Others .Please specify" ], [ "identificationMarks", "Visible identification marks", 1, "Visible identification marks" ], [ "education", "Educational Qualification", 1, "Educational Qualification" ], [ "nationality", "Nationality", 1, "Nationality", "fixed" ], [ "nationalityBy", "Did you acquire Nationality by birth or by naturalization?", 1, "Did you acquire Nationality by birth or by naturalization?" ], [ "previousNationality", "Prev. Nationality/Region", 1, "Specify Previous Nationality" ], [ "§", "Passport Details", "পাসপোর্টের তথ্য" ], [ "passportNo", "Passport Number", 1, "Applicant's Passport Number" ], [ "passportPlaceOfIssue", "Place of Issue", 1, "Place of Issue" ], [ "passportIssueDate", "Date of Issue", 1, "In DD/MM/YYYY format" ], [ "passportExpiryDate", "Date of Expiry", 1, "In DD/MM/YYYY format.Minimum Six Month Validity is Required." ], [ "otherPassport", "Any other valid Passport/Identity Certificate(IC) held,", 0, "If Yes Please give Details" ], [ "otherPassportCountry", "Country/Region of Issue", 1, "Country/Region of Issue" ], [ "otherPassportNo", "Passport/IC No.", 1, "Passport No" ], [ "otherPassportIssueDate", "Date of Issue", 1, "Date of Issue (In DD/MM/YYYY format)" ], [ "otherPassportPlaceOfIssue", "Place of Issue", 1, "Place of Issue" ], [ "otherPassportNationality", "Nationality mentioned therein", 1, "Nationality described therein" ] ]
    },
    address: {
        heading: "Family Details Form",
        rows: [ [ "§", "Applicant's Address Details", "আবেদনকারীর ঠিকানা" ], [ "§", "Present Address", "বর্তমান ঠিকানা" ], [ "presentHouseStreet", "House No./Street", 1, "Applicant's Present Address. Maximum 35 characters (Each Line)" ], [ "presentVillageTown", "Village/Town/City", 1, "Village/Town/City" ], [ "presentCountry", "Country", 1, "Country" ], [ "presentDistrict", "State/Province/District", 1, "State/Province/District" ], [ "presentPostal", "Postal/Zip Code", 1, "Postal/Zip Code" ], [ "presentPhone", "Phone No.", 1, "Phone Number" ], [ "presentMobile", "Mobile No.", 0, "Mobile Number" ], [ "presentEmail", "Email Address", 0, "", "fixed" ], [ "permanentSame", "Click here for same address", 0, "Click here for same address" ], [ "§", "Permanent Address", "স্থায়ী ঠিকানা" ], [ "permHouseStreet", "House No./Street", 1, "Applicant's Permanent Address(with Postal/Zip Code)" ], [ "permVillageTown", "Village/Town/City", 0, "Village/Town/City" ], [ "permDistrict", "State/Province/District", 0, "State/Province/District" ], [ "§", "Family Details", "পরিবারের তথ্য" ], [ "§", "Father's Details", "বাবার তথ্য" ], [ "fatherName", "Name", 1, "Applicant's Father Number" ], [ "fatherNationality", "Nationality/Region", 1, "Father's Nationality" ], [ "fatherPrevNationality", "Previous Nationality/Region", 0, "Previous Nationality of Father" ], [ "fatherPlaceOfBirth", "Place of birth", 1, "Place of birth" ], [ "fatherCountryOfBirth", "Country/Region of birth", 1, "Country of birth" ], [ "§", "Mother's Details", "মায়ের তথ্য" ], [ "motherName", "Name", 1, "Applicant's Mother Number" ], [ "motherNationality", "Nationality/Region", 1, "Mother's Nationality" ], [ "motherPrevNationality", "Previous Nationality/Region", 0, "Previous Nationality of Mother" ], [ "motherPlaceOfBirth", "Place of birth", 1, "Place of birth" ], [ "motherCountryOfBirth", "Country/Region of birth", 1, "Country of birth" ], [ "maritalStatus", "Applicant's Marital Status", 1, "Applicant´s Maritial Status" ], [ "§", "Spouse's Details", "স্বামী/স্ত্রীর তথ্য" ], [ "spouseName", "Name", 1, "Spouse Name" ], [ "spouseNationality", "Nationality/Region", 1, "Spouse Nationality" ], [ "spousePrevNationality", "Previous Nationality/Region", 0, "Spouse Previous Nationality" ], [ "spousePlaceOfBirth", "Place of birth", 1, "Spouse Place of birth" ], [ "spouseCountryOfBirth", "Country/Region of birth", 1, "Spouse country of birth" ], [ "grandparentsPak", "Were your Grandfather/ Grandmother (paternal/maternal) Pakistan Nationals or Belong to Pakistan held area.", 0, "Were your Grandfather / Grandmother (paternal/maternal) Pakistan Nationals or belong to Pakistan held area? Yes / No" ], [ "grandparentsDetails", "If Yes, give details", 1, "If Yes, give details" ], [ "§", "Profession / Occupation Details of Applicant", "আবেদনকারীর পেশা" ], [ "occupation", "Present Occupation", 1, "If Others,please specify" ], [ "occupationDetailsOf", "Specify below occupation details of", 1, "In case of HouseWife/Student/Minor Please specify Spouse/Parent's Occupation details." ], [ "employerName", "Employer Name/business", 1, "Employer Name / Business" ], [ "designation", "Designation", 0, "Designation" ], [ "employerAddress", "Address", 1, "Address" ], [ "employerPhone", "Phone", 0, "Phone" ], [ "pastOccupation", "Past Occupation, if any", 0, "Past Occupation, if any" ], [ "militaryService", "Are/were you in a Military/Semi-Military/Police/Security. Organization?", 0, "If yes,give details" ], [ "militaryOrg", "Organization", 1, "Organization" ], [ "militaryDesignation", "Designation", 1, "Designation" ], [ "militaryRank", "Rank", 1, "Rank" ], [ "militaryPosting", "Place of Posting", 1, "Place of Posting" ] ]
    },
    "visa-details": {
        heading: "Visa Details Form",
        rows: [ [ "§", "Details of Visa Sought", "যে ভিসা চাইছেন" ], [ "attendantOf", "Name", 1, "" ], [ "attendantOfDob", "Date of Birth", 1, "Please enter date of birth" ], [ "attendantOfNationality", "Nationality", 1, "" ], [ "attendantOfPassport", "Passport No", 1, "" ], [ "attendantOfApplicationId", "Application Id", 1, "" ], [ "durationDays", "Duration of Visa (In Month )", 1, "" ], [ "noOfEntries", "No. of Entries", 1, "" ], [ "arrivalDate", "Expected Date of journey", 1, "(Visa validity will start from the Visa Issue Date)" ], [ "portOfArrival", "Port of Arrival in India", 1, "" ], [ "portOfExit", "Expected Port of Exit from India", 1, "" ], [ "§", "Previous Visa/Currently valid Visa Details", "আগের / এখনকার ভিসা" ], [ "hasPreviousVisa", "Have you ever visited India before?", 1, "If yes,give details" ], [ "prevVisitAddress", "Address", 1, "Enter the address of stay during your last visit" ], [ "placesToVisit", "Cities previously visited in India", 1, "Cities in India visited (comma separated)" ], [ "oldVisaNo", "Last Indian Visa No/Currently valid Indian Visa No.", 1, "Last Indian Visa no / Currently valid Visa no" ], [ "oldVisaType", "Type of Visa", 1, "Type of Visa" ], [ "oldVisaIssuePlace", "Place of Issue", 1, "Place of Issue" ], [ "oldVisaIssueDate", "Date of Issue", 1, "Date of Issue in (DD/MM/YYYY) format" ], [ "visaRefused", "Has permission to visit or to extend stay in India previously been refused?", 0, "If yes,give details" ], [ "refuseDetails", "If so, when and by whom (Mention Control No. and date also)", 1, "If so, when and by whom (mention Control no and date)" ], [ "§", "Other Information", "অন্যান্য তথ্য" ], [ "countriesVisited", "Countries Visited in Last 10 years", 0, "" ], [ "§", "SAARC Country Visit Details", "সার্ক দেশে ভ্রমণ" ], [ "saarcVisited", "Have you visited SAARC countries (except your own country) during last 3 years?", 0, "If yes,give details" ], [ "§", "Reference", "রেফারেন্স" ], [ "refIndiaName", "Reference Name in India", 1, "" ], [ "refIndiaAddress", "Address", 1, "" ], [ "refIndiaState", "State", 1, "" ], [ "refIndiaDistrict", "District", 1, "" ], [ "refIndiaPhone", "Phone", 1, "Phone no" ], [ "refHomeName", "Reference Name in BANGLADESH", 1, "" ], [ "refHomeAddress", "Address", 1, "" ], [ "refHomeAddress2", "", 0, "" ], [ "refHomePhone", "Phone", 1, "Phone no" ] ]
    }
};

const FIXED_ROWS = {
    home: [ {
        en: "Country/Region you are applying visa from",
        bn: "যে দেশ থেকে আবেদন",
        value: "BANGLADESH",
        req: true
    } ]
};

const PHOTO_SPEC = {
    en: [ "Format - JPEG", "Size - Minimum 10 KB , Maximum 1 MB", "The minimum dimensions are 350 pixels (width) x 350 pixels (height).", "Recent front facing photograph with white background to be uploaded by the applicant.", "Do not crop the Passport Image to use it as your recent photograph.", "Upload clear front facing photograph with preferable white/light coloured background.", "The application is liable to be rejected if the uploaded photograph are not clear and as per specification." ],
    bn: [ "ফরম্যাট — JPEG", "সাইজ — কমপক্ষে ১০ KB, সর্বোচ্চ ১ MB", "কমপক্ষে ৩৫০ × ৩৫০ পিক্সেল।", "সাম্প্রতিক, সামনে থেকে তোলা, সাদা ব্যাকগ্রাউন্ডের ছবি।", "পাসপোর্টের ছবি কেটে দেবেন না।", "পরিষ্কার, সামনে থেকে তোলা, সাদা/হালকা ব্যাকগ্রাউন্ড।", "ছবি পরিষ্কার না হলে বা নিয়ম না মানলে আবেদন বাতিল হতে পারে।" ]
};

function photoPage(photo, bn, esc) {
    if (!photo) {
        return `<div class="sv-sub">${bn ? "ছবি বেছে নিন" : "Choose the Photo To Upload"}</div>\n      <div class="sv-photo">\n        <p class="sv-spec-t">${bn ? "ছবির নিয়ম" : "Photo Specifications"}</p>\n        <ul class="sv-spec">${(bn ? PHOTO_SPEC.bn : PHOTO_SPEC.en).map(t => `<li>${esc(t)}</li>`).join("")}</ul>\n        <div class="sv-photo-acts"><button type="button" class="sv-btn" data-sv-photo="upload">${bn ? "ছবি আপলোড" : "Upload Photo"}</button></div>\n      </div>`;
    }
    return `<div class="sv-sub">${bn ? "আপলোড করা ছবি" : "The Photo uploaded"}</div>\n    <div class="sv-photo">\n      <img class="sv-photo-img" data-thumb="${esc(photo.id)}" data-view="${esc(photo.id)}" data-name="${esc(photo.name)}" alt="" title="${bn ? "বড় করে দেখুন" : "View"}" />\n      <p class="sv-photo-meta">${esc(photo.w ? `${photo.w} × ${photo.h} px` : "")}${photo.size ? ` · ${Math.round(photo.size / 1024)} KB` : ""}</p>\n      <div class="sv-photo-acts">\n        <button type="button" class="sv-btn" data-sv-photo="recrop">${bn ? "ক্রপ বদলান" : "Crop Again"}</button>\n        <button type="button" class="sv-btn ghosty" data-sv-photo="upload">${bn ? "নতুন ছবি দিন" : "Upload Image Again"}</button>\n      </div>\n    </div>`;
}

const shortBn = text => String(text || "").split(/[।—]/)[0].trim();

export function renderSiteView({data: data, lang: lang, shows: shows, fieldInput: fieldInput, esc: esc, page: at = 0, photo: photo = null}) {
    const bn = lang !== "en";
    const seen = new Set;
    const info = f => {
        const text = bn ? guideFor(f) : guideEnFor(f) || guideFor(f);
        if (!text) return "";
        return `<span class="sv-i" tabindex="0" role="note" aria-label="${esc(text)}">i<span class="sv-tip">${esc(text)}</span></span>`;
    };
    const row = (f, lay = null, exact = false) => {
        const rule = SITE_RULES[f.key] || [ 0, "" ];
        const site = {
            ...SITE_TEXT[f.key]
        };
        site.req = exact ? !!lay?.[2] : !!(lay?.[2] || site.req || rule[0]);
        site.hint = lay?.[3] || site.hint || rule[1];
        site.label = lay?.[1] || site.label;
        const label = bn ? labelBnFor(f) : site.label || f.label;
        const hint = bn ? shortBn(guideFor(f)) : site.hint || "";
        const again = seen.has(f.key) || lay?.[4] === "fixed";
        seen.add(f.key);
        const box = again ? `<b class="sv-fixed">${esc(data[f.key] || "—")}</b>` : fieldInput(f);
        return `<div class="sv-row${data[f.key] ? " done" : ""}">\n        <label class="sv-l">${esc(label)}${site.req ? '<span class="sv-req">*</span>' : ""}</label>\n        <div class="sv-in">${box}${again ? "" : info(f)}</div>\n        <div class="sv-h">${esc(hint)}</div>\n      </div>`;
    };
    const pages = [];
    for (const page of SITE_PAGES) {
        if (page.id === "photo") {
            pages.push({
                page: page,
                rows: [ photoPage(photo, bn, esc) ]
            });
            continue;
        }
        const map = PORTAL_PAGES.find(p => p.id === page.id);
        if (!map) continue;
        const keys = [];
        for (const e of map.fields) if (e.key && !keys.includes(e.key)) keys.push(e.key);
        const rows = [];
        for (const r of FIXED_ROWS[page.id] || []) {
            rows.push(`<div class="sv-row done"><label class="sv-l">${esc(bn ? r.bn : r.en)}${r.req ? '<span class="sv-req">*</span>' : ""}</label>\n        <div class="sv-in"><b class="sv-fixed">${esc(r.value)}</b></div><div class="sv-h"></div></div>`);
        }
        const drawn = SITE_LAYOUT[page.id];
        if (drawn) {
            const exact = page.id !== "home";
            let bars = [];
            for (const r of drawn.rows) {
                if (r[0] === "§") {
                    bars.push(r);
                    continue;
                }
                const f = FIELDS[r[0]];
                if (!f || !shows(r[0])) continue;
                for (const b of bars) rows.push(`<div class="sv-sub">${esc(bn ? b[2] : b[1])}</div>`);
                bars = [];
                rows.push(row(f, r, exact));
            }
            for (const key of keys) {
                const f = FIELDS[key];
                if (!f || !shows(key) || drawn.rows.some(r => r[0] === key)) continue;
                rows.push(row(f));
            }
        } else {
            for (const key of keys) {
                const f = FIELDS[key];
                if (!f || !shows(key)) continue;
                const sec = page.sections?.[key];
                if (sec) rows.push(`<div class="sv-sub">${esc(bn ? sec[1] : sec[0])}</div>`);
                rows.push(row(f));
            }
        }
        if (rows.length) pages.push({
            page: drawn && !bn ? {
                ...page,
                en: drawn.heading
            } : page,
            rows: rows
        });
    }
    const rest = Object.keys(FIELDS).filter(k => !seen.has(k) && shows(k));
    if (rest.length) {
        let group = "";
        const rows = [];
        for (const key of rest) {
            const f = FIELDS[key];
            if (f.groupTitle !== group) {
                group = f.groupTitle;
                rows.push(`<div class="sv-sub">${esc(group)}</div>`);
            }
            rows.push(row(f));
        }
        pages.push({
            page: {
                en: "Other details kept in the profile",
                bn: "অন্যান্য তথ্য"
            },
            rows: rows
        });
    }
    const n = pages.length;
    const cur = Math.min(Math.max(0, at | 0), n - 1);
    const {page: page, rows: rows} = pages[cur];
    const steps = pages.map(({page: p}, i) => `<button type="button" class="sv-step${i === cur ? " on" : i < cur ? " done" : ""}" data-sv-go="${i}" title="${esc(bn ? p.bn : p.en)}">${i + 1}</button>`).join('<i class="sv-line"></i>');
    const prev = cur > 0 ? `<button type="button" class="sv-btn ghosty" data-sv-go="${cur - 1}">${bn ? "← আগের পাতা" : "← Previous"}</button>` : "";
    const next = cur < n - 1 ? `<button type="button" class="sv-btn" data-sv-go="${cur + 1}">${bn ? "সেভ করে পরের পাতা →" : "Save and Continue →"}</button>` : `<span class="sv-done">${bn ? "✓ শেষ পাতা — সব সেভ হয়ে আছে" : "✓ Last page — everything is saved"}</span>`;
    return `<div class="sv" lang="${bn ? "bn" : "en"}">\n      <nav class="sv-steps" aria-label="${bn ? "পাতা" : "Pages"}">${steps}</nav>\n      <section class="sv-page">\n        <div class="sv-bar"><span class="sv-n">${cur + 1}/${n}</span>${esc(bn ? page.bn : page.en)}</div>\n        <div class="sv-body">${rows.join("")}</div>\n        <p class="sv-foot"><span class="sv-req">*</span> ${bn ? "পোর্টালে বাধ্যতামূলক ঘর" : "Mandatory Fields"}</p>\n        <div class="sv-nav">${prev}${next}</div>\n      </section>\n    </div>`;
}
