export const PORTALS = [ {
    id: "temp-id",
    page: "complete-partial",
    name: "Resume Application",
    nameBn: "অসম্পূর্ণ ফর্ম চালিয়ে যান",
    icon: "↩",
    url: "https://indianvisa-bangladesh.nic.in/visa/CompletePartially",
    needs: [ "tempApplicationId" ],
    whyBn: "ফর্ম শেষ না করে বেরিয়ে গেলে Temporary Application ID দিয়ে আবার সেখান থেকেই শুরু করা যায়।"
}, {
    id: "status",
    page: "status-enquiry",
    name: "Visa Status",
    nameBn: "ভিসার অবস্থা",
    icon: "◎",
    url: "https://indianvisa-bangladesh.nic.in/visa/StatusEnquiry",
    needs: [ "applicationId", "passportNo" ],
    whyBn: "ভিসা হলো কি না দেখার পাতা। Application Id আর পাসপোর্ট নম্বর বসে যাবে, ক্যাপচাটা আপনি দেবেন।"
}, {
    id: "reprint",
    page: "reprint",
    name: "Reprint Web File",
    nameBn: "ওয়েব ফাইল আবার নামান",
    icon: "⎙",
    url: "https://indianvisa-bangladesh.nic.in/visa/PrintApplication",
    needs: [ "applicationId", "passportNo", "dob" ],
    whyBn: "জমা দেওয়া আবেদনের তিন পাতার ওয়েব ফাইল আবার নামানোর পাতা। IVAC-এ এই ফাইলটাই লাগে।"
}, {
    id: "earrival",
    page: "earrival",
    name: "e-Arrival Card",
    nameBn: "e-Arrival কার্ড",
    icon: "✈",
    url: "https://indianvisaonline.gov.in/earrival/",
    needs: [ "passportNo", "fullName", "arrivalDate" ],
    whyBn: "ভারতে নামার আগে সবার লাগে, বিনামূল্যে। যাত্রার ৭২ ঘণ্টার মধ্যে পূরণ করতে হয়।"
}, {
    id: "travel-tax",
    page: "travel-tax",
    name: "Travel Tax",
    nameBn: "ভ্রমণ কর",
    icon: "৳",
    url: "https://billpay.sonalibank.com.bd/nbrTravelTax/Collection/Create",
    needs: [ "passportNo", "fullName" ],
    whyBn: "দেশ ছাড়ার আগে NBR-এর ভ্রমণ কর। টাকার অঙ্ক পাতাটাই হিসাব করে — এখানে কোনো হার ধরে নেওয়া হয় না।"
}, {
    id: "port-fee",
    page: "port-fee",
    name: "Land Port Fee",
    nameBn: "স্থলবন্দর ফি",
    icon: "⛳",
    url: "https://passenger.blpa.gov.bd/",
    needs: [ "passportNo", "fullName" ],
    onlyIf: d => !d.transportType || String(d.transportType).toUpperCase() === "LAND",
    whyBn: "বেনাপোলসহ স্থলবন্দর দিয়ে গেলে যাত্রী ফি। আকাশপথে গেলে দরকার নেই।"
}, {
    id: "airsuvidha",
    page: "airsuvidha",
    name: "Air Suvidha",
    nameBn: "Air Suvidha",
    icon: "⚕",
    url: "https://airsuvidha.civilaviation.gov.in/",
    needs: [ "passportNo", "fullName" ],
    optional: true,
    whyBn: "এখন কেবল ইবোলা-আক্রান্ত দেশ থেকে এলে লাগে — বাংলাদেশ সেই তালিকায় নেই। নিয়ম বদলালে এটা তৈরি আছে।"
} ];

export function portalForPage(pageId) {
    return PORTALS.find(p => p.page === pageId) || null;
}

export function portalForUrl(url) {
    const u = String(url || "");
    return PORTALS.find(p => {
        try {
            return new URL(p.url).host === new URL(u).host;
        } catch (_) {
            return false;
        }
    }) || null;
}

export function readiness(portal, data = {}) {
    const hidden = typeof portal.onlyIf === "function" && !portal.onlyIf(data);
    const missing = (portal.needs || []).filter(k => !String(data[k] || "").trim());
    return {
        ok: !hidden && missing.length === 0,
        missing: missing,
        hidden: hidden
    };
}

export function portalsFor(data = {}) {
    return PORTALS.map(p => ({
        ...p,
        ...readiness(p, data)
    }));
}
