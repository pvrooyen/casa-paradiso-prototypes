// Pedro, the housekeeper. PLACEHOLDER likeness until the owner's reference photo arrives.
// To swap: redraw these 16x24 rows. Palette letters (see PALETTE in game.js):
//   k ink/hair   n skin   Q shirt   q shirt shade   v shirt light   Y shorts   b sandals   * white
// Keep the right arm (columns 12-14, rows 14-16) so the wave overlay lines up,
// or edit WAVE_A / WAVE_B below.
export const PEDRO = [
  '................',
  '.....kkkkkk.....',
  '....kkkbbkkk....',
  '...kkkkkkkkkk...',
  '...knnnnnnnnk...',
  '..kknnnnnnnnkk..',
  '..knnk*nnk*nnk..',
  '..knnkknnkknnk..',
  '..kknnnnnnnnkk..',
  '...knnk**knnk...',
  '...knnnkknnnk...',
  '....kknnnnkk....',
  '...kQQQvvQQQk...',
  '..kQQQQvvQQQQk..',
  '.knkQQQQQQQQknk.',
  '.knkQQQQQQQQknk.',
  '.knkqQQQQQQqknk.',
  '.kk.kYYYYYYk.kk.',
  '....kYYYYYYk....',
  '....kYYk.kYYk...',
  '....knnk.knnk...',
  '....knnk.knnk...',
  '...kbbbk.kbbbk..',
  '................',
];

// Pixels cleared when the arm goes up: [x, y]
export const ARM_DOWN = [[13,14],[14,14],[13,15],[14,15],[13,16],[14,16],[13,17],[14,17]];
// Raised arm: [x, y, letter]
export const WAVE_A = [
  [12,14,'k'],[12,15,'k'],[12,16,'k'],
  [13,13,'k'],[14,13,'n'],[15,13,'k'],
  [13,12,'k'],[14,12,'n'],[15,12,'k'],
  [13,11,'k'],[14,11,'n'],[15,11,'k'],
  [13,10,'k'],[14,10,'n'],[15,10,'k'],
  [13,9,'k'],[14,9,'n'],[15,9,'n'],
  [13,8,'k'],[14,8,'k'],[15,8,'k'],
];
export const WAVE_B = [
  [12,14,'k'],[12,15,'k'],[12,16,'k'],
  [13,13,'k'],[14,13,'n'],[15,13,'k'],
  [13,12,'k'],[14,12,'n'],[15,12,'k'],
  [12,11,'k'],[13,11,'n'],[14,11,'k'],
  [12,10,'k'],[13,10,'n'],[14,10,'k'],
  [11,9,'k'],[12,9,'n'],[13,9,'n'],[14,9,'k'],
  [11,8,'k'],[12,8,'k'],[13,8,'k'],
];
