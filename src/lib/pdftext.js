let pdfjs = null;

async function lib() {
    if (pdfjs) return pdfjs;
    pdfjs = await (import(chrome.runtime.getURL("vendor/pdfjs/pdf.mjs")));
    pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdfjs/pdf.worker.mjs");
    return pdfjs;
}

async function open(fileOrBuffer) {
    const p = await lib();
    const data = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
    return p.getDocument({
        data: data,
        isEvalSupported: false,
        useSystemFonts: true
    }).promise;
}

export async function readText(fileOrBuffer, {maxPages: maxPages = 12} = {}) {
    const doc = await open(fileOrBuffer);
    const pages = Math.min(doc.numPages, maxPages);
    const chunks = [];
    for (let i = 1; i <= pages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const rows = new Map;
        for (const item of content.items) {
            if (!item.str || !item.str.trim()) continue;
            const y = Math.round(item.transform[5] / 3) * 3;
            if (!rows.has(y)) rows.set(y, []);
            rows.get(y).push({
                x: item.transform[4],
                s: item.str
            });
        }
        const lines = [ ...rows.entries() ].sort((a, b) => b[0] - a[0]).map(([, items]) => items.sort((a, b) => a.x - b.x).map(i => i.s).join(" ").replace(/\s+/g, " ").trim()).filter(Boolean);
        chunks.push(lines.join("\n"));
    }
    await doc.destroy();
    return chunks.join("\n");
}

export function looksScanned(text) {
    return !text || text.replace(/\s/g, "").length < 120;
}

export async function renderPages(fileOrBuffer, {maxPages: maxPages = 2, scale: scale = 2.4} = {}) {
    const doc = await open(fileOrBuffer);
    const out = [];
    const pages = Math.min(doc.numPages, maxPages);
    for (let i = 1; i <= pages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({
            scale: scale
        });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d", {
            willReadFrequently: true
        });
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        out.push(canvas);
    }
    await doc.destroy();
    return out;
}
