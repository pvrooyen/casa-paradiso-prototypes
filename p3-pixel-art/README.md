# P3 "Pixel-art retro game": Casa Paradiso

One full-viewport game scene. The 16-bit pixel world fills the screen on phone and desktop. Every text box, photo sheet, price card and WhatsApp button opens as an overlay and closes back to the game. The page has no scrolling below the canvas.

## What the visitor can do

1. **Tap a building** (Big house, Top, Middle, Down, or the lapa, which counts as the Big house). Tofu walks there on a grid path. A yellow RPG arrow marks the target. The building hops, its windows flash on and dust puffs. An RPG text box types out the facts and price, with Tofu's face and a blinking triangle. Tap the box (or wait about 2.5 s) and a photo sheet slides up with 5 to 8 real photos, the facts line, the price in ZAR and USD, and a WhatsApp button pre-filled with that unit's name. Tapping a photo opens a lightbox with previous and next buttons.
2. **Tap the pool**: ripples and a splash. The caption reads "Shared splash pool, borehole-fed.", then the pool sheet shows 3 photos.
3. **Tap Tofu or the "Beach 5 min" path**: Tofu runs out through the east fence gap to the sand while a stopwatch counts 0:00 to 5:00 in 3.6 s. It ends on "Woof! 5 minutes to Tofinho beach." and a sheet with the aerial map and "Beach photo coming." Tap Tofu again to bring him home.
4. **Tap Pedro**: he waves, and an RPG box shows the next of 12 rotating facts (Starlink, borehole, pets, 2WD, fenced, whale sharks, humpbacks, 5-minute walk, Superhost 5.0, prepaid power, market seafood, Johannesburg by road).
5. **Night / Day button**: the sun sinks into the sea and the moon rises. The whole palette swaps to night blues. Windows and the lapa bulbs glow, and the pool lights up. Stars twinkle and fireflies drift.
6. **Price card**: the HUD chip shows the whole-estate price first (ZAR 4.0M, USD 243k). Tap it, or use "Prices", for the full list: estate first, then the four units, then "Chat with Pierre on WhatsApp". Tapping a unit row sends Tofu to that building. On desktop (980 px and wider) the price list stays docked on the right.
7. **Sound** (off by default): WebAudio square-wave bleeps for typing, steps, the hop, coins, a splash and a woof, plus soft synthesized surf.
8. **Idle life**: palms sway (3 frames), the pool shimmers, sea sparkles drift, a dhow sails by and a whale shark passes. Tofu wanders around the lawn and blinks. Pedro sweeps with a broom and blinks. Tapping open lawn sends Tofu trotting there.
9. **Extras**: the car gives the 2WD fact and the sea gives the whale-season fact. Escape closes overlays. Every hotspot also has a focusable button for keyboard and screen readers.

## How it is built

- Static files with no build step. `index.html` loads `js/game.js` as an ES module.
  - `js/pixel.js`: indexed-colour pixel buffers, Bayer dithering, and day/night palette baking. Night is a true palette swap, so window glass becomes lamplight.
  - `js/sprites.js`: hand-authored pixel matrices. These are Tofu (4 directions, 2 walk frames, blink), the sun, moon, dhow, car, aloe and the UI icons.
  - `js/pedro.js`: Pedro, 16x24, with wave frames. This was kept from the previous builder unchanged.
  - `js/world.js`: the 560x400 map (dithered sky and sea, beach, dunes, fenced terraced plot, lane), procedural thatch buildings, palms and casuarinas, the 4 px walk grid and A* with a turn penalty, so Tofu walks in straight Game Boy legs.
  - `js/ui.js`: the RPG dialog typewriter, photo sheet, price card, lightbox and WebAudio.
  - `js/data.js`: all copy, prices, photo lists and WhatsApp links in one place.
- Rendering uses a fixed 60 Hz timestep with `requestAnimationFrame`. The scene is drawn at native resolution, then scaled up by an integer factor in device pixels with smoothing off. On a 390 px phone that is 2 CSS px per art pixel, and 6 device px on a DPR-3 phone. The camera fits the plot (190 px wide) to the screen and fills the rest with world, so nothing is letterboxed.
- The palette is about 29 colours, built from the brief's colour cues: thatch, timber, walls, red oxide, bougainvillea, pool, dune green, sea haze, sky, plus inks and Tofu's sandy fur.
- Test hooks: `?go=big|top|mid|down|pool|beach|pedro|prices`, `?night`, `?og` (the 1200x630 Open Graph frame), `?debug` (shows the walk grid).

## Placeholders

- **Pedro** is a friendly placeholder: brown skin, pool-blue shirt, khaki shorts. To swap in the real likeness, redraw the 16x24 rows in `js/pedro.js`. The dialog face uses his top 14 rows automatically.
- **Tofu** is the working name. Rename it in `js/data.js` and in the tag label and dialog names in `js/game.js` (search for "TOFU" and "Tofu").
- **Beach photo**: the beach sheet shows the aerial map with "Beach photo coming."
- **Cottage photos** are not yet sorted per cottage. Each cottage sheet leads with different deck photos and shares interior shots, with a note that all three are built to the same plan.
- **Plot layout** is approximate, following the brief: cottages step up the west side, the pool is in the middle, the big house is east and higher, the gate is in the south-east, and the beach path leaves through the east side. The sea is drawn as the horizon at the top of the screen so the sky, sun and moon can sit above it.
- The `og:image` is the relative `og.jpg` (1200x630, 210 KB). It needs an absolute URL once it is hosted.

## First-screen transfer

About **155 KB** in total, measured over the DevTools protocol with the cache disabled. That breaks down as:

- HTML: 17 KB
- 7 JS modules: about 75 KB uncompressed
- Google Fonts CSS and font files: the rest

No photos load until a sheet opens. Sheets use 480 px thumbnails, and only the first photo uses `srcset` for the 1600 px version. Fonts load without blocking rendering. Locally, the scene draws its first frame within about 100 ms of the modules arriving.

## External scripts

None. All JavaScript is local. Fonts come from Google Fonts: **Press Start 2P** (title, labels, buttons), **Pixelify Sans** 400/600 (RPG dialog text), and **Atkinson Hyperlegible** 400/700 (photo sheet text and prices).

## Screenshots

`shots/phone.png` (390x844) and `shots/desktop.png` (1366x768). Headless Chrome clamps `--window-size` to at least 500 px wide, so the brief's command gives a 500 px layout cropped to 390. These shots were therefore taken through the Chrome DevTools protocol with `Emulation.setDeviceMetricsOverride` (390x844, mobile, DPR 1) and `prefers-reduced-motion: no-preference`. Headless also reports reduced motion by default, and that would make the typewriter instant.

## Reduced motion

With `prefers-reduced-motion`, text appears instantly, Tofu moves twice as fast, the day/night swap is quick and the sheet does not animate.

## What I would do next

- Swap in Pedro's real likeness from the reference photo, and let the owner name the dog.
- Add a "show me the real thing" toggle that crossfades each building into its exterior photo.
- Add a "which one is yours?" mode: drag Tofu onto a cottage to pick it and get a tailored WhatsApp message.
- Tag the cottage photos per cottage and add a real beach photo.
- Inline the tiny modules into one file, or ship them gzipped, to save a few round trips on slow 4G. Subset the fonts to Latin.
- Have the owner check the layout, then nudge the building positions in `js/game.js` (`COT`, `BIG`, `LAPA`, `POOL`).
