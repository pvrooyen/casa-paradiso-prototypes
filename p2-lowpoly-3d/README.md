# P2 — Low-poly 3D toy world

A floating low-poly diorama of Casa Paradiso, like a wooden toy. The page is one full-viewport 3D scene. Everything else (photo sheets, price card, Pedro's bubbles, WhatsApp buttons) opens as an overlay on top of the scene and closes back to it. Nothing scrolls.

Files: `index.html` (layout, CSS, HUD, loader, fallback), `ui.js` (data, sheets, price card, stopwatch, day/night button, sea sound), `scene.js` (the three.js diorama, dog, Pedro, camera, input), `photos/` (real photos, 480 px thumbs plus 1600 px versions), `og.jpg` (1200x630, 83 KB, rendered from the scene), `shots/`.

## What the visitor can do

- **Look around.** The camera drifts slowly when idle. Drag to orbit (within limits), pinch or mouse-wheel to zoom. The sea waves, palms sway, the dhow bobs, clouds drift, Tofu wags and breathes, and Pedro gives a small wave every 9 seconds.
- **Move Tofu the dog.** Tap or click the ground and he runs there. Use the on-screen joystick on touch, or W A S D / arrow keys on desktop. He steers around the houses, pool, lapa and car.
- **Tap a building** (or its label): Tofu runs to its door, the building squashes and bounces with its thatch roof lifting, then the photo sheet slides up. Each sheet has 6 to 8 real photos (lazy-loaded, tap one for a full-size lightbox), the facts line, the price with USD, the whole-estate offer, and a WhatsApp button naming that unit.
- **Tap the pool:** Tofu runs to the edge, the water ripples and splashes, and the sheet reads "Shared splash pool, borehole-fed" with two pool photos.
- **Tap Tofu, the beach label, the sand or the sea:** Tofu runs the path out of the east gate, through the dune bush to the sand, while a stopwatch counts to 5:00 in 3.6 seconds and the camera follows. It ends on "5 minutes to Tofinho beach" with the aerial map and "Beach photo coming".
- **Tap Pedro:** he waves and a bubble shows the next of 12 rotating facts (Starlink, borehole water, pets allowed, 2WD access, fenced, whale sharks Oct to Mar, 5-minute walk, Superhost 5.0, humpbacks Jun to Oct, Johannesburg 11 to 12 h, market seafood at midday, prepaid electricity).
- **Day / night button:** the sun swings down and goes orange, then the moon light rises from the other side. The CSS sky shifts through dusk to night with stars and a moon. Windows glow warm, lanterns glow at doors and the lapa, the pool lights up, fireflies drift.
- **Price chip** (bottom left, always visible): the whole estate first (ZAR 4.0M, USD 243k), then a price card with the four units, the plot facts and "Chat with Pierre on WhatsApp". Each unit name in the card sends Tofu to that house.
- **Sea sound** toggle, off by default (filtered noise surf, no audio file).
- No WebGL: the CSS loader is replaced by a plain card with buttons for each house, pool and beach walk, and the price chip still works.

## Placeholders and decisions

- **Pedro** is a placeholder figure (teal shirt, straw hat with a pink band). He is built in one block in `scene.js` (search "Pedro (placeholder likeness"), so swapping him for the real likeness is one edit.
- **Tofu** is the working name in labels, hint text and one Pedro fact.
- **Beach photo** is the aerial map until a real beach photo exists.
- **Plot layout** follows the brief's approximate description: lane and gate at the south, cottages Down, Middle and Top stepping up the west side, pool in the middle, big house to the north-east and higher on stilts with its log staircase, lapa next to it, east gate and path through the dune to the sand and the sea. The owner will correct positions. All positions are in the `P`, `PATH` and `DOOR` tables at the top of `scene.js`.
- The sun comes from the north (southern hemisphere), so shadows fall toward the viewer.
- A small yellow toy car sits in the parking area inside the gate (2WD access). A dhow sails on the sea.
- On phones the camera frames the plot itself, a little more top-down, and lets the dune and the sea sit just off the right edge. The beach label then pins to the right edge with its pointer facing right, and the camera follows Tofu out to the sand on the beach run. Desktop shows the whole island including the sea and the floating rock underside.
- The cottages share the small-house photo pool from the brief (there is no per-cottage photo set yet). Each cottage leads with a different photo.
- Headless Chrome reports `prefers-reduced-motion: reduce`, so the shots show the reduced-motion state: no rise-in intro. Real visitors see the island float up into place in 1.4 s.
- `?touch` forces the touch UI (joystick) for testing; `?night` starts at night; `?fps` shows an fps meter; `?og` hides the hint and toggles for the OG render.

## First-screen transfer

| What | Transfer |
|---|---|
| index.html (gzip) | 7.3 KB |
| ui.js (gzip) | 4.5 KB |
| scene.js (gzip) | 19.5 KB |
| three.module.min.js 0.180.0 (brotli from jsDelivr) | 79 KB |
| three.core.min.js 0.180.0 (brotli from jsDelivr) | 100 KB |
| Google Fonts CSS + 2 latin woff2 (Figtree, Grandstander) | about 64 KB |
| **Total** | **about 275 KB** |

No images load on the first screen. Photos load only when a sheet opens (thumbs first, 1600 px via `srcset` on larger screens). The folder is 8.2 MB, mostly photos.

## Performance

- Geometry: about 18,000 triangles, 140 draw calls per frame including the shadow pass. Static parts are baked into one mesh per material at load time. Fence posts, rails and dune grass are instanced.
- Pixel ratio capped at 1.5. After 3 seconds, if the average is under 40 fps, it drops to pixel ratio 1 by itself. One directional light with a PCF soft shadow map (1024 on touch devices, 2048 on desktop). No post-processing, no physics.
- Measured with Playwright + Chrome on this PC (RTX 3060): steady **60 fps** at 390x844 with device pixel ratio 3 (rendered at 1.5), and still 60 fps with a 6x CPU slowdown. 60 fps at 1366x768. The software renderer (SwiftShader, no GPU) manages about 20 fps. No real mid-range phone was available to measure; check with `?fps` on Pierre's phone.

## External scripts and fonts

- three.js **0.180.0**, `https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js` (and its `three.core.min.js`), via an import map. No addons.
- Google Fonts: **Grandstander** 700/800 (headings, labels, prices) and **Figtree** 400/600/700 (body).

## What next with more time

1. Pedro's real likeness from the reference photo, and the dog's final name.
2. Exact plot layout from Pierre (positions, which way the decks face, where the east gate really is), plus the satellite photo as a ghost overlay to check it.
3. One photo set per cottage, so each sheet is different.
4. "Show me the real thing" switch: fade a building into its matching photo from the same angle.
5. Real beach photo at the end of the dog run, plus a whale shark fin passing in the sea from October to March.
6. Test on a real mid-range Android phone. Possibly lower shadow resolution and turn off antialiasing there.
7. Tune night: windows are hidden under the deep thatch eaves from above; light spilling onto the decks would read better.
