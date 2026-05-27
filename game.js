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

const HOUSING = [
    { level:0,  name:'Homeless',       icon:'🏚️',  price:0,      rent:0,    lapReq:0   },
    { level:1,  name:'Cardboard Box',  icon:'📦',  price:0,      rent:0,    lapReq:0   },
    { level:2,  name:"Friend's Couch", icon:'🛋️',  price:500,    rent:100,  lapReq:0   },
    { level:3,  name:'Apartment',      icon:'🏢',  price:2000,   rent:300,  lapReq:0   },
    { level:4,  name:'Mobile Home',    icon:'🏠',  price:4000,   rent:400,  lapReq:25  },
    { level:5,  name:'RV',             icon:'🚌',  price:6000,   rent:500,  lapReq:25  },
    { level:6,  name:'Duplex',         icon:'🏘️',  price:10000,  rent:700,  lapReq:25  },
    { level:7,  name:'Studio',         icon:'🏙️',  price:15000,  rent:900,  lapReq:50  },
    { level:8,  name:'1 Bedroom',      icon:'🏡',  price:20000,  rent:1100, lapReq:50  },
    { level:9,  name:'2 Bedroom',      icon:'🏡',  price:30000,  rent:1400, lapReq:50  },
    { level:10, name:'3 Bedroom',      icon:'🏠',  price:45000,  rent:1800, lapReq:75  },
    { level:11, name:'4 Bedroom',      icon:'🏠',  price:65000,  rent:2200, lapReq:75  },
    { level:12, name:'Skyline Apt',    icon:'🌆',  price:90000,  rent:3000, lapReq:75  },
    { level:13, name:'Mansion',        icon:'🏰',  price:150000, rent:0,    lapReq:100 },
];
const CARS = [
    { level:0,  name:'On Foot',     icon:'🚶',  price:0,     payment:0,   impound:0,   isHoopty:false, isBike:false },
    { level:1,  name:'Bicycle',     icon:'🚲',  price:200,   payment:0,   impound:50,  isHoopty:false, isBike:true  },
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
const BOARD_SPACES = [
    { id:0,  type:'corner',   icon:'🏁', name:'START',          desc:'Begin your new life!' },
    { id:1,  type:'hustle',   icon:'🛻', name:'Junk Hauling',   desc:'Haul junk for quick cash!' },
    { id:2,  type:'hustle',   icon:'⛺', name:'Pop Up Tent',    desc:'Set up a pop-up shop!' },
    { id:3,  type:'hustle',   icon:'🐟', name:'Fishing Trip',   desc:'Sell your catch!' },
    { id:4,  type:'car',      icon:'🚗', name:'AutoZone Deals', desc:'Budget cars!' },
    { id:5,  type:'fastfood', icon:'🍔', name:"McDonald's",     desc:'Hungry? Spend some cash!' },
    { id:6,  type:'house',    icon:'🏠', name:'Budget Housing', desc:'Affordable homes!', tier:'budget' },
    { id:7,  type:'realtor',  icon:'🏢', name:'City Realty',    desc:'Entry-level realtor!' },
    { id:8,  type:'hustle',   icon:'🎨', name:'Craft Show',     desc:'Sell your crafts!' },
    { id:9,  type:'corner',   icon:'⛓️', name:'JAIL',           desc:'Just Visiting... or IN!' },
    { id:10, type:'hustle',   icon:'🌮', name:'Food Truck',     desc:'Run a food truck!' },
    { id:11, type:'hustle',   icon:'🪟', name:'Window Washing', desc:'Wash windows for cash!' },
    { id:12, type:'car',      icon:'🚘', name:'Mid Auto Sales', desc:'Mid-range cars!' },
    { id:13, type:'hustle',   icon:'🐕', name:'Dog Walking',    desc:'Walk dogs for tips!' },
    { id:14, type:'payday',   icon:'💰', name:'PAYDAY',         desc:'Collect your paycheck!' },
    { id:15, type:'hustle',   icon:'🏷️', name:'Yard Sale',      desc:'Hold a yard sale!' },
    { id:16, type:'hustle',   icon:'🃏', name:'Card Games',     desc:'Play cards for money!' },
    { id:17, type:'house',    icon:'🏘️', name:'Mid Housing',    desc:'Mid-range homes!', tier:'mid' },
    { id:18, type:'corner',   icon:'🎁', name:'FREE DAY',       desc:'+0.5 Happiness!' },
    { id:19, type:'hustle',   icon:'🧺', name:'Laundry Service',desc:'Run a laundry hustle!' },
    { id:20, type:'hustle',   icon:'🎪', name:'Flea Market',    desc:'Sell at the flea market!' },
    { id:21, type:'realtor',  icon:'🏡', name:'Prestige Homes', desc:'Luxury realtor!', tier:'luxury' },
    { id:22, type:'bad',      icon:'📋', name:'TAXES',          desc:'Pay 10% of total assets!' },
    { id:23, type:'fastfood', icon:'🌮', name:'Taco Bell',      desc:'Live Mas. Spend some cash!' },
    { id:24, type:'hustle',   icon:'🚜', name:'Scrap Metal',    desc:'Sell scrap metal!' },
    { id:25, type:'car',      icon:'🏎️', name:'Luxury Motors',  desc:'High-end cars!' },
    { id:26, type:'good',     icon:'✈️',  name:'Vacation Pay',  desc:'Collect vacation pay!' },
    { id:27, type:'corner',   icon:'🚔', name:'GO TO JAIL',     desc:'Go directly to Jail!' },
    { id:28, type:'hustle',   icon:'🚲', name:'Bike Courier',   desc:'Deliver packages by bike!' },
    { id:29, type:'hustle',   icon:'🍋', name:'Lemonade Stand', desc:'Run a lemonade stand!' },
    { id:30, type:'hustle',   icon:'🎸', name:'Busking',        desc:'Play music on the street!' },
    { id:31, type:'house',    icon:'🏰', name:'Elite Estates',  desc:'Luxury homes!', tier:'luxury' },
    { id:32, type:'hustle',   icon:'🌿', name:'Lawn Mowing',    desc:'Mow lawns for cash!' },
    { id:33, type:'bad',      icon:'🏥', name:'Hospital',       desc:'Emergency visit!' },
    { id:34, type:'realtor',  icon:'🏦', name:'Metro Realty',   desc:'Mid-tier realtor!', tier:'mid' },
    { id:35, type:'job',      icon:'💼', name:'Job Office',     desc:'Get or change your job!' },
];

function getGridPosition(id) {
    if (id <= 9)   return { row:9, col:9-id };
    if (id <= 17)  return { row:18-id, col:0 };
    if (id === 18) return { row:0, col:0 };
    if (id <= 26)  return { row:0, col:id-18 };
    if (id === 27) return { row:0, col:9 };
    return { row:id-27, col:9 };
}

const JAIL_REASONS = ['Possession','Trespassing','Public Intoxication','Unpaid Fines','Disorderly Conduct','Shoplifting','Assault','Outstanding Warrant','Parole Violation','Drug Charges'];
function sendToJail(p, reason) {
    p.position = 9; p.inJail = true; p.jailTurns = 0;
    p.jailReason = reason || rnd(JAIL_REASONS);
    p.jailMaxTurns = Math.ceil(Math.random() * 5);
    p.jailFine = 100 + Math.floor(Math.random() * 6) * 100;
    if (p.carLevel > 0) { p.vehicleSeized = p.carLevel; p.carLevel = 0; p.carImpounded = true; }
}

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
function getTier(laps) { return laps>=75?3:laps>=50?2:laps>=25?1:0; }
function getTierLabel(laps) { return laps>=75?'Senior Level (Lap 75+)':laps>=50?'Mid Level (Lap 50+)':laps>=25?'Entry Level (Lap 25+)':'Starting Out'; }
function getAvailableJobs(p) { return ALL_JOBS.filter(j => j.tier <= getTier(p.laps||0)); }

function upgradeHousing(p) {
    const nl = Math.min(HOUSING.length-1, p.housingLevel+1);
    if (nl===p.housingLevel) return p.name+' already has max housing!';
    const lapsNeeded = HOUSING[nl].lapReq||0;
    if ((p.laps||0)<lapsNeeded) return p.name+' needs Lap '+lapsNeeded+' for '+HOUSING[nl].name+'.';
    const cost = Math.max(0, HOUSING[nl].price-HOUSING[p.housingLevel].price);
    if (p.money>=cost) { p.money-=cost; p.housingLevel=nl; animateAssetIcon('apHousingIcon'); return p.name+' upgraded to '+HOUSING[nl].name+'!'; }
    return p.name+" can't afford "+HOUSING[nl].name+'. Need '+fmt(cost)+'.';
}
function carLapRequired(level) { return level>=9?75:level>=6?50:level>=3?25:0; }
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
function animateAssetIcon(id) { const el=document.getElementById(id); if(!el) return; el.classList.remove('upgraded'); void el.offsetWidth; el.classList.add('upgraded'); setTimeout(()=>el.classList.remove('upgraded'),600); }
function drawCard(deck) { return deck[Math.floor(Math.random()*deck.length)]; }

// ── CARDS ─────────────────────────────────────────────────
const GOOD_CARDS = [
    { name:'Tax Refund',       icon:'📋', effect:p=>{ p.money+=500;  adjustHappiness(p,0.5); return ['+$500','Tax refund!','good']; }},
    { name:'Side Hustle',      icon:'💼', effect:p=>{ p.money+=800;  adjustHappiness(p,0.5); return ['+$800','Side hustle paid off!','good']; }},
    { name:'Lottery Win',      icon:'🎰', effect:p=>{ p.money+=2000; adjustHappiness(p,0.5); return ['+$2,000','Won the lottery!','good']; }},
    { name:'Work Bonus',       icon:'💵', effect:p=>{ if(p.jobPay<=2000) return ['Free Pass!',p.name+' is unemployed.','sarcastic']; p.money+=p.jobPay; adjustHappiness(p,0.5); return ['+'+fmt(p.jobPay),'Work bonus!','good']; }},
    { name:'Found $100',       icon:'💰', effect:p=>{ p.money+=100;  adjustHappiness(p,0.5); return ['+$100','Found $100 on the ground!','good']; }},
    { name:'Birthday Money',   icon:'🎂', effect:p=>{ p.money+=300;  adjustHappiness(p,0.5); return ['+$300','Grandma sent $300!','good']; }},
    { name:'Garage Sale Win',  icon:'🏷️', effect:p=>{ p.money+=400;  adjustHappiness(p,0.5); return ['+$400','Sold junk for $400!','good']; }},
    { name:'Scratcher Win',    icon:'🎟️', effect:p=>{ p.money+=600;  adjustHappiness(p,0.5); return ['+$600','Won $600 on a scratcher!','good']; }},
    { name:'Free Car Upgrade', icon:'🚗', effect:p=>{ const r=upgradeCar(p,1); adjustHappiness(p,0.5); return [r.includes('upgraded')?'UPGRADE!':'No change',r,'good']; }},
    { name:'Stock Dividend',   icon:'📈', effect:p=>{ p.money+=700;  adjustHappiness(p,0.5); return ['+$700','Stocks paid dividends!','good']; }},
    { name:'Freelance Job',    icon:'💻', effect:p=>{ p.money+=1100; adjustHappiness(p,0.5); return ['+$1,100','Landed a freelance gig!','good']; }},
    { name:'Got a Raise',      icon:'⬆️',  effect:p=>{ if(p.jobPay<=2000) return ['Free Pass!',p.name+' is unemployed.','sarcastic']; p.jobPay=Math.round(p.jobPay*1.2); adjustHappiness(p,0.5); return ['+20% Pay','Got a 20% raise! Payday: '+fmt(p.jobPay),'good']; }},
    { name:'Insurance Payout', icon:'📄', effect:p=>{ p.money+=1500; adjustHappiness(p,0.5); return ['+$1,500','Got an insurance payout!','good']; }},
    { name:'Estate Check',     icon:'🏛️', effect:p=>{ p.money+=3000; adjustHappiness(p,0.5); return ['+$3,000','Inherited $3,000!','good']; }},
    { name:'Double Payday',    icon:'💰', effect:p=>{ p.money+=p.jobPay*2; adjustHappiness(p,0.5); return ['+'+fmt(p.jobPay*2),'Double payday!','good']; }},
    { name:'Promoted!',        icon:'🏆', effect:p=>{ if(p.jobPay<=2000) return ['Free Pass!',p.name+' is unemployed.','sarcastic']; p.jobPay=Math.round(p.jobPay*1.3); adjustHappiness(p,0.5); return ['+30% Pay','Got promoted! Payday: '+fmt(p.jobPay),'good']; }},
    { name:'Found Crypto',     icon:'🪙', effect:p=>{ p.money+=1000; adjustHappiness(p,0.5); return ['+$1,000','Found an old crypto wallet!','good']; }},
    { name:'Bet on Sports',    icon:'🏅', effect:p=>{ p.money+=900;  adjustHappiness(p,0.5); return ['+$900','Won a sports bet!','good']; }},
];
const BAD_CARDS = [
    { name:'Speeding Ticket',   icon:'🚨', effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Speeding ticket! -'+fmt(f),'bad']; }},
    { name:'Car Wreck',         icon:'💥', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Car wreck! -'+fmt(f),'bad']; }},
    { name:'Baby Surprise',     icon:'👶', effect:p=>{ const f=scaledFine(p,1000);charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Baby! There goes the savings!','bad']; }},
    { name:'Dentist',           icon:'🦷', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Cracked a tooth! -'+fmt(f),'bad']; }},
    { name:'Doctor Visit',      icon:'🏥', effect:p=>{ const f=scaledFine(p,350); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Sick — bill is -'+fmt(f),'bad']; }},
    { name:'Knee Surgery',      icon:'🩺', effect:p=>{ const f=scaledFine(p,2000);charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Knee surgery! -'+fmt(f),'bad']; }},
    { name:'Got Robbed',        icon:'🔫', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Got robbed! -'+fmt(f),'bad']; }},
    { name:'Go To Jail',        icon:'⛓️', effect:p=>{ sendToJail(p); adjustHappiness(p,-0.5); return ['JAIL!',p.name+' is going to jail! Reason: '+p.jailReason,'bad']; }},
    { name:'Rent Raised',       icon:'🏠', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Landlord raised the rent! -'+fmt(f),'bad']; }},
    { name:'Pipes Burst',       icon:'🚿', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!',p.name+' has no plumbing.','sarcastic']; const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Pipes burst! -'+fmt(f),'bad']; }},
    { name:'Engine Blew Up',    icon:'💨', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,1500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Engine blew! -'+fmt(f),'bad']; }},
    { name:'IRS Audit',         icon:'📋', effect:p=>{ const t=p.jobPay*5; charge(p,t); adjustHappiness(p,-0.5); return ['-'+fmt(t),'IRS Audit! Pay 5x payday!','bad']; }},
    { name:'DUI',               icon:'🍺', effect:p=>{ const f=scaledFine(p,2500); charge(p,f); sendToJail(p,'DUI'); adjustHappiness(p,-1); return ['-'+fmt(f)+' + JAIL','DUI! Pay '+fmt(f)+' and go to jail!','bad']; }},
    { name:'Divorce',           icon:'💔', effect:p=>{ const h=Math.floor(p.money*0.3); charge(p,h); adjustHappiness(p,-1); return ['-'+fmt(h),'Divorced! Lost 30% of savings!','bad']; }},
    { name:'Medical Bills',     icon:'🏥', effect:p=>{ const f=scaledFine(p,1800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Massive medical bill! -'+fmt(f),'bad']; }},
    { name:'Gambling Debt',     icon:'🎲', effect:p=>{ const f=scaledFine(p,700); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Gambling debt! -'+fmt(f),'bad']; }},
    { name:'Car Stolen',        icon:'🔑', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; p.carLevel=Math.max(0,p.carLevel-1); adjustHappiness(p,-0.5); return ['Car Downgraded','Car got stolen!','bad']; }},
    { name:'Move Back w/ Parents',icon:'🏚️',effect:p=>{ p.housingLevel=Math.max(0,p.housingLevel-2); adjustHappiness(p,-1); return ['Housing Downgraded','Had to move back with parents!','bad']; }},
];
const SARCASTIC_CARDS = [
    { name:"You're So Smart",  icon:'🧠', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'"Genius" investment. -'+fmt(f)+'. Big brain.','sarcastic']; }},
    { name:'Free Money!',      icon:'💸', effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'"Free money!" Just kidding. -'+fmt(f)+' in fees.','sarcastic']; }},
    { name:'Investment Guru',  icon:'📉', effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Became an investment guru. -'+fmt(f)+' says otherwise.','sarcastic']; }},
    { name:'Influencer Life',  icon:'📸', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Bought props for content. 3 views. -'+fmt(f),'sarcastic']; }},
    { name:'Manifesting',      icon:'✨', effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',p.name+' manifested wealth. Universe said no.','sarcastic']; }},
    { name:'Morning Routine',  icon:'⏰', effect:p=>{ adjustHappiness(p,-1); return ['-1 Happiness','Woke up at 5am. Still miserable.','sarcastic']; }},
    { name:'Vision Board',     icon:'🗂️', effect:p=>{ charge(p,50); adjustHappiness(p,-0.5); return ['-$50','Made a vision board. Vision: still broke. Cost: $50','sarcastic']; }},
    { name:'NFT Purchase',     icon:'🖼️', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Bought an NFT. It's worth $0. -"+fmt(f),'sarcastic']; }},
];
const FUNNY_GOOD_CARDS = [
    { name:'Accidental Influencer',icon:'🤳',effect:p=>{ p.money+=800; adjustHappiness(p,0.5); return ['+$800','You tripped on camera and went viral. Brand deal landed!','good']; }},
    { name:'Raccoon Business',     icon:'🦝',effect:p=>{ p.money+=600; adjustHappiness(p,0.5); return ['+$600','Trained raccoons to collect cans. They run the hustle now.','good']; }},
    { name:'Hot Dog Cart Empire',  icon:'🌭',effect:p=>{ p.money+=1200;adjustHappiness(p,0.5); return ['+$1,200','Hot dog cart went international somehow.','good']; }},
    { name:'Garage Sale Gold',     icon:'🏺',effect:p=>{ p.money+=2000;adjustHappiness(p,0.5); return ['+$2,000','Sold a "junk" bowl for $2,000. Ming Dynasty.','good']; }},
    { name:'Free Pizza Day',       icon:'🍕',effect:p=>{ p.money+=100; adjustHappiness(p,1);   return ['+$100 +😊','Free pizza at work. This is the best day.','good']; }},
    { name:'Goat Yoga Instructor', icon:'🐐',effect:p=>{ p.money+=800; adjustHappiness(p,0.5); return ['+$800','Certified goat yoga instructor. Goats loved you.','good']; }},
    { name:'Dumpster Picasso',     icon:'🎨',effect:p=>{ p.money+=1500;adjustHappiness(p,0.5); return ['+$1,500','Trash sculpture sold at auction. Art world is wild.','good']; }},
    { name:'Duck Army',            icon:'🦆',effect:p=>{ p.money+=600; adjustHappiness(p,0.5); return ['+$600','Duck army you trained finally paid dividends.','good']; }},
];
const FUNNY_BAD_CARDS = [
    { name:'Tripped into a Puddle',icon:'💦',effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Fell in puddle on way to interview. New clothes: '+fmt(f),'bad']; }},
    { name:'Squirrel in the Walls',icon:'🐿️',effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Squirrel in your walls. Eviction: '+fmt(f),'bad']; }},
    { name:'GPS Betrayal',         icon:'🗺️',effect:p=>{ const f=scaledFine(p,250); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'GPS drove you into a lake. Towing: '+fmt(f),'bad']; }},
    { name:'Emotional Support Emu',icon:'🐦',effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Emu destroyed the apartment. Damages: '+fmt(f),'bad']; }},
    { name:'Crypto Bro Advice',    icon:'🪙',effect:p=>{ const f=scaledFine(p,900); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Took advice from guy in Lamborghini hat. Lost '+fmt(f),'bad']; }},
    { name:'Wrong Burrito Order',  icon:'🌯',effect:p=>{ const f=scaledFine(p,100); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Ordered mild. Got ghost pepper. Hospital: '+fmt(f),'bad']; }},
    { name:'Overslept Interview',  icon:'⏰',effect:p=>{ adjustHappiness(p,-1); return ['Lost Opportunity','Overslept the interview. No money lost. Just your future.','bad']; }},
];
const FUNNY_SARCASTIC_CARDS = [
    { name:'Meditation App',     icon:'🧘',effect:p=>{ charge(p,50); adjustHappiness(p,-0.5); return ['-$50','$50 for meditation app. Used once. Stressed AND broke.','sarcastic']; }},
    { name:'LinkedIn Grindset',  icon:'💼',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing','Posted about your journey on LinkedIn. Zero interviews.','sarcastic']; }},
    { name:'5 AM Club',          icon:'⏰',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood','Joined 5am club. Still broke. Just tired AND broke.','sarcastic']; }},
    { name:'Passive Income Guru',icon:'💸',effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Passive income stream cost more to set up than it paid.','sarcastic']; }},
];
const ADULT_GOOD_CARDS = [
    { name:'Ex Paid Back',       icon:'💔',effect:p=>{ p.money+=600; adjustHappiness(p,0.5); return ['+$600','Ex finally paid back that $600. 3 years later. In Venmo pennies.','good']; }},
    { name:'Therapy is Working', icon:'🛋️',effect:p=>{ p.money+=300; adjustHappiness(p,1);   return ['+$300 +😊','Therapy worked. Toxic ex cut off. Raise negotiated.','good']; }},
    { name:'Happy Hour Victory', icon:'🥂',effect:p=>{ p.money+=200; adjustHappiness(p,1);   return ['+$200 +😊','Two-for-one happy hour. Met a financial advisor. UP.','good']; }},
    { name:'Functioning Adult',  icon:'✅',effect:p=>{ p.money+=400; adjustHappiness(p,0.5); return ['+$400','Actually filed taxes on time. Adulthood: 1, Chaos: 0.','good']; }},
    { name:'Petty but Profitable',icon:'😏',effect:p=>{ p.money+=700; adjustHappiness(p,0.5); return ['+$700','Bet coworker $700 on promotion. You won. No regrets.','good']; }},
];
const ADULT_BAD_CARDS = [
    { name:'Situationship Tax',   icon:'💔',effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'Situationship ended. Paid half of "our" vacation. -'+fmt(f),'bad']; }},
    { name:'Emotional Spending',  icon:'🛍️',effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Feelings got expensive. Cart didn't care. -"+fmt(f),'bad']; }},
    { name:'Work Happy Hour',     icon:'🥃',effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'Said too much at happy hour. HR meeting cost: '+fmt(f),'bad']; }},
    { name:'Gas Station Sushi',   icon:'🍣',effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'Gas station sushi on a dare. Hospital: '+fmt(f)+'. Dare money: $20.','bad']; }},
    { name:'Drunk Online Shopping',icon:'🛒',effect:p=>{ const f=scaledFine(p,450); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Woke up to 8 confirmation emails. Returned none.','bad']; }},
];
const ADULT_SARCASTIC_CARDS = [
    { name:'Work-Life Balance',    icon:'⚖️',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood','Found work-life balance. Work wins every time.','sarcastic']; }},
    { name:'Main Character Moment',icon:'⭐',effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Had a main character moment. Supporting cast filed complaint.','sarcastic']; }},
    { name:'Hot Girl Walk',        icon:'🚶',effect:p=>{ p.money+=50; adjustHappiness(p,0.5); return ['+$50','Went on a hot girl walk. Found $50. First W in weeks.','good']; }},
];
const HOUSING_CARDS = [
    { name:'Free Upgrade!',        icon:'🏠', effect:p=>{ const r=upgradeHousing(p); adjustHappiness(p,r.includes('upgraded')?0.5:-0.5); return [r.includes('upgraded')?'UPGRADE!':'No change',r,r.includes('upgraded')?'good':'bad']; }},
    { name:'Landlord Raised Rent', icon:'🏠', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!',p.name+' has no landlord.','sarcastic']; const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Landlord raised rent! -'+fmt(f),'bad']; }},
    { name:'Pipes Burst',          icon:'🚿', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!','No plumbing.','sarcastic']; const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Pipes burst! -'+fmt(f),'bad']; }},
    { name:'Move Back w/ Parents', icon:'🏚️', effect:p=>{ p.housingLevel=Math.max(0,p.housingLevel-2); adjustHappiness(p,-1); return ['Downgraded','Moved back with the parents!','bad']; }},
    { name:'House Party Damage',   icon:'🎉', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Wild house party. Damage: '+fmt(f),'bad']; }},
];
const CAR_CARDS = [
    { name:'Free Upgrade!',  icon:'🚗', effect:p=>{ const r=upgradeCar(p,1); adjustHappiness(p,r.includes('upgraded')?0.5:-0.5); return [r.includes('upgraded')?'UPGRADE!':'No change',r,r.includes('upgraded')?'good':'bad']; }},
    { name:'Flat Tire',      icon:'🔧', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,150); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Flat tire! -'+fmt(f),'bad']; }},
    { name:'Engine Blew Up', icon:'💨', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,1500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Engine blew! -'+fmt(f),'bad']; }},
    { name:'Car Got Stolen', icon:'🔑', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; p.carLevel=Math.max(0,p.carLevel-1); adjustHappiness(p,-0.5); return ['Downgraded','Car got stolen!','bad']; }},
    { name:'Free Oil Change',icon:'🛞', effect:p=>{ p.money+=80; adjustHappiness(p,0.5); return ['+$80','Free oil change coupon! +$80','good']; }},
    { name:'Fender Bender',  icon:'🚗', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car.','sarcastic']; const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Fender bender! -'+fmt(f),'bad']; }},
];
const JOB_CARDS = [
    { name:'Got Hired!', icon:'💼', effect:p=>{ const pool=getAvailableJobs(p).filter(j=>j.pay>p.jobPay); if(!pool.length) return p.name+' already has the best job available!'; const j=rnd(pool); p.job=j.name; p.jobPay=j.pay; adjustHappiness(p,0.5); return p.name+' hired as '+j.icon+' '+j.name+'! Payday: $'+j.pay.toLocaleString(); }},
    { name:'Got Fired!', icon:'🔥', effect:p=>{ p.job='Unemployed'; p.jobPay=2000; adjustHappiness(p,-1); return p.name+' got FIRED! Back to Unemployed.'; }},
];

function getGoodCards()      { return gameState.boardMode==='funny'?FUNNY_GOOD_CARDS:gameState.boardMode==='sarcastic'?ADULT_GOOD_CARDS:GOOD_CARDS; }
function getBadCards()       { return gameState.boardMode==='funny'?FUNNY_BAD_CARDS:gameState.boardMode==='sarcastic'?ADULT_BAD_CARDS:BAD_CARDS; }
function getSarcasticCards() { return gameState.boardMode==='funny'?FUNNY_SARCASTIC_CARDS:gameState.boardMode==='sarcastic'?ADULT_SARCASTIC_CARDS:SARCASTIC_CARDS; }

const FUNNY_SPACE_NAMES = {
    'START':{"name":'ESCAPED THE ZOO',"icon":'🦁',"desc":'You escaped! Run!'},
    'JAIL':{"name":'TIMEOUT CORNER',"icon":'⏰',"desc":'Sit and think.'},
    'FREE DAY':{"name":'NAPPING CHAMPIONSHIP',"icon":'😴',"desc":'+0.5 Happiness! ZZZ'},
    'GO TO JAIL':{"name":'BACK TO THE ZOO',"icon":'🦁',"desc":'The zookeeper caught you.'},
    'TAXES':{"name":'SNACK TAX',"icon":'🍟',"desc":'Pay 10% for eating snacks.'},
    'Hospital':{"name":'Boo-Boo Clinic',"icon":'🩹',"desc":'You walked into a glass door.'},
    "McDonald's":{"name":'McSloppy\'s',"icon":'🤡',"desc":'You know you\'re going in.'},
};
const ADULT_SPACE_NAMES = {
    'START':{"name":'PAROLE OFFICE',"icon":'📋',"desc":'Sign here. Don\'t mess up.'},
    'JAIL':{"name":'THINKING ROOM',"icon":'🚬',"desc":'We both know why you\'re here.'},
    'FREE DAY':{"name":'THE EX TEXTED',"icon":'💔',"desc":'Don\'t do it. +0.5 Happiness.'},
    'GO TO JAIL':{"name":'HR WANTS TO SEE YOU',"icon":'😬',"desc":'Clear your desk first.'},
    'TAXES':{"name":'GOVERNMENT TAKES A CUT',"icon":'🦅',"desc":'10% for roads you avoid.'},
    'Hospital':{"name":'Urgent Care Vacation',"icon":'🏥',"desc":'$500 to wait 4 hours.'},
    "McDonald's":{"name":'Impulse Decision HQ',"icon":'🍔',"desc":'You said you wouldn\'t.'},
    'Job Office':{"name":'LinkedIn Nightmare',"icon":'😅',"desc":'Update your resume. Again.'},
};
function getSpaceDisplay(space) {
    const o = gameState.boardMode==='funny'?FUNNY_SPACE_NAMES:gameState.boardMode==='sarcastic'?ADULT_SPACE_NAMES:{};
    return o[space.name] || { name:space.name, icon:space.icon, desc:space.desc };
}

// ── HUSTLE DATA ───────────────────────────────────────────
const HUSTLE_DATA = {
    'Pop Up Tent':    { bad:[{die:1,earn:-80,msg:'Permit officer shut you down. -$80'},{die:2,earn:-50,msg:'Rain killed the crowd. -$50'},{die:3,earn:-30,msg:'Nobody came. -$30'}],good:[{die:4,earn:200,msg:'Decent foot traffic! +$200'},{die:5,earn:350,msg:'Sold out by noon! +$350'},{die:6,earn:500,msg:'VIRAL! +$500'}] },
    'Craft Show':     { bad:[{die:1,earn:-100,msg:'Booth fee wasted. -$100'},{die:2,earn:-60,msg:'Dropped your best piece. -$60'},{die:3,earn:-30,msg:'Slow show. -$30'}],good:[{die:4,earn:250,msg:'People loved your work! +$250'},{die:5,earn:400,msg:'Custom orders! +$400'},{die:6,earn:600,msg:'Local news featured you! +$600'}] },
    'Food Truck':     { bad:[{die:1,earn:-200,msg:'Health inspector shut you down. -$200'},{die:2,earn:-100,msg:'Generator died. -$100'},{die:3,earn:-50,msg:'Got towed. -$50'}],good:[{die:4,earn:300,msg:'Steady lunch crowd! +$300'},{die:5,earn:500,msg:'Cleaned out! +$500'},{die:6,earn:800,msg:'Food festival 3hr wait! +$800'}] },
    'Yard Sale':      { bad:[{die:1,earn:-40,msg:"Sold grandma's china for $2. -$40"},{die:2,earn:-20,msg:'Rain soaked everything. -$20'},{die:3,earn:0,msg:'Only your neighbor came.'}],good:[{die:4,earn:150,msg:'Cleared clutter! +$150'},{die:5,earn:280,msg:'Collectibles sold fast! +$280'},{die:6,earn:450,msg:'Antique hunter paid top dollar! +$450'}] },
    'Flea Market':    { bad:[{die:1,earn:-80,msg:'Table fee, zero sales. -$80'},{die:2,earn:-50,msg:'Someone stole from you. -$50'},{die:3,earn:-20,msg:'Slow Sunday. -$20'}],good:[{die:4,earn:200,msg:'Solid hustle day! +$200'},{die:5,earn:380,msg:'Everything went! +$380'},{die:6,earn:550,msg:'Resellers buying bulk! +$550'}] },
    'Scrap Metal':    { bad:[{die:1,earn:-100,msg:'Truck broke hauling. -$100'},{die:2,earn:-60,msg:'Prices dropped. -$60'},{die:3,earn:-30,msg:'Yard closed. -$30'}],good:[{die:4,earn:200,msg:'Good haul! +$200'},{die:5,earn:350,msg:'Found copper wire! +$350'},{die:6,earn:500,msg:'Full dumpster score! +$500'}] },
    'Lemonade Stand': { bad:[{die:1,earn:-30,msg:'City shut you down. -$30'},{die:2,earn:-20,msg:'Dog knocked over pitcher. -$20'},{die:3,earn:0,msg:'Cold day. Nobody wanted lemonade.'}],good:[{die:4,earn:80,msg:'Hot day, good spot! +$80'},{die:5,earn:150,msg:'Line around the block! +$150'},{die:6,earn:250,msg:'Influencer posted you! +$250'}] },
    'Busking':        { bad:[{die:1,earn:-50,msg:'Broke a string. -$50'},{die:2,earn:-20,msg:'Cop moved you along. -$20'},{die:3,earn:0,msg:'Crickets.'}],good:[{die:4,earn:100,msg:'Tips rolling in! +$100'},{die:5,earn:200,msg:'Crowd gathered! +$200'},{die:6,earn:350,msg:'Talent scout gave you a card! +$350'}] },
    'Lawn Mowing':    { bad:[{die:1,earn:-100,msg:'Mower seized. -$100'},{die:2,earn:-60,msg:'Hit a sprinkler. -$60'},{die:3,earn:-20,msg:'Job canceled. -$20'}],good:[{die:4,earn:150,msg:'Got a few yards done! +$150'},{die:5,earn:280,msg:'Whole street hired you! +$280'},{die:6,earn:400,msg:'HOA seasonal contract! +$400'}] },
    'Junk Hauling':   { bad:[{die:1,earn:-100,msg:'Truck overloaded, blew a tire. -$100'},{die:2,earn:-60,msg:'Wrong dump, fined. -$60'},{die:3,earn:-30,msg:'Job canceled. -$30'}],good:[{die:4,earn:150,msg:'Cleared a garage! +$150'},{die:5,earn:280,msg:'Found sellable stuff! +$280'},{die:6,earn:400,msg:'Estate cleanout! +$400'}] },
    'Fishing Trip':   { bad:[{die:1,earn:-50,msg:'Lost gear in water. -$50'},{die:2,earn:-30,msg:'Zero bites. -$30'},{die:3,earn:-20,msg:'License expired. -$20'}],good:[{die:4,earn:100,msg:'Decent catch! +$100'},{die:5,earn:200,msg:'Sold fresh fish roadside! +$200'},{die:6,earn:350,msg:'Trophy fish at auction! +$350'}] },
    'Window Washing': { bad:[{die:1,earn:-80,msg:'Fell off ladder. -$80'},{die:2,earn:-40,msg:'Broke a window. -$40'},{die:3,earn:-20,msg:'Client canceled. -$20'}],good:[{die:4,earn:150,msg:'Knocked out a building! +$150'},{die:5,earn:260,msg:'Commercial contract! +$260'},{die:6,earn:400,msg:'Hotel hired you! +$400'}] },
    'Dog Walking':    { bad:[{die:1,earn:-100,msg:'Dog bit someone. -$100'},{die:2,earn:-50,msg:'Dog got loose. -$50'},{die:3,earn:-20,msg:'Owner canceled. -$20'}],good:[{die:4,earn:80,msg:'Easy walk, good tip! +$80'},{die:5,earn:160,msg:'Walked five dogs at once! +$160'},{die:6,earn:280,msg:'Rich neighbor wants daily walks! +$280'}] },
    'Card Games':     { bad:[{die:1,earn:-200,msg:'Got cleaned out. -$200'},{die:2,earn:-100,msg:'Bad hands all night. -$100'},{die:3,earn:-50,msg:'Lost focus. -$50'}],good:[{die:4,earn:150,msg:'Read the table right! +$150'},{die:5,earn:300,msg:'Big pot, better bluff! +$300'},{die:6,earn:500,msg:'Royal flush! +$500'}] },
    'Laundry Service':{ bad:[{die:1,earn:-80,msg:"Shrunk someone's clothes. -$80"},{die:2,earn:-40,msg:'Machine flooded. -$40'},{die:3,earn:-20,msg:'Mixed whites and colors. -$20'}],good:[{die:4,earn:100,msg:'Neighborhood orders! +$100'},{die:5,earn:200,msg:'Picked up a regular! +$200'},{die:6,earn:320,msg:'Airbnb host hired you weekly! +$320'}] },
    'Bike Courier':   { bad:[{die:1,earn:-80,msg:'Bike got stolen. -$80'},{die:2,earn:-50,msg:'Flat tire. -$50'},{die:3,earn:-20,msg:'Wrong address. -$20'}],good:[{die:4,earn:120,msg:'Fast routes, good tips! +$120'},{die:5,earn:230,msg:'Surge pricing! +$230'},{die:6,earn:380,msg:'VIP contract! +$380'}] },
};
const FUNNY_HUSTLE_OVERRIDES = {
    'Junk Hauling':{ icon:'🦸',name:'Superhero Junk Man',bad:[{die:1,earn:-80,msg:'Cape caught in truck. -$80'},{die:2,earn:-50,msg:'Client questioned hero status. -$50'},{die:3,earn:-30,msg:'Junk too junky. -$30'}],good:[{die:4,earn:150,msg:'Saved neighborhood from clutter! +$150'},{die:5,earn:280,msg:'Found treasure — sold it! +$280'},{die:6,earn:400,msg:'Media covered it! +$400'}] },
    'Food Truck':  { icon:'🚀',name:'Space Food Truck',bad:[{die:1,earn:-200,msg:'Launched to wrong planet. -$200'},{die:2,earn:-100,msg:'Aliens returned orders. -$100'},{die:3,earn:-50,msg:'Out of oxygen AND napkins. -$50'}],good:[{die:4,earn:300,msg:'Earth customers loved it! +$300'},{die:5,earn:500,msg:'NASA pre-ordered 200! +$500'},{die:6,earn:800,msg:'Space influencer review went viral! +$800'}] },
    'Lawn Mowing': { icon:'🐑',name:'Sheep Lawn Service',bad:[{die:1,earn:-100,msg:'Sheep escaped. Chaos. -$100'},{die:2,earn:-60,msg:'Sheep ate flowers. -$60'},{die:3,earn:-20,msg:'One sheep, wrong yard. -$20'}],good:[{die:4,earn:150,msg:'Sheep mowed perfectly! +$150'},{die:5,earn:280,msg:'Neighborhood booked all sheep! +$280'},{die:6,earn:400,msg:'Went viral. Sheep famous. +$400'}] },
    'Busking':     { icon:'🎸',name:'Air Guitar Champion',bad:[{die:1,earn:-50,msg:'Nobody tips air guitar. -$50'},{die:2,earn:-20,msg:'Lost imaginary pick. -$20'},{die:3,earn:0,msg:'Crowd confused. $0.'}],good:[{die:4,earn:100,msg:'Air guitar ironically huge hit! +$100'},{die:5,earn:200,msg:'Indie label called. +$200'},{die:6,earn:350,msg:'World air guitar title! +$350'}] },
};

const FAST_FOOD_DATA = {
    "McDonald's":{ icon:'🍔', menu:[
        { item:'Big Mac Meal',         price:12, msg:"Double-fisted a Big Mac meal. Worth it." },
        { item:'McFlurry + Nuggets',   price:9,  msg:"Oreo McFlurry and 10 nuggets. No regrets." },
        { item:'Happy Meal (for you)', price:7,  msg:"You ordered a Happy Meal. For yourself. No shame." },
        { item:'Full Family Haul',     price:45, msg:"Accidentally fed the whole block. $45 gone." },
        { item:'Late Night Drive-Thru',price:18, msg:"2am drive-thru run. Regrettable but delicious." },
    ]},
    'Taco Bell':{ icon:'🌮', menu:[
        { item:'Crunchwrap Supreme',   price:10, msg:"Crunchwrap Supreme meal. Perfection in a hexagon." },
        { item:'Nacho Fries Box',      price:8,  msg:"Nacho fries box. Gone in 4 minutes flat." },
        { item:'$5 Cravings Box',      price:5,  msg:"Five dollar cravings box. Actual value: priceless." },
        { item:'Party Pack (24 tacos)',price:32, msg:"24-taco party pack. Just you. No party." },
        { item:'Mexican Pizza',        price:7,  msg:"Mexican Pizza returned and you showed up." },
    ]},
};

// ── AVATAR BUILDER DATA ───────────────────────────────────
const tempSetup = { avatar: '' };
const AV = { skin:'#FDBCB4',hairStyle:'none',hairColor:'#3d2b1f',eyeStyle:'round',eyeColor:'#3d2b1f',browStyle:'normal',noseStyle:'normal',mouthStyle:'smile',cheeks:'none',outfitColor:'#1976d2',legColor:'#1565c0',shoeColor:'#1a1a1a',extras:'none' };
const AB_SKINS=[{l:'Porcelain',v:'#FFE4D6'},{l:'Ivory',v:'#FDBCB4'},{l:'Beige',v:'#F5C5A3'},{l:'Sand',v:'#E8A882'},{l:'Tan',v:'#D4855A'},{l:'Caramel',v:'#C06535'},{l:'Cocoa',v:'#8B4513'},{l:'Espresso',v:'#4A2006'},{l:'Olive',v:'#B5956A'},{l:'Golden',v:'#D4A055'},{l:'Alien',v:'#7EC850'},{l:'Robot',v:'#9E9E9E'},{l:'Undead',v:'#B0C4A0'},{l:'Blue',v:'#4A6FA5'},{l:'Purple',v:'#9B72CF'}];
const AB_HCOLORS=[{l:'Black',v:'#1a1a1a'},{l:'Dark Brown',v:'#3d2b1f'},{l:'Brown',v:'#7B4F2E'},{l:'Auburn',v:'#922B21'},{l:'Red',v:'#C0392B'},{l:'Strawberry',v:'#E8735A'},{l:'Blonde',v:'#F0D060'},{l:'Platinum',v:'#F5F0DC'},{l:'Grey',v:'#9E9E9E'},{l:'White',v:'#F5F5F5'},{l:'Blue',v:'#2980B9'},{l:'Purple',v:'#8E44AD'},{l:'Pink',v:'#E91E8C'},{l:'Green',v:'#27AE60'},{l:'Orange',v:'#E67E22'}];
const AB_ECOLORS=[{l:'Dark Brown',v:'#3d2b1f'},{l:'Brown',v:'#7B4F2E'},{l:'Hazel',v:'#8B7355'},{l:'Green',v:'#2d7a2d'},{l:'Teal',v:'#008080'},{l:'Blue',v:'#1565C0'},{l:'Ice Blue',v:'#7EC8E3'},{l:'Grey',v:'#607D8B'},{l:'Purple',v:'#6A1B9A'},{l:'Red',v:'#C62828'},{l:'Gold',v:'#F57F17'},{l:'Black',v:'#111'}];
const AB_OUTFIT_COLORS=[{l:'Navy',v:'#1565c0'},{l:'Red',v:'#c62828'},{l:'Green',v:'#2e7d32'},{l:'Purple',v:'#6a1b9a'},{l:'Orange',v:'#e65100'},{l:'Teal',v:'#00695c'},{l:'Pink',v:'#ad1457'},{l:'Black',v:'#1a1a1a'},{l:'Grey',v:'#455a64'},{l:'Gold',v:'#f9a825'},{l:'Brown',v:'#4e342e'},{l:'White',v:'#eceff1'}];
const AB_LEG_COLORS=[{l:'Dark Blue',v:'#1565c0'},{l:'Black',v:'#212121'},{l:'Grey',v:'#616161'},{l:'Khaki',v:'#8d6e63'},{l:'Navy',v:'#0d47a1'},{l:'Brown',v:'#4e342e'}];
const AB_SHOE_COLORS=[{l:'Black',v:'#1a1a1a'},{l:'White',v:'#f5f5f5'},{l:'Brown',v:'#6d4c41'},{l:'Red',v:'#c62828'},{l:'Blue',v:'#1565c0'},{l:'Gold',v:'#f9a825'}];
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
};
const AB_BROWS={normal:{l:'Normal',s:`<path d="M33 46 Q40 42 47 46" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M53 46 Q60 42 67 46" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/>`},thick:{l:'Thick',s:`<path d="M32 46 Q40 41 48 46" stroke="HC" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M52 46 Q60 41 68 46" stroke="HC" stroke-width="3.5" fill="none" stroke-linecap="round"/>`},thin:{l:'Thin',s:`<path d="M34 46 Q40 43 46 46" stroke="HC" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M54 46 Q60 43 66 46" stroke="HC" stroke-width="1.3" fill="none" stroke-linecap="round"/>`},arched:{l:'Arched',s:`<path d="M33 48 Q40 41 47 46" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M53 46 Q60 41 67 48" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/>`},angry:{l:'Angry',s:`<path d="M33 44 Q40 48 47 45" stroke="HC" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M53 45 Q60 48 67 44" stroke="HC" stroke-width="2.5" fill="none" stroke-linecap="round"/>`},raised:{l:'Raised',s:`<path d="M33 44 Q40 40 47 43" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M53 43 Q60 40 67 44" stroke="HC" stroke-width="2" fill="none" stroke-linecap="round"/>`},none:{l:'None',s:''}};
const AB_EYES={round:{l:'Round',s:`<ellipse cx="40" cy="54" rx="6" ry="6.5" fill="white"/><ellipse cx="60" cy="54" rx="6" ry="6.5" fill="white"/><circle cx="41" cy="55" r="3.5" fill="EC"/><circle cx="61" cy="55" r="3.5" fill="EC"/><circle cx="42" cy="54" r="1.2" fill="white"/><circle cx="62" cy="54" r="1.2" fill="white"/>`},almond:{l:'Almond',s:`<path d="M33 54 Q40 47 47 54 Q40 61 33 54Z" fill="white"/><path d="M53 54 Q60 47 67 54 Q60 61 53 54Z" fill="white"/><circle cx="40" cy="54" r="3" fill="EC"/><circle cx="60" cy="54" r="3" fill="EC"/><circle cx="41" cy="53" r="1" fill="white"/><circle cx="61" cy="53" r="1" fill="white"/>`},wide:{l:'Wide',s:`<circle cx="40" cy="54" r="7.5" fill="white"/><circle cx="60" cy="54" r="7.5" fill="white"/><circle cx="41" cy="55" r="4.5" fill="EC"/><circle cx="61" cy="55" r="4.5" fill="EC"/><circle cx="43" cy="53" r="1.5" fill="white"/><circle cx="63" cy="53" r="1.5" fill="white"/>`},sleepy:{l:'Sleepy',s:`<path d="M33 56 Q40 47 47 56" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M53 56 Q60 47 67 56" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="40" cy="54" r="2.5" fill="EC"/><circle cx="60" cy="54" r="2.5" fill="EC"/>`},wink:{l:'Wink',s:`<ellipse cx="40" cy="54" rx="6" ry="6.5" fill="white"/><circle cx="41" cy="55" r="3.5" fill="EC"/><circle cx="42" cy="54" r="1.2" fill="white"/><path d="M53 54 Q60 49 67 54" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`},star:{l:'Star',s:`<text x="34" y="60" font-size="12" fill="EC">&#9733;</text><text x="54" y="60" font-size="12" fill="EC">&#9733;</text>`},heart:{l:'Heart',s:`<text x="34" y="60" font-size="11" fill="#e91e63">&#9829;</text><text x="54" y="60" font-size="11" fill="#e91e63">&#9829;</text>`}};
const AB_NOSES={normal:{l:'Normal',s:`<path d="M47 62 Q45 69 43 71 Q50 74 57 71 Q55 69 53 62" stroke="#d4956a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`},button:{l:'Button',s:`<circle cx="50" cy="68" r="3.5" fill="#d4956a" opacity="0.4"/><circle cx="47" cy="69" r="1.3" fill="#d4956a" opacity="0.6"/><circle cx="53" cy="69" r="1.3" fill="#d4956a" opacity="0.6"/>`},wide:{l:'Wide',s:`<path d="M44 63 Q41 70 40 72 Q50 76 60 72 Q59 70 56 63" stroke="#d4956a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`},narrow:{l:'Narrow',s:`<path d="M49 62 Q48 69 47 71 Q50 73 53 71 Q52 69 51 62" stroke="#d4956a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`},pig:{l:'Pig',s:`<ellipse cx="50" cy="68" rx="7" ry="4.5" fill="#d4956a" opacity="0.45"/><circle cx="47" cy="68" r="1.8" fill="#d4956a" opacity="0.7"/><circle cx="53" cy="68" r="1.8" fill="#d4956a" opacity="0.7"/>`},none:{l:'None',s:''}};
const AB_MOUTHS={smile:{l:'Smile',s:`<path d="M40 77 Q50 85 60 77" stroke="#c0605a" stroke-width="2" fill="none" stroke-linecap="round"/>`},bigsmile:{l:'Big Smile',s:`<path d="M38 76 Q50 90 62 76" stroke="#c0605a" stroke-width="2" fill="#e07070" stroke-linecap="round"/><path d="M42 84 Q50 90 58 84" fill="white"/>`},neutral:{l:'Neutral',s:`<line x1="42" y1="79" x2="58" y2="79" stroke="#c0605a" stroke-width="2" stroke-linecap="round"/>`},frown:{l:'Frown',s:`<path d="M40 82 Q50 75 60 82" stroke="#c0605a" stroke-width="2" fill="none" stroke-linecap="round"/>`},smirk:{l:'Smirk',s:`<path d="M42 79 Q50 85 60 77" stroke="#c0605a" stroke-width="2" fill="none" stroke-linecap="round"/>`},open:{l:'Open',s:`<ellipse cx="50" cy="80" rx="8" ry="5" fill="#c0605a"/><ellipse cx="50" cy="79" rx="6.5" ry="3" fill="white"/><ellipse cx="50" cy="81" rx="6.5" ry="2.5" fill="#e07070"/>`},teeth:{l:'Grin',s:`<path d="M40 77 Q50 88 60 77 Q50 84 40 77Z" fill="#c0605a"/><rect x="42" y="79" width="16" height="4" rx="1" fill="white"/>`},tongue:{l:'Silly',s:`<path d="M40 77 Q50 88 60 77" stroke="#c0605a" stroke-width="2" fill="#e07070"/><ellipse cx="50" cy="84" rx="5" ry="4" fill="#e84393"/>`}};
const AB_CHEEKS={none:{l:'None',s:''},rosy:{l:'Rosy',s:`<ellipse cx="27" cy="65" rx="7" ry="4.5" fill="#FFB6C1" opacity="0.6"/><ellipse cx="73" cy="65" rx="7" ry="4.5" fill="#FFB6C1" opacity="0.6"/>`},freckles:{l:'Freckles',s:`<circle cx="30" cy="63" r="1.3" fill="#c07040" opacity="0.7"/><circle cx="35" cy="67" r="1.3" fill="#c07040" opacity="0.7"/><circle cx="65" cy="63" r="1.3" fill="#c07040" opacity="0.7"/><circle cx="70" cy="67" r="1.3" fill="#c07040" opacity="0.7"/>`},blush:{l:'Blush',s:`<ellipse cx="25" cy="65" rx="9" ry="5.5" fill="#FF8C94" opacity="0.35"/><ellipse cx="75" cy="65" rx="9" ry="5.5" fill="#FF8C94" opacity="0.35"/>`},stars:{l:'Stars',s:`<text x="19" y="68" font-size="8" opacity="0.8">&#10024;</text><text x="66" y="68" font-size="8" opacity="0.8">&#10024;</text>`},tears:{l:'Tears',s:`<path d="M33 58 Q31 66 29 72" stroke="#87CEEB" stroke-width="1.8" fill="none"/><path d="M67 58 Q69 66 71 72" stroke="#87CEEB" stroke-width="1.8" fill="none"/>`}};
const AB_EXTRAS={none:{l:'None',s:''},glasses:{l:'Glasses',s:`<circle cx="40" cy="54" r="8" stroke="#333" stroke-width="1.5" fill="none" opacity="0.7"/><circle cx="60" cy="54" r="8" stroke="#333" stroke-width="1.5" fill="none" opacity="0.7"/><line x1="48" y1="54" x2="52" y2="54" stroke="#333" stroke-width="1.5"/><line x1="22" y1="51" x2="32" y2="53" stroke="#333" stroke-width="1.5"/><line x1="68" y1="53" x2="78" y2="51" stroke="#333" stroke-width="1.5"/>`},sunglasses:{l:'Sunnies',s:`<rect x="29" y="49" width="18" height="11" rx="5.5" fill="#1a1a1a" opacity="0.88"/><rect x="53" y="49" width="18" height="11" rx="5.5" fill="#1a1a1a" opacity="0.88"/><line x1="47" y1="54" x2="53" y2="54" stroke="#555" stroke-width="1.5"/>`},crown:{l:'Crown',s:`<path d="M22 36 L30 18 L50 30 L70 18 L78 36 L66 31 L50 36 L34 31Z" fill="#FFD700"/><circle cx="30" cy="20" r="3" fill="#FF4444"/><circle cx="50" cy="31" r="3" fill="#4444FF"/><circle cx="70" cy="20" r="3" fill="#44FF44"/>`},tophat:{l:'Top Hat',s:`<rect x="32" y="6" width="36" height="28" rx="3" fill="#1a1a1a"/><rect x="20" y="32" width="60" height="6" rx="3" fill="#1a1a1a"/>`},halo:{l:'Halo',s:`<ellipse cx="50" cy="16" rx="20" ry="5" fill="none" stroke="#FFD700" stroke-width="3.5" opacity="0.9"/>`},horns:{l:'Horns',s:`<path d="M28 34 L22 10 L36 28Z" fill="#8B0000"/><path d="M72 34 L78 10 L64 28Z" fill="#8B0000"/>`},cowboy:{l:'Cowboy',s:`<ellipse cx="50" cy="34" rx="34" ry="5" fill="#8B4513"/><rect x="26" y="12" width="48" height="25" rx="10" fill="#8B4513"/>`},beanie:{l:'Beanie',s:`<ellipse cx="50" cy="36" rx="28" ry="16" fill="#E53935"/><rect x="22" y="33" width="56" height="9" rx="4" fill="#C62828"/><circle cx="50" cy="22" r="7" fill="#FF8A80"/>`},bandana:{l:'Bandana',s:`<path d="M24 53 Q50 66 76 53 Q76 62 50 70 Q24 62 24 53Z" fill="#E53935" opacity="0.88"/>`},headband:{l:'Headband',s:`<rect x="22" y="40" width="56" height="8" rx="4" fill="#E91E63"/><circle cx="50" cy="40" r="6" fill="#FF80AB"/>`}};

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
    gameState.players.push({id:gameState.currentSetupPlayer,name,avatar:tempSetup.avatar,job:'Unemployed',jobPay:2000,money:20000,position:0,housingLevel:0,carLevel:0,inJail:false,jailTurns:0,jailMaxTurns:3,jailReason:'',jailFine:200,vehicleSeized:0,carImpounded:false,jailFreeCards:0,happiness:5.0,turnsPlayed:0,laps:0,skipTurn:false,rentDue:0,carPaymentDue:0});
    gameState.currentSetupPlayer++;
    if(gameState.currentSetupPlayer>=gameState.numPlayers) startGame();
    else{showPlayerSetup();setTimeout(()=>{abUpdateSVG();abRenderOptions();},50);}
}

// ── START GAME ────────────────────────────────────────────
function startGame(){
    gameState.currentPlayerIndex=0;gameState.phase='playing';
    showScreen('gameScreen');
    document.getElementById('winGoalDisplay').textContent='🏆 '+fmt(gameState.winGoal);
    buildBoard();renderPlayerBar();updateCurrentPlayerDisplay();
}

// ── BOARD — uniform 10×10, center absolutely positioned ───
function buildBoard(){
    const board=document.getElementById('gameBoard');
    const centerArea=document.getElementById('centerArea');
    board.innerHTML='';
    board.appendChild(centerArea);
    document.getElementById('centerMode').textContent=gameState.boardMode==='funny'?'😂 FUNNY MODE':gameState.boardMode==='sarcastic'?'😈 SARCASTIC MODE':'The Game of Life';
    document.getElementById('centerGoal').textContent='🏆 Win: '+fmt(gameState.winGoal);
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
        player.position=(startPos+stepsDone)%36;
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
    const car=CARS[p.carLevel];set('apCarIcon',car.icon);set('apCarName',car.name);renderUpgradeTrack('carTrack',p.carLevel,CARS.length);
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
            player.laps++;const bill=collectRent(player);
            let lapMsg=`${player.name} passed START! Lap ${player.laps}\n📥 Payday: ${fmt(bill.gross)}`;
            if(bill.rent>0) lapMsg+=`  🏠 -${fmt(bill.rent)}`;
            if(bill.carPay>0) lapMsg+=`  🚗 -${fmt(bill.carPay)}`;
            lapMsg+=`\n✅ Net: ${fmt(bill.net)} | Balance: ${fmt(player.money)}`;
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
    if(doubles){player.inJail=false;if(player.vehicleSeized>0){player.carLevel=player.vehicleSeized;player.vehicleSeized=0;player.carImpounded=false;}renderPlayerBar();showCardOverlay('🎲','JAIL BREAK','Doubles! Free!',`${player.name} rolled doubles and escaped from: ${player.jailReason}!`,'good',()=>afterRoll(player,total));return;}
    player.jailTurns++;
    if(player.jailTurns>=player.jailMaxTurns){
        const imp=player.vehicleSeized>0?CARS[player.vehicleSeized].impound:0,tot=player.jailFine+imp;
        if(player.money>=tot){charge(player,tot);if(player.vehicleSeized>0){player.carLevel=player.vehicleSeized;player.vehicleSeized=0;player.carImpounded=false;}player.inJail=false;player.jailTurns=0;adjustHappiness(player,-0.5);renderPlayerBar();showCardOverlay('⛓️','RELEASED',`Paid ${fmt(tot)}`,`${player.name} paid bail and released from: ${player.jailReason}`,'bad',()=>endTurn());}
        else{gameState.phase='over';showCardOverlay('🚔','GAME OVER',"Can't Afford Bail",`${player.name} can't afford bail of ${fmt(tot)}. Rotting in prison!`,'bad',()=>showGameOver(player));}
    } else {renderPlayerBar();showCardOverlay('⛓️','STILL IN JAIL',`Turn ${player.jailTurns}/${player.jailMaxTurns}`,`${player.name} stays in jail (${player.jailReason}). Bail: ${fmt(player.jailFine)}`,'bad',()=>endTurn());}
}
function payBailEarly(){
    const player=gameState.players[gameState.currentPlayerIndex];if(!player.inJail) return;
    const imp=player.vehicleSeized>0?CARS[player.vehicleSeized].impound:0,tot=player.jailFine+imp;
    if(player.money>=tot){charge(player,tot);if(player.vehicleSeized>0){player.carLevel=player.vehicleSeized;player.vehicleSeized=0;player.carImpounded=false;}player.inJail=false;player.jailTurns=0;renderPlayerBar();showCardOverlay('⛓️','RELEASED','Bail Paid!',`${player.name} paid ${fmt(tot)} bail and is free!`,'good',()=>endTurn());}
    else showCardOverlay('💸','CANT PAY','Not Enough',`${player.name} needs ${fmt(tot)} but only has ${fmt(player.money)}.`,'bad');
}

function collectRent(player){
    const gross=player.jobPay;const rent=(player.housingLevel>=2&&player.housingLevel<13)?HOUSING[player.housingLevel].rent:0;const carPay=(player.carLevel>=2)?CARS[player.carLevel].payment:0;const bills=rent+carPay;const net=gross-bills;player.money+=gross;charge(player,bills);return{gross,rent,carPay,bills,net};
}

// ── SHOWDOWN — same square vehicle steal ──────────────────
function checkStealOpportunity(movingPlayer,newPos,callback){
    const targets=gameState.players.filter(p=>p.id!==movingPlayer.id&&p.position===newPos&&p.carLevel>0);
    if(!targets.length){callback();return;}
    const target=targets[0];
    gameState.stealContext={thief:movingPlayer,victim:target,callback};
    document.getElementById('stealTitle').textContent='⚡ VEHICLE SHOWDOWN ⚡';
    document.getElementById('stealDesc').textContent=`${movingPlayer.name} landed on ${target.name}'s space!\nUp for grabs: ${CARS[target.carLevel].icon} ${CARS[target.carLevel].name}\nBoth roll — highest wins the vehicle!`;
    const av1=document.getElementById('showdownAv1'),av2=document.getElementById('showdownAv2');
    if(av1) renderAvatar(av1,movingPlayer.avatar,44);if(av2) renderAvatar(av2,target.avatar,44);
    document.getElementById('showdownName1').textContent=movingPlayer.name;
    document.getElementById('showdownName2').textContent=target.name;
    document.getElementById('showdownDie1').textContent='🎲';document.getElementById('showdownDie2').textContent='🎲';
    document.getElementById('stealResult').textContent='';document.getElementById('stealRollBtn').disabled=false;
    document.getElementById('stealOverlay').classList.remove('hidden');
}
function resolveSteal(){
    const{thief,victim,callback}=gameState.stealContext;
    const d1=Math.ceil(Math.random()*6),d2=Math.ceil(Math.random()*6);
    const sd1=document.getElementById('showdownDie1'),sd2=document.getElementById('showdownDie2');
    sd1.classList.add('rolling');sd2.classList.add('rolling');
    let ticks=0;const iv=setInterval(()=>{
        sd1.textContent=DICE_FACES[Math.floor(Math.random()*6)+1];sd2.textContent=DICE_FACES[Math.floor(Math.random()*6)+1];ticks++;
        if(ticks>8){clearInterval(iv);sd1.classList.remove('rolling');sd2.classList.remove('rolling');sd1.textContent=DICE_FACES[d1];sd2.textContent=DICE_FACES[d2];
            let result='';
            if(d1>d2){const sl=victim.carLevel;victim.carLevel=0;thief.carLevel=sl;adjustHappiness(thief,1);adjustHappiness(victim,-1);result=`🏆 ${thief.name} wins! (${d1} vs ${d2})\nSTEAL SUCCESS! Grabbed the ${CARS[sl].icon} ${CARS[sl].name}!\n${victim.name} is left on foot! 😤`;}
            else if(d2>d1){adjustHappiness(victim,0.5);result=`🛡️ ${victim.name} defends! (${d2} vs ${d1})\n${victim.name} fought off ${thief.name} and kept their ride! 💪`;}
            else result=`🤝 TIE! Both rolled ${d1}!\n${victim.name} keeps the vehicle on a tie.`;
            document.getElementById('stealResult').textContent=result;renderPlayerBar();updatePlayerPieces();
            document.getElementById('stealRollBtn').disabled=true;
            setTimeout(()=>{document.getElementById('stealOverlay').classList.add('hidden');gameState.stealContext=null;callback();},4000);
        }
    },80);
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
    let nu=laps<25?`\nEntry jobs unlock at Lap 25 (${25-laps} away)`:laps<50?`\nMid jobs at Lap 50 (${50-laps} away)`:laps<75?`\nTop jobs at Lap 75 (${75-laps} away)`:'All jobs unlocked!';
    showUpgradePopup('💼 Job Office — '+getTierLabel(laps),`${player.name}, job offer:\n${offer.icon} ${offer.name} | Payday: ${fmt(offer.pay)}\nCurrent: ${player.job} (${fmt(player.jobPay)})${nu}`,'TAKE IT!',()=>{
        player.job=offer.name;player.jobPay=offer.pay;adjustHappiness(player,0.5);renderPlayerBar();closePopup();
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
    const d1El=document.getElementById('die1'),d2El=document.getElementById('die2');
    const die=Math.ceil(Math.random()*6);
    document.getElementById('gameMessage').textContent=`${player.name} hustling — ${space.name}! Rolling...`;
    animateDice(d1El,d2El,die,null,()=>{
        document.getElementById('diceResult').textContent=DICE_FACES[die]+' = '+die+(die<=3?' 😬 Bad luck!':' 😎 Nice roll!');
        const outcomes=die<=3?data.bad:data.good;const picked=outcomes[die<=3?die-1:die-4];const earn=picked.earn;
        if(earn>0){player.money+=earn;adjustHappiness(player,0.5);}else if(earn<0){charge(player,Math.abs(earn));adjustHappiness(player,-0.5);}
        renderPlayerBar();
        showCardOverlay(space.icon,'HUSTLE — '+space.name+' (rolled '+die+')',earn>0?'+'+fmt(earn):earn<0?'-'+fmt(Math.abs(earn)):'Nothing',picked.msg,earn>0?'good':earn<0?'bad':'sarcastic',()=>checkWinThenEnd(player));
    });
}

// ── WIN / END ─────────────────────────────────────────────
function checkWinThenEnd(player){if(!checkWin(player)) endTurn();}
function endTurn(){if(gameState.phase==='over') return;const player=gameState.players[gameState.currentPlayerIndex];if(checkWin(player)) return;gameState.currentPlayerIndex=(gameState.currentPlayerIndex+1)%gameState.numPlayers;renderPlayerBar();updateCurrentPlayerDisplay();}
function checkWin(player){if(player.money>=gameState.winGoal){showWin(player);return true;}return false;}
function showWin(player){
    gameState.phase='over';let ws=document.getElementById('winScreen');
    if(!ws){ws=document.createElement('div');ws.id='winScreen';ws.className='screen hidden';ws.innerHTML=`<div class="win-content"><h1>🏆 WINNER! 🏆</h1><div id="winnerAvatar" style="font-size:5em"></div><div id="winnerName" style="font-size:2em;color:#4ecca3;margin:10px 0"></div><div class="win-stats" id="winStats"></div><button class="btn" onclick="location.reload()">PLAY AGAIN!</button></div>`;document.body.appendChild(ws);}
    renderAvatar(document.getElementById('winnerAvatar'),player.avatar,100);
    document.getElementById('winnerName').textContent=`${player.name} WON!`;
    document.getElementById('winStats').innerHTML=`<div class="win-stat"><div class="win-stat-label">Final Money</div><div class="win-stat-value">${fmt(player.money)}</div></div><div class="win-stat"><div class="win-stat-label">Mood</div><div class="win-stat-value">${player.happiness.toFixed(1)}/10</div></div><div class="win-stat"><div class="win-stat-label">Home</div><div class="win-stat-value">${HOUSING[player.housingLevel].icon} ${HOUSING[player.housingLevel].name}</div></div><div class="win-stat"><div class="win-stat-label">Car</div><div class="win-stat-value">${CARS[player.carLevel].icon} ${CARS[player.carLevel].name}</div></div>`;
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
