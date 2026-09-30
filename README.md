# Indian Visa Auto Fill

Fills the nine-page Indian visa application at indianvisa-bangladesh.nic.in from a saved profile, and the four portals that come after it.

## Install

1. Download this repository (**Code → Download ZIP**) and unzip it, or clone it.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**, top right.
4. **Load unpacked**, and choose the unzipped folder — the one with `manifest.json` in it.

## Where it works

- `indianvisa-bangladesh.nic.in` — the visa application, all nine pages
- `indianvisaonline.gov.in/earrival` — the e-Arrival card
- `airsuvidha.civilaviation.gov.in` — Air Suvidha self-declaration
- `billpay.sonalibank.com.bd` — NBR travel tax
- `passenger.blpa.gov.bd` — land-port passenger fee

It asks for no other host, and does nothing on any other page.

## What it does

- Reads a passport, a submitted web file or the hospital's invitation letter and fills a profile from it
- Writes the covering letter and the Visa Undertaking Form as printable PDFs
- Renames and shrinks documents under the portal's 500KB limit before upload
- Crops a photograph to the portal's square, with its own rules on ears, AI images and lab prints

## What it will never do

- **Captchas and Turnstile.** Not solved, not bypassed, not outsourced. You type them.
- **The payment.** The chain stops at the payment page. Pressing "Proceed to Pay" is yours.
- **The final declaration.** The "I hereby declare" tick is a statement in your name, so you tick it.

## Your data

Everything is kept in this browser profile, in `chrome.storage.local`. Nothing is
sent anywhere — there is no server, no account and no analytics. Back it up from
the options page, and keep that file somewhere safe: it holds passport details.

## This folder is generated

Both extensions are built out of one source tree by `tools/build.mjs`, which is
what keeps the applicant's name spelled the same way in both. Editing anything
here is temporary — the next build overwrites it. Change the source instead.

Built from `79f98b3` · version 2.0.0
