export const VISA_PURPOSES = [ "MEDICAL VISA (M1)", "MEDICAL VISA (M2)", "MEDICAL VISA (M3)", "MEDICAL VISA (M4)", "TOURIST VISA (T1)", "BUSINESS VISA (B1)", "BUSINESS VISA (B5)", "STUDENT VISA (S1)", "Transit Visa (TR)" ];

export const VISA_TYPES = [ "TOURIST VISA", "MEDICAL / MEDICAL ATTENDANT VISA", "BUSINESS VISA", "ENTRY VISA", "STUDENT VISA", "EMPLOYMENT VISA", "CONFERENCE VISA", "JOURNALIST VISA", "TRANSIT VISA", "DOUBLE ENTRY VISA" ];

export const PORTS = [ "BY AIR/ HARIDASPUR", "BY ROAD HARIDASPUR", "BENAPOLE", "HARIDASPUR", "GEDE", "AKHAURA", "DAWKI", "BANGLABANDHA", "BURIMARI", "DELHI AIRPORT", "KOLKATA AIRPORT", "CHENNAI AIRPORT", "MUMBAI AIRPORT", "BANGALORE AIRPORT", "HYDERABAD AIRPORT" ];

export const OCCUPATIONS = [ "BUSINESS PERSON", "PRIVATE SERVICE", "GOVERNMENT SERVICE", "STUDENT", "HOUSEWIFE", "DOCTOR", "ENGINEER", "JOURNALIST", "RETIRED", "UNEMPLOYED", "OTHERS" ];

export const AIRLINES = [ "BIMAN BANGLADESH AIRLINES", "US-BANGLA AIRLINES", "NOVOAIR", "AIR ASTRA", "INDIGO", "AIR INDIA", "SPICEJET", "VISTARA", "EMIRATES", "QATAR AIRWAYS", "SINGAPORE AIRLINES" ];

export const NATIONALITIES = [ "BANGLADESH", "INDIA", "NEPAL", "BHUTAN", "SRI LANKA", "PAKISTAN", "MALDIVES", "MYANMAR", "CHINA", "UNITED KINGDOM", "UNITED STATES OF AMERICA" ];

export const HOURS = Array.from({
    length: 24
}, (_, i) => `${String(i).padStart(2, "0")}:00`);

export const BD_DIVISIONS = [ "DHAKA", "CHATTOGRAM", "KHULNA", "RAJSHAHI", "BARISHAL", "SYLHET", "RANGPUR", "MYMENSINGH" ];

export const NATIONALITY_BY = [ "BY BIRTH", "BY NATURALIZATION", "BY REGISTRATION", "BY DESCENT" ];

export const PASSPORT_TYPES = [ "ORDINARY PASSPORT", "OFFICIAL PASSPORT", "DIPLOMATIC PASSPORT", "SERVICE PASSPORT", "IDENTITY CERTIFICATE" ];

export const GENDERS = [ "MALE", "FEMALE", "TRANSGENDER" ];

export const MARITAL_STATUSES = [ "MARRIED", "SINGLE", "DIVORCED", "WIDOWED" ];

export const RELIGIONS = [ "ISLAM", "HINDU", "BUDDHISM", "CHRISTIAN", "SIKH", "JAIN", "OTHERS" ];

export const EDU_LEVELS = [ "GRADUATE", "POST GRADUATE", "HIGHER SECONDARY", "MATRICULATION", "BELOW MATRICULATION", "PROFESSIONAL", "ILLITERATE" ];

const G = (id, title, titleBn, icon, fields) => ({
    id: id,
    title: title,
    titleBn: titleBn,
    icon: icon,
    fields: fields
});

let FIRST_TITLE = [ "Passport & Application", "পাসপোর্ট ও আবেদন" ];

let TRAVEL_TITLE = [ "Photo & stay", "ছবি ও থাকার মেয়াদ" ];

TRAVEL_TITLE = [ "Journey (e-Arrival, travel tax, port fee)", "যাত্রা (e-Arrival, ভ্রমণ কর, পোর্ট ফি)" ];

export const GROUPS = [ G("ivac", FIRST_TITLE[0], FIRST_TITLE[1], "⚡", [ {
    key: "visaType",
    label: "Visa Category / Type",
    labelBn: "Visa Category / Type",
    type: "select",
    opts: VISA_TYPES,
    hint: "Select your visa category",
    match: {
        any: [ "visa type", "visa category", "service category", "visa service" ]
    }
}, {
    key: "webFileNumber",
    label: "Web File Number",
    labelBn: "Web File Number",
    type: "text",
    upper: true,
    hint: "Application ID from online form (e.g. BGDDV1234567)",
    match: {
        any: [ "web file number", "web file no", "webfile number", "webfile no", "web file id", "web file" ]
    }
}, {
    key: "applicationId",
    label: "Application Id (registered)",
    labelBn: "Application Id (registered)",
    type: "text",
    upper: true,
    hint: "Exactly 12 characters, from a submitted application (e.g. 58X8A2X9YHR9)",
    match: {
        any: [ "application id", "file reference" ],
        not: [ "temporary" ]
    }
}, {
    key: "tempApplicationId",
    label: "Temporary Application ID",
    labelBn: "Temporary Application ID",
    type: "text",
    upper: true,
    hint: "15 characters, for resuming an unfinished form (e.g. 53081534JSBL8HO)",
    match: {
        all: [ "temporary" ],
        any: [ "temporary application id", "temp file", "temporary id" ]
    }
}, {
    key: "passportNo",
    label: "Passport Number",
    labelBn: "Passport Number",
    type: "text",
    upper: true,
    hint: "Current valid passport number (e.g. A01234567)",
    match: {
        any: [ "passport no", "passport number", "current passport", "passport" ]
    }
}, {
    key: "fullName",
    nameSafe: true,
    label: "Applicant Full Name",
    labelBn: "Applicant Full Name",
    type: "text",
    upper: true,
    hint: "Full name as printed on the passport",
    match: {
        any: [ "applicant name", "full name", "name of applicant" ],
        not: [ "father", "mother", "spouse", "reference", "sponsor", "employer", "india", "contact" ]
    }
}, {
    key: "gender",
    label: "Gender",
    labelBn: "Gender",
    type: "select",
    opts: GENDERS,
    match: {
        any: [ "gender", "sex" ]
    }
}, {
    key: "dob",
    label: "Date of Birth",
    labelBn: "Date of Birth",
    type: "date",
    hint: "DD/MM/YYYY or YYYY-MM-DD",
    match: {
        any: [ "date of birth", "dob", "birth date" ]
    }
}, {
    key: "citizenshipNo",
    label: "National ID (NID)",
    labelBn: "National ID (NID)",
    type: "text",
    match: {
        any: [ "national id", "national id no", "nid", "citizenship no", "citizen no" ]
    }
} ]), G("personal", "Personal & Passport Details", "Personal & Passport Details", "👤", [ {
    key: "surname",
    nameSafe: true,
    label: "Surname (Last Name)",
    labelBn: "Surname (Last Name)",
    type: "text",
    upper: true,
    match: {
        any: [ "surname", "last name", "family name" ]
    }
}, {
    key: "givenName",
    nameSafe: true,
    label: "Given Name (First Name)",
    labelBn: "Given Name (First Name)",
    type: "text",
    upper: true,
    match: {
        any: [ "given name", "first name", "forename" ]
    }
}, {
    key: "changedName",
    label: "Have you ever changed your name?",
    labelBn: "Have you ever changed your name?",
    type: "yn",
    match: {
        any: [ "have you ever changed your name", "previous name" ]
    }
}, {
    key: "previousSurname",
    nameSafe: true,
    label: "Previous Surname",
    labelBn: "Previous Surname",
    type: "text",
    upper: true,
    match: {
        any: [ "previous surname", "prev surname" ]
    }
}, {
    key: "previousName",
    nameSafe: true,
    label: "Previous Name",
    labelBn: "Previous Name",
    type: "text",
    upper: true,
    match: {
        any: [ "previous name", "prev name" ]
    }
}, {
    key: "townOfBirth",
    label: "Place / Town of Birth",
    labelBn: "Place / Town of Birth",
    type: "text",
    upper: true,
    match: {
        any: [ "town city of birth", "place of birth", "city of birth", "town of birth" ],
        not: [ "country", "spouse", "father", "mother" ]
    }
}, {
    key: "countryOfBirth",
    suggest: NATIONALITIES,
    label: "Country of Birth",
    labelBn: "Country of Birth",
    type: "select",
    match: {
        any: [ "country of birth" ],
        not: [ "spouse", "father", "mother" ]
    }
}, {
    key: "nationality",
    suggest: NATIONALITIES,
    label: "Current Nationality",
    labelBn: "Current Nationality",
    type: "select",
    match: {
        any: [ "citizenship national id", "nationality", "citizenship" ],
        not: [ "previous", "father", "mother", "spouse", "by birth" ]
    }
}, {
    key: "nationalityBy",
    suggest: NATIONALITY_BY,
    label: "Nationality Acquired By",
    labelBn: "Nationality Acquired By",
    type: "select",
    match: {
        any: [ "citizenship by", "nationality by", "by birth naturalization" ]
    }
}, {
    key: "previousNationality",
    suggest: NATIONALITIES,
    label: "Previous Nationality",
    labelBn: "Previous Nationality",
    type: "select",
    match: {
        any: [ "previous nationality", "prev nationality" ],
        not: [ "father", "mother", "spouse" ]
    }
}, {
    key: "religion",
    label: "Religion",
    labelBn: "Religion",
    type: "select",
    opts: RELIGIONS,
    match: {
        any: [ "religion" ]
    }
}, {
    key: "religionOther",
    label: "Religion (if Other)",
    labelBn: "ধর্ম (অন্যান্য হলে)",
    type: "text",
    upper: true,
    match: {
        any: [ "religion other", "if other religion", "other religion", "specify religion" ]
    }
}, {
    key: "identificationMarks",
    label: "Visible Identification Marks",
    labelBn: "Visible Identification Marks",
    type: "text",
    upper: true,
    match: {
        any: [ "visible identification marks", "identification marks", "id marks" ]
    }
}, {
    key: "education",
    label: "Educational Qualification",
    labelBn: "Educational Qualification",
    type: "select",
    opts: EDU_LEVELS,
    match: {
        any: [ "educational qualification", "education", "qualification" ]
    }
}, {
    key: "passportType",
    suggest: PASSPORT_TYPES,
    label: "Passport Type",
    labelBn: "Passport Type",
    type: "select",
    match: {
        any: [ "passport type", "type of passport" ]
    }
}, {
    key: "passportCountryOfIssue",
    suggest: NATIONALITIES,
    label: "Country of Issue",
    labelBn: "Country of Issue",
    type: "select",
    match: {
        any: [ "country of issue", "issued country" ],
        all: [ "passport" ]
    }
}, {
    key: "passportPlaceOfIssue",
    label: "Place of Issue",
    labelBn: "Place of Issue",
    type: "text",
    upper: true,
    match: {
        any: [ "place of issue", "issued at" ],
        all: [ "passport" ]
    }
}, {
    key: "passportIssueDate",
    label: "Passport Issue Date",
    labelBn: "Passport Issue Date",
    type: "date",
    match: {
        any: [ "date of issue", "issue date", "passport issue date" ],
        not: [ "expiry", "prev" ]
    }
}, {
    key: "passportExpiryDate",
    label: "Passport Expiry Date",
    labelBn: "Passport Expiry Date",
    type: "date",
    match: {
        any: [ "date of expiry", "expiry date", "valid until" ],
        not: [ "issue" ]
    }
}, {
    key: "otherPassport",
    label: "Hold any other valid passport?",
    labelBn: "Hold any other valid passport?",
    type: "yn",
    match: {
        any: [ "other valid passport", "any other passport", "other passport" ]
    }
}, {
    key: "otherPassportCountry",
    suggest: NATIONALITIES,
    label: "Other Passport — Country",
    labelBn: "Other Passport — Country",
    type: "select",
    match: {
        any: [ "country of issue" ],
        all: [ "other passport" ]
    }
}, {
    key: "otherPassportNo",
    label: "Other Passport — Number",
    labelBn: "Other Passport — Number",
    type: "text",
    upper: true,
    match: {
        any: [ "passport no", "passport number" ],
        all: [ "other" ]
    }
}, {
    key: "otherPassportIssueDate",
    label: "Other Passport — Issue Date",
    labelBn: "Other Passport — Issue Date",
    type: "date",
    match: {
        any: [ "date of issue" ],
        all: [ "other" ]
    }
}, {
    key: "otherPassportPlaceOfIssue",
    label: "Other Passport — Place of Issue",
    labelBn: "Other Passport — Place of Issue",
    type: "text",
    upper: true,
    match: {
        any: [ "place of issue" ],
        all: [ "other" ]
    }
}, {
    key: "otherPassportNationality",
    suggest: NATIONALITIES,
    label: "Other Passport — Nationality",
    labelBn: "Other Passport — Nationality",
    type: "select",
    match: {
        any: [ "nationality" ],
        all: [ "other" ]
    }
} ]), G("address", "Address & Contact Details", "Address & Contact Details", "🏠", [ {
    key: "presentHouseStreet",
    label: "Present Address — House / Street",
    labelBn: "Present Address — House / Street",
    type: "textarea",
    upper: true,
    match: {
        any: [ "house no and street", "house street", "address line 1", "present address" ],
        not: [ "permanent", "employer", "company", "stay", "india", "sponsor" ]
    }
}, {
    key: "presentVillageTown",
    label: "Present Address — Village / City",
    labelBn: "Present Address — Village / City",
    type: "text",
    upper: true,
    match: {
        any: [ "village town city", "village city", "town city" ],
        not: [ "permanent", "birth", "stay" ]
    }
}, {
    key: "presentCountry",
    suggest: NATIONALITIES,
    label: "Present Address — Country",
    labelBn: "Present Address — Country",
    type: "select",
    match: {
        any: [ "country" ],
        all: [ "present" ],
        not: [ "birth", "permanent" ]
    }
}, {
    key: "presentState",
    suggest: BD_DIVISIONS,
    label: "Present Address — State / Province",
    labelBn: "Present Address — State / Province",
    type: "select",
    match: {
        any: [ "state province district", "state province", "state" ],
        all: [ "present" ],
        not: [ "stay", "reference", "sponsor" ]
    }
}, {
    key: "presentDistrict",
    label: "Present Address — District",
    labelBn: "Present Address — District",
    type: "text",
    upper: true,
    match: {
        any: [ "district" ],
        all: [ "present" ],
        not: [ "stay", "reference", "sponsor" ]
    }
}, {
    key: "presentPostal",
    label: "Present Address — Postal Code",
    labelBn: "Present Address — Postal Code",
    type: "text",
    match: {
        any: [ "postal zip code", "postal code", "zip code", "pincode" ],
        not: [ "permanent", "stay" ]
    }
}, {
    key: "presentPhone",
    label: "Phone Number",
    labelBn: "Phone Number",
    type: "tel",
    match: {
        any: [ "phone number", "phone no", "telephone" ],
        not: [ "mobile", "employer", "stay", "reference", "sponsor" ]
    }
}, {
    key: "presentMobile",
    label: "Mobile Number",
    labelBn: "Mobile Number",
    type: "tel",
    match: {
        any: [ "mobile no", "mobile number", "cell phone", "cell no", "mobile cell" ],
        not: [ "employer", "stay", "reference", "sponsor" ]
    }
}, {
    key: "presentEmail",
    label: "Email Address",
    labelBn: "Email Address",
    type: "email",
    match: {
        any: [ "email address", "email id", "email" ],
        not: [ "employer", "hospital", "sponsor" ]
    }
}, {
    key: "permanentSame",
    label: "Permanent Address same as Present?",
    labelBn: "Permanent Address same as Present?",
    type: "yn",
    match: {
        any: [ "same as present address", "permanent address same" ]
    }
}, {
    key: "permHouseStreet",
    label: "Permanent Address — House / Street",
    labelBn: "Permanent Address — House / Street",
    type: "textarea",
    upper: true,
    match: {
        any: [ "house no and street", "house street", "address line 1", "permanent address" ],
        all: [ "permanent" ]
    }
}, {
    key: "permVillageTown",
    label: "Permanent Address — Village / City",
    labelBn: "Permanent Address — Village / City",
    type: "text",
    upper: true,
    match: {
        any: [ "village town city", "village city", "town city" ],
        all: [ "permanent" ]
    }
}, {
    key: "permCountry",
    suggest: NATIONALITIES,
    label: "Permanent — Country",
    labelBn: "স্থায়ী — দেশ",
    type: "select",
    match: {
        any: [ "country region", "country" ],
        all: [ "permanent" ]
    }
}, {
    key: "permState",
    suggest: BD_DIVISIONS,
    label: "Permanent Address — State / Province",
    labelBn: "Permanent Address — State / Province",
    type: "select",
    match: {
        any: [ "state province district", "state province", "state" ],
        all: [ "permanent" ]
    }
}, {
    key: "permDistrict",
    label: "Permanent Address — District",
    labelBn: "Permanent Address — District",
    type: "text",
    upper: true,
    match: {
        any: [ "district" ],
        all: [ "permanent" ]
    }
}, {
    key: "permPostal",
    label: "Permanent Address — Postal Code",
    labelBn: "Permanent Address — Postal Code",
    type: "text",
    match: {
        any: [ "postal zip code", "postal code", "zip code", "pincode" ],
        all: [ "permanent" ]
    }
}, {
    key: "permPhone",
    label: "Permanent Address — Phone",
    labelBn: "Permanent Address — Phone",
    type: "tel",
    match: {
        any: [ "phone number", "phone no", "telephone", "phone" ],
        all: [ "permanent" ]
    }
} ]), G("family", "Family Details", "Family Details", "👨‍👩‍👧", [ {
    key: "fatherName",
    nameSafe: true,
    label: "Father's Name",
    labelBn: "Father's Name",
    type: "text",
    upper: true,
    match: {
        any: [ "father s name", "father name", "name of father" ],
        all: [ "father" ]
    }
}, {
    key: "fatherNationality",
    suggest: NATIONALITIES,
    label: "Father's Nationality",
    labelBn: "Father's Nationality",
    type: "select",
    match: {
        any: [ "nationality" ],
        all: [ "father" ],
        not: [ "previous" ]
    }
}, {
    key: "fatherPrevNationality",
    suggest: NATIONALITIES,
    label: "Father's Previous Nationality",
    labelBn: "Father's Previous Nationality",
    type: "select",
    match: {
        any: [ "previous nationality" ],
        all: [ "father" ]
    }
}, {
    key: "fatherPlaceOfBirth",
    label: "Father's Place of Birth",
    labelBn: "Father's Place of Birth",
    type: "text",
    upper: true,
    match: {
        any: [ "place of birth", "town city of birth" ],
        all: [ "father" ],
        not: [ "country" ]
    }
}, {
    key: "fatherCountryOfBirth",
    suggest: NATIONALITIES,
    label: "Father's Country of Birth",
    labelBn: "Father's Country of Birth",
    type: "select",
    match: {
        any: [ "country of birth" ],
        all: [ "father" ]
    }
}, {
    key: "motherName",
    nameSafe: true,
    label: "Mother's Name",
    labelBn: "Mother's Name",
    type: "text",
    upper: true,
    match: {
        any: [ "mother s name", "mother name", "name of mother" ]
    }
}, {
    key: "motherNationality",
    suggest: NATIONALITIES,
    label: "Mother's Nationality",
    labelBn: "Mother's Nationality",
    type: "select",
    match: {
        any: [ "nationality" ],
        all: [ "mother" ],
        not: [ "previous" ]
    }
}, {
    key: "motherPrevNationality",
    suggest: NATIONALITIES,
    label: "Mother's Previous Nationality",
    labelBn: "Mother's Previous Nationality",
    type: "select",
    match: {
        any: [ "previous nationality" ],
        all: [ "mother" ]
    }
}, {
    key: "motherPlaceOfBirth",
    label: "Mother's Place of Birth",
    labelBn: "Mother's Place of Birth",
    type: "text",
    upper: true,
    match: {
        any: [ "place of birth", "town city of birth" ],
        all: [ "mother" ],
        not: [ "country" ]
    }
}, {
    key: "motherCountryOfBirth",
    suggest: NATIONALITIES,
    label: "Mother's Country of Birth",
    labelBn: "Mother's Country of Birth",
    type: "select",
    match: {
        any: [ "country of birth" ],
        all: [ "mother" ]
    }
}, {
    key: "maritalStatus",
    label: "Marital Status",
    labelBn: "Marital Status",
    type: "select",
    opts: MARITAL_STATUSES,
    match: {
        any: [ "marital status" ]
    }
}, {
    key: "spouseName",
    nameSafe: true,
    label: "Spouse's Name",
    labelBn: "Spouse's Name",
    type: "text",
    upper: true,
    match: {
        any: [ "spouse s name", "spouse name", "name of spouse", "husband wife name" ],
        all: [ "spouse" ]
    }
}, {
    key: "spouseNationality",
    suggest: NATIONALITIES,
    label: "Spouse's Nationality",
    labelBn: "Spouse's Nationality",
    type: "select",
    match: {
        any: [ "nationality" ],
        all: [ "spouse" ],
        not: [ "previous" ]
    }
}, {
    key: "spousePrevNationality",
    suggest: NATIONALITIES,
    label: "Spouse's Previous Nationality",
    labelBn: "Spouse's Previous Nationality",
    type: "select",
    match: {
        any: [ "previous nationality" ],
        all: [ "spouse" ]
    }
}, {
    key: "spousePlaceOfBirth",
    label: "Spouse's Place of Birth",
    labelBn: "Spouse's Place of Birth",
    type: "text",
    upper: true,
    match: {
        any: [ "place of birth", "town city of birth" ],
        all: [ "spouse" ],
        not: [ "country" ]
    }
}, {
    key: "spouseCountryOfBirth",
    suggest: NATIONALITIES,
    label: "Spouse's Country of Birth",
    labelBn: "Spouse's Country of Birth",
    type: "select",
    match: {
        any: [ "country of birth" ],
        all: [ "spouse" ]
    }
}, {
    key: "grandparentsPak",
    label: "Were grandparents Pakistan nationals?",
    labelBn: "Were grandparents Pakistan nationals?",
    type: "yn",
    match: {
        any: [ "grand parents", "grandparents", "pakistan national" ]
    }
}, {
    key: "grandparentsDetails",
    label: "Grandparents — details",
    labelBn: "Grandparents — details",
    type: "textarea",
    match: {
        any: [ "if yes give details", "grandparents details" ]
    }
} ]), G("occupation", "Profession / Occupation", "Profession / Occupation", "💼", [ {
    key: "occupation",
    suggest: OCCUPATIONS,
    label: "Present Occupation",
    labelBn: "Present Occupation",
    type: "select",
    match: {
        any: [ "present occupation", "occupation" ],
        not: [ "past", "previous", "spouse" ]
    }
}, {
    key: "occupationOther",
    label: "Occupation (if Others)",
    labelBn: "পেশা (অন্যান্য হলে)",
    type: "text",
    upper: true,
    match: {
        any: [ "occupation other", "if others specify", "other occupation" ]
    }
}, {
    key: "employerName",
    nameSafe: true,
    label: "Employer Name / Business",
    labelBn: "Employer Name / Business",
    type: "text",
    upper: true,
    match: {
        any: [ "employer name", "name of employer", "company name", "organization name", "organisation name", "business name" ],
        not: [ "past" ]
    }
}, {
    key: "designation",
    label: "Designation",
    labelBn: "Designation",
    type: "text",
    upper: true,
    match: {
        any: [ "designation" ],
        not: [ "past", "military" ]
    }
}, {
    key: "employerAddress",
    label: "Employer Address",
    labelBn: "Employer Address",
    type: "textarea",
    upper: true,
    match: {
        any: [ "employer address", "address of employer", "office address", "company address" ]
    }
}, {
    key: "employerPhone",
    label: "Employer Phone",
    labelBn: "Employer Phone",
    type: "tel",
    match: {
        any: [ "phone" ],
        all: [ "employer" ]
    }
}, {
    key: "pastOccupation",
    suggest: OCCUPATIONS,
    label: "Past Occupation (if any)",
    labelBn: "Past Occupation (if any)",
    type: "text",
    upper: true,
    match: {
        any: [ "past occupation", "previous occupation", "earlier occupation" ]
    }
}, {
    key: "militaryService",
    label: "Were you in Military / Police / Security?",
    labelBn: "সামরিক / পুলিশ / নিরাপত্তা বাহিনীতে ছিলেন?",
    type: "yn",
    match: {
        any: [ "military semi military police security", "military police", "military" ]
    }
}, {
    key: "militaryOrg",
    label: "Military — Organization",
    labelBn: "সামরিক সংস্থা",
    type: "text",
    upper: true,
    match: {
        any: [ "organization", "organisation" ],
        all: [ "military" ]
    }
}, {
    key: "militaryDesignation",
    label: "Military — Designation",
    labelBn: "সামরিক পদবি",
    type: "text",
    upper: true,
    match: {
        any: [ "designation" ],
        all: [ "military" ]
    }
}, {
    key: "militaryRank",
    label: "Military — Rank",
    labelBn: "সামরিক র‍্যাংক",
    type: "text",
    upper: true,
    match: {
        any: [ "rank" ]
    }
}, {
    key: "militaryPosting",
    label: "Military — Place of Posting",
    labelBn: "পোস্টিং স্থান",
    type: "text",
    upper: true,
    match: {
        any: [ "place of posting", "posting" ]
    }
}, {
    key: "occupationDetailsOf",
    label: "Specify occupation details of",
    labelBn: "কার পেশার তথ্য দেবেন",
    type: "select",
    opts: [ "SPOUSE", "FATHER", "MOTHER", "SELF" ],
    hint: "House wife / student / minor holey kar peshar tottho debe",
    match: {
        any: [ "specify below occupation details of", "occupation details of" ]
    }
} ]), G("reference", "References & Travel", "References & Travel", "📍", [ {
    key: "refIndiaName",
    nameSafe: true,
    label: "Reference in India — Name",
    labelBn: "Reference in India — Name",
    type: "text",
    upper: true,
    match: {
        any: [ "name" ],
        all: [ "india", "reference" ]
    }
}, {
    key: "refIndiaAddress",
    label: "Reference in India — Address",
    labelBn: "Reference in India — Address",
    type: "textarea",
    upper: true,
    match: {
        any: [ "address" ],
        all: [ "india", "reference" ]
    }
}, {
    key: "refIndiaState",
    label: "Reference in India — State",
    labelBn: "ভারতের রেফারেন্স — রাজ্য",
    type: "select",
    match: {
        any: [ "state" ],
        all: [ "india", "reference" ]
    }
}, {
    key: "refIndiaDistrict",
    label: "Reference in India — District",
    labelBn: "ভারতের রেফারেন্স — জেলা",
    type: "select",
    match: {
        any: [ "district" ],
        all: [ "india", "reference" ]
    }
}, {
    key: "refIndiaPhone",
    label: "Reference in India — Phone",
    labelBn: "Reference in India — Phone",
    type: "tel",
    match: {
        any: [ "phone", "mobile" ],
        all: [ "india", "reference" ]
    }
}, {
    key: "refHomeName",
    nameSafe: true,
    label: "Reference in Bangladesh — Name",
    labelBn: "Reference in Bangladesh — Name",
    type: "text",
    upper: true,
    match: {
        any: [ "name" ],
        all: [ "reference" ],
        not: [ "india" ]
    }
}, {
    key: "refHomeAddress",
    label: "Reference in Bangladesh — Address",
    labelBn: "Reference in Bangladesh — Address",
    type: "textarea",
    upper: true,
    match: {
        any: [ "address" ],
        all: [ "reference" ],
        not: [ "india" ]
    }
}, {
    key: "refHomeAddress2",
    label: "Reference in Bangladesh — Address line 2",
    labelBn: "রেফারেন্সের ঠিকানা (২য় লাইন)",
    type: "text",
    upper: true,
    match: {
        all: [ "reference" ],
        any: [ "address line 2" ]
    }
}, {
    key: "refHomePhone",
    label: "Reference in Bangladesh — Phone",
    labelBn: "Reference in Bangladesh — Phone",
    type: "tel",
    match: {
        any: [ "phone", "mobile" ],
        all: [ "reference" ],
        not: [ "india" ]
    }
} ]), G("application", "Visa Application (nic.in)", "ভিসা আবেদন (nic.in)", "🛂", [ {
    key: "visaPurpose",
    label: "Visiting India for (purpose)",
    labelBn: "ভারতে যাওয়ার উদ্দেশ্য",
    type: "select",
    opts: VISA_PURPOSES,
    hint: "Rugi = MEDICAL VISA (M1), sathe jara jaben = MEDICAL VISA (M2)",
    match: {
        any: [ "visiting india for", "purpose of visit", "select purpose", "purpose" ]
    }
}, {
    key: "arrivalDate",
    label: "Expected Date of Arrival",
    labelBn: "ভারতে পৌঁছার সম্ভাব্য তারিখ",
    type: "date",
    hint: "DD/MM/YYYY",
    match: {
        any: [ "expected date of arrival", "date of journey", "date of arrival", "journey date" ],
        not: [ "exit", "departure" ]
    }
}, {
    key: "mission",
    label: "Indian Mission / Office",
    labelBn: "ইন্ডিয়ান মিশন",
    type: "select",
    opts: [ "DHAKA", "CHITTAGONG", "KHULNA", "RAJSHAHI", "SYLHET" ],
    match: {
        any: [ "indian mission office", "indian mission", "mission office", "mission" ]
    }
}, {
    key: "durationDays",
    label: "Duration of Visa (MONTHS)",
    labelBn: "ভিসার মেয়াদ (মাস)",
    type: "text",
    hint: "In months, e.g. 3. Must cover from the visa issue date to the end of treatment — validity starts at issue, not at arrival.",
    match: {
        any: [ "duration of visa", "visa duration", "duration in month", "duration" ]
    }
}, {
    key: "noOfEntries",
    label: "No. of Entries",
    labelBn: "কতবার প্রবেশ",
    type: "select",
    opts: [ "SINGLE", "DOUBLE", "TRIPLE", "MULTIPLE" ],
    match: {
        any: [ "no of entries", "number of entries", "no of entry", "entries" ]
    }
}, {
    key: "portOfArrival",
    suggest: PORTS,
    label: "Port of Arrival in India",
    labelBn: "প্রবেশ বন্দর",
    type: "text",
    upper: true,
    hint: "BENAPOLE / HARIDASPUR / GEDE / AKHAURA / DELHI AIRPORT …",
    match: {
        any: [ "port of arrival", "expected port of entry", "port of entry", "arrival port" ],
        not: [ "exit" ]
    }
}, {
    key: "portOfExit",
    suggest: PORTS,
    label: "Port of Exit from India",
    labelBn: "বহির্গমন বন্দর",
    type: "text",
    upper: true,
    match: {
        any: [ "port of exit", "exit point from india", "port of departure" ]
    }
}, {
    key: "placesToVisit",
    label: "Places to be visited",
    labelBn: "যে স্থানগুলোতে যাবেন",
    type: "text",
    upper: true,
    match: {
        any: [ "places to be visited", "places likely to be visited", "cities to be visited" ]
    }
} ]), G("medical", "Medical Visa Details", "মেডিকেল ভিসার তথ্য", "🏥", [ {
    key: "medicalRole",
    label: "Patient or Attendant?",
    labelBn: "রোগী না অ্যাটেনডেন্ট?",
    type: "select",
    opts: [ "PATIENT", "MEDICAL ATTENDANT" ],
    hint: "Rugi = MEDICAL VISA, songe jara jaben = MEDICAL ATTENDANT VISA",
    match: {
        any: [ "patient or attendant", "applicant type" ]
    }
}, {
    key: "attendantOf",
    nameSafe: true,
    label: "Patient name (if attendant)",
    labelBn: "রোগীর নাম (অ্যাটেনডেন্ট হলে)",
    type: "text",
    upper: true,
    match: {
        any: [ "patient name", "name of patient", "name of the patient" ]
    }
}, {
    key: "attendantOfPassport",
    label: "Patient's passport no.",
    labelBn: "রোগীর পাসপোর্ট নম্বর",
    type: "text",
    upper: true,
    match: {
        any: [ "patient passport", "passport no of patient" ]
    }
}, {
    key: "illness",
    label: "Nature of illness / treatment",
    labelBn: "রোগ / চিকিৎসার ধরন",
    type: "text",
    upper: true,
    match: {
        any: [ "nature of illness", "illness", "ailment", "treatment" ]
    }
}, {
    key: "hospitalName",
    label: "Hospital / Institute name (India)",
    labelBn: "হাসপাতালের নাম (ভারত)",
    type: "text",
    upper: true,
    match: {
        any: [ "name of the hospital", "hospital name", "name of hospital", "institute name" ]
    }
}, {
    key: "hospitalAddress",
    label: "Hospital address",
    labelBn: "হাসপাতালের ঠিকানা",
    type: "textarea",
    upper: true,
    match: {
        any: [ "address of the hospital", "hospital address" ]
    }
}, {
    key: "hospitalCity",
    label: "Hospital city",
    labelBn: "হাসপাতালের শহর",
    type: "text",
    upper: true,
    match: {
        any: [ "hospital city", "city of hospital" ]
    }
}, {
    key: "doctorName",
    label: "Consulting doctor",
    labelBn: "ডাক্তারের নাম",
    type: "text",
    upper: true,
    match: {
        any: [ "doctor name", "name of doctor", "consulting doctor" ]
    }
}, {
    key: "hospitalPhone",
    label: "Hospital phone / fax",
    labelBn: "হাসপাতালের ফোন",
    type: "tel",
    match: {
        any: [ "phone fax", "hospital phone" ]
    }
}, {
    key: "hospitalEmail",
    label: "Hospital email",
    labelBn: "হাসপাতালের ইমেইল",
    type: "email",
    match: {
        any: [ "email" ],
        all: [ "hospital" ]
    }
}, {
    key: "medicalCertNo",
    label: "Medical certificate / appointment letter no.",
    labelBn: "মেডিকেল সার্টিফিকেট নম্বর",
    type: "text",
    upper: true,
    match: {
        any: [ "medical certificate no", "certificate no", "appointment letter no" ]
    }
}, {
    key: "homeHospitalName",
    label: "Hospital in Bangladesh — name",
    labelBn: "দেশের হাসপাতালের নাম",
    type: "text",
    upper: true,
    match: {
        all: [ "residence" ],
        any: [ "hospital name" ]
    }
}, {
    key: "homeHospitalAddress",
    label: "Hospital in Bangladesh — address",
    labelBn: "দেশের হাসপাতালের ঠিকানা",
    type: "textarea",
    upper: true,
    match: {
        all: [ "residence" ],
        any: [ "address" ]
    }
}, {
    key: "homeDoctorName",
    label: "Hospital in Bangladesh — doctor",
    labelBn: "দেশের ডাক্তারের নাম",
    type: "text",
    upper: true,
    match: {
        all: [ "residence" ],
        any: [ "doctor name" ]
    }
}, {
    key: "homeHospitalPhone",
    label: "Hospital in Bangladesh — phone",
    labelBn: "দেশের হাসপাতালের ফোন",
    type: "tel",
    match: {
        all: [ "residence" ],
        any: [ "phone" ]
    }
}, {
    key: "homeHospitalEmail",
    label: "Hospital in Bangladesh — email",
    labelBn: "দেশের হাসপাতালের ইমেইল",
    type: "email",
    match: {
        all: [ "residence" ],
        any: [ "email" ]
    }
}, {
    key: "hasPreviousVisa",
    label: "Held an Indian visa before?",
    labelBn: "আগে ভারতীয় ভিসা ছিল?",
    type: "radioYN",
    match: {
        any: [ "previous visa", "currently valid visa" ]
    }
}, {
    key: "visaRefused",
    label: "Ever refused an Indian visa?",
    labelBn: "কখনো ভিসা প্রত্যাখ্যাত হয়েছে?",
    type: "radioYN",
    match: {
        any: [ "refused", "refusal" ]
    }
}, {
    key: "saarcVisited",
    label: "Visited any SAARC country (last 3 years)?",
    labelBn: "SAARC দেশে গিয়েছেন?",
    type: "radioYN",
    match: {
        any: [ "saarc" ]
    }
}, {
    key: "oldVisaNo",
    label: "Previous Indian visa number",
    labelBn: "আগের ভারতীয় ভিসা নম্বর",
    type: "text",
    upper: true,
    match: {
        all: [ "visa" ],
        any: [ "last indian visa", "old visa no", "previous visa no" ]
    }
}, {
    key: "oldVisaType",
    suggest: VISA_TYPES,
    label: "Previous visa — type",
    labelBn: "আগের ভিসার ধরন",
    type: "text",
    upper: true,
    match: {
        all: [ "type" ],
        any: [ "type of visa" ]
    }
}, {
    key: "oldVisaIssuePlace",
    label: "Previous visa — place of issue",
    labelBn: "আগের ভিসা কোথায় ইস্যু",
    type: "text",
    upper: true,
    match: {
        any: [ "place of issue" ]
    }
}, {
    key: "oldVisaIssueDate",
    label: "Previous visa — date of issue",
    labelBn: "আগের ভিসার ইস্যু তারিখ",
    type: "date",
    match: {
        any: [ "date of issue" ]
    }
}, {
    key: "prevVisitAddress",
    label: "Address stayed at on the previous visit",
    labelBn: "আগের সফরের ঠিকানা",
    type: "text",
    upper: true,
    match: {
        all: [ "previous" ],
        any: [ "address" ]
    }
}, {
    key: "refuseDetails",
    label: "If refused — when and by whom",
    labelBn: "প্রত্যাখ্যাত হলে — কবে ও কার দ্বারা",
    type: "text",
    upper: true,
    match: {
        any: [ "when and by whom" ]
    }
}, {
    key: "countriesVisited",
    label: "Countries visited in the last 10 years",
    labelBn: "গত ১০ বছরে যেসব দেশে গিয়েছেন",
    type: "text",
    upper: true,
    match: {
        any: [ "countries visited" ]
    }
}, {
    key: "stayName",
    nameSafe: false,
    label: "Place / Name of Hotel in India",
    labelBn: "ভারতে থাকার জায়গার নাম",
    type: "text",
    upper: true,
    match: {
        any: [ "name of hotel", "place of stay", "place/ name of hotel" ]
    }
}, {
    key: "stayAddress",
    label: "Address of place / hotel",
    labelBn: "থাকার জায়গার ঠিকানা",
    type: "text",
    upper: true,
    match: {
        all: [ "hotel" ],
        any: [ "address" ]
    }
}, {
    key: "stayState",
    label: "Place of stay — State",
    labelBn: "থাকার রাজ্য",
    type: "text",
    upper: true,
    match: {
        all: [ "stay" ],
        any: [ "state" ]
    }
}, {
    key: "stayDistrict",
    label: "Place of stay — District",
    labelBn: "থাকার জেলা",
    type: "text",
    upper: true,
    match: {
        all: [ "stay" ],
        any: [ "district" ]
    }
}, {
    key: "stayPhone",
    label: "Place of stay — Telephone",
    labelBn: "থাকার জায়গার ফোন",
    type: "tel",
    match: {
        all: [ "stay" ],
        any: [ "telephone", "phone" ]
    }
}, {
    key: "stayEmail",
    label: "Place of stay — Email",
    labelBn: "থাকার জায়গার ইমেইল",
    type: "email",
    match: {
        all: [ "stay" ],
        any: [ "email" ]
    }
}, {
    key: "attendantOfDob",
    label: "Patient — date of birth",
    labelBn: "রোগীর জন্মতারিখ",
    type: "date",
    match: {
        all: [ "patient" ],
        any: [ "date of birth" ]
    }
}, {
    key: "attendantOfNationality",
    suggest: NATIONALITIES,
    label: "Patient — nationality",
    labelBn: "রোগীর জাতীয়তা",
    type: "text",
    upper: true,
    match: {
        all: [ "patient" ],
        any: [ "nationality" ]
    }
}, {
    key: "attendantRelationship",
    label: "You are the patient's…",
    labelBn: "রোগীর সম্পর্কে আপনি",
    type: "text",
    upper: true,
    hint: "SPOUSE, MOTHER, MOTHER IN LAW, SON — as the invitation letter puts it",
    match: {
        all: [ "relationship" ],
        any: [ "patient" ]
    }
}, {
    key: "attendantOfApplicationId",
    label: "Patient — Application Id",
    labelBn: "রোগীর Application Id",
    type: "text",
    upper: true,
    hint: "The 12-character id from the patient's registered application",
    match: {
        all: [ "patient" ],
        any: [ "application id" ]
    }
}, {
    key: "decArrested",
    label: "Ever arrested / prosecuted / convicted?",
    labelBn: "কখনো গ্রেপ্তার/দণ্ডিত হয়েছেন?",
    type: "radioYN",
    match: {
        any: [ "arrested", "prosecuted", "convicted" ]
    }
}, {
    key: "decDeported",
    label: "Ever refused entry or deported?",
    labelBn: "কখনো প্রবেশে বাধা/নির্বাসন?",
    type: "radioYN",
    match: {
        any: [ "refused entry", "deported" ]
    }
}, {
    key: "decTrafficking",
    label: "Ever engaged in trafficking / abuse / fraud?",
    labelBn: "পাচার/নির্যাতন/জালিয়াতিতে জড়িত?",
    type: "radioYN",
    match: {
        any: [ "human trafficking", "drug trafficking", "child abuse", "financial fraud" ]
    }
}, {
    key: "decTerrorism",
    label: "Ever engaged in terrorism / espionage / violence?",
    labelBn: "সন্ত্রাস/গুপ্তচরবৃত্তি/সহিংসতায় জড়িত?",
    type: "radioYN",
    match: {
        any: [ "cyber crime", "terrorist activities", "sabotage", "espionage", "genocide" ]
    }
}, {
    key: "decGlorifyTerror",
    label: "Ever expressed views glorifying terrorism?",
    labelBn: "সন্ত্রাসের সমর্থনে মত প্রকাশ?",
    type: "radioYN",
    match: {
        any: [ "glorify", "justify or glorify" ]
    }
}, {
    key: "decAsylum",
    label: "Ever sought asylum anywhere?",
    labelBn: "কোথাও আশ্রয় চেয়েছেন?",
    type: "radioYN",
    match: {
        any: [ "sought asylum", "asylum" ]
    }
}, {
    key: "decVerified",
    label: "Tick the final declaration",
    labelBn: "শেষের ঘোষণায় টিক",
    type: "yn",
    hint: 'Yes ticks the "I hereby declare..." box for you; blank leaves it for you to tick',
    match: {
        any: [ "hereby declare", "verify questions" ]
    }
} ]), G("travel", TRAVEL_TITLE[0], TRAVEL_TITLE[1], "✈️", [ {
    key: "photoCrop",
    label: "Where the face sits in the photo",
    labelBn: "ছবিতে মুখ কোথায়",
    type: "select",
    opts: [ "TOP", "UPPER", "CENTRE", "LOWER" ],
    hint: "বেশিরভাগ ছবিতে UPPER — মাথা উপরের দিকে থাকে। পুরো ছবিজুড়ে মুখ থাকলে CENTRE।",
    match: {
        any: [ "crop", "photo position" ]
    }
}, {
    key: "stayDays",
    label: "Days you will stay in India",
    labelBn: "ভারতে কত দিন থাকবেন",
    type: "text",
    hint: 'ইনভাইটেশন লেটারে "Tentative duration of Stay(Days)" যা লেখা, সেটাই। আন্ডারটেকিং ফর্মে ফেরার তারিখ এখান থেকেই হিসাব হয়।',
    match: {
        any: [ "duration of stay", "days of stay" ]
    }
}, {
    key: "isdCode",
    label: "Your phone ISD code",
    labelBn: "আপনার ফোনের ISD কোড",
    type: "text",
    hint: "বাংলাদেশের জন্য 880। e-Arrival কার্ডে মোবাইল নম্বরের আগে আলাদা ঘরে বসাতে হয়।",
    match: {
        any: [ "isd code", "country code" ]
    }
}, {
    key: "emergencyPhone",
    label: "Emergency contact number",
    labelBn: "জরুরি যোগাযোগের নম্বর",
    type: "text",
    hint: "দেশে থাকা কারও নম্বর, যাঁকে দরকার হলে ফোন করা যাবে। e-Arrival কার্ডে ঐচ্ছিক, তবু দেওয়া ভালো।",
    match: {
        any: [ "emergency contact", "emergency number" ]
    }
}, {
    key: "airline",
    suggest: AIRLINES,
    label: "Airline",
    labelBn: "এয়ারলাইন",
    type: "text",
    upper: true,
    hint: "যে এয়ারলাইনে যাচ্ছেন — যেমন BIMAN BANGLADESH, US-BANGLA। আকাশপথে না গেলে খালি থাক।",
    match: {
        any: [ "airline", "carrier" ]
    }
}, {
    key: "flightNo",
    label: "Flight number",
    labelBn: "ফ্লাইট নম্বর",
    type: "text",
    upper: true,
    hint: "টিকিটে লেখা নম্বর — যেমন BG391।",
    match: {
        any: [ "flight number", "flight no" ]
    }
}, {
    key: "seatNo",
    label: "Seat number",
    labelBn: "সিট নম্বর",
    type: "text",
    upper: true,
    hint: "বোর্ডিং পাস পাওয়ার পরেই কেবল জানা যায়। Air Suvidha ছাড়া আর কোথাও লাগে না।",
    match: {
        any: [ "seat number", "seat no" ]
    }
}, {
    key: "boardingAirport",
    label: "Boarding airport",
    labelBn: "যে বিমানবন্দর থেকে উঠবেন",
    type: "text",
    upper: true,
    hint: "সাধারণত DHAKA (DAC)।",
    match: {
        any: [ "boarding airport", "port of boarding", "departure airport" ]
    }
}, {
    key: "arrivalTime",
    suggest: HOURS,
    label: "Arrival time in India",
    labelBn: "ভারতে পৌঁছানোর সময়",
    type: "text",
    hint: "টিকিটে লেখা সময়, ২৪ ঘণ্টার হিসাবে — যেমন 14:30।",
    match: {
        any: [ "arrival time", "time of arrival" ]
    }
}, {
    key: "departureDate",
    label: "Date you leave Bangladesh",
    labelBn: "বাংলাদেশ ছাড়ার তারিখ",
    type: "date",
    hint: "স্থলবন্দরের যাত্রী ফি এই তারিখ ধরে কাটা হয়। সাধারণত যাত্রার তারিখটাই।",
    match: {
        any: [ "departure date", "date of departure" ]
    }
}, {
    key: "landPort",
    label: "Land port",
    labelBn: "স্থলবন্দর",
    type: "select",
    opts: [ "BENAPOLE", "BANGLABANDHA", "BURIMARI", "NAKUGAON" ],
    hint: "স্থলপথে গেলে কোন বন্দর দিয়ে। আকাশপথে গেলে খালি থাক।",
    match: {
        any: [ "land port", "departure port", "arrival port" ]
    }
}, {
    key: "transportType",
    label: "How you travel",
    labelBn: "কীভাবে যাচ্ছেন",
    type: "select",
    opts: [ "AIR", "LAND", "WATER" ],
    hint: "ভ্রমণ করের অঙ্ক এটার উপর নির্ভর করে — সোনালী ব্যাংকের পাতা নিজেই হিসাব করে দেয়।",
    match: {
        any: [ "transport type", "mode of travel" ]
    }
}, {
    key: "passengerType",
    label: "Passenger type",
    labelBn: "যাত্রীর ধরন",
    type: "select",
    opts: [ "ADULT", "CHILDREN" ],
    hint: "১২ বছরের নিচে হলে CHILDREN, নইলে ADULT।",
    match: {
        any: [ "passenger type" ]
    }
}, {
    key: "travelTaxAmount",
    label: "Travel tax amount (BDT)",
    labelBn: "ভ্রমণ কর (টাকা)",
    type: "text",
    hint: "NBR-এর বর্তমান হার। খালি রাখলে সোনালী ব্যাংকের পাতাই বসিয়ে দেবে — এখানে কোনো হার অনুমান করা হয় না।",
    match: {
        any: [ "amount in bdt", "travel tax" ]
    }
} ]) ];

export const FIELDS = (() => {
    const m = {};
    for (const g of GROUPS) for (const f of g.fields) m[f.key] = {
        ...f,
        group: g.id,
        groupTitle: g.title
    };
    return m;
})();

export const FIELD_KEYS = Object.keys(FIELDS);

export const DECLARATION_DEFAULTS = {
    decArrested: "No",
    decDeported: "No",
    decTrafficking: "No",
    decTerrorism: "No",
    decGlorifyTerror: "No",
    decAsylum: "No",
    countryOfBirth: "BANGLADESH",
    nationality: "BANGLADESH",
    nationalityBy: "BY BIRTH",
    presentCountry: "BANGLADESH",
    permCountry: "BANGLADESH",
    passportCountryOfIssue: "BANGLADESH",
    passportType: "ORDINARY PASSPORT",
    isdCode: "880"
};

export function emptyProfile(name = "New Applicant") {
    const data = {};
    for (const k of FIELD_KEYS) data[k] = "";
    Object.assign(data, DECLARATION_DEFAULTS);
    return {
        id: "p_" + Math.random().toString(36).slice(2, 10),
        name: name,
        color: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)],
        updatedAt: 0,
        data: data,
        files: []
    };
}

export const PROFILE_COLORS = [ "#ff7a18", "#2f7cf6", "#12b981", "#a855f7", "#ef4444", "#0ea5e9" ];

export const SMART_DEFAULTS = {
    nationality: "BANGLADESH",
    presentCountry: "BANGLADESH",
    countryOfBirth: "BANGLADESH",
    passportCountryOfIssue: "BANGLADESH",
    fatherNationality: "BANGLADESH",
    motherNationality: "BANGLADESH",
    spouseNationality: "BANGLADESH",
    religion: "ISLAM",
    gender: "MALE",
    visaType: "TOURIST VISA",
    photoCrop: "UPPER",
    isdCode: "880",
    boardingAirport: "DHAKA (DAC)",
    passengerType: "ADULT"
};

export function normalise(s) {
    return String(s || "").toLowerCase().replace(/[—–־‑]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}
