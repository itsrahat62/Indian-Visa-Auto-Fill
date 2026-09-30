(function() {
    "use strict";
    if (window.__ivPageHelper) return;
    window.__ivPageHelper = true;
    const $ = () => window.jQuery || window.$ || null;
    function el(id) {
        if (!id) return null;
        return document.getElementById(id) || document.querySelector(`[name="${String(id).replace(/["\\]/g, "\\$&")}"]`);
    }
    window.addEventListener("iv-page-cmd", ev => {
        const {op: op, id: id} = ev.detail || {};
        const node = el(id);
        if (!node && op !== "closepicker") return;
        const jq = $();
        try {
            switch (op) {
              case "change":
                if (jq) jq(node).trigger("change");
                break;

              case "select2":
                if (jq) {
                    try {
                        jq(node).trigger("change.select2");
                    } catch (_) {}
                    try {
                        jq(node).trigger("chosen:updated");
                    } catch (_) {}
                    try {
                        jq(node).trigger("change");
                    } catch (_) {}
                }
                break;

              case "click":
                if (jq) jq(node).trigger("click");
                break;

              case "closepicker":
                if (jq && jq.datepicker && jq.datepicker._hideDatepicker) {
                    try {
                        jq.datepicker._hideDatepicker();
                    } catch (_) {}
                }
                break;

              case "blur":
                if (jq) jq(node).trigger("blur");
                if (typeof node.blur === "function") node.blur();
                break;

              case "jcrop":
                {
                    const api = jq && jq(node).data("Jcrop");
                    const rect = (ev.detail || {}).rect;
                    if (api && Array.isArray(rect) && rect.length === 4) api.setSelect(rect.map(Number));
                    break;
                }
            }
        } catch (_) {}
    });
    const realAlert = window.alert;
    const realConfirm = window.confirm;
    let muted = false;
    window.addEventListener("iv-fill-start", () => {
        if (muted) return;
        muted = true;
        window.alert = function() {
            return undefined;
        };
        window.confirm = function() {
            return true;
        };
    });
    window.addEventListener("iv-fill-end", () => {
        if (!muted) return;
        muted = false;
        window.alert = realAlert;
        window.confirm = realConfirm;
    });
})();
