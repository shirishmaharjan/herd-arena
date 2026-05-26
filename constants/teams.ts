export const GROUPS_DATA: any = {
  A: { teams: [{ id: 'mex', n: 'Mexico', c: 'mx', r: 15 }, { id: 'kor', n: 'South Korea', c: 'kr', r: 23 }, { id: 'cze', n: 'Czechia', c: 'cz', r: 40 }, { id: 'rsa', n: 'South Africa', c: 'za', r: 60 }] },
  B: { teams: [{ id: 'sui', n: 'Switzerland', c: 'ch', r: 19 }, { id: 'can', n: 'Canada', c: 'ca', r: 48 }, { id: 'bih', n: 'Bosnia', c: 'ba', r: 70 }, { id: 'qat', n: 'Qatar', c: 'qa', r: 35 }] },
  C: { teams: [{ id: 'bra', n: 'Brazil', c: 'br', r: 5 }, { id: 'mar', n: 'Morocco', c: 'ma', r: 13 }, { id: 'sco', n: 'Scotland', c: 'gb-sct', r: 38 }, { id: 'hai', n: 'Haiti', c: 'ht', r: 85 }] },
  D: { teams: [{ id: 'usa', n: 'USA', c: 'us', r: 11 }, { id: 'tur', n: 'Türkiye', c: 'tr', r: 26 }, { id: 'par', n: 'Paraguay', c: 'py', r: 56 }, { id: 'aus', n: 'Australia', c: 'au', r: 24 }] },
  E: { teams: [{ id: 'ger', n: 'Germany', c: 'de', r: 16 }, { id: 'ecu', n: 'Ecuador', c: 'ec', r: 30 }, { id: 'civ', n: 'Ivory Coast', c: 'ci', r: 39 }, { id: 'cur', n: 'Curacao', c: 'cw', r: 90 }] },
  F: { teams: [{ id: 'ned', n: 'Netherlands', c: 'nl', r: 7 }, { id: 'jpn', n: 'Japan', c: 'jp', r: 18 }, { id: 'swe', n: 'Sweden', c: 'se', r: 28 }, { id: 'tun', n: 'Tunisia', c: 'tn', r: 41 }] },
  G: { teams: [{ id: 'bel', n: 'Belgium', c: 'be', r: 3 }, { id: 'egy', n: 'Egypt', c: 'eg', r: 36 }, { id: 'irn', n: 'Iran', c: 'ir', r: 20 }, { id: 'nzl', n: 'New Zealand', c: 'nz', r: 101 }] },
  H: { teams: [{ id: 'esp', n: 'Spain', c: 'es', r: 8 }, { id: 'uru', n: 'Uruguay', c: 'uy', r: 14 }, { id: 'ksa', n: 'Saudi Arabia', c: 'sa', r: 53 }, { id: 'cpv', n: 'Cape Verde', c: 'cv', r: 65 }] },
  I: { teams: [{ id: 'fra', n: 'France', c: 'fr', r: 2 }, { id: 'nor', n: 'Norway', c: 'no', r: 44 }, { id: 'sen', n: 'Senegal', c: 'sn', r: 17 }, { id: 'irq', n: 'Iraq', c: 'iq', r: 58 }] },
  J: { teams: [{ id: 'arg', n: 'Argentina', c: 'ar', r: 1 }, { id: 'aut', n: 'Austria', c: 'at', r: 25 }, { id: 'alg', n: 'Algeria', c: 'dz', r: 43 }, { id: 'jor', n: 'Jordan', c: 'jo', r: 71 }] },
  K: { teams: [{ id: 'por', n: 'Portugal', c: 'pt', r: 6 }, { id: 'col', n: 'Colombia', c: 'co', r: 12 }, { id: 'cod', n: 'cd', r: 67 }, { id: 'uzb', n: 'uz', r: 64 }] },
  L: { teams: [{ id: 'eng', n: 'England', c: 'gb-eng', r: 4 }, { id: 'cro', n: 'Croatia', c: 'hr', r: 10 }, { id: 'gha', n: 'Ghana', c: 'gh', r: 61 }, { id: 'pan', n: 'Panama', c: 'pa', r: 45 }] },
};

export const BRACKET_MAPPING = [
  // Round of 32
  { id: 'm73', t1: 'A1', t2: '3RD-1' }, { id: 'm74', t1: 'E1', t2: 'A2' },
  { id: 'm75', t1: 'F1', t2: 'C2' }, { id: 'm76', t1: 'B1', t2: '3RD-2' },
  { id: 'm77', t1: 'C1', t2: '3RD-3' }, { id: 'm78', t1: 'G1', t2: 'B2' },
  { id: 'm79', t1: 'H1', t2: 'J2' }, { id: 'm80', t1: 'I1', t2: '3RD-4' },
  { id: 'm81', t1: 'D1', t2: '3RD-5' }, { id: 'm82', t1: 'G2', t2: 'I2' },
  { id: 'm83', t1: 'L1', t2: '3RD-6' }, { id: 'm84', t1: 'J1', t2: 'H2' },
  { id: 'm85', t1: 'K1', t2: 'L2' }, { id: 'm86', t1: 'D2', t2: 'F2' },
  { id: 'm87', t1: 'B1', t2: '3RD-7' }, { id: 'm88', t1: 'K2', t2: '3RD-8' },
  // Round of 16
  { id: 'm89', t1: 'W73', t2: 'W74' }, { id: 'm90', t1: 'W75', t2: 'W76' },
  { id: 'm91', t1: 'W77', t2: 'W78' }, { id: 'm92', t1: 'W79', t2: 'W80' },
  { id: 'm93', t1: 'W81', t2: 'W82' }, { id: 'm94', t1: 'W83', t2: 'W84' },
  { id: 'm95', t1: 'W85', t2: 'W86' }, { id: 'm96', t1: 'W87', t2: 'W88' },
  // Quarters
  { id: 'm97', t1: 'W89', t2: 'W90' }, { id: 'm98', t1: 'W91', t2: 'W92' },
  { id: 'm99', t1: 'W93', t2: 'W94' }, { id: 'm100', t1: 'W95', t2: 'W96' },
  // Semis
  { id: 'm101', t1: 'W97', t2: 'W98' }, { id: 'm102', t1: 'W99', t2: 'W100' },
  // 3rd Place Match
  { id: 'm103', t1: 'L101', t2: 'L102' },
  // Final
  { id: 'm104', t1: 'W101', t2: 'W102' },
];