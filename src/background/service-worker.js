import { nextProfile, getActiveProfile, getSettings, saveSettings } from "../lib/store.js";

const PORTAL = new RegExp("^https://(" + [ "indianvisa-bangladesh\\.nic\\.in", "([a-z0-9-]+\\.)?indianvisaonline\\.gov\\.in" ].join("|") + ")/", "i");

function openOptions(hash) {
    const url = chrome.runtime.getURL("src/options/options.html") + (hash ? `#${hash}` : "");
    chrome.tabs.create({
        url: url
    });
}

function autoState(s) {
    const state = {
        ok: true,
        autoVisa: !!s.autoVisa
    };
    return state;
}

async function setAutoVisa(on) {
    await saveSettings({
        autoVisa: on
    });
    await refreshBadge();
}

async function refreshBadge() {
    const s = await getSettings();
    if (s.autoVisa) return badge("VISA", "#2f7cf6");
    return badge("", "#ff7a18");
}

chrome.runtime.onInstalled.addListener(async details => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "iv-profiles",
            title: "Profiles & settings",
            contexts: [ "page", "action" ]
        });
        chrome.contextMenus.create({
            id: "iv-guide",
            title: "User Guide",
            contexts: [ "page", "action" ]
        });
    });
    if (details.reason === "install") openOptions("welcome");
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case "iv-profiles":
        openOptions("profiles");
        break;

      case "iv-guide":
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/docs/docs.html")
        });
        break;
    }
});

chrome.commands.onCommand.addListener(async command => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    if (!tab?.id) return;
    if (command === "next-profile") {
        const p = await nextProfile();
        await badge(p ? p.name.slice(0, 4) : "", "#ff7a18");
        sendToTab(tab.id, {
            type: "IV_REFRESH"
        });
        return;
    }
    if (!PORTAL.test(tab.url || "")) return;
    if (command === "fill-page") sendToTab(tab.id, {
        type: "IV_FILL"
    });
    if (command === "toggle-teach") sendToTab(tab.id, {
        type: "IV_TEACH"
    });
});

const REG_BOUNCE = tabId => `regBounce:${tabId}`;

const REG_BOUNCE_MS = 6e4;

if (chrome.webRequest) {
    chrome.webRequest.onBeforeRedirect.addListener(d => {
        if (d.tabId < 0 || d.method !== "GET") return;
        if (!/\/visa\/index\.html/i.test(d.redirectUrl || "")) return;
        chrome.storage.session.set({
            [REG_BOUNCE(d.tabId)]: Date.now()
        }).catch(() => {});
    }, {
        urls: [ "https://indianvisa-bangladesh.nic.in/visa/Registration*" ],
        types: [ "main_frame" ]
    });
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    (async () => {
        switch (msg?.type) {
          case "IV_REG_BOUNCED":
            {
                const key = REG_BOUNCE(sender.tab?.id);
                const at = sender.tab ? (await chrome.storage.session.get(key))[key] : 0;
                if (at) await chrome.storage.session.remove(key);
                respond({
                    ok: true,
                    bounced: !!at && Date.now() - at < REG_BOUNCE_MS
                });
                break;
            }

          case "IV_OPEN_OPTIONS":
            openOptions(msg.hash || "profiles");
            respond({
                ok: true
            });
            break;

          case "IV_OPEN_DOCS":
            chrome.tabs.create({
                url: chrome.runtime.getURL("src/docs/docs.html")
            });
            respond({
                ok: true
            });
            break;

          case "IV_ACTIVE":
            {
                const p = await getActiveProfile();
                respond({
                    ok: true,
                    profile: p ? {
                        id: p.id,
                        name: p.name
                    } : null
                });
                break;
            }

          case "IV_SET_AUTO":
            {
                const on = !!msg.on;
                if (msg.which === "visa") await setAutoVisa(on);
                respond(autoState(await getSettings()));
                break;
            }

          case "IV_GET_AUTO":
            {
                respond(autoState(await getSettings()));
                break;
            }

          default:
            respond({
                ok: false
            });
        }
    })();
    return true;
});

async function badge(text, colour) {
    try {
        await chrome.action.setBadgeText({
            text: text || ""
        });
        await chrome.action.setBadgeBackgroundColor({
            color: colour || "#ff7a18"
        });
    } catch (_) {}
}

chrome.tabs.onActivated.addListener(async ({tabId: tabId}) => {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    const s = await getSettings();
    if (s.autoVisa) {
        await refreshBadge();
        return;
    }
    const p = await getActiveProfile();
    badge(PORTAL.test(tab?.url || "") && p ? p.name.slice(0, 4) : "", "#ff7a18");
});

function sendToTab(tabId, msg) {
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, msg).catch(() => {
        chrome.scripting.executeScript({
            target: {
                tabId: tabId
            },
            files: [ "src/content/content.js" ]
        }).then(() => chrome.tabs.sendMessage(tabId, msg)).catch(() => {});
    });
}
