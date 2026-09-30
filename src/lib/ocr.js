const TESS_DIR = "vendor/tesseract/";

const MRZ_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";

let loading = null;

function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = chrome.runtime.getURL(TESS_DIR + "tesseract.min.js");
        s.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("Tesseract load holo na"));
        s.onerror = () => reject(new Error("Tesseract file paoa jacche na"));
        document.head.appendChild(s);
    });
    return loading;
}

let workerPromise = null;

async function getWorker(onProgress) {
    if (workerPromise) return workerPromise;
    const Tesseract = await loadTesseract();
    workerPromise = Tesseract.createWorker("eng", 1, {
        workerPath: chrome.runtime.getURL(TESS_DIR + "worker.min.js"),
        corePath: chrome.runtime.getURL(TESS_DIR + "tesseract-core-simd.wasm.js"),
        langPath: chrome.runtime.getURL(TESS_DIR),
        gzip: true,
        workerBlobURL: false,
        logger: m => {
            if (onProgress && m.status && typeof m.progress === "number") {
                onProgress(m.progress, m.status);
            }
        }
    });
    return workerPromise;
}

export async function warm() {
    await getWorker();
}

export async function terminate() {
    if (!workerPromise) return;
    try {
        (await workerPromise).terminate();
    } catch (_) {}
    workerPromise = null;
}

function preprocess(source, {threshold: threshold = false} = {}) {
    const w = source.width || source.naturalWidth;
    const h = source.height || source.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });
    ctx.drawImage(source, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const px = img.data;
    let min = 255, max = 0;
    const grey = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        const g = px[i] * .299 + px[i + 1] * .587 + px[i + 2] * .114 | 0;
        grey[j] = g;
        if (g < min) min = g;
        if (g > max) max = g;
    }
    const span = Math.max(1, max - min);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        let g = (grey[j] - min) * 255 / span | 0;
        if (threshold) g = g > 150 ? 255 : 0;
        px[i] = px[i + 1] = px[i + 2] = g;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
}

function cropMrzStrip(source, fraction = .28) {
    const w = source.width || source.naturalWidth;
    const h = source.height || source.naturalHeight;
    const sh = Math.round(h * fraction);
    const scale = Math.min(3, Math.max(1, 1400 / w));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, h - sh, w, sh, 0, 0, canvas.width, canvas.height);
    return preprocess(canvas, {
        threshold: true
    });
}

export function fileToImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image;
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Chobi ta pora gelo na"));
        };
        img.src = url;
    });
}

export async function recognise(source, onProgress) {
    const worker = await getWorker(onProgress);
    onProgress?.(.1, "page pora hocche");
    await worker.setParameters({
        tessedit_char_whitelist: "",
        tessedit_pageseg_mode: "3"
    });
    const page = await worker.recognize(preprocess(source));
    const pageText = page?.data?.text || "";
    onProgress?.(.75, "MRZ pora hocche");
    await worker.setParameters({
        tessedit_char_whitelist: MRZ_CHARS,
        tessedit_pageseg_mode: "6"
    });
    let mrzText = "";
    try {
        const mrz = await worker.recognize(cropMrzStrip(source));
        mrzText = (mrz?.data?.text || "").split("\n").map(l => l.replace(/\s+/g, "")).filter(l => l.length >= 25).join("\n");
    } catch (_) {}
    await worker.setParameters({
        tessedit_char_whitelist: "",
        tessedit_pageseg_mode: "3"
    });
    onProgress?.(1, "shesh");
    return mrzText ? `${pageText}\n${mrzText}` : pageText;
}

export async function recogniseAll(sources, onProgress) {
    const parts = [];
    for (let i = 0; i < sources.length; i++) {
        const base = i / sources.length;
        const span = 1 / sources.length;
        parts.push(await recognise(sources[i], (p, s) => onProgress?.(base + p * span, s)));
    }
    return parts.join("\n");
}
