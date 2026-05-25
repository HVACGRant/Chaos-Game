// ============================================================
//  CHAOS - The Game of Life  |  game.js  (v3 — 21 updates)
// ============================================================

let gameState = {
    players: [],
    currentPlayerIndex: 0,
    numPlayers: 0,
    winGoal: 100000,
    currentSetupPlayer: 0,
    phase: 'setup',
    waitingForMove: false,   // #14 — player must click a space to move
    pendingSteps: 0,
    pendingPlayer: null,
    stealContext: null,
};
let tempSetup = { avatar: '' };

// ── HELPERS ──────────────────────────────────────────────
function charge(p, amt) { p.money = Math.max(0, p.money - amt); }
function fmt(n) { return '$' + Math.floor(n).toLocaleString(); }
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── HAPPINESS (#16) ───────────────────────────────────────
// Scale 0–10, starts at 5.0, +0.5 good / -0.5 bad
function adjustHappiness(p, delta) {
    p.happiness = Math.max(0, Math.min(10, +(p.happiness + delta).toFixed(1)));
}

// ── FINE SCALING (#17) ───────────────────────────────────
// Fines scale up based on player's total assets / tier
function scaledFine(p, base) {
    const assets = p.money + HOUSING[p.housingLevel].price + CARS[p.carLevel].price;
    let multiplier = 1;
    if (assets > 200000) multiplier = 3;
    else if (assets > 100000) multiplier = 2.5;
    else if (assets > 50000) multiplier = 2;
    else if (assets > 20000) multiplier = 1.5;
    return Math.round(base * multiplier);
}

// ── HOUSING ──────────────────────────────────────────────
const HOUSING = [
    { level:0,  name:'Homeless',       icon:'🏚️',  price:0,      rent:0,    lapReq:0  },
    { level:1,  name:'Car Living',     icon:'🚗',  price:0,      rent:0,    lapReq:0  },
    { level:2,  name:"Friend's Couch", icon:'🛋️',  price:500,    rent:100,  lapReq:0  },
    { level:3,  name:'Apartment',      icon:'🏢',  price:2000,   rent:300,  lapReq:0  },
    { level:4,  name:'Mobile Home',    icon:'🏠',  price:4000,   rent:400,  lapReq:25 },
    { level:5,  name:'RV',             icon:'🚌',  price:6000,   rent:500,  lapReq:25 },
    { level:6,  name:'Duplex',         icon:'🏘️',  price:10000,  rent:700,  lapReq:25 },
    { level:7,  name:'Studio',         icon:'🏙️',  price:15000,  rent:900,  lapReq:50 },
    { level:8,  name:'1 Bedroom',      icon:'🏡',  price:20000,  rent:1100, lapReq:50 },
    { level:9,  name:'2 Bedroom',      icon:'🏡',  price:30000,  rent:1400, lapReq:50 },
    { level:10, name:'3 Bedroom',      icon:'🏠',  price:45000,  rent:1800, lapReq:75 },
    { level:11, name:'4 Bedroom',      icon:'🏠',  price:65000,  rent:2200, lapReq:75 },
    { level:12, name:'Skyline Apt',    icon:'🌆',  price:90000,  rent:3000, lapReq:75 },
    { level:13, name:'Mansion',        icon:'🏰',  price:150000, rent:0,    lapReq:100},
];

// ── CARS ─────────────────────────────────────────────────
const CARS = [
    { level:0,  name:'No Car',      icon:'🚶',  price:0,     payment:0,   impound:0,   isHoopty:false, isBike:false },
    { level:1,  name:'Bike',        icon:'🚲',  price:200,   payment:0,   impound:50,  isHoopty:false, isBike:true  },
    { level:2,  name:'Hoopty',      icon:'🚗',  price:1000,  payment:100, impound:150, isHoopty:true,  isBike:false },
    { level:3,  name:'Daily Fixer', icon:'🚙',  price:3000,  payment:150, impound:200, isHoopty:false, isBike:false },
    { level:4,  name:'Gas Car',     icon:'🚗',  price:8000,  payment:250, impound:250, isHoopty:false, isBike:false },
    { level:5,  name:'Hybrid',      icon:'🚘',  price:14000, payment:400, impound:300, isHoopty:false, isBike:false },
    { level:6,  name:'Electric',    icon:'⚡',   price:22000, payment:550, impound:400, isHoopty:false, isBike:false },
    { level:7,  name:'Motorcycle',  icon:'🏍️',  price:10000, payment:300, impound:250, isHoopty:false, isBike:false },
    { level:8,  name:'Truck',       icon:'🚚',  price:18000, payment:450, impound:350, isHoopty:false, isBike:false },
    { level:9,  name:'Classic Car', icon:'🏎️',  price:35000, payment:700, impound:500, isHoopty:false, isBike:false },
    { level:10, name:'Sports Car',  icon:'🚀',  price:60000, payment:1000,impound:800, isHoopty:false, isBike:false },
];

// ── BOARD SPACES (#12 — 1 housing, 1 car dealer, 1 realtor per side) ──
const BOARD_SPACES = [
    // Bottom row: id 0-9, row=9, col=9→0 (START at bottom-right, JAIL at bottom-left)
    { id:0,  type:'corner',   icon:'🏁', name:'START',          desc:'Begin your new life!' },
    { id:1,  type:'hustle',   icon:'🛻', name:'Junk Hauling',   desc:'Haul junk for quick cash!' },
    { id:2,  type:'hustle',   icon:'⛺', name:'Pop Up Tent',    desc:'Set up a pop-up shop!' },
    { id:3,  type:'hustle',   icon:'🐟', name:'Fishing Trip',   desc:'Sell your catch!' },
    { id:4,  type:'car',      icon:'🚗', name:'AutoZone Deals', desc:'Budget cars — buy or upgrade!' },
    { id:5,  type:'fastfood', icon:'🍔', name:"McDonald's",    desc:'Hungry? Spend some cash!' },
    { id:6,  type:'house',    icon:'🏠', name:'Budget Housing', desc:'Affordable homes!', tier:'budget' },
    { id:7,  type:'realtor',  icon:'🏢', name:'City Realty',    desc:'Entry-level realtor!' },
    { id:8,  type:'hustle',   icon:'🎨', name:'Craft Show',     desc:'Sell your crafts!' },
    { id:9,  type:'corner',   icon:'⛓️', name:'JAIL',           desc:'Just Visiting... or IN!' },

    // Left col: id 10-17, col=0, row=8→1 (going up, skipping corners)
    { id:10, type:'hustle',   icon:'🌮', name:'Food Truck',     desc:'Run a food truck!' },
    { id:11, type:'hustle',   icon:'🪟', name:'Window Washing', desc:'Wash windows for cash!' },
    { id:12, type:'car',      icon:'🚘', name:'Mid Auto Sales', desc:'Mid-range cars $3k–$22k!' },
    { id:13, type:'hustle',   icon:'🐕', name:'Dog Walking',    desc:'Walk dogs for tips!' },
    { id:14, type:'payday',   icon:'💰', name:'PAYDAY',         desc:'Collect your paycheck!' },
    { id:15, type:'hustle',   icon:'🏷️', name:'Yard Sale',      desc:'Hold a yard sale!' },
    { id:16, type:'hustle',   icon:'🃏', name:'Card Games',     desc:'Play cards for money!' },
    { id:17, type:'house',    icon:'🏘️', name:'Mid Housing',    desc:'Mid-range homes $5k–$30k!', tier:'mid' },

    // Top-left corner
    { id:18, type:'corner',   icon:'🎁', name:'FREE DAY',       desc:'+0.5 Happiness!' },

    // Top row: id 19-26, row=0, col=1→8 (going right, skipping corners)
    { id:19, type:'hustle',   icon:'🧺', name:'Laundry Service',desc:'Run a laundry hustle!' },
    { id:20, type:'hustle',   icon:'🎪', name:'Flea Market',    desc:'Sell at the flea market!' },
    { id:21, type:'realtor',  icon:'🏡', name:'Prestige Homes', desc:'Luxury realtor!', tier:'luxury' },
    { id:22, type:'bad',      icon:'📋', name:'TAXES',          desc:'Pay 10% of total assets!' },
    { id:23, type:'fastfood', icon:'🌮', name:'Taco Bell',      desc:'Live Mas. Spend some cash!' },
    { id:24, type:'hustle',   icon:'🚜', name:'Scrap Metal',    desc:'Sell scrap metal!' },
    { id:25, type:'car',      icon:'🏎️', name:'Luxury Motors',  desc:'High-end cars $14k–$60k!' },
    { id:26, type:'good',     icon:'✈️',  name:'Vacation Pay',  desc:'Collect $1,200!' },

    // Top-right corner
    { id:27, type:'corner',   icon:'🚔', name:'GO TO JAIL',     desc:'Go directly to Jail!' },

    // Right col: id 28-35, col=9, row=1→8 (going down, skipping corners)
    { id:28, type:'hustle',   icon:'🚲', name:'Bike Courier',   desc:'Deliver packages by bike!' },
    { id:29, type:'hustle',   icon:'🍋', name:'Lemonade Stand', desc:'Run a lemonade stand!' },
    { id:30, type:'hustle',   icon:'🎸', name:'Busking',        desc:'Play music on the street!' },
    { id:31, type:'house',    icon:'🏰', name:'Elite Estates',  desc:'Luxury homes $45k–$150k!', tier:'luxury' },
    { id:32, type:'hustle',   icon:'🌿', name:'Lawn Mowing',    desc:'Mow lawns for cash!' },
    { id:33, type:'bad',      icon:'🏥', name:'Hospital',       desc:'Emergency visit!' },
    { id:34, type:'realtor',  icon:'🏦', name:'Metro Realty',   desc:'Mid-tier realtor!', tier:'mid' },
    { id:35, type:'job',      icon:'💼', name:'Job Office',     desc:'Get or change your job!' },
];

// 10×10 grid — verified no overlaps, 36 unique positions
// Bottom: id0-9  row=9, col=9-id
// Left:   id10-17 col=0, row=8-(id-10)=18-id
// Corner: id18   (0,0)
// Top:    id19-26 row=0, col=id-18
// Corner: id27   (0,9)
// Right:  id28-35 col=9, row=id-27
function getGridPosition(id) {
    if (id <= 9)  return { row:9, col:9-id };
    if (id <= 17) return { row:18-id, col:0 };
    if (id === 18) return { row:0, col:0 };
    if (id <= 26) return { row:0, col:id-18 };
    if (id === 27) return { row:0, col:9 };
    return { row:id-27, col:9 };
}

// ── JAIL REASONS (#20) ───────────────────────────────────
const JAIL_REASONS = [
    'Possession', 'Trespassing', 'Public Intoxication', 'Unpaid Fines',
    'Disorderly Conduct', 'Shoplifting', 'Assault', 'Outstanding Warrant',
    'Parole Violation', 'Drug Charges',
];

function sendToJail(p, reason) {
    p.position = 9;
    p.inJail = true;
    p.jailTurns = 0;
    p.jailReason = reason || rnd(JAIL_REASONS);
    p.jailMaxTurns = Math.ceil(Math.random() * 5); // 1–5 turns
    p.jailFine = 100 + Math.floor(Math.random() * 6) * 100; // $100–$600
    // #6 — lose transportation on arrest
    if (p.carLevel > 0) {
        p.vehicleSeized = p.carLevel;
        p.carLevel = 0;
        p.carImpounded = true;
    }
}

// ── JOB TIERS ────────────────────────────────────────────
const ALL_JOBS = [
    { name:'Dog Walker',     icon:'🐕', pay:500,   tier:0 },
    { name:'Fruit Picker',   icon:'🍎', pay:800,   tier:0 },
    { name:'Wendys',         icon:'🍔', pay:2400,  tier:0 },
    { name:'Walmart',        icon:'🛒', pay:2800,  tier:0 },
    { name:'DoorDash',       icon:'🚗', pay:3000,  tier:0 },
    { name:'Factory Worker', icon:'🏭', pay:3200,  tier:1 },
    { name:'Trash Collector',icon:'🗑️', pay:3500,  tier:1 },
    { name:'House Cleaner',  icon:'🧹', pay:3800,  tier:1 },
    { name:'Security',       icon:'🔒', pay:4000,  tier:1 },
    { name:'Farmer',         icon:'🌾', pay:3500,  tier:1 },
    { name:'Amazon Driver',  icon:'📦', pay:5000,  tier:2 },
    { name:'Police',         icon:'👮', pay:5500,  tier:2 },
    { name:'Prison Guard',   icon:'🚔', pay:6000,  tier:2 },
    { name:'Labor',          icon:'👷', pay:4500,  tier:2 },
    { name:'Catering',       icon:'🍽️', pay:4000,  tier:2 },
    { name:'Realtor',        icon:'🏠', pay:8000,  tier:3 },
    { name:'Microsoft',      icon:'💻', pay:12000, tier:3 },
];

function getTier(laps) {
    if (laps >= 75) return 3;
    if (laps >= 50) return 2;
    if (laps >= 25) return 1;
    return 0;
}
function getTierLabel(laps) {
    if (laps >= 75)  return 'Senior Level (Lap 75+)';
    if (laps >= 50)  return 'Mid Level (Lap 50+)';
    if (laps >= 25)  return 'Entry Level (Lap 25+)';
    return 'Starting Out';
}
function getAvailableJobs(p) {
    const maxTier = getTier(p.laps || 0);
    return ALL_JOBS.filter(j => j.tier <= maxTier);
}

// ── CARD DECKS ───────────────────────────────────────────
// (happiness adjustments embedded #16)

function upgradeHousing(p, lvls) {
    const nl = Math.min(HOUSING.length-1, p.housingLevel + 1);
    if (nl === p.housingLevel) return p.name + ' already has max housing!';
    if (nl === 1 && p.carLevel === 0) return p.name + " can't live in a car — buy a car first! (#10)";
    const lapsNeeded = HOUSING[nl].lapReq || 0;
    if ((p.laps||0) < lapsNeeded) return p.name + ' needs Lap ' + lapsNeeded + ' for ' + HOUSING[nl].name + '.';
    const cost = Math.max(0, HOUSING[nl].price - HOUSING[p.housingLevel].price);
    if (p.money >= cost) {
        p.money -= cost; p.housingLevel = nl;
        animateAssetIcon('apHousingIcon');
        return p.name + ' upgraded to ' + HOUSING[nl].name + '!';
    }
    return p.name + " can't afford " + HOUSING[nl].name + '. Need ' + fmt(cost) + '.';
}

function carLapRequired(level) {
    if (level >= 9) return 75;
    if (level >= 6) return 50;
    if (level >= 3) return 25;
    return 0;
}

function upgradeCar(p, lvls) {
    const nl = Math.min(CARS.length-1, p.carLevel + lvls);
    if (nl === p.carLevel) return p.name + ' already has max car!';
    const lapsNeeded = carLapRequired(nl);
    if ((p.laps||0) < lapsNeeded) return p.name + ' needs Lap ' + lapsNeeded + ' for ' + CARS[nl].name + '.';
    const cost = Math.max(0, CARS[nl].price - CARS[p.carLevel].price);
    if (p.money >= cost) {
        p.money -= cost; p.carLevel = nl;
        animateAssetIcon('apCarIcon');
        return p.name + ' upgraded to ' + CARS[nl].name + '!';
    }
    return p.name + " can't afford " + CARS[nl].name + '. Need ' + fmt(cost) + '.';
}

function animateAssetIcon(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('upgraded'); void el.offsetWidth; el.classList.add('upgraded');
    setTimeout(() => el.classList.remove('upgraded'), 600);
}
function drawCard(deck) { return deck[Math.floor(Math.random()*deck.length)]; }

// ── GOOD CARDS (#16 happiness) ────────────────────────────
const GOOD_CARDS = [
    { name:'Tax Refund',         icon:'📋', effect:p=>{ p.money+=500; adjustHappiness(p,0.5); return ['+$500','Tax refund!','good']; }},
    { name:'Side Hustle',        icon:'💼', effect:p=>{ p.money+=800; adjustHappiness(p,0.5); return ['+$800',"Side hustle paid off!",'good']; }},
    { name:'Lottery Win',        icon:'🎰', effect:p=>{ p.money+=2000; adjustHappiness(p,0.5); return ['+$2,000','Won the lottery!','good']; }},
    { name:'Work Bonus',         icon:'💵', effect:p=>{ if(p.jobPay<=2000) return ['Free Pass!',p.name+' is unemployed.','sarcastic']; p.money+=p.jobPay; adjustHappiness(p,0.5); return ['+'+fmt(p.jobPay),'Work bonus!','good']; }},
    { name:'Found $100',         icon:'💰', effect:p=>{ p.money+=100; adjustHappiness(p,0.5); return ['+$100','Found $100 on the ground!','good']; }},
    { name:'Birthday Money',     icon:'🎂', effect:p=>{ p.money+=300; adjustHappiness(p,0.5); return ['+$300','Grandma sent $300!','good']; }},
    { name:'Garage Sale Win',    icon:'🏷️', effect:p=>{ p.money+=400; adjustHappiness(p,0.5); return ['+$400','Sold junk for $400!','good']; }},
    { name:'Scratcher Win',      icon:'🎟️', effect:p=>{ p.money+=600; adjustHappiness(p,0.5); return ['+$600','Won $600 on a scratcher!','good']; }},
    { name:'Free Housing Upgrade',icon:'🏠',effect:p=>{ const r=upgradeHousing(p,1); adjustHappiness(p,0.5); return [r.includes('upgraded')?'UPGRADE!':'No change',r,'good']; }},
    { name:'Free Car Upgrade',   icon:'🚗', effect:p=>{ const r=upgradeCar(p,1); adjustHappiness(p,0.5); return [r.includes('upgraded')?'UPGRADE!':'No change',r,'good']; }},
    { name:'Vacation Pay',       icon:'✈️',  effect:p=>{ p.money+=1200; adjustHappiness(p,0.5); return ['+$1,200','Cashed in vacation days!','good']; }},
    { name:'Stock Dividend',     icon:'📈', effect:p=>{ p.money+=700; adjustHappiness(p,0.5); return ['+$700','Stocks paid dividends!','good']; }},
    { name:'Freelance Job',      icon:'💻', effect:p=>{ p.money+=1100; adjustHappiness(p,0.5); return ['+$1,100','Landed a freelance gig!','good']; }},
    { name:'Got a Raise',        icon:'⬆️',  effect:p=>{ if(p.jobPay<=2000) return ['Free Pass!',p.name+' is unemployed.','sarcastic']; p.jobPay=Math.round(p.jobPay*1.2); adjustHappiness(p,0.5); return ['+20% Pay','Got a 20% raise! Payday: '+fmt(p.jobPay),'good']; }},
    { name:'Insurance Payout',   icon:'📄', effect:p=>{ p.money+=1500; adjustHappiness(p,0.5); return ['+$1,500','Got an insurance payout!','good']; }},
    { name:'Estate Check',       icon:'🏛️', effect:p=>{ p.money+=3000; adjustHappiness(p,0.5); return ['+$3,000','Inherited $3,000!','good']; }},
    { name:'Double Payday',      icon:'💰', effect:p=>{ p.money+=p.jobPay*2; adjustHappiness(p,0.5); return ['+'+fmt(p.jobPay*2),'Double payday!','good']; }},
    { name:'Promoted!',          icon:'🏆', effect:p=>{ if(p.jobPay<=2000) return ['Free Pass!',p.name+' is unemployed.','sarcastic']; p.jobPay=Math.round(p.jobPay*1.3); adjustHappiness(p,0.5); return ['+30% Pay','Got promoted! Payday: '+fmt(p.jobPay),'good']; }},
    { name:'Found Crypto',       icon:'🪙', effect:p=>{ p.money+=1000; adjustHappiness(p,0.5); return ['+$1,000','Found an old crypto wallet!','good']; }},
    { name:'Bet on Sports',      icon:'🏅', effect:p=>{ p.money+=900; adjustHappiness(p,0.5); return ['+$900','Won a sports bet!','good']; }},
];

const BAD_CARDS = [
    { name:'Speeding Ticket',    icon:'🚨', effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Speeding ticket! -'+fmt(f),'bad']; }},
    { name:'Car Wreck',          icon:'💥', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Car wreck! -'+fmt(f),'bad']; }},
    { name:'Baby Surprise',      icon:'👶', effect:p=>{ const f=scaledFine(p,1000); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Baby! There goes the savings!','bad']; }},
    { name:'Dentist',            icon:'🦷', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Cracked a tooth! -'+fmt(f),'bad']; }},
    { name:'Doctor Visit',       icon:'🏥', effect:p=>{ const f=scaledFine(p,350); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Sick — bill is -'+fmt(f),'bad']; }},
    { name:'Knee Surgery',       icon:'🩺', effect:p=>{ const f=scaledFine(p,2000); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Knee surgery! -'+fmt(f),'bad']; }},
    { name:'Got Robbed',         icon:'🔫', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Got robbed! -'+fmt(f),'bad']; }},
    { name:'Go To Jail',         icon:'⛓️', effect:p=>{ sendToJail(p); adjustHappiness(p,-0.5); return ['JAIL!',p.name+' is going to jail! Reason: '+p.jailReason,'bad']; }},
    { name:'Rent Raised',        icon:'🏠', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Landlord raised the rent! -'+fmt(f),'bad']; }},
    { name:'Pipes Burst',        icon:'🚿', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!',p.name+' has no plumbing.','sarcastic']; const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Pipes burst! -'+fmt(f),'bad']; }},
    { name:'Engine Blew Up',     icon:'💨', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,1500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Engine blew! -'+fmt(f),'bad']; }},
    { name:'IRS Audit',          icon:'📋', effect:p=>{ const t=p.jobPay*5; charge(p,t); adjustHappiness(p,-0.5); return ['-'+fmt(t),'IRS Audit! Pay 5x payday!','bad']; }},
    { name:'Identity Theft',     icon:'🎭', effect:p=>{ const f=scaledFine(p,1000); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Identity theft! -'+fmt(f),'bad']; }},
    { name:'DUI',                icon:'🍺', effect:p=>{ const f=scaledFine(p,2500); charge(p,f); sendToJail(p,'DUI'); adjustHappiness(p,-1); return ['-'+fmt(f)+' + JAIL','DUI! Pay '+fmt(f)+' and go to jail!','bad']; }},
    { name:'Divorce',            icon:'💔', effect:p=>{ const h=Math.floor(p.money*0.3); charge(p,h); adjustHappiness(p,-1); return ['-'+fmt(h),'Divorced! Lost 30% of savings!','bad']; }},
    { name:'Medical Bills',      icon:'🏥', effect:p=>{ const f=scaledFine(p,1800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Massive medical bill! -'+fmt(f),'bad']; }},
    { name:'Bad Investment',     icon:'📉', effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Lost money on bad investment!','bad']; }},
    { name:'Gambling Debt',      icon:'🎲', effect:p=>{ const f=scaledFine(p,700); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Gambling debt! -'+fmt(f),'bad']; }},
    { name:'Car Stolen',         icon:'🔑', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; p.carLevel=Math.max(0,p.carLevel-1); adjustHappiness(p,-0.5); return ['Car Downgraded','Car got stolen!','bad']; }},
    { name:'Move Back w/ Parents',icon:'🏚️',effect:p=>{ p.housingLevel=Math.max(0,p.housingLevel-2); adjustHappiness(p,-1); return ['Housing Downgraded','Had to move back with parents!','bad']; }},
];

const SARCASTIC_CARDS = [
    { name:"You're So Smart",    icon:'🧠', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'"Genius" investment. -'+fmt(f)+'. Big brain.','sarcastic']; }},
    { name:'Free Money!',        icon:'💸', effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'"Free money!" Just kidding. -'+fmt(f)+' in fees.','sarcastic']; }},
    { name:'Investment Guru',    icon:'📉', effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Became an investment guru. -'+fmt(f)+' says otherwise.','sarcastic']; }},
    { name:'Influencer Life',    icon:'📸', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Bought props for content. 3 views. -'+fmt(f),'sarcastic']; }},
    { name:'Crypto Expert',      icon:'🪙', effect:p=>{ const f=scaledFine(p,700); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Crypto expert. Lost '+fmt(f)+'. Classic.','sarcastic']; }},
    { name:'Starting a Podcast', icon:'🎙️', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Started a podcast. 2 bot listeners. -'+fmt(f),'sarcastic']; }},
    { name:'NFT Purchase',       icon:'🖼️', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Bought an NFT. It's worth $0. -"+fmt(f),'sarcastic']; }},
    { name:'Life Coach',         icon:'🎯', effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Hired a life coach. Was told to "believe." -'+fmt(f),'sarcastic']; }},
    { name:'Manifesting',        icon:'✨', effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',p.name+' manifested wealth. Universe said no.','sarcastic']; }},
    { name:'Morning Routine',    icon:'⏰', effect:p=>{ adjustHappiness(p,-1); return ['-1 Happiness','Woke up at 5am. Still miserable.','sarcastic']; }},
    { name:'Vision Board',       icon:'🗂️', effect:p=>{ const f=50; charge(p,f); adjustHappiness(p,-0.5); return ['-$50','Made a vision board. Vision: still broke. Cost: $50','sarcastic']; }},
    { name:'Hot Take',           icon:'🌶️', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Posted a hot take. Got cancelled. Lost '+fmt(f),'sarcastic']; }},
];

// ── HOUSING CARDS ─────────────────────────────────────────
const HOUSING_CARDS = [
    { name:'Free Upgrade!',        icon:'🏠', effect:p=>{ const r=upgradeHousing(p,1); adjustHappiness(p,r.includes('upgraded')?0.5:-0.5); return [r.includes('upgraded')?'UPGRADE!':'No change',r,r.includes('upgraded')?'good':'bad']; }},
    { name:'Landlord Raised Rent', icon:'🏠', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!',p.name+' has no landlord.','sarcastic']; const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Landlord raised rent! -'+fmt(f),'bad']; }},
    { name:'Pipes Burst',          icon:'🚿', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!','No plumbing.','sarcastic']; const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Pipes burst! -'+fmt(f),'bad']; }},
    { name:'Raffle Win!',          icon:'🎉', effect:p=>{ const r=upgradeHousing(p,2); adjustHappiness(p,0.5); return [r.includes('upgraded')?'BIG UPGRADE!':'Maxed',r,'good']; }},
    { name:'Move Back w/ Parents', icon:'🏚️', effect:p=>{ p.housingLevel=Math.max(0,p.housingLevel-2); adjustHappiness(p,-1); return ['Downgraded','Moved back with the parents!','bad']; }},
    { name:'Roof Caved In',        icon:'🏠', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!','No roof.','sarcastic']; const f=scaledFine(p,1200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Roof caved in! -'+fmt(f),'bad']; }},
    { name:'House Party Damage',   icon:'🎉', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Wild house party. Damage: '+fmt(f),'bad']; }},
];

const CAR_CARDS = [
    { name:'Free Upgrade!',  icon:'🚗', effect:p=>{ const r=upgradeCar(p,1); adjustHappiness(p,r.includes('upgraded')?0.5:-0.5); return [r.includes('upgraded')?'UPGRADE!':'No change',r,r.includes('upgraded')?'good':'bad']; }},
    { name:'Flat Tire',      icon:'🔧', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,150); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Flat tire! -'+fmt(f),'bad']; }},
    { name:'Engine Blew Up', icon:'💨', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,1500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Engine blew! -'+fmt(f),'bad']; }},
    { name:'Car Raffle Win!',icon:'🏎️', effect:p=>{ const r=upgradeCar(p,2); adjustHappiness(p,0.5); return [r.includes('upgraded')?'BIG UPGRADE!':'Maxed',r,'good']; }},
    { name:'Car Got Stolen', icon:'🔑', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; p.carLevel=Math.max(0,p.carLevel-1); adjustHappiness(p,-0.5); return ['Downgraded','Car got stolen!','bad']; }},
    { name:'Free Oil Change',icon:'🛞', effect:p=>{ p.money+=80; adjustHappiness(p,0.5); return ['+$80','Free oil change coupon! +$80','good']; }},
    { name:'Fender Bender',  icon:'🚗', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Fender bender! -'+fmt(f),'bad']; }},
];

// ── JOB CARDS ─────────────────────────────────────────────
const JOB_CARDS = [
    { name:'Got Hired!', icon:'💼', effect:p=>{ const pool=getAvailableJobs(p).filter(j=>j.pay>p.jobPay); if(!pool.length) return p.name+' already has the best job available!'; const j=rnd(pool); p.job=j.name; p.jobPay=j.pay; adjustHappiness(p,0.5); return p.name+' hired as '+j.icon+' '+j.name+'! Payday: $'+j.pay.toLocaleString(); }},
    { name:'Got Hired!', icon:'💼', effect:p=>{ const pool=getAvailableJobs(p).filter(j=>j.pay>p.jobPay); if(!pool.length) return p.name+' already has the best job available!'; const j=rnd(pool); p.job=j.name; p.jobPay=j.pay; adjustHappiness(p,0.5); return p.name+' hired as '+j.icon+' '+j.name+'! Payday: $'+j.pay.toLocaleString(); }},
    { name:'Got Fired!', icon:'🔥', effect:p=>{ p.job='Unemployed'; p.jobPay=2000; adjustHappiness(p,-1); return p.name+' got FIRED! Back to Unemployed.'; }},
    { name:'Got Fired!', icon:'🔥', effect:p=>{ p.job='Unemployed'; p.jobPay=2000; adjustHappiness(p,-1); return p.name+' got FIRED again!'; }},
];

// ── SCREENS ───────────────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

document.getElementById('startBtn').addEventListener('click', () => showScreen('setupScreen'));

function setPlayers(n) {
    gameState.numPlayers = n;
    document.querySelectorAll('.player-btn').forEach(b => b.classList.remove('selected'));
    event.target.classList.add('selected');
    checkSetupReady();
}
function setGoal(g) {
    gameState.winGoal = g;
    document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('selected'));
    event.target.classList.add('selected');
    checkSetupReady();
}
function checkSetupReady() {
    if (gameState.numPlayers > 0 && gameState.winGoal > 0)
        document.getElementById('setupDoneBtn').classList.remove('hidden');
}
function setupPlayers() {
    gameState.players = [];
    gameState.currentSetupPlayer = 0;
    showPlayerSetup();
    showScreen('playerSetupScreen');
}
// ── AVATAR BUILDER ────────────────────────────────────────
const abState = { base:'', overlay:'', hat:'', item:'', vibe:'' };

function abBuild() {
    // Compose avatar from layers: base + overlay + hat + item + vibe
    const parts = [abState.base, abState.overlay, abState.hat, abState.item, abState.vibe]
        .filter(Boolean);
    return parts.length ? parts.join('') : '❓';
}

function abRefresh() {
    const preview = document.getElementById('abPreview');
    if (preview) preview.textContent = abBuild();
    // Sync tempSetup.avatar so nextPlayer() can read it
    tempSetup.avatar = abBuild() === '❓' ? '' : abBuild();
}

function abSet(slot, emoji) {
    // Toggle off if already selected
    abState[slot] = abState[slot] === emoji ? '' : emoji;
    // Highlight selected buttons in this slot
    document.querySelectorAll(`.ab-pick`).forEach(btn => {
        if (btn.getAttribute('onclick') === `abSet('${slot}','${emoji}')`) {
            btn.classList.toggle('selected', abState[slot] === emoji);
        } else if (btn.getAttribute('onclick') && btn.getAttribute('onclick').startsWith(`abSet('${slot}'`)) {
            btn.classList.remove('selected');
        }
    });
    abRefresh();
}

function abTab(tabEl, panelId) {
    document.querySelectorAll('.ab-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ab-panel').forEach(p => p.classList.remove('active'));
    tabEl.classList.add('active');
    const panel = document.getElementById('panel-' + panelId);
    if (panel) panel.classList.add('active');
}

function abReset() {
    Object.keys(abState).forEach(k => abState[k] = '');
    document.querySelectorAll('.ab-pick').forEach(b => b.classList.remove('selected'));
    abRefresh();
}

function showPlayerSetup() {
    const idx = gameState.currentSetupPlayer;
    document.getElementById('playerSetupTitle').textContent = `Player ${idx+1} Setup`;
    document.getElementById('playerName').value = '';
    abReset();
    // Reset to first tab
    const firstTab = document.querySelector('.ab-tab');
    if (firstTab) abTab(firstTab, 'human');
    tempSetup = { avatar: '' };
    document.getElementById('nextPlayerBtn').textContent =
        idx === gameState.numPlayers-1 ? 'START CHAOS!' : 'NEXT PLAYER';
}

function selectAvatar(emoji) {
    // Legacy — not used by builder, kept for safety
    tempSetup.avatar = emoji;
}

function nextPlayer() {
    const name = document.getElementById('playerName').value.trim();
    if (!tempSetup.avatar) { alert('Pick an avatar!'); return; }
    if (!name) { alert('Enter your name!'); return; }
    gameState.players.push({
        id: gameState.currentSetupPlayer,
        name, avatar: tempSetup.avatar,
        job:'Unemployed', jobPay:2000,
        money:20000, position:0,
        housingLevel:0, carLevel:0,
        inJail:false, jailTurns:0, jailMaxTurns:3,
        jailReason:'', jailFine:200,
        vehicleSeized:0, carImpounded:false,
        jailFreeCards:0,
        happiness:5.0,
        turnsPlayed:0, laps:0,
        skipTurn:false,
        rentDue:0, carPaymentDue:0,
    });
    gameState.currentSetupPlayer++;
    if (gameState.currentSetupPlayer >= gameState.numPlayers) startGame();
    else showPlayerSetup();
}

// ── START GAME ────────────────────────────────────────────
function startGame() {
    gameState.currentPlayerIndex = 0;
    gameState.phase = 'playing';
    showScreen('gameScreen');
    document.getElementById('winGoalDisplay').textContent = '🏆 ' + fmt(gameState.winGoal);
    buildBoard();
    renderPlayerBar();
    updateCurrentPlayerDisplay();
}

// ── BOARD ─────────────────────────────────────────────────
function buildBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    const cells = {};
    for (let r=0;r<=9;r++) for(let c=0;c<=9;c++) cells[`${r},${c}`]=null;
    BOARD_SPACES.forEach(s => { const p=getGridPosition(s.id); cells[`${p.row},${p.col}`]=s; });
    for (let r=0;r<=9;r++) {
        for (let c=0;c<=9;c++) {
            const space = cells[`${r},${c}`];
            const div = document.createElement('div');
            if (space) {
                div.className = `board-space ${space.type}`;
                div.setAttribute('data-space-id', space.id);
                div.innerHTML = `<div class="space-icon">${space.icon}</div><div class="space-name">${space.name}</div><div class="space-players" id="sp-${space.id}"></div>`;
                // #14 — click to move
                div.addEventListener('click', () => onSpaceClick(space.id));
            } else if (r>=1&&r<=8&&c>=1&&c<=8) {
                if (r===4&&c===4) {
                    div.className='center-area';
                    div.style.gridColumn='2/10';
                    div.style.gridRow='2/10';
                    div.innerHTML=`
                        <div class="center-title">⚡ CHAOS ⚡</div>
                        <div class="center-sub">The Game of Life</div>
                        <div class="center-goal">🏆 Win: ${fmt(gameState.winGoal)}</div>
                        <div class="card-stacks">
                            <div class="card-stack" onclick="drawFromDeck('good')">
                                <div class="card-stack-icon">✅</div>
                                <div class="card-stack-label">GOOD</div>
                            </div>
                            <div class="card-stack" onclick="drawFromDeck('bad')">
                                <div class="card-stack-icon">❌</div>
                                <div class="card-stack-label">BAD</div>
                            </div>
                            <div class="card-stack" onclick="drawFromDeck('sarcastic')">
                                <div class="card-stack-icon">😏</div>
                                <div class="card-stack-label">CHAOS</div>
                            </div>
                        </div>`;
                } else { div.style.display='none'; }
            } else { div.style.background='transparent'; div.style.border='none'; }
            board.appendChild(div);
        }
    }
    updatePlayerPieces();
}

// Draw from center deck stack (#13)
function drawFromDeck(type) {
    if (gameState.phase !== 'playing') return;
    const p = gameState.players[gameState.currentPlayerIndex];
    let card, result;
    if (type === 'good') { card = drawCard(GOOD_CARDS); result = card.effect(p); }
    else if (type === 'bad') { card = drawCard(BAD_CARDS); result = card.effect(p); }
    else { card = drawCard(SARCASTIC_CARDS); result = card.effect(p); }
    renderPlayerBar();
    const typeLabel = type==='good'?'GOOD CARD':type==='bad'?'BAD CARD':'CHAOS CARD';
    showCardOverlay(card.icon, typeLabel, card.name, result[1], result[2]||type, () => { checkWinThenEnd(p); });
}

function updatePlayerPieces() {
    document.querySelectorAll('.space-players').forEach(el=>el.innerHTML='');
    gameState.players.forEach(p => {
        const el = document.getElementById(`sp-${p.position}`);
        if (el) {
            const span = document.createElement('span');
            span.className = 'space-piece';
            span.textContent = p.avatar;
            span.title = p.name;
            el.appendChild(span);
        }
    });
}

// ── PLAYER BAR ────────────────────────────────────────────
function renderPlayerBar() {
    const bar = document.getElementById('playerInfoBar');
    bar.innerHTML = '';
    gameState.players.forEach((p,i) => {
        const h = p.happiness;
        const hColor = h >= 7 ? '#4ecca3' : h >= 4 ? '#f5a623' : '#e94560';
        const hPct = (h / 10 * 100).toFixed(0);
        const div = document.createElement('div');
        div.className = `player-token ${i===gameState.currentPlayerIndex?'active-player':''}`;
        div.innerHTML = `
            <div class="token-row1">
                <span class="token-avatar">${p.avatar}</span>
                <span class="token-name">${p.name}</span>
            </div>
            <div class="token-money">${fmt(p.money)}</div>
            <div class="token-details">${p.job}</div>
            <div class="token-details">${HOUSING[p.housingLevel].icon} ${HOUSING[p.housingLevel].name}</div>
            <div class="token-details">${CARS[p.carLevel].icon} ${CARS[p.carLevel].name}</div>
            <div class="happiness-bar-wrap">
                <span style="font-size:0.75em;color:${hColor}">${h.toFixed(1)}😊</span>
                <div class="happiness-bar"><div class="happiness-fill" style="width:${hPct}%;background:${hColor}"></div></div>
            </div>
            ${p.inJail?`<div class="token-jail">⛓️ JAIL (${p.jailReason})</div>`:''}
        `;
        bar.appendChild(div);
    });
    updateActivePlayerPanel();
}

// ── ACTIVE PANEL ──────────────────────────────────────────
function updateActivePlayerPanel() {
    if (gameState.phase !== 'playing') return;
    const p = gameState.players[gameState.currentPlayerIndex];
    if (!p) return;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('apAvatar', p.avatar);
    set('apName', p.name);
    set('apMoney', fmt(p.money));
    set('apJob', '💼 ' + p.job + ' | ' + fmt(p.jobPay));
    const h = p.happiness;
    const hColor = h >= 7 ? '#4ecca3' : h >= 4 ? '#f5a623' : '#e94560';
    const hEl = document.getElementById('apHappiness');
    if (hEl) { hEl.textContent = '😊 Mood: ' + h.toFixed(1) + '/10'; hEl.style.color = hColor; }
    set('apLaps', '🔄 Laps: ' + (p.laps||0) + ' | ' + getTierLabel(p.laps||0));

    const jailEl = document.getElementById('apJail');
    if (jailEl) {
        if (p.inJail) {
            jailEl.textContent = `⛓️ JAIL: ${p.jailReason} — Turn ${p.jailTurns+1}/${p.jailMaxTurns} | Bail: ${fmt(p.jailFine)}`;
            jailEl.classList.remove('hidden');
        } else { jailEl.classList.add('hidden'); }
    }

    const house = HOUSING[p.housingLevel];
    set('apHousingIcon', house.icon); set('apHousingName', house.name);
    renderUpgradeTrack('housingTrack', p.housingLevel, HOUSING.length);
    const car = CARS[p.carLevel];
    set('apCarIcon', car.icon); set('apCarName', car.name);
    renderUpgradeTrack('carTrack', p.carLevel, CARS.length);
}

function renderUpgradeTrack(trackId, currentLevel, totalLevels) {
    const el = document.getElementById(trackId);
    if (!el) return;
    el.innerHTML = '';
    for (let i=0; i<totalLevels; i++) {
        const dot = document.createElement('div');
        dot.className = 'upgrade-dot' + (i<currentLevel?' filled':i===currentLevel?' current':'');
        el.appendChild(dot);
    }
}

// ── CURRENT PLAYER DISPLAY ────────────────────────────────
function updateCurrentPlayerDisplay() {
    const p = gameState.players[gameState.currentPlayerIndex];
    updateActivePlayerPanel();
    const hoopty = CARS[p.carLevel].isHoopty;
    const isBike = CARS[p.carLevel].isBike;

    // #1 — explain then show what type of roll
    let rollMsg = '';
    if (p.inJail) {
        rollMsg = `⛓️ In jail (${p.jailReason}). Turn ${p.jailTurns+1}/${p.jailMaxTurns}. Roll doubles to escape or pay ${fmt(p.jailFine)}.`;
    } else if (hoopty) {
        rollMsg = '🚗 Hoopty! First roll 1 die — 1-3 = dead battery (walk 1 die), 4-6 = starts (roll 2 dice).';
    } else if (p.carLevel === 0) {
        rollMsg = '🚶 Walking — roll 1 die.';
    } else if (isBike) {
        rollMsg = '🚲 On your bike — roll 1 die.';
    } else {
        rollMsg = `🚗 In the ${CARS[p.carLevel].name} — roll 2 dice!`;
    }
    document.getElementById('gameMessage').textContent = rollMsg;
    document.getElementById('diceResult').textContent = '';
    document.getElementById('rollDiceBtn').disabled = false;
    gameState.waitingForMove = false;
    gameState.pendingSteps = 0;
    gameState.pendingPlayer = null;
    clearClickableSpaces();
}

// ── DICE ─────────────────────────────────────────────────
const DICE_FACES = ['','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];

function animateDice(d1El, d2El, val1, val2, onDone) {
    d1El.classList.add('rolling');
    if (d2El) d2El.classList.add('rolling');
    let ticks=0;
    const iv = setInterval(() => {
        d1El.textContent = DICE_FACES[Math.floor(Math.random()*6)+1];
        if (d2El) d2El.textContent = DICE_FACES[Math.floor(Math.random()*6)+1];
        ticks++;
        if (ticks > 8) {
            clearInterval(iv);
            d1El.classList.remove('rolling');
            if (d2El) d2El.classList.remove('rolling');
            d1El.textContent = DICE_FACES[val1];
            if (d2El) d2El.textContent = val2 ? DICE_FACES[val2] : '⬛';
            onDone();
        }
    }, 80);
}

function rollDice() {
    document.getElementById('rollDiceBtn').disabled = true;
    const player = gameState.players[gameState.currentPlayerIndex];
    const d1El = document.getElementById('die1');
    const d2El = document.getElementById('die2');

    if (player.inJail) { handleJailRoll(player, d1El, d2El); return; }

    const hoopty = CARS[player.carLevel].isHoopty;
    const isBike = CARS[player.carLevel].isBike;

    if (hoopty) {
        // #1/#15 — hoopty: roll 1 die, explain result, then roll movement
        const die1 = Math.ceil(Math.random()*6);
        document.getElementById('gameMessage').textContent = '🎲 Checking if the Hoopty starts...';
        animateDice(d1El, d2El, die1, null, () => {
            if (die1 <= 3) {
                // #15 — dead battery, walk: roll 1 die
                document.getElementById('diceResult').textContent = `${DICE_FACES[die1]} = ${die1} 🔋 Dead battery!`;
                document.getElementById('gameMessage').textContent = '🚶 Dead battery — now walking. Rolling 1 die for movement...';
                showCardOverlay('🚗','HOOPTY','Dead Battery!',`${player.name} rolled a ${die1}. Hoopty won't start — walking this turn!`,'bad', () => {
                    const moveDie = Math.ceil(Math.random()*6);
                    animateDice(d1El, d2El, moveDie, null, () => {
                        document.getElementById('diceResult').textContent = `🚶 Walking — moved ${moveDie} spaces.`;
                        afterRoll(player, moveDie);
                    });
                }, 3000);
            } else {
                document.getElementById('diceResult').textContent = `${DICE_FACES[die1]} = ${die1} 🚗 It started!`;
                document.getElementById('gameMessage').textContent = 'Hoopty started! Now rolling 2 dice for movement...';
                showCardOverlay('🚗','HOOPTY','It Started!',`${player.name} rolled a ${die1}! Hoopty starts — rolling 2 dice to move.`,'good', () => {
                    const m1=Math.ceil(Math.random()*6), m2=Math.ceil(Math.random()*6);
                    animateDice(d1El, d2El, m1, m2, () => {
                        document.getElementById('diceResult').textContent = `${DICE_FACES[m1]} ${DICE_FACES[m2]} = ${m1+m2}`;
                        afterRoll(player, m1+m2);
                    });
                }, 3000);
            }
        });
        return;
    }

    if (player.carLevel <= 1) {
        // Walking or bike: 1 die
        const label = player.carLevel===0?'🚶 Walking':'🚲 Biking';
        const die1 = Math.ceil(Math.random()*6);
        document.getElementById('gameMessage').textContent = `Rolling 1 die (${label})...`;
        animateDice(d1El, d2El, die1, null, () => {
            document.getElementById('diceResult').textContent = `${DICE_FACES[die1]} = ${die1} (${label})`;
            afterRoll(player, die1);
        });
        return;
    }

    // 2 dice
    const die1=Math.ceil(Math.random()*6), die2=Math.ceil(Math.random()*6);
    const doubles = die1===die2;
    animateDice(d1El, d2El, die1, die2, () => {
        document.getElementById('diceResult').textContent =
            `${DICE_FACES[die1]} ${DICE_FACES[die2]} = ${die1+die2}${doubles?' 🎲 DOUBLES!':''}`;
        afterRoll(player, die1+die2);
    });
}

// #14 — after rolling, highlight clickable destination and wait for tap
function afterRoll(player, steps) {
    const dest = (player.position + steps) % 36;
    gameState.waitingForMove = true;
    gameState.pendingSteps = steps;
    gameState.pendingPlayer = player;
    highlightDestination(dest);
    document.getElementById('gameMessage').textContent =
        `You rolled ${steps}. Tap your destination space to move! (space ${dest}: ${BOARD_SPACES[dest].name})`;
}

function highlightDestination(destId) {
    clearClickableSpaces();
    const el = document.querySelector(`[data-space-id="${destId}"]`);
    if (el) el.classList.add('clickable-space');
}

function clearClickableSpaces() {
    document.querySelectorAll('.clickable-space').forEach(el=>el.classList.remove('clickable-space'));
}

function onSpaceClick(spaceId) {
    if (!gameState.waitingForMove) return;
    const dest = (gameState.pendingPlayer.position + gameState.pendingSteps) % 36;
    if (spaceId !== dest) return; // must click correct space
    gameState.waitingForMove = false;
    clearClickableSpaces();
    movePlayer(gameState.pendingPlayer, gameState.pendingSteps);
}

// ── JAIL ROLL ─────────────────────────────────────────────
function handleJailRoll(player, d1El, d2El) {
    const die1=Math.ceil(Math.random()*6), die2=Math.ceil(Math.random()*6);
    const doubles = die1===die2;
    animateDice(d1El, d2El, die1, die2, () => {
        document.getElementById('diceResult').textContent =
            `${DICE_FACES[die1]} ${DICE_FACES[die2]} = ${die1+die2}${doubles?' 🎲 DOUBLES!':''}`;
        handleJailTurn(player, doubles, die1+die2);
    });
}

// ── JAIL (#20) ────────────────────────────────────────────
function handleJailTurn(player, doubles, total) {
    if (doubles) {
        player.inJail = false;
        // return impounded vehicle (#6)
        if (player.vehicleSeized > 0) {
            player.carLevel = player.vehicleSeized;
            player.vehicleSeized = 0;
            player.carImpounded = false;
        }
        renderPlayerBar();
        showCardOverlay('🎲','JAIL BREAK','Doubles! You\'re Free!',`${player.name} rolled doubles and escaped jail from: ${player.jailReason}!`,'good', () => { afterRoll(player, total); });
        return;
    }

    player.jailTurns++;

    if (player.jailTurns >= player.jailMaxTurns) {
        // Must pay bail
        const impoundFee = player.vehicleSeized > 0 ? CARS[player.vehicleSeized].impound : 0;
        const total_cost = player.jailFine + impoundFee;
        if (player.money >= total_cost) {
            charge(player, total_cost);
            if (player.vehicleSeized > 0) {
                player.carLevel = player.vehicleSeized;
                player.vehicleSeized = 0;
                player.carImpounded = false;
            }
            player.inJail = false;
            player.jailTurns = 0;
            adjustHappiness(player, -0.5);
            renderPlayerBar();
            showCardOverlay('⛓️','RELEASED',`Paid ${fmt(total_cost)}`,
                `${player.name} paid bail ${fmt(player.jailFine)}${impoundFee>0?' + impound '+fmt(impoundFee):''} and is released from: ${player.jailReason}`,'bad', () => { endTurn(); });
        } else {
            gameState.phase = 'over';
            showCardOverlay('🚔','GAME OVER','Can\'t Afford Bail',`${player.name} can't afford bail of ${fmt(total_cost)}. Rotting in prison forever!`,'bad', () => { showGameOver(player); });
        }
    } else {
        renderPlayerBar();
        showCardOverlay('⛓️','STILL IN JAIL',`Turn ${player.jailTurns}/${player.jailMaxTurns}`,
            `${player.name} stays in jail (${player.jailReason}). Roll doubles to escape! Bail: ${fmt(player.jailFine)}`,'bad', () => { endTurn(); });
    }
}

// ── PAY BAIL BUTTON ───────────────────────────────────────
function payBailEarly() {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player.inJail) return;
    const impoundFee = player.vehicleSeized > 0 ? CARS[player.vehicleSeized].impound : 0;
    const total_cost = player.jailFine + impoundFee;
    if (player.money >= total_cost) {
        charge(player, total_cost);
        if (player.vehicleSeized > 0) { player.carLevel=player.vehicleSeized; player.vehicleSeized=0; player.carImpounded=false; }
        player.inJail = false;
        player.jailTurns = 0;
        renderPlayerBar();
        showCardOverlay('⛓️','RELEASED','Bail Paid!',`${player.name} paid ${fmt(total_cost)} bail and is free!`,'good', () => { endTurn(); });
    } else {
        showCardOverlay('💸','CANT PAY','Not Enough',`${player.name} needs ${fmt(total_cost)} for bail but only has ${fmt(player.money)}.`,'bad');
    }
}

// ── MOVE ─────────────────────────────────────────────────
function movePlayer(player, steps) {
    const oldPos = player.position;
    const newPos = (oldPos + steps) % 36;

    // Lap bonus
    if (newPos <= oldPos && steps > 0) {
        player.money += player.jobPay;
        player.laps++;
        // collect rent from others (#19)
        collectRent(player);
        document.getElementById('gameMessage').textContent =
            `${player.name} passed START! Lap ${player.laps} | +${fmt(player.jobPay)} 💰`;
    }
    player.position = newPos;
    player.turnsPlayed++;
    updatePlayerPieces();
    renderPlayerBar();

    // #1 — delay before landing effect
    setTimeout(() => {
        document.getElementById('gameMessage').textContent =
            `${player.name} landed on: ${BOARD_SPACES[newPos].name}`;
        setTimeout(() => {
            checkStealOpportunity(player, newPos, () => landOnSpace(player, BOARD_SPACES[newPos]));
        }, 1500);
    }, 600);
}

// ── RENT/CAR PAYMENT (#19) ────────────────────────────────
function collectRent(player) {
    // Housing rent due each lap for levels 2–12
    if (player.housingLevel >= 2 && player.housingLevel < 13) {
        const rent = HOUSING[player.housingLevel].rent;
        charge(player, rent);
        // flash message handled inline
    }
    // Car payment due each lap for levels 2+
    if (player.carLevel >= 2) {
        const payment = CARS[player.carLevel].payment;
        charge(player, payment);
    }
}

// ── STEAL (#18) ───────────────────────────────────────────
function checkStealOpportunity(movingPlayer, newPos, callback) {
    if (movingPlayer.carLevel > 0) { callback(); return; } // already has transport
    // Find players on same space with a vehicle
    const targets = gameState.players.filter(p =>
        p.id !== movingPlayer.id && p.position === newPos && p.carLevel > 0
    );
    if (!targets.length) { callback(); return; }

    const target = targets[0];
    gameState.stealContext = { thief: movingPlayer, victim: target, callback };
    const overlay = document.getElementById('stealOverlay');
    document.getElementById('stealTitle').textContent = '⚡ VEHICLE SHOWDOWN ⚡';
    document.getElementById('stealDesc').textContent =
        `${movingPlayer.name} (walking) landed on ${target.name}'s space!\n` +
        `${movingPlayer.name} can try to steal the ${CARS[target.carLevel].icon} ${CARS[target.carLevel].name}!\n` +
        `Both players roll — highest wins!`;
    document.getElementById('stealResult').textContent = '';
    document.getElementById('stealDie1').textContent = '🎲';
    document.getElementById('stealDie2').textContent = '🎲';
    overlay.classList.remove('hidden');
}

function resolveSteal() {
    const { thief, victim, callback } = gameState.stealContext;
    const d1 = Math.ceil(Math.random()*6);
    const d2 = Math.ceil(Math.random()*6);
    const sd1El = document.getElementById('stealDie1');
    const sd2El = document.getElementById('stealDie2');
    sd1El.textContent = DICE_FACES[d1];
    sd2El.textContent = DICE_FACES[d2];
    let result = '';
    if (d1 > d2) {
        // Thief wins!
        const stolenLevel = victim.carLevel;
        victim.carLevel = 0;
        thief.carLevel = stolenLevel;
        adjustHappiness(thief, 1);
        adjustHappiness(victim, -1);
        result = `${thief.name} rolled ${d1}, ${victim.name} rolled ${d2}. STEAL SUCCESSFUL! ${thief.name} took the ${CARS[stolenLevel].name}!`;
    } else if (d2 > d1) {
        result = `${thief.name} rolled ${d1}, ${victim.name} rolled ${d2}. ${victim.name} DEFENDS their ride! No steal.`;
    } else {
        result = `Tied at ${d1}! ${victim.name} keeps their vehicle.`;
    }
    document.getElementById('stealResult').textContent = result;
    renderPlayerBar();
    document.getElementById('stealRollBtn').disabled = true;
    setTimeout(() => {
        document.getElementById('stealOverlay').classList.add('hidden');
        document.getElementById('stealRollBtn').disabled = false;
        gameState.stealContext = null;
        callback();
    }, 3500);
}

// ── LAND ─────────────────────────────────────────────────
function landOnSpace(player, space) {
    if (!space) { endTurn(); return; }
    try {
        switch(space.type) {
            case 'corner':  handleCorner(player, space); break;
            case 'payday':  handlePayday(player); break;
            case 'good':    handleGoodSpace(player, space); break;
            case 'bad':     handleBadSpace(player, space); break;
            case 'house':   handleHouseSpace(player, space); break;
            case 'car':     handleCarDealerSpace(player, space); break;
            case 'realtor': handleRealtorSpace(player, space); break;
            case 'job':     handleJobOffice(player); break;
            case 'jcard':   handleJobCard(player); break;
            case 'hustle':   handleHustle(player, space); break;
            case 'fastfood': handleFastFood(player, space); break;
            default:        endTurn(); break;
        }
    } catch(e) { console.error('landOnSpace error:', e); endTurn(); }
}

// ── CORNERS ───────────────────────────────────────────────
function handleCorner(player, space) {
    if (space.id === 0) {
        showCardOverlay('🏁','START','Back at the Beginning!',`${player.name} landed on START!`,'good', () => { endTurn(); });
    } else if (space.id === 9) {
        showCardOverlay('⛓️','JAIL','Just Visiting',`${player.name} is just visiting. Stay cool!`,'', () => { endTurn(); });
    } else if (space.id === 18) {
        adjustHappiness(player, 0.5);
        renderPlayerBar();
        showCardOverlay('🎁','FREE DAY','Nothing Happens! +0.5 Mood',`${player.name} gets a free day off! Enjoy. +0.5 Happiness!`,'good', () => { endTurn(); });
    } else if (space.id === 27) {
        sendToJail(player);
        renderPlayerBar();
        updatePlayerPieces();
        showCardOverlay('🚔','GO TO JAIL','Busted!',
            `${player.name} is going to jail!\nReason: ${player.jailReason}\nUp to ${player.jailMaxTurns} turns | Bail: ${fmt(player.jailFine)}${player.vehicleSeized>0?'\n'+CARS[player.vehicleSeized].icon+' '+CARS[player.vehicleSeized].name+' impounded! Fee: '+fmt(CARS[player.vehicleSeized].impound):''}`,
            'bad', () => { endTurn(); });
    }
}

// ── PAYDAY ────────────────────────────────────────────────
function handlePayday(player) {
    player.money += player.jobPay;
    collectRent(player);
    adjustHappiness(player, 0.5);
    renderPlayerBar();
    showCardOverlay('💰','PAYDAY','Collect Your Check!',
        `${player.name} collects ${fmt(player.jobPay)} from ${player.job}!\nRent/payment deducted automatically.`,'good', () => { checkWinThenEnd(player); });
}

// ── GOOD SPACE ────────────────────────────────────────────
function handleGoodSpace(player, space) {
    if (space.name === 'Vacation Pay') { player.money+=1200; adjustHappiness(player,0.5); renderPlayerBar(); showCardOverlay('✈️','LUCKY!','Vacation Pay',`${player.name} cashed in vacation days! +$1,200`,'good', () => { checkWinThenEnd(player); }); }
    else { player.money+=100; renderPlayerBar(); showCardOverlay('✅','LUCKY!',space.name,`${player.name} got lucky! +$100`,'good', () => { checkWinThenEnd(player); }); }
}

// ── BAD SPACE (#11 — hospital with tow choice) ────────────
function handleBadSpace(player, space) {
    if (space.name === 'TAXES') {
        const assets = player.money + HOUSING[player.housingLevel].price + CARS[player.carLevel].price;
        const t = Math.max(1, Math.round(assets * 0.10));
        charge(player, t); adjustHappiness(player, -0.5); renderPlayerBar();
        showCardOverlay('📋','TAXES','Pay 10%!',`${player.name} owes 10% on assets (${fmt(assets)})! Tax: ${fmt(t)}`,'bad', () => { endTurn(); });
    } else if (space.name === 'Hospital') {
        // #11 — hospital: charge, then offer car tow question
        const medBill = scaledFine(player, 500);
        charge(player, medBill); adjustHappiness(player, -0.5); renderPlayerBar();
        if (player.carLevel > 0) {
            // Car was towed while in hospital
            const towFee = 300;
            showTowChoice(player, medBill, towFee, () => endTurn());
        } else {
            showCardOverlay('🏥','HOSPITAL','Emergency Visit!',`${player.name} paid ${fmt(medBill)} in medical bills!`,'bad', () => { endTurn(); });
        }
    } else {
        const f = scaledFine(player, 100);
        charge(player, f); adjustHappiness(player, -0.5); renderPlayerBar();
        showCardOverlay('❌','OUCH!',space.name,`${player.name} had bad luck! -${fmt(f)}`,'bad', () => { endTurn(); });
    }
}

// #11 — Tow choice popup
function showTowChoice(player, medBill, towFee, callback) {
    const popup = document.getElementById('popup');
    const content = popup.querySelector('.popup-content');
    document.getElementById('popupTitle').textContent = '🚗 Car Towed!';
    document.getElementById('popupMessage').textContent =
        `${player.name} was in the hospital — ${CARS[player.carLevel].icon} ${CARS[player.carLevel].name} got towed!\n\n` +
        `Medical bill: ${fmt(medBill)} (already paid)\n` +
        `Impound fee: ${fmt(towFee)}\n\nPay the impound fee to get your car back?`;
    content.className = 'popup-content popup-bad';
    popup.classList.remove('hidden');
    content.querySelectorAll('button').forEach(b=>b.remove());

    const yesBtn = document.createElement('button');
    yesBtn.className='btn'; yesBtn.style.marginRight='10px'; yesBtn.textContent='PAY $300 — GET CAR';
    yesBtn.onclick = () => {
        if (player.money >= towFee) {
            charge(player, towFee); renderPlayerBar(); closePopup();
            showCardOverlay('🚗','CAR BACK','Paid Impound!',`${player.name} paid ${fmt(towFee)} to get their car back.`,'good', () => { callback(); });
        } else {
            closePopup();
            showCardOverlay('💸','CANT PAY','Left the Car',`${player.name} can't afford ${fmt(towFee)} impound. Car left behind.`,'bad', () => { callback(); });
            player.carLevel = 0;
            renderPlayerBar();
        }
    };
    const noBtn = document.createElement('button');
    noBtn.className='btn'; noBtn.style.background='linear-gradient(135deg,#0f3460,#16213e)'; noBtn.textContent='LEAVE CAR';
    noBtn.onclick = () => {
        closePopup();
        player.carLevel = 0; renderPlayerBar();
        showCardOverlay('🚗','LEFT BEHIND','Car Gone',`${player.name} left the car in impound. Back to walking.`,'bad', () => { callback(); });
    };
    content.appendChild(yesBtn); content.appendChild(noBtn);
}

// ── HOUSING SPACE (#12 — tiered, with pricing) ────────────
function handleHouseSpace(player, space) {
    const tier = space.tier || 'budget';
    const tierRange = {
        budget:  { min:0,  max:5  },
        mid:     { min:3,  max:9  },
        luxury:  { min:8,  max:13 },
    }[tier];

    const cur = HOUSING[player.housingLevel];
    const nextLvl = player.housingLevel + 1;

    if (player.housingLevel >= HOUSING.length-1) {
        showCardOverlay('🏰','HOUSING','Maxed Out!',`${player.name} already lives in a ${cur.name}!`,'good', () => { endTurn(); }); return;
    }
    if (nextLvl > tierRange.max) {
        showCardOverlay('🔒','WRONG DEALER','Out of Range',
            `${space.name} only sells levels ${tierRange.min}–${tierRange.max}. Current: level ${player.housingLevel}. Try another housing dealer!`,'bad', () => { endTurn(); }); return;
    }
    if (nextLvl === 1 && player.carLevel === 0) {
        showCardOverlay('🚗','NEED A CAR','Car Living Blocked',`${player.name} can't live in a car without owning one! (#10)`,'bad', () => { endTurn(); }); return;
    }
    const lapsNeeded = HOUSING[nextLvl].lapReq || 0;
    if ((player.laps||0) < lapsNeeded) {
        showCardOverlay('🔒','LOCKED',`Lap ${lapsNeeded} Required`,`${player.name} needs Lap ${lapsNeeded} for ${HOUSING[nextLvl].name}.`,'bad', () => { endTurn(); }); return;
    }

    const next = HOUSING[nextLvl];
    const cost = Math.max(0, next.price - cur.price);
    const rentInfo = next.rent > 0 ? `\nMonthly rent: ${fmt(next.rent)} (due each lap)` : '';
    showUpgradePopup(`🏠 ${space.name}`, `${player.name}, upgrade:\n${cur.icon} ${cur.name} → ${next.icon} ${next.name}\nCost: ${cost>0?fmt(cost):'FREE!'}${rentInfo}`,
        'MOVE IN!', () => {
            if (player.money >= cost) {
                player.money -= cost; player.housingLevel = nextLvl;
                animateAssetIcon('apHousingIcon'); renderPlayerBar(); closePopup();
                showCardOverlay('🏠','UPGRADED!',next.icon+' '+next.name,`${player.name} upgraded their home!`,'good', () => { checkWinThenEnd(player); });
            } else {
                closePopup();
                showCardOverlay('💸','CANT AFFORD IT','Not Enough',`${player.name} needs ${fmt(cost)} but has ${fmt(player.money)}`,'bad', () => { endTurn(); });
            }
        }, () => { closePopup(); endTurn(); });
}

// ── CAR DEALER SPACE (#12 — tiered pricing) ───────────────
function handleCarDealerSpace(player, space) {
    const tierRange = {
        4:  { min:0,  max:4,  label:'Budget' },   // AutoZone Deals (id 4)
        12: { min:2,  max:7,  label:'Mid-Range' }, // Mid Auto Sales (id 12) ✓
        25: { min:5,  max:10, label:'Luxury' },    // Luxury Motors (id 25)
    }[space.id] || { min:0, max:10, label:'All' };

    const cur = CARS[player.carLevel];
    const nextLvl = player.carLevel + 1;

    if (player.carLevel >= CARS.length-1) {
        showCardOverlay('🚀','CAR DEALER','Maxed Out!',`${player.name} already drives a ${cur.name}!`,'good', () => { endTurn(); }); return;
    }
    if (nextLvl > tierRange.max) {
        showCardOverlay('🔒','WRONG DEALER','Out of Range',
            `${space.name} sells levels ${tierRange.min}–${tierRange.max}. Need a ${nextLvl >= 8?'luxury':'higher-end'} dealer!`,'bad', () => { endTurn(); }); return;
    }
    const lapsNeeded = carLapRequired(nextLvl);
    if ((player.laps||0) < lapsNeeded) {
        showCardOverlay('🔒','LOCKED',`Lap ${lapsNeeded} Required`,`${player.name} needs Lap ${lapsNeeded} for ${CARS[nextLvl].name}.`,'bad', () => { endTurn(); }); return;
    }
    const next = CARS[nextLvl];
    const cost = Math.max(0, next.price - cur.price);
    const payInfo = next.payment > 0 ? `\nMonthly payment: ${fmt(next.payment)} (due each lap)` : '';
    showUpgradePopup(`🚗 ${space.name}`, `${player.name}, upgrade:\n${cur.icon} ${cur.name} → ${next.icon} ${next.name}\nCost: ${cost>0?fmt(cost):'FREE!'}${payInfo}`,
        'BUY IT!', () => {
            if (player.money >= cost) {
                player.money -= cost; player.carLevel = nextLvl;
                animateAssetIcon('apCarIcon'); renderPlayerBar(); closePopup();
                showCardOverlay('🚗','NEW RIDE!',next.icon+' '+next.name,`${player.name} got a new ride!`,'good', () => { checkWinThenEnd(player); });
            } else {
                closePopup();
                showCardOverlay('💸','CANT AFFORD IT','Not Enough',`${player.name} needs ${fmt(cost)} but has ${fmt(player.money)}`,'bad', () => { endTurn(); });
            }
        }, () => { closePopup(); endTurn(); });
}

// ── REALTOR (#12) ─────────────────────────────────────────
function handleRealtorSpace(player, space) {
    // Show ALL housing options they qualify for by lap
    const available = HOUSING.filter((h,i) => i > player.housingLevel && (player.laps||0) >= (h.lapReq||0));
    if (!available.length) {
        showCardOverlay('🏢','REALTOR','Nothing Available',`${player.name} doesn't qualify for any upgrades yet. Keep playing!`,'bad', () => { endTurn(); }); return;
    }
    const best = available[available.length-1];
    const cost = Math.max(0, best.price - HOUSING[player.housingLevel].price);
    showUpgradePopup(`🏢 ${space.name}`, `${player.name}, best available:\n${best.icon} ${best.name}\nCost: ${fmt(cost)}\nRent: ${best.rent>0?fmt(best.rent)+'/lap':'none'}\n\n(Or upgrade 1 level for less)`,
        'BEST UPGRADE', () => {
            if (player.money >= cost) {
                player.money -= cost; player.housingLevel = HOUSING.indexOf(best);
                animateAssetIcon('apHousingIcon'); renderPlayerBar(); closePopup();
                showCardOverlay('🏢','UPGRADED!',best.icon+' '+best.name,`${player.name} moved into ${best.name}!`,'good', () => { checkWinThenEnd(player); });
            } else {
                closePopup();
                showCardOverlay('💸','CANT AFFORD IT','Not Enough',`${player.name} needs ${fmt(cost)}.`,'bad', () => { endTurn(); });
            }
        }, () => { closePopup(); endTurn(); });
}

// ── GENERIC UPGRADE POPUP ────────────────────────────────
function showUpgradePopup(title, message, yesText, onYes, onNo) {
    const popup = document.getElementById('popup');
    const content = popup.querySelector('.popup-content');
    document.getElementById('popupTitle').textContent = title;
    document.getElementById('popupMessage').textContent = message;
    content.className = 'popup-content popup-good';
    popup.classList.remove('hidden');
    content.querySelectorAll('button').forEach(b=>b.remove());
    const yesBtn = document.createElement('button');
    yesBtn.className='btn'; yesBtn.style.marginRight='10px'; yesBtn.textContent=yesText;
    yesBtn.onclick = onYes;
    const noBtn = document.createElement('button');
    noBtn.className='btn'; noBtn.style.background='linear-gradient(135deg,#0f3460,#16213e)'; noBtn.textContent='PASS';
    noBtn.onclick = onNo;
    content.appendChild(yesBtn); content.appendChild(noBtn);
}

// ── CARD OVERLAY ─────────────────────────────────────────
// Card stays face-up until player taps. showCardOverlay takes an optional
// onDismiss callback; if omitted the overlay just sits open (previous card
// visible) until the next showCardOverlay call replaces it.
let _cardDismissCallback = null;

function showCardOverlay(icon, typeLabel, title, body, type, onDismiss) {
    const overlay = document.getElementById('cardOverlay');
    const display = document.getElementById('cardDisplay');
    document.getElementById('cardIcon').textContent = icon;
    document.getElementById('cardTypeLabel').textContent = typeLabel;
    document.getElementById('cardTitle').textContent = title;
    document.getElementById('cardBody').textContent = body;
    display.className = 'card-display';
    if (type==='good') display.classList.add('card-good');
    else if (type==='bad') display.classList.add('card-bad');
    else if (type==='sarcastic') display.classList.add('card-sarcastic');

    _cardDismissCallback = onDismiss || null;

    const btn = document.getElementById('cardContinueBtn');
    if (btn) {
        if (onDismiss) {
            btn.style.display = 'block';
            btn.onclick = () => {
                if (!_cardDismissCallback) return;
                const cb = _cardDismissCallback;
                _cardDismissCallback = null;
                btn.style.display = 'none';
                // Hide overlay first, THEN run callback
                overlay.classList.add('hidden');
                // Update the last-drawn banner so everyone can still see what was drawn
                updateLastCardBanner(icon, typeLabel, title, type);
                cb();
            };
        } else {
            // Info-only card (no action needed) — still show a close button
            btn.style.display = 'block';
            btn.textContent = '▶ GOT IT';
            btn.onclick = () => {
                btn.style.display = 'none';
                overlay.classList.add('hidden');
                updateLastCardBanner(icon, typeLabel, title, type);
            };
        }
    }

    overlay.classList.remove('hidden');
}

// Show the last drawn card in a small always-visible banner on the game screen
function updateLastCardBanner(icon, label, title, type) {
    let banner = document.getElementById('lastCardBanner');
    if (!banner) return;
    banner.textContent = icon + ' ' + label + ': ' + title;
    banner.className = 'last-card-banner';
    if (type==='good') banner.classList.add('lcb-good');
    else if (type==='bad') banner.classList.add('lcb-bad');
    else if (type==='sarcastic') banner.classList.add('lcb-sarcastic');
    banner.classList.remove('hidden');
}

function dismissCard() { /* handled by button */ }

function hideCardOverlay() {
    _cardDismissCallback = null;
    document.getElementById('cardOverlay').classList.add('hidden');
}

// ── JOB OFFICE ───────────────────────────────────────────
function handleJobOffice(player) {
    const available = getAvailableJobs(player);
    const better = available.filter(j=>j.pay > player.jobPay);
    const pool = better.length > 0 ? better : available;
    const offer = rnd(pool);
    const laps = player.laps||0;
    let nextUnlock = laps<25?`\nEntry jobs unlock at Lap 25 (${25-laps} away)`:laps<50?`\nMid jobs at Lap 50 (${50-laps} away)`:laps<75?`\nTop jobs at Lap 75 (${75-laps} away)`:'All jobs unlocked!';
    showUpgradePopup(
        '💼 Job Office — '+getTierLabel(laps),
        `${player.name}, job offer:\n${offer.icon} ${offer.name} | Payday: ${fmt(offer.pay)}\nCurrent: ${player.job} (${fmt(player.jobPay)})${nextUnlock}`,
        'TAKE IT!', () => {
            player.job=offer.name; player.jobPay=offer.pay; adjustHappiness(player,0.5); renderPlayerBar(); closePopup();
            showCardOverlay('💼','NEW JOB!',offer.icon+' '+offer.name,`${player.name} is now working as ${offer.name}! Payday: ${fmt(offer.pay)}`,'good', () => { checkWinThenEnd(player); });
        }, () => { closePopup(); endTurn(); });
}

function handleJobCard(player) {
    const card = drawCard(JOB_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    const isGood = !result.includes('FIRED') && !result.includes('best job');
    showCardOverlay(card.icon,'JOB CARD',card.name,result,isGood?'good':'bad', () => { checkWinThenEnd(player); });
}

// ── HOUSING/CAR CARD ──────────────────────────────────────
function handleHousingCard(player) {
    const card = drawCard(HOUSING_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    showCardOverlay(card.icon||'🏘️','HOUSE CARD',card.name,result[1],result[2]||'bad', () => { checkWinThenEnd(player); });
}
function handleCarCard(player) {
    const card = drawCard(CAR_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    showCardOverlay(card.icon||'🔧','CAR CARD',card.name,result[1],result[2]||'bad', () => { checkWinThenEnd(player); });
}

// ── FAST FOOD (#landAndSpend) ─────────────────────────────
const FAST_FOOD_DATA = {
    "McDonald's": {
        icon: '🍔',
        color: 'bad',
        menu: [
            { item: 'Big Mac Meal',          price: 12,  msg: "Double-fisted a Big Mac meal. Worth it." },
            { item: 'McFlurry + Nuggets',    price: 9,   msg: "Oreo McFlurry and 10 nuggets. No regrets." },
            { item: 'Quarter Pounder Meal',  price: 14,  msg: "Quarter Pounder, large fries, large Coke. The works." },
            { item: 'Happy Meal (for you)',  price: 7,   msg: "You ordered a Happy Meal. For yourself. No shame." },
            { item: 'Full Family Haul',      price: 45,  msg: "Accidentally fed the whole block. $45 gone." },
            { item: 'Just a McDouble',       price: 4,   msg: "McDouble and a water cup. Living within the means." },
            { item: 'Breakfast Run',         price: 11,  msg: "Egg McMuffin, hash browns, coffee. Classic." },
            { item: 'Late Night Drive-Thru', price: 18,  msg: "2am drive-thru run. Regrettable but delicious." },
        ]
    },
    'Taco Bell': {
        icon: '🌮',
        color: 'bad',
        menu: [
            { item: 'Crunchwrap Supreme',    price: 10,  msg: "Crunchwrap Supreme meal. Perfection in a hexagon." },
            { item: 'Nacho Fries Box',       price: 8,   msg: "Nacho fries box. Gone in 4 minutes flat." },
            { item: '$5 Cravings Box',       price: 5,   msg: "Five dollar cravings box. Actual value: priceless." },
            { item: 'Party Pack (24 tacos)', price: 32,  msg: "24-taco party pack. Just you. No party." },
            { item: 'Baja Blast + Nachos',   price: 9,   msg: "Baja Blast and a loaded nacho. Living Mas." },
            { item: 'Cheesy Gordita Crunch', price: 11,  msg: "Cheesy Gordita Crunch combo. Absolutely demolished." },
            { item: 'Mexican Pizza',         price: 7,   msg: "Mexican Pizza returned and you showed up." },
            { item: 'Freeze + Quesadilla',   price: 8,   msg: "Mango freeze and a quesadilla. Perfect." },
        ]
    },
};

function handleFastFood(player, space) {
    const data = FAST_FOOD_DATA[space.name];
    if (!data) { endTurn(); return; }

    // Pick a random menu item
    const order = data.menu[Math.floor(Math.random() * data.menu.length)];
    const scaledPrice = scaledFine(player, order.price); // richer players pay more (inflation)
    charge(player, scaledPrice);
    adjustHappiness(player, 0.5); // food makes you happy
    renderPlayerBar();

    showCardOverlay(
        data.icon,
        space.name.toUpperCase(),
        order.item + ' — ' + fmt(scaledPrice),
        order.msg + '\n\n' + player.name + ' spent ' + fmt(scaledPrice) + ' at ' + space.name + '.',
        'bad',
        () => { checkWinThenEnd(player); }
    );
}

// ── HUSTLE SPACES ─────────────────────────────────────────
const HUSTLE_DATA = {
    'Pop Up Tent':     { bad:[{die:1,earn:-80,msg:'Permit officer shut you down. -$80'},{die:2,earn:-50,msg:'Rain killed the crowd. -$50'},{die:3,earn:-30,msg:'Nobody came. -$30'}], good:[{die:4,earn:200,msg:'Decent foot traffic! +$200'},{die:5,earn:350,msg:'Sold out by noon! +$350'},{die:6,earn:500,msg:'VIRAL — line around the block! +$500'}] },
    'Craft Show':      { bad:[{die:1,earn:-100,msg:'Booth fee wasted, zero sales. -$100'},{die:2,earn:-60,msg:'Dropped your best piece. -$60'},{die:3,earn:-30,msg:'Slow show. -$30'}], good:[{die:4,earn:250,msg:'People loved your work! +$250'},{die:5,earn:400,msg:'Custom orders coming in! +$400'},{die:6,earn:600,msg:'Local news featured you! +$600'}] },
    'Storage Locker':  { bad:[{die:1,earn:-200,msg:'Full of wet trash. Lost bid. -$200'},{die:2,earn:-100,msg:'Nothing sellable. -$100'},{die:3,earn:-50,msg:'Bidding war, overpaid. -$50'}], good:[{die:4,earn:400,msg:'Electronics to flip! +$400'},{die:5,earn:700,msg:'Found antiques! +$700'},{die:6,earn:1200,msg:'JACKPOT — hidden cash! +$1,200'}] },
    'Food Truck':      { bad:[{die:1,earn:-200,msg:'Health inspector shut you down. -$200'},{die:2,earn:-100,msg:'Generator died. -$100'},{die:3,earn:-50,msg:'Parked wrong, got towed. -$50'}], good:[{die:4,earn:300,msg:'Steady lunch crowd! +$300'},{die:5,earn:500,msg:'Cleaned out! +$500'},{die:6,earn:800,msg:'Food festival — 3hr wait! +$800'}] },
    'Yard Sale':       { bad:[{die:1,earn:-40,msg:"Sold grandma's china for $2. -$40"},{die:2,earn:-20,msg:'Rain soaked everything. -$20'},{die:3,earn:0,msg:'Only your neighbor came. Bought nothing.'}], good:[{die:4,earn:150,msg:'Cleared out clutter! +$150'},{die:5,earn:280,msg:'Collectibles sold fast! +$280'},{die:6,earn:450,msg:'Antique hunter paid top dollar! +$450'}] },
    'Flea Market':     { bad:[{die:1,earn:-80,msg:'Table fee, zero sales. -$80'},{die:2,earn:-50,msg:'Someone stole from your table. -$50'},{die:3,earn:-20,msg:'Slow Sunday. -$20'}], good:[{die:4,earn:200,msg:'Solid hustle day! +$200'},{die:5,earn:380,msg:'Everything went! +$380'},{die:6,earn:550,msg:'Resellers buying bulk! +$550'}] },
    'Scrap Metal':     { bad:[{die:1,earn:-100,msg:'Truck broke hauling. Repair bill. -$100'},{die:2,earn:-60,msg:'Prices dropped. -$60'},{die:3,earn:-30,msg:'Yard was closed. -$30'}], good:[{die:4,earn:200,msg:'Good haul! +$200'},{die:5,earn:350,msg:'Found copper wire! +$350'},{die:6,earn:500,msg:'Full dumpster score! +$500'}] },
    'Lemonade Stand':  { bad:[{die:1,earn:-30,msg:'City shut you down, no permit. -$30'},{die:2,earn:-20,msg:'Dog knocked over pitcher. -$20'},{die:3,earn:0,msg:'Cold day. Nobody wanted lemonade.'}], good:[{die:4,earn:80,msg:'Hot day, good spot! +$80'},{die:5,earn:150,msg:'Line around the block! +$150'},{die:6,earn:250,msg:'Influencer posted your stand! +$250'}] },
    'Busking':         { bad:[{die:1,earn:-50,msg:'Broke a string, no backup. -$50'},{die:2,earn:-20,msg:'Cop moved you along. -$20'},{die:3,earn:0,msg:'Crickets. Nobody looked up.'}], good:[{die:4,earn:100,msg:'Tips rolling in! +$100'},{die:5,earn:200,msg:'Crowd gathered! +$200'},{die:6,earn:350,msg:'Talent scout gave you a card! +$350'}] },
    'Lawn Mowing':     { bad:[{die:1,earn:-100,msg:'Mower seized. Repair bill. -$100'},{die:2,earn:-60,msg:'Hit a sprinkler head. -$60'},{die:3,earn:-20,msg:'Job canceled last minute. -$20'}], good:[{die:4,earn:150,msg:'Got a few yards done! +$150'},{die:5,earn:280,msg:'Whole street hired you! +$280'},{die:6,earn:400,msg:'HOA contracted you for the season! +$400'}] },
    'Junk Hauling':    { bad:[{die:1,earn:-100,msg:'Truck overloaded, blew a tire. -$100'},{die:2,earn:-60,msg:'Dumped in wrong spot, fined. -$60'},{die:3,earn:-30,msg:'Job canceled, wasted gas. -$30'}], good:[{die:4,earn:150,msg:'Cleared a garage! +$150'},{die:5,earn:280,msg:'Found sellable stuff! +$280'},{die:6,earn:400,msg:'Estate cleanout, big payday! +$400'}] },
    'Fishing Trip':    { bad:[{die:1,earn:-50,msg:'Lost all gear in water. -$50'},{die:2,earn:-30,msg:'Zero bites all day. -$30'},{die:3,earn:-20,msg:'Fishing license expired. Fine. -$20'}], good:[{die:4,earn:100,msg:'Decent catch! +$100'},{die:5,earn:200,msg:'Sold fresh fish roadside! +$200'},{die:6,earn:350,msg:'Trophy fish at auction! +$350'}] },
    'Pizza Delivery':  { bad:[{die:1,earn:-80,msg:'Fender bender delivering. -$80'},{die:2,earn:-40,msg:'Wrong address, cold pizza, no tip. -$40'},{die:3,earn:-20,msg:'Terrible shift, stiffed. -$20'}], good:[{die:4,earn:120,msg:'Good tip night! +$120'},{die:5,earn:220,msg:'Rush hour tips flying! +$220'},{die:6,earn:350,msg:'Someone tipped $200 on one order! +$350'}] },
    'Photography':     { bad:[{die:1,earn:-100,msg:'Dropped your camera. Repair. -$100'},{die:2,earn:-50,msg:'Client hated the photos, no pay. -$50'},{die:3,earn:-20,msg:'Memory card corrupted. -$20'}], good:[{die:4,earn:200,msg:'Headshot session! +$200'},{die:5,earn:350,msg:'Event photography gig! +$350'},{die:6,earn:600,msg:'Wedding photographer no-showed — you filled in! +$600'}] },
    'Window Washing':  { bad:[{die:1,earn:-80,msg:'Fell off ladder. Medical bill. -$80'},{die:2,earn:-40,msg:'Broke a window. Had to pay. -$40'},{die:3,earn:-20,msg:'Client canceled after you drove over. -$20'}], good:[{die:4,earn:150,msg:'Knocked out a whole building! +$150'},{die:5,earn:260,msg:'Commercial contract! +$260'},{die:6,earn:400,msg:'Hotel hired you on the spot! +$400'}] },
    'Dog Walking':     { bad:[{die:1,earn:-100,msg:'Dog bit someone. Covered bill. -$100'},{die:2,earn:-50,msg:'Dog got loose. Hours finding it. -$50'},{die:3,earn:-20,msg:'Owner canceled. -$20'}], good:[{die:4,earn:80,msg:'Easy walk, good tip! +$80'},{die:5,earn:160,msg:'Walked five dogs at once! +$160'},{die:6,earn:280,msg:'Rich neighbor wants daily walks! +$280'}] },
    'Card Games':      { bad:[{die:1,earn:-200,msg:'Got cleaned out. -$200'},{die:2,earn:-100,msg:'Bad hand after bad hand. -$100'},{die:3,earn:-50,msg:'Lost focus, paid for it. -$50'}], good:[{die:4,earn:150,msg:'Read the table right! +$150'},{die:5,earn:300,msg:'Big pot, better bluff! +$300'},{die:6,earn:500,msg:'Royal flush baby! +$500'}] },
    'Laundry Service': { bad:[{die:1,earn:-80,msg:"Shrunk someone's clothes. -$80"},{die:2,earn:-40,msg:'Washing machine flooded. -$40'},{die:3,earn:-20,msg:'Mixed whites and colors. -$20'}], good:[{die:4,earn:100,msg:'Neighborhood orders! +$100'},{die:5,earn:200,msg:'Picked up a regular client! +$200'},{die:6,earn:320,msg:'Airbnb host hired you weekly! +$320'}] },
    'Plant Selling':   { bad:[{die:1,earn:-50,msg:'Frost killed inventory. -$50'},{die:2,earn:-30,msg:"Nobody wanted succulents. -$30"},{die:3,earn:-20,msg:'Dropped and smashed best pots. -$20'}], good:[{die:4,earn:100,msg:'Farmers market sold out! +$100'},{die:5,earn:200,msg:'Rare plant collectors! +$200'},{die:6,earn:350,msg:'Florist bought your whole stock! +$350'}] },
    'Gaming Tourney':  { bad:[{die:1,earn:-100,msg:'Entry fee, knocked out round 1. -$100'},{die:2,earn:-50,msg:'Lag spike cost you. -$50'},{die:3,earn:-30,msg:'Rage quit, lost buy-in. -$30'}], good:[{die:4,earn:150,msg:'Made it to semis! +$150'},{die:5,earn:300,msg:'Runner up prize! +$300'},{die:6,earn:600,msg:'CHAMPION — took the whole pot! +$600'}] },
    'Bake Sale':       { bad:[{die:1,earn:-60,msg:'Burned whole batch. -$60'},{die:2,earn:-30,msg:'Rain killed foot traffic. -$30'},{die:3,earn:-20,msg:'Forgot sugar. Nobody bought twice. -$20'}], good:[{die:4,earn:100,msg:'Sold out by lunch! +$100'},{die:5,earn:200,msg:'Office ordered 5 dozen cookies! +$200'},{die:6,earn:350,msg:'Catering order from the bake sale! +$350'}] },
    'Bike Courier':    { bad:[{die:1,earn:-80,msg:'Bike got stolen. -$80'},{die:2,earn:-50,msg:'Flat tire, missed deliveries. -$50'},{die:3,earn:-20,msg:'Wrong address twice. No tip. -$20'}], good:[{die:4,earn:120,msg:'Fast routes, good tips! +$120'},{die:5,earn:230,msg:'Surge pricing hour! +$230'},{die:6,earn:380,msg:'VIP same-day contract! +$380'}] },
    'Street Dice':     { bad:[{die:1,earn:-200,msg:'Cops showed up. Lost everything. -$200'},{die:2,earn:-100,msg:'Hot streak ended cold. -$100'},{die:3,earn:-50,msg:'Bad roll, lost stake. -$50'}], good:[{die:4,earn:150,msg:'Lucky streak! +$150'},{die:5,earn:300,msg:'Cleaned out two opponents! +$300'},{die:6,earn:500,msg:'On fire — nobody could touch you! +$500'}] },
    'Car Wash':        { bad:[{die:1,earn:-80,msg:'Scratched a Mercedes. -$80'},{die:2,earn:-40,msg:'Hose burst, water everywhere. -$40'},{die:3,earn:-20,msg:'Only 2 cars all day. -$20'}], good:[{die:4,earn:180,msg:'Solid Saturday hustle! +$180'},{die:5,earn:300,msg:'Line wrapped around the block! +$300'},{die:6,earn:450,msg:'Car show came through — 40 cars! +$450'}] },
    'Power Washing':   { bad:[{die:1,earn:-80,msg:'Pressure too high, blasted paint off. -$80'},{die:2,earn:-50,msg:'Equipment cost more than you made. -$50'},{die:3,earn:-20,msg:'Client not happy, no pay. -$20'}], good:[{die:4,earn:180,msg:'Driveway and patio! +$180'},{die:5,earn:320,msg:'HOA hired you for the street! +$320'},{die:6,earn:500,msg:'Commercial contract! +$500'}] },
};

// ── MINI GAMES (#21) ──────────────────────────────────────
// Odd jobs get a mini-game
const ODD_JOB_MINI_GAMES = [
    {
        name: 'Math Sprint',
        desc: 'Quick — answer the math problem to earn more!',
        run: (player, onDone) => {
            const a = Math.floor(Math.random()*10)+1;
            const b = Math.floor(Math.random()*10)+1;
            const op = ['+','-','×'][Math.floor(Math.random()*3)];
            let ans;
            if (op==='+') ans=a+b;
            else if (op==='-') ans=a-b;
            else ans=a*b;
            const wrongs = new Set();
            while (wrongs.size < 3) {
                const w = ans + Math.floor(Math.random()*10)-5;
                if (w !== ans) wrongs.add(w);
            }
            const choices = [...wrongs, ans].sort(()=>Math.random()-0.5);
            document.getElementById('mgTitle').textContent = '🧮 Math Sprint!';
            document.getElementById('mgDesc').textContent = `What is ${a} ${op} ${b}?`;
            const area = document.getElementById('mgArea');
            area.innerHTML = '';
            let done = false;
            choices.forEach(c => {
                const btn = document.createElement('button');
                btn.className='mg-btn'; btn.textContent=c;
                btn.onclick = () => {
                    if (done) return; done=true;
                    const correct = c===ans;
                    btn.classList.add(correct?'selected':'wrong');
                    const earn = correct ? 300 : 50;
                    if (correct) player.money+=earn; else { /* just base pay */ }
                    setTimeout(()=>{ document.getElementById('miniGameOverlay').classList.add('hidden'); onDone(correct, earn); }, 1200);
                };
                area.appendChild(btn);
            });
            document.getElementById('miniGameOverlay').classList.remove('hidden');
        }
    },
    {
        name: 'Reaction Time',
        desc: 'Tap the button the instant it turns green to earn a bonus!',
        run: (player, onDone) => {
            document.getElementById('mgTitle').textContent = '⚡ Reaction Time!';
            document.getElementById('mgDesc').textContent = 'Wait for it... then tap!';
            const area = document.getElementById('mgArea');
            area.innerHTML = '';
            const btn = document.createElement('button');
            btn.className='mg-btn'; btn.textContent='WAIT...'; btn.style.width='100%'; btn.style.padding='20px';
            btn.style.background='var(--red)'; btn.style.borderColor='var(--red)';
            let ready=false, started=false;
            btn.onclick = () => {
                if (!ready) { btn.textContent='TOO EARLY! -$50'; player.money=Math.max(0,player.money-50); setTimeout(()=>{ document.getElementById('miniGameOverlay').classList.add('hidden'); onDone(false,50); },1000); return; }
                if (started) return; started=true;
                btn.textContent='✅ Got it!'; btn.style.background='var(--green)';
                setTimeout(()=>{ document.getElementById('miniGameOverlay').classList.add('hidden'); player.money+=400; onDone(true,400); },800);
            };
            area.appendChild(btn);
            document.getElementById('miniGameOverlay').classList.remove('hidden');
            const delay = 1500 + Math.random()*2000;
            setTimeout(()=>{ ready=true; btn.textContent='NOW! TAP!'; btn.style.background='var(--green)'; btn.style.borderColor='var(--green)'; },delay);
            // timeout
            setTimeout(()=>{ if(!started){ ready=false; document.getElementById('miniGameOverlay').classList.add('hidden'); onDone(false,0); } }, delay+2000);
        }
    },
    {
        name: 'Pick a Door',
        desc: 'One door hides the big tip. Pick wisely!',
        run: (player, onDone) => {
            document.getElementById('mgTitle').textContent = '🚪 Pick a Door!';
            document.getElementById('mgDesc').textContent = 'One hides $500. The others: nothing.';
            const area = document.getElementById('mgArea');
            area.innerHTML = '';
            const win = Math.floor(Math.random()*3);
            let picked = false;
            ['🚪A','🚪B','🚪C'].forEach((label,i) => {
                const btn = document.createElement('button');
                btn.className='mg-btn'; btn.textContent=label; btn.style.fontSize='1.5em';
                btn.onclick = () => {
                    if (picked) return; picked=true;
                    if (i===win) { btn.textContent='💰$500'; btn.classList.add('selected'); player.money+=500; setTimeout(()=>{ document.getElementById('miniGameOverlay').classList.add('hidden'); onDone(true,500); },1500); }
                    else { btn.textContent='😔0'; btn.classList.add('wrong'); setTimeout(()=>{ document.getElementById('miniGameOverlay').classList.add('hidden'); onDone(false,0); },1500); }
                };
                area.appendChild(btn);
            });
            document.getElementById('miniGameOverlay').classList.remove('hidden');
        }
    },
];

function handleHustle(player, space) {
    // Odd Jobs gets a mini game instead (#21)
    if (space.name === 'Odd Jobs') {
        const game = rnd(ODD_JOB_MINI_GAMES);
        game.run(player, (won, earn) => {
            const base = 80;
            if (!won) player.money += base;
            renderPlayerBar();
            showCardOverlay('🎯','ODD JOB',won?'Bonus Earned!':'Base Pay Only',
                won ? `Crushed it! Earned $${earn} bonus!` : `Tough one. Base pay: $${base}.`,
                won?'good':'sarcastic', () => { checkWinThenEnd(player); });
        });
        return;
    }

    const data = HUSTLE_DATA[space.name];
    if (!data) { endTurn(); return; }
    const d1El = document.getElementById('die1');
    const d2El = document.getElementById('die2');
    const die = Math.ceil(Math.random()*6);
    document.getElementById('gameMessage').textContent = `${player.name} is hustling — ${space.name}! Rolling...`;
    animateDice(d1El, d2El, die, null, () => {
        document.getElementById('diceResult').textContent =
            DICE_FACES[die] + ' = ' + die + (die<=3?' 😬 Bad luck!':' 😎 Nice roll!');
        const outcomes = die<=3 ? data.bad : data.good;
        const picked = outcomes[die<=3 ? die-1 : die-4];
        const earn = picked.earn;
        if (earn>0)       { player.money += earn; adjustHappiness(player,0.5); }
        else if (earn<0)  { charge(player,Math.abs(earn)); adjustHappiness(player,-0.5); }
        renderPlayerBar();
        const type = earn>0?'good':earn<0?'bad':'sarcastic';
        showCardOverlay(space.icon,'HUSTLE — '+space.name+' (rolled '+die+')', earn>0?'+'+fmt(earn):earn<0?'-'+fmt(Math.abs(earn)):'Nothing', picked.msg, type, () => { checkWinThenEnd(player); });
    });
}

// ── WIN / END ─────────────────────────────────────────────
function checkWinThenEnd(player) { if (!checkWin(player)) endTurn(); }
function endTurn() {
    if (gameState.phase==='over') return;
    const player = gameState.players[gameState.currentPlayerIndex];
    if (checkWin(player)) return;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex+1) % gameState.numPlayers;
    renderPlayerBar();
    updateCurrentPlayerDisplay();
}
function checkWin(player) {
    if (player.money >= gameState.winGoal) { showWin(player); return true; }
    return false;
}
function showWin(player) {
    gameState.phase='over';
    let ws=document.getElementById('winScreen');
    if (!ws) {
        ws=document.createElement('div'); ws.id='winScreen'; ws.className='screen hidden';
        ws.innerHTML=`<div class="win-content"><h1>🏆 WINNER! 🏆</h1><div id="winnerAvatar" style="font-size:5em"></div><div id="winnerName" style="font-size:2em;color:#4ecca3;margin:10px 0"></div><div class="win-stats" id="winStats"></div><button class="btn" onclick="location.reload()">PLAY AGAIN!</button></div>`;
        document.body.appendChild(ws);
    }
    document.getElementById('winnerAvatar').textContent=player.avatar;
    document.getElementById('winnerName').textContent=`${player.name} WON!`;
    document.getElementById('winStats').innerHTML=`
        <div class="win-stat"><div class="win-stat-label">Final Money</div><div class="win-stat-value">${fmt(player.money)}</div></div>
        <div class="win-stat"><div class="win-stat-label">Mood</div><div class="win-stat-value">${player.happiness.toFixed(1)}/10</div></div>
        <div class="win-stat"><div class="win-stat-label">Home</div><div class="win-stat-value">${HOUSING[player.housingLevel].icon} ${HOUSING[player.housingLevel].name}</div></div>
        <div class="win-stat"><div class="win-stat-label">Car</div><div class="win-stat-value">${CARS[player.carLevel].icon} ${CARS[player.carLevel].name}</div></div>`;
    showScreen('winScreen');
}
function showGameOver(player) {
    let ws=document.getElementById('winScreen');
    if (!ws) {
        ws=document.createElement('div'); ws.id='winScreen'; ws.className='screen hidden';
        ws.innerHTML=`<div class="win-content" style="border-color:#e94560;box-shadow:0 0 50px rgba(233,69,96,0.5)"><h1 style="color:#e94560">🚔 GAME OVER 🚔</h1><div id="winnerAvatar" style="font-size:5em"></div><div id="winnerName" style="font-size:2em;color:#e94560;margin:10px 0"></div><p style="color:#a8a8b3">Rotting in prison. Better luck next time!</p><button class="btn" onclick="location.reload()">TRY AGAIN!</button></div>`;
        document.body.appendChild(ws);
    }
    document.getElementById('winnerAvatar').textContent=player.avatar;
    document.getElementById('winnerName').textContent=`${player.name} is done!`;
    showScreen('winScreen');
}

// ── POPUP ─────────────────────────────────────────────────
function showPopup(title,message,type) {
    document.getElementById('popupTitle').textContent=title;
    document.getElementById('popupMessage').textContent=message;
    const popup=document.getElementById('popup');
    const content=popup.querySelector('.popup-content');
    content.className='popup-content'+(type==='good'?' popup-good':type==='bad'?' popup-bad':'');
    content.querySelectorAll('button').forEach(b=>b.remove());
    const ok=document.createElement('button'); ok.className='btn'; ok.textContent='OK!!'; ok.onclick=closePopup;
    content.appendChild(ok);
    popup.classList.remove('hidden');
}
function closePopup() { document.getElementById('popup').classList.add('hidden'); }
