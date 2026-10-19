// ============================================================
//  CHAOS - The Game of Life  |  game.js  (v4 — animated board)
// ============================================================

let gameState = {
    players: [], currentPlayerIndex: 0, numPlayers: 0, winGoal: 100000,
    currentSetupPlayer: 0, phase: 'setup', boardMode: 'normal',
    waitingForMove: false, pendingSteps: 0, pendingPlayer: null, stealContext: null,
};

function charge(p, amt) { p.money = Math.max(0, p.money - amt); }
function fmt(n) { return '$' + Math.floor(n).toLocaleString(); }
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function renderAvatar(container, avatarStr, sizePx) {
    if (!container) return;
    if (!avatarStr) { container.textContent = '?'; return; }
    if (avatarStr.startsWith('<svg') || avatarStr.startsWith('<?xml')) {
        container.innerHTML = avatarStr;
        const svg = container.querySelector('svg');
        if (svg) { svg.setAttribute('width', sizePx); svg.setAttribute('height', Math.round(sizePx * 1.6)); svg.style.display = 'block'; svg.style.overflow = 'visible'; }
    } else { container.textContent = avatarStr; container.style.fontSize = sizePx * 0.7 + 'px'; }
}
function adjustHappiness(p, delta) { p.happiness = Math.max(0, Math.min(10, +(p.happiness + delta).toFixed(1))); }
function scaledFine(p, base) {
    const assets = p.money + HOUSING[p.housingLevel].price + CARS[p.carLevel].price;
    let m = 1;
    if (assets > 200000) m = 3; else if (assets > 100000) m = 2.5; else if (assets > 50000) m = 2; else if (assets > 20000) m = 1.5;
    return Math.round(base * m);
}


function getGridPosition(id) {
    if (id <= 9)   return { row:9, col:9-id };
    if (id <= 17)  return { row:18-id, col:0 };
    if (id === 18) return { row:0, col:0 };
    if (id <= 26)  return { row:0, col:id-18 };
    if (id === 27) return { row:0, col:9 };
    return { row:id-27, col:9 };
}

function sendToJail(p, reason) {
    p.position = 9; p.inJail = true; p.jailTurns = 0;
    p.jailReason = reason || rnd(JAIL_REASONS);
    p.jailMaxTurns = Math.ceil(Math.random() * 5);
    p.jailFine = 100 + Math.floor(Math.random() * 6) * 100;
    if (p.carLevel > 0) { p.vehicleSeized = p.carLevel; p.carLevel = 0; p.carImpounded = true; }
    p.jailCount = (p.jailCount||0) + 1; if(p.jailCount>=3) unlockAch(p,'repeat_offender');
    gameState.rollsLeft = 1; // going to jail ends your turn (endTurn() will then pass play on)
}


function upgradeHousing(p) {
    const nl = Math.min(HOUSING.length-1, p.housingLevel+1);
    if (nl===p.housingLevel) return p.name+' already has max housing!';
    const lapsNeeded = HOUSING[nl].lapReq||0;
    if ((p.laps||0)<lapsNeeded) return p.name+' needs Lap '+lapsNeeded+' for '+HOUSING[nl].name+'.';
    const cost = Math.max(0, HOUSING[nl].price-HOUSING[p.housingLevel].price);
    if (p.money>=cost) { p.money-=cost; p.housingLevel=nl; animateAssetIcon('apHousingIcon'); return p.name+' upgraded to '+HOUSING[nl].name+'!'; }
    return p.name+" can't afford "+HOUSING[nl].name+'. Need '+fmt(cost)+'.';
}
function upgradeCar(p, lvls) {
    if (p.carLevel<=1) return p.name+" needs to visit a Car Dealer first!";
    const nl = Math.min(CARS.length-1, p.carLevel+lvls);
    if (nl===p.carLevel) return p.name+' already has max car!';
    const lapsNeeded = carLapRequired(nl);
    if ((p.laps||0)<lapsNeeded) return p.name+' needs Lap '+lapsNeeded+' for '+CARS[nl].name+'.';
    const cost = Math.max(0, CARS[nl].price-CARS[p.carLevel].price);
    if (p.money>=cost) { p.money-=cost; p.carLevel=nl; animateAssetIcon('apCarIcon'); return p.name+' upgraded to '+CARS[nl].name+'!'; }
    return p.name+" can't afford "+CARS[nl].name+'. Need '+fmt(cost)+'.';
}
function animateAssetIcon(id) { sfx.upgrade(); const el=document.getElementById(id); if(!el) return; el.classList.remove('upgraded'); void el.offsetWidth; el.classList.add('upgraded'); setTimeout(()=>el.classList.remove('upgraded'),600); }
function drawCard(deck) { return deck[Math.floor(Math.random()*deck.length)]; }

// ── CARDS ─────────────────────────────────────────────────

function getGoodCards()      { return gameState.boardMode==='funny'?FUNNY_GOOD_CARDS:gameState.boardMode==='sarcastic'?ADULT_GOOD_CARDS:GOOD_CARDS; }
function getBadCards()       { return gameState.boardMode==='funny'?FUNNY_BAD_CARDS:gameState.boardMode==='sarcastic'?ADULT_BAD_CARDS:BAD_CARDS; }
function getSarcasticCards() { return gameState.boardMode==='funny'?FUNNY_SARCASTIC_CARDS:gameState.boardMode==='sarcastic'?ADULT_SARCASTIC_CARDS:SARCASTIC_CARDS; }

function getSpaceDisplay(space) {
    const o = gameState.boardMode==='funny'?FUNNY_SPACE_NAMES:gameState.boardMode==='sarcastic'?ADULT_SPACE_NAMES:{};
    return o[space.name] || { name:space.name, icon:space.icon, desc:space.desc };
}

// ── HUSTLE DATA ───────────────────────────────────────────


// ── AVATAR BUILDER DATA ───────────────────────────────────
const tempSetup = { avatar: '' };
const AV = { skin:'#FDBCB4',hairStyle:'none',hairColor:'#3d2b1f',eyeStyle:'round',eyeColor:'#3d2b1f',browStyle:'normal',noseStyle:'normal',mouthStyle:'smile',cheeks:'none',outfitColor:'#1976d2',legColor:'#1565c0',shoeColor:'#1a1a1a',extras:'none' };
const AB_SKINS=[{l:'Porcelain',v:'#FFE4D6'},{l:'Ivory',v:'#FDBCB4'},{l:'Beige',v:'#F5C5A3'},{l:'Sand',v:'#E8A882'},{l:'Tan',v:'#D4855A'},{l:'Caramel',v:'#C06535'},{l:'Cocoa',v:'#8B4513'},{l:'Espresso',v:'#4A2006'},{l:'Olive',v:'#B5956A'},{l:'Golden',v:'#D4A055'},{l:'Alien',v:'#7EC850'},{l:'Robot',v:'#9E9E9E'},{l:'Undead',v:'#B0C4A0'},{l:'Blue',v:'#4A6FA5'},{l:'Purple',v:'#9B72CF'},{l:'Rose',v:'#E8B0A0'},{l:'Slate',v:'#6B7B8C'},{l:'Mint',v:'#9FE2BF'},{l:'Crimson',v:'#A23B3B'},{l:'Bronze',v:'#B97A57'}];
const AB_HCOLORS=[{l:'Black',v:'#1a1a1a'},{l:'Dark Brown',v:'#3d2b1f'},{l:'Brown',v:'#7B4F2E'},{l:'Auburn',v:'#922B21'},{l:'Red',v:'#C0392B'},{l:'Strawberry',v:'#E8735A'},{l:'Blonde',v:'#F0D060'},{l:'Platinum',v:'#F5F0DC'},{l:'Grey',v:'#9E9E9E'},{l:'White',v:'#F5F5F5'},{l:'Blue',v:'#2980B9'},{l:'Purple',v:'#8E44AD'},{l:'Pink',v:'#E91E8C'},{l:'Green',v:'#27AE60'},{l:'Orange',v:'#E67E22'},{l:'Teal',v:'#1ABC9C'},{l:'Silver',v:'#C0C0C0'},{l:'Rose Gold',v:'#E0A899'},{l:'Mint',v:'#7FE0C0'},{l:'Lavender',v:'#B39DDB'}];
const AB_ECOLORS=[{l:'Dark Brown',v:'#3d2b1f'},{l:'Brown',v:'#7B4F2E'},{l:'Hazel',v:'#8B7355'},{l:'Green',v:'#2d7a2d'},{l:'Teal',v:'#008080'},{l:'Blue',v:'#1565C0'},{l:'Ice Blue',v:'#7EC8E3'},{l:'Grey',v:'#607D8B'},{l:'Purple',v:'#6A1B9A'},{l:'Red',v:'#C62828'},{l:'Gold',v:'#F57F17'},{l:'Black',v:'#111'},{l:'Amber',v:'#FF8F00'},{l:'Violet',v:'#7E57C2'},{l:'Pink',v:'#E91E63'}];
const AB_OUTFIT_COLORS=[{l:'Navy',v:'#1565c0'},{l:'Red',v:'#c62828'},{l:'Green',v:'#2e7d32'},{l:'Purple',v:'#6a1b9a'},{l:'Orange',v:'#e65100'},{l:'Teal',v:'#00695c'},{l:'Pink',v:'#ad1457'},{l:'Black',v:'#1a1a1a'},{l:'Grey',v:'#455a64'},{l:'Gold',v:'#f9a825'},{l:'Brown',v:'#4e342e'},{l:'White',v:'#eceff1'},{l:'Crimson',v:'#b71c1c'},{l:'Mint',v:'#26a69a'},{l:'Indigo',v:'#283593'},{l:'Coral',v:'#ff7043'}];
const AB_LEG_COLORS=[{l:'Dark Blue',v:'#1565c0'},{l:'Black',v:'#212121'},{l:'Grey',v:'#616161'},{l:'Khaki',v:'#8d6e63'},{l:'Navy',v:'#0d47a1'},{l:'Brown',v:'#4e342e'},{l:'Olive',v:'#556b2f'},{l:'Burgundy',v:'#6d1b2f'},{l:'Stone',v:'#9e9e9e'}];
const AB_SHOE_COLORS=[{l:'Black',v:'#1a1a1a'},{l:'White',v:'#f5f5f5'},{l:'Brown',v:'#6d4c41'},{l:'Red',v:'#c62828'},{l:'Blue',v:'#1565c0'},{l:'Gold',v:'#f9a825'},{l:'Green',v:'#2e7d32'},{l:'Pink',v:'#e91e63'},{l:'Silver',v:'#b0bec5'}];
const AB_HAIR={
  none:{l:'Bald',b:'',f:''},
  short:{l:'Short',b:`<ellipse cx="50" cy="34" rx="26" ry="16" fill="HC"/>`,f:`<path d="M24 54 Q24 30 50 22 Q76 30 76 54 Q72 42 50 37 Q28 42 24 54Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  medium:{l:'Medium',b:`<ellipse cx="50" cy="36" rx="26" ry="18" fill="HC"/><rect x="20" y="54" width="8" height="28" rx="4" fill="HC"/><rect x="72" y="54" width="8" height="28" rx="4" fill="HC"/>`,f:`<path d="M24 52 Q24 28 50 20 Q76 28 76 52 Q72 39 50 34 Q28 39 24 52Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  long:{l:'Long',b:`<ellipse cx="50" cy="37" rx="26" ry="20" fill="HC"/><rect x="18" y="54" width="9" height="50" rx="4" fill="HC"/><rect x="73" y="54" width="9" height="50" rx="4" fill="HC"/>`,f:`<path d="M24 50 Q24 26 50 18 Q76 26 76 50 Q72 37 50 31 Q28 37 24 50Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  curly:{l:'Curly',b:'',f:`<path d="M22 48 Q17 30 32 20 Q24 14 38 18 Q40 8 50 12 Q60 8 62 18 Q76 14 68 20 Q83 30 78 48 Q72 33 60 28 Q55 18 50 22 Q45 18 40 28 Q28 33 22 48Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  ponytail:{l:'Ponytail',b:`<ellipse cx="50" cy="33" rx="25" ry="15" fill="HC"/><rect x="45" y="20" width="10" height="52" rx="5" fill="HC"/>`,f:`<path d="M25 50 Q25 28 50 20 Q75 28 75 50 Q71 38 50 33 Q29 38 25 50Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  mohawk:{l:'Mohawk',b:'',f:`<rect x="44" y="4" width="12" height="30" rx="6" fill="HC"/>`},
  afro:{l:'Afro',b:`<ellipse cx="50" cy="36" rx="34" ry="26" fill="HC"/>`,f:`<ellipse cx="50" cy="36" rx="34" ry="26" fill="HC" clip-path="url(#foreheadClip)"/>`},
  braids:{l:'Braids',b:`<ellipse cx="50" cy="34" rx="26" ry="16" fill="HC"/><rect x="37" y="84" width="8" height="36" rx="4" fill="HC"/><rect x="55" y="84" width="8" height="36" rx="4" fill="HC"/>`,f:`<path d="M24 52 Q24 28 50 20 Q76 28 76 52 Q72 40 50 34 Q28 40 24 52Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  spiky:{l:'Spiky',b:'',f:`<path d="M24 48 L32 20 L42 43 L50 12 L58 43 L68 20 L76 48 Q70 34 50 28 Q30 34 24 48Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  bun:{l:'Bun',b:`<ellipse cx="50" cy="34" rx="25" ry="15" fill="HC"/>`,f:`<path d="M25 52 Q25 30 50 22 Q75 30 75 52 Q71 40 50 34 Q29 40 25 52Z" fill="HC" clip-path="url(#foreheadClip)"/><circle cx="50" cy="18" r="12" fill="HC"/>`}
,
  buzz:{l:'Buzz',b:'',f:`<path d="M26 50 Q26 30 50 24 Q74 30 74 50 Q70 40 50 36 Q30 40 26 50Z" fill="HC" opacity="0.85" clip-path="url(#foreheadClip)"/>`},
  wavy:{l:'Wavy',b:`<ellipse cx="50" cy="36" rx="27" ry="19" fill="HC"/>`,f:`<path d="M23 52 Q26 30 38 24 Q34 32 42 30 Q44 22 50 24 Q56 22 58 30 Q66 32 62 24 Q74 30 77 52 Q72 38 50 34 Q28 38 23 52Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  undercut:{l:'Undercut',b:'',f:`<path d="M26 50 Q24 24 50 20 Q76 24 74 50 Q74 34 56 32 Q56 40 50 40 Q46 32 26 38Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  pixie:{l:'Pixie',b:`<ellipse cx="50" cy="34" rx="25" ry="15" fill="HC"/>`,f:`<path d="M24 50 Q24 26 50 20 Q76 26 76 50 Q70 36 58 34 Q60 30 50 32 Q48 28 42 34 Q30 36 24 50Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  dreads:{l:'Dreads',b:`<ellipse cx="50" cy="34" rx="26" ry="16" fill="HC"/><rect x="20" y="50" width="6" height="58" rx="3" fill="HC"/><rect x="30" y="56" width="6" height="56" rx="3" fill="HC"/><rect x="64" y="56" width="6" height="56" rx="3" fill="HC"/><rect x="74" y="50" width="6" height="58" rx="3" fill="HC"/>`,f:`<path d="M24 52 Q24 28 50 20 Q76 28 76 52 Q72 40 50 34 Q28 40 24 52Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  pigtails:{l:'Pigtails',b:`<ellipse cx="50" cy="33" rx="25" ry="15" fill="HC"/><circle cx="18" cy="58" r="11" fill="HC"/><circle cx="82" cy="58" r="11" fill="HC"/>`,f:`<path d="M25 50 Q25 28 50 20 Q75 28 75 50 Q71 38 50 33 Q29 38 25 50Z" fill="HC" clip-path="url(#foreheadClip)"/>`},
  manbun:{l:'Man Bun',b:`<ellipse cx="50" cy="34" rx="25" ry="15" fill="HC"/><circle cx="50" cy="14" r="9" fill="HC"/>`,f:`<path d="M26 50 Q26 28 50 22 Q74 28 74 50 Q70 38 50 34 Q30 38 26 50Z" fill="HC" clip-path="url(#foreheadClip)"/>`}};
const AB_BROWS={normal:{l:'Normal',s:`<path d="M33 46 Q40 42 47 46" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M53 46 Q60 42 67 46" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/>`},thick:{l:'Thick',s:`<path d="M32 46 Q40 41 48 46" stroke="HC" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M52 46 Q60 41 68 46" stroke="HC" stroke-width="3.5" fill="none" stroke-linecap="round"/>`},thin:{l:'Thin',s:`<path d="M34 46 Q40 43 46 46" stroke="HC" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M54 46 Q60 43 66 46" stroke="HC" stroke-width="1.3" fill="none" stroke-linecap="round"/>`},arched:{l:'Arched',s:`<path d="M33 48 Q40 41 47 46" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M53 46 Q60 41 67 48" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/>`},angry:{l:'Angry',s:`<path d="M33 44 Q40 48 47 45" stroke="HC" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M53 45 Q60 48 67 44" stroke="HC" stroke-width="2.5" fill="none" stroke-linecap="round"/>`},raised:{l:'Raised',s:`<path d="M33 44 Q40 40 47 43" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M53 43 Q60 40 67 44" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/>`},none:{l:'None',s:''},worried:{l:'Worried',s:`<path d="M33 45 Q40 48 47 44" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M53 44 Q60 48 67 45" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/>`},unibrow:{l:'Unibrow',s:`<path d="M33 46 Q50 41 67 46" stroke="HC" stroke-width="3.5" fill="none" stroke-linecap="round"/>`}};
const AB_EYES={round:{l:'Round',s:`<ellipse cx="40" cy="54" rx="6" ry="6.5" fill="white"/><ellipse cx="60" cy="54" rx="6" ry="6.5" fill="white"/><circle cx="41" cy="55" r="3.5" fill="EC"/><circle cx="61" cy="55" r="3.5" fill="EC"/><circle cx="42" cy="54" r="1.2" fill="white"/><circle cx="62" cy="54" r="1.2" fill="white"/>`},almond:{l:'Almond',s:`<path d="M33 54 Q40 47 47 54 Q40 61 33 54Z" fill="white"/><path d="M53 54 Q60 47 67 54 Q60 61 53 54Z" fill="white"/><circle cx="40" cy="54" r="3" fill="EC"/><circle cx="60" cy="54" r="3" fill="EC"/><circle cx="41" cy="53" r="1" fill="white"/><circle cx="61" cy="53" r="1" fill="white"/>`},wide:{l:'Wide',s:`<circle cx="40" cy="54" r="7.5" fill="white"/><circle cx="60" cy="54" r="7.5" fill="white"/><circle cx="41" cy="55" r="4.5" fill="EC"/><circle cx="61" cy="55" r="4.5" fill="EC"/><circle cx="43" cy="53" r="1.5" fill="white"/><circle cx="63" cy="53" r="1.5" fill="white"/>`},sleepy:{l:'Sleepy',s:`<path d="M33 56 Q40 47 47 56" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M53 56 Q60 47 67 56" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="40" cy="54" r="2.5" fill="EC"/><circle cx="60" cy="54" r="2.5" fill="EC"/>`},wink:{l:'Wink',s:`<ellipse cx="40" cy="54" rx="6" ry="6.5" fill="white"/><circle cx="41" cy="55" r="3.5" fill="EC"/><circle cx="42" cy="54" r="1.2" fill="white"/><path d="M53 54 Q60 49 67 54" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`},star:{l:'Star',s:`<text x="34" y="60" font-size="12" fill="EC">&#9733;</text><text x="54" y="60" font-size="12" fill="EC">&#9733;</text>`},heart:{l:'Heart',s:`<text x="34" y="60" font-size="11" fill="#e91e63">&#9829;</text><text x="54" y="60" font-size="11" fill="#e91e63">&#9829;</text>`},closed:{l:'Closed',s:`<path d="M34 55 Q40 50 46 55" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M54 55 Q60 50 66 55" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`},money:{l:'Money',s:`<circle cx="40" cy="54" r="7" fill="white"/><circle cx="60" cy="54" r="7" fill="white"/><text x="35" y="58" font-size="9" fill="#2e7d32" font-weight="bold">$</text><text x="55" y="58" font-size="9" fill="#2e7d32" font-weight="bold">$</text>`},dizzy:{l:'Dizzy',s:`<path d="M36 50 A4 4 0 1 1 44 54 A3 3 0 1 1 38 56" stroke="#333" stroke-width="1.5" fill="none"/><path d="M56 50 A4 4 0 1 1 64 54 A3 3 0 1 1 58 56" stroke="#333" stroke-width="1.5" fill="none"/>`},fierce:{l:'Fierce',s:`<ellipse cx="40" cy="55" rx="6" ry="6" fill="white"/><ellipse cx="60" cy="55" rx="6" ry="6" fill="white"/><circle cx="42" cy="56" r="3.2" fill="EC"/><circle cx="58" cy="56" r="3.2" fill="EC"/>`},cute:{l:'Cute',s:`<ellipse cx="40" cy="54" rx="7" ry="8" fill="white"/><ellipse cx="60" cy="54" rx="7" ry="8" fill="white"/><circle cx="40" cy="56" r="4.5" fill="EC"/><circle cx="60" cy="56" r="4.5" fill="EC"/><circle cx="42" cy="53" r="2" fill="white"/><circle cx="62" cy="53" r="2" fill="white"/>`}};
const AB_NOSES={normal:{l:'Normal',s:`<path d="M47 62 Q45 69 43 71 Q50 74 57 71 Q55 69 53 62" stroke="#d4956a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`},button:{l:'Button',s:`<circle cx="50" cy="68" r="3.5" fill="#d4956a" opacity="0.4"/><circle cx="47" cy="69" r="1.3" fill="#d4956a" opacity="0.6"/><circle cx="53" cy="69" r="1.3" fill="#d4956a" opacity="0.6"/>`},wide:{l:'Wide',s:`<path d="M44 63 Q41 70 40 72 Q50 76 60 72 Q59 70 56 63" stroke="#d4956a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`},narrow:{l:'Narrow',s:`<path d="M49 62 Q48 69 47 71 Q50 73 53 71 Q52 69 51 62" stroke="#d4956a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`},pig:{l:'Pig',s:`<ellipse cx="50" cy="68" rx="7" ry="4.5" fill="#d4956a" opacity="0.45"/><circle cx="47" cy="68" r="1.8" fill="#d4956a" opacity="0.7"/><circle cx="53" cy="68" r="1.8" fill="#d4956a" opacity="0.7"/>`},none:{l:'None',s:''},pointy:{l:'Pointy',s:`<path d="M50 60 L46 71 Q50 74 54 71 Z" stroke="#d4956a" stroke-width="1.2" fill="#d4956a" fill-opacity="0.25" stroke-linecap="round"/>`},freckled:{l:'Freckled',s:`<path d="M47 62 Q45 69 43 71 Q50 74 57 71 Q55 69 53 62" stroke="#d4956a" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="50" cy="66" r="1" fill="#c07040" opacity="0.6"/>`}};
const AB_MOUTHS={smile:{l:'Smile',s:`<path d="M40 77 Q50 85 60 77" stroke="#c0605a" stroke-width="2" fill="none" stroke-linecap="round"/>`},bigsmile:{l:'Big Smile',s:`<path d="M38 76 Q50 90 62 76" stroke="#c0605a" stroke-width="2" fill="#e07070" stroke-linecap="round"/><path d="M42 84 Q50 90 58 84" fill="white"/>`},neutral:{l:'Neutral',s:`<line x1="42" y1="79" x2="58" y2="79" stroke="#c0605a" stroke-width="2" stroke-linecap="round"/>`},frown:{l:'Frown',s:`<path d="M40 82 Q50 75 60 82" stroke="#c0605a" stroke-width="2" fill="none" stroke-linecap="round"/>`},smirk:{l:'Smirk',s:`<path d="M42 79 Q50 85 60 77" stroke="#c0605a" stroke-width="2" fill="none" stroke-linecap="round"/>`},open:{l:'Open',s:`<ellipse cx="50" cy="80" rx="8" ry="5" fill="#c0605a"/><ellipse cx="50" cy="79" rx="6.5" ry="3" fill="white"/><ellipse cx="50" cy="81" rx="6.5" ry="2.5" fill="#e07070"/>`},teeth:{l:'Grin',s:`<path d="M40 77 Q50 88 60 77 Q50 84 40 77Z" fill="#c0605a"/><rect x="42" y="79" width="16" height="4" rx="1" fill="white"/>`},tongue:{l:'Silly',s:`<path d="M40 77 Q50 88 60 77" stroke="#c0605a" stroke-width="2" fill="#e07070"/><ellipse cx="50" cy="84" rx="5" ry="4" fill="#e84393"/>`},kiss:{l:'Kiss',s:`<ellipse cx="50" cy="80" rx="4" ry="5" fill="#c0605a"/><path d="M46 78 Q50 75 54 78" stroke="#c0605a" stroke-width="1.5" fill="none"/>`},vampire:{l:'Vampire',s:`<path d="M40 77 Q50 86 60 77 Q50 82 40 77Z" fill="#c0605a"/><rect x="43" y="79" width="14" height="3" rx="1" fill="white"/><path d="M45 82 L47 86 L49 82Z" fill="white"/><path d="M51 82 L53 86 L55 82Z" fill="white"/>`},grimace:{l:'Grimace',s:`<rect x="40" y="77" width="20" height="7" rx="2" fill="#c0605a"/><rect x="42" y="78" width="16" height="5" fill="white"/>`},mustache:{l:'Mustache',s:`<path d="M40 79 Q50 86 60 79" stroke="#c0605a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M38 74 Q44 71 50 74 Q56 71 62 74 Q56 78 50 76 Q44 78 38 74Z" fill="#3d2b1f"/>`}};
const AB_CHEEKS={none:{l:'None',s:''},rosy:{l:'Rosy',s:`<ellipse cx="27" cy="65" rx="7" ry="4.5" fill="#FFB6C1" opacity="0.6"/><ellipse cx="73" cy="65" rx="7" ry="4.5" fill="#FFB6C1" opacity="0.6"/>`},freckles:{l:'Freckles',s:`<circle cx="30" cy="63" r="1.3" fill="#c07040" opacity="0.7"/><circle cx="35" cy="67" r="1.3" fill="#c07040" opacity="0.7"/><circle cx="65" cy="63" r="1.3" fill="#c07040" opacity="0.7"/><circle cx="70" cy="67" r="1.3" fill="#c07040" opacity="0.7"/>`},blush:{l:'Blush',s:`<ellipse cx="25" cy="65" rx="9" ry="5.5" fill="#FF8C94" opacity="0.35"/><ellipse cx="75" cy="65" rx="9" ry="5.5" fill="#FF8C94" opacity="0.35"/>`},stars:{l:'Stars',s:`<text x="19" y="68" font-size="8" opacity="0.8">&#10024;</text><text x="66" y="68" font-size="8" opacity="0.8">&#10024;</text>`},tears:{l:'Tears',s:`<path d="M33 58 Q31 66 29 72" stroke="#87CEEB" stroke-width="1.8" fill="none"/><path d="M67 58 Q69 66 71 72" stroke="#87CEEB" stroke-width="1.8" fill="none"/>`},scar:{l:'Scar',s:`<line x1="68" y1="50" x2="72" y2="62" stroke="#a23b3b" stroke-width="1.5" stroke-linecap="round"/><line x1="68" y1="53" x2="72" y2="53" stroke="#a23b3b" stroke-width="1" stroke-linecap="round"/>`},sweat:{l:'Sweat',s:`<path d="M72 48 Q75 54 72 58 Q69 54 72 48Z" fill="#7EC8E3"/>`},dimples:{l:'Dimples',s:`<circle cx="33" cy="76" r="1.4" fill="#c07040" opacity="0.5"/><circle cx="67" cy="76" r="1.4" fill="#c07040" opacity="0.5"/>`}};
const AB_EXTRAS={none:{l:'None',s:''},glasses:{l:'Glasses',s:`<circle cx="40" cy="54" r="8" stroke="#333" stroke-width="1.5" fill="none" opacity="0.7"/><circle cx="60" cy="54" r="8" stroke="#333" stroke-width="1.5" fill="none" opacity="0.7"/><line x1="48" y1="54" x2="52" y2="54" stroke="#333" stroke-width="1.5"/><line x1="22" y1="51" x2="32" y2="53" stroke="#333" stroke-width="1.5"/><line x1="68" y1="53" x2="78" y2="51" stroke="#333" stroke-width="1.5"/>`},sunglasses:{l:'Sunnies',s:`<rect x="29" y="49" width="18" height="11" rx="5.5" fill="#1a1a1a" opacity="0.88"/><rect x="53" y="49" width="18" height="11" rx="5.5" fill="#1a1a1a" opacity="0.88"/><line x1="47" y1="54" x2="53" y2="54" stroke="#555" stroke-width="1.5"/>`},crown:{l:'Crown',s:`<path d="M22 36 L30 18 L50 30 L70 18 L78 36 L66 31 L50 36 L34 31Z" fill="#FFD700"/><circle cx="30" cy="20" r="3" fill="#FF4444"/><circle cx="50" cy="31" r="3" fill="#4444FF"/><circle cx="70" cy="20" r="3" fill="#44FF44"/>`},tophat:{l:'Top Hat',s:`<rect x="32" y="6" width="36" height="28" rx="3" fill="#1a1a1a"/><rect x="20" y="32" width="60" height="6" rx="3" fill="#1a1a1a"/>`},halo:{l:'Halo',s:`<ellipse cx="50" cy="16" rx="20" ry="5" fill="none" stroke="#FFD700" stroke-width="3.5" opacity="0.9"/>`},horns:{l:'Horns',s:`<path d="M28 34 L22 10 L36 28Z" fill="#8B0000"/><path d="M72 34 L78 10 L64 28Z" fill="#8B0000"/>`},cowboy:{l:'Cowboy',s:`<ellipse cx="50" cy="34" rx="34" ry="5" fill="#8B4513"/><rect x="26" y="12" width="48" height="25" rx="10" fill="#8B4513"/>`},beanie:{l:'Beanie',s:`<ellipse cx="50" cy="36" rx="28" ry="16" fill="#E53935"/><rect x="22" y="33" width="56" height="9" rx="4" fill="#C62828"/><circle cx="50" cy="22" r="7" fill="#FF8A80"/>`},bandana:{l:'Bandana',s:`<path d="M24 53 Q50 66 76 53 Q76 62 50 70 Q24 62 24 53Z" fill="#E53935" opacity="0.88"/>`},headband:{l:'Headband',s:`<rect x="22" y="40" width="56" height="8" rx="4" fill="#E91E63"/><circle cx="50" cy="40" r="6" fill="#FF80AB"/>`},eyepatch:{l:'Eyepatch',s:`<ellipse cx="40" cy="54" rx="9" ry="7" fill="#1a1a1a"/><line x1="22" y1="48" x2="78" y2="58" stroke="#1a1a1a" stroke-width="2"/>`},monocle:{l:'Monocle',s:`<circle cx="60" cy="54" r="9" stroke="#FFD700" stroke-width="2" fill="none"/><line x1="60" y1="63" x2="62" y2="74" stroke="#FFD700" stroke-width="1.2"/>`},mask:{l:'Face Mask',s:`<path d="M30 64 Q50 60 70 64 L68 80 Q50 88 32 80Z" fill="#4FC3F7" opacity="0.92"/><line x1="30" y1="66" x2="22" y2="60" stroke="#4FC3F7" stroke-width="2"/><line x1="70" y1="66" x2="78" y2="60" stroke="#4FC3F7" stroke-width="2"/>`},wizard:{l:'Wizard',s:`<path d="M50 -2 L30 34 L70 34Z" fill="#3949AB"/><ellipse cx="50" cy="34" rx="24" ry="5" fill="#283593"/><text x="44" y="22" font-size="9" fill="#FFD700">&#9733;</text>`},party:{l:'Party Hat',s:`<path d="M50 2 L38 32 L62 32Z" fill="#E91E63"/><circle cx="50" cy="2" r="3" fill="#FFD700"/><circle cx="44" cy="20" r="2" fill="#FFEB3B"/><circle cx="55" cy="25" r="2" fill="#00E5FF"/>`},headphones:{l:'Headphones',s:`<path d="M22 54 Q22 24 50 24 Q78 24 78 54" stroke="#222" stroke-width="3" fill="none"/><rect x="17" y="50" width="9" height="16" rx="4" fill="#222"/><rect x="74" y="50" width="9" height="16" rx="4" fill="#222"/>`},durag:{l:'Durag',s:`<path d="M24 46 Q50 24 76 46 Q74 38 50 32 Q26 38 24 46Z" fill="#1a1a1a"/><path d="M70 44 Q84 46 86 58 Q80 52 70 50Z" fill="#1a1a1a"/>`}};

let abCurrentCat = 'skin';
function abUpdateSVG() {
  const svg=document.getElementById('avatarSVG'); if(!svg) return;
  const sk=AV.skin,hc=AV.hairColor;
  ['svgHead','svgNeck','svgEarL','svgEarR'].forEach(id=>{const e=svg.getElementById(id);if(e)e.setAttribute('fill',sk);});
  svg.querySelectorAll('#svgHands ellipse').forEach(e=>e.setAttribute('fill',sk));
  const br=svg.querySelector('#svgBody rect'); if(br) br.setAttribute('fill',AV.outfitColor);
  svg.querySelectorAll('#svgArms rect').forEach(r=>r.setAttribute('fill',AV.outfitColor));
  svg.querySelectorAll('#svgLegs rect').forEach(r=>r.setAttribute('fill',AV.legColor));
  svg.querySelectorAll('#svgShoes ellipse').forEach(e=>e.setAttribute('fill',AV.shoeColor));
  const h=AB_HAIR[AV.hairStyle]||AB_HAIR.none;
  svg.getElementById('svgHairBack').innerHTML=h.b.replace(/HC/g,hc);
  svg.getElementById('svgHairFront').innerHTML=h.f.replace(/HC/g,hc);
  svg.getElementById('svgEyes').innerHTML=(AB_EYES[AV.eyeStyle]||AB_EYES.round).s.replace(/EC/g,AV.eyeColor);
  svg.getElementById('svgBrows').innerHTML=(AB_BROWS[AV.browStyle]||AB_BROWS.normal).s.replace(/HC/g,hc);
  svg.getElementById('svgNose').innerHTML=(AB_NOSES[AV.noseStyle]||AB_NOSES.normal).s;
  svg.getElementById('svgMouth').innerHTML=(AB_MOUTHS[AV.mouthStyle]||AB_MOUTHS.smile).s;
  svg.getElementById('svgCheeks').innerHTML=(AB_CHEEKS[AV.cheeks]||AB_CHEEKS.none).s;
  svg.getElementById('svgExtras').innerHTML=(AB_EXTRAS[AV.extras]||AB_EXTRAS.none).s;
  tempSetup.avatar=new XMLSerializer().serializeToString(svg);
}
function abSwitchCat(tabEl){abCurrentCat=tabEl.dataset.cat;document.querySelectorAll('.ab-tab').forEach(t=>t.classList.remove('active'));tabEl.classList.add('active');abRenderOptions();}
function abMakeSwatchRow(items,key,small){const row=document.createElement('div');row.className='ab-swatch-row';items.forEach(item=>{const btn=document.createElement('button');btn.className='ab-swatch'+(small?' sm':'')+(AV[key]===item.v?' sel':'');btn.style.background=item.v;btn.title=item.l;btn.onclick=()=>{AV[key]=item.v;abUpdateSVG();abRenderOptions();};row.appendChild(btn);});return row;}
function abMakeOptRow(map,key){const row=document.createElement('div');row.className='ab-opt-row';Object.entries(map).forEach(([k,v])=>{const btn=document.createElement('button');btn.className='ab-opt-btn'+(AV[key]===k?' sel':'');btn.textContent=v.l;btn.onclick=()=>{AV[key]=k;abUpdateSVG();abRenderOptions();};row.appendChild(btn);});return row;}
function abOptLabel(txt){const d=document.createElement('div');d.className='ab-section-label';d.textContent=txt;return d;}
function abRenderOptions(){
  const grid=document.getElementById('abOptions');if(!grid) return;grid.innerHTML='';const cat=abCurrentCat;
  if(cat==='skin'){grid.appendChild(abOptLabel('Skin Tone'));grid.appendChild(abMakeSwatchRow(AB_SKINS,'skin'));}
  else if(cat==='hair'){grid.appendChild(abOptLabel('Style'));grid.appendChild(abMakeOptRow(AB_HAIR,'hairStyle'));grid.appendChild(abOptLabel('Color'));grid.appendChild(abMakeSwatchRow(AB_HCOLORS,'hairColor',true));}
  else if(cat==='eyes'){grid.appendChild(abOptLabel('Style'));grid.appendChild(abMakeOptRow(AB_EYES,'eyeStyle'));grid.appendChild(abOptLabel('Color'));grid.appendChild(abMakeSwatchRow(AB_ECOLORS,'eyeColor',true));}
  else if(cat==='brows'){grid.appendChild(abOptLabel('Eyebrows'));grid.appendChild(abMakeOptRow(AB_BROWS,'browStyle'));}
  else if(cat==='nose'){grid.appendChild(abOptLabel('Nose'));grid.appendChild(abMakeOptRow(AB_NOSES,'noseStyle'));}
  else if(cat==='mouth'){grid.appendChild(abOptLabel('Mouth'));grid.appendChild(abMakeOptRow(AB_MOUTHS,'mouthStyle'));}
  else if(cat==='cheeks'){grid.appendChild(abOptLabel('Cheeks'));grid.appendChild(abMakeOptRow(AB_CHEEKS,'cheeks'));}
  else if(cat==='outfit'){grid.appendChild(abOptLabel('Shirt'));grid.appendChild(abMakeSwatchRow(AB_OUTFIT_COLORS,'outfitColor'));grid.appendChild(abOptLabel('Pants'));grid.appendChild(abMakeSwatchRow(AB_LEG_COLORS,'legColor'));grid.appendChild(abOptLabel('Shoes'));grid.appendChild(abMakeSwatchRow(AB_SHOE_COLORS,'shoeColor'));}
  else if(cat==='extras'){grid.appendChild(abOptLabel('Accessories'));grid.appendChild(abMakeOptRow(AB_EXTRAS,'extras'));}
}
function abReset(){Object.assign(AV,{skin:'#FDBCB4',hairStyle:'none',hairColor:'#3d2b1f',eyeStyle:'round',eyeColor:'#3d2b1f',browStyle:'normal',noseStyle:'normal',mouthStyle:'smile',cheeks:'none',outfitColor:'#1976d2',legColor:'#1565c0',shoeColor:'#1a1a1a',extras:'none'});abUpdateSVG();abRenderOptions();}

// ── SCREENS / SETUP ───────────────────────────────────────
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');}
document.getElementById('startBtn').addEventListener('click',()=>showScreen('setupScreen'));
function setPlayers(n){gameState.numPlayers=n;document.querySelectorAll('.player-btn').forEach(b=>b.classList.remove('selected'));event.target.classList.add('selected');checkSetupReady();}
function setGoal(g){gameState.winGoal=g;document.querySelectorAll('.goal-btn').forEach(b=>b.classList.remove('selected'));event.target.classList.add('selected');checkSetupReady();}
function checkSetupReady(){if(gameState.numPlayers>0&&gameState.winGoal>0)document.getElementById('setupDoneBtn').classList.remove('hidden');}
function setMode(e){const btn=e.target.closest('.mode-btn');if(!btn) return;const mode=btn.dataset.mode;if(!mode) return;gameState.boardMode=mode;document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');}
function setupPlayers(){gameState.players=[];gameState.currentSetupPlayer=0;showPlayerSetup();showScreen('playerSetupScreen');setTimeout(()=>{abUpdateSVG();abRenderOptions();},50);}
function showPlayerSetup(){const idx=gameState.currentSetupPlayer;document.getElementById('playerSetupTitle').textContent=`Player ${idx+1} Setup`;document.getElementById('playerName').value='';abCurrentCat='skin';document.querySelectorAll('.ab-tab').forEach((t,i)=>t.classList.toggle('active',i===0));abReset();document.getElementById('nextPlayerBtn').textContent=idx===gameState.numPlayers-1?'START CHAOS!':'NEXT PLAYER';}
function nextPlayer(){
    const name=document.getElementById('playerName').value.trim();
    if(!tempSetup.avatar){alert('Pick an avatar!');return;}
    if(!name){alert('Enter your name!');return;}
    gameState.players.push({id:gameState.currentSetupPlayer,name,avatar:tempSetup.avatar,job:'Unemployed',jobPay:2000,money:20000,position:0,housingLevel:0,carLevel:0,inJail:false,jailTurns:0,jailMaxTurns:3,jailReason:'',jailFine:200,vehicleSeized:0,carImpounded:false,jailFreeCards:0,happiness:5.0,turnsPlayed:0,laps:0,skipTurn:false,rentDue:0,carPaymentDue:0,achievements:[],jailCount:0});
    gameState.currentSetupPlayer++;
    if(gameState.currentSetupPlayer>=gameState.numPlayers) startGame();
    else{showPlayerSetup();setTimeout(()=>{abUpdateSVG();abRenderOptions();},50);}
}

// ── START GAME ────────────────────────────────────────────
function startGame(){
    gameState.currentPlayerIndex=0;gameState.rollsLeft=RULES.TURN_ROLLS;gameState.phase='playing';
    showScreen('gameScreen');
    document.getElementById('winGoalDisplay').textContent='🏆 Net worth: '+fmt(gameState.winGoal);
    buildBoard();renderPlayerBar();updateCurrentPlayerDisplay();injectAchUI();
}

// ── BOARD — uniform 10×10, center absolutely positioned ───
function buildBoard(){
    const board=document.getElementById('gameBoard');
    const centerArea=document.getElementById('centerArea');
    board.innerHTML='';
    board.appendChild(centerArea);
    document.getElementById('centerMode').textContent=gameState.boardMode==='funny'?'😂 FUNNY MODE':gameState.boardMode==='sarcastic'?'😈 SARCASTIC MODE':'The Game of Life';
    document.getElementById('centerGoal').textContent='🏆 Win: '+fmt(gameState.winGoal)+' net worth';
    BOARD_SPACES.forEach(space=>{
        const pos=getGridPosition(space.id);
        const div=document.createElement('div');
        div.className=`board-space ${space.type}`;
        div.setAttribute('data-space-id',space.id);
        div.style.gridColumn=(pos.col+1)+'';
        div.style.gridRow=(pos.row+1)+'';
        const disp=getSpaceDisplay(space);
        div.innerHTML=`<div class="space-icon">${disp.icon}</div><div class="space-name">${disp.name}</div><div class="space-players" id="sp-${space.id}"></div>`;
        board.appendChild(div);
    });
    updatePlayerPieces();
}

// ── ANIMATED HOP ─────────────────────────────────────────
function animatePlayerHop(player,steps,onDone){
    const startPos=player.position;let stepsDone=0;
    function doNextStep(){
        if(stepsDone>=steps){onDone();return;}
        stepsDone++;
        player.position=(startPos+stepsDone)%36;sfx.step();
        updatePlayerPieces();
        const spEl=document.getElementById('sp-'+player.position);
        if(spEl){const piece=spEl.querySelector('.space-piece');if(piece){piece.classList.remove('piece-hop');void piece.offsetWidth;piece.classList.add('piece-hop');}}
        const delay=steps>8?140:steps>4?200:260;
        setTimeout(doNextStep,delay);
    }
    doNextStep();
}

function updatePlayerPieces(){
    document.querySelectorAll('.space-players').forEach(el=>el.innerHTML='');
    gameState.players.forEach(p=>{
        const el=document.getElementById('sp-'+p.position);
        if(el){const span=document.createElement('span');span.className='space-piece';span.title=p.name;renderAvatar(span,p.avatar,22);el.appendChild(span);}
    });
}

// ── PLAYER BAR ────────────────────────────────────────────
function renderPlayerBar(){
    const bar=document.getElementById('playerInfoBar');bar.innerHTML='';
    gameState.players.forEach((p,i)=>{
        const h=p.happiness;const hColor=h>=7?'#4ecca3':h>=4?'#f5a623':'#e94560';const hPct=(h/10*100).toFixed(0);
        const div=document.createElement('div');
        div.className=`player-token ${i===gameState.currentPlayerIndex?'active-player':''}`;
        div.innerHTML=`<div class="token-row1"><span class="token-avatar"></span><span class="token-name">${p.name}</span></div><div class="token-money">${fmt(p.money)}</div><div class="token-details">${p.job}</div><div class="token-details">${HOUSING[p.housingLevel].icon} ${HOUSING[p.housingLevel].name}</div><div class="token-details">${CARS[p.carLevel].icon} ${CARS[p.carLevel].name}</div><div class="happiness-bar-wrap"><span style="font-size:0.75em;color:${hColor}">${h.toFixed(1)}😊</span><div class="happiness-bar"><div class="happiness-fill" style="width:${hPct}%;background:${hColor}"></div></div></div>${p.inJail?'<div class="token-jail">⛓️ JAIL</div>':''}`;
        bar.appendChild(div);
        renderAvatar(div.querySelector('.token-avatar'),p.avatar,22);
        checkAchievements(p);
    });
    updateActivePlayerPanel();
}

function housingDisplayName(p){if(p.housingLevel===1&&p.carLevel>=2) return{name:'Car Living',icon:'🚗'};return{name:HOUSING[p.housingLevel].name,icon:HOUSING[p.housingLevel].icon};}
function updateActivePlayerPanel(){
    if(gameState.phase!=='playing') return;
    const p=gameState.players[gameState.currentPlayerIndex];if(!p) return;
    const set=(id,v)=>{const el=document.getElementById(id);if(el) el.textContent=v;};
    const apAvEl=document.getElementById('apAvatar');if(apAvEl) renderAvatar(apAvEl,p.avatar,70);
    set('apName',p.name);set('apMoney',fmt(p.money));set('apJob','💼 '+p.job+' | '+fmt(p.jobPay));
    const h=p.happiness;const hColor=h>=7?'#4ecca3':h>=4?'#f5a623':'#e94560';
    const hEl=document.getElementById('apHappiness');if(hEl){hEl.textContent='😊 Mood: '+h.toFixed(1)+'/10';hEl.style.color=hColor;}
    set('apLaps','🔄 Laps: '+(p.laps||0)+' | '+getTierLabel(p.laps||0));
    const jailEl=document.getElementById('apJail');
    if(jailEl){if(p.inJail){jailEl.textContent=`⛓️ JAIL: ${p.jailReason} — Turn ${p.jailTurns+1}/${p.jailMaxTurns} | Bail: ${fmt(p.jailFine)}`;jailEl.classList.remove('hidden');}else jailEl.classList.add('hidden');}
    const house=housingDisplayName(p);set('apHousingIcon',house.icon);set('apHousingName',house.name);renderUpgradeTrack('housingTrack',p.housingLevel,HOUSING.length);
    const car=CARS[p.carLevel];set('apCarIcon',car.icon);set('apCarName',car.name);renderUpgradeTrack('carTrack',p.carLevel,CARS.length);updateRapSheetBtn();
}
function renderUpgradeTrack(trackId,currentLevel,totalLevels){
    const el=document.getElementById(trackId);if(!el) return;el.innerHTML='';
    for(let i=0;i<totalLevels;i++){const dot=document.createElement('div');dot.className='upgrade-dot'+(i<currentLevel?' filled':i===currentLevel?' current':'');el.appendChild(dot);}
}

function updateCurrentPlayerDisplay(){
    const p=gameState.players[gameState.currentPlayerIndex];updateActivePlayerPanel();
    const hoopty=CARS[p.carLevel].isHoopty,isBike=CARS[p.carLevel].isBike;
    let msg='';
    if(p.inJail) msg=`⛓️ In jail (${p.jailReason}). Turn ${p.jailTurns+1}/${p.jailMaxTurns}. Roll doubles or pay ${fmt(p.jailFine)}.`;
    else if(hoopty) msg='🚗 Hoopty! Roll 1 die — 1-3 = dead battery (walk), 4-6 = starts (roll 2 dice).';
    else if(p.carLevel===0) msg='🚶 On Foot — roll 1 die.';
    else if(isBike) msg='🚲 Bicycle — roll 1 die.';
    else msg=`🚗 In the ${CARS[p.carLevel].name} — roll 2 dice!`;
    const _done=RULES.TURN_ROLLS-(gameState.rollsLeft==null?RULES.TURN_ROLLS:gameState.rollsLeft)+1;
    if(gameState.numPlayers>=1) msg='🎲 Roll '+_done+' of '+RULES.TURN_ROLLS+' — '+msg;
    document.getElementById('gameMessage').textContent=msg;
    document.getElementById('diceResult').textContent='';
    document.getElementById('rollDiceBtn').disabled=false;
}

// ── DICE ─────────────────────────────────────────────────
const DICE_FACES=['','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];
function animateDice(d1El,d2El,val1,val2,onDone){
    d1El.classList.add('rolling');if(d2El) d2El.classList.add('rolling');
    let ticks=0;const iv=setInterval(()=>{
        d1El.textContent=DICE_FACES[Math.floor(Math.random()*6)+1];
        if(d2El) d2El.textContent=DICE_FACES[Math.floor(Math.random()*6)+1];
        ticks++;if(ticks>8){clearInterval(iv);d1El.classList.remove('rolling');if(d2El) d2El.classList.remove('rolling');d1El.textContent=DICE_FACES[val1];if(d2El) d2El.textContent=val2?DICE_FACES[val2]:'⬛';onDone();}
    },80);
}

function rollDice(){
    sfx.roll();
    document.getElementById('rollDiceBtn').disabled=true;
    const player=gameState.players[gameState.currentPlayerIndex];
    const d1El=document.getElementById('die1'),d2El=document.getElementById('die2');
    if(player.inJail){handleJailRoll(player,d1El,d2El);return;}
    const hoopty=CARS[player.carLevel].isHoopty,isBike=CARS[player.carLevel].isBike;
    if(hoopty){
        const die1=Math.ceil(Math.random()*6);
        document.getElementById('gameMessage').textContent='🎲 Checking if the Hoopty starts...';
        animateDice(d1El,d2El,die1,null,()=>{
            if(die1<=3){
                document.getElementById('diceResult').textContent=`${DICE_FACES[die1]} = ${die1} 🔋 Dead battery!`;
                showCardOverlay('🚗','HOOPTY','Dead Battery!',`${player.name} rolled ${die1}. Won't start — walking!`,'bad',()=>{
                    const mv=Math.ceil(Math.random()*6);
                    animateDice(d1El,d2El,mv,null,()=>{document.getElementById('diceResult').textContent=`🚶 Walking — moved ${mv} spaces.`;afterRoll(player,mv);});
                },3000);
            } else {
                document.getElementById('diceResult').textContent=`${DICE_FACES[die1]} = ${die1} 🚗 It started!`;
                showCardOverlay('🚗','HOOPTY','It Started!',`${player.name} rolled ${die1}! Rolling 2 dice to move.`,'good',()=>{
                    const m1=Math.ceil(Math.random()*6),m2=Math.ceil(Math.random()*6);
                    animateDice(d1El,d2El,m1,m2,()=>{document.getElementById('diceResult').textContent=`${DICE_FACES[m1]} ${DICE_FACES[m2]} = ${m1+m2}`;afterRoll(player,m1+m2);});
                },3000);
            }
        });return;
    }
    if(player.carLevel<=1){
        const label=player.carLevel===0?'🚶 On Foot':'🚲 Bicycle';
        const die1=Math.ceil(Math.random()*6);
        animateDice(d1El,d2El,die1,null,()=>{document.getElementById('diceResult').textContent=`${DICE_FACES[die1]} = ${die1} (${label})`;afterRoll(player,die1);});
        return;
    }
    const die1=Math.ceil(Math.random()*6),die2=Math.ceil(Math.random()*6);
    animateDice(d1El,d2El,die1,die2,()=>{document.getElementById('diceResult').textContent=`${DICE_FACES[die1]} ${DICE_FACES[die2]} = ${die1+die2}${die1===die2?' 🎲 DOUBLES!':''}`;afterRoll(player,die1+die2);});
}

// After roll — animate avatar hopping space by space
function afterRoll(player,steps){
    document.getElementById('gameMessage').textContent=`${player.name} rolled ${steps}! Moving...`;
    const oldPos=player.position;
    const newPos=(oldPos+steps)%36;
    const passedStart=(newPos<oldPos&&steps>0)||(newPos===0&&steps>0&&oldPos!==0);
    animatePlayerHop(player,steps,()=>{
        player.turnsPlayed++;renderPlayerBar();
        if(passedStart){
            player.laps++;sfx.payday();const bill=collectRent(player);
            let lapMsg=`${player.name} passed START! Lap ${player.laps}\n📥 Payday: ${fmt(bill.gross)}`;
            if(bill.rent>0) lapMsg+=`  🏠 -${fmt(bill.rent)}`;
            if(bill.carPay>0) lapMsg+=`  🚗 -${fmt(bill.carPay)}`;
            lapMsg+=`\n✅ Net: ${fmt(bill.net)} | Balance: ${fmt(player.money)}`;
            const _beat=STORY_BEATS[player.laps]; if(_beat){ lapMsg+='\n\n'+_beat; adjustHappiness(player,0.5); }
            document.getElementById('gameMessage').textContent=lapMsg;renderPlayerBar();
        }
        setTimeout(()=>{
            document.getElementById('gameMessage').textContent=`${player.name} landed on: ${BOARD_SPACES[newPos].name}`;
            setTimeout(()=>{ checkStealOpportunity(player,newPos,()=>landOnSpace(player,BOARD_SPACES[newPos])); },1000);
        },400);
    });
}

// ── JAIL ──────────────────────────────────────────────────
function handleJailRoll(player,d1El,d2El){const die1=Math.ceil(Math.random()*6),die2=Math.ceil(Math.random()*6);animateDice(d1El,d2El,die1,die2,()=>{document.getElementById('diceResult').textContent=`${DICE_FACES[die1]} ${DICE_FACES[die2]} = ${die1+die2}${die1===die2?' 🎲 DOUBLES!':''}`;handleJailTurn(player,die1===die2,die1+die2);});}
function handleJailTurn(player,doubles,total){
    if(doubles){player.inJail=false;unlockAch(player,'jailbreak');if(player.vehicleSeized>0){player.carLevel=player.vehicleSeized;player.vehicleSeized=0;player.carImpounded=false;}renderPlayerBar();showCardOverlay('🎲','JAIL BREAK','Doubles! Free!',`${player.name} rolled doubles and escaped from: ${player.jailReason}!`,'good',()=>afterRoll(player,total));return;}
    player.jailTurns++;
    if(player.jailTurns>=player.jailMaxTurns){
        const imp=player.vehicleSeized>0?CARS[player.vehicleSeized].impound:0,tot=player.jailFine+imp;
        if(player.money>=tot){charge(player,tot);if(player.vehicleSeized>0){player.carLevel=player.vehicleSeized;player.vehicleSeized=0;player.carImpounded=false;}player.inJail=false;player.jailTurns=0;adjustHappiness(player,-0.5);renderPlayerBar();showCardOverlay('⛓️','RELEASED',`Paid ${fmt(tot)}`,`${player.name} paid bail and released from: ${player.jailReason}`,'bad',()=>{gameState.rollsLeft=1;endTurn();});}
        else{gameState.phase='over';showCardOverlay('🚔','GAME OVER',"Can't Afford Bail",`${player.name} can't afford bail of ${fmt(tot)}. Rotting in prison!`,'bad',()=>showGameOver(player));}
    } else {renderPlayerBar();showCardOverlay('⛓️','STILL IN JAIL',`Turn ${player.jailTurns}/${player.jailMaxTurns}`,`${player.name} stays in jail (${player.jailReason}). Bail: ${fmt(player.jailFine)}`,'bad',()=>{gameState.rollsLeft=1;endTurn();});}
}
function payBailEarly(){
    const player=gameState.players[gameState.currentPlayerIndex];if(!player.inJail) return;
    const imp=player.vehicleSeized>0?CARS[player.vehicleSeized].impound:0,tot=player.jailFine+imp;
    if(player.money>=tot){charge(player,tot);if(player.vehicleSeized>0){player.carLevel=player.vehicleSeized;player.vehicleSeized=0;player.carImpounded=false;}player.inJail=false;player.jailTurns=0;renderPlayerBar();showCardOverlay('⛓️','RELEASED','Bail Paid!',`${player.name} paid ${fmt(tot)} bail and is free!`,'good',()=>{renderPlayerBar();updateCurrentPlayerDisplay();});}
    else showCardOverlay('💸','CANT PAY','Not Enough',`${player.name} needs ${fmt(tot)} but only has ${fmt(player.money)}.`,'bad');
}

function collectRent(player){
    const gross=player.job==='Unemployed'?0:player.jobPay;
    const rent=(player.housingLevel>=2&&player.housingLevel<13)?HOUSING[player.housingLevel].rent:0;
    const carPay=(player.carLevel>=2)?CARS[player.carLevel].payment:0;
    const bills=rent+carPay;const net=gross-bills;
    player.money+=gross;charge(player,bills);
    return{gross,rent,carPay,bills,net};
}

// ── SHOWDOWN / THEFT — same-square vehicle steal ─────────
// Rule: it's only a legit steal if the vehicle is an UPGRADE for the thief.
// Anything else is THEFT: after the roll-off the thief must roll two dice —
// doubles = gets away clean, anything else = straight to jail.
function checkStealOpportunity(movingPlayer,newPos,callback){
    const targets=gameState.players.filter(p=>p.id!==movingPlayer.id&&p.position===newPos&&p.carLevel>0);
    if(!targets.length){callback();return;}
    const target=targets[0];
    const upgrade=isCarUpgrade(movingPlayer.carLevel,target.carLevel);
    gameState.stealContext={thief:movingPlayer,victim:target,callback,upgrade,stage:1};
    document.getElementById('stealTitle').textContent=upgrade?'⚡ VEHICLE SHOWDOWN ⚡':'🚨 THEFT 🚨';
    document.getElementById('stealDesc').textContent=upgrade
        ?`${movingPlayer.name} landed on ${target.name}'s space!\nUp for grabs: ${CARS[target.carLevel].icon} ${CARS[target.carLevel].name} (an upgrade!)\nBoth roll — highest wins the vehicle!`
        :`${movingPlayer.name} landed on ${target.name}'s space!\n${CARS[target.carLevel].icon} ${CARS[target.carLevel].name} is NOT an upgrade for you — taking it is THEFT!\nAfter the roll-off you must roll doubles to stay out of jail.`;
    const av1=document.getElementById('showdownAv1'),av2=document.getElementById('showdownAv2');
    if(av1) renderAvatar(av1,movingPlayer.avatar,44);if(av2) renderAvatar(av2,target.avatar,44);
    document.getElementById('showdownName1').textContent=movingPlayer.name;
    document.getElementById('showdownName2').textContent=target.name;
    document.getElementById('showdownDie1').textContent='🎲';document.getElementById('showdownDie2').textContent='🎲';
    document.getElementById('stealResult').textContent='';
    const rb=document.getElementById('stealRollBtn');rb.disabled=false;rb.textContent=upgrade?'🎲 ROLL OFF!':'🎲 STEAL ANYWAY (RISK JAIL)';rb.onclick=resolveSteal;
    const sk=document.getElementById('stealSkipBtn');if(sk){sk.disabled=false;sk.style.display='';}
    document.getElementById('stealOverlay').classList.remove('hidden');
    if(!upgrade) sfx.siren(); else sfx.steal();
}
function skipSteal(){
    const ctx=gameState.stealContext;if(!ctx) return;
    document.getElementById('stealOverlay').classList.add('hidden');gameState.stealContext=null;ctx.callback();
}
function _rollTwoInto(sd1,sd2,d1,d2,onDone){
    sfx.roll();sd1.classList.add('rolling');sd2.classList.add('rolling');
    let ticks=0;const iv=setInterval(()=>{
        sd1.textContent=DICE_FACES[Math.floor(Math.random()*6)+1];sd2.textContent=DICE_FACES[Math.floor(Math.random()*6)+1];ticks++;
        if(ticks>8){clearInterval(iv);sd1.classList.remove('rolling');sd2.classList.remove('rolling');sd1.textContent=DICE_FACES[d1];sd2.textContent=DICE_FACES[d2];onDone();}
    },80);
}
function resolveSteal(){
    const ctx=gameState.stealContext;if(!ctx) return;
    const{thief,victim,callback,upgrade}=ctx;
    document.getElementById('stealRollBtn').disabled=true;
    const sk=document.getElementById('stealSkipBtn');if(sk) sk.disabled=true;
    const d1=Math.ceil(Math.random()*6),d2=Math.ceil(Math.random()*6);
    const sd1=document.getElementById('showdownDie1'),sd2=document.getElementById('showdownDie2');
    _rollTwoInto(sd1,sd2,d1,d2,()=>{
        let result='';
        if(d1>d2){const sl=victim.carLevel;victim.carLevel=0;thief.carLevel=sl;adjustHappiness(thief,1);adjustHappiness(victim,-1);unlockAch(thief,'untouchable');unlockAch(victim,'jacked');sfx.steal();result=`🏆 ${thief.name} wins! (${d1} vs ${d2})\n${upgrade?'STEAL SUCCESS!':'THEFT SUCCESS!'} Grabbed the ${CARS[sl].icon} ${CARS[sl].name}!\n${victim.name} is left on foot! 😤`;}
        else if(d2>d1){adjustHappiness(victim,0.5);result=`🛡️ ${victim.name} defends! (${d2} vs ${d1})\n${victim.name} fought off ${thief.name} and kept their ride! 💪`;}
        else result=`🤝 TIE! Both rolled ${d1}!\n${victim.name} keeps the vehicle on a tie.`;
        document.getElementById('stealResult').textContent=result;renderPlayerBar();updatePlayerPieces();
        if(upgrade){
            setTimeout(()=>{document.getElementById('stealOverlay').classList.add('hidden');gameState.stealContext=null;callback();},4000);
        } else {
            // THEFT: now the thief rolls for their freedom
            ctx.stage=2;
            const rb=document.getElementById('stealRollBtn');
            setTimeout(()=>{
                document.getElementById('stealResult').textContent=result+`\n\n🚨 That was THEFT, ${thief.name}! Roll doubles to stay out of jail.`;
                rb.textContent='🎲 ROLL FOR YOUR FREEDOM';rb.disabled=false;rb.onclick=resolveTheftRoll;
            },2200);
        }
    });
}
function resolveTheftRoll(){
    const ctx=gameState.stealContext;if(!ctx) return;
    const{thief,callback}=ctx;
    document.getElementById('stealRollBtn').disabled=true;
    const d1=Math.ceil(Math.random()*6),d2=Math.ceil(Math.random()*6);
    const sd1=document.getElementById('showdownDie1'),sd2=document.getElementById('showdownDie2');
    document.getElementById('showdownName2').textContent=thief.name+' (bail roll)';
    _rollTwoInto(sd1,sd2,d1,d2,()=>{
        const doubles=d1===d2;
        if(doubles){
            sfx.safe();
            document.getElementById('stealResult').textContent=`🎲 DOUBLES (${d1} & ${d2})!\n${thief.name} got away clean — no jail! 😎`;
            setTimeout(()=>{document.getElementById('stealOverlay').classList.add('hidden');gameState.stealContext=null;callback();},3000);
        } else {
            sendToJail(thief,'Grand Theft Auto');
            sfx.caught();
            document.getElementById('stealResult').textContent=`${DICE_FACES[d1]} ${DICE_FACES[d2]} — no doubles!\n🚔 ${thief.name} was caught and goes to JAIL!${thief.vehicleSeized>0?'\n'+CARS[thief.vehicleSeized].icon+' '+CARS[thief.vehicleSeized].name+' impounded!':''}`;
            renderPlayerBar();updatePlayerPieces();
            setTimeout(()=>{document.getElementById('stealOverlay').classList.add('hidden');gameState.stealContext=null;endTurn();},4000);
        }
    });
}

// ── LAND ON SPACE ─────────────────────────────────────────
function landOnSpace(player,space){
    if(!space){endTurn();return;}
    try{
        switch(space.type){
            case 'corner':   handleCorner(player,space);break;
            case 'payday':   handlePayday(player);break;
            case 'good':     handleGoodSpace(player,space);break;
            case 'bad':      handleBadSpace(player,space);break;
            case 'house':    handleHouseSpace(player,space);break;
            case 'car':      handleCarDealerSpace(player,space);break;
            case 'realtor':  handleRealtorSpace(player,space);break;
            case 'job':      handleJobOffice(player);break;
            case 'jcard':    handleJobCard(player);break;
            case 'hustle':   handleHustle(player,space);break;
            case 'fastfood': handleFastFood(player,space);break;
            default:         endTurn();break;
        }
    }catch(e){console.error('landOnSpace error:',e);endTurn();}
}

function handleCorner(player,space){
    if(space.id===0) showCardOverlay('🏁','START','Back at the Beginning!',`${player.name} landed on START!`,'good',()=>endTurn());
    else if(space.id===9) showCardOverlay('⛓️','JAIL','Just Visiting',`${player.name} is just visiting!`,''  ,()=>endTurn());
    else if(space.id===18){adjustHappiness(player,0.5);renderPlayerBar();showCardOverlay('🎁','FREE DAY','Nothing Happens! +0.5 Mood',`${player.name} gets a free day! +0.5 Happiness`,'good',()=>endTurn());}
    else if(space.id===27){sendToJail(player);renderPlayerBar();updatePlayerPieces();showCardOverlay('🚔','GO TO JAIL','Busted!',`${player.name} is going to jail!\nReason: ${player.jailReason}\nUp to ${player.jailMaxTurns} turns | Bail: ${fmt(player.jailFine)}${player.vehicleSeized>0?'\n'+CARS[player.vehicleSeized].icon+' '+CARS[player.vehicleSeized].name+' impounded!':''}`, 'bad',()=>endTurn());}
}
function handlePayday(player){
    if(player.job==='Unemployed'){
        const rent=(player.housingLevel>=2&&player.housingLevel<13)?HOUSING[player.housingLevel].rent:0;
        const carPay=(player.carLevel>=2)?CARS[player.carLevel].payment:0;
        const bills=rent+carPay;
        charge(player,bills);
        adjustHappiness(player,-0.5);
        renderPlayerBar();
        let body=`😤 No job, no paycheck!\n━━━━━━━━━━━━━━━━━━\n`;
        if(rent>0)   body+=`🏠 ${HOUSING[player.housingLevel].name}:  -${fmt(rent)}\n`;
        if(carPay>0) body+=`🚗 ${CARS[player.carLevel].name}:    -${fmt(carPay)}\n`;
        if(bills===0) body+='Nothing owed either. Go find a job!\n';
        body+=`━━━━━━━━━━━━━━━━━━\n💰 Balance: ${fmt(player.money)}\n\nVisit the Job Office!`;
        showCardOverlay('💸','NO PAYDAY','Get a Job!',body,'bad',()=>endTurn());
        return;
    }
    const bill=collectRent(player);adjustHappiness(player,0.5);renderPlayerBar();
    const house=HOUSING[player.housingLevel],car=CARS[player.carLevel];
    let body=`💼 ${player.job}\n━━━━━━━━━━━━━━━━━━\n📥 Payday:        ${fmt(bill.gross)}\n`;
    if(bill.rent>0) body+=`🏠 ${house.name}:  -${fmt(bill.rent)}\n`;
    if(bill.carPay>0) body+=`🚗 ${car.name}:    -${fmt(bill.carPay)}\n`;
    body+=`━━━━━━━━━━━━━━━━━━\n✅ Net Deposit:   ${fmt(bill.net)}\n💰 Balance:       ${fmt(player.money)}`;
    showCardOverlay('💰','PAYDAY',player.name+' gets paid!',body,'good',()=>checkWinThenEnd(player));
}
function handleGoodSpace(player,space){
    if(space.name==='Vacation Pay'){
        if(player.job==='Unemployed'){adjustHappiness(player,-0.5);renderPlayerBar();showCardOverlay('✈️','VACATION PAY','No Job, No Vacation Pay',`${player.name} is unemployed — no vacation days!\nGet a job first.`,'bad',()=>endTurn());}
        else{player.money+=player.jobPay;adjustHappiness(player,0.5);renderPlayerBar();showCardOverlay('✈️','VACATION PAY','Enjoy the Time Off!',`${player.name} cashed in vacation days from ${player.job}!\n\n+${fmt(player.jobPay)} deposited.`,'good',()=>checkWinThenEnd(player));}
    } else {const card=drawCard(getGoodCards());const result=card.effect(player);renderPlayerBar();showCardOverlay(card.icon,'GOOD CARD',card.name,result[1],result[2]||'good',()=>checkWinThenEnd(player));}
}
function handleBadSpace(player,space){
    if(space.name==='TAXES'){const assets=player.money+HOUSING[player.housingLevel].price+CARS[player.carLevel].price;const t=Math.max(1,Math.round(assets*0.10));charge(player,t);adjustHappiness(player,-0.5);renderPlayerBar();showCardOverlay('📋','TAXES','Pay 10%!',`${player.name} owes 10% on assets (${fmt(assets)})! Tax: ${fmt(t)}`,'bad',()=>endTurn());}
    else if(space.name==='Hospital'){const mb=scaledFine(player,500);charge(player,mb);adjustHappiness(player,-0.5);renderPlayerBar();if(player.carLevel>0) showTowChoice(player,mb,300,()=>endTurn());else showCardOverlay('🏥','HOSPITAL','Emergency Visit!',`${player.name} paid ${fmt(mb)} in medical bills!`,'bad',()=>endTurn());}
    else{const card=drawCard(getBadCards());const result=card.effect(player);renderPlayerBar();showCardOverlay(card.icon,'BAD CARD',card.name,result[1],result[2]||'bad',()=>endTurn());}
}
function showTowChoice(player,medBill,towFee,callback){
    const popup=document.getElementById('popup'),content=popup.querySelector('.popup-content');
    document.getElementById('popupTitle').textContent='🚗 Car Towed!';
    document.getElementById('popupMessage').textContent=`${player.name} was in the hospital — ${CARS[player.carLevel].icon} got towed!\n\nMedical: ${fmt(medBill)} (paid)\nImpound: ${fmt(towFee)}\n\nPay to get car back?`;
    content.className='popup-content popup-bad';popup.classList.remove('hidden');content.querySelectorAll('button').forEach(b=>b.remove());
    const yes=document.createElement('button');yes.className='btn';yes.style.marginRight='10px';yes.textContent='PAY $300';
    yes.onclick=()=>{if(player.money>=towFee){charge(player,towFee);renderPlayerBar();closePopup();showCardOverlay('🚗','CAR BACK','Paid!',`${player.name} paid ${fmt(towFee)} impound.`,'good',()=>callback());}else{closePopup();player.carLevel=0;renderPlayerBar();showCardOverlay('💸','CANT PAY','Left the Car',`${player.name} can't afford impound. Car left behind.`,'bad',()=>callback());}};
    const no=document.createElement('button');no.className='btn';no.style.background='linear-gradient(135deg,#0f3460,#16213e)';no.textContent='LEAVE CAR';
    no.onclick=()=>{closePopup();player.carLevel=0;renderPlayerBar();showCardOverlay('🚗','LEFT BEHIND','Car Gone',`${player.name} left the car in impound.`,'bad',()=>callback());};
    content.appendChild(yes);content.appendChild(no);
}
function handleHouseSpace(player,space){
    const tier=space.tier||'budget';const tr={budget:{min:0,max:5},mid:{min:3,max:9},luxury:{min:8,max:13}}[tier];
    const cur=HOUSING[player.housingLevel];const nl=player.housingLevel+1;
    if(player.housingLevel>=HOUSING.length-1){showCardOverlay('🏰','HOUSING','Maxed Out!',`${player.name} already lives in ${cur.name}!`,'good',()=>endTurn());return;}
    if(nl>tr.max){showCardOverlay('🔒','WRONG DEALER','Out of Range',`${space.name} sells levels ${tr.min}–${tr.max}. Current: level ${player.housingLevel}.`,'bad',()=>endTurn());return;}
    const lapsNeeded=HOUSING[nl].lapReq||0;
    if((player.laps||0)<lapsNeeded){showCardOverlay('🔒','LOCKED',`Lap ${lapsNeeded} Required`,`${player.name} needs Lap ${lapsNeeded} for ${HOUSING[nl].name}.`,'bad',()=>endTurn());return;}
    const next=HOUSING[nl],cost=Math.max(0,next.price-cur.price),rentInfo=next.rent>0?`\nRent: ${fmt(next.rent)}/lap`:'';
    const nd=(nl===1&&player.carLevel>=2)?{icon:'🚗',name:'Car Living'}:{icon:next.icon,name:next.name};
    showUpgradePopup(`🏠 ${space.name}`,`${player.name}: ${cur.icon} ${cur.name} → ${nd.icon} ${nd.name}\nCost: ${cost>0?fmt(cost):'FREE!'}${rentInfo}`,'MOVE IN!',()=>{
        if(player.money>=cost){player.money-=cost;player.housingLevel=nl;animateAssetIcon('apHousingIcon');renderPlayerBar();closePopup();showCardOverlay('🏠','UPGRADED!',next.icon+' '+next.name,`${player.name} upgraded!`,'good',()=>checkWinThenEnd(player));}
        else{closePopup();showCardOverlay('💸','CANT AFFORD IT','Not Enough',`${player.name} needs ${fmt(cost)} but has ${fmt(player.money)}`,'bad',()=>endTurn());}
    },()=>{closePopup();endTurn();});
}
function handleCarDealerSpace(player,space){
    const tr={4:{min:0,max:4},12:{min:2,max:7},25:{min:5,max:10}}[space.id]||{min:0,max:10};
    const cur=CARS[player.carLevel];const nl=player.carLevel+1;
    if(player.carLevel>=CARS.length-1){showCardOverlay('🚀','CAR DEALER','Maxed Out!',`${player.name} already drives a ${cur.name}!`,'good',()=>endTurn());return;}
    if(nl>tr.max){showCardOverlay('🔒','WRONG DEALER','Out of Range',`${space.name} sells levels ${tr.min}–${tr.max}.`,'bad',()=>endTurn());return;}
    const lapsNeeded=carLapRequired(nl);
    if((player.laps||0)<lapsNeeded){showCardOverlay('🔒','LOCKED',`Lap ${lapsNeeded} Required`,`${player.name} needs Lap ${lapsNeeded} for ${CARS[nl].name}.`,'bad',()=>endTurn());return;}
    const next=CARS[nl],cost=Math.max(0,next.price-cur.price),payInfo=next.payment>0?`\nPayment: ${fmt(next.payment)}/lap`:'';
    showUpgradePopup(`🚗 ${space.name}`,`${player.name}: ${cur.icon} ${cur.name} → ${next.icon} ${next.name}\nCost: ${cost>0?fmt(cost):'FREE!'}${payInfo}`,'BUY IT!',()=>{
        if(player.money>=cost){player.money-=cost;player.carLevel=nl;animateAssetIcon('apCarIcon');renderPlayerBar();closePopup();showCardOverlay('🚗','NEW RIDE!',next.icon+' '+next.name,`${player.name} got a new ride!`,'good',()=>checkWinThenEnd(player));}
        else{closePopup();showCardOverlay('💸','CANT AFFORD IT','Not Enough',`${player.name} needs ${fmt(cost)} but has ${fmt(player.money)}`,'bad',()=>endTurn());}
    },()=>{closePopup();endTurn();});
}
function handleRealtorSpace(player,space){
    const available=HOUSING.filter((h,i)=>i>player.housingLevel&&(player.laps||0)>=(h.lapReq||0));
    if(!available.length){showCardOverlay('🏢','REALTOR','Nothing Available',`${player.name} doesn't qualify for any upgrades yet.`,'bad',()=>endTurn());return;}
    const best=available[available.length-1],cost=Math.max(0,best.price-HOUSING[player.housingLevel].price);
    showUpgradePopup(`🏢 ${space.name}`,`${player.name}: ${best.icon} ${best.name}\nCost: ${fmt(cost)}\nRent: ${best.rent>0?fmt(best.rent)+'/lap':'none'}`,'BEST UPGRADE',()=>{
        if(player.money>=cost){player.money-=cost;player.housingLevel=HOUSING.indexOf(best);animateAssetIcon('apHousingIcon');renderPlayerBar();closePopup();showCardOverlay('🏢','UPGRADED!',best.icon+' '+best.name,`${player.name} moved into ${best.name}!`,'good',()=>checkWinThenEnd(player));}
        else{closePopup();showCardOverlay('💸','CANT AFFORD IT','Not Enough',`${player.name} needs ${fmt(cost)}.`,'bad',()=>endTurn());}
    },()=>{closePopup();endTurn();});
}
function showUpgradePopup(title,message,yesText,onYes,onNo){
    const popup=document.getElementById('popup'),content=popup.querySelector('.popup-content');
    document.getElementById('popupTitle').textContent=title;document.getElementById('popupMessage').textContent=message;
    content.className='popup-content popup-good';popup.classList.remove('hidden');content.querySelectorAll('button').forEach(b=>b.remove());
    const yes=document.createElement('button');yes.className='btn';yes.style.marginRight='10px';yes.textContent=yesText;yes.onclick=onYes;
    const no=document.createElement('button');no.className='btn';no.style.background='linear-gradient(135deg,#0f3460,#16213e)';no.textContent='PASS';no.onclick=onNo;
    content.appendChild(yes);content.appendChild(no);
}

let _cardDismissCallback=null;
function showCardOverlay(icon,typeLabel,title,body,type,onDismiss){
    const overlay=document.getElementById('cardOverlay'),display=document.getElementById('cardDisplay');
    document.getElementById('cardIcon').textContent=icon;document.getElementById('cardTypeLabel').textContent=typeLabel;document.getElementById('cardTitle').textContent=title;document.getElementById('cardBody').textContent=body;
    display.className='card-display';if(type==='good') display.classList.add('card-good');else if(type==='bad') display.classList.add('card-bad');else if(type==='sarcastic') display.classList.add('card-sarcastic');
    _cardDismissCallback=onDismiss||null;
    { const _t=(typeLabel+' '+title).toUpperCase();
      if(_t.indexOf('JAIL BREAK')>=0) sfx.jailbreak();
      else if(_t.indexOf('JAIL')>=0||_t.indexOf('DUI')>=0||_t.indexOf('BUSTED')>=0) sfx.jail();
      else if(type==='good') sfx.good(); else if(type==='bad') sfx.bad(); else sfx.click(); }
    const btn=document.getElementById('cardContinueBtn');
    if(btn){btn.style.display='block';btn.textContent=type==='good'?'▶ NICE!':type==='bad'?'▶ UGH OK':'▶ GOT IT';btn.onclick=()=>{if(!_cardDismissCallback){overlay.classList.add('hidden');return;}const cb=_cardDismissCallback;_cardDismissCallback=null;btn.style.display='none';overlay.classList.add('hidden');updateLastCardBanner(icon,typeLabel,title,type);cb();};}
    overlay.classList.remove('hidden');
}
function updateLastCardBanner(icon,label,title,type){
    const banner=document.getElementById('lastCardBanner');if(!banner) return;
    banner.textContent=icon+' '+label+': '+title;banner.className='last-card-banner';
    if(type==='good') banner.classList.add('lcb-good');else if(type==='bad') banner.classList.add('lcb-bad');else if(type==='sarcastic') banner.classList.add('lcb-sarcastic');
    banner.classList.remove('hidden');
}
function hideCardOverlay(){_cardDismissCallback=null;document.getElementById('cardOverlay').classList.add('hidden');}

function handleJobOffice(player){
    const available=getAvailableJobs(player);const better=available.filter(j=>j.pay>player.jobPay);const pool=better.length>0?better:available;const offer=rnd(pool);const laps=player.laps||0;
    let nu=laps<15?`\nEntry-level jobs unlock at Lap 15 (${15-laps} away)`:laps<30?`\nMid-level jobs at Lap 30 (${30-laps} away)`:laps<45?`\nSenior jobs at Lap 45 (${45-laps} away)`:'All jobs unlocked!';
    showUpgradePopup('💼 Job Office — '+getTierLabel(laps),`${player.name}, job offer:\n${offer.icon} ${offer.name} | Payday: ${fmt(offer.pay)}\nCurrent: ${player.job} (${fmt(player.jobPay)})${nu}`,'TAKE IT!',()=>{
        player.job=offer.name;player.jobPay=offer.pay;adjustHappiness(player,0.5);unlockAch(player,'first_job');renderPlayerBar();closePopup();
        showCardOverlay('💼','NEW JOB!',offer.icon+' '+offer.name,`${player.name} is now ${offer.name}! Payday: ${fmt(offer.pay)}`,'good',()=>checkWinThenEnd(player));
    },()=>{closePopup();endTurn();});
}
function handleJobCard(player){const card=drawCard(JOB_CARDS);const result=card.effect(player);renderPlayerBar();showCardOverlay(card.icon,'JOB CARD',card.name,result,result.includes('FIRED')?'bad':'good',()=>checkWinThenEnd(player));}
function handleHouseTowChoice(player){const card=drawCard(HOUSING_CARDS);const result=card.effect(player);renderPlayerBar();showCardOverlay(card.icon||'🏘️','HOUSE CARD',card.name,result[1],result[2]||'bad',()=>checkWinThenEnd(player));}
function handleFastFood(player,space){
    const data=FAST_FOOD_DATA[space.name];if(!data){endTurn();return;}
    const order=data.menu[Math.floor(Math.random()*data.menu.length)];const sp=scaledFine(player,order.price);charge(player,sp);adjustHappiness(player,0.5);renderPlayerBar();
    showCardOverlay(data.icon,space.name.toUpperCase(),order.item+' — '+fmt(sp),order.msg+'\n\n'+player.name+' spent '+fmt(sp)+' at '+space.name+'.','bad',()=>checkWinThenEnd(player));
}
function handleHustle(player,space){
    const data=(gameState.boardMode==='funny'&&FUNNY_HUSTLE_OVERRIDES[space.name])?FUNNY_HUSTLE_OVERRIDES[space.name]:HUSTLE_DATA[space.name];
    if(!data){endTurn();return;}
    // Pure random — pick from the full combined pool, no dice involved
    const allOutcomes=[...data.bad,...data.good];
    const picked=allOutcomes[Math.floor(Math.random()*allOutcomes.length)];
    const earn=picked.earn;
    if(earn>0){player.money+=earn;adjustHappiness(player,0.5);}else if(earn<0){charge(player,Math.abs(earn));adjustHappiness(player,-0.5);}
    renderPlayerBar();
    document.getElementById('gameMessage').textContent=`${player.name} hustling — ${space.name}!`;
    showCardOverlay(space.icon,'HUSTLE — '+space.name,earn>0?'+'+fmt(earn):earn<0?'-'+fmt(Math.abs(earn)):'Nothing',picked.msg,earn>0?'good':earn<0?'bad':'sarcastic',()=>checkWinThenEnd(player));
}

// ── WIN / END ─────────────────────────────────────────────
function checkWinThenEnd(player){if(!checkWin(player)) endTurn();}
// Each player gets RULES.TURN_ROLLS (5) rolls in a row before play passes on.
// endTurn() is called once per finished roll. Jail ends the whole turn (rollsLeft is set to 1 in sendToJail).
function endTurn(){
    if(gameState.phase==='over') return;
    const player=gameState.players[gameState.currentPlayerIndex];
    if(checkWin(player)) return;
    if(gameState.rollsLeft==null) gameState.rollsLeft=RULES.TURN_ROLLS;
    gameState.rollsLeft--;
    if(gameState.rollsLeft>0){ renderPlayerBar();updateCurrentPlayerDisplay(); return; }
    gameState.rollsLeft=RULES.TURN_ROLLS;
    gameState.currentPlayerIndex=(gameState.currentPlayerIndex+1)%gameState.numPlayers;
    renderPlayerBar();updateCurrentPlayerDisplay();
    if(gameState.numPlayers>1) sfx.yourTurn();
}
function checkWin(player){if(netWorth(player)>=gameState.winGoal){showWin(player);return true;}return false;}
function showWin(player){
    gameState.phase='over';unlockAch(player,'champion');sfx.fanfare();let ws=document.getElementById('winScreen');
    if(!ws){ws=document.createElement('div');ws.id='winScreen';ws.className='screen hidden';ws.innerHTML=`<div class="win-content"><h1>🏆 WINNER! 🏆</h1><div id="winnerAvatar" style="font-size:5em"></div><div id="winnerName" style="font-size:2em;color:#4ecca3;margin:10px 0"></div><div id="winStory" style="color:#cdd4e6;font-size:0.95em;line-height:1.6;margin:6px 0 14px;white-space:pre-line"></div><div class="win-stats" id="winStats"></div><button class="btn" onclick="location.reload()">PLAY AGAIN!</button></div>`;document.body.appendChild(ws);}
    renderAvatar(document.getElementById('winnerAvatar'),player.avatar,100);
    document.getElementById('winnerName').textContent=`${player.name} WON!`;
    const _ws=document.getElementById('winStory'); if(_ws) _ws.textContent='From a prison cot to '+HOUSING[player.housingLevel].name+' and a net worth of '+fmt(netWorth(player))+'.\n'+(player.laps||0)+' laps. Started with nothing but a parole slip.\n\n\u260E\uFE0F Sully (P.O.): "I had money on you failing. Best bet I ever lost. Get outta here, mogul."';
    document.getElementById('winStats').innerHTML=`<div class="win-stat"><div class="win-stat-label">Net Worth</div><div class="win-stat-value">${fmt(netWorth(player))}</div></div><div class="win-stat"><div class="win-stat-label">Cash</div><div class="win-stat-value">${fmt(player.money)}</div></div><div class="win-stat"><div class="win-stat-label">Mood</div><div class="win-stat-value">${player.happiness.toFixed(1)}/10</div></div><div class="win-stat"><div class="win-stat-label">Home</div><div class="win-stat-value">${HOUSING[player.housingLevel].icon} ${HOUSING[player.housingLevel].name}</div></div><div class="win-stat"><div class="win-stat-label">Car</div><div class="win-stat-value">${CARS[player.carLevel].icon} ${CARS[player.carLevel].name}</div></div><div class="win-stat"><div class="win-stat-label">Laps</div><div class="win-stat-value">\u{1F504} ${player.laps||0}</div></div>`;
    const _wc=document.querySelector('#winScreen .win-content'); if(_wc){ let _wb=document.getElementById('winBadges'); if(!_wb){ _wb=document.createElement('div'); _wb.id='winBadges'; _wb.className='win-badges'; const _btn=_wc.querySelector('button'); _wc.insertBefore(_wb,_btn); } const earned=(player.achievements||[]).map(id=>ACH_BY_ID[id]).filter(Boolean); _wb.innerHTML='<div class="wb-title">RAP SHEET — '+earned.length+'/'+ACHIEVEMENTS.length+' EARNED</div>'+earned.map(a=>`<div class="wb" title="${a.name}">${a.icon}</div>`).join(''); }
    showScreen('winScreen');
}
function showGameOver(player){
    let ws=document.getElementById('winScreen');
    if(!ws){ws=document.createElement('div');ws.id='winScreen';ws.className='screen hidden';ws.innerHTML=`<div class="win-content" style="border-color:#e94560;box-shadow:0 0 50px rgba(233,69,96,0.5)"><h1 style="color:#e94560">🚔 GAME OVER 🚔</h1><div id="winnerAvatar" style="font-size:5em"></div><div id="winnerName" style="font-size:2em;color:#e94560;margin:10px 0"></div><p style="color:#a8a8b3">Rotting in prison. Better luck next time!</p><button class="btn" onclick="location.reload()">TRY AGAIN!</button></div>`;document.body.appendChild(ws);}
    renderAvatar(document.getElementById('winnerAvatar'),player.avatar,100);
    document.getElementById('winnerName').textContent=`${player.name} is done!`;
    showScreen('winScreen');
}
function showPopup(title,message,type){document.getElementById('popupTitle').textContent=title;document.getElementById('popupMessage').textContent=message;const popup=document.getElementById('popup');const content=popup.querySelector('.popup-content');content.className='popup-content'+(type==='good'?' popup-good':type==='bad'?' popup-bad':'');content.querySelectorAll('button').forEach(b=>b.remove());const ok=document.createElement('button');ok.className='btn';ok.textContent='OK!!';ok.onclick=closePopup;content.appendChild(ok);popup.classList.remove('hidden');}
function closePopup(){document.getElementById('popup').classList.add('hidden');}

// ============================================================
//  RAP SHEET — achievement system  (Drop 5 — self-contained)
//  Injects its own CSS + DOM. Touches no thresholds/mechanics.
// ============================================================
const ACHIEVEMENTS = [
    { id:'first_job',       icon:'💼', name:'Gainfully Employed', desc:'Land your first legit job.' },
    { id:'first_wheels',    icon:'🚗', name:'Got Wheels',         desc:'Buy your first real car.' },
    { id:'homeowner',       icon:'🏠', name:'Off the Streets',    desc:'Move into real housing.' },
    { id:'loaded',          icon:'💰', name:'Six Figures',        desc:'Stack $100,000 in the bank.' },
    { id:'lap_machine',     icon:'🔄', name:'Marathon',           desc:'Complete 25 laps around the block.' },
    { id:'sully_proud',     icon:'📞', name:"Sully's Pride",      desc:'Reach Lap 45 — senior-tier life.' },
    { id:'mood_master',     icon:'😊', name:'Living Good',        desc:'Max out your mood at 10/10.' },
    { id:'untouchable',     icon:'⚡', name:'Untouchable',        desc:'Win a vehicle showdown.' },
    { id:'jacked',          icon:'😤', name:'Got Jacked',         desc:'Lose your ride in a showdown.' },
    { id:'repeat_offender', icon:'⛓️', name:'Repeat Offender',    desc:'Get locked up 3 times.' },
    { id:'jailbreak',       icon:'🎲', name:'Jailbreak',          desc:'Roll doubles and bust out of jail.' },
    { id:'mansion',         icon:'🏰', name:'Made It',            desc:'Buy the top-tier home.' },
    { id:'champion',        icon:'👑', name:'Free at Last',       desc:'Win the game.' }
];
const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

// ── procedural sound (no assets) ─────────────────────────
// sfx now lives in sound.js (shared with online mode)

// ── unlock + checks ──────────────────────────────────────
function unlockAch(player, id){
    if(!player || !player.achievements) return;
    if(player.achievements.indexOf(id) !== -1) return;
    const ach = ACH_BY_ID[id]; if(!ach) return;
    player.achievements.push(id);
    sfx.chime();
    showAchToast(player, ach);
    const rs=document.getElementById('rapSheetOverlay');
    if(rs && !rs.classList.contains('hidden')) renderRapSheet();
}
function checkAchievements(p){
    if(!p || !p.achievements) return;
    if(p.money >= 100000) unlockAch(p,'loaded');
    if(p.carLevel >= 2) unlockAch(p,'first_wheels');
    if(p.housingLevel >= 2) unlockAch(p,'homeowner');
    if(p.housingLevel >= HOUSING.length-1) unlockAch(p,'mansion');
    if((p.laps||0) >= 25) unlockAch(p,'lap_machine');
    if((p.laps||0) >= 45) unlockAch(p,'sully_proud');
    if(p.happiness >= 10) unlockAch(p,'mood_master');
}

// ── UI injection (once) ──────────────────────────────────
let _achUIReady = false;
function injectAchUI(){
    if(_achUIReady) return; _achUIReady = true;
    const css = `
    #rapSheetBtn{position:fixed;right:14px;bottom:14px;z-index:1200;background:linear-gradient(135deg,#16213e,#0f3460);color:#f5a623;border:2px solid #f5a623;border-radius:14px;padding:9px 13px;font-weight:800;font-size:0.82rem;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);letter-spacing:.5px}
    #rapSheetBtn:hover{transform:translateY(-2px)}
    #rapSheetBtn .rs-count{color:#4ecca3}
    #rapSheetOverlay{position:fixed;inset:0;z-index:1300;background:rgba(6,8,22,.82);display:flex;align-items:center;justify-content:center;padding:18px}
    #rapSheetOverlay.hidden{display:none}
    .rs-card{width:min(560px,94vw);max-height:88vh;overflow:auto;background:linear-gradient(160deg,#1a1a2e,#0a0a1a);border:2px solid #f5a623;border-radius:18px;padding:18px 18px 22px;box-shadow:0 0 50px rgba(245,166,35,.35)}
    .rs-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
    .rs-title{font-size:1.4rem;font-weight:900;color:#f5a623;letter-spacing:1px}
    .rs-sub{color:#8b93ad;font-size:.78rem;margin-bottom:14px}
    .rs-actions{display:flex;gap:8px}
    .rs-iconbtn{background:#0f3460;border:1px solid #2a3a66;color:#cdd4e6;border-radius:10px;padding:6px 10px;cursor:pointer;font-size:1rem}
    .rs-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    @media(max-width:430px){.rs-grid{grid-template-columns:1fr}}
    .rs-badge{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.03);border:1px solid #242a45;border-radius:12px;padding:10px}
    .rs-badge.got{border-color:#4ecca3;background:linear-gradient(135deg,rgba(78,204,163,.14),rgba(78,204,163,.03))}
    .rs-badge .ic{font-size:1.6rem;filter:grayscale(1) opacity(.4);line-height:1}
    .rs-badge.got .ic{filter:none}
    .rs-badge .nm{font-weight:800;color:#7e88a6;font-size:.9rem}
    .rs-badge.got .nm{color:#eaf0ff}
    .rs-badge .ds{font-size:.74rem;color:#727b97;margin-top:2px;line-height:1.3}
    .rs-progress{margin:0 0 14px;height:8px;border-radius:6px;background:#11162b;overflow:hidden;border:1px solid #242a45}
    .rs-progress>i{display:block;height:100%;background:linear-gradient(90deg,#4ecca3,#f5a623);transition:width .4s}
    #achToastWrap{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:1400;display:flex;flex-direction:column;gap:8px;pointer-events:none;width:min(400px,92vw)}
    .ach-toast{pointer-events:none;background:linear-gradient(135deg,#1a1a2e,#0f3460);border:2px solid #4ecca3;border-radius:14px;padding:10px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 8px 30px rgba(0,0,0,.6);animation:achIn .35s cubic-bezier(.2,1.3,.5,1) both}
    .ach-toast.out{animation:achOut .4s ease forwards}
    .ach-toast .ti{font-size:2rem;line-height:1}
    .ach-toast .tt1{font-size:.66rem;letter-spacing:1.5px;color:#4ecca3;font-weight:800}
    .ach-toast .tt2{font-size:.98rem;font-weight:900;color:#fff}
    .ach-toast .tt3{font-size:.72rem;color:#aeb6cf}
    @keyframes achIn{from{opacity:0;transform:translateY(-22px) scale(.92)}to{opacity:1;transform:none}}
    @keyframes achOut{to{opacity:0;transform:translateY(-18px) scale(.96)}}
    .win-badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:14px 0 4px}
    .win-badges .wb{font-size:1.7rem;background:rgba(78,204,163,.12);border:1px solid #4ecca3;border-radius:12px;width:46px;height:46px;display:flex;align-items:center;justify-content:center}
    .win-badges .wb-title{width:100%;text-align:center;color:#f5a623;font-weight:800;font-size:.8rem;letter-spacing:1px;margin-bottom:2px}`;
    const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

    const btn=document.createElement('button'); btn.id='rapSheetBtn';
    btn.innerHTML='📋 RAP SHEET <span class="rs-count" id="rsBtnCount"></span>';
    btn.onclick=toggleRapSheet; document.body.appendChild(btn);

    const ov=document.createElement('div'); ov.id='rapSheetOverlay'; ov.className='hidden';
    ov.innerHTML=`<div class="rs-card">
        <div class="rs-head"><div class="rs-title">📋 RAP SHEET</div>
        <div class="rs-actions"><button class="rs-iconbtn" id="rsMuteBtn" title="Sound">${sfx.muted?'🔇':'🔊'}</button><button class="rs-iconbtn" onclick="toggleRapSheet()" title="Close">✕</button></div></div>
        <div class="rs-sub" id="rsSub"></div>
        <div class="rs-progress"><i id="rsBar"></i></div>
        <div class="rs-grid" id="rsGrid"></div></div>`;
    document.body.appendChild(ov);
    document.getElementById('rsMuteBtn').onclick=()=>sfx.toggle();
    ov.addEventListener('click',e=>{ if(e.target===ov) toggleRapSheet(); });

    const tw=document.createElement('div'); tw.id='achToastWrap'; document.body.appendChild(tw);
    updateRapSheetBtn();
}
function updateRapSheetBtn(){
    const c=document.getElementById('rsBtnCount'); if(!c) return;
    const p=gameState.players[gameState.currentPlayerIndex]; if(!p||!p.achievements) return;
    c.textContent=`${p.achievements.length}/${ACHIEVEMENTS.length}`;
}
function toggleRapSheet(){
    const ov=document.getElementById('rapSheetOverlay'); if(!ov) return;
    if(ov.classList.contains('hidden')){ renderRapSheet(); ov.classList.remove('hidden'); }
    else ov.classList.add('hidden');
}
function renderRapSheet(){
    const p=gameState.players[gameState.currentPlayerIndex]; if(!p||!p.achievements) return;
    const got=p.achievements.length, tot=ACHIEVEMENTS.length;
    const sub=document.getElementById('rsSub'); if(sub) sub.textContent=`${p.name}'s record — ${got} of ${tot} earned`;
    const bar=document.getElementById('rsBar'); if(bar) bar.style.width=(got/tot*100)+'%';
    const grid=document.getElementById('rsGrid'); if(!grid) return; grid.innerHTML='';
    ACHIEVEMENTS.forEach(a=>{
        const has=p.achievements.indexOf(a.id)!==-1;
        const d=document.createElement('div'); d.className='rs-badge'+(has?' got':'');
        d.innerHTML=`<div class="ic">${a.icon}</div><div><div class="nm">${has?a.name:'???'}</div><div class="ds">${has?a.desc:'Locked — keep grinding.'}</div></div>`;
        grid.appendChild(d);
    });
}
function showAchToast(player, ach){
    injectAchUI();
    const wrap=document.getElementById('achToastWrap'); if(!wrap) return;
    const t=document.createElement('div'); t.className='ach-toast';
    t.innerHTML=`<div class="ti">${ach.icon}</div><div><div class="tt1">RAP SHEET UNLOCKED</div><div class="tt2">${ach.name}</div><div class="tt3">${player.name} — ${ach.desc}</div></div>`;
    wrap.appendChild(t);
    setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),420); }, 3400);
    updateRapSheetBtn();
}
