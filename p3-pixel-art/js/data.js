// All copy, prices and photo lists in one place. Facts come from shared/BRIEF.md.
export const WA_NUMBER = '27849781078';
export const waLink = (about) => `https://wa.me/${WA_NUMBER}?text=` + encodeURIComponent(`Hi Pierre, I'm looking at Casa Paradiso. I'd like to know more about ${about}.`);

const cottageFacts = '1 bedroom, 1 en-suite bathroom, about 70 m². Open-plan kitchen and living room, large covered deck with a hammock, own small garden and own gate.';
const airbnb = 'On Airbnb as “Cozy Cabin with Ocean Views in Tranquil Tofinho”, rated 5.0, Superhost.';
const unsorted = 'Cottage photos are not yet sorted per cottage; all three are built to the same plan.';

export const PLACES = {
  big: {
    name: 'Big house', plate: 'BIG HOUSE', about: 'the Big house',
    say: 'The big house! 4 bedrooms, 3 bathrooms, sleeps 8. Covered deck under the thatch, loft room, lapa with bar. ZAR 2.2M.',
    facts: '4 bedrooms, 3 bathrooms (2 en-suite), sleeps 8. Open-plan kitchen, dining and living room with TV. Large covered deck under a thatch roof, loft room, lapa with bar.',
    zar: 'ZAR 2.2M', usd: 'USD 134k',
    note: 'Pierre and Elvera live here now.',
    photos: ['bh-exterior-stairs', 'bh-garden-path', 'bh-deck-dining', 'bh-deck-lounge', 'bh-living', 'bh-kitchen', 'bh-bedroom-net', 'bh-lapa-bar'],
  },
  top: {
    name: 'Cottage Top', plate: 'TOP', about: 'Cottage Top',
    say: 'Cottage Top, highest on the slope with the best view. 1 bedroom, en-suite, about 70 m², deck with a hammock. ZAR 800k.',
    facts: cottageFacts, zar: 'ZAR 800k', usd: 'USD 48.6k',
    note: 'Highest of the three cottages, with the best view. ' + airbnb,
    photos: ['sh-deck-view', 'sh-deck-bougainvillea', 'sh-living', 'sh-bedroom', 'sh-bathroom'],
    soon: unsorted,
  },
  mid: {
    name: 'Cottage Middle', plate: 'MIDDLE', about: 'Cottage Middle',
    say: 'Cottage Middle. 1 bedroom, en-suite, about 70 m², big covered deck, own garden and gate. ZAR 750k.',
    facts: cottageFacts, zar: 'ZAR 750k', usd: 'USD 45.5k',
    note: 'The middle step of the slope. ' + airbnb,
    photos: ['sh-deck-hammock', 'sh-deck-table', 'sh-kitchen', 'sh-bedroom', 'sh-bathroom'],
    soon: unsorted,
  },
  down: {
    name: 'Cottage Down', plate: 'DOWN', about: 'Cottage Down',
    say: 'Cottage Down, nearest the gate. 1 bedroom, en-suite, about 70 m², big covered deck, own garden and gate. ZAR 700k.',
    facts: cottageFacts, zar: 'ZAR 700k', usd: 'USD 42.5k',
    note: 'Nearest the gate and the parking. ' + airbnb,
    photos: ['sh-stairs-exterior', 'sh-deck-morning', 'sh-living', 'sh-kitchen', 'sh-bedroom'],
    soon: unsorted,
  },
  pool: {
    name: 'Splash pool', plate: 'POOL', about: 'the shared splash pool',
    say: 'Shared splash pool, borehole-fed.',
    facts: 'Shared splash pool, borehole-fed, between the big house and the cottages, with loungers under the palms.',
    note: 'Included with the whole estate.',
    photos: ['pool-palms', 'pool-loungers', 'garden-pool-from-above'],
  },
  beach: {
    name: '5 minutes to Tofinho beach', plate: 'BEACH', about: 'the walk to Tofinho beach',
    say: 'Woof! 5 minutes to Tofinho beach.',
    facts: 'A sandy path leaves the plot on the east side, through dune bush and coconut palms, to Tofinho beach. The plot is not beachfront: it sits higher up, in the breeze, with the view.',
    note: 'Tofinho is the quiet neighbour of Praia do Tofo.',
    photos: ['area-aerial-map'],
    soon: 'Beach photo coming.',
  },
};

export const ESTATE = { zar: 'ZAR 4.0M', usd: 'USD 243k', separately: 'ZAR 4.45M separately, save ZAR 445k' };

// Pedro's rotating fact bubbles. Facts only.
export const PEDRO_FACTS = [
  'Starlink internet is installed.',
  'Water comes from our own borehole. It is safe to drink.',
  'Pets are allowed. Tofu lives here too.',
  'An ordinary 2WD car gets here. No 4x4 needed.',
  'The plot is fully fenced. Each cottage has its own gate.',
  'Whale sharks pass Tofo from October to March. Mantas are here all year.',
  'Tofinho beach is a 5-minute walk down the path.',
  'The cottages are on Airbnb, rated 5.0, Superhost.',
  'Electricity is prepaid.',
  'Humpback whales pass from June to October.',
  'Seafood comes to the Tofo market around midday.',
  'Johannesburg is about 11 to 12 hours by road.',
];

export const EXTRAS = {
  car: { name: 'TOFU', text: 'This is a normal 2WD car. It drives right up to the gate.' },
  sea: { name: 'TOFU', text: 'Whale sharks swim past from October to March. Humpbacks from June to October.' },
  lapa: 'big',
};


// Captions from shared/photos/photos.json
export const PHOTO_CAPTIONS = {
  'bh-garden-path': 'Big house from the garden, brick path up to the deck',
  'bh-exterior-stairs': 'Big house exterior with log staircase and thatch roof',
  'bh-deck-dining': 'Covered deck with dining table under the thatch',
  'bh-deck-lounge': 'Deck lounge corner looking out over the garden',
  'bh-living': 'Open-plan living room with sofas and bar',
  'bh-kitchen': 'Kitchen with breakfast bar and stools',
  'bh-bedroom-net': 'Main bedroom with mosquito net and dark wood cupboards',
  'bh-lapa-bar': 'Thatched lapa with bar and seating',
  'pool-palms': 'Splash pool under the palms with hill view',
  'pool-loungers': 'Pool with loungers in the shade',
  'garden-pool-from-above': 'Garden and pool seen from the big house, green hills behind',
  'sh-deck-view': 'Cottage deck with view over the trees to the dune',
  'sh-deck-morning': 'Cottage deck in the morning, seen from the door',
  'sh-deck-table': 'Cottage deck dining table',
  'sh-deck-hammock': 'Cottage deck with hammock',
  'sh-stairs-exterior': 'Cottage on stilts with its stairs and deck',
  'sh-living': 'Cottage open-plan living room',
  'sh-kitchen': 'Cottage kitchen with fridge and breakfast bar',
  'sh-bedroom': 'Cottage four-poster bed with net',
  'sh-bathroom': 'Cottage en-suite shower',
  'sh-deck-bougainvillea': 'Cottage deck with bougainvillea, thatch roofs and sea haze beyond',
  'area-aerial-map': 'Aerial map: road in from Inhambane, Tofinho beach, Casa Paradiso at the end of the lane',
};
