export const A4 = {
    w: 595.28,
    h: 841.89
};

const FONTS = {
    regular: "Helvetica",
    bold: "Helvetica-Bold",
    italic: "Helvetica-Oblique"
};

const W_REGULAR = [ 278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584 ];

const W_BOLD = [ 278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584 ];

export function widthOf(text, size, bold = false) {
    const table = bold ? W_BOLD : W_REGULAR;
    let w = 0;
    for (const ch of String(text)) {
        const c = ch.codePointAt(0);
        w += (c >= 32 && c <= 126 ? table[c - 32] : table[0]) || 0;
    }
    return w * size / 1e3;
}

const SUBSTITUTES = {
    "‘": "'",
    "’": "'",
    "“": '"',
    "”": '"',
    "–": "-",
    "—": "-",
    "…": "...",
    " ": " ",
    "৳": "Tk ",
    "₹": "Rs "
};

export function pdfString(s) {
    let out = "";
    for (const ch of String(s == null ? "" : s)) {
        const sub = SUBSTITUTES[ch];
        const c = sub == null ? ch : sub;
        for (const k of c) {
            const code = k.codePointAt(0);
            if (code < 32 || code > 126) {
                out += "?";
                continue;
            }
            if (k === "(" || k === ")" || k === "\\") out += `\\${k}`; else out += k;
        }
    }
    return out;
}

export function wrap(words, maxWidth, size) {
    const lines = [];
    let line = [];
    let w = 0;
    const spaceW = widthOf(" ", size);
    for (const word of words) {
        const ww = widthOf(word.text, size, word.bold);
        const add = line.length && !word.tight ? spaceW + ww : ww;
        if (line.length && !word.tight && w + add > maxWidth) {
            lines.push({
                words: line,
                width: w
            });
            line = [ word ];
            w = ww;
        } else {
            line.push(word);
            w += add;
        }
    }
    if (line.length) lines.push({
        words: line,
        width: w,
        last: true
    });
    return lines;
}

export function words(text) {
    const out = [];
    let prevEndsSpace = true;
    for (const chunk of String(text).split(/(\*\*[^*]+\*\*)/g)) {
        if (!chunk) continue;
        const bold = chunk.startsWith("**") && chunk.endsWith("**");
        const body = bold ? chunk.slice(2, -2) : chunk;
        const joins = out.length > 0 && !prevEndsSpace && !/^\s/.test(body);
        body.split(/\s+/).filter(Boolean).forEach((w, j) => {
            out.push({
                text: w,
                bold: bold,
                tight: joins && j === 0
            });
        });
        if (body.trim()) prevEndsSpace = /\s$/.test(body);
    }
    return out;
}

class Page {
    constructor(doc) {
        this.doc = doc;
        this.ops = [];
        this.y = doc.margin.top;
    }
    get width() {
        return this.doc.size.w - this.doc.margin.left - this.doc.margin.right;
    }
    get room() {
        return this.doc.size.h - this.doc.margin.bottom - this.y;
    }
    line(lineWords, x, size, {justify: justify = false, width: width = 0} = {}) {
        const top = this.doc.size.h - this.y - size;
        this.ops.push("BT");
        const spaceW = widthOf(" ", size);
        const gaps = lineWords.reduce((n, w, i) => n + (i > 0 && !w.tight ? 1 : 0), 0);
        let extra = 0;
        if (justify && gaps > 0) {
            const natural = lineWords.reduce((a, w) => a + widthOf(w.text, size, w.bold), 0) + gaps * spaceW;
            extra = Math.max(0, (width - natural) / gaps);
        }
        let cursor = x;
        let bold = null;
        for (let i = 0; i < lineWords.length; i++) {
            const w = lineWords[i];
            if (i > 0 && !w.tight) cursor += spaceW + extra;
            if (w.bold !== bold) {
                bold = w.bold;
                this.ops.push(`/${bold ? "FB" : "FR"} ${size} Tf`);
            }
            this.ops.push(`1 0 0 1 ${cursor.toFixed(2)} ${top.toFixed(2)} Tm`);
            this.ops.push(`(${pdfString(w.text)}) Tj`);
            cursor += widthOf(w.text, size, w.bold);
        }
        this.ops.push("ET");
    }
    rule(x, width, thickness = .8) {
        const yy = this.doc.size.h - this.y;
        this.ops.push(`${thickness} w`, `${x.toFixed(2)} ${yy.toFixed(2)} m`, `${(x + width).toFixed(2)} ${yy.toFixed(2)} l`, "S");
    }
    stream() {
        return this.ops.join("\n");
    }
}

export class PdfDoc {
    constructor({size: size = A4, margin: margin = {}, size12: size12 = 11, leading: leading = 1.45} = {}) {
        this.size = size;
        this.margin = {
            top: 72,
            right: 62,
            bottom: 72,
            left: 62,
            ...margin
        };
        this.fontSize = size12;
        this.leading = leading;
        this.pages = [];
        this.page = null;
        this.newPage();
    }
    newPage() {
        this.page = new Page(this);
        this.pages.push(this.page);
        return this.page;
    }
    gap(points) {
        this.page.y += points;
    }
    need(points) {
        if (this.page.room < points) this.newPage();
    }
    paragraph(text, {size: size = this.fontSize, justify: justify = true, indent: indent = 0, after: after = 0} = {}) {
        const x = this.margin.left + indent;
        const width = this.page.width - indent;
        const lines = wrap(words(text), width, size);
        const lh = size * this.leading;
        for (const line of lines) {
            this.need(lh);
            this.page.line(line.words, x, size, {
                justify: justify && !line.last,
                width: width
            });
            this.page.y += lh;
        }
        if (after) this.gap(after);
    }
    text(line, {size: size = this.fontSize, bold: bold = false, indent: indent = 0, after: after = 0} = {}) {
        const lh = size * this.leading;
        this.need(lh);
        this.page.line(words(bold ? `**${line}**` : String(line)), this.margin.left + indent, size);
        this.page.y += lh;
        if (after) this.gap(after);
    }
    heading(line, {size: size = this.fontSize, after: after = 0, centre: centre = false} = {}) {
        const lh = size * this.leading;
        this.need(lh + 4);
        const w = widthOf(line, size, true);
        const x = centre ? this.margin.left + (this.page.width - w) / 2 : this.margin.left;
        this.page.line(words(`**${line}**`), x, size);
        this.page.y += size + 2;
        this.page.rule(x, w, .7);
        this.page.y += lh - size + 2;
        if (after) this.gap(after);
    }
    signatureLine(width = 250, {after: after = 4} = {}) {
        this.need(20);
        this.page.y += 2;
        this.page.rule(this.margin.left, width);
        this.page.y += after;
    }
    build() {
        const objects = [];
        const add = body => {
            objects.push(body);
            return objects.length;
        };
        const pageIds = [];
        const contentIds = [];
        for (const p of this.pages) {
            const stream = p.stream();
            contentIds.push(add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`));
        }
        const fontR = add(`<< /Type /Font /Subtype /Type1 /BaseFont /${FONTS.regular} /Encoding /WinAnsiEncoding >>`);
        const fontB = add(`<< /Type /Font /Subtype /Type1 /BaseFont /${FONTS.bold} /Encoding /WinAnsiEncoding >>`);
        const pagesId = objects.length + this.pages.length + 1;
        for (let i = 0; i < this.pages.length; i++) {
            pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R ` + `/MediaBox [0 0 ${this.size.w.toFixed(2)} ${this.size.h.toFixed(2)}] ` + `/Resources << /Font << /FR ${fontR} 0 R /FB ${fontB} 0 R >> >> ` + `/Contents ${contentIds[i]} 0 R >>`));
        }
        add(`<< /Type /Pages /Kids [${pageIds.map(i => `${i} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
        const rootId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
        let out = "%PDF-1.4\n";
        const offsets = [ 0 ];
        objects.forEach((body, i) => {
            offsets.push(out.length);
            out += `${i + 1} 0 obj\n${body}\nendobj\n`;
        });
        const xref = out.length;
        out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        for (let i = 1; i <= objects.length; i++) {
            out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
        }
        out += `trailer\n<< /Size ${objects.length + 1} /Root ${rootId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
        const bytes = new Uint8Array(out.length);
        for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
        return bytes;
    }
}
