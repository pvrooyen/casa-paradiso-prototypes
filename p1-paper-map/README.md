# P1 "Paper map": Casa Paradiso prototype

One full-screen, playable map of the whole plot, hand-drawn in ink and watercolour on cream paper. Nothing scrolls. Everything else (photo sheets, prices, Pedro's bubbles, WhatsApp) opens as an overlay on top of the map and closes back to it.

Files: `index.html` (layout, styles, HUD), `scene.js` (draws the whole map as inline SVG), `app.js` (fitting, idle life, interactions), `photos/` (19 real photos, each with a thumb), `og.jpg` (1200x630 share image, 122 KB), `shots/phone.png` (390x844), `shots/desktop.png` (1366x768).

## What the visitor can do

1. **Tap a house** (Big house, Top, Middle, Down, or its label): the thatch roof lifts like a dollhouse lid to show the red-oxide floor and tiny beds, the door swings open and the windows light up. Then a sheet slides up with 6 to 8 swipeable real photos, the facts line, the price (ZAR and USD) and a WhatsApp button pre-filled with that unit's name. Tap a photo for a full-size view. Closing the sheet drops the roof back with a bounce. Tapping the lapa opens the big house.
2. **Tap the pool**: ripples and a splash, the caption "Shared splash pool, borehole-fed", then a sheet with one pool photo.
3. **Tap Tofu the dog, the beach path, or "Beach walk"**: Tofu runs out of the beach gate and down the path to the sand (GSAP MotionPathPlugin) while a stopwatch counts 0:00 to 5:00 in 3.6 seconds. He ends with a happy hop, the caption "5 minutes to Tofinho beach" and a sheet with the aerial map ("Beach photo coming"). When the sheet closes he runs home.
4. **Tap Pedro**: he waves and shows the next of 13 rotating facts (Starlink, borehole, pets, 2WD, fenced 1,800 m², whale sharks, 5-minute walk, Airbnb 5.0 Superhost, humpbacks, mantas, seafood market, Johannesburg drive, prepaid electricity). Facts only.
5. **Sun / moon button**: the paper tints to evening blue, the windows and the lapa's string lights glow, ink-asterisk stars pop in, the moon rises and fireflies drift in the garden.
6. **Price chip** (top right, always visible): opens the price card. The whole estate comes first (ZAR 4.0M, about USD 243k, ZAR 4.45M separately, save ZAR 445k), then the four units. Each unit name opens its sheet, and there is a "Chat with Pierre on WhatsApp" button. A green WhatsApp button also sits in the bottom HUD.

Small rewards for tapping: the chicken hops and clucks, the washing flaps on the line, the red enamel kettle whistles and puffs steam, each cottage hammock swings, the little car bounces ("An ordinary 2WD car gets here"), the whale shark dives, the dhow rocks. When nobody touches anything, the map stays alive: palms sway, Tofu wanders and sniffs around the garden, the kettle steams, hammocks and washing sway, the chicken pecks and potters, the whale shark patrols the bay, the dhow drifts, waves shimmer.

Sound toggle (off by default): synthesised waves via WebAudio, no audio file.

Keyboard: every tappable thing is focusable (Tab) and works with Enter or Space; Esc closes sheets and the photo view. `prefers-reduced-motion` turns off the idle motion and shortens the runs.

## Decisions I made (no questions asked)

- **Orientation**: the sea is drawn at the top (the horizon), the lane at the bottom, cottages on the left stepping down toward the gate, big house on the right and higher, beach path leaving from the top-right corner. This matches the brief's plot layout but is not compass-accurate, so I left out a compass rose. The owner should correct the layout.
- **Framing**: portrait screens fit the fenced plot (with a small margin) to the width, between the title and the controls, with the ocean above. Landscape screens zoom so the plot is about 60% of the height with the sea in frame; the land, palms and lane continue to the edges. The title and price chip float over the sea; the controls sit bottom-centre on phones and bottom-right on desktop.
- **Cottage photos**: we do not know which photos belong to which cottage, so all three use the shared cottage photos in a different order (Top leads with the view, Middle with the morning deck, Down with the stairs).
- **Big house m²**: not in the brief, so the facts line gives beds, baths, sleeps 8, loft and deck but no floor area.
- **Kettle**: sits on a little fire by the big house stairs next to Pedro, so its steam is visible (a kettle on the covered deck would be hidden under the thatch).
- **Night mode is not remembered** between visits, so the owner always opens the map in daylight.
- Two copied photos that no sheet used (`pool-loungers`, `garden-pool-from-above`) were removed to keep the folder at 10 MB.

## Placeholders

- **Pedro** is a friendly generic figure (teal shirt, khaki shorts). Swap the single `drawPedro()` function in `scene.js` when the reference photo arrives.
- **Tofu** is the working name; rename it in `scene.js` (map label and aria text).
- **Beach photo**: the beach sheet shows the aerial map and says "Beach photo coming".
- **Plot layout and building proportions** are approximate.
- The thatch hip roofs, decks, stilts and lapa are drawn from the photos' general look, not measured.

## First-screen transfer size

Measured 19 Oct 2026, photos excluded (none load until a sheet opens; strip images use `loading="lazy"` after the first two, and the full-size versions only load on tap):

| Item | Transfer |
|---|---|
| index.html | 5 KB gzipped (16 KB raw) |
| scene.js | 17 KB gzipped (61 KB raw) |
| app.js | 11 KB gzipped (37 KB raw) |
| gsap.min.js 3.13.0 | 28 KB |
| MotionPathPlugin.min.js 3.13.0 | 10 KB |
| Google Fonts CSS + woff2 (Caveat, Alegreya Sans, latin) | about 130 to 200 KB |
| **Total** | **about 200 to 270 KB** (about 330 KB if the host does not gzip) |

Well under the 1 MB budget. The map is built from code in one pass; there is no image to download for the first screen.

## External scripts

- `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js`
- `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MotionPathPlugin.min.js`
- Fonts from Google Fonts: Caveat (500, 700) for the hand-lettered labels, Alegreya Sans (400, 500, 700) for facts and prices.

If the GSAP CDN fails, `app.js` falls back to a stand-in: the map, sheets, prices and WhatsApp links still work, just without animation.

## Performance notes

- The static washes (sea, land, paths, fence) live in a separate SVG (`#paint`) under one turbulence filter, so the costly filter is painted once and never repainted by the animations on top.
- Ink lines get their hand-drawn wobble from seeded jitter in JavaScript (no runtime cost); a light displacement filter roughens the buildings only.
- Paper grain is a CSS overlay generated from an SVG noise data URI.

## Testing

`python -m http.server 8101` from this folder. Headless Chrome on Windows will not make a viewport narrower than 500 px, so the 390 px shots were taken through a small iframe harness at exactly 390x844 and 1366x768. Test hooks: `?night`, `?open=top|middle|down|big|prices|beach|pedro`, `?og` (clean frame used for `og.jpg`), `?shot` (follow the real clock under headless virtual time).

## What I would do next with more time

- Pinch-zoom and pan on phones, starting centred on the plot.
- A "show me the real thing" switch that cross-fades each building into its photo.
- Pedro's real likeness from the reference photo, and a short pose for each fact.
- An idle "ink draws itself" opening on first visit only, and a page-turn transition into the sheets.
- Owner corrections to the plot layout, then real beach and cottage-specific photos.
- A "which one is yours?" drag-to-choose game that ends on the right price and WhatsApp message.
