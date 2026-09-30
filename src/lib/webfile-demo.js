import { visaKind, isAttendant } from "./relevance.js";

import { slotsFor } from "./doc-slots.js";

const W = 595.28, H = 841.89, M = 36;

const MONTHS = [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ];

const HR = [ 278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584 ];

const HB = [ 278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584 ];

const ascii = s => String(s == null ? "" : s).replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").replace(/[^\x20-\x7e]/g, "?").trim();

const esc = s => ascii(s).replace(/[\\()]/g, c => `\\${c}`);

const width = (s, size, bold) => [ ...ascii(s) ].reduce((a, c) => a + ((bold ? HB : HR)[c.charCodeAt(0) - 32] || 556), 0) * size / 1e3;

function lines(text, maxW, size, bold) {
    const out = [];
    let cur = "";
    for (const word of ascii(text).split(" ").filter(Boolean)) {
        const next = cur ? `${cur} ${word}` : word;
        if (cur && width(next, size, bold) > maxW) {
            out.push(cur);
            cur = word;
        } else cur = next;
    }
    if (cur) out.push(cur);
    return out.length ? out : [ "" ];
}

export function siteDate(v) {
    const s = String(v || "").trim();
    let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
    if (m) return `${m[1].padStart(2, "0")}-${MONTHS[+m[2] - 1] || m[2]}-${m[3]}`;
    m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return `${m[3]}-${MONTHS[+m[2] - 1] || m[2]}-${m[1]}`;
    return s.toUpperCase();
}

const up = v => String(v || "").trim().toUpperCase();

const yn = v => /^y/i.test(String(v || "")) ? "YES" : /^n/i.test(String(v || "")) ? "NO" : "";

class Sheet {
    constructor() {
        this.pages = [];
        this.newPage();
    }
    newPage() {
        this.ops = [];
        this.pages.push(this.ops);
        this.y = M;
    }
    need(h) {
        if (this.y + h > H - M - 20) this.newPage();
    }
    text(x, top, s, size = 7.5, bold = false, gray = 0) {
        this.ops.push(`BT /${bold ? "FB" : "FR"} ${size} Tf ${gray} g 1 0 0 1 ${x.toFixed(2)} ${(H - top - size).toFixed(2)} Tm (${esc(s)}) Tj ET`);
    }
    box(x, top, w, h, fill = null) {
        const y = H - top - h;
        if (fill != null) this.ops.push(`${fill} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
        this.ops.push(`0.72 G 0.5 w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    }
}

function row(sh, cells, {size: size = 7.2, fill: fill = null, head: head = false} = {}) {
    const inner = W - 2 * M;
    const pad = 3;
    const lh = size * 1.25;
    const laid = cells.map(([t, frac, bold]) => ({
        lines: lines(t, inner * frac - 2 * pad, size, bold || head),
        frac: frac,
        bold: bold || head
    }));
    const h = Math.max(...laid.map(c => c.lines.length)) * lh + 2 * pad - 1;
    sh.need(h);
    let x = M;
    for (const c of laid) {
        const w = inner * c.frac;
        sh.box(x, sh.y, w, h, fill);
        c.lines.forEach((ln, i) => sh.text(x + pad, sh.y + pad + i * lh, ln, size, c.bold, c.bold && !head ? .25 : 0));
        x += w;
    }
    sh.y += h;
}

const section = (sh, title) => row(sh, [ [ title, 1, true ] ], {
    fill: .9,
    head: true,
    size: 7.6
});

const pair = (sh, a, av, b, bv) => row(sh, b === undefined ? [ [ a, .3, true ], [ av, .7 ] ] : [ [ a, .22, true ], [ av, .28 ], [ b, .22, true ], [ bv, .28 ] ]);

export function buildWebFileDemo(data = {}, {photo: photo = null, uploadedSlots: uploadedSlots = []} = {}) {
    const d = k => up(data[k]);
    const sh = new Sheet;
    const {category: category, sub: sub} = visaKind(data.visaPurpose);
    sh.box(M, sh.y, W - 2 * M, 22, .97);
    sh.text(M + 8, sh.y + 4, "DEMO - NOT FOR SUBMISSION.  A preview of your answers, made on this computer.", 8.5, true, 0);
    sh.text(M + 8, sh.y + 13.5, "The real application print comes only from indianvisa-bangladesh.nic.in after you submit there.", 7, false, .3);
    sh.y += 30;
    const photoTop = sh.y;
    const ph = 96;
    if (photo) sh.photo = {
        x: M,
        top: photoTop,
        size: ph
    }; else {
        sh.box(M, photoTop, ph, ph);
        sh.text(M + 22, photoTop + 44, "No photo yet", 7, false, .45);
    }
    sh.text(M + ph + 24, photoTop + 26, "Visa Application Form", 17, true);
    sh.text(M + ph + 24, photoTop + 50, `${d("surname")} ${d("givenName")}`.trim() || "-", 9, true, .25);
    sh.text(M + ph + 24, photoTop + 63, [ category && `${category} VISA`, sub && `(${sub})`, d("mission") && `Mission: ${d("mission")}` ].filter(Boolean).join("  "), 7.5, false, .35);
    const bx = W - M - 150;
    sh.box(bx, photoTop, 150, 66);
    sh.text(bx + 22, photoTop + 22, "Paste your unsigned", 6.8, true, .35);
    sh.text(bx + 22, photoTop + 31, "recent color photograph.", 6.8, true, .35);
    sh.text(bx + 22, photoTop + 40, 'Size: 2" X 2"', 6.8, true, .35);
    sh.box(bx, photoTop + 72, 150, 24);
    sh.text(bx - 40, photoTop + 80, "Signature", 7, true, .35);
    sh.y = photoTop + ph + 10;
    section(sh, "A. Personal Particulars (As in Passport)");
    pair(sh, "Surname (As in Passport)", d("surname"));
    pair(sh, "Given Name (As in Passport)", d("givenName"));
    pair(sh, "Previous/other Name if any", [ d("previousSurname"), d("previousName") ].filter(Boolean).join(" ") || "Not Applicable");
    pair(sh, "Gender", d("gender"), "Marital Status", d("maritalStatus"));
    pair(sh, "Date of Birth", siteDate(data.dob), "Religion", d("religion"));
    pair(sh, "Place of Birth Town/City", d("townOfBirth"), "Country of Birth", d("countryOfBirth"));
    pair(sh, "Citizenship /National ID No", d("citizenshipNo"), "Educational Qualification", d("education"));
    pair(sh, "Visible identification marks", d("identificationMarks"));
    pair(sh, "Current Nationality", d("nationality"), "Nationality by Birth/ Naturalization", d("nationalityBy"));
    pair(sh, "Any Other Previous/Past Nationality", d("previousNationality") || "Not Applicable");
    section(sh, "B. Passport Details");
    pair(sh, "Passport No.", d("passportNo"), "Date of Issue ( dd/mm/yyyy )", siteDate(data.passportIssueDate));
    pair(sh, "Place of Issue", d("passportPlaceOfIssue"), "Date of Expiry ( dd/mm/yyyy )", siteDate(data.passportExpiryDate));
    pair(sh, "Any other Passport/Identity Certificate held", yn(data.otherPassport) || "NO");
    if (yn(data.otherPassport) === "YES") {
        pair(sh, "Country of Issue", d("otherPassportCountry"), "Place of Issue", d("otherPassportPlaceOfIssue"));
        pair(sh, "Passport/IC No.", d("otherPassportNo"), "Date of issue (dd/mm/yyyy)", siteDate(data.otherPassportIssueDate));
        pair(sh, "Nationality/Status", d("otherPassportNationality"));
    }
    section(sh, "C. Applicant's Contact Details");
    const present = [ d("presentHouseStreet"), d("presentVillageTown"), [ d("presentDistrict"), d("presentPostal") ].filter(Boolean).join(" "), d("presentCountry") ].filter(Boolean).join(", ");
    pair(sh, "Present Address", present, "Phone No", d("presentPhone"));
    pair(sh, "Mobile /Cell No", d("presentMobile"), "Email address", d("presentEmail"));
    pair(sh, "Permanent Address", [ d("permHouseStreet"), d("permVillageTown"), d("permDistrict") ].filter(Boolean).join(", ") || present);
    section(sh, "D. Family Details");
    const fam = [ [ "Relation", .14 ], [ "Name", .3 ], [ "Nationality", .16 ], [ "Prev. Nationality", .16 ], [ "Place/Country of Birth", .24 ] ];
    row(sh, fam.map(([t, f]) => [ t, f, true ]), {
        fill: .96
    });
    for (const [rel, p] of [ [ "Father's", "father" ], [ "Mother's", "mother" ], [ "Spouse", "spouse" ] ]) {
        if (p === "spouse" && !data.spouseName) continue;
        row(sh, [ [ rel, .14, true ], [ d(`${p}Name`), .3 ], [ d(`${p}Nationality`), .16 ], [ d(`${p}PrevNationality`), .16 ], [ [ d(`${p}PlaceOfBirth`), d(`${p}CountryOfBirth`) ].filter(Boolean).join(" "), .24 ] ]);
    }
    pair(sh, "Were your Grandfather/Grandmother (Paternal/Maternal) Pakistan Nationals Or belong to Pakistan held area", yn(data.grandparentsPak) || "NO");
    section(sh, "E. Details of Visa Sought   (Visa shall be valid from the Date of Issue and not from the Date of Journey)");
    pair(sh, "Type Of Visa Required", category ? `${category} VISA` : d("visaPurpose"), "No of Entries", d("noOfEntries"));
    pair(sh, "Period of Visa ( Month)", data.durationDays ? `${up(data.durationDays)} Month` : "", "Expected Date of Journey", siteDate(data.arrivalDate));
    pair(sh, "Port Of Arrival", d("portOfArrival"), "Port of Exit", d("portOfExit"));
    if (category === "MEDICAL") {
        row(sh, [ [ `Required Detail of  ${category} VISA`, 1, true ] ], {
            fill: .96
        });
        if (isAttendant(data)) {
            pair(sh, "Dependency Name", d("attendantOf"));
            pair(sh, "Dependency Date of Birth", data.attendantOfDob || "");
            pair(sh, "Dependency Nationality", d("attendantOfNationality"));
            pair(sh, "Dependency Passport No", d("attendantOfPassport"));
            pair(sh, "Dependency Application Id", d("attendantOfApplicationId"));
        } else {
            pair(sh, "Name of Hospital in India", d("hospitalName"));
            pair(sh, "Address of Hospital", d("hospitalAddress"));
            pair(sh, "Name of Doctor", d("doctorName"));
        }
    }
    section(sh, "F. Previous Visit Details");
    pair(sh, "Have You Ever visited India ?", yn(data.hasPreviousVisa) || "NO");
    if (yn(data.hasPreviousVisa) === "YES") {
        pair(sh, "Address where You stayed in India", d("prevVisitAddress"));
        pair(sh, "Type of Visa", d("oldVisaType"), "Visa Number", d("oldVisaNo"));
        pair(sh, "Visa Issued Place", d("oldVisaIssuePlace"), "Date of Issue", siteDate(data.oldVisaIssueDate));
    }
    pair(sh, "Countries visited in last 10 years", d("countriesVisited"));
    pair(sh, "Have you been refused an Indian Visa or extension of the same previously or deported from India ?", yn(data.visaRefused) || "NO");
    section(sh, "G. Profession/Occupation Details :");
    pair(sh, "Present Occupation", d("occupation"), "Designation/Rank", d("designation"));
    pair(sh, "Employer name/business", d("employerName"));
    pair(sh, "Employer Address  Phone Number", [ d("employerAddress"), d("employerPhone") ].filter(Boolean).join("  "));
    pair(sh, "Past occupation if any", d("pastOccupation"));
    pair(sh, "Are/have you worked with Armed forces/ Police/ Para Military forces ?", yn(data.militaryService) || "NO");
    if (yn(data.militaryService) === "YES") {
        pair(sh, "Organization", d("militaryOrg"), "Designation", d("militaryDesignation"));
        pair(sh, "Place of Posting", d("militaryPosting"), "Rank", d("militaryRank"));
    }
    section(sh, "H. Address of Place of Stay / Hotel");
    row(sh, [ [ "Place/Hotel Name", .28, true ], [ "Address of Place /Hotel", .42, true ], [ "State", .14, true ], [ "Phone No", .16, true ] ], {
        fill: .96
    });
    row(sh, [ [ d("stayName"), .28 ], [ [ d("stayAddress"), d("stayDistrict") ].filter(Boolean).join(", "), .42 ], [ d("stayState"), .14 ], [ d("stayPhone"), .16 ] ]);
    section(sh, "I. Details of Two Reference");
    row(sh, [ [ "", .2, true ], [ "In India", .4, true ], [ "In BANGLADESH", .4, true ] ], {
        fill: .96
    });
    row(sh, [ [ "Name", .2, true ], [ d("refIndiaName"), .4 ], [ d("refHomeName"), .4 ] ]);
    row(sh, [ [ "Address", .2, true ], [ [ d("refIndiaAddress"), d("refIndiaDistrict"), d("refIndiaState") ].filter(Boolean).join(", "), .4 ], [ [ d("refHomeAddress"), d("refHomeAddress2") ].filter(Boolean).join(", "), .4 ] ]);
    row(sh, [ [ "Phone Number", .2, true ], [ d("refIndiaPhone"), .4 ], [ d("refHomePhone"), .4 ] ]);
    section(sh, "J. DOCUMENTS UPLOADED");
    const slots = category ? slotsFor(category, sub) : [];
    const listed = slots.filter(s => s.mandatory || uploadedSlots.includes(s.slot));
    listed.forEach((s, i) => row(sh, [ [ `${i + 1}) ${s.text}${uploadedSlots.includes(s.slot) ? "" : "   [not added yet]"}`, 1 ] ]));
    if (!listed.length) row(sh, [ [ "(choose the type of visa to see the documents it needs)", 1 ] ]);
    section(sh, "K. DECLARATION");
    for (const t of [ "a. I do not hold any other passport(s) other than those detailed above.", "b. I have read and understood all the conditions for the visit to India and I am willing and able to abide fully by them.", "c. I declare that the information given in the form is complete and correct and the visit to India will be undertaken for the purpose indicated in the application.", "d. I understand that in case the information provided in the form is found to be incorrect, I will be liable for denial of visit/ entry or deportation and/ or other penalties during the visit as provided by Indian law.", "e. I will also submit hard-copy all the uploaded documents along with the print of application to submit to the concerning Indian Mission or Agency for processing of visa application." ]) row(sh, [ [ t, 1 ] ]);
    sh.need(40);
    sh.y += 24;
    sh.text(M, sh.y, "Date :  ......................", 7.5, true);
    sh.text(W - M - 150, sh.y, "Applicant's signature (as in Passport)", 7.5, true);
    return writePdf(sh, photo);
}

function writePdf(sh, photo) {
    const objs = [];
    const add = body => {
        objs.push(body);
        return objs.length;
    };
    const bin = u8 => {
        let s = "";
        for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
        return s;
    };
    const fr = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const fb = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const gs = add("<< /Type /ExtGState /ca 0.12 /CA 0.12 >>");
    let im = 0;
    if (photo?.bytes?.length) {
        im = add(`<< /Type /XObject /Subtype /Image /Width ${photo.w} /Height ${photo.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${photo.bytes.length} >>\nstream\n${bin(photo.bytes)}\nendstream`);
    }
    const mark = (n, total) => [ "q /GS1 gs 0.55 0 0.1 rg BT /FB 88 Tf 0.7071 0.7071 -0.7071 0.7071 150 170 Tm (DEMO) Tj ET Q", `BT /FR 6.5 Tf 0.4 g 1 0 0 1 ${M} 18 Tm (${esc(`DEMO - NOT FOR SUBMISSION - page ${n} of ${total}`)}) Tj ET` ].join("\n");
    const pagesId = objs.length + sh.pages.length * 2 + 1;
    const kids = [];
    sh.pages.forEach((ops, i) => {
        let content = ops.join("\n");
        if (i === 0 && im && sh.photo) {
            const {x: x, top: top, size: size} = sh.photo;
            const k = Math.min(size / photo.w, size / photo.h);
            const w = photo.w * k, h = photo.h * k;
            content = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${(x + (size - w) / 2).toFixed(2)} ${(H - top - size + (size - h) / 2).toFixed(2)} cm /Im1 Do Q\n${content}`;
        }
        content += `\n${mark(i + 1, sh.pages.length)}`;
        const c = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /FR ${fr} 0 R /FB ${fb} 0 R >> /ExtGState << /GS1 ${gs} 0 R >>${im ? ` /XObject << /Im1 ${im} 0 R >>` : ""} >> /Contents ${c} 0 R >>`));
    });
    add(`<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`);
    const root = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    const info = add("<< /Title (DEMO - Visa application preview - not for submission) /Producer (Indian Visa Auto Fill) >>");
    let out = "%PDF-1.4\n%âãÏÓ\n";
    const offsets = [];
    objs.forEach((body, i) => {
        offsets.push(out.length);
        out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map(o => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${root} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return bytes;
}
