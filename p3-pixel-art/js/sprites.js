// Hand-authored pixel matrices. Letters map to the palette in pixel.js.
// u sandy fur, U fur shade, k ink, r red bandana, * eye shine, p tongue.

function pad(rows, w) { return rows.map(r => (r + '.'.repeat(w)).slice(0, w)); }

// Tofu, facing right (left is mirrored). Two walk frames.
const DOG_R_BODY = [
  '................',
  '................',
  '........kkkk....',
  '.......kUuuuk...',
  '..k...kUUuuuukk.',
  '.kuk..kUUu*kTTTk',
  '.kuk..kUUuuuTTkk',
  '..kuk..kUuuuTpk.',
  '..kuk...krrrkk..',
  '...kukkkkrrruk..',
  '...kuuuuuurruk..',
  '...kuuuuuuuuuk..',
  '...kUuuuuuuuUk..',
];
export const DOG_RIGHT = [
  pad([...DOG_R_BODY, '...kUkUk..kUkUk.', '...kk.kk..kk.kk.', '................'], 16),
  pad([...DOG_R_BODY, '....kUk...kUk...', '....kkk...kkk...', '................'], 16),
];

const DOG_FRONT_HEAD = [
  '..........k.....',
  '.........kUk....',
  '....kkkkkkUUk...',
  '.kkkuuuuuuuuuk..',
  'kUUkuuuuuuuuuk..',
  'kUUku*kuuu*kuk..',
  'kUUkukkuuukkuk..',
  'kUUkuuTTkTTuuk..',
  '.kUkuTTTkTTTuk..',
  '.kk.kuTTpTTuk...',
  '....krrrrrrrk...',
  '...kurrrrrrruk..',
  '...kUuuuuuuuUk..',
];
export const DOG_DOWN = [
  pad([...DOG_FRONT_HEAD, '....kuk..kuk....', '....kkk..kuk....', '.........kkk....'], 16),
  pad([...DOG_FRONT_HEAD, '....kuk..kuk....', '....kuk..kkk....', '....kkk.........'], 16),
];
const DOG_BACK_HEAD = [
  '..........k.....',
  '.........kUk....',
  '....kkkkkkUUk...',
  '.kkkuuuuuuuuuk..',
  'kUUkuuuuuuuuuk..',
  'kUUkuuuuuuuuuk..',
  'kUUkuuuuuuuuuk..',
  'kUUkuuuuuuuuuk..',
  '.kUkuuuuuuuuuk..',
  '.kk.kuuuuuuuk...',
  '....krrrrrrrk...',
  '...kuuurrruuuk..',
  '...kUuuuuuuuUk..',
];
export const DOG_UP = [
  pad([...DOG_BACK_HEAD, '....kuk.kukuk...', '....kkk..kuk....', '.........kkk....'], 16),
  pad([...DOG_BACK_HEAD, '....kuk.kuk.....', '....kuk..kkk....', '....kkk.........'], 16),
];
// Blink variant of the front head (eyes closed).
export const DOG_BLINK = DOG_DOWN[0].map((r, j) => j === 5 ? 'kUUkuuuuuuuuuk..' : r);
// Dialog face (16x14)
export const DOG_FACE = DOG_DOWN[0].slice(0, 14);

// Props
export const ALOE = [
  '....m....',
  '....o....',
  '....o....',
  '..e.l.e..',
  'e.gegeg.e',
  '.gGgegGg.',
  '..GgGgG..',
  '...GGG...',
];
export const DHOW = [
  '....k.....',
  '....kw....',
  '....kww...',
  '....kwww..',
  '....kwwWw.',
  '....kwwWWw',
  '..kkkkkkkk',
  '.kllllllk.',
  '..kLLLLk..',
];
export const CAR = [
  '....kkkkkkkkkk....',
  '...kxxxxxxxxxxk...',
  '..kxx*xxxxxxxxxk..',
  '.kooooooooooooook.',
  'koooooooooooooooWk',
  'kooooooooooooooook',
  'kWWoooooooooooWWok',
  'kkkkkkkkkkkkkkkkkk',
  '.kkk.........kkk..',
];
export const SUN = [
  '....kkkkk....',
  '..kkmmmmmkk..',
  '.kmm**mmmmmk.',
  '.km**mmmmmmk.',
  'kmm*mmmmmmmmk',
  'kmmmmmmmmmmmk',
  'kmmmmmmmmmmmk',
  'kmmmmmmmmmmmk',
  'kmmmmmmmmmmmk',
  '.kmmmmmmmmmk.',
  '.kmmmmmmmmmk.',
  '..kkmmmmmkk..',
  '....kkkkk....',
];
export const MOON = [
  '....kkkk.....',
  '..kkmmmk.....',
  '.kmmmk.......',
  '.kmmk........',
  'kmmmk........',
  'kmmk.........',
  'kmmk.........',
  'kmmmk........',
  'kmmmk......k.',
  '.kmmmk....kk.',
  '.kmmmmkkkkmk.',
  '..kkmmmmmmk..',
  '....kkkkkk...',
];

// 12x12 UI icons
export const ICON_MOON = pad([
  '............',
  '....kkkk....',
  '...kmmk.....',
  '..kmmk......',
  '..kmk.......',
  '.kmmk.......',
  '.kmmk.....k.',
  '.kmmmk...kk.',
  '..kmmmkkkmk.',
  '..kkmmmmmk..',
  '....kkkkk...',
  '............',
], 12);
export const ICON_SUN = pad([
  '.....m......',
  '.m...m...m..',
  '..m.....m...',
  '....kkk.....',
  '...kmmmk....',
  'mm.kmmmk.mm.',
  '...kmmmk....',
  '....kkk.....',
  '..m.....m...',
  '.m...m...m..',
  '.....m......',
  '............',
], 12);
export const ICON_SOUND_ON = pad([
  '............',
  '.....k......',
  '....kk...k..',
  '...kwk.k..k.',
  'kkkwwk..k.k.',
  'kwwwwk..k.k.',
  'kwwwwk..k.k.',
  'kkkwwk..k.k.',
  '...kwk.k..k.',
  '....kk...k..',
  '.....k......',
  '............',
], 12);
export const ICON_SOUND_OFF = pad([
  '............',
  '.....k......',
  '....kk......',
  '...kwk......',
  'kkkwwk.r...r',
  'kwwwwk..r.r.',
  'kwwwwk...r..',
  'kkkwwk..r.r.',
  '...kwk.r...r',
  '....kk......',
  '.....k......',
  '............',
], 12);
export const ICON_COIN = pad([
  '............',
  '....kkkk....',
  '..kkmmmmkk..',
  '..kmm**mmk..',
  '.kmm*kkmmhk.',
  '.kmm*kmmmhk.',
  '.kmmmkkmmhk.',
  '.kmmmmmkmhk.',
  '..kmmkkmhk..',
  '..kkhhhhkk..',
  '....kkkk....',
  '............',
], 12);
export const ICON_WATCH = pad([
  '....kkkk....',
  '.....kk.....',
  '...kkkkkk...',
  '..kwwwkwwk..',
  '.kwwwwkwwwk.',
  '.kwwwwkwwwk.',
  '.kwwwwkkkwk.',
  '.kwwwwwwwwk.',
  '.kwwwwwwwwk.',
  '..kwwwwwwk..',
  '...kkkkkk...',
  '............',
], 12);
