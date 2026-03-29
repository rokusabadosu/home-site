// ═══════════════════════════════════════════════════════════
//  DATA TABLES
// ═══════════════════════════════════════════════════════════
const LADY_FIRST = [
  'Arabella','Cecily','Dorothea','Eugenia','Felicity','Georgiana','Harriet','Imogen',
  'Josephine','Lavinia','Eleanor','Charlotte','Adelaide','Amelia','Anne','Beatrice',
  'Caroline','Catherine','Clementine','Diana','Elizabeth','Emma','Frances','Helena',
  'Jane','Leonora','Louisa','Lydia','Marianne','Octavia','Penelope','Phoebe',
  'Rosalind','Selina','Sophia','Theodosia','Winifred',
];
const GENT_FIRST  = [
  'Alistair','Benedict','Charles','Edmund','Frederick','George','Henry','Julian',
  'Laurence','Miles','Edward','Richard','Algernon','Ambrose','Arthur','Bertram',
  'Cecil','Francis','Gideon','Godfrey','Horatio','Hugh','James','Jasper',
  'Nathaniel','Oliver','Percy','Peregrine','Philip','Reginald','Roderick',
  'Rupert','Sebastian','Theodore','Thomas','Tobias','William',
];
const SURNAMES    = [
  'Ashworth','Beaumont','Cavendish','Darwood','Ellsworth','Fairfax','Grenville',
  'Harwick','Ingram','Pemberton','Wycliffe','Hartwell','Blackwood','Carrington',
  'Collingwood','Dalrymple','Edgerton','Ferrars','Forsythe','Harcourt','Langford',
  'Montague','Radcliffe','Rushworth','Seymour','Stanhope','Talbot','Thornton',
  'Trevelyan','Vane','Wentworth','Westbrook',
];
const GENT_TITLES = ['Mr','Captain','Lord','Sir','The Hon. Mr'];

// ── Rival matchmakers ──
const RIVALS = [
  { id: 'rival1', name: 'Lady Pendleton', short: 'Lady P.' },
  { id: 'rival2', name: 'Mrs. Hartwick',  short: 'Mrs. H.' },
];

const PHYSICAL = [
  {id:'elegant',      l:'Elegant',       e:'✨'},
  {id:'handsome',     l:'Handsome',      e:'😍'},
  {id:'vivacious',    l:'Vivacious',     e:'💫'},
  {id:'graceful',     l:'Graceful',      e:'🦢'},
];

const PERSONALITIES = [
  {id:'witty',    l:'Witty',    e:'💬'},
  {id:'kind',     l:'Kind',     e:'💛'},
  {id:'romantic', l:'Romantic', e:'💕'},
  {id:'ambitious',l:'Ambitious',e:'🔥'},
];

const INTERESTS = [
  {id:'music',        l:'Music',        e:'🎵'},
  {id:'dancing',      l:'Dancing',      e:'💃'},
  {id:'literature',   l:'Literature',   e:'📚'},
  {id:'riding',       l:'Riding',       e:'🐎'},
  {id:'nature',       l:'Nature',       e:'🌿'},
  {id:'theatre',      l:'Theatre',      e:'🎭'},
  {id:'conversation', l:'Conversation', e:'🗣️'},
  {id:'gossip',       l:'Gossip',       e:'🤫'},
];

const ACTION_HELP = {
  chat:     { title: 'Chat',
    body: 'Reveals one hidden attribute of this character — their personality, an interest, or what they find attractive in a partner. Also carries a 50% chance of revealing their Personality. If they love Conversation, their Personality is always revealed and their love of Conversation is uncovered.',
    limit: 'Can only be used once per ball per character.' },
  intro:    { title: 'Introduce',
    body: 'Introduces this character to another. Cross-gender introductions are claimed for Reputation — if the pair marries at season\'s end, you gain +1 Reputation. Same-gender pairings form a friendship instead.',
    limit: 'Each character can only be claimed in one introduction at a time. Introducing them to a new partner releases the previous claim.' },
  dance:    { title: 'Encourage to Dance',
    body: 'Directs this character to dance with an introduced partner of the opposite sex, boosting their relationship. Bonus: +2 if each finds the other physically attractive; +2 if either enjoys Dancing.',
    limit: 'The two characters must already have been introduced.' },
  converse: { title: 'Encourage to Converse',
    body: 'Directs this character to have a private conversation with an introduced partner of the opposite sex, boosting their relationship. Bonus: +2 if each is drawn to the other\'s personality; +2 if either enjoys Conversation.',
    limit: 'The two characters must already have been introduced.' },
  gossip:   { title: 'Gossip',
    body: 'Draws this character aside for the latest whispers. Reveals a random hidden attribute of two other characters at court. If this character has an interest in Gossip, reveals three instead.',
    limit: 'Can only be used once per ball per character. Repeated gossip risks a scandal — each occurrence after the first has a cumulative 20% chance of damaging all your claimed relationships (−2 the first time, −4 the next, and so on).' },
  enquire:  { title: 'Sound Out Their Circle',
    body: 'Probes this character about their acquaintances. For each person they have a relationship with, there is a chance of learning one hidden attribute — the stronger the relationship, the higher the chance.',
    limit: 'Requires this character to have at least one existing relationship.' },
  rumour:   { title: 'Spread a Rumour',
    body: 'Whispers damaging gossip about a chosen character to this one, reducing their relationship by a random amount between 5 and 10.',
    limit: 'Can only be used once per ball per character. The two characters must be acquainted. Each rumour risks a scandal — starting at 20% and rising by 20% with each rumour this season — which damages all your claimed relationships (−2, −4, −6, … per scandal). If the listener loves Gossip, the risk is halved.' },
  seek:     { title: 'Seek a Confidence',
    body: 'Draws this character aside and gently probes them about a close friend — revealing one hidden personality trait, preferred appearance, or preferred nature of that friend.',
    limit: 'Requires this character to have at least one friendship with a strength of 10 or greater.' },
  discuss:  { title: 'Discuss Interests',
    body: 'Asks this character about fellow enthusiasts. For every interest of theirs you have already revealed, you learn which same-gender characters at court share that passion.',
    limit: 'Requires at least one of this character\'s interests to have been revealed first (via Chat or Gossip).' },
};

const MAX_SCORE = 30;   // relationship score ceiling
const ACTIONS_PER_BALL = 7;
const actKey = (action, id) => `${action}:${id}`;

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
const r1  = a => a[Math.floor(Math.random() * a.length)];
function rN(arr, n) {
  const c = [...arr], r = [];
  for (let i = 0; i < n && c.length; i++) {
    const j = Math.floor(Math.random() * c.length);
    r.push(c.splice(j, 1)[0]);
  }
  return r;
}
function shuf(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
const svgE = t => document.createElementNS('http://www.w3.org/2000/svg', t);

function wealthDesc(w) {
  if (w === 1) return 'of modest means';
  if (w === 2) return 'comfortably situated';
  return 'of great fortune';
}

function portraitSrc(c) {
  const num = String(c.portraitIdx + 1).padStart(2, '0');
  return c.gender === 'f' ? `images/eligible-lady${num}.png` : `images/eligible-gent${num}.png`;
}

function makeGlow(parent, cx, cy, r) {
  const gl = svgE('circle');
  gl.setAttribute('cx', cx);
  gl.setAttribute('cy', cy);
  gl.setAttribute('r', r);
  gl.setAttribute('fill', 'rgba(230,195,60,0.35)');
  gl.setAttribute('stroke', 'rgba(230,195,60,0.9)');
  gl.setAttribute('stroke-width', '1.5');
  gl.setAttribute('pointer-events', 'none');
  gl.setAttribute('class', 'reveal-glow');
  parent.appendChild(gl);
}


// Returns mutual physical and personality attraction counts between a lady and gent
function mutualAttractions(lady, gent) {
  const phys = (lady.attrPhys.id === gent.physAttr.id ? 1 : 0) +
               (gent.attrPhys.id === lady.physAttr.id ? 1 : 0);
  const pers = (lady.attrPers.id === gent.personality.id ? 1 : 0) +
               (gent.attrPers.id === lady.personality.id ? 1 : 0);
  return { phys, pers };
}

function relIsRomantic(c1, c2, r) {
  if (r && r.type === 'friendship') return false;
  return c1.gender !== c2.gender;
}

function relLabel(c1, c2, score, r) {
  if (!relIsRomantic(c1, c2, r)) {
    // Same-gender: friendship labels
    if (score >= 28) return 'Inseparable';
    if (score >= 22) return 'Confidantes';
    if (score >= 16) return 'Intimate';
    if (score >= 10) return 'Close';
    if (score >= 5)  return 'Friendly';
    if (score >= 2)  return 'Agreeable';
    return 'Acquainted';
  } else {
    // Cross-gender: romantic labels
    if (score >= 28) return 'Ardently in Love';
    if (score >= 22) return 'Enamoured';
    if (score >= 16) return 'Devoted';
    if (score >= 10) return 'Attached';
    if (score >= 5)  return 'Warm';
    if (score >= 2)  return 'Cordial';
    return 'Acquainted';
  }
}

// ═══════════════════════════════════════════════════════════
//  CHARACTER GENERATION
// ═══════════════════════════════════════════════════════════
function genChar(gender, idx, firstName, lastName, title, portraitIdx) {
  const phys = r1(PHYSICAL);
  const pers = r1(PERSONALITIES);
  const ints = rN(INTERESTS, 3);
  const aPhys = r1(PHYSICAL.filter(p => p.id !== phys.id));
  const aPers = r1(PERSONALITIES.filter(p => p.id !== pers.id));
  const isF   = gender === 'f';
  const shortTitle = title.includes(' ') ? title.split(' ').pop() : title;

  return {
    id: gender + idx,
    gender,
    title,
    firstName,
    lastName,
    fullName:     `${title} ${firstName} ${lastName}`,
    shortDisplay: `${shortTitle} ${firstName}`,
    wealth:    Math.floor(Math.random() * 3) + 1,
    physAttr:  phys,
    personality: pers,
    interests:   ints,
    attrPhys:    aPhys,
    attrPers:    aPers,
    rv: { pers: false, i0: false, i1: false, i2: false, ap: false, apr: false },
    layoutIdx:  idx,
    portraitIdx,
    side: isF ? 'left' : 'right',
    seasons: 1,
  };
}

function genSeason() {
  const lns  = shuf(LADY_FIRST).slice(0, 5);
  const gns  = shuf(GENT_FIRST).slice(0, 5);
  const sns  = shuf(SURNAMES);
  const tits = shuf(GENT_TITLES);
  const ladyPortraits = rN(Array.from({length: 10}, (_, i) => i), 5);
  const gentPortraits = rN(Array.from({length: 10}, (_, i) => i), 5);
  const chars = [];
  lns.forEach((fn, i) => chars.push(genChar('f', i, fn, sns[i]   || r1(SURNAMES), 'Miss',                  ladyPortraits[i])));
  gns.forEach((fn, i) => chars.push(genChar('m', i, fn, sns[5+i] || r1(SURNAMES), tits[i % tits.length], gentPortraits[i])));
  return chars;
}

// ═══════════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════════
let G              = null;
// Persistent state — survives across seasons
const P = { reputation: 10, rivals: { rival1: 10, rival2: 10 } };
let highlightTimer = null;

function setHighlights(entries) {
  G.highlights = entries;
  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    G.highlights = [];
    highlightTimer = null;
    renderGraph();
  }, 10000);
  renderGraph();
}

function setBackground() {
  const n = Math.floor(Math.random() * 3) + 1;
  document.getElementById('graphWrap').style.backgroundImage =
    `url('images/ballroom-background${String(n).padStart(2,'0')}.png')`;
}

function createInitialFriendships() {
  const ladies = shuf(G.chars.filter(c => c.gender === 'f'));
  const gents  = shuf(G.chars.filter(c => c.gender === 'm'));
  const pairs = [
    [ladies[0], ladies[1]],
    [ladies[2], ladies[3]],
    [gents[0],  gents[1]],
    [gents[2],  gents[3]],
  ];
  pairs.forEach(([a, b]) => {
    const k = rkey(a.id, b.id);
    if (G.rels[k]) return;  // already carried over from previous season
    const score = 5 + Math.floor(Math.random() * 16); // 5–20
    G.rels[k] = { score, claimed: false, rival: null };
    G.introThisBall.push(k);
    addLog(`🤝 ${a.shortDisplay} and ${b.shortDisplay} are already acquainted.`);
  });
}

function buildNextSeasonCast(prevG) {
  // Separate returning (unengaged) characters from those who married last season
  const unengaged = prevG.chars.filter(c =>
    !Object.entries(prevG.rels).some(([k, r]) => r.married && k.split(':').includes(c.id))
  );
  const returningLadies = unengaged.filter(c => c.gender === 'f');
  const returningGents  = unengaged.filter(c => c.gender === 'm');
  [...returningLadies, ...returningGents].forEach(c => { c.seasons = (c.seasons || 1) + 1; });

  // Cap total characters at 14; split available new slots evenly between genders
  const totalReturning = returningLadies.length + returningGents.length;
  const totalNew       = Math.min(8, Math.max(0, 14 - totalReturning));
  const newLadyCount   = Math.floor(totalNew / 2);
  const newGentCount   = totalNew - newLadyCount;

  // Prefer portrait indices not already used by returning characters
  const usedLadyPortraits = new Set(returningLadies.map(c => c.portraitIdx));
  const usedGentPortraits = new Set(returningGents.map(c => c.portraitIdx));
  const allPortraitIdxs   = Array.from({length: 10}, (_, i) => i);
  const freeLadyPortraits = allPortraitIdxs.filter(i => !usedLadyPortraits.has(i));
  const freeGentPortraits = allPortraitIdxs.filter(i => !usedGentPortraits.has(i));
  const newLadyPortraits  = rN(freeLadyPortraits.length >= newLadyCount ? freeLadyPortraits : allPortraitIdxs, newLadyCount);
  const newGentPortraits  = rN(freeGentPortraits.length >= newGentCount ? freeGentPortraits : allPortraitIdxs, newGentCount);

  // Generate new characters (count may be less than 4 if cap applies)
  const sns       = shuf(SURNAMES);
  const tits      = shuf(GENT_TITLES);
  const newLadies = shuf(LADY_FIRST).slice(0, newLadyCount).map((fn, i) =>
    genChar('f', 0, fn, sns[i]   || r1(SURNAMES), 'Miss',                  newLadyPortraits[i])
  );
  const newGents  = shuf(GENT_FIRST).slice(0, newGentCount).map((fn, i) =>
    genChar('m', 0, fn, sns[newLadyCount+i] || r1(SURNAMES), tits[i % tits.length], newGentPortraits[i])
  );

  // Record old→new ID mapping before re-assigning (returning chars only)
  const allLadies = [...returningLadies, ...newLadies];
  const allGents  = [...returningGents,  ...newGents];
  const oldToNew  = new Map();
  returningLadies.forEach((c, i) => oldToNew.set(c.id, `f${i}`));
  returningGents.forEach( (c, i) => oldToNew.set(c.id, `m${i}`));

  allLadies.forEach((c, i) => { c.id = `f${i}`; c.layoutIdx = i; c.side = 'left'; });
  allGents.forEach( (c, i) => { c.id = `m${i}`; c.layoutIdx = i; c.side = 'right'; });

  // Carry over relationships between returning characters with score > 5, as friendships
  const carriedRels = {};
  const returningOldIds = new Set(oldToNew.keys());
  Object.entries(prevG.rels).forEach(([k, r]) => {
    if (r.score <= 5) return;
    const [id1, id2] = k.split(':');
    if (!returningOldIds.has(id1) || !returningOldIds.has(id2)) return;
    const newKey = [oldToNew.get(id1), oldToNew.get(id2)].sort().join(':');
    carriedRels[newKey] = { score: r.score, claimed: false, rival: null, type: 'friendship' };
  });

  return { chars: [...allLadies, ...allGents], carriedRels, returningLadies, returningGents, newLadies, newGents };
}

function newSeason() {
  const prevG = G;
  const newSeasonNum = prevG ? prevG.season + 1 : 1;

  let chars, carriedRels = {}, returningLadies = [], returningGents = [], newLadies = [], newGents = [];
  if (!prevG) {
    chars = genSeason();
  } else {
    ({ chars, carriedRels, returningLadies, returningGents, newLadies, newGents } = buildNextSeasonCast(prevG));
  }

  G = {
    season:    newSeasonNum,
    ball:      1,
    actions:   ACTIONS_PER_BALL,
    chars,
    rels:      carriedRels,
    claimed:   new Set(),
    actedThisBall: new Set(),
    gossipCount:  0,
    rumourCount:  0,
    scandalCount: 0,
    rivalChance: { rival1: 0.04, rival2: 0.04 },
    highlights: [],
    introThisBall: [],
    newMarriages: [],
    ballNames: rN(SURNAMES, 6).map(s => `The ${s} Ball`),
    prevScores: {},
    sel:       null,
    mode:      null,
    phase:     'playing',
    marriages: [],
    returningLadies, returningGents, newLadies, newGents,
  };
  buildCharMap();
  createInitialFriendships();
  addLog(`⚜️  The Season of ${seasonYear()} begins. Society assembles.`, 'imp');
  setBackground();
  savedTransform = null;  // fresh fit for new season
  initSim();   // set up force simulation for new characters
  render();
  fitToView();
  document.getElementById('overlay').classList.add('hidden');
  showOpeningNewsletter();
}

const FIRST_YEAR = 1811;
const seasonYear  = () => FIRST_YEAR + (G.season - 1);
const currentBallName = () => (G.ballNames && G.ballNames[G.ball - 1]) || `Ball ${G.ball}`;

const rkey   = (a, b) => [a, b].sort().join(':');
let charMap  = new Map();
function buildCharMap() { charMap = new Map(G.chars.map(c => [c.id, c])); }
const getC   = id => charMap.get(id);
const getRel = (a, b) => G.rels[rkey(a, b)] || null;

function conns(id) {
  return G.chars
    .filter(c => c.id !== id && G.rels[rkey(id, c.id)])
    .map(c => ({ c, r: G.rels[rkey(id, c.id)] }));
}

const canAct    = () => G.actions > 0 && G.phase === 'playing';
const isEngaged = id => Object.entries(G.rels).some(([k, r]) => r.married && k.split(':').includes(id));

function spend() {
  G.actions--;
  updHUD();
  if (G.actions === 0) addLog('Your last engagement of the evening is spent.', 'hint');
  maybeRivalActs();
  saveState();
}

// ── Rival matchmaker logic ──
function maybeRivalActs() {
  if (G.phase !== 'playing') return;
  RIVALS.forEach(rival => {
    const chance = G.rivalChance[rival.id];
    G.rivalChance[rival.id] = Math.min(1, chance + 0.04);
    if (Math.random() < chance) {
      rivalIntroduce(rival);
      G.rivalChance[rival.id] = 0.04;
    }
  });
}

function rivalIntroduce(rival) {
  const ladies = G.chars.filter(c => c.gender === 'f');
  const gents  = G.chars.filter(c => c.gender === 'm');

  // Collect IDs already introduced by this rival
  const alreadyUsed = new Set();
  Object.entries(G.rels).forEach(([k, r]) => {
    if (r.rival === rival.id) {
      k.split(':').forEach(id => alreadyUsed.add(id));
    }
  });

  const available = [];
  ladies.forEach(l => gents.forEach(g => {
    if (!G.rels[rkey(l.id, g.id)] && !alreadyUsed.has(l.id) && !alreadyUsed.has(g.id)
        && !isEngaged(l.id) && !isEngaged(g.id))
      available.push([l, g]);
  }));
  if (!available.length) return;

  const [lady, gent] = r1(available);
  const k = rkey(lady.id, gent.id);
  G.rels[k] = { score: 1, claimed: false, rival: rival.id };
  G.introThisBall.push(k);

  const quips = rival.id === 'rival1'
    ? [
        `Lady Pendleton steers ${lady.shortDisplay} toward ${gent.shortDisplay} with practiced ease.`,
        `Lady Pendleton catches your eye knowingly as she presents ${lady.shortDisplay} to ${gent.shortDisplay}.`,
        `With a graceful sweep, Lady Pendleton draws ${lady.shortDisplay} and ${gent.shortDisplay} together.`,
        `Lady Pendleton has already seen to the introduction of ${lady.shortDisplay} and ${gent.shortDisplay}.`,
      ]
    : [
        `Mrs. Hartwick sizes up ${gent.shortDisplay}'s prospects and presents him to ${lady.shortDisplay}.`,
        `Mrs. Hartwick bustles over to introduce ${lady.shortDisplay} to ${gent.shortDisplay}.`,
        `Mrs. Hartwick, ever practical, makes brisk work of introducing ${lady.shortDisplay} and ${gent.shortDisplay}.`,
        `Mrs. Hartwick has seen to it — ${lady.shortDisplay} and ${gent.shortDisplay} are now acquainted.`,
      ];

  addLog(`⚔️ ${r1(quips)}`, rival.id);
  if (sim) sim.alpha(0.2).restart();
  render();
}

// ═══════════════════════════════════════════════════════════
//  FORCE SIMULATION
// ═══════════════════════════════════════════════════════════
let sim           = null;
let simNodes      = [];        // [{id, x, y, vx, vy, fx, fy, _dragging}]
let simNodeMap    = new Map(); // id → simNode (O(1) lookup)
let nodeEls       = new Map(); // id → DOM element (populated by renderGraph)
let edgeEls       = new Map(); // edge key → DOM element (populated by renderGraph)
let zoomBehavior  = null;
let savedTransform = null;

function graphSize() {
  const svg = document.getElementById('graph');
  return {
    W: Math.max(svg.clientWidth  || 800, 500),
    H: Math.max(svg.clientHeight || 500, 380),
  };
}

function initSim() {
  const { W, H } = graphSize();

  // Preserve existing positions across re-inits (e.g. window resize)
  const prev = {};
  simNodes.forEach(n => { prev[n.id] = { x: n.x, y: n.y }; });

  const ladyCount = G.chars.filter(c => c.gender === 'f').length;
  const gentCount = G.chars.filter(c => c.gender === 'm').length;

  simNodes = G.chars.map(c => {
    const p = prev[c.id];
    // Stagger initial x across the full width in two loose columns so nodes don't all pile up
    const col       = c.gender === 'f' ? 0.3 : 0.7;
    const sideCount = c.gender === 'f' ? ladyCount : gentCount;
    const divisor   = Math.max(sideCount - 1, 1);
    return {
      id:   c.id,
      x:    p ? p.x : W * col + (Math.random() - 0.5) * W * 0.15,
      y:    p ? p.y : H * 0.15 + c.layoutIdx * (H * 0.72 / divisor),
      _dragging: false,
    };
  });

  simNodeMap = new Map(simNodes.map(n => [n.id, n]));

  if (sim) sim.stop();

  sim = d3.forceSimulation(simNodes)
    .force('charge',    d3.forceManyBody().strength(-420))
    .force('cx',        d3.forceX(W / 2).strength(0.015))   // gentle horizontal centering
    .force('y',         d3.forceY(H / 2).strength(0.04))
    .force('collision', d3.forceCollide(NR + 32))
    .alphaDecay(0.015)
    .on('tick', onTick);
}

// Called every simulation tick — updates positions without rebuilding the SVG
function onTick() {
  // Move node groups
  simNodes.forEach(n => {
    const el = nodeEls.get(n.id);
    if (el) el.setAttribute('transform', `translate(${n.x},${n.y})`);
  });

  // Reposition edge lines and labels
  updateEdgePositions();
}

function updateEdgePositions() {
  if (!G) return;
  Object.keys(G.rels).forEach(k => {
    const [id1, id2] = k.split(':');
    const n1 = simNodeMap.get(id1);
    const n2 = simNodeMap.get(id2);
    if (!n1 || !n2) return;

    const eg = edgeEls.get(k);
    if (!eg) return;

    const { sx, sy, ex, ey } = edgeEndpoints(n1.x, n1.y, n2.x, n2.y);

    eg.querySelectorAll('line').forEach(ln => {
      ln.setAttribute('x1', sx); ln.setAttribute('y1', sy);
      ln.setAttribute('x2', ex); ln.setAttribute('y2', ey);
    });
    const sl = eg.querySelector('text');
    if (sl) {
      const mx = (sx + ex) / 2;
      sl.setAttribute('x', mx);
      sl.setAttribute('y', (sy + ey) / 2 - 7);
      sl.querySelectorAll('tspan[data-line]').forEach(ts => ts.setAttribute('x', mx));
    }
  });
}

function edgeEndpoints(x1, y1, x2, y2) {
  const dx   = x2 - x1, dy = y2 - y1;
  const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const ux = dx / dist, uy = dy / dist;
  return {
    sx: x1 + ux * (NR + 4),  sy: y1 + uy * (NR + 4),
    ex: x2 - ux * (NR + 10), ey: y2 - uy * (NR + 10),
  };
}

// D3 drag behaviour — bound to node groups after each renderGraph()
function setupDrag() {
  const drag = d3.drag()
    .on('start', function (event) {
      const id = this.getAttribute('data-id');
      const sn = simNodeMap.get(id);
      if (!sn) return;
      if (!event.active) sim.alphaTarget(0.3).restart();
      sn.fx = sn.x;
      sn.fy = sn.y;
      sn._dragging = false;
      this.__simNode = sn;
    })
    .on('drag', function (event) {
      const sn = this.__simNode;
      if (!sn) return;
      sn.fx = event.x;
      sn.fy = event.y;
      sn._dragging = true;
    })
    .on('end', function (event) {
      const sn = this.__simNode;
      if (!sn) return;
      if (!event.active) sim.alphaTarget(0);
      sn.fx = null;
      sn.fy = null;
      this.__simNode = null;
      // Brief delay so the click handler can check _dragging before we clear it
      setTimeout(() => { sn._dragging = false; }, 80);
    });

  d3.selectAll('.char-node').call(drag);
}

function fitToView() {
  if (!simNodes.length || !zoomBehavior) return;
  const { W, H } = graphSize();
  const svg = document.getElementById('graph');
  const pad = NR + 80;  // clear node radius + badges + name label
  const xs  = simNodes.map(n => n.x);
  const ys  = simNodes.map(n => n.y);
  const x0  = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad;
  const y0  = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
  const k   = Math.min(W / (x1 - x0), H / (y1 - y0), 2) * 0.9;
  const tx  = (W - (x0 + x1) * k) / 2;
  const ty  = (H - (y0 + y1) * k) / 2;
  const t   = d3.zoomIdentity.translate(tx, ty).scale(k);
  d3.select(svg).call(zoomBehavior.transform, t);
  savedTransform = t;
}

function setupZoom(svg) {
  zoomBehavior = d3.zoom()
    .scaleExtent([0.2, 6])
    .on('zoom', event => {
      const l = document.getElementById('zoom-layer');
      if (l) l.setAttribute('transform', event.transform);
    });

  d3.select(svg).call(zoomBehavior);

  // Restore zoom/pan from before the re-render
  if (savedTransform) {
    d3.select(svg).call(zoomBehavior.transform, savedTransform);
  }
}

// ═══════════════════════════════════════════════════════════
//  ACTIONS
// ═══════════════════════════════════════════════════════════

function doChat(id) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey('chat', id))) {
    addLog(`You have already spoken with ${getC(id).shortDisplay} this evening.`);
    return;
  }
  const c = getC(id);
  const hiddenKeys = ['pers', 'i0', 'i1', 'i2', 'ap', 'apr'].filter(k => !c.rv[k]);
  if (!hiddenKeys.length) {
    addLog(`There is nothing more to learn from ${c.shortDisplay} — all is already known.`);
    return;
  }
  const key = r1(hiddenKeys);
  revealAttr(c, key);
  const chatHl = [{ charId: id, key }];

  // Conversation interest bonus: guaranteed personality reveal + exposes love of conversation
  const lovesConversation = c.interests.some(i => i.id === 'conversation');
  if (lovesConversation) {
    const convIdx = c.interests.findIndex(i => i.id === 'conversation');
    const convKey = ['i0', 'i1', 'i2'][convIdx];
    if (!c.rv[convKey]) {
      c.rv[convKey] = true;
      addLog(`${c.shortDisplay}'s evident pleasure in the exchange betrays a love of Conversation 🗣️.`, 'imp', id);
      chatHl.push({ charId: id, key: convKey });
    }
    if (!c.rv.pers && key !== 'pers') {
      revealAttr(c, 'pers');
      chatHl.push({ charId: id, key: 'pers' });
    }
  } else if (!c.rv.pers && key !== 'pers' && Math.random() < 0.5) {
    revealAttr(c, 'pers');
    chatHl.push({ charId: id, key: 'pers' });
  }

  G.actedThisBall.add(actKey('chat', id));
  setHighlights(chatHl);
  spend(); clearSel(); render();
}

function doIntroduce(id1, id2) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey('intro', id1))) {
    addLog(`${getC(id1).shortDisplay} has already made an introduction this evening.`);
    return;
  }
  const c1 = getC(id1), c2 = getC(id2);
  const k  = rkey(id1, id2);
  if (G.rels[k]) {
    addLog(`${c1.shortDisplay} and ${c2.shortDisplay} are already acquainted.`);
    return;
  }
  let introPhys = 0;
  if (c1.gender !== c2.gender) {
    if (isEngaged(id1)) { addLog(`${c1.shortDisplay} is already engaged.`); return; }
    if (isEngaged(id2)) { addLog(`${c2.shortDisplay} is already engaged.`); return; }
  }
  if (c1.gender === c2.gender) {
    G.rels[k] = { score: 1, claimed: false, rival: null };
    const friendMsgs = [
      `I am ${c1.fullName} — I do not believe we have been introduced. You must be ${c2.shortDisplay}.`,
      `Pray allow me to introduce myself — I am ${c1.shortDisplay}. I have hoped to make your acquaintance, ${c2.shortDisplay}.`,
      `I do not think we have been properly introduced — I am ${c1.shortDisplay}, and you, I believe, are ${c2.shortDisplay}.`,
    ];
    addLog(r1(friendMsgs), '', id1);
  } else {
    // Revoke any existing claims for either character before claiming this new introduction
    [id1, id2].forEach(cid => {
      Object.entries(G.rels).forEach(([ok, or]) => {
        if (!ok.includes(cid) || !or.claimed) return;
        or.claimed = false;
        G.claimed.delete(ok);
        const [oid1, oid2] = ok.split(':');
        const oa = getC(oid1), ob = getC(oid2);
        if (oa && ob) addLog(`Your claim on ${oa.shortDisplay} & ${ob.shortDisplay} is relinquished.`, 'hint');
      });
    });
    const lady = c1.gender === 'f' ? c1 : c2;
    const gent = c1.gender === 'm' ? c1 : c2;
    ({ phys: introPhys } = mutualAttractions(lady, gent));
    G.rels[k] = { score: 1 + introPhys, claimed: true, rival: null };
    G.claimed.add(k);
    const introMsgs = [
      `Pray allow me to introduce myself — I am ${c1.fullName}. And you must be ${c2.shortDisplay}.`,
      `I believe we have not yet been introduced — I am ${c1.fullName}, and I am most pleased to make your acquaintance, ${c2.shortDisplay}.`,
      `I do not think we have been properly introduced — I am ${c1.shortDisplay}, and I believe you are ${c2.shortDisplay}.`,
    ];
    addLog(r1(introMsgs), 'imp', id1);
  }
  G.actedThisBall.add(actKey('intro', id1));
  G.introThisBall.push(k);
  // Nudge the simulation so edges animate into place
  if (sim) sim.alpha(0.25).restart();
  spend(); clearSel(); render();
  if (introPhys > 0) showRelBoost(id1, id2, introPhys);
}

function doGossip(charId) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey('gossip', charId))) {
    addLog(`${getC(charId).shortDisplay} has already shared their whispers this evening.`);
    return;
  }
  const ch = getC(charId);
  const others = G.chars.filter(c => c.id !== charId);
  const lovesGossip = ch.interests.some(i => i.id === 'gossip');
  const count = lovesGossip ? 3 : 2;
  addLog(`You draw ${ch.shortDisplay} aside for the latest whispers…`);
  const gossipHl = [];
  rN(others, count).forEach(ab => {
    const hiddenKeys = ['pers', 'i0', 'i1', 'i2', 'ap', 'apr'].filter(k => !ab.rv[k]);
    if (!hiddenKeys.length) {
      addLog(`${ab.shortDisplay} holds no further secrets — all is already known.`);
      return;
    }
    const key = r1(hiddenKeys);
    gossipHl.push({ charId: ab.id, key });
    revealAttr(ab, key);
  });
  // If the character loves gossip and that interest isn't yet revealed, reveal it now
  if (lovesGossip) {
    const gossipIdx = ch.interests.findIndex(i => i.id === 'gossip');
    const iKey = ['i0', 'i1', 'i2'][gossipIdx];
    if (!ch.rv[iKey]) {
      ch.rv[iKey] = true;
      addLog(`${ch.shortDisplay}'s delight in the exchange is unmistakable — their love of Gossip 🤫 is now known to you.`, 'imp', charId);
      gossipHl.push({ charId: charId, key: iKey });
    }
  }
  setHighlights(gossipHl);

  // Escalating risk: 1st gossip = 0%, 2nd = 20%, 3rd = 40%, etc.
  const gossipPenalty = G.gossipCount * 0.20;
  G.gossipCount++;
  if (gossipPenalty > 0 && Math.random() < gossipPenalty) applyReputationPenalty();

  G.actedThisBall.add(actKey('gossip', charId));
  spend(); clearSel(); render();
}

function doEnquire(charId) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey('enquire', charId))) {
    addLog(`${getC(charId).shortDisplay} has already spoken of their circle this evening.`);
    return;
  }
  const ch = getC(charId);
  const charConns = conns(charId);

  addLog(`You draw ${ch.shortDisplay} out on the subject of their acquaintances…`);
  const hlEntries = [];
  let revealed = 0;

  charConns.forEach(({ c: other, r }) => {
    // Chance scales with relationship strength: ~5% at score 1, ~50% at score 10, 100% at score 20+
    const chance = Math.min(1, r.score / 20);
    if (Math.random() > chance) return;

    const hiddenKeys = Object.entries(other.rv)
      .filter(([, known]) => !known)
      .map(([k]) => k);
    if (!hiddenKeys.length) return;

    const key = r1(hiddenKeys);
    other.rv[key] = true;

    const attrDesc = {
      pers: `a ${other.personality.l} disposition`,
      i0:   `a great love of ${other.interests[0].l}`,
      i1:   `a great love of ${other.interests[1].l}`,
      i2:   `a great love of ${other.interests[2].l}`,
      ap:   `an admiration for ${other.attrPhys.l} appearance`,
      apr:  `a fondness for ${other.attrPers.l} souls`,
    }[key];

    const msgs = [
      `${ch.shortDisplay} confides that ${other.shortDisplay} has ${attrDesc}.`,
      `You learn from ${ch.shortDisplay} that ${other.shortDisplay} has ${attrDesc}.`,
      `Speaking of ${other.shortDisplay}, ${ch.shortDisplay} reveals they have ${attrDesc}.`,
    ];
    addLog(r1(msgs), 'imp', other.id);
    hlEntries.push({ charId: other.id, key });
    revealed++;
  });

  if (!revealed) {
    addLog(`${ch.shortDisplay} speaks warmly of their acquaintances, but reveals nothing you do not already know.`);
  }

  if (hlEntries.length) setHighlights(hlEntries);
  G.actedThisBall.add(actKey('enquire', charId));
  spend(); clearSel(); render();
}

function doSocialAction(type, id1, id2) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey(type, id1))) {
    const verb = type === 'dance' ? 'danced' : 'had their private conversation';
    addLog(`${getC(id1).shortDisplay} has already ${verb} this evening.`);
    return;
  }
  const c1 = getC(id1), c2 = getC(id2);
  if (c1.gender === c2.gender) {
    addLog(`This action requires partners of opposite gender.`);
    return;
  }
  const k = rkey(id1, id2);
  if (!G.rels[k]) {
    addLog(`${c1.shortDisplay} and ${c2.shortDisplay} have not yet been introduced.`);
    return;
  }
  const lady = c1.gender === 'f' ? c1 : c2;
  const gent = c1.gender === 'm' ? c1 : c2;
  let boost, openers;
  if (type === 'dance') {
    const { phys: dPhys } = mutualAttractions(lady, gent);
    boost = 1 + dPhys;
    if (lady.interests.some(i => i.id === 'dancing')) boost += 1;
    if (gent.interests.some(i => i.id === 'dancing')) boost += 1;
    openers = [
      `Would you do me the honour of this dance, ${c2.shortDisplay}?`,
      `I believe the next set is forming — might you partner me, ${c2.shortDisplay}?`,
      `Might I have the pleasure of this dance, ${c2.shortDisplay}?`,
    ];
  } else {
    const { pers: dPers } = mutualAttractions(lady, gent);
    boost = 1 + dPers;
    if (lady.interests.some(i => i.id === 'conversation')) boost += 1;
    if (gent.interests.some(i => i.id === 'conversation')) boost += 1;
    openers = [
      `I had hoped for an opportunity to speak with you this evening, ${c2.shortDisplay}.`,
      `Might I claim a few moments of your time, ${c2.shortDisplay}?`,
      `I wonder if I might prevail upon you for a little conversation, ${c2.shortDisplay}?`,
    ];
  }
  G.rels[k].score = Math.min(MAX_SCORE, G.rels[k].score + boost);
  addLog(r1(openers), 'imp', id1);
  G.actedThisBall.add(actKey(type, id1));
  if (sim) sim.alpha(0.15).restart();
  spend(); clearSel(); render();
  showRelBoost(id1, id2, boost);
}

function doDance(id1, id2)    { doSocialAction('dance',    id1, id2); }
function doConverse(id1, id2) { doSocialAction('converse', id1, id2); }

function doDiscuss(charId) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey('discuss', charId))) {
    addLog(`${getC(charId).shortDisplay} has already discussed their interests this evening.`);
    return;
  }
  const ch = getC(charId);
  const genderTerm = ch.gender === 'f' ? 'ladies' : 'gentlemen';

  const revealedInts = [
    ch.rv.i0 ? { interest: ch.interests[0], key: 'i0' } : null,
    ch.rv.i1 ? { interest: ch.interests[1], key: 'i1' } : null,
    ch.rv.i2 ? { interest: ch.interests[2], key: 'i2' } : null,
  ].filter(Boolean);

  if (!revealedInts.length) { addLog(`No interests of ${ch.shortDisplay} are yet known.`); return; }

  const discussHl = [];
  const iKeys = ['i0', 'i1', 'i2'];

  revealedInts.forEach(({ interest, key }) => {
    discussHl.push({ charId, key });
    const sharing = G.chars.filter(c =>
      c.id !== charId && c.gender === ch.gender && c.interests.some(i => i.id === interest.id)
    );
    if (!sharing.length) {
      const noneMsgs = [
        `Among the ${genderTerm}, I confess I know of none who share my love of ${interest.l}.`,
        `It seems I stand quite alone among the ${genderTerm} in my passion for ${interest.l}.`,
      ];
      addLog(r1(noneMsgs), 'imp', charId);
    } else {
      const names = sharing.map(c => c.shortDisplay).join(', ');
      const shareMsgs = [
        `Among the ${genderTerm}, I know that ${names} share${sharing.length === 1 ? 's' : ''} my passion for ${interest.l}!`,
        `Among the ${genderTerm}, ${names} and I share a great love of ${interest.l}.`,
      ];
      addLog(r1(shareMsgs), 'imp', charId);
      sharing.forEach(c => {
        const idx = c.interests.findIndex(i => i.id === interest.id);
        if (idx >= 0) {
          c.rv[iKeys[idx]] = true;
          discussHl.push({ charId: c.id, key: iKeys[idx] });
        }
      });
    }
  });

  setHighlights(discussHl);
  G.actedThisBall.add(actKey('discuss', charId));
  spend(); clearSel(); render();
}

function doSeek(charId) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey('seek', charId))) {
    addLog(`${getC(charId).shortDisplay} has already confided in you this evening.`);
    return;
  }
  const ch = getC(charId);

  const qualifyingFriends = G.chars.filter(c => {
    if (c.id === charId) return false;
    const r = G.rels[rkey(charId, c.id)];
    return r && !relIsRomantic(ch, c, r) && r.score >= 10;
  });

  if (!qualifyingFriends.length) {
    addLog(`${ch.shortDisplay} has no close enough friends to confide about.`);
    return;
  }

  const target = r1(qualifyingFriends);
  const hiddenKeys = ['pers', 'ap', 'apr'].filter(k => !target.rv[k]);

  if (!hiddenKeys.length) {
    addLog(`${ch.shortDisplay} speaks warmly of ${target.shortDisplay}, but reveals nothing you do not already know.`);
  } else {
    const key = r1(hiddenKeys);
    target.rv[key] = true;
    const attrDesc = {
      pers: `a ${target.personality.l} disposition`,
      ap:   `an admiration for ${target.attrPhys.l} appearance`,
      apr:  `a fondness for ${target.attrPers.l} souls`,
    }[key];
    const msgs = [
      `${ch.shortDisplay} confides that their dear friend ${target.shortDisplay} has ${attrDesc}.`,
      `In confidence, ${ch.shortDisplay} lets slip that ${target.shortDisplay} has ${attrDesc}.`,
      `Speaking privately of ${target.shortDisplay}, ${ch.shortDisplay} reveals they have ${attrDesc}.`,
    ];
    addLog(r1(msgs), 'imp', charId);
    setHighlights([{ charId: target.id, key }]);
  }

  G.actedThisBall.add(actKey('seek', charId));
  spend(); clearSel(); render();
}

function revealAttr(c, k) {
  c.rv[k] = true;
  const speech = {
    pers: `I confess I have quite a ${c.personality.l} disposition.`,
    i0:   `I have always had a great love of ${c.interests[0].l}.`,
    i1:   `I have always had a great love of ${c.interests[1].l}.`,
    i2:   `I have always had a great love of ${c.interests[2].l}.`,
    ap:   `I find ${c.attrPhys.l} appearance most captivating.`,
    apr:  `I am drawn to ${c.attrPers.l} souls above all others.`,
  };
  addLog(speech[k], 'imp', c.id);
}

// ═══════════════════════════════════════════════════════════
//  BALL PROGRESSION
// ═══════════════════════════════════════════════════════════
function nextBall() {
  if (G.phase !== 'playing') return;
  if (G.actions > 0 && !confirm(`You still have ${G.actions} action${G.actions > 1 ? 's' : ''} remaining. Proceed to the next ball?`)) return;
  // Snapshot scores before drift so the newsletter can report changes
  G.prevScores = {};
  Object.entries(G.rels).forEach(([k, r]) => { G.prevScores[k] = r.score; });
  naturalDrift();
  G.newMarriages = processMidSeasonMarriages();
  if (G.ball >= 6) { endSeason(); return; }
  showNewsletter();
}

const BALL_ORDINALS = ['First','Second','Third','Fourth','Fifth','Sixth'];

// Returns a qualitative description of a score change for use in prose
function deltaPhrase(delta, lady, gent, label) {
  const ln = lady.shortDisplay, gn = gent.shortDisplay;
  const lf = lady.fullName,     gf = gent.fullName;
  const lb = label.toLowerCase();

  if (delta === null) {
    // Newly introduced at the last ball
    return r1([
      `At our last assembly, ${lf} and ${gf} were introduced for the first time. The connexion is as yet merely ${lb}, but your correspondent shall watch with interest.`,
      `${ln} and ${gn} made each other's acquaintance for the first time at our last ball — a ${lb} beginning that may yet prove significant.`,
    ]);
  }
  if (delta >= 8) {
    return r1([
      `In the weeks since our last assembly, the regard between ${lf} and ${gf} has blossomed with remarkable swiftness, and must now be described as nothing less than ${lb}. Society is quite astonished.`,
      `Your correspondent can scarcely credit the speed with which the connexion between ${ln} and ${gn} has deepened since our last ball. What was once a modest acquaintance has grown, with extraordinary rapidity, into something thoroughly ${lb}.`,
    ]);
  }
  if (delta >= 5) {
    return r1([
      `The connexion between ${lf} and ${gf} has deepened considerably in the weeks since our last gathering, and now stands as what your correspondent can only call ${lb}.`,
      `These past several weeks have seen a most notable advance in the understanding between ${ln} and ${gn}. The change is considerable, and the current character of their acquaintance is decidedly ${lb}.`,
    ]);
  }
  if (delta >= 2) {
    return r1([
      `Since our last assembly, the acquaintance between ${ln} and ${gn} has grown appreciably warmer, settling into what your correspondent judges a ${lb} understanding.`,
      `The weeks between balls have been kind to the connexion between ${lf} and ${gf}, which has advanced modestly and may now be termed ${lb}.`,
    ]);
  }
  if (delta >= 1) {
    return r1([
      `Your correspondent notes a modest but encouraging advance in the ${lb} acquaintance of ${ln} and ${gn} since our last ball.`,
      `The connexion between ${ln} and ${gn} has progressed, if only slightly, in the past weeks, and retains its ${lb} character.`,
    ]);
  }
  if (delta === 0) {
    return r1([
      `The ${lb} understanding between ${ln} and ${gn} has held quite steady since our last assembly — neither advancing nor retreating.`,
      `Your correspondent observes that the connexion between ${lf} and ${gf} remains ${lb} in character, having shown little movement these past weeks.`,
    ]);
  }
  // delta < 0
  const adv = delta <= -4 ? 'markedly' : 'somewhat';
  return r1([
    `Your correspondent must report with some regret that the connexion between ${ln} and ${gn} has cooled ${adv} since our last ball, and now appears merely ${lb} in character.`,
    `It is with disappointment that your correspondent notes the ${adv} diminished warmth between ${lf} and ${gf} in recent weeks. The present state of affairs is best described as ${lb}.`,
  ]);
}

function nlCoupleBlock(c1, c2, paraHtml) {
  return `<div class="nl-couple">
    <div class="nl-portraits">
      <img class="nl-portrait" src="${portraitSrc(c1)}" alt="${c1.shortDisplay}">
      <img class="nl-portrait" src="${portraitSrc(c2)}" alt="${c2.shortDisplay}">
    </div>
    ${paraHtml}
  </div>`;
}

function generateNewsletter() {
  const prev = G.prevScores || {};

  // Romantic relationships sorted by score, enriched with delta (exclude already-married)
  const romanticRels = Object.entries(G.rels)
    .map(([k, r]) => {
      const [id1, id2] = k.split(':');
      const c1 = getC(id1), c2 = getC(id2);
      if (!c1 || !c2 || !relIsRomantic(c1, c2, r)) return null;
      if (r.married) return null;
      const lady  = c1.gender === 'f' ? c1 : c2;
      const gent  = c1.gender === 'm' ? c1 : c2;
      const delta = (k in prev) ? r.score - prev[k] : null;
      return { k, r, lady, gent, delta };
    })
    .filter(Boolean)
    .sort((a, b) => b.r.score - a.r.score);

  // Friendships sorted by score with delta
  const friendships = Object.entries(G.rels)
    .map(([k, r]) => {
      const [id1, id2] = k.split(':');
      const c1 = getC(id1), c2 = getC(id2);
      if (!c1 || !c2 || relIsRomantic(c1, c2, r)) return null;
      const delta = (k in prev) ? r.score - prev[k] : null;
      return { c1, c2, r, delta };
    })
    .filter(Boolean)
    .sort((a, b) => b.r.score - a.r.score);

  // Cross-gender introductions made this ball
  const newIntros = G.introThisBall
    .map(k => {
      const [id1, id2] = k.split(':');
      const c1 = getC(id1), c2 = getC(id2);
      if (!c1 || !c2 || c1.gender === c2.gender) return null;
      return { k, r: G.rels[k], c1, c2 };
    })
    .filter(Boolean);

  const paras = [];

  // Opening
  const openings = [
    `Your faithful correspondent brings you the latest intelligence gathered from the drawing rooms and promenades of society these past several weeks.`,
    `Once again your correspondent takes up her pen to relay those whispers and observations accumulated since our last assembly.`,
    `The weeks between balls are never idle for your correspondent, and the following intelligence is set down with all her customary care.`,
    `Society has been most animated in recent weeks, and your correspondent is pleased to report the following for the benefit of her discerning readers.`,
  ];
  paras.push(`<p class="nl-opener"><em>Gentle Reader,</em></p><p>${r1(openings)}</p>`);

  // Mid-season marriages — report first and most prominently
  const newMarriages = G.newMarriages || [];
  if (newMarriages.length > 0) {
    newMarriages.forEach(({ lady, gent, claimed, rival }) => {
      const credit = claimed
        ? `through the most fortunate offices of your correspondent's acquaintance`
        : rival === 'rival1' ? `thanks, it must be said, to the introductions of Lady Pendleton`
        : rival === 'rival2' ? `owing in no small part to the endeavours of Mrs. Hartwick`
        : `through the natural workings of society`;
      const announcements = [
        `Your correspondent is delighted — and not a little astonished — to announce the engagement of ${lady.fullName} and ${gent.fullName}, ${credit}. Their attachment, which has grown with remarkable swiftness these past weeks, has culminated in a most happy understanding. Society offers its warmest congratulations.`,
        `It is with the greatest pleasure that your correspondent reports the engagement of ${lady.shortDisplay} and ${gent.shortDisplay}, ${credit}. The warmth of their mutual regard has, in these past several weeks, deepened into an ardent and settled attachment. The match is considered by all to be most suitable.`,
      ];
      paras.push(nlCoupleBlock(lady, gent, `<p><strong>💍 An Engagement Announced.</strong> ${r1(announcements)}</p>`));
    });
  }

  // Top romantic relationship — always include with full delta prose
  if (romanticRels.length > 0) {
    const { lady, gent, r, delta } = romanticRels[0];
    const label = relLabel(lady, gent, r.score, r);
    paras.push(nlCoupleBlock(lady, gent, `<p>${deltaPhrase(delta, lady, gent, label)}</p>`));
  }

  // Second romantic relationship — include if meaningfully developed or changed
  if (romanticRels.length > 1) {
    const { lady, gent, r, delta } = romanticRels[1];
    if (r.score >= 4 || (delta !== null && Math.abs(delta) >= 2)) {
      const label = relLabel(lady, gent, r.score, r);
      paras.push(nlCoupleBlock(lady, gent, `<p>${deltaPhrase(delta, lady, gent, label)}</p>`));
    }
  }

  // New introductions at the last ball (not covered above)
  const reportedKeys = romanticRels.slice(0, 2).map(rel => rel.k);
  const unreportedIntros = newIntros.filter(({ k }) => !reportedKeys.includes(k));
  if (unreportedIntros.length > 0) {
    const { c1, c2, r } = r1(unreportedIntros);
    const lady   = c1.gender === 'f' ? c1 : c2;
    const gent   = c1.gender === 'm' ? c1 : c2;
    const agency = r.claimed
      ? `a most diligent matchmaker of your correspondent's acquaintance`
      : r.rival === 'rival1' ? `the indefatigable Lady Pendleton`
      : r.rival === 'rival2' ? `the ever-practical Mrs. Hartwick`
      : `a mutual friend`;
    const para = r1([
      `Through the offices of ${agency}, ${lady.fullName} and ${gent.fullName} were introduced at our last assembly. All eyes shall be upon them at the forthcoming ball.`,
      `Society notes a new acquaintance formed at our last ball: ${lady.shortDisplay} and ${gent.shortDisplay}, brought together through ${agency}.`,
    ]);
    paras.push(nlCoupleBlock(lady, gent, `<p>${para}</p>`));
  }

  // Notable friendship — include with delta language (occasionally)
  if (friendships.length > 0 && Math.random() > 0.4) {
    const { c1, c2, r, delta } = friendships[0];
    const label = relLabel(c1, c2, r.score);
    const lb    = label.toLowerCase();
    let para;
    if (delta === null) {
      para = `A new friendship between ${c1.shortDisplay} and ${c2.shortDisplay} was formed at our last assembly — a most ${lb} beginning.`;
    } else if (delta >= 3) {
      para = `The friendship between ${c1.shortDisplay} and ${c2.shortDisplay} has grown considerably in recent weeks and is now best described as ${lb}.`;
    } else if (delta < 0) {
      para = `Your correspondent notes, with some sadness, that the ${lb} friendship of ${c1.shortDisplay} and ${c2.shortDisplay} has cooled of late.`;
    } else {
      para = `The ${lb} friendship between ${c1.shortDisplay} and ${c2.shortDisplay} continues to be remarked upon with pleasure by all their acquaintance.`;
    }
    paras.push(nlCoupleBlock(c1, c2, `<p>${para}</p>`));
  }

  // Rival commentary (occasionally)
  const rv1 = Object.values(G.rels).filter(r => r.rival === 'rival1').length;
  const rv2 = Object.values(G.rels).filter(r => r.rival === 'rival2').length;
  if ((rv1 + rv2) > 0 && Math.random() > 0.45) {
    let rivalPara;
    if (rv1 > 0 && rv2 > 0) {
      rivalPara = `Both Lady Pendleton and Mrs. Hartwick have been most active in their matchmaking endeavours in recent weeks. The competition for professional credit grows ever keener.`;
    } else if (rv1 > rv2) {
      rivalPara = `Lady Pendleton has been seen making introductions with her characteristic theatrical flair these past weeks. Your correspondent wonders whether her exertions shall prove as fruitful as she hopes.`;
    } else {
      rivalPara = `Mrs. Hartwick has continued her methodical campaign of introductions since our last ball. One admires the efficiency, if not always the taste.`;
    }
    paras.push(`<p>${rivalPara}</p>`);
  }

  // Closing
  const closings = [
    `Until the next assembly, your correspondent remains, as ever, your faithful reporter of society's movements.`,
    `Your correspondent shall be present at the forthcoming ball and pledges to report all developments with her customary candour.`,
    `The next ball promises much. Your correspondent shall not fail to attend, nor to observe.`,
    `Society awaits the next gathering with the keenest anticipation. Your correspondent shall be there.`,
  ];
  paras.push(`<p>${r1(closings)}</p><p class="nl-sig">Your most obedient servant,<br><em>A Lady of Quality</em></p>`);

  return paras.join('\n');
}

function showNewsletter() {
  const nextBallNum = G.ball + 1;
  document.getElementById('nl-issue').textContent =
    `${G.ballNames[nextBallNum - 1] || `Ball ${nextBallNum}`}  ·  ${seasonYear()}`;
  document.getElementById('nl-body').innerHTML = generateNewsletter();
  const btn = document.getElementById('nl-btn');
  btn.textContent = 'Attend the Ball';
  btn.onclick = dismissNewsletter;
  document.getElementById('newsletter-overlay').classList.remove('hidden');
}

function dismissNewsletter() {
  document.getElementById('newsletter-overlay').classList.add('hidden');
  G.ball++;
  G.actions = ACTIONS_PER_BALL;
  G.introThisBall = [];
  G.newMarriages = [];
  addLog(`🕯️  ${currentBallName()} commences.`, 'ball');
  G.actedThisBall = new Set();
  G.gossipCount = 0;
  G.highlights = [];
  if (highlightTimer) { clearTimeout(highlightTimer); highlightTimer = null; }
  setBackground();
  clearSel();
  render();

  // Show natural drift as floating +/- text on each changed edge
  const prev = G.prevScores || {};
  Object.entries(G.rels).forEach(([k, r]) => {
    if (r.married) return;
    const delta = Math.round(r.score - (k in prev ? prev[k] : r.score));
    if (delta === 0) return;
    const [id1, id2] = k.split(':');
    showRelBoost(id1, id2, delta);
  });

  saveState();
}

function calcDrift(c1, c2, r) {
  let grow = 0;
  if (relIsRomantic(c1, c2, r)) {
    const lady = c1.gender === 'f' ? c1 : c2;
    const gent = c1.gender === 'm' ? c1 : c2;
    const shared = lady.interests.filter(i => gent.interests.some(j => j.id === i.id)).length;
    grow += shared > 0 ? shared * 2 : -1;
    const { phys: dPhys, pers: dPers } = mutualAttractions(lady, gent);
    grow += dPhys * 3 + dPers * 5;
    if (lady.wealth === gent.wealth) grow += 1;
    if ((lady.wealth === 3 && gent.wealth === 1) || (lady.wealth === 1 && gent.wealth === 3)) grow -= 1;
  } else {
    const shared = c1.interests.filter(i => c2.interests.some(j => j.id === i.id)).length;
    grow += shared > 0 ? shared * 2 : -1;
    if ((c1.wealth === 3 && c2.wealth === 1) || (c1.wealth === 1 && c2.wealth === 3)) grow -= 1;
  }
  return grow;
}

function naturalDrift() {
  Object.keys(G.rels).forEach(k => {
    const [id1, id2] = k.split(':');
    const c1 = getC(id1), c2 = getC(id2);
    if (!c1 || !c2) return;
    const grow = calcDrift(c1, c2, G.rels[k]);
    G.rels[k].score = Math.min(MAX_SCORE, Math.max(0, G.rels[k].score + grow));
  });
}

// ═══════════════════════════════════════════════════════════
//  MID-SEASON MARRIAGES (score reaches 30 after natural drift)
// ═══════════════════════════════════════════════════════════
function convertOtherRomancesToFriendships(exceptKey, ids) {
  ids.forEach(mid => {
    Object.entries(G.rels).forEach(([ok, or]) => {
      if (ok === exceptKey || or.married) return;
      if (!ok.includes(mid)) return;
      const [oid1, oid2] = ok.split(':');
      const oc1 = getC(oid1), oc2 = getC(oid2);
      if (oc1 && oc2 && relIsRomantic(oc1, oc2, or)) {
        or.type   = 'friendship';
        or.claimed = false;
        or.rival   = null;
        G.claimed.delete(ok);
      }
    });
  });
}

function processMidSeasonMarriages() {
  const newMarriages = [];
  const taken = new Set();

  // Seed taken with any characters already married in a previous ball
  Object.entries(G.rels).forEach(([k, r]) => {
    if (r.married) k.split(':').forEach(id => taken.add(id));
  });

  // Find cross-gender pairs that have just hit 30
  const candidates = Object.entries(G.rels).filter(([k, r]) => {
    const [id1, id2] = k.split(':');
    const c1 = getC(id1), c2 = getC(id2);
    return c1 && c2 && relIsRomantic(c1, c2, r) && !r.married && r.score >= MAX_SCORE;
  });

  candidates.forEach(([k, r]) => {
    const [id1, id2] = k.split(':');
    if (taken.has(id1) || taken.has(id2)) return;
    const c1 = getC(id1), c2 = getC(id2);
    const lady = c1.gender === 'f' ? c1 : c2;
    const gent = c1.gender === 'm' ? c1 : c2;
    r.married = true;
    taken.add(id1); taken.add(id2);
    convertOtherRomancesToFriendships(k, [id1, id2]);
    if (r.claimed) {
      P.reputation++;
    } else if (r.rival === 'rival1') {
      P.rivals.rival1++;
    } else if (r.rival === 'rival2') {
      P.rivals.rival2++;
    }
    newMarriages.push({ k, lady, gent, claimed: r.claimed, rival: r.rival || null });
  });

  if (newMarriages.length) updHUD();
  return newMarriages;
}

// ═══════════════════════════════════════════════════════════
//  SEASON END & MARRIAGES
// ═══════════════════════════════════════════════════════════
function endSeason() {
  G.phase = 'end';
  addLog('🍂 The Season draws to a close…', 'imp');

  // Collect all marriages from the season — all already processed by processMidSeasonMarriages
  G.marriages = Object.entries(G.rels)
    .filter(([, r]) => r.married)
    .map(([k, r]) => {
      const [id1, id2] = k.split(':');
      const c1 = getC(id1), c2 = getC(id2);
      if (!c1 || !c2) return null;
      return { k, lady: c1.gender === 'f' ? c1 : c2, gent: c1.gender === 'm' ? c1 : c2, claimed: r.claimed, rival: r.rival || null };
    })
    .filter(Boolean);

  // Log marriages from the final ball (scoring already handled by processMidSeasonMarriages)
  (G.newMarriages || []).forEach(m => {
    addLog(`💍 ${m.lady.fullName} & ${m.gent.fullName} are engaged!`, 'mar');
    if (m.claimed)           addLog(`  ⭐ Your introduction — +1 point!`, 'imp');
    else if (m.rival === 'rival1') addLog(`  ⚔️ Lady Pendleton's introduction — she claims the credit.`, 'rival1');
    else if (m.rival === 'rival2') addLog(`  ⚔️ Mrs. Hartwick's introduction — she claims the credit.`, 'rival2');
  });

  if (!G.marriages.length) addLog('No engagements this Season. Society is disappointed.', 'hint');
  updHUD();
  setTimeout(showEndOverlay, 1400);
}

function showEndOverlay() {
  const ms      = G.marriages;
  const claimed = ms.filter(m => m.claimed);

  const marriageRows = !ms.length
    ? `<p>The Season passed without a single engagement. Perhaps the next Season will prove more fruitful.</p>`
    : `<p>${ms.length} engagement${ms.length > 1 ? 's' : ''} announced this Season:</p>` +
      ms.map(m => {
        const tag = m.claimed            ? ' <span class="star">⭐</span>'
          : m.rival === 'rival1'         ? ' <span class="rival1-tag">⚔️ Lady P.</span>'
          : m.rival === 'rival2'         ? ' <span class="rival2-tag">⚔️ Mrs. H.</span>'
          : '';
        return nlCoupleBlock(m.lady, m.gent,
          `<p class="mar-line">💍 ${m.lady.firstName} ${m.lady.lastName} &amp; ${m.gent.firstName} ${m.gent.lastName}${tag}</p>`);
      }).join('');

  document.getElementById('overlayCard').innerHTML = `
    <div class="nl-masthead">Regency Matchmaker</div>
    <div class="nl-ornament">— ✦ —</div>
    <div class="nl-issue">Season of ${seasonYear()} — Final Report</div>
    <div class="nl-body">
      ${marriageRows}
      ${claimed.length ? `<p class="sub">You gained ${claimed.length} Reputation this Season!</p>` : ''}
      <div class="standings">
        <div class="standings-title">Matchmaker Standings</div>
        <div class="standing-row you-row">⭐ You &nbsp;<span class="standing-score">${P.reputation}</span></div>
        <div class="standing-row rival1-row">⚔️ Lady Pendleton &nbsp;<span class="standing-score">${P.rivals.rival1}</span></div>
        <div class="standing-row rival2-row">⚔️ Mrs. Hartwick &nbsp;<span class="standing-score">${P.rivals.rival2}</span></div>
      </div>
    </div>
    <button class="nl-btn" onclick="newSeason()">Begin a New Season</button>
    <button class="nl-btn" style="margin-top:8px;background:linear-gradient(135deg,#8b4010,#5c2a08)" onclick="resetGame()">↺ New Game</button>`;
  document.getElementById('overlay').classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════
//  SVG GRAPH RENDERING
// ═══════════════════════════════════════════════════════════
const NR  = 34;
const BR  = 8;
const BSP = BR * 2 + 3;  // badge spacing = 19

function renderGraph() {
  const svg      = document.getElementById('graph');
  const { W, H } = graphSize();

  // Preserve zoom/pan state across re-renders
  if (zoomBehavior) savedTransform = d3.zoomTransform(svg);

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = '';

  // ── Arrowhead markers + portrait clip path ──
  const defs = svgE('defs');
  // Single shared clip path — works correctly because node groups use transform="translate()"
  const cp = svgE('clipPath');
  cp.setAttribute('id', 'node-clip');
  const cpc = svgE('circle');
  cpc.setAttribute('cx', '0'); cpc.setAttribute('cy', '0'); cpc.setAttribute('r', NR);
  cp.appendChild(cpc); defs.appendChild(cp);
  svg.appendChild(defs);

  // ── Dark vignette over the background image ──
  const dimRect = svgE('rect');
  dimRect.setAttribute('x', 0);   dimRect.setAttribute('y', 0);
  dimRect.setAttribute('width', W); dimRect.setAttribute('height', H);
  dimRect.setAttribute('fill', 'rgba(5,2,0,0.74)');
  svg.appendChild(dimRect);

  // ── Zoom/pan layer — all content lives here ──
  const layer = svgE('g');
  layer.setAttribute('id', 'zoom-layer');
  svg.appendChild(layer);

  // ── Relationship edge groups (rendered behind nodes) ──
  edgeEls = new Map();
  Object.entries(G.rels).forEach(([k, r]) => {
    const [id1, id2] = k.split(':');
    const n1 = simNodeMap.get(id1);
    const n2 = simNodeMap.get(id2);
    if (!n1 || !n2) return;
    const c1 = getC(id1), c2 = getC(id2);

    const { sx, sy, ex, ey } = edgeEndpoints(n1.x, n1.y, n2.x, n2.y);
    const alpha  = Math.min(1, r.score / 7);
    const cl     = r.claimed;
    const rv     = r.rival;
    const sw     = 0.8 + r.score * 0.2;
    let stroke, dashArray = null;
    if (cl) {
      stroke = `rgba(196,112,144,${.38 + alpha * .52})`;
    } else if (rv === 'rival1') {
      stroke = `rgba(60,160,140,${.38 + alpha * .52})`;
    } else if (rv === 'rival2') {
      stroke = `rgba(210,110,40,${.38 + alpha * .52})`;
    } else {
      stroke    = `rgba(196,154,46,${.18 + alpha * .42})`;
      dashArray = '4 3';
    }

    const eg = svgE('g');
    eg.setAttribute('data-edge', k);

    // Wide invisible line for hover hit-area (makes thin edges easy to hover)
    const hit = svgE('line');
    hit.setAttribute('x1', sx); hit.setAttribute('y1', sy);
    hit.setAttribute('x2', ex); hit.setAttribute('y2', ey);
    hit.setAttribute('stroke', '#fff');
    hit.setAttribute('stroke-width', '16');
    hit.setAttribute('stroke-opacity', '0');
    hit.setAttribute('pointer-events', 'stroke');
    eg.appendChild(hit);

    const ln = svgE('line');
    ln.setAttribute('x1', sx); ln.setAttribute('y1', sy);
    ln.setAttribute('x2', ex); ln.setAttribute('y2', ey);
    ln.setAttribute('stroke', stroke); ln.setAttribute('stroke-width', sw);
    if (dashArray) ln.setAttribute('stroke-dasharray', dashArray);
    eg.appendChild(ln);

    const sl = svgE('text');
    sl.setAttribute('text-anchor', 'middle');
    sl.setAttribute('fill', 'rgba(255,255,255,.9)');
    sl.setAttribute('stroke', 'rgba(0,0,0,.7)');
    sl.setAttribute('stroke-width', '2.5');
    sl.setAttribute('paint-order', 'stroke');
    const mx = (sx + ex) / 2;
    sl.setAttribute('x', mx);
    sl.setAttribute('y', (sy + ey) / 2 - 7);
    sl.setAttribute('font-size', '14'); sl.setAttribute('font-family', 'Cormorant Garamond,serif');
    sl.setAttribute('font-style', 'italic'); sl.setAttribute('font-weight', '600');
    if (r.married) {
      sl.textContent = 'Engaged 💍';
    } else {
      // Line 1: relationship label word
      const labelSpan = svgE('tspan');
      labelSpan.setAttribute('x', mx);
      labelSpan.setAttribute('data-line', '1');
      labelSpan.textContent = relLabel(c1, c2, r.score, r);
      sl.appendChild(labelSpan);

      // Line 2: score, and drift in brackets (suppressed for relationships created this ball)
      const scoreLine = svgE('tspan');
      scoreLine.setAttribute('x', mx);
      scoreLine.setAttribute('dy', '14');
      scoreLine.setAttribute('data-line', '2');
      scoreLine.setAttribute('font-size', '12');
      scoreLine.textContent = String(Math.round(r.score));
      sl.appendChild(scoreLine);

      const isNewThisBall = G.introThisBall.includes(k);
      if (!isNewThisBall) {
        const drift       = calcDrift(c1, c2, r);
        const actualDelta = Math.min(MAX_SCORE, Math.max(0, r.score + drift)) - r.score;
        if (actualDelta !== 0) {
          const driftSpan = svgE('tspan');
          driftSpan.textContent = ` (${actualDelta > 0 ? '+' : ''}${actualDelta})`;
          scoreLine.appendChild(driftSpan);
        }
      }
    }
    eg.appendChild(sl);

    layer.appendChild(eg);
    edgeEls.set(k, eg);
  });

  // ── Character nodes ──
  nodeEls = new Map();
  G.chars.forEach(c => {
    const sn = simNodeMap.get(c.id);
    const x  = sn ? sn.x : W / 2;
    const y  = sn ? sn.y : H / 2;
    const g  = renderNode(c);
    g.setAttribute('transform', `translate(${x},${y})`);
    layer.appendChild(g);
    nodeEls.set(c.id, g);
  });

  // Re-attach D3 drag and zoom to the freshly rebuilt SVG
  setupDrag();
  setupZoom(svg);
}

function highlightByEmoji(srcCharId, attrType, attrId) {
  const hl = [];
  G.chars.forEach(c2 => {
    if (c2.id === srcCharId) return;
    if (attrType === 'phys') {
      if (c2.physAttr.id === attrId)                       hl.push({ charId: c2.id, key: 'phys' });
      if (c2.rv.ap  && c2.attrPhys.id === attrId)         hl.push({ charId: c2.id, key: 'ap'   });
    } else if (attrType === 'pers') {
      if (c2.rv.pers && c2.personality.id === attrId)      hl.push({ charId: c2.id, key: 'pers' });
      if (c2.rv.apr  && c2.attrPers.id  === attrId)       hl.push({ charId: c2.id, key: 'apr'  });
    } else if (attrType === 'ap') {
      if (c2.rv.ap  && c2.attrPhys.id === attrId)         hl.push({ charId: c2.id, key: 'ap'   });
      if (c2.physAttr.id === attrId)                       hl.push({ charId: c2.id, key: 'phys' });
    } else if (attrType === 'apr') {
      if (c2.rv.apr  && c2.attrPers.id  === attrId)       hl.push({ charId: c2.id, key: 'apr'  });
      if (c2.rv.pers && c2.personality.id === attrId)      hl.push({ charId: c2.id, key: 'pers' });
    } else if (attrType === 'interest') {
      const idx = c2.interests.findIndex(i => i.id === attrId);
      const ikeys = ['i0', 'i1', 'i2'];
      if (idx >= 0 && c2.rv[ikeys[idx]])                   hl.push({ charId: c2.id, key: ikeys[idx] });
    } else if (attrType === 'wealth') {
      if (c2.wealth === attrId)                            hl.push({ charId: c2.id, key: 'wlth' });
    }
  });
  return hl;
}

// Renders a node centred at (0,0) — positioned via the group's transform
function renderNode(c) {
  const isSel    = G.sel === c.id;
  const selChar  = G.sel ? getC(G.sel) : null;
  const isTarget = (G.mode === 'introduce' && G.sel && G.sel !== c.id) ||
                   ((G.mode === 'dance' || G.mode === 'converse') && G.sel && G.sel !== c.id &&
                    selChar && c.gender !== selChar.gender && !!G.rels[rkey(c.id, G.sel)]) ||
                   (G.mode === 'rumour' && G.sel && G.sel !== c.id && !!G.rels[rkey(c.id, G.sel)]);
  const isF      = c.gender === 'f';

  const g = svgE('g');
  g.setAttribute('class', 'char-node');
  g.setAttribute('data-id', c.id);

  // Helper: wire emoji element to trigger cross-character highlight on click
  const addClick = (el, attrType, attrId, selfKey) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', e => {
      e.stopPropagation();
      const hl = highlightByEmoji(c.id, attrType, attrId);
      hl.push({ charId: c.id, key: selfKey });
      setHighlights(hl);
    });
  };

  // Reveal highlight glow
  const hl     = (G.highlights || []).filter(h => h.charId === c.id);
  const hlKeys = new Set(hl.map(h => h.key));
  if (hl.length > 0) {
    const gr = svgE('circle');
    gr.setAttribute('cx', 0); gr.setAttribute('cy', 0); gr.setAttribute('r', NR + 9);
    gr.setAttribute('fill', 'rgba(230,195,60,0.15)');
    gr.setAttribute('stroke', 'rgba(230,195,60,0.8)');
    gr.setAttribute('stroke-width', '3');
    gr.setAttribute('class', 'reveal-glow');
    g.appendChild(gr);
  }

  // Selection pulse ring
  if (isSel) {
    const gl = svgE('circle');
    gl.setAttribute('class', 'sel-ring');
    gl.setAttribute('cx', 0); gl.setAttribute('cy', 0); gl.setAttribute('r', NR + 10);
    gl.setAttribute('fill', 'none'); gl.setAttribute('stroke', '#c49a2e');
    gl.setAttribute('stroke-width', '2'); gl.setAttribute('opacity', '.6');
    const an = svgE('animate');
    an.setAttribute('attributeName', 'opacity'); an.setAttribute('values', '.25;.72;.25');
    an.setAttribute('dur', '1.8s'); an.setAttribute('repeatCount', 'indefinite');
    gl.appendChild(an); g.appendChild(gl);
  }

  // Introduce target highlight
  if (isTarget) {
    const hl = svgE('circle');
    hl.setAttribute('cx', 0); hl.setAttribute('cy', 0); hl.setAttribute('r', NR + 8);
    hl.setAttribute('fill', 'none'); hl.setAttribute('stroke', '#7aad66');
    hl.setAttribute('stroke-width', '2'); hl.setAttribute('opacity', '.55');
    g.appendChild(hl);
  }

  // Main circle
  const mc = svgE('circle');
  mc.setAttribute('cx', 0); mc.setAttribute('cy', 0); mc.setAttribute('r', NR);
  mc.setAttribute('fill', isF ? 'rgba(100,38,58,.88)' : 'rgba(18,42,76,.88)');
  mc.setAttribute('stroke', isF ? 'rgba(196,112,144,.82)' : 'rgba(90,130,180,.82)');
  mc.setAttribute('stroke-width', isSel ? '2.5' : '1.5');
  g.appendChild(mc);

  // Portrait image clipped to circle
  const img = svgE('image');
  img.setAttribute('href', portraitSrc(c));
  img.setAttribute('x', -NR); img.setAttribute('y', -NR);
  img.setAttribute('width', NR * 2); img.setAttribute('height', NR * 2);
  img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  img.setAttribute('clip-path', 'url(#node-clip)');
  img.addEventListener('error', () => {
    img.remove();
    const init = svgE('text');
    init.setAttribute('x', 0); init.setAttribute('y', 7);
    init.setAttribute('text-anchor', 'middle');
    init.setAttribute('fill', 'rgba(245,234,214,.55)');
    init.setAttribute('font-size', '24');
    init.setAttribute('font-family', 'Cormorant Garamond, serif');
    init.textContent = c.firstName[0];
    g.appendChild(init);
  });
  g.appendChild(img);

  // Attribute grid: 2 columns × 3 rows beside the node
  // inner col = closer to node, outer col = further from node
  const SIDE_GAP = NR + 10;
  const ATTR_SP  = 17;
  // xL = left column of the attribute grid, xR = right column — same visual order for both sides
  const xL = isF ? -(SIDE_GAP + ATTR_SP) : SIDE_GAP;
  const xR = isF ? -SIDE_GAP             : SIDE_GAP + ATTR_SP;
  const ROW_TOP = -17;
  const ROW_MID = 0;
  const ROW_BOT = 17;

  // Helper: badge circle + text, matching interest badge style
  const addBadge = (cx, cy, revealed, content, tipText, attrType, attrId, hlKey, revealedFontSize = 10) => {
    if (hlKeys.has(hlKey)) makeGlow(g, cx, cy, BR + 5);
    const bc = svgE('circle');
    bc.setAttribute('cx', cx); bc.setAttribute('cy', cy); bc.setAttribute('r', BR);
    bc.setAttribute('fill',   revealed ? 'rgba(196,154,46,.2)'  : 'rgba(18,12,4,.75)');
    bc.setAttribute('stroke', revealed ? 'rgba(196,154,46,.65)' : 'rgba(196,154,46,.2)');
    bc.setAttribute('stroke-width', '1');
    addTip(bc, tipText);
    if (revealed && attrType) addClick(bc, attrType, attrId, hlKey);
    g.appendChild(bc);
    const bt = svgE('text');
    bt.setAttribute('x', cx); bt.setAttribute('y', cy + 4);
    bt.setAttribute('text-anchor', 'middle');
    bt.setAttribute('font-size', revealed ? String(revealedFontSize) : '13');
    if (revealed)  { bt.setAttribute('fill', 'rgba(245,234,214,.9)'); }
    if (!revealed) { bt.setAttribute('fill', 'rgba(196,154,46,.5)'); bt.setAttribute('font-weight', 'bold'); }
    bt.textContent = revealed ? content : '?';
    addTip(bt, tipText);
    if (revealed && attrType) addClick(bt, attrType, attrId, hlKey);
    g.appendChild(bt);
  };

  // Row top: wealth (left) | season count (right)
  const wealthSize = [10, 14, 18][c.wealth - 1] || 14;
  const wa = svgE('text');
  wa.setAttribute('x', xL); wa.setAttribute('y', ROW_TOP + 4);
  wa.setAttribute('text-anchor', 'middle'); wa.setAttribute('font-size', wealthSize);
  wa.textContent = '💰';
  addTip(wa, `Wealth: ${wealthDesc(c.wealth)}`);
  addClick(wa, 'wealth', c.wealth, 'wlth');
  if (hlKeys.has('wlth')) makeGlow(g, xL, ROW_TOP, BR + 5);
  g.appendChild(wa);

  if (c.seasons > 1) {
    addBadge(xR, ROW_TOP, true, String(c.seasons), `Seasons at court: ${c.seasons}`, null, null, 'seasons', 16);
  }

  // Row mid: appearance (left) | personality (right)
  addBadge(xL, ROW_MID, true, c.physAttr.e, `Appearance: ${c.physAttr.l}`, 'phys', c.physAttr.id, 'phys');

  addBadge(xR, ROW_MID, c.rv.pers, c.personality.e,
    c.rv.pers ? `Personality: ${c.personality.l}` : 'Personality: Unknown',
    c.rv.pers ? 'pers' : null, c.personality.id, 'pers');

  // Row bot: drawn-to-looks (left) | drawn-to-nature (right)
  addBadge(xL, ROW_BOT, c.rv.ap, c.attrPhys.e,
    c.rv.ap ? `Drawn to (looks): ${c.attrPhys.l}` : 'Drawn to (looks): Unknown',
    c.rv.ap ? 'ap' : null, c.attrPhys.id, 'ap');

  addBadge(xR, ROW_BOT, c.rv.apr, c.attrPers.e,
    c.rv.apr ? `Drawn to (nature): ${c.attrPers.l}` : 'Drawn to (nature): Unknown',
    c.rv.apr ? 'apr' : null, c.attrPers.id, 'apr');

  // Name label — bold, overlapping the bottom of the circle
  const nl = svgE('text');
  nl.setAttribute('x', 0); nl.setAttribute('y', NR + 5);
  nl.setAttribute('text-anchor', 'middle');
  nl.setAttribute('fill', 'rgba(245,234,214,.97)');
  nl.setAttribute('stroke', 'rgba(5,2,0,.92)');
  nl.setAttribute('stroke-width', '2.5');
  nl.setAttribute('paint-order', 'stroke');
  nl.setAttribute('font-size', '14'); nl.setAttribute('font-family', 'Cormorant Garamond,serif');
  nl.setAttribute('font-weight', '600');
  nl.textContent = c.shortDisplay;
  g.appendChild(nl);

  // ── 3 interest badges ──
  const badges = [
    { key: 'i0', lbl: 'Interest', rv: c.rv.i0, e: c.interests[0].e, dl: c.interests[0].l },
    { key: 'i1', lbl: 'Interest', rv: c.rv.i1, e: c.interests[1].e, dl: c.interests[1].l },
    { key: 'i2', lbl: 'Interest', rv: c.rv.i2, e: c.interests[2].e, dl: c.interests[2].l },
  ];

  const bsx = -((badges.length - 1) * BSP) / 2;  // centre the row
  const bY1 = NR + 25;

  badges.forEach((b, i) => {
    const bx = bsx + i * BSP;
    const by = bY1;

    if (hlKeys.has(b.key)) makeGlow(g, bx, by, BR + 5);
    const bc = svgE('circle');
    bc.setAttribute('cx', bx); bc.setAttribute('cy', by); bc.setAttribute('r', BR);
    bc.setAttribute('fill',   b.rv ? 'rgba(196,154,46,.2)'  : 'rgba(18,12,4,.75)');
    bc.setAttribute('stroke', b.rv ? 'rgba(196,154,46,.65)' : 'rgba(196,154,46,.2)');
    bc.setAttribute('stroke-width', '1');
    g.appendChild(bc);

    const bt = svgE('text');
    bt.setAttribute('x', bx); bt.setAttribute('y', by + 4);
    bt.setAttribute('text-anchor', 'middle'); bt.setAttribute('font-size', b.rv ? '10' : '13');
    bt.setAttribute('fill', b.rv ? '' : 'rgba(196,154,46,.5)');
    if (!b.rv) bt.setAttribute('font-weight', 'bold');
    bt.textContent = b.rv ? b.e : '?';
    g.appendChild(bt);

    if (b.rv) addClick(bt, 'interest', c.interests[i].id, b.key);
    const tipText = b.rv ? `${b.lbl}: ${b.dl}` : `${b.lbl}: Unknown`;
    addTip(bc, tipText);
    addTip(bt, tipText);
  });

  // Click: select / confirm introduce (guard against drag)
  g.addEventListener('click', e => {
    e.stopPropagation();
    const sn = simNodeMap.get(c.id);
    if (sn && sn._dragging) return;
    onNodeClick(c.id);
  });

  g.addEventListener('mouseenter', ev => {
    const sel = G.sel;
    if (G.mode === 'introduce' && sel && sel !== c.id) {
      showTip(ev, `Click to introduce to ${getC(sel).shortDisplay}`);
    } else if ((G.mode === 'dance' || G.mode === 'converse') && sel && sel !== c.id) {
      const sc = getC(sel);
      if (sc && c.gender !== sc.gender && G.rels[rkey(c.id, sel)]) {
        const verb = G.mode === 'dance' ? 'dance with' : 'converse with';
        showTip(ev, `Click to encourage to ${verb} ${sc.shortDisplay}`);
      } else {
        showTip(ev, c.fullName);
      }
    } else if (G.mode === 'rumour' && sel && sel !== c.id) {
      if (G.rels[rkey(c.id, sel)]) {
        showTip(ev, `Spread rumours about ${c.fullName} to ${getC(sel).shortDisplay}`);
      } else {
        showTip(ev, c.fullName);
      }
    } else {
      showTip(ev, c.fullName);
    }
  });
  g.addEventListener('mouseleave', hideTip);

  return g;
}

function showRelBoost(id1, id2, delta) {
  const layer = document.getElementById('zoom-layer');
  if (!layer) return;
  const n1 = simNodeMap.get(id1);
  const n2 = simNodeMap.get(id2);
  if (!n1 || !n2) return;

  const t = svgE('text');
  t.setAttribute('x', (n1.x + n2.x) / 2);
  t.setAttribute('y', (n1.y + n2.y) / 2 - 20);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('font-size', '15');
  t.setAttribute('font-family', 'Cormorant Garamond, serif');
  t.setAttribute('font-weight', '700');
  t.setAttribute('fill', delta >= 0 ? '#e8c870' : '#c47090');
  t.setAttribute('stroke', 'rgba(0,0,0,.75)');
  t.setAttribute('stroke-width', '2.5');
  t.setAttribute('paint-order', 'stroke');
  t.setAttribute('pointer-events', 'none');
  t.setAttribute('class', 'rel-boost-pop');
  t.textContent = delta > 0 ? `+${delta}` : String(delta);
  t.addEventListener('animationend', () => t.remove());
  layer.appendChild(t);
}

function addTip(el, text) {
  el.addEventListener('mouseenter', ev => { showTip(ev, text); ev.stopPropagation(); });
  el.addEventListener('mouseleave', hideTip);
}

// ═══════════════════════════════════════════════════════════
//  UI & INTERACTION
// ═══════════════════════════════════════════════════════════
function onNodeClick(id) {
  if (G.phase !== 'playing') return;
  if (G.mode === 'introduce' && G.sel && G.sel !== id) {
    doIntroduce(G.sel, id);
    return;
  }
  if (G.mode === 'dance' && G.sel && G.sel !== id) {
    doDance(G.sel, id);
    return;
  }
  if (G.mode === 'converse' && G.sel && G.sel !== id) {
    doConverse(G.sel, id);
    return;
  }
  if (G.mode === 'rumour' && G.sel && G.sel !== id) {
    doRumour(G.sel, id);
    return;
  }
  // Toggle: clicking the already-selected node closes the popup
  if (G.sel === id) { hidePopup(); return; }
  showPopup(id);
}

function clearSel() {
  G.sel = null;
  G.mode = null;
  document.getElementById('char-popup').classList.add('hidden');
  document.getElementById('intro-hint').classList.add('hidden');
}

function startMode(id, mode, hintText) {
  document.getElementById('char-popup').classList.add('hidden');
  G.sel = id; G.mode = mode;
  const hint = document.getElementById('intro-hint');
  hint.innerHTML = `${hintText} — <button class="hint-cancel" onclick="cancelMode()">Cancel</button>`;
  hint.classList.remove('hidden');
  renderGraph();
}

function startIntro(id)    { startMode(id, 'introduce', `🤝 Click another character to introduce them`); }
function startDance(id)    { startMode(id, 'dance',     `💃 Click a dance partner for ${getC(id).shortDisplay}`); }
function startConverse(id) { startMode(id, 'converse',  `💬 Click a conversation partner for ${getC(id).shortDisplay}`); }
function startRumour(id)   { startMode(id, 'rumour',    `🗣️ Click a character to whisper about — ${getC(id).shortDisplay} will be your audience`); }

function doRumour(id1, id2) {
  if (!canAct()) return;
  if (G.actedThisBall.has(actKey('rumour', id1))) {
    addLog(`${getC(id1).shortDisplay} has already heard your whispers this evening.`);
    return;
  }
  const c1 = getC(id1), c2 = getC(id2);
  const k = rkey(id1, id2);
  if (!G.rels[k]) {
    addLog(`${c1.shortDisplay} and ${c2.shortDisplay} are not acquainted.`);
    return;
  }

  const reduction = 5 + Math.floor(Math.random() * 6); // 5–10
  G.rels[k].score = Math.max(0, G.rels[k].score - reduction);

  const msgs = [
    `You confide certain misgivings about ${c2.shortDisplay} to ${c1.shortDisplay}.`,
    `A few carefully chosen words to ${c1.shortDisplay} cast ${c2.shortDisplay} in a most unflattering light.`,
    `${c1.shortDisplay} listens with evident interest as you share your concerns regarding ${c2.shortDisplay}.`,
    `You whisper your doubts about ${c2.shortDisplay} into ${c1.shortDisplay}'s ear — and find a willing audience.`,
  ];
  addLog(r1(msgs));

  // Escalating risk: 20% per rumour spread this season, halved if the listener loves gossip
  const lovesGossip = c1.interests.some(i => i.id === 'gossip');
  const rawRumourPenalty = (G.rumourCount + 1) * 0.20;
  G.rumourCount++;
  if (Math.random() < (lovesGossip ? rawRumourPenalty / 2 : rawRumourPenalty)) applyReputationPenalty();

  G.actedThisBall.add(actKey('rumour', id1));
  spend(); clearSel(); render();
  showRelBoost(id1, id2, -reduction);
}

function applyReputationPenalty() {
  const reduction = (G.scandalCount + 1) * 2;
  G.scandalCount++;
  P.reputation = Math.max(0, P.reputation - 1);
  updHUD();
  const warnings = [
    `Your fondness for whispers has not gone unnoticed. Your Reputation suffers (−1) and society grows cool — all your claimed introductions lose ${reduction}.`,
    `Word of your meddling reaches unfriendly ears. Your Reputation is damaged (−1) and your claimed pairs grow distant — each loses ${reduction}.`,
    `Society has taken note of your scheming. Your Reputation falls (−1) and your introductions suffer — all claimed pairs cool by ${reduction}.`,
    `A sharp-eyed matron has noticed your whispering. Your Reputation is tarnished (−1) and your introductions each cool by ${reduction}.`,
  ];
  addLog(`⚠️ ${r1(warnings)}`, 'imp');
  G.claimed.forEach(k => {
    if (!G.rels[k]) return;
    G.rels[k].score = Math.max(0, G.rels[k].score - reduction);
    const [id1, id2] = k.split(':');
    showRelBoost(id1, id2, -reduction);
  });
}

function cancelMode() {
  const id = G.sel;
  G.mode = null;
  document.getElementById('intro-hint').classList.add('hidden');
  if (id) { renderGraph(); showPopup(id); } else { hidePopup(); }
}

// ── Character popup ──
function nodeScreenPos(id) {
  const sn = simNodeMap.get(id);
  if (!sn) return null;
  const t = d3.zoomTransform(document.getElementById('graph'));
  return { x: sn.x * t.k + t.x, y: sn.y * t.k + t.y };
}

function toggleHudHelp(event) {
  event.stopPropagation();
  const el = document.getElementById('hud-help');
  if (!el.classList.contains('hidden')) { el.classList.add('hidden'); return; }
  el.innerHTML = `
    <button class="panel-close" onclick="document.getElementById('hud-help').classList.add('hidden');event.stopPropagation()">✕</button>
    <h3>How to Play</h3>
    <p>You are a matchmaker with <strong>Actions</strong> to spend each ball. Use them to learn about characters and bring suitable partners together.</p>
    <p>When a couple you introduced marries, you gain +1 Reputation. Rivals Lady Pendleton and Mrs. Hartwick will also be making introductions — credit goes to whoever introduced the pair first. Causing scandals will cost you −1 Reputation each time.</p>
    <p><strong>Stats</strong><br>
    <em>Actions</em> — how many actions remain this ball (7 per ball).</p>
    <p><strong>Characters</strong><br>
    Click any character to open their action menu. Each action can only be performed once per character per ball. Click the <strong>?</strong> beside any action for a full explanation of what it does.</p>
    <p><strong>Between Balls</strong><br>
    Relationships drift naturally — compatible pairs grow closer, others may cool. Pairs with a very strong attachment may even marry mid-season.</p>`;
  el.classList.remove('hidden');
}

function showActionHelp(btn, event) {
  event.stopPropagation();
  const key  = btn.dataset.key;
  const note = btn.dataset.note || '';
  const h = ACTION_HELP[key];
  const el = document.getElementById('action-help');
  let html = `<button class="panel-close" onclick="document.getElementById('action-help').classList.add('hidden');event.stopPropagation()">✕</button><span class="ah-title">${h.title}</span><p>${h.body}</p>`;
  if (h.limit) html += `<p style="color:rgba(196,154,46,.55);font-style:italic">${h.limit}</p>`;
  if (note)    html += `<p class="ah-note">${note}</p>`;
  el.innerHTML = html;
  el.classList.remove('hidden');
  const rect = event.target.getBoundingClientRect();
  const ew = 210;
  let x = rect.left - ew - 6;
  let y = rect.top;
  if (x < 8) x = rect.right + 6;
  const elH = el.offsetHeight || 140;
  if (y + elH > window.innerHeight - 8) y = window.innerHeight - elH - 8;
  if (y < 8) y = 8;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
}

function showPopup(id) {
  if (highlightTimer) { clearTimeout(highlightTimer); highlightTimer = null; }
  G.highlights = [];
  G.sel = id;
  const c         = getC(id);
  const cs        = canAct();
  const acted     = key => G.actedThisBall.has(actKey(key, id));
  const note      = (key, label) => !cs ? 'No actions remaining this ball.' : acted(key) ? `${c.shortDisplay} has already ${label} this ball.` : '';
  const knownInts = [[0,'i0'],[1,'i1'],[2,'i2']].filter(([, k]) => c.rv[k]);
  const charConns        = conns(id);
  const crossGenderIntros = charConns.filter(({ c: ch }) => ch.gender !== c.gender);
  const seekFriends       = charConns.filter(({ c: oc, r }) => !relIsRomantic(c, oc, r) && r.score >= 10);

  const ar = (btn, key, n = '') =>
    `<div class="action-row">${btn}<button class="help-icon" data-key="${key}" data-note="${n.replace(/"/g, '&quot;')}" onclick="showActionHelp(this,event)" tabindex="-1">?</button></div>`;

  let h = `<button class="panel-close" onclick="hidePopup()">✕</button><div class="popup-name">${c.fullName}</div>`;

  const chatUsed = acted('chat');
  h += ar(`<button class="abtn" onclick="doChat('${id}')" ${!cs || chatUsed ? 'disabled' : ''}>
    💬 Chat${chatUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
    'chat', note('chat', 'chatted'));

  const introUsed = acted('intro');
  h += ar(`<button class="abtn" onclick="startIntro('${id}')" ${!cs || introUsed ? 'disabled' : ''}>
    🤝 Introduce to…${introUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
    'intro', note('intro', 'made an introduction'));

  const gossipUsed = acted('gossip');
  h += ar(`<button class="abtn" onclick="doGossip('${id}')" ${!cs || gossipUsed ? 'disabled' : ''}>
    🤫 Gossip${gossipUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
    'gossip', note('gossip', 'shared gossip'));

  const discussUsed = acted('discuss');
  if (knownInts.length) {
    h += ar(`<button class="abtn" onclick="doDiscuss('${id}')" ${!cs || discussUsed ? 'disabled' : ''}>
      🔍 Discuss interests${discussUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
      'discuss', note('discuss', 'discussed their interests'));
  } else {
    h += ar(`<button class="abtn" disabled>🔍 Discuss interests</button>`,
      'discuss', 'None of this character\'s interests have been revealed yet. Use Chat or Gossip first.');
  }

  const enquireUsed = acted('enquire');
  if (charConns.length) {
    h += ar(`<button class="abtn" onclick="doEnquire('${id}')" ${!cs || enquireUsed ? 'disabled' : ''}>
      👥 Sound out their circle${enquireUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
      'enquire', note('enquire', 'spoken of their circle'));
  } else {
    h += ar(`<button class="abtn" disabled>👥 Sound out their circle</button>`,
      'enquire', 'This character has no relationships yet — there is no one to enquire about.');
  }

  const seekUsed = acted('seek');
  if (seekFriends.length) {
    h += ar(`<button class="abtn" onclick="doSeek('${id}')" ${!cs || seekUsed ? 'disabled' : ''}>
      🤫 Seek a confidence${seekUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
      'seek', note('seek', 'confided'));
  } else {
    h += ar(`<button class="abtn" disabled>🤫 Seek a confidence</button>`,
      'seek', 'Requires a friendship of strength 10 or greater.');
  }

  const danceUsed = acted('dance');
  const converseUsed = acted('converse');
  if (crossGenderIntros.length) {
    h += ar(`<button class="abtn" onclick="startDance('${id}')" ${!cs || danceUsed ? 'disabled' : ''}>
      💃 Encourage to dance…${danceUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
      'dance', note('dance', 'danced'));
    h += ar(`<button class="abtn" onclick="startConverse('${id}')" ${!cs || converseUsed ? 'disabled' : ''}>
      💬 Encourage to converse…${converseUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
      'converse', note('converse', 'conversed'));
  } else {
    h += ar(`<button class="abtn" disabled>💃 Encourage to dance…</button>`,
      'dance', 'No introductions between ladies and gentlemen have been made yet.');
    h += ar(`<button class="abtn" disabled>💬 Encourage to converse…</button>`,
      'converse', 'No introductions between ladies and gentlemen have been made yet.');
  }

  const rumourUsed = acted('rumour');
  if (charConns.length) {
    h += ar(`<button class="abtn" onclick="startRumour('${id}')" ${!cs || rumourUsed ? 'disabled' : ''}>
      🗣️ Spread a rumour…${rumourUsed ? ' <small style="opacity:.45">(done this ball)</small>' : ''}</button>`,
      'rumour', note('rumour', 'spread a rumour'));
  } else {
    h += ar(`<button class="abtn" disabled>🗣️ Spread a rumour…</button>`,
      'rumour', 'This character has no acquaintances to spread rumours about.');
  }

  const popup = document.getElementById('char-popup');
  popup.innerHTML = h;
  popup.classList.remove('hidden');

  // Position near node, keeping within viewport
  const pos = nodeScreenPos(id);
  if (pos) {
    const pw = 252, ph = popup.offsetHeight;
    let x = pos.x + 54, y = pos.y - 60;
    if (x + pw > window.innerWidth  - 14) x = pos.x - pw - 54;
    if (y < 14)                           y = 14;
    if (y + ph > window.innerHeight - 14) y = window.innerHeight - ph - 14;
    popup.style.left = x + 'px';
    popup.style.top  = y + 'px';
  }

  // Update selection ring without full SVG rebuild
  document.querySelectorAll('.sel-ring').forEach(el => el.remove());
  const selNodeEl = nodeEls.get(id);
  if (selNodeEl) {
    const gl = svgE('circle');
    gl.setAttribute('class', 'sel-ring');
    gl.setAttribute('cx', '0'); gl.setAttribute('cy', '0'); gl.setAttribute('r', String(NR + 10));
    gl.setAttribute('fill', 'none'); gl.setAttribute('stroke', '#c49a2e');
    gl.setAttribute('stroke-width', '2'); gl.setAttribute('opacity', '.6');
    const an = svgE('animate');
    an.setAttribute('attributeName', 'opacity'); an.setAttribute('values', '.25;.72;.25');
    an.setAttribute('dur', '1.8s'); an.setAttribute('repeatCount', 'indefinite');
    gl.appendChild(an);
    selNodeEl.insertBefore(gl, selNodeEl.firstChild);
  }
}

function hidePopup() {
  G.sel = null; G.mode = null;
  document.getElementById('char-popup').classList.add('hidden');
  document.getElementById('action-help').classList.add('hidden');
  document.getElementById('intro-hint').classList.add('hidden');
  document.querySelectorAll('.sel-ring').forEach(el => el.remove());
}


function render() { renderGraph(); updHUD(); }

function updHUD() {
  document.getElementById('sSeason').textContent    = seasonYear();
  document.getElementById('sBall').textContent      = G.ball;
  document.getElementById('sBallName').textContent  = currentBallName();
  document.getElementById('sActions').textContent   = G.actions;
  document.getElementById('sScore').textContent   = P.reputation;
  document.getElementById('sRival1').textContent  = P.rivals.rival1;
  document.getElementById('sRival2').textContent  = P.rivals.rival2;
  const nbb = document.getElementById('nbb');
  nbb.classList.toggle('ready', G.actions === 0);
  nbb.title = G.actions > 0
    ? `You have ${G.actions} action${G.actions > 1 ? 's' : ''} remaining this ball.`
    : 'Proceed to the next ball.';
}

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
function showNotif(text, charId, type) {
  const container = document.getElementById('notif-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `notif${type ? ' notif-' + type : ''}`;

  if (charId) {
    const c = getC(charId);
    if (c) {
      const wrap = document.createElement('div');
      wrap.className = 'notif-portrait-wrap';

      const img = document.createElement('img');
      img.src = portraitSrc(c);
      img.className = 'notif-portrait';
      wrap.appendChild(img);

      const name = document.createElement('span');
      name.className = 'notif-portrait-name';
      name.textContent = c.shortDisplay;
      wrap.appendChild(name);

      div.appendChild(wrap);
    }
  }

  const span = document.createElement('span');
  span.className = 'notif-text';
  span.textContent = text;
  div.appendChild(span);

  container.insertBefore(div, container.firstChild);
  div.addEventListener('animationend', () => div.remove());
}

function addLog(msg, type = '', charId = null) {
  showNotif(msg, charId, type);
}

// ═══════════════════════════════════════════════════════════
//  TOOLTIP
// ═══════════════════════════════════════════════════════════
function showTip(ev, txt) {
  const t = document.getElementById('tip');
  t.classList.remove('hidden');
  t.textContent   = txt;
  t.style.left    = (ev.clientX + 14) + 'px';
  t.style.top     = (ev.clientY - 8)  + 'px';
}
function hideTip() { document.getElementById('tip').classList.add('hidden'); }

// ═══════════════════════════════════════════════════════════
//  OPENING NEWSLETTER
// ═══════════════════════════════════════════════════════════
function generateOpeningNewsletter() {
  const paras = [];
  const returning = [...(G.returningLadies || []), ...(G.returningGents || [])];
  const newcomers = [...(G.newLadies || []),       ...(G.newGents || [])];
  const isFirst   = G.season === 1;

  paras.push(`<p class="nl-opener"><em>Gentle Reader,</em></p>`);

  if (isFirst) {
    paras.push(`<p>Your correspondent is delighted to announce the commencement of the Season — that most eagerly anticipated of social calendars. Over six forthcoming assemblies, the great work of matchmaking shall unfold: characters must be introduced, acquaintances cultivated, and compatible souls steered toward one another before the Season draws to its close.</p>`);
  } else {
    paras.push(`<p>A new Season is upon us, and society reassembles with fresh anticipation. Once again the great work of matchmaking must begin: introductions must be made, acquaintances cultivated, and compatible souls steered toward a happy understanding before the Season draws to its close.</p>`);

    if (returning.length > 0) {
      const names = returning.map(c => `<em>${c.shortDisplay}</em>`).join(', ');
      paras.push(`<p>Your correspondent notes with pleasure the return of ${names} — still unattached and, one trusts, amenable to a judicious introduction.</p>`);
    }

    if (newcomers.length > 0) {
      const names = newcomers.map(c => `<em>${c.shortDisplay}</em>`).join(', ');
      paras.push(`<p>Society is enlivened this Season by several new arrivals: ${names}. Your correspondent shall observe them with the keenest interest.</p>`);
    }
  }

  paras.push(`<p>Take heed of your rivals: <strong style="color:rgba(60,160,140,1)">Lady Pendleton</strong> and <strong style="color:rgba(210,130,60,1)">Mrs. Hartwick</strong> are matchmakers of considerable ambition, who shall make their own introductions throughout the season. Credit for a marriage belongs to whomever first effected the introduction — so act with both haste and discernment.</p>`);

  paras.push(`<p>Your correspondent wishes you every success in the most civilised of competitions, and shall observe your progress with the keenest interest throughout the season ahead. Should you require a reminder of the rules, the <strong style="color:var(--gold)">?</strong> button in the top corner of the scoreboard is always at your disposal.</p>`);
  paras.push(`<p class="nl-sig">Your most obedient servant,<br><em>A Lady of Quality</em></p>`);

  return paras.join('\n');
}

function showOpeningNewsletter() {
  document.getElementById('nl-issue').textContent = `Opening Edition  ·  ${seasonYear()}`;
  document.getElementById('nl-body').innerHTML = generateOpeningNewsletter();
  const btn = document.getElementById('nl-btn');
  btn.textContent = 'Begin the Season';
  btn.onclick = startPlaying;
  document.getElementById('newsletter-overlay').classList.remove('hidden');
}

function startPlaying() {
  document.getElementById('newsletter-overlay').classList.add('hidden');
  saveState();
}

// ═══════════════════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════════════════
const SAVE_KEY = 'regency-matchmaker-v1';

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  P.reputation = 10; P.rivals.rival1 = 10; P.rivals.rival2 = 10;
  G = null;
  newSeason();
}

function saveState() {
  if (!G || G.phase === 'end') return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      G: { ...G,
        claimed:      [...G.claimed],
        actedThisBall: [...G.actedThisBall],
        highlights:   [],
      },
      P: { ...P, rivals: { ...P.rivals } },
    }));
  } catch { /* quota exceeded — silently skip */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    G = saved.G;
    // Rebuild G.claimed from G.rels as the authoritative source, guarding against any desync
    G.claimed       = new Set(Object.entries(G.rels).filter(([, r]) => r.claimed).map(([k]) => k));
    G.actedThisBall = new Set(saved.G.actedThisBall);
    G.highlights    = [];
    G.gossipCount   = G.gossipCount  ?? 0;
    G.rumourCount   = G.rumourCount  ?? 0;
    G.scandalCount  = G.scandalCount ?? 0;
    Object.assign(P, saved.P);
    // Migrate saves that used the old 'score' key
    if (P.reputation === undefined) P.reputation = (saved.P.score ?? 0) + 10;
    Object.assign(P.rivals, saved.P.rivals);
    if (P.rivals.rival1 < 10) P.rivals.rival1 += 10;
    if (P.rivals.rival2 < 10) P.rivals.rival2 += 10;
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
window.addEventListener('resize', () => {
  if (!G) return;
  initSim();     // recompute forces for new dimensions
  renderGraph(); // rebuild SVG at new size
  fitToView();   // re-fit to new viewport size
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cancelMode();
});

document.addEventListener('DOMContentLoaded', () => {
  if (loadState()) {
    buildCharMap();
    setBackground();
    initSim();
    render();
    fitToView();
  } else {
    newSeason();
  }
});
document.addEventListener('click', e => {
  const ah = document.getElementById('action-help');
  if (ah && !ah.classList.contains('hidden') && !ah.contains(e.target) && !e.target.classList.contains('help-icon')) {
    ah.classList.add('hidden');
  }
  const hh = document.getElementById('hud-help');
  if (hh && !hh.classList.contains('hidden') && !hh.contains(e.target) && !e.target.classList.contains('hud-help-btn')) {
    hh.classList.add('hidden');
  }
  const popup = document.getElementById('char-popup');
  if (popup && !popup.classList.contains('hidden') && !popup.contains(e.target)) {
    hidePopup();
  }
});
