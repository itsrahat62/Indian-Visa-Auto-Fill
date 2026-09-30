const visible = el => el.offsetParent !== null || el.getClientRects().length > 0;

export function fieldLabel(el) {
    const cell = el.closest && el.closest("td");
    const prev = cell && cell.previousElementSibling;
    const text = (prev && prev.textContent || "").replace(/\s+/g, " ").replace(/\s*\*\s*$/, "").trim();
    return text.slice(0, 40) || el.id || el.name || "a field";
}

export function collectBlockers(doc) {
    return [ ...doc.querySelectorAll(".error_input") ].filter(visible).map(el => {
        const note = el.parentElement && el.parentElement.nextElementSibling;
        const why = (note && note.classList.contains("error1") && note.textContent || "").replace(/\s+/g, " ").trim();
        const label = fieldLabel(el);
        return {
            el: el,
            label: label,
            why: why,
            text: why ? `${label} — ${why}` : label
        };
    });
}
