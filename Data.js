// ============================================================
//  CHAOS - shared game data & rules  |  data.js
//  Loaded by BOTH index.html (solo) and play.html (online),
//  so the two modes can never drift apart again.
//  Change a lap requirement ONCE here (HOUSING lapReq / carLapRequired).
// ============================================================

// ---- Rules used by both modes --------------------------------
const RULES = {
    TURN_ROLLS: 5,        // each player rolls this many times in a row before the next player's turn (solo / pass-and-play)
};

// Net worth = cash + house value + car value.  This is the ONLY win measure.
function netWorth(p) {
    return (p.money||0)
         + ((typeof HOUSING!=='undefined' && HOUSING[p.housingLevel||0]) ? HOUSING[p.housingLevel||0].price : 0)
         + ((typeof CARS!=='undefined'    && CARS[p.carLevel||0])        ? CARS[p.carLevel||0].price        : 0);
}

// A vehicle is an "upgrade" for the thief only if it is worth more than what they already drive.
// Taking anything else is THEFT: roll two dice, doubles = stay out of jail, anything else = jail.
function isCarUpgrade(thiefCarLevel, victimCarLevel) {
    return (CARS[victimCarLevel||0].price) > (CARS[thiefCarLevel||0].price);
}

const HOUSING = [
    { level:0,  name:'Homeless',       icon:'🏚️',  price:0,      rent:0,    lapReq:0   },
    { level:1,  name:'Cardboard Box',  icon:'📦',  price:0,      rent:0,    lapReq:0   },
    { level:2,  name:"Friend's Couch", icon:'🛋️',  price:500,    rent:100,  lapReq:0   },
    { level:3,  name:'Apartment',      icon:'🏢',  price:2000,   rent:300,  lapReq:0   },
    { level:4,  name:'Mobile Home',    icon:'🏠',  price:4000,   rent:400,  lapReq:15  },
    { level:5,  name:'RV',             icon:'🚌',  price:6000,   rent:500,  lapReq:15  },
    { level:6,  name:'Duplex',         icon:'🏘️',  price:10000,  rent:700,  lapReq:15  },
    { level:7,  name:'Studio',         icon:'🏙️',  price:15000,  rent:900,  lapReq:30  },
    { level:8,  name:'1 Bedroom',      icon:'🏡',  price:20000,  rent:1100, lapReq:30  },
    { level:9,  name:'2 Bedroom',      icon:'🏡',  price:30000,  rent:1400, lapReq:30  },
    { level:10, name:'3 Bedroom',      icon:'🏠',  price:45000,  rent:1800, lapReq:45  },
    { level:11, name:'4 Bedroom',      icon:'🏠',  price:65000,  rent:2200, lapReq:45  },
    { level:12, name:'Skyline Apt',    icon:'🌆',  price:90000,  rent:3000, lapReq:45  },
    { level:13, name:'Mansion',        icon:'🏰',  price:150000, rent:0,    lapReq:60 },
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

const JAIL_REASONS = ['Possession','Trespassing','Public Intoxication','Unpaid Fines','Disorderly Conduct','Shoplifting','Assault','Outstanding Warrant','Parole Violation','Drug Charges'];

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

function getTier(laps) { return laps>=45?3:laps>=30?2:laps>=15?1:0; }

function getTierLabel(laps) { return laps>=45?'Senior Level (Lap 45+)':laps>=30?'Mid Level (Lap 30+)':laps>=15?'Entry Level (Lap 15+)':'Starting Out'; }

function getAvailableJobs(p) { return ALL_JOBS.filter(j => j.tier <= getTier(p.laps||0)); }

function carLapRequired(level) { return level>=9?45:level>=6?30:level>=3?15:0; }

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
    { name:'Overtime Pay',     icon:'⏱️', effect:p=>{ if(p.jobPay<=2000) return ['Free Pass!',p.name+' is unemployed.','sarcastic']; const b=Math.round(p.jobPay*0.5); p.money+=b; adjustHappiness(p,0.5); return ['+'+fmt(b),'Picked up overtime! +'+fmt(b),'good']; }},
    { name:'Cash Tips',        icon:'🤑', effect:p=>{ p.money+=350; adjustHappiness(p,0.5); return ['+$350','Pocketed $350 in cash tips!','good']; }},
    { name:'Sold Old Phone',   icon:'📱', effect:p=>{ p.money+=250; adjustHappiness(p,0.5); return ['+$250','Sold your old phone for $250!','good']; }},
    { name:'Class Action',     icon:'⚖️', effect:p=>{ p.money+=450; adjustHappiness(p,0.5); return ['+$450','Class-action settlement check arrived!','good']; }},
    { name:'Recycling Run',    icon:'♻️', effect:p=>{ p.money+=150; adjustHappiness(p,0.5); return ['+$150','Cashed in cans and bottles!','good']; }},
    { name:'Pawn Shop Win',    icon:'💎', effect:p=>{ p.money+=550; adjustHappiness(p,0.5); return ['+$550','Pawned a thrift-store find for $550!','good']; }},
    { name:'Cashback Bonus',   icon:'💳', effect:p=>{ p.money+=200; adjustHappiness(p,0.5); return ['+$200','Credit card cashback hit your account!','good']; }},
    { name:'Tool Resale',      icon:'🔧', effect:p=>{ p.money+=650; adjustHappiness(p,0.5); return ['+$650','Flipped some tools for a tidy profit!','good']; }},
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
    { name:'Parking Ticket',   icon:'🅿️', effect:p=>{ const f=scaledFine(p,120); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Parking ticket! -'+fmt(f),'bad']; }},
    { name:'Phone Repair',     icon:'📲', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Cracked your screen! -'+fmt(f),'bad']; }},
    { name:'Overdraft Fees',   icon:'🏦', effect:p=>{ const f=scaledFine(p,250); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Overdraft fees stacked up! -'+fmt(f),'bad']; }},
    { name:'Flat Tire',        icon:'🛞', effect:p=>{ if(p.carLevel===0) return ['Free Pass!','No car to flatten.','sarcastic']; const f=scaledFine(p,180); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Flat tire! -'+fmt(f),'bad']; }},
    { name:'Late Fees',        icon:'📅', effect:p=>{ const f=scaledFine(p,150); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Late on every bill again. -'+fmt(f),'bad']; }},
    { name:'Vet Bill',         icon:'🐈', effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Pet emergency at the vet! -'+fmt(f),'bad']; }},
    { name:'AC Broke',         icon:'❄️', effect:p=>{ if(p.housingLevel<3) return ['Free Pass!',p.name+' has no AC anyway.','sarcastic']; const f=scaledFine(p,900); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'AC died in a heatwave! -'+fmt(f),'bad']; }},
    { name:'Scammed Online',   icon:'📧', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Fell for a scam email. -'+fmt(f),'bad']; }},
];

const SARCASTIC_CARDS = [
    { name:'Galaxy Brain',      icon:'🧠', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Made a 'genius' play. Down "+fmt(f)+". Big brain, dumbass.",'sarcastic']; }},
    { name:'Free Money!',       icon:'💸', effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Clicked 'FREE MONEY.' It was "+fmt(f)+" in fees. Eat shit.",'sarcastic']; }},
    { name:'Investment Guru',   icon:'📉', effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Investment guru, my ass. The chart says you're broke. -"+fmt(f),'sarcastic']; }},
    { name:'Influencer Life',   icon:'📸', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Blew "+fmt(f)+" on content. 3 views: two bots and your mom. Pathetic.",'sarcastic']; }},
    { name:'Manifesting',       icon:'✨', effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',p.name+" manifested a fortune. The universe said 'go fuck yourself.'",'sarcastic']; }},
    { name:'Morning Routine',   icon:'⏰', effect:p=>{ adjustHappiness(p,-1); return ['-1 Happiness',"5am cold plunge, journaled your feelings, still broke as shit.",'sarcastic']; }},
    { name:'Vision Board',      icon:'🗂️', effect:p=>{ charge(p,50); adjustHappiness(p,-0.5); return ['-$50',"Made a vision board. It did jack fucking shit. -$50",'sarcastic']; }},
    { name:'NFT Purchase',      icon:'🖼️', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Right-clicked into a fortune. Your NFT's worth dick now. -"+fmt(f),'sarcastic']; }},
    { name:'Gym Membership',    icon:'🏋️', effect:p=>{ charge(p,50); adjustHappiness(p,-0.5); return ['-$50',"New Year's gym membership. Went once. Now you pay $50 for guilt.",'sarcastic']; }},
    { name:'Get-Rich Course',   icon:'🎓', effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Bought a course on getting rich. The only one who got rich was him. -"+fmt(f),'sarcastic']; }},
    { name:'Standing Desk',     icon:'🪑', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Dropped "+fmt(f)+" on a standing desk to fix your life. You sit at it.",'sarcastic']; }},
    { name:'Astrology App',     icon:'♈', effect:p=>{ charge(p,40); adjustHappiness(p,-0.5); return ['-$40',"Mercury's in retrograde and so's your goddamn bank balance. -$40",'sarcastic']; }},
    { name:'Dropshipping',      icon:'📦', effect:p=>{ const f=scaledFine(p,700); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Launched a dropshipping store. Sold jack shit. -"+fmt(f),'sarcastic']; }},
    { name:'Self-Care Sunday',  icon:'🛁', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Treated yourself into the fucking ground. -"+fmt(f),'sarcastic']; }},
    { name:'Skincare Haul',     icon:'💆', effect:p=>{ charge(p,80); adjustHappiness(p,-0.5); return ['-$80',"Bought every gadget on TikTok. Skin's the same, wallet's wrecked.",'sarcastic']; }},
    { name:'Productivity Apps', icon:'📱', effect:p=>{ charge(p,60); adjustHappiness(p,-0.5); return ['-$60',"Paid for 5 productivity apps. Spent all day setting them up. -$60",'sarcastic']; }},
    { name:'Networking Event',  icon:'🤝', effect:p=>{ const f=scaledFine(p,250); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Paid to 'network.' Got 9 business cards and a hangover. -"+fmt(f),'sarcastic']; }},
    { name:'Quit Caffeine',     icon:'☕', effect:p=>{ adjustHappiness(p,-1); return ['-1 Happiness',"Quit caffeine to 'optimize.' Now you're tired AND insufferable.",'sarcastic']; }},
    { name:'Budgeting App',     icon:'💰', effect:p=>{ charge(p,50); adjustHappiness(p,-0.5); return ['-$50',"App told you you're broke. No shit. -$50",'sarcastic']; }},
    { name:'Hustle Culture',    icon:'💼', effect:p=>{ adjustHappiness(p,-1); return ['-1 Happiness',"Grinded 80 hours this week. Made the same damn money. Love the grind!",'sarcastic']; }},
    { name:'Side Hustle #7',    icon:'🧾', effect:p=>{ const f=scaledFine(p,350); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Started your 7th side hustle. Lost money on all 7, dipshit. -"+fmt(f),'sarcastic']; }},
    { name:'Subscription Hell', icon:'📺', effect:p=>{ charge(p,90); adjustHappiness(p,-0.5); return ['-$90',"Paying for 11 streaming services. Watch none of the fuckers. -$90",'sarcastic']; }},
    { name:'Energy Drink Diet', icon:'⚡', effect:p=>{ charge(p,70); adjustHappiness(p,-0.5); return ['-$70',"Replaced sleep with energy drinks. Your heart's pissed and so's your wallet.",'sarcastic']; }},
    { name:'Drop Shipping 2',   icon:'📦', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Second dropshipping store. Sold the same as the first: not a damn thing.",'sarcastic']; }},
    { name:'Day Trading',       icon:'📉', effect:p=>{ const f=scaledFine(p,900); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Quit your job to day-trade. Market said get fucked. -"+fmt(f),'sarcastic']; }},
    { name:'Lucky Streak',      icon:'🍀', effect:p=>{ p.money+=120; adjustHappiness(p,0.5); return ['+$120',"Holy shit, an actual win? Found $120. Don't get used to it.",'good']; }},
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
    { name:'Goose Bodyguard',  icon:'🪿', effect:p=>{ p.money+=500; adjustHappiness(p,0.5); return ['+$500','Your goose chased off a mugger. Reward money rolled in!','good']; }},
    { name:'Viral Sneeze',     icon:'🤧', effect:p=>{ p.money+=800; adjustHappiness(p,0.5); return ['+$800','Your sneeze went viral. Brands love you now!','good']; }},
    { name:'Found a Sandwich', icon:'🥪', effect:p=>{ p.money+=300; adjustHappiness(p,1); return ['+$300 +😊','Found a $20 in a sandwich, then found more cash. Magic sandwich.','good']; }},
    { name:'Pigeon Investor',  icon:'🐦', effect:p=>{ p.money+=650; adjustHappiness(p,0.5); return ['+$650','A pigeon pecked the right stock on your screen. Genius bird.','good']; }},
    { name:'Toddler Jingle',   icon:'🧒', effect:p=>{ p.money+=400; adjustHappiness(p,0.5); return ['+$400','Your kid screamed a jingle. It landed on a cereal box.','good']; }},
    { name:'Trampoline Fame',  icon:'🤸', effect:p=>{ p.money+=550; adjustHappiness(p,0.5); return ['+$550','Bounced into internet stardom. Endorsement deal!','good']; }},
];

const FUNNY_BAD_CARDS = [
    { name:'Tripped into a Puddle',icon:'💦',effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Fell in puddle on way to interview. New clothes: '+fmt(f),'bad']; }},
    { name:'Squirrel in the Walls',icon:'🐿️',effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Squirrel in your walls. Eviction: '+fmt(f),'bad']; }},
    { name:'GPS Betrayal',         icon:'🗺️',effect:p=>{ const f=scaledFine(p,250); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'GPS drove you into a lake. Towing: '+fmt(f),'bad']; }},
    { name:'Emotional Support Emu',icon:'🐦',effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Emu destroyed the apartment. Damages: '+fmt(f),'bad']; }},
    { name:'Crypto Bro Advice',    icon:'🪙',effect:p=>{ const f=scaledFine(p,900); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Took advice from guy in Lamborghini hat. Lost '+fmt(f),'bad']; }},
    { name:'Wrong Burrito Order',  icon:'🌯',effect:p=>{ const f=scaledFine(p,100); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Ordered mild. Got ghost pepper. Hospital: '+fmt(f),'bad']; }},
    { name:'Overslept Interview',  icon:'⏰',effect:p=>{ adjustHappiness(p,-1); return ['Lost Opportunity','Overslept the interview. No money lost. Just your future.','bad']; }},
    { name:'Raccoon Heist',     icon:'🦝', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Raccoons raided your fridge AND your wallet. -'+fmt(f),'bad']; }},
    { name:'Wet Paint Chair',   icon:'🪑', effect:p=>{ const f=scaledFine(p,150); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Sat in wet paint. New pants: -'+fmt(f),'bad']; }},
    { name:'Karaoke Lawsuit',   icon:'🎤', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Sued for emotional damage after your karaoke. -'+fmt(f),'bad']; }},
    { name:'Llama Rampage',     icon:'🦙', effect:p=>{ const f=scaledFine(p,700); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Rented a party llama. It ate the whole buffet. -'+fmt(f),'bad']; }},
    { name:'Wrong Group Chat',  icon:'📱', effect:p=>{ adjustHappiness(p,-1); return ['Pure Cringe','Sent it to the family group chat. No money lost. Dignity? Gone.','bad']; }},
    { name:'Slipped on a Grape',icon:'🍇', effect:p=>{ const f=scaledFine(p,250); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'One grape. One ER visit. -'+fmt(f),'bad']; }},
];

const FUNNY_SARCASTIC_CARDS = [
    { name:'Meditation App',      icon:'🧘',effect:p=>{ charge(p,50); adjustHappiness(p,-0.5); return ['-$50',"Paid $50 for a calm app. Opened it once. Now stressed AND broke.",'sarcastic']; }},
    { name:'LinkedIn Grindset',   icon:'💼',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Posted your 'humbling journey' on LinkedIn. 4 likes, 0 interviews.",'sarcastic']; }},
    { name:'5 AM Club',           icon:'⏰',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Joined the 5AM Club. New result: tired AND broke.",'sarcastic']; }},
    { name:'Passive Income Guru', icon:'💸',effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Your passive income course cost more than it ever paid out.",'sarcastic']; }},
    { name:'Manifest Journal',    icon:'📓',effect:p=>{ charge(p,30); adjustHappiness(p,-0.5); return ['-$30',"Wrote your dreams in a $30 journal. Dreams: still pending.",'sarcastic']; }},
    { name:'Crystal Collection',  icon:'🔮',effect:p=>{ charge(p,60); adjustHappiness(p,-0.5); return ['-$60',"Bought healing crystals. Healed the crystal shop's profits.",'sarcastic']; }},
    { name:'Influencer Pivot',    icon:'📸',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Quit your job to be an influencer. Followers: your mom and a bot.",'sarcastic']; }},
    { name:'Cold Plunge',         icon:'🧊',effect:p=>{ charge(p,100); adjustHappiness(p,-0.5); return ['-$100',"Bought an ice bath. Screamed for 3 minutes. Did it exactly once.",'sarcastic']; }},
    { name:'Hustle Podcast',      icon:'🎙️',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Started a podcast. Two listeners. Both are you on two devices.",'sarcastic']; }},
    { name:'Vision Quest',        icon:'🏔️',effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Went to 'find yourself.' Found a gift shop. -"+fmt(f),'sarcastic']; }},
    { name:'Productivity Binge',  icon:'📈',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Watched 40 hours of productivity videos instead of working.",'sarcastic']; }},
    { name:'Smoothie Phase',      icon:'🥤',effect:p=>{ charge(p,70); adjustHappiness(p,-0.5); return ['-$70',"Bought a fancy blender. Made 2 smoothies. It's a paperweight now.",'sarcastic']; }},
    { name:'Goal Setting',        icon:'✅',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Set 30 goals for the year. Achieved 'still alive.' Close enough!",'sarcastic']; }},
    { name:'Fun Side Quest',      icon:'🗺️',effect:p=>{ const f=scaledFine(p,250); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Picked up a 'fun side hustle.' It's a second job now. -"+fmt(f),'sarcastic']; }},
    { name:'Gratitude Journal',   icon:'🙏',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Listed everything you're grateful for. Still want more money though.",'sarcastic']; }},
    { name:'Networking Brunch',   icon:'🥑',effect:p=>{ charge(p,60); adjustHappiness(p,-0.5); return ['-$60',"Paid $60 for avocado toast to 'make connections.' Made indigestion.",'sarcastic']; }},
    { name:'Reinvent Yourself',   icon:'🦋',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Reinvented yourself again. Same problems, new haircut.",'sarcastic']; }},
    { name:'Dopamine Detox',      icon:'📵',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Did a dopamine detox. Lasted 4 hours. Reward: a snack.",'sarcastic']; }},
    { name:'Wellness Retreat',    icon:'🌿',effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Wellness retreat fixed nothing but emptied your account. -"+fmt(f),'sarcastic']; }},
    { name:'Internet Life Hack',  icon:'💡',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Tried a life hack from the internet. Now you have a new problem.",'sarcastic']; }},
    { name:'Vision Board 2.0',  icon:'🗂️', effect:p=>{ charge(p,40); adjustHappiness(p,-0.5); return ['-$40',"Made a vision board for your vision board. Still no vision.",'sarcastic']; }},
    { name:'Almond Mom Phase',  icon:'🥛', effect:p=>{ charge(p,60); adjustHappiness(p,-0.5); return ['-$60',"Swapped meals for almonds and vibes. Hungry AND broke.",'sarcastic']; }},
    { name:'Becoming a Runner', icon:'🏃', effect:p=>{ charge(p,120); adjustHappiness(p,-0.5); return ['-$120',"Bought $120 of running gear. Ran straight to the couch.",'sarcastic']; }},
    { name:'Side Quest Energy', icon:'🎮', effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Did every side quest, ignored the main quest: your actual life.",'sarcastic']; }},
    { name:'Romanticize It',    icon:'🌸', effect:p=>{ charge(p,80); adjustHappiness(p,-0.5); return ['-$80',"Romanticized your commute with an $80 latte habit. So aesthetic.",'sarcastic']; }},
];

const ADULT_GOOD_CARDS = [
    { name:'Ex Paid Back',       icon:'💔',effect:p=>{ p.money+=600; adjustHappiness(p,0.5); return ['+$600','Ex finally paid back that $600. 3 years later. In Venmo pennies.','good']; }},
    { name:'Therapy is Working', icon:'🛋️',effect:p=>{ p.money+=300; adjustHappiness(p,1);   return ['+$300 +😊','Therapy worked. Toxic ex cut off. Raise negotiated.','good']; }},
    { name:'Happy Hour Victory', icon:'🥂',effect:p=>{ p.money+=200; adjustHappiness(p,1);   return ['+$200 +😊','Two-for-one happy hour. Met a financial advisor. UP.','good']; }},
    { name:'Functioning Adult',  icon:'✅',effect:p=>{ p.money+=400; adjustHappiness(p,0.5); return ['+$400','Actually filed taxes on time. Adulthood: 1, Chaos: 0.','good']; }},
    { name:'Petty but Profitable',icon:'😏',effect:p=>{ p.money+=700; adjustHappiness(p,0.5); return ['+$700','Bet coworker $700 on promotion. You won. No regrets.','good']; }},
    { name:'Venmo Comeback',    icon:'📲', effect:p=>{ p.money+=400; adjustHappiness(p,0.5); return ['+$400','That deadbeat friend finally paid you back. Shocking shit.','good']; }},
    { name:'Petty Win',         icon:'😏', effect:p=>{ p.money+=350; adjustHappiness(p,1); return ['+$350 +😊','Got the last laugh AND $350. Tastes fucking great.','good']; }},
    { name:'Side Gig Payout',   icon:'🛠️', effect:p=>{ p.money+=900; adjustHappiness(p,0.5); return ['+$900','Weekend side gig paid out big. Hustle pays, baby.','good']; }},
    { name:'No-Show Refund',    icon:'🎫', effect:p=>{ p.money+=250; adjustHappiness(p,0.5); return ['+$250','Got refunded for the wedding you "forgot." Worth it.','good']; }},
    { name:'Drunk Genius',      icon:'🍻', effect:p=>{ p.money+=600; adjustHappiness(p,0.5); return ['+$600','A drunk idea actually worked for once. +$600.','good']; }},
    { name:'Quit With Style',   icon:'🚪', effect:p=>{ p.money+=500; adjustHappiness(p,1); return ['+$500 +😊','Rage-quit, they begged you back with a raise. Power move.','good']; }},
    { name:'Won the Pool',      icon:'🎰', effect:p=>{ p.money+=700; adjustHappiness(p,0.5); return ['+$700','Won the office pool. Everyone hates you. Worth $700.','good']; }},
    { name:'Garage Gold',       icon:'📦', effect:p=>{ p.money+=450; adjustHappiness(p,0.5); return ['+$450','Sold the junk your ex left behind. +$450.','good']; }},
];

const ADULT_BAD_CARDS = [
    { name:'Situationship Tax',   icon:'💔',effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'Situationship ended. Paid half of "our" vacation. -'+fmt(f),'bad']; }},
    { name:'Emotional Spending',  icon:'🛍️',effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Feelings got expensive. Cart didn't care. -"+fmt(f),'bad']; }},
    { name:'Work Happy Hour',     icon:'🥃',effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'Said too much at happy hour. HR meeting cost: '+fmt(f),'bad']; }},
    { name:'Gas Station Sushi',   icon:'🍣',effect:p=>{ const f=scaledFine(p,800); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'Gas station sushi on a dare. Hospital: '+fmt(f)+'. Dare money: $20.','bad']; }},
    { name:'Drunk Online Shopping',icon:'🛒',effect:p=>{ const f=scaledFine(p,450); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Woke up to 8 confirmation emails. Returned none.','bad']; }},
    { name:'Bar Tab Shock',     icon:'🍸', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Bought rounds for strangers. Tab was -'+fmt(f)+'. Dumbass.','bad']; }},
    { name:'3AM Surge Ride',    icon:'🚕', effect:p=>{ const f=scaledFine(p,200); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'3am surge-priced ride across town. -'+fmt(f),'bad']; }},
    { name:'Tattoo Regret',     icon:'🖋️', effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'Drunk tattoo. Now paying to remove the bullshit. -'+fmt(f),'bad']; }},
    { name:'Ghosted & Charged', icon:'👻', effect:p=>{ const f=scaledFine(p,350); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'Paid for the whole date. Got ghosted. -'+fmt(f),'bad']; }},
    { name:'HR Wants a Word',   icon:'📎', effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'That "joke" cost you a sensitivity course. -'+fmt(f),'bad']; }},
    { name:'Vegas Blackout',    icon:'🎲', effect:p=>{ const f=scaledFine(p,1200); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),'What happens in Vegas costs -'+fmt(f)+' and stays on your card forever.','bad']; }},
    { name:'Speakeasy Scam',    icon:'🥃', effect:p=>{ const f=scaledFine(p,450); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),'$30 for an ice cube and "ambiance." -'+fmt(f),'bad']; }},
    { name:'Texted Your Ex',    icon:'📱', effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood','Texted your ex at 2am. No money lost. Just your whole damn peace.','bad']; }},
];

const ADULT_SARCASTIC_CARDS = [
    { name:'Work-Life Balance',    icon:'⚖️',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Found work-life balance. Work laughed and took both fucking halves.",'sarcastic']; }},
    { name:'Main Character Moment',icon:'⭐',effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Had a main character moment. Everyone agrees you're an asshole. -"+fmt(f),'sarcastic']; }},
    { name:'Hot Girl Walk',        icon:'🚶',effect:p=>{ p.money+=50; adjustHappiness(p,0.5); return ['+$50',"Hot girl walk paid off — found $50 on the ground. First W of this shit week.",'good']; }},
    { name:'Unbothered Era',       icon:'😌',effect:p=>{ const f=scaledFine(p,250); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Entered your 'unbothered' era. Got real bothered by a parking ticket. -"+fmt(f),'sarcastic']; }},
    { name:'Toxic Positivity',     icon:'☀️',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Good vibes only! Ignored every problem until it bit you in the ass.",'sarcastic']; }},
    { name:'Boundaries',           icon:'🗣️',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Called everyone 'toxic.' Now you have no friends, just boundaries.",'sarcastic']; }},
    { name:'Glow Up Plan',         icon:'✨',effect:p=>{ const f=scaledFine(p,500); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Started a glow-up. Spent "+fmt(f)+". Still the same gremlin.",'sarcastic']; }},
    { name:'Soft Life',            icon:'🛋️',effect:p=>{ const f=scaledFine(p,600); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Chose the 'soft life.' The bills chose violence. -"+fmt(f),'sarcastic']; }},
    { name:'Delulu',               icon:'🦄',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Stayed delusional as a coping mechanism. It's not coping. It's just delulu.",'sarcastic']; }},
    { name:'Quiet Quitting',       icon:'😶',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Quiet quit so hard you got loudly fired.",'sarcastic']; }},
    { name:'Revenge Bedtime',      icon:'📱',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Stayed up till 3am scrolling out of spite. Spite did not pay the rent.",'sarcastic']; }},
    { name:'New Phone Who Dis',    icon:'📵',effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Blocked everyone to 'start fresh.' Same dumb decisions, new contacts. -"+fmt(f),'sarcastic']; }},
    { name:'Mercury Retrograde',   icon:'♏',effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Blamed Mercury retrograde for your own bullshit. Mercury's tired of it.",'sarcastic']; }},
    { name:'Manifesting a Baddie', icon:'🔮',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Manifested a baddie lifestyle on a broke-ass budget. Universe said lmao.",'sarcastic']; }},
    { name:'Petty Revenge',        icon:'😈',effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Spent "+fmt(f)+" on elaborate petty revenge. They didn't even notice.",'sarcastic']; }},
    { name:'Doom Spending',        icon:'💳',effect:p=>{ const f=scaledFine(p,700); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"World's on fire so you bought shit you can't afford. Cope: -"+fmt(f),'sarcastic']; }},
    { name:'Situationship 2.0',    icon:'💔',effect:p=>{ const f=scaledFine(p,450); charge(p,f); adjustHappiness(p,-1); return ['-'+fmt(f),"Crawled back to the situationship. Same red flags, now with interest. -"+fmt(f),'sarcastic']; }},
    { name:'Self-Sabotage',        icon:'🔥',effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"Self-sabotaged right before things got good. A classic. Nailed it.",'sarcastic']; }},
    { name:'Healing Era',          icon:'🩹',effect:p=>{ const f=scaledFine(p,350); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"In your 'healing era.' Turns out healing is expensive as hell. -"+fmt(f),'sarcastic']; }},
    { name:'Living My Best Life',  icon:'🍸',effect:p=>{ const f=scaledFine(p,550); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Living your best life. Best life cost "+fmt(f)+" you didn't have.",'sarcastic']; }},
    { name:'Living My Truth',   icon:'🪞', effect:p=>{ const f=scaledFine(p,300); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Living your truth. Your truth is broke as hell. -"+fmt(f),'sarcastic']; }},
    { name:'Protect My Energy', icon:'🔋', effect:p=>{ adjustHappiness(p,-0.5); return ['Nothing',"Protected your energy so hard you ghosted your own job interview.",'sarcastic']; }},
    { name:'That Girl',         icon:'🥗', effect:p=>{ charge(p,110); adjustHappiness(p,-0.5); return ['-$110',"Became 'that girl.' That girl is also fucking broke. -$110",'sarcastic']; }},
    { name:'No Thoughts',       icon:'🫥', effect:p=>{ adjustHappiness(p,-1); return ['-1 Mood',"No thoughts, head empty, bank account also empty.",'sarcastic']; }},
    { name:'Treat Yourself',    icon:'💅', effect:p=>{ const f=scaledFine(p,400); charge(p,f); adjustHappiness(p,-0.5); return ['-'+fmt(f),"Treated yourself into an overdraft. Self-care, bitch. -"+fmt(f),'sarcastic']; }},
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

const STORY_BEATS = {
    1:  '\u260E\uFE0F Sully (P.O.): "First lap done. Don\'t make me regret vouching for you."',
    5:  '\u260E\uFE0F Sully: "Five laps clean. Look at you, almost a functioning member of society."',
    15: '\u260E\uFE0F Sully: "Entry-level work is opening up. Go earn something legit for once."',
    30: '\u260E\uFE0F Sully: "Mid-level now? I had ten bucks on you reoffending. Glad I lost it."',
    45: '\u260E\uFE0F Sully: "Senior gigs unlocked. The system never saw this coming. Neither did I."',
    60: '\u260E\uFE0F Sully: "A mansion?! From a prison cot to THIS. I am officially out of jokes."'
};

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
