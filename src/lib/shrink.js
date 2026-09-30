const LADDER = [ [ 1, .92 ], [ 1, .82 ], [ 1, .72 ], [ 1, .62 ], [ .85, .72 ], [ .85, .6 ], [ .7, .72 ], [ .7, .6 ], [ .6, .6 ], [ .5, .6 ], [ .45, .55 ], [ .4, .5 ] ];

const MIN_EDGE_PX = 900;

export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader;
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(blob);
    });
}

export async function dataUrlToBlob(dataUrl) {
    return (await fetch(dataUrl)).blob();
}

function canvasOf(w, h) {
    if (typeof OffscreenCanvas === "function") return new OffscreenCanvas(w, h);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
}

function toBlob(canvas, type, quality) {
    if (canvas.convertToBlob) return canvas.convertToBlob({
        type: type,
        quality: quality
    });
    return new Promise(res => canvas.toBlob(res, type, quality));
}

export function squareCrop(width, height, anchorY = .12) {
    const side = Math.min(width, height);
    const x = Math.round((width - side) / 2);
    const y = Math.round((height - side) * Math.min(Math.max(anchorY, 0), 1));
    return {
        x: x,
        y: y,
        side: side
    };
}

export async function shrinkImage(blob, opts = {}) {
    const {maxBytes: maxBytes = 500 * 1024, square: square = false, minPx: minPx = 350, anchorY: anchorY = .12, crop: chosen = null} = opts;
    const bmp = await createImageBitmap(blob);
    const fitted = chosen && Number(chosen.side) > 0 ? (() => {
        const side = Math.min(Math.round(chosen.side), bmp.width, bmp.height);
        return {
            side: side,
            x: Math.min(Math.max(Math.round(chosen.x || 0), 0), bmp.width - side),
            y: Math.min(Math.max(Math.round(chosen.y || 0), 0), bmp.height - side)
        };
    })() : null;
    const crop = fitted || (square ? squareCrop(bmp.width, bmp.height, anchorY) : {
        x: 0,
        y: 0,
        side: 0
    });
    const cropping = square || !!fitted;
    const srcW = cropping ? crop.side : bmp.width;
    const srcH = cropping ? crop.side : bmp.height;
    let last = null;
    let steps = 0;
    for (const [scale, quality] of LADDER) {
        const w = Math.max(1, Math.round(srcW * scale));
        const h = Math.max(1, Math.round(srcH * scale));
        const floor = cropping ? minPx : Math.min(MIN_EDGE_PX, Math.max(srcW, srcH));
        if (Math.max(w, h) < floor && last) break;
        const canvas = canvasOf(w, h);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
        if (cropping) ctx.drawImage(bmp, crop.x, crop.y, crop.side, crop.side, 0, 0, w, h); else ctx.drawImage(bmp, 0, 0, w, h);
        const out = await toBlob(canvas, "image/jpeg", quality);
        steps++;
        last = {
            blob: out,
            width: w,
            height: h,
            crop: cropping ? crop : null
        };
        if (out.size <= maxBytes) {
            bmp.close?.();
            return {
                ...last,
                steps: steps,
                gaveUp: false
            };
        }
    }
    bmp.close?.();
    return {
        ...last,
        steps: steps,
        gaveUp: true
    };
}

let pdfjsLib = null;

async function pdfjs() {
    if (pdfjsLib) return pdfjsLib;
    pdfjsLib = await (import(chrome.runtime.getURL("vendor/pdfjs/pdf.mjs")));
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdfjs/pdf.worker.mjs");
    return pdfjsLib;
}

export function pdfFromJpegs(pages) {
    const parts = [];
    const offsets = [];
    let len = 0;
    const put = chunk => {
        const bytes = typeof chunk === "string" ? Uint8Array.from(chunk, c => c.charCodeAt(0) & 255) : chunk;
        parts.push(bytes);
        len += bytes.length;
    };
    const mark = n => {
        offsets[n] = len;
    };
    put("%PDF-1.4\n");
    const pageObj = i => 3 + i * 3;
    const contentObj = i => 4 + i * 3;
    const imageObj = i => 5 + i * 3;
    const total = 2 + pages.length * 3;
    mark(1);
    put("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    mark(2);
    put(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [` + pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ") + "] >>\nendobj\n");
    pages.forEach((p, i) => {
        const {width: w, height: h} = p;
        mark(pageObj(i));
        put(`${pageObj(i)} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] ` + `/Resources << /XObject << /Im0 ${imageObj(i)} 0 R >> >> ` + `/Contents ${contentObj(i)} 0 R >>\nendobj\n`);
        const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q\n`;
        mark(contentObj(i));
        put(`${contentObj(i)} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
        mark(imageObj(i));
        put(`${imageObj(i)} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} ` + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);
        put(p.bytes);
        put("\nendstream\nendobj\n");
    });
    const xref = len;
    put(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
    for (let n = 1; n <= total; n++) put(String(offsets[n]).padStart(10, "0") + " 00000 n \n");
    put(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(len);
    let at = 0;
    for (const p of parts) {
        out.set(p, at);
        at += p.length;
    }
    return new Blob([ out ], {
        type: "application/pdf"
    });
}

export async function shrinkPdf(blob, opts = {}) {
    const {maxBytes: maxBytes = 500 * 1024} = opts;
    if (blob.size <= maxBytes) return {
        blob: blob,
        steps: 0,
        gaveUp: false,
        pages: 0
    };
    const lib = await pdfjs();
    const data = new Uint8Array(await blob.arrayBuffer());
    const doc = await lib.getDocument({
        data: data,
        isEvalSupported: false
    }).promise;
    let last = null;
    let steps = 0;
    for (const [scale, quality] of LADDER) {
        const pages = [];
        for (let n = 1; n <= doc.numPages; n++) {
            const page = await doc.getPage(n);
            const viewport = page.getViewport({
                scale: 2 * scale
            });
            const w = Math.max(1, Math.round(viewport.width));
            const h = Math.max(1, Math.round(viewport.height));
            if (Math.max(w, h) < MIN_EDGE_PX && last) {
                return {
                    ...last,
                    steps: steps,
                    gaveUp: true
                };
            }
            const canvas = canvasOf(w, h);
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, w, h);
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            const jpeg = await toBlob(canvas, "image/jpeg", quality);
            pages.push({
                bytes: new Uint8Array(await jpeg.arrayBuffer()),
                width: w,
                height: h
            });
        }
        const out = pdfFromJpegs(pages);
        steps++;
        last = {
            blob: out,
            pages: pages.length
        };
        if (out.size <= maxBytes) return {
            ...last,
            steps: steps,
            gaveUp: false
        };
    }
    return {
        ...last,
        steps: steps,
        gaveUp: true
    };
}

export async function fitToLimit(blob, opts = {}) {
    const {maxBytes: maxBytes = 500 * 1024, square: square = false} = opts;
    const isPdf = blob.type === "application/pdf" || /\.pdf$/i.test(blob.name || "");
    if (isPdf) return {
        ...await shrinkPdf(blob, opts),
        kind: "pdf"
    };
    if (!square && blob.size <= maxBytes) {
        return {
            blob: blob,
            steps: 0,
            gaveUp: false,
            kind: "image"
        };
    }
    return {
        ...await shrinkImage(blob, opts),
        kind: "image"
    };
}
