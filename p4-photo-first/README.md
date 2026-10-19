# P4 Photo-first with animated map

A photo-led one-page site with a small illustrated map of the plot. On a phone the map sticks to the top of the screen and acts as the navigation. Plain HTML, CSS and JS; no external scripts.

Verified on 19 Oct 2026 at 390x844 (phone emulation) and 1366x768, by driving every interaction in headless Chrome (Playwright, system Chrome).

## What the visitor can do

- **Hero:** the pool-and-palms photo, "Casa Paradiso", the whole-estate price first (ZAR 4.0M, about USD 243k) and "Chat with Pierre on WhatsApp".
- **Tap a building on the map** (big house, Top, Middle, Down): it hops, the roof lifts, the door opens and the windows light up. Tofu trots to it, a heart pin marks it, and the page scrolls to that section. Each section has a swipeable photo gallery (tap a photo for a full-screen photo sheet), the facts, the price and a WhatsApp button for that unit. On desktop the same jumps are also in a price list under the map.
- **Tap the pool:** ripples, the caption "Shared splash pool, borehole-fed", and a scroll to the pool photos.
- **Tap Tofu, the beach path or "Time the walk with Tofu":** Tofu runs down the path while a stopwatch counts to 5:00 in about 3.5 s. At the sand he splashes and turns to look back, then the caption "5 minutes to Tofinho beach" appears and the page goes to the aerial map photo ("Beach photo coming").
- **Tap Pedro** (on the map, or the large drawing in his section): he waves and shows the next of 10 facts (Starlink, borehole, pets, 2WD, fenced, whale sharks, 5-minute walk, Superhost 5.0, humpbacks, prepaid electricity). Facts only.
- **Sun / moon button** (top-left of the map, over the sun): switches to night, with stars, moon, glowing windows and fireflies, and the whole page goes dark. The choice is remembered (localStorage inside try/catch).
- **While scrolling:** the map follows along. The current unit glows, its hammock swings, the pool ripples in the pool section, and the big-house kettle steams.
- **Prices section:** the whole estate first (ZAR 4.0M, saves ZAR 445k against ZAR 4.45M separately), then the four units with USD. Each row jumps to its section, and the section ends with "Chat with Pierre on WhatsApp".
- **WhatsApp links:** all go to wa.me/27849781078 with the text "Hi Pierre, I'm looking at Casa Paradiso. I'd like to know more about {the whole estate | the big house | Cottage Top | Cottage Middle | Cottage Down | the prices | the whole estate, and arranging a viewing}." All seven links were checked.

## Placeholders

- **Pedro** is a placeholder drawing, held in the `PEDRO` string in the script so it is easy to swap when his photo arrives.
- **Tofu** (the name and the drawing) is a working mascot.
- **Cottage photos:** the three cottages share one photo set, and each cottage section says so.
- **Beach photo:** the aerial map stands in, captioned "Beach photo coming".
- **Plot layout** on the map is approximate, from the brief.
- **og.jpg** is 1200x630 and 217 KB: the hero photo, the title and the price, with the map card. The `og:image` tag is relative (`og.jpg`). Make it an absolute URL once the page has a home, because some link previewers ignore relative paths.

## First-screen transfer (measured, cache off, nothing scrolled)

| Device | Before | After |
|---|---|---|
| Phone 390x844, 1x | 574 KB | **402 KB** |
| Phone 390x844, 3x | 1,040 KB | **576 KB** |
| Desktop 1366x768 | 1,040 KB | **576 KB** |

There are 7 network requests: HTML 81 KB, hero 177 KB (960 px) or 351 KB (1400 px), two gallery thumbs of about 49 KB each, and fonts 47 KB. The other 23 requests are inline `data:` blur placeholders, which transfer 0 bytes.

Fixes that got it under budget:
- A new 960 px hero (`img/pool-palms-960.webp`), plus a corrected `sizes`.
- Thumbs first in the galleries: slides load the 560 px thumb (`loading="lazy"`). The 1400 px version is only attached once a slide is at least 35% on screen.

## Fixed in this pass

- **Hero photo on phone:** it only filled the top third of the hero, because the shared `.ph` aspect ratio overrode `inset:0`. It now fills the whole hero.
- **Desktop:** the map card no longer touches the hero WhatsApp button (button bottom at 618 px, card top at 672 px). A left-hand scrim makes the title readable over the palm fronds.
- **Map colours:** checked by day and by night. The trees are green, not black.
- **Tofu covering Pedro:** after a pool tap Tofu stood on top of Pedro and stole his taps. His pool spot is now left of the pool. Pedro and Tofu also have larger invisible tap areas.
- **Day/night button:** it covered the end of the beach run. It moved over the sun (top-left), and the stopwatch moved to top-centre.
- **Captions:** they wrapped into a two-line block that covered the pool. They are now one line at the top of the card and appear after the stopwatch reads 5:00.
- **Focus ring on the dog:** it showed a black box after a tap. It is now a soft pink glow, shown only for keyboard focus.
- **Map labels:** 10% larger.
- **Heart pin over the big house:** it sat under the "Tap a house…" hint. It moved right.

## Constraints check

- Title "Casa Paradiso Tofinho" (3 words). `body` background is explicit (white by day, #13202e at night).
- No external scripts. Fonts are Young Serif and Figtree from Google Fonts only.
- No horizontal scroll at 390 px (`scrollWidth` 390). Gutters are 16 px. Hero text, price and map labels were measured inside the gutters and the card.
- localStorage is only used through a try/catch wrapper. No forms, cookies or analytics.
- The folder is 9.2 MB.

## Screenshots

- `shots/phone.png` (390x844), `shots/desktop.png` (1366x768). Also `shots/phone-map.png` (sticky map at the end of the beach run) and `shots/phone-night.png`.
- I took these with Playwright mobile emulation, not the `chrome.exe --headless --screenshot` command line. On this machine that command lays the page out 500 px wide and crops it to 390, so the text looks cut off at the right edge when the page is fine.
- URL switches for screenshots: `?time=night`, `?active=big|top|middle|down|pool`, `?pedro=1`.

## Next, with more time

- Per-cottage photos and a real beach photo, once they exist.
- Pedro drawn from his reference photo.
- A sound toggle for waves (off by default), and a "show me the real thing" switch that swaps the map for the aerial photo.
- Re-encode the 1400 px hero (351 KB): this palm-heavy photo barely shrinks in WebP, so try AVIF or a tighter crop.
