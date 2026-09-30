const ISO3 = {
    BANGLADESH: "BGD",
    INDIA: "IND",
    NEPAL: "NPL",
    "SRI LANKA": "LKA",
    PAKISTAN: "PAK",
    BHUTAN: "BTN",
    MALDIVES: "MDV"
};

const yes = v => /^(y|yes|true|1)$/i.test(String(v || "").trim());

function hostOf(d) {
    try {
        return (d.defaultView && d.defaultView.location || d.location || {}).host || "";
    } catch (_) {
        return "";
    }
}

const pageText = (d, n = 4e3) => (d.body && (d.body.innerText || d.body.textContent) || "").slice(0, n);

const EARRIVAL_PURPOSES = {
    "MEDICAL VISA": "MEDICAL",
    "MEDICAL VISA (M1)": "MEDICAL",
    "MEDICAL VISA (M2)": "MEDICAL",
    "MEDICAL VISA (M3)": "MEDICAL",
    "MEDICAL VISA (M4)": "MEDICAL",
    "MEDICAL ATTENDANT VISA": "MEDICAL",
    M1: "MEDICAL",
    M2: "MEDICAL",
    M3: "MEDICAL",
    M4: "MEDICAL",
    "TOURIST VISA": "TOURIST",
    "TOURIST VISA (T1)": "TOURIST",
    T1: "TOURIST",
    "BUSINESS VISA": "BUSINESS",
    "BUSINESS VISA (B1)": "BUSINESS",
    "BUSINESS VISA (B5)": "BUSINESS",
    B1: "BUSINESS",
    B5: "BUSINESS",
    "STUDENT VISA": "STUDENT",
    "STUDENT VISA (S1)": "STUDENT",
    S1: "STUDENT",
    "CONFERENCE VISA": "CONFERENCE"
};

const LAND_PORTS = {
    BENAPOLE: "1",
    BANGLABANDHA: "2",
    BURIMARI: "3",
    NAKUGAON: "4"
};

const MISSION_CODES = {
    DHAKA: "BGDD",
    "BANGLADESH-DHAKA": "BGDD",
    CHITTAGONG: "BGDC",
    CHATTOGRAM: "BGDC",
    "BANGLADESH-CHITTAGONG": "BGDC",
    KHULNA: "BGDK",
    "BANGLADESH-KHULNA": "BGDK",
    RAJSHAHI: "BGDR",
    "BANGLADESH-RAJSHAHI": "BGDR",
    SYLHET: "BGDS",
    "BANGLADESH-SYLHET": "BGDS"
};

const PURPOSE_VALUES = {
    "MEDICAL VISA (M1)": "545",
    "MEDICAL VISA (M2)": "546",
    "MEDICAL VISA (M3)": "530",
    "MEDICAL VISA (M4)": "531",
    "TOURIST VISA (T1)": "544",
    "BUSINESS VISA (B1)": "537",
    "BUSINESS VISA (B5)": "502",
    "STUDENT VISA (S1)": "540",
    "TRANSIT VISA (TR)": "233",
    M1: "545",
    M2: "546",
    M3: "530",
    M4: "531",
    T1: "544",
    B1: "537",
    B5: "502",
    S1: "540",
    TR: "233"
};

export const PORTAL_PAGES = [ {
    id: "home",
    title: "Visa Registration (start page)",
    titleBn: "ভিসা রেজিস্ট্রেশন (শুরুর পাতা)",
    match: d => !!(d.getElementById("countryname_id") && d.getElementById("email_id")),
    fields: [ {
        ids: [ "countryname_id", 'select[name="appl.countryname"]' ],
        value: "BANGLADESH",
        kind: "selectText",
        codes: ISO3,
        pause: 500
    }, {
        ids: [ "missioncode_id", 'select[name="appl.missioncode"]' ],
        key: "mission",
        kind: "selectText",
        codes: MISSION_CODES,
        waitOpts: true,
        pause: 400
    }, {
        ids: [ "nationality_id", 'select[name="appl.nationality"]' ],
        key: "nationality",
        kind: "selectText",
        codes: ISO3,
        waitOpts: true,
        sticky: true
    }, {
        ids: [ "dob_id", 'input[name="appl.birthdate"]' ],
        key: "dob",
        kind: "date"
    }, {
        ids: [ "email_id", 'input[name="appl.email"]' ],
        key: "presentEmail",
        kind: "text"
    }, {
        ids: [ "email_re_id", 'input[name="appl.email_re"]' ],
        key: "presentEmail",
        kind: "text"
    }, {
        ids: [ "jouryney_id", 'input[name="appl.journeydate"]' ],
        key: "arrivalDate",
        kind: "date",
        sticky: true
    }, {
        ids: [ "visaPurposeDropdown", 'select[name="appl.purpose"]' ],
        key: "visaPurpose",
        kind: "selectText",
        codes: PURPOSE_VALUES,
        waitOpts: true,
        sticky: true
    } ]
}, {
    id: "reprint",
    title: "Reprint Form (get the web file)",
    titleBn: "রিপ্রিন্ট ফর্ম (ওয়েব ফাইল)",
    match: d => !!(d.getElementById("application_id") && d.getElementById("missioncode_id_reprint")),
    fields: [ {
        ids: [ "visa_type2" ],
        value: "YES",
        kind: "checkbox"
    }, {
        ids: [ "missioncode_id_reprint" ],
        key: "mission",
        kind: "selectText",
        codes: MISSION_CODES,
        sticky: true
    }, {
        ids: [ "application_id" ],
        key: "applicationId",
        fallbackKey: "webFileNumber",
        kind: "text"
    }, {
        ids: [ "dob_id" ],
        key: "dob",
        kind: "date"
    }, {
        ids: [ "passport_no" ],
        key: "passportNo",
        kind: "text"
    } ]
}, {
    id: "stay",
    title: "Visit Details (place of stay in India)",
    titleBn: "ভারতে থাকার ঠিকানা",
    match: d => !!(d.getElementById("place_of_stay1") && d.getElementById("pos_state_id1")),
    fields: [ {
        ids: [ "place_of_stay1" ],
        key: "stayName",
        fallbackKey: "hospitalName",
        kind: "text"
    }, {
        ids: [ "pos_address1" ],
        key: "stayAddress",
        fallbackKey: "hospitalAddress",
        kind: "text"
    }, {
        ids: [ "pos_state_id1" ],
        key: "stayState",
        fallbackKey: "refIndiaState",
        kind: "selectText",
        waitOpts: true,
        pause: 500
    }, {
        ids: [ "pos_dist_id1" ],
        key: "stayDistrict",
        fallbackKey: "refIndiaDistrict",
        kind: "selectText",
        waitOpts: true,
        sticky: true
    }, {
        ids: [ "pos_email1" ],
        key: "stayEmail",
        fallbackKey: "hospitalEmail",
        kind: "text"
    }, {
        ids: [ "pos_phone1" ],
        key: "stayPhone",
        fallbackKey: "hospitalPhone",
        kind: "text"
    } ]
}, {
    id: "complete-partial",
    title: "Complete Partially Filled Form",
    titleBn: "অসম্পূর্ণ ফর্ম চালিয়ে যান",
    match: d => !!d.getElementById("tempFileNo"),
    fields: [ {
        ids: [ "tempFileNo" ],
        key: "tempApplicationId",
        kind: "text"
    } ]
}, {
    id: "photo-upload",
    title: "Upload Photograph",
    titleBn: "ছবি আপলোড",
    match: d => !!d.querySelector("#image_error_id") || /upload photograph/i.test(pageText(d, 3e3)) && !!d.querySelector('input[type="file"][name*="image" i]'),
    fields: []
}, {
    id: "photo-crop",
    title: "Crop Photograph",
    titleBn: "ছবি কাটা",
    match: d => !!(d.getElementById("target") && d.getElementById("x1") && d.getElementById("w")),
    fields: []
}, {
    id: "photo-saved",
    title: "Photograph Saved",
    titleBn: "ছবি সংরক্ষিত",
    match: d => !!d.querySelector('img[src*="DisplayImageDataTmp" i]') && !d.getElementById("target"),
    fields: []
}, {
    id: "doc-upload",
    title: "Document Upload",
    titleBn: "কাগজপত্র আপলোড",
    match: d => /\/DocumentUpload/i.test(hostOf(d) ? d.defaultView?.location?.pathname || "" : "") || !!d.querySelector('input[type="file"]') && /upload document/i.test(pageText(d, 6e3)) && /document description/i.test(pageText(d, 6e3)),
    fields: []
}, {
    id: "status-enquiry",
    title: "Visa Status Enquiry",
    titleBn: "ভিসার অবস্থা দেখুন",
    match: d => !!(d.getElementById("application_id") && d.getElementById("passport_no")) && !d.getElementById("missioncode_id_reprint") && !d.getElementById("dob_id"),
    fields: [ {
        ids: [ "application_id" ],
        key: "applicationId",
        fallbackKey: "webFileNumber",
        kind: "text"
    }, {
        ids: [ "passport_no" ],
        key: "passportNo",
        kind: "text"
    } ]
}, {
    id: "earrival",
    title: "e-Arrival Card",
    titleBn: "e-Arrival কার্ড",
    match: d => !!(d.getElementById("passportNumberSrch") || d.getElementById("indiaAddress")),
    fields: [ {
        ids: [ "passportNumberSrch" ],
        key: "passportNo",
        kind: "text"
    }, {
        ids: [ "name" ],
        key: "fullName",
        fallbackKey: "givenName",
        kind: "text"
    }, {
        label: /nationality\s*\/\s*region/i,
        key: "nationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "passportNumber" ],
        key: "passportNo",
        kind: "text"
    }, {
        label: /^purpose/i,
        key: "visaType",
        kind: "selectText",
        codes: EARRIVAL_PURPOSES
    }, {
        label: /date of arrival/i,
        key: "arrivalDate",
        kind: "date"
    }, {
        label: /countries visited in last 6 days/i,
        value: "YES",
        kind: "checkbox"
    }, {
        ids: [ "indiaAddress" ],
        key: "stayAddress",
        fallbackKey: "hospitalAddress",
        kind: "text"
    }, {
        label: /^state/i,
        key: "stayState",
        fallbackKey: "refIndiaState",
        kind: "selectText",
        pause: 400
    }, {
        label: /^district/i,
        key: "stayDistrict",
        fallbackKey: "refIndiaDistrict",
        kind: "selectText",
        waitOpts: true,
        sticky: true
    }, {
        ids: [ "email" ],
        key: "presentEmail",
        kind: "text"
    }, {
        ids: [ "countryCodeMbl" ],
        key: "isdCode",
        kind: "text"
    }, {
        ids: [ "telephone" ],
        key: "presentMobile",
        fallbackKey: "presentPhone",
        kind: "text"
    }, {
        ids: [ "countryCodeEmrgncyCntct", "emrgnccountryCodeEmrgncyCntctyCntct" ],
        key: "isdCode",
        kind: "text"
    }, {
        ids: [ "emrgncyCntct" ],
        key: "emergencyPhone",
        kind: "text"
    } ]
}, {
    id: "airsuvidha",
    title: "Air Suvidha Self Declaration",
    titleBn: "Air Suvidha ঘোষণাপত্র",
    match: d => !!(d.getElementById("f-pass") && d.getElementById("f-nat")),
    fields: [ {
        ids: [ "travel-mode-individual" ],
        value: "YES",
        kind: "checkbox"
    }, {
        ids: [ "f-name" ],
        key: "fullName",
        kind: "text"
    }, {
        ids: [ "f-sex" ],
        key: "gender",
        kind: "selectText"
    }, {
        ids: [ "f-nat" ],
        key: "nationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "f-pass" ],
        key: "passportNo",
        kind: "text"
    }, {
        ids: [ "journey-direct-india" ],
        value: "YES",
        kind: "checkbox"
    }, {
        ids: [ "f-boarding-airport" ],
        key: "boardingAirport",
        kind: "text"
    }, {
        ids: [ "f-dest" ],
        key: "portOfArrival",
        kind: "selectText"
    }, {
        ids: [ "f-airline" ],
        key: "airline",
        kind: "selectText"
    }, {
        ids: [ "f-arrival-date" ],
        key: "arrivalDate",
        kind: "date"
    }, {
        ids: [ "f-arrival-time" ],
        key: "arrivalTime",
        kind: "selectText"
    }, {
        ids: [ "f-seat" ],
        key: "seatNo",
        kind: "text"
    }, {
        ids: [ "visit-state-0" ],
        key: "stayState",
        fallbackKey: "refIndiaState",
        kind: "selectText",
        pause: 400
    }, {
        ids: [ "visit-district-0" ],
        key: "stayDistrict",
        fallbackKey: "refIndiaDistrict",
        kind: "selectText",
        waitOpts: true,
        sticky: true
    }, {
        ids: [ "f-email-step1" ],
        key: "presentEmail",
        kind: "text"
    }, {
        ids: [ "f-mobile-num-step1" ],
        key: "presentMobile",
        fallbackKey: "presentPhone",
        kind: "text"
    } ]
}, {
    id: "travel-tax",
    title: "NBR Travel Tax (Sonali Bank)",
    titleBn: "ভ্রমণ কর (সোনালী ব্যাংক)",
    match: d => !!(d.getElementById("ApplicantName") && d.getElementById("Destination")),
    fields: [ {
        ids: [ "ApplicantName" ],
        key: "fullName",
        kind: "text"
    }, {
        ids: [ "PassportNo" ],
        key: "passportNo",
        kind: "text"
    }, {
        ids: [ "PassengerType" ],
        key: "passengerType",
        kind: "radioName"
    }, {
        ids: [ "TransportType" ],
        key: "transportType",
        kind: "radioName"
    }, {
        ids: [ "Destination" ],
        value: "India",
        kind: "selectText"
    }, {
        ids: [ "MobileNo" ],
        key: "presentMobile",
        fallbackKey: "presentPhone",
        kind: "text"
    }, {
        ids: [ "Amount" ],
        key: "travelTaxAmount",
        kind: "text"
    } ]
}, {
    id: "port-fee",
    title: "Land Port Passenger Fee",
    titleBn: "স্থলবন্দর যাত্রী ফি",
    match: d => !!(d.getElementById("passenger_name") && d.getElementById("departure_port")),
    fields: [ {
        ids: [ "passenger_name" ],
        key: "fullName",
        kind: "text"
    }, {
        ids: [ "phone" ],
        key: "presentMobile",
        fallbackKey: "presentPhone",
        kind: "text"
    }, {
        ids: [ "departure_port" ],
        key: "landPort",
        kind: "selectText",
        codes: LAND_PORTS
    }, {
        ids: [ "country_code" ],
        key: "nationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "passport_no" ],
        key: "passportNo",
        kind: "text"
    }, {
        ids: [ "departure_date" ],
        key: "departureDate",
        fallbackKey: "arrivalDate",
        kind: "date"
    } ]
}, {
    id: "visa-details",
    title: "Visa Details (incl. hospital in India)",
    titleBn: "ভিসার বিবরণ (ভারতের হাসপাতাল সহ)",
    match: d => !!(d.getElementById("duration") && d.getElementById("visa_entry_id")),
    fields: [ {
        ids: [ "duration" ],
        key: "durationDays",
        kind: "text"
    }, {
        ids: [ "visa_entry_id" ],
        key: "noOfEntries",
        kind: "selectText"
    }, {
        ids: [ "jouryney_id" ],
        key: "arrivalDate",
        kind: "date",
        sticky: true
    }, {
        ids: [ "entrypoint" ],
        key: "portOfArrival",
        kind: "selectText"
    }, {
        ids: [ "exitpointprc" ],
        key: "portOfExit",
        kind: "selectText"
    }, {
        ids: [ "visited_city" ],
        key: "placesToVisit",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_125" ],
        key: "hospitalName",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_126" ],
        key: "hospitalAddress",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_127" ],
        key: "doctorName",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_128" ],
        key: "hospitalPhone",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_135" ],
        key: "hospitalEmail",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_133" ],
        key: "medicalCertNo",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_124" ],
        key: "illness",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_137" ],
        key: "attendantOf",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_138" ],
        key: "attendantOfDob",
        kind: "date"
    }, {
        ids: [ "visa_serreq_id_139" ],
        key: "attendantOfNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "visa_serreq_id_140" ],
        key: "attendantOfPassport",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_136" ],
        key: "attendantOfApplicationId",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_129" ],
        key: "homeHospitalName",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_130" ],
        key: "homeHospitalAddress",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_131" ],
        key: "homeDoctorName",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_132" ],
        key: "homeHospitalPhone",
        kind: "text"
    }, {
        ids: [ "visa_serreq_id_134" ],
        key: "homeHospitalEmail",
        kind: "text"
    }, {
        ids: [ "nameofsponsor_ind" ],
        key: "refIndiaName",
        fallbackKey: "hospitalName",
        kind: "text"
    }, {
        ids: [ "add1ofsponsor_ind" ],
        key: "refIndiaAddress",
        fallbackKey: "hospitalAddress",
        kind: "text"
    }, {
        ids: [ "stateofsponsor_ind" ],
        key: "refIndiaState",
        kind: "selectText",
        waitOpts: true,
        pause: 500
    }, {
        ids: [ "districtofsponsor_ind" ],
        key: "refIndiaDistrict",
        kind: "selectText",
        waitOpts: true,
        sticky: true
    }, {
        ids: [ "phoneofsponsor_ind" ],
        key: "refIndiaPhone",
        fallbackKey: "hospitalPhone",
        kind: "text"
    }, {
        ids: [ "nameofsponsor_msn" ],
        key: "refHomeName",
        kind: "text"
    }, {
        ids: [ "add1ofsponsor_msn" ],
        key: "refHomeAddress",
        kind: "text"
    }, {
        ids: [ "add2ofsponsor_msn" ],
        key: "refHomeAddress2",
        kind: "text"
    }, {
        ids: [ "phoneofsponsor_msn" ],
        key: "refHomePhone",
        kind: "text"
    }, {
        ids: [ "old_visa_flag1", "old_visa_flag2" ],
        key: "hasPreviousVisa",
        kind: "radioYN"
    }, {
        ids: [ "refuse_flag1", "refuse_flag2" ],
        key: "visaRefused",
        kind: "radioYN"
    }, {
        ids: [ "saarc_flag1", "saarc_flag2" ],
        key: "saarcVisited",
        kind: "radioYN"
    }, {
        ids: [ "old_visa_no" ],
        key: "oldVisaNo",
        kind: "text"
    }, {
        ids: [ "old_visa_type_id" ],
        key: "oldVisaType",
        kind: "selectText"
    }, {
        ids: [ "oldvisaissueplace" ],
        key: "oldVisaIssuePlace",
        kind: "text"
    }, {
        ids: [ "oldvisaissuedate" ],
        key: "oldVisaIssueDate",
        kind: "date"
    }, {
        ids: [ "prv_visit_add1" ],
        key: "prevVisitAddress",
        kind: "text"
    }, {
        ids: [ "refuse_details" ],
        key: "refuseDetails",
        kind: "text"
    }, {
        ids: [ "country_visited" ],
        key: "countriesVisited",
        kind: "text"
    } ]
}, {
    id: "personal",
    title: "Applicant Details (Personal & Passport)",
    titleBn: "ব্যক্তিগত ও পাসপোর্ট তথ্য",
    match: d => !!(d.getElementById("surname") && d.getElementById("passport_no")),
    fields: [ {
        ids: [ "surname" ],
        key: "surname",
        kind: "text"
    }, {
        ids: [ "givenName" ],
        key: "givenName",
        kind: "text"
    }, {
        ids: [ "chkNameChange", 'input[type="checkbox"][id*="chang" i]', 'input[type="checkbox"][name*="chang" i]', 'input[type="checkbox"][id*="prevname" i]', 'input[type="checkbox"][name*="prevname" i]' ],
        key: "changedName",
        kind: "checkbox"
    }, {
        ids: [ "prevSurname", "txtPreviousSurname" ],
        key: "previousSurname",
        kind: "text",
        onlyIf: d => yes(d.changedName)
    }, {
        ids: [ "prevGivenName", "txtPreviousName" ],
        key: "previousName",
        kind: "text",
        onlyIf: d => yes(d.changedName)
    }, {
        ids: [ "gender" ],
        key: "gender",
        kind: "selectText"
    }, {
        ids: [ "dob_id", "txtdob" ],
        key: "dob",
        kind: "date"
    }, {
        ids: [ "birth_place" ],
        key: "townOfBirth",
        kind: "text"
    }, {
        ids: [ "country_birth" ],
        key: "countryOfBirth",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "nic_number" ],
        key: "citizenshipNo",
        kind: "text"
    }, {
        ids: [ "religion" ],
        key: "religion",
        kind: "selectText"
    }, {
        ids: [ "religionOther", "txtotherreligion" ],
        key: "religionOther",
        kind: "text",
        onlyIf: d => /other/i.test(d.religion || "")
    }, {
        ids: [ "identity_marks" ],
        key: "identificationMarks",
        kind: "text"
    }, {
        ids: [ "education" ],
        key: "education",
        kind: "selectText"
    }, {
        ids: [ "nationality" ],
        key: "nationality",
        kind: "selectText",
        codes: ISO3,
        sticky: true
    }, {
        ids: [ "nationality_by", "nationalityBy", "nationalityby" ],
        key: "nationalityBy",
        kind: "selectText",
        sticky: true
    }, {
        ids: [ "prev_nationality", "drppreviousnationality" ],
        key: "previousNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "passport_no" ],
        key: "passportNo",
        kind: "text"
    }, {
        ids: [ "passport_issue_place" ],
        key: "passportPlaceOfIssue",
        kind: "text"
    }, {
        ids: [ "passport_issue_date" ],
        key: "passportIssueDate",
        kind: "date"
    }, {
        ids: [ "passport_expiry_date" ],
        key: "passportExpiryDate",
        kind: "date"
    }, {
        ids: [ "passport_country", "ddlCountryOfIssue" ],
        key: "passportCountryOfIssue",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "appl.oth_ppt", "othPassYN" ],
        key: "otherPassport",
        kind: "radioName"
    }, {
        ids: [ "oth_ppt_country", "drpothercountry" ],
        key: "otherPassportCountry",
        kind: "selectText",
        codes: ISO3,
        onlyIf: d => yes(d.otherPassport)
    }, {
        ids: [ "oth_ppt_no", "txtotherpassportno" ],
        key: "otherPassportNo",
        kind: "text",
        onlyIf: d => yes(d.otherPassport)
    }, {
        ids: [ "oth_ppt_issue_date", "txtotherdateofissue" ],
        key: "otherPassportIssueDate",
        kind: "date",
        onlyIf: d => yes(d.otherPassport)
    }, {
        ids: [ "oth_ppt_issue_place", "txtotherplaceofissue" ],
        key: "otherPassportPlaceOfIssue",
        kind: "text",
        onlyIf: d => yes(d.otherPassport)
    }, {
        ids: [ "oth_ppt_nationality", "drpothernationality" ],
        key: "otherPassportNationality",
        kind: "selectText",
        codes: ISO3,
        onlyIf: d => yes(d.otherPassport)
    } ]
}, {
    id: "address",
    title: "Family Details (Address, Family & Profession)",
    titleBn: "ঠিকানা, পরিবার ও পেশা",
    match: d => !!(d.getElementById("pres_add1") && d.getElementById("fthrname")),
    fields: [ {
        ids: [ "pres_add1" ],
        key: "presentHouseStreet",
        kind: "text"
    }, {
        ids: [ "pres_add2" ],
        key: "presentVillageTown",
        kind: "text"
    }, {
        ids: [ "pres_country" ],
        key: "presentCountry",
        kind: "selectText",
        codes: ISO3,
        pause: 300
    }, {
        ids: [ "pres_add3" ],
        key: "presentDistrict",
        kind: "text",
        fallbackKey: "presentState"
    }, {
        ids: [ "pincode" ],
        key: "presentPostal",
        kind: "text"
    }, {
        ids: [ "pres_phone" ],
        key: "presentPhone",
        kind: "text"
    }, {
        ids: [ "isd_code1" ],
        value: "880",
        kind: "selectText"
    }, {
        ids: [ "mobile" ],
        key: "presentMobile",
        kind: "text"
    }, {
        ids: [ "sameAddress_id" ],
        key: "permanentSame",
        kind: "checkbox"
    }, {
        ids: [ "perm_address1" ],
        key: "permHouseStreet",
        kind: "text",
        fallbackKey: "presentHouseStreet"
    }, {
        ids: [ "perm_address2" ],
        key: "permVillageTown",
        kind: "text",
        fallbackKey: "presentVillageTown"
    }, {
        ids: [ "perm_address3" ],
        key: "permDistrict",
        kind: "text",
        fallbackKey: "permState"
    }, {
        ids: [ "fthrname" ],
        key: "fatherName",
        kind: "text"
    }, {
        ids: [ "father_nationality" ],
        key: "fatherNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "father_previous_nationality" ],
        key: "fatherPrevNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "father_place_of_birth" ],
        key: "fatherPlaceOfBirth",
        kind: "text"
    }, {
        ids: [ "father_country_of_birth" ],
        key: "fatherCountryOfBirth",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "mother_name" ],
        key: "motherName",
        kind: "text"
    }, {
        ids: [ "mother_nationality" ],
        key: "motherNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "mother_previous_nationality" ],
        key: "motherPrevNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "mother_place_of_birth" ],
        key: "motherPlaceOfBirth",
        kind: "text"
    }, {
        ids: [ "mother_country_of_birth" ],
        key: "motherCountryOfBirth",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "marital_status" ],
        key: "maritalStatus",
        kind: "selectText",
        pause: 300
    }, {
        ids: [ "spouse_name" ],
        key: "spouseName",
        kind: "text"
    }, {
        ids: [ "spouse_nationality" ],
        key: "spouseNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "spouse_previous_nationality" ],
        key: "spousePrevNationality",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "spouse_place_of_birth" ],
        key: "spousePlaceOfBirth",
        kind: "text"
    }, {
        ids: [ "spouse_country_of_birth" ],
        key: "spouseCountryOfBirth",
        kind: "selectText",
        codes: ISO3
    }, {
        ids: [ "grandparent_flag1", "grandparent_flag2" ],
        key: "grandparentsPak",
        kind: "radioYN"
    }, {
        ids: [ "grandparent_details" ],
        key: "grandparentsDetails",
        kind: "text",
        onlyIf: d => yes(d.grandparentsPak)
    }, {
        ids: [ "occupation" ],
        key: "occupation",
        kind: "selectText",
        map: "occupation",
        pause: 300
    }, {
        ids: [ "occupationOther" ],
        key: "occupationOther",
        kind: "text",
        fallbackKey: "occupation",
        onlyIf: d => !OCCUPATION_MAP[String(d.occupation || "").toUpperCase()]
    }, {
        ids: [ "occ_flag" ],
        key: "occupationDetailsOf",
        kind: "selectText"
    }, {
        ids: [ "empname" ],
        key: "employerName",
        kind: "text"
    }, {
        ids: [ "empdesignation" ],
        key: "designation",
        kind: "text"
    }, {
        ids: [ "empaddress" ],
        key: "employerAddress",
        kind: "text"
    }, {
        ids: [ "empphone" ],
        key: "employerPhone",
        kind: "text",
        fallbackKey: "presentPhone"
    }, {
        ids: [ "previous_occupation" ],
        key: "pastOccupation",
        kind: "selectText"
    }, {
        ids: [ "prev_org1", "prev_org2" ],
        key: "militaryService",
        kind: "radioYN"
    }, {
        ids: [ "previous_organization" ],
        key: "militaryOrg",
        kind: "text",
        onlyIf: d => yes(d.militaryService)
    }, {
        ids: [ "previous_designation" ],
        key: "militaryDesignation",
        kind: "text",
        onlyIf: d => yes(d.militaryService)
    }, {
        ids: [ "previous_rank" ],
        key: "militaryRank",
        kind: "text",
        onlyIf: d => yes(d.militaryService)
    }, {
        ids: [ "previous_posting" ],
        key: "militaryPosting",
        kind: "text",
        onlyIf: d => yes(d.militaryService)
    } ]
}, {
    id: "visa",
    title: "Visa & Reference Details",
    titleBn: "Visa & Reference Details",
    match: d => !!(d.querySelector("#entrypoint") || d.querySelector("#txtPlacesToVisit") || d.querySelector("#stateofsponsor_ind") || d.querySelector("#txtRefNameIndia")),
    fields: [ {
        ids: [ "txtPlacesToVisit" ],
        key: "placesToVisit",
        kind: "text"
    }, {
        ids: [ "duration", "txtDurationOfVisa" ],
        key: "durationDays",
        kind: "text"
    }, {
        ids: [ "ddlNoOfEntries" ],
        key: "noOfEntries",
        kind: "select"
    }, {
        ids: [ "entrypoint", "ddlPortOfArrival" ],
        key: "portOfArrival",
        kind: "select"
    }, {
        ids: [ "ddlPortOfExit" ],
        key: "portOfExit",
        kind: "select"
    }, {
        ids: [ "stateofsponsor_ind", "txtStateVisited" ],
        key: "refIndiaState",
        kind: "select",
        waitOpts: true,
        pause: 500
    }, {
        ids: [ "districtofsponsor_ind", "txtDistrictVisited" ],
        key: "refIndiaDistrict",
        kind: "select",
        waitOpts: true,
        sticky: true
    }, {
        ids: [ "nameofsponsor_ind", "txtRefNameIndia", "txtRefIndiaName" ],
        key: "refIndiaName",
        kind: "text"
    }, {
        ids: [ "txtRefAddressIndia", "txtRefIndiaAddress" ],
        key: "refIndiaAddress",
        kind: "text"
    }, {
        ids: [ "txtRefPhoneIndia", "txtRefIndiaPhone" ],
        key: "refIndiaPhone",
        kind: "text"
    }, {
        ids: [ "txtRefNameHome", "txtRefHomeName" ],
        key: "refHomeName",
        kind: "text"
    }, {
        ids: [ "txtRefAddressHome", "txtRefHomeAddress" ],
        key: "refHomeAddress",
        kind: "text"
    }, {
        ids: [ "txtRefPhoneHome", "txtRefHomePhone" ],
        key: "refHomePhone",
        kind: "text"
    } ]
}, {
    id: "declaration",
    title: "Declaration / Security Questions",
    titleBn: "ঘোষণা / নিরাপত্তা প্রশ্ন",
    match: d => !!(d.querySelector("#question_yes_1") || d.querySelector("#verifyQuestions") || d.querySelector('input[name*="radioName"]')),
    fields: [ {
        ids: [ "question_yes_1", "question_no_1" ],
        key: "decArrested",
        kind: "radioYN"
    }, {
        ids: [ "question_yes_2", "question_no_2" ],
        key: "decDeported",
        kind: "radioYN"
    }, {
        ids: [ "question_yes_3", "question_no_3" ],
        key: "decTrafficking",
        kind: "radioYN"
    }, {
        ids: [ "question_yes_4", "question_no_4" ],
        key: "decTerrorism",
        kind: "radioYN"
    }, {
        ids: [ "question_yes_5", "question_no_5" ],
        key: "decGlorifyTerror",
        kind: "radioYN"
    }, {
        ids: [ "question_yes_6", "question_no_6" ],
        key: "decAsylum",
        kind: "radioYN"
    }, {
        ids: [ "verifyQuestions" ],
        key: "decVerified",
        kind: "checkbox"
    } ]
} ];

export function detectPage(doc) {
    for (const page of PORTAL_PAGES) {
        try {
            if (page.match(doc)) return page;
        } catch (_) {}
    }
    return null;
}

export const OCCUPATION_MAP = {
    BUSINESS: "BUSINESS PERSON",
    SERVICE: "PRIVATE SERVICE",
    GOVT: "GOVERNMENT SERVICE",
    STUDENT: "STUDENT",
    HOUSEWIFE: "HOUSEWIFE",
    DOCTOR: "DOCTOR",
    ENGINEER: "ENGINEER",
    JOURNALIST: "JOURNALIST",
    RETIRED: "RETIRED",
    "RETIRED (GOVERNMENT SERVICE)": "RETIRED",
    "RETIRED GOVERNMENT SERVICE": "RETIRED",
    UNEMPLOYED: "UNEMPLOYED",
    OTHER: "OTHERS"
};

export const PURPOSE_CODES = {
    TOURIST: "INDIVIDUAL TOURIST",
    MEDICAL: "FOR MEDICAL TREATMENT",
    BUSINESS: "FOR BUSINESS MEETINGS",
    TRANSIT: "FOR TRANSITING THROUGH INDIA",
    STUDENT: "FOR HIGHER STUDIES"
};
