import * as store from "../lib/store.js";

const $ = (s, r = document) => r.querySelector(s);

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[c]));

const MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

function longDate(ddmmyyyy) {
    const m = String(ddmmyyyy || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return ddmmyyyy || "";
    return `${+m[1]} ${MONTHS[+m[2] - 1]} ${m[3]}`;
}

function today() {
    const d = new Date;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const MISSION_ADDR = {
    DHAKA: "The Visa Officer\nIndian Visa Application Centre (IVAC)\nHigh Commission of India\nDhaka, Bangladesh",
    CHITTAGONG: "The Visa Officer\nIndian Visa Application Centre (IVAC)\nAssistant High Commission of India\nChittagong, Bangladesh",
    KHULNA: "The Visa Officer\nIndian Visa Application Centre (IVAC)\nAssistant High Commission of India\nKhulna, Bangladesh",
    RAJSHAHI: "The Visa Officer\nIndian Visa Application Centre (IVAC)\nAssistant High Commission of India\nRajshahi, Bangladesh",
    SYLHET: "The Visa Officer\nIndian Visa Application Centre (IVAC)\nAssistant High Commission of India\nSylhet, Bangladesh",
    RANGPUR: "The Visa Officer\nIndian Visa Application Centre (IVAC)\nAssistant High Commission of India\nRangpur, Bangladesh",
    BARISAL: "The Visa Officer\nIndian Visa Application Centre (IVAC)\nAssistant High Commission of India\nBarisal, Bangladesh"
};

const DOCS = {
    cover: {
        title: "Cover Letter (Tourist)",
        fields: [ [ "applicant", "Applicant name", d => d.fullName || [ d.givenName, d.surname ].filter(Boolean).join(" ") ], [ "passport", "Passport no.", d => d.passportNo ], [ "mission", "Mission", d => (d.mission || "DHAKA").toUpperCase() ], [ "visaType", "Visa type", d => d.visaType || "TOURIST VISA" ], [ "travelDate", "Intended travel date", d => d.arrivalDate ], [ "days", "Duration (days)", d => d.durationDays || "15" ], [ "places", "Places to visit", d => d.placesToVisit1 || "KOLKATA" ], [ "occupation", "Occupation", d => d.occupation ], [ "employer", "Employer / business", d => d.employerName ], [ "phone", "Phone", d => d.presentMobile || d.presentPhone ], [ "email", "Email", d => d.presentEmail ], [ "address", "Address", d => [ d.presentHouseStreet, d.presentVillageTown, d.presentDistrict ].filter(Boolean).join(", ") ] ]
    },
    medical: {
        title: "Cover Letter (Medical)",
        fields: [ [ "applicant", "Applicant name", d => d.fullName || [ d.givenName, d.surname ].filter(Boolean).join(" ") ], [ "passport", "Passport no.", d => d.passportNo ], [ "mission", "Mission", d => (d.mission || "DHAKA").toUpperCase() ], [ "patient", "Patient name (if attendant)", d => d.attendantOf ], [ "illness", "Ailment / treatment", d => d.illness ], [ "hospital", "Hospital name", d => d.hospitalName ], [ "hospAddr", "Hospital address", d => d.hospitalAddress ], [ "doctor", "Doctor name", d => d.doctorName ], [ "travelDate", "Intended travel date", d => d.arrivalDate ], [ "phone", "Phone", d => d.presentMobile || d.presentPhone ], [ "email", "Email", d => d.presentEmail ] ]
    },
    noc: {
        title: "No Objection Certificate",
        company: true,
        fields: [ [ "company", "Company name", () => "" ], [ "compAddr", "Company address", () => "" ], [ "compPhone", "Company phone", () => "" ], [ "compEmail", "Company email", () => "" ], [ "applicant", "Employee name", d => d.fullName || [ d.givenName, d.surname ].filter(Boolean).join(" ") ], [ "designation", "Designation", d => d.designation ], [ "passport", "Passport no.", d => d.passportNo ], [ "leaveFrom", "Leave from", d => d.arrivalDate ], [ "leaveTo", "Leave to", d => d.exitDate ], [ "signee", "Signed by (name)", () => "" ], [ "signeeDesig", "Signee designation", () => "Head of Human Resources" ] ]
    },
    undertaking: {
        title: "Undertaking / Declaration",
        fields: [ [ "applicant", "Applicant name", d => d.fullName || [ d.givenName, d.surname ].filter(Boolean).join(" ") ], [ "father", "Father's name", d => d.fatherName ], [ "passport", "Passport no.", d => d.passportNo ], [ "nid", "National ID no.", d => d.citizenshipNo ], [ "address", "Address", d => [ d.presentHouseStreet, d.presentVillageTown, d.presentDistrict ].filter(Boolean).join(", ") ], [ "mission", "Mission", d => (d.mission || "DHAKA").toUpperCase() ], [ "travelDate", "Intended travel date", d => d.arrivalDate ], [ "days", "Duration (days)", d => d.durationDays || "15" ] ]
    }
};

function letterhead(v) {
    if (!v.company) return "";
    return `<div class="lh">\n      <div class="cname">${esc(v.company)}</div>\n      <div class="cmeta">${[ v.compAddr, v.compPhone, v.compEmail ].filter(Boolean).map(esc).join(" &nbsp;·&nbsp; ")}</div>\n    </div>`;
}

function factsTable(rows) {
    return `<table class="facts">${rows.filter(([, val]) => val).map(([k, val]) => `<tr><td>${esc(k)}</td><td>${esc(val)}</td></tr>`).join("")}</table>`;
}

function signature(name, sub) {
    return `<div class="sign">\n      <div class="line"></div>\n      <div class="who">${esc(name || "")}</div>\n      ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}\n    </div>`;
}

const TEMPLATES = {
    cover: v => `\n    <div class="date">${today()}</div>\n    <div class="to">${esc(MISSION_ADDR[v.mission] || MISSION_ADDR.DHAKA)}</div>\n    <div class="subj">Subject: Application for ${esc(v.visaType || "Tourist Visa")} — ${esc(v.applicant)}</div>\n    <p>Respected Sir / Madam,</p>\n    <p>\n      I, <b>${esc(v.applicant)}</b>, a citizen of Bangladesh holding passport number\n      <b>${esc(v.passport)}</b>, respectfully submit my application for an Indian\n      ${esc((v.visaType || "tourist visa").toLowerCase())}. I intend to travel to India\n      on or about <b>${esc(longDate(v.travelDate))}</b> for a stay of approximately\n      <b>${esc(v.days)} days</b>, visiting <b>${esc(v.places)}</b>.\n    </p>\n    <p>\n      The purpose of my visit is tourism and sightseeing only. I will bear all expenses\n      of the journey myself, and I have no intention of taking up any employment,\n      business or any other activity not permitted under a tourist visa.\n    </p>\n    ${factsTable([ [ "Full name", v.applicant ], [ "Passport number", v.passport ], [ "Occupation", v.occupation ], [ "Employer / business", v.employer ], [ "Address in Bangladesh", v.address ], [ "Mobile", v.phone ], [ "Email", v.email ], [ "Intended date of travel", longDate(v.travelDate) ], [ "Intended duration", v.days ? `${v.days} days` : "" ] ])}\n    <p>\n      I confirm that I will return to Bangladesh before my visa expires, and that all\n      information given in my application and supporting documents is true and correct\n      to the best of my knowledge. The required documents are enclosed with this\n      application.\n    </p>\n    <p>I would be grateful if you would kindly consider my application. Thank you for your time and consideration.</p>\n    <p>Yours faithfully,</p>\n    ${signature(v.applicant, v.passport ? `Passport: ${v.passport}` : "")}`,
    medical: v => `\n    <div class="date">${today()}</div>\n    <div class="to">${esc(MISSION_ADDR[v.mission] || MISSION_ADDR.DHAKA)}</div>\n    <div class="subj">Subject: Application for Medical ${v.patient ? "Attendant " : ""}Visa — ${esc(v.applicant)}</div>\n    <p>Respected Sir / Madam,</p>\n    <p>\n      I, <b>${esc(v.applicant)}</b>, a citizen of Bangladesh holding passport number\n      <b>${esc(v.passport)}</b>, respectfully apply for an Indian\n      <b>${v.patient ? "Medical Attendant Visa" : "Medical Visa"}</b>.\n      ${v.patient ? `I wish to accompany <b>${esc(v.patient)}</b>, who requires medical treatment in India.` : "I require specialised medical treatment that is being arranged in India."}\n    </p>\n    ${factsTable([ [ v.patient ? "Patient name" : "Full name", v.patient || v.applicant ], [ v.patient ? "Attendant name" : "Passport number", v.patient ? v.applicant : v.passport ], [ "Ailment / treatment", v.illness ], [ "Hospital", v.hospital ], [ "Hospital address", v.hospAddr ], [ "Consulting doctor", v.doctor ], [ "Intended date of travel", longDate(v.travelDate) ], [ "Mobile", v.phone ], [ "Email", v.email ] ])}\n    <p>\n      The appointment letter from the hospital, the medical documents from the treating\n      physician in Bangladesh, and proof of sufficient funds for the treatment are\n      enclosed. All expenses of treatment and travel will be borne by us.\n    </p>\n    <p>\n      We shall return to Bangladesh immediately after the treatment is completed. I\n      declare that the information given above is true and correct to the best of my\n      knowledge.\n    </p>\n    <p>I request you to kindly consider the application on a priority basis, as the treatment is time-sensitive.</p>\n    <p>Yours faithfully,</p>\n    ${signature(v.applicant, v.passport ? `Passport: ${v.passport}` : "")}`,
    noc: v => `\n    ${letterhead(v)}\n    <div class="date">${today()}</div>\n    <div class="to">To Whom It May Concern</div>\n    <div class="subj">Subject: No Objection Certificate for ${esc(v.applicant)}</div>\n    <p>\n      This is to certify that <b>${esc(v.applicant)}</b>, holder of passport number\n      <b>${esc(v.passport)}</b>, is employed with\n      <b>${esc(v.company || "this organisation")}</b> as\n      <b>${esc(v.designation || "an employee")}</b>.\n    </p>\n    <p>\n      ${esc(v.applicant)} has applied for leave\n      ${v.leaveFrom ? `from <b>${esc(longDate(v.leaveFrom))}</b>` : ""}\n      ${v.leaveTo ? ` to <b>${esc(longDate(v.leaveTo))}</b>` : ""}\n      in order to travel to India. The organisation has <b>no objection</b> to this\n      travel, and the leave has been approved.\n    </p>\n    <p>\n      We further confirm that ${esc(v.applicant)} will resume duties with us on return,\n      and that the position will be held open for the duration of the approved leave.\n      This certificate is issued on request for the purpose of the Indian visa\n      application and for no other purpose.\n    </p>\n    ${signature(v.signee, [ v.signeeDesig, v.company ].filter(Boolean).join(", "))}`,
    undertaking: v => `\n    <div style="text-align:center;font-size:15pt;font-weight:700;text-decoration:underline;margin-bottom:22px">UNDERTAKING</div>\n    <p>\n      I, <b>${esc(v.applicant)}</b>${v.father ? `, son / daughter of <b>${esc(v.father)}</b>` : ""},\n      a citizen of Bangladesh, holding passport number <b>${esc(v.passport)}</b>\n      ${v.nid ? `and national identity number <b>${esc(v.nid)}</b>` : ""},\n      residing at ${esc(v.address || "—")}, do hereby solemnly declare and undertake as follows:\n    </p>\n    <p>1. That I am applying for an Indian visa at ${esc((v.mission || "DHAKA").toUpperCase())}, and that every statement made in my application form and in the documents submitted with it is true and correct to the best of my knowledge and belief.</p>\n    <p>2. That I intend to travel to India on or about <b>${esc(longDate(v.travelDate))}</b> for a period of approximately <b>${esc(v.days)} days</b>, and that I shall return to Bangladesh before the expiry of my visa.</p>\n    <p>3. That I shall abide by the laws of India and by all conditions attached to the visa granted to me, and that I shall not engage in any employment, business, journalistic, missionary or other activity that is not permitted under the visa category granted.</p>\n    <p>4. That I shall bear all expenses of my travel, stay and return, and that I shall not become a burden on any public fund.</p>\n    <p>5. That I understand that any information later found to be false may result in refusal of the visa, cancellation of a visa already granted, and such other action as the authorities consider appropriate.</p>\n    <p style="margin-top:18px">Declared at ${esc((v.mission || "Dhaka").replace(/^(\w)(\w*)$/, (_, a, b) => a + b.toLowerCase()))}, Bangladesh on ${today()}.</p>\n    ${signature(v.applicant, v.passport ? `Passport: ${v.passport}` : "")}`
};

let docType = "cover";

let data = {};

let values = {};

async function loadProfiles() {
    const list = await store.getProfiles();
    const active = await store.getActiveId();
    $("#profile").innerHTML = list.length ? list.map(p => `<option value="${p.id}"${p.id === active ? " selected" : ""}>${esc(p.name)}</option>`).join("") : '<option value="">— No Profile Selected —</option>';
    const chosen = list.find(p => p.id === $("#profile").value) || list[0] || null;
    data = chosen ? await store.resolvedData(chosen) : {};
}

async function buildForm({keepEdits: keepEdits = false} = {}) {
    const def = DOCS[docType];
    const prev = keepEdits ? {
        ...values
    } : {};
    values = {};
    for (const [key, , from] of def.fields) {
        values[key] = prev[key] !== undefined && prev[key] !== "" ? prev[key] : from(data) || "";
    }
    let companyPicker = "";
    if (def.company) {
        const comps = await store.getCompanies();
        if (comps.length) {
            companyPicker = `<div class="fld">\n          <label>Saved Company</label>\n          <select id="compPick"><option value="">—</option>${comps.map((c, i) => `<option value="${i}">${esc(c.name || `Company ${i + 1}`)}</option>`).join("")}</select>\n        </div>`;
        }
    }
    $("#form").innerHTML = companyPicker + def.fields.map(([key, label]) => `<div class="fld">\n        <label>${esc(label)}</label>\n        <input type="text" data-k="${key}" value="${esc(values[key])}" />\n      </div>`).join("");
    $("#form").oninput = async e => {
        if (e.target.id === "compPick") {
            const comps = await store.getCompanies();
            const c = comps[+e.target.value];
            if (c) {
                Object.assign(values, {
                    company: c.name || "",
                    compAddr: c.address || "",
                    compPhone: c.phone || "",
                    compEmail: c.email || "",
                    signeeDesig: c.signee || values.signeeDesig
                });
                await buildForm({
                    keepEdits: true
                });
            }
            return;
        }
        const k = e.target.dataset.k;
        if (!k) return;
        values[k] = e.target.value;
        render();
    };
    render();
}

function render() {
    $("#sheet").innerHTML = TEMPLATES[docType](values);
    document.title = `${DOCS[docType].title} — ${values.applicant || "Visa Autofill PRO"}`;
}

$("#docType").addEventListener("click", e => {
    const btn = e.target.closest("button[data-doc]");
    if (!btn) return;
    [ ...$("#docType").children ].forEach(b => b.classList.toggle("on", b === btn));
    docType = btn.dataset.doc;
    buildForm();
});

$("#profile").addEventListener("change", async () => {
    await store.setActiveId($("#profile").value);
    await loadProfiles();
    await buildForm();
});

$("#reload").addEventListener("click", async () => {
    await loadProfiles();
    await buildForm();
});

$("#print").addEventListener("click", () => window.print());

(async function init() {
    await loadProfiles();
    await buildForm();
})();
