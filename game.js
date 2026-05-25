// ============================================================
//  CHAOS - The Game of Life  |  game.js
// ============================================================

let gameState = {
    players: [],
    currentPlayerIndex: 0,
    numPlayers: 0,
    winGoal: 100000,
    currentSetupPlayer: 0,
    phase: 'setup',
    waitingForHoopty: false,
};

let tempSetup = { avatar: '' };

// ── Housing ──────────────────────────────────────────────
const HOUSING = [
    { level: 0,  name: 'Homeless',      icon: '🏚️', price: 0      },
    { level: 1,  name: 'Car Living',    icon: '🚗', price: 0      },
    { level: 2,  name: "Friend's Couch",icon: '🛋️', price: 500    },
    { level: 3,  name: 'Apartment',     icon: '🏢', price: 2000   },
    { level: 4,  name: 'Mobile Home',   icon: '🏠', price: 4000   },
    { level: 5,  name: 'RV',            icon: '🚌', price: 6000   },
    { level: 6,  name: 'Duplex',        icon: '🏘️', price: 10000  },
    { level: 7,  name: 'Studio',        icon: '🏙️', price: 15000  },
    { level: 8,  name: '1 Bedroom',     icon: '🏡', price: 20000  },
    { level: 9,  name: '2 Bedroom',     icon: '🏡', price: 30000  },
    { level: 10, name: '3 Bedroom',     icon: '🏠', price: 45000  },
    { level: 11, name: '4 Bedroom',     icon: '🏠', price: 65000  },
    { level: 12, name: 'Skyline Apt',   icon: '🌆', price: 90000  },
    { level: 13, name: 'Mansion',       icon: '🏰', price: 150000 },
];

// ── Cars ─────────────────────────────────────────────────
const CARS = [
    { level: 0,  name: 'No Car',      icon: '🚶', price: 0,     impound: 0,   isHoopty: false },
    { level: 1,  name: 'Bike',        icon: '🚲', price: 200,   impound: 50,  isHoopty: false },
    { level: 2,  name: 'Hoopty',      icon: '🚗', price: 1000,  impound: 100, isHoopty: true  },
    { level: 3,  name: 'Daily Fixer', icon: '🚙', price: 3000,  impound: 150, isHoopty: false },
    { level: 4,  name: 'Gas Car',     icon: '🚗', price: 8000,  impound: 200, isHoopty: false },
    { level: 5,  name: 'Hybrid',      icon: '🚘', price: 14000, impound: 250, isHoopty: false },
    { level: 6,  name: 'Electric',    icon: '⚡',  price: 22000, impound: 300, isHoopty: false },
    { level: 7,  name: 'Motorcycle',  icon: '🏍️', price: 10000, impound: 200, isHoopty: false },
    { level: 8,  name: 'Truck',       icon: '🚚', price: 18000, impound: 300, isHoopty: false },
    { level: 9,  name: 'Classic Car', icon: '🏎️', price: 35000, impound: 500, isHoopty: false },
    { level: 10, name: 'Sports Car',  icon: '🚀', price: 60000, impound: 800, isHoopty: false },
];

// ── Job Paydays ───────────────────────────────────────────
const JOB_PAYS = {
    'Unemployed': 2000, 'Dog Walker': 500, 'Fruit Picker': 800,
    'Wendys': 2400, 'Walmart': 2800, 'Factory Worker': 3200,
    'Trash Collector': 3500, 'House Cleaner': 3800, 'Security': 4000,
    'DoorDash': 3000, 'Farmer': 3500, 'Catering': 4000, 'Labor': 4500,
    'Amazon Driver': 5000, 'Police': 5500, 'Prison Guard': 6000,
    'Realtor': 8000, 'Microsoft': 12000,
};

// ── 40 Good Cards ─────────────────────────────────────────
const GOOD_CARDS = [
    { name: 'Tax Refund',          icon: '📋', effect: p => { p.money += 500;  return ['+$500', `${p.name} got a tax refund!`]; } },
    { name: 'Side Hustle',         icon: '💼', effect: p => { p.money += 800;  return ['+$800', `${p.name}'s side hustle paid off!`]; } },
    { name: 'Lottery Win',         icon: '🎰', effect: p => { p.money += 2000; return ['+$2,000', `${p.name} won the lottery!`]; } },
    { name: 'Work Bonus',          icon: '💵', effect: p => { if(p.jobPay <= 2000){ return ['Free Pass!', p.name+' is unemployed - no bonus!']; } const b=p.jobPay; p.money+=b; return ['+'+fmt(b), p.name+' got a work bonus!']; } },
    { name: 'Found $100',          icon: '💰', effect: p => { p.money += 100;  return ['+$100', `${p.name} found $100 on the ground!`]; } },
    { name: 'Birthday Money',      icon: '🎂', effect: p => { p.money += 300;  return ['+$300', `Happy birthday ${p.name}! Grandma sent $300.`]; } },
    { name: 'Garage Sale Win',     icon: '🏷️', effect: p => { p.money += 400;  return ['+$400', `${p.name} sold junk for $400!`]; } },
    { name: 'Scratcher Win',       icon: '🎟️', effect: p => { p.money += 600;  return ['+$600', `${p.name} won $600 on a scratcher!`]; } },
    { name: 'Free Housing Upgrade',icon: '🏠', effect: p => { const r = upgradeHousing(p,1); return [r.includes('upgraded')?'UPGRADE!':'No change', r]; } },
    { name: 'Free Car Upgrade',    icon: '🚗', effect: p => { const r = upgradeCar(p,1);     return [r.includes('upgraded')?'UPGRADE!':'No change', r]; } },
    { name: 'Vacation Pay',        icon: '✈️',  effect: p => { p.money += 1200; return ['+$1,200', `${p.name} cashed in vacation days!`]; } },
    { name: 'Stock Dividend',      icon: '📈', effect: p => { p.money += 700;  return ['+$700', `${p.name}'s stocks paid dividends!`]; } },
    { name: 'Overpaid on Taxes',   icon: '💸', effect: p => { p.money += 900;  return ['+$900', `${p.name} overpaid taxes and got money back!`]; } },
    { name: 'Found Wallet',        icon: '👛', effect: p => { p.money += 250;  return ['+$250', `${p.name} found a wallet and returned it. Reward: $250!`]; } },
    { name: 'Freelance Job',       icon: '💻', effect: p => { p.money += 1100; return ['+$1,100', `${p.name} landed a freelance gig!`]; } },
    { name: 'Viral Post',          icon: '📱', effect: p => { p.money += 500;  return ['+$500', `${p.name} went viral and got paid!`]; } },
    { name: 'Neighbor Owes You',   icon: '🤝', effect: p => { p.money += 350;  return ['+$350', `${p.name}'s neighbor finally paid back $350!`]; } },
    { name: 'Free Meal',           icon: '🍔', effect: p => { p.money += 50;   return ['+$50', `${p.name} got a free meal. Every dollar counts!`]; } },
    { name: 'Double Payday',       icon: '💰', effect: p => { p.money += p.jobPay * 2; return [`+${fmt(p.jobPay*2)}`, `${p.name} got a double payday!`]; } },
    { name: 'Car Raffle Win',      icon: '🏎️', effect: p => { const r = upgradeCar(p,2); return [r.includes('upgraded')?'BIG UPGRADE!':'No change', r]; } },
    { name: 'Rebate Check',        icon: '📬', effect: p => { p.money += 200;  return ['+$200', `${p.name} got a rebate check in the mail!`]; } },
    { name: 'Craigslist Flip',     icon: '🛋️', effect: p => { p.money += 450;  return ['+$450', `${p.name} flipped furniture on Craigslist!`]; } },
    { name: 'Happy Hour',          icon: '🍺', effect: p => { p.happiness = Math.min(10,p.happiness+2); return ['+2 Happiness', `${p.name} had a great time at happy hour!`]; } },
    { name: 'Got a Raise',         icon: '⬆️',  effect: p => { if(p.jobPay <= 2000){ return ['Free Pass!', p.name+' is unemployed - no raise available!']; } p.jobPay = Math.round(p.jobPay * 1.2); return ['+20% Pay', p.name+' got a 20% raise! New payday: '+fmt(p.jobPay)]; } },
    { name: 'Insurance Payout',    icon: '📄', effect: p => { p.money += 1500; return ['+$1,500', `${p.name} got an insurance payout!`]; } },
    { name: 'Estate Check',        icon: '🏛️', effect: p => { p.money += 3000; return ['+$3,000', `${p.name} inherited $3,000 from a distant uncle!`]; } },
    { name: 'Fantasy League Win',  icon: '🏈', effect: p => { p.money += 800;  return ['+$800', `${p.name} won the fantasy league!`]; } },
    { name: 'Online Survey',       icon: '📊', effect: p => { p.money += 100;  return ['+$100', `${p.name} did a survey for $100!`]; } },
    { name: 'Plasma Donation',     icon: '🩸', effect: p => { p.money += 150;  return ['+$150', `${p.name} donated plasma for $150!`]; } },
    { name: 'Poker Night Win',     icon: '🃏', effect: p => { p.money += 600;  return ['+$600', `${p.name} cleaned up at poker night!`]; } },
    { name: 'Promoted!',           icon: '🏆', effect: p => { if(p.jobPay <= 2000){ return ['Free Pass!', p.name+' is unemployed - no promotion available!']; } p.jobPay = Math.round(p.jobPay*1.3); return ['+30% Pay', p.name+' got promoted! New payday: '+fmt(p.jobPay)]; } },
    { name: 'Home Raffle Win',     icon: '🏡', effect: p => { const r = upgradeHousing(p,2); return [r.includes('upgraded')?'BIG UPGRADE!':'Maxed', r]; } },
    { name: 'Sold Shoes Online',   icon: '👟', effect: p => { p.money += 300;  return ['+$300', `${p.name} sold sneakers online for $300!`]; } },
    { name: 'Cash Back',           icon: '💳', effect: p => { p.money += 175;  return ['+$175', `${p.name} redeemed credit card cash back!`]; } },
    { name: 'Found Crypto',        icon: '🪙', effect: p => { p.money += 1000; return ['+$1,000', `${p.name} found an old crypto wallet worth $1,000!`]; } },
    { name: 'Mowing Lawns',        icon: '🌿', effect: p => { p.money += 200;  return ['+$200', `${p.name} mowed lawns for $200!`]; } },
    { name: 'Baby Shower Gifts',   icon: '🎁', effect: p => { p.money += 400;  return ['+$400', `${p.name} got $400 in gift cards!`]; } },
    { name: 'Utility Refund',      icon: '💡', effect: p => { p.money += 120;  return ['+$120', `${p.name} got a utility refund!`]; } },
    { name: 'Tips Were Fire',      icon: '🔥', effect: p => { p.money += 350;  return ['+$350', `${p.name} had an amazing tip night! +$350`]; } },
    { name: 'Bet on Sports',       icon: '🏅', effect: p => { p.money += 900;  return ['+$900', `${p.name} won a sports bet! +$900`]; } },
];

// ── 40 Bad Cards ──────────────────────────────────────────
const BAD_CARDS = [
    { name: 'Speeding Ticket',     icon: '🚨', effect: p => { charge(p,200);  return ['-$200', `${p.name} got a speeding ticket!`]; } },
    { name: 'Car Wreck',           icon: '💥', effect: p => { charge(p,500);  return ['-$500', `${p.name} had a car wreck!`]; } },
    { name: 'Credit Card Bill',    icon: '💳', effect: p => { charge(p,300);  return ['-$300', `${p.name} has a credit card payment due!`]; } },
    { name: 'Baby Surprise',       icon: '👶', effect: p => { charge(p,1000); return ['-$1,000', `${p.name} had a baby! There goes the savings!`]; } },
    { name: 'Dentist',             icon: '🦷', effect: p => { charge(p,400);  return ['-$400', `${p.name} cracked a tooth!`]; } },
    { name: 'Eye Doctor',          icon: '👁️',  effect: p => { charge(p,250);  return ['-$250', `${p.name} needs new glasses!`]; } },
    { name: 'Chiropractor',        icon: '💆', effect: p => { charge(p,300);  return ['-$300', `${p.name} threw their back out!`]; } },
    { name: 'Doctor Visit',        icon: '🏥', effect: p => { charge(p,350);  return ['-$350', `${p.name} is sick and the bill is $350!`]; } },
    { name: 'Knee Surgery',        icon: '🩺', effect: p => { charge(p,2000); return ['-$2,000', `${p.name} needs knee surgery!`]; } },
    { name: 'Got Robbed',          icon: '🔫', effect: p => { charge(p,500);  return ['-$500', `${p.name} got robbed!`]; } },
    { name: 'Groceries',           icon: '🛒', effect: p => { charge(p,150);  return ['-$150', `${p.name} bought groceries. Life is expensive!`]; } },
    { name: 'Go To Jail',          icon: '⛓️', effect: p => { sendToJail(p);  return ['JAIL!', `${p.name} is going to jail!`]; } },
    { name: 'Rent Raised',         icon: '🏠', effect: p => { charge(p,500);  return ['-$500', `${p.name}'s landlord raised the rent!`]; } },
    { name: 'Pipes Burst',         icon: '🚿', effect: p => { if(p.housingLevel < 3){ return ['Free Pass!', p.name+' has no plumbing to burst!']; } charge(p,800);  return ['-$800', p.name+"'s pipes burst!"]; } },
    { name: 'Flat Tire',           icon: '🔧', effect: p => { if(p.carLevel === 0){ return ['Free Pass!', p.name+' has no car - no flat tire!']; } charge(p,150);  return ['-$150', p.name+' got a flat tire!']; } },
    { name: 'Engine Blew Up',      icon: '💨', effect: p => { if(p.carLevel === 0){ return ['Free Pass!', p.name+' has no car - no engine to blow!']; } charge(p,1500); return ['-$1,500', p.name+"'s engine blew up!"]; } },
    { name: 'Fender Bender',       icon: '🚗', effect: p => { if(p.carLevel === 0){ return ['Free Pass!', p.name+' has no car to fender bend!']; } charge(p,400);  return ['-$400', p.name+' had a fender bender!']; } },
    { name: 'Car Stolen',          icon: '🔑', effect: p => { p.carLevel = Math.max(0,p.carLevel-1); return ['Car Downgraded', `${p.name}'s car got stolen!`]; } },
    { name: 'IRS Audit',           icon: '📋', effect: p => { const t=p.jobPay*5; charge(p,t); return [`-${fmt(t)}`, `${p.name} got audited! Pay 5x payday!`]; } },
    { name: 'Party Too Hard',      icon: '🍾', effect: p => { charge(p,600);  return ['-$600', `${p.name} spent $600 partying!`]; } },
    { name: 'Phone Cracked',       icon: '📱', effect: p => { charge(p,200);  return ['-$200', `${p.name} cracked their phone screen!`]; } },
    { name: 'Date Night Disaster', icon: '💔', effect: p => { charge(p,300);  return ['-$300', `${p.name} spent $300 on a date that ghosted them!`]; } },
    { name: 'Prom Night',          icon: '🎓', effect: p => { charge(p,1000); return ['-$1,000', `${p.name} went to prom! -$1,000`]; } },
    { name: 'Overdraft Fee',       icon: '🏦', effect: p => { charge(p,100);  return ['-$100', `${p.name} overdrafted! -$100 in fees!`]; } },
    { name: 'Parking Tickets',     icon: '🅿️',  effect: p => { charge(p,250);  return ['-$250', `${p.name} had 5 unpaid parking tickets!`]; } },
    { name: 'Plumber',             icon: '🔩', effect: p => { charge(p,450);  return ['-$450', `${p.name} paid $450 for a plumber!`]; } },
    { name: 'Bail Out Friend',     icon: '🤦', effect: p => { charge(p,500);  return ['-$500', `${p.name} bailed out a friend! $500 gone!`]; } },
    { name: 'Vet Bill',            icon: '🐕', effect: p => { charge(p,600);  return ['-$600', `${p.name}'s dog needed surgery! -$600`]; } },
    { name: 'Bad Investment',      icon: '📉', effect: p => { charge(p,800);  return ['-$800', `${p.name} lost $800 on a bad investment!`]; } },
    { name: 'Stolen Wallet',       icon: '👛', effect: p => { charge(p,350);  return ['-$350', `${p.name}'s wallet was stolen! -$350`]; } },
    { name: 'Identity Theft',      icon: '🎭', effect: p => { charge(p,1000); return ['-$1,000', `${p.name} was a victim of identity theft! -$1,000`]; } },
    { name: 'Utility Bills',       icon: '💡', effect: p => { charge(p,200);  return ['-$200', `${p.name}'s utility bills skyrocketed! -$200`]; } },
    { name: 'Car Registration',    icon: '📄', effect: p => { charge(p,180);  return ['-$180', `${p.name}'s car registration is due! -$180`]; } },
    { name: 'Subscriptions',       icon: '📺', effect: p => { charge(p,120);  return ['-$120', `${p.name} forgot to cancel 6 subscriptions! -$120`]; } },
    { name: 'Move Back w/ Parents',icon: '🏚️', effect: p => { p.housingLevel=Math.max(0,p.housingLevel-2); return ['Housing Downgraded', `${p.name} had to move back with the parents!`]; } },
    { name: 'Roof Caved In',       icon: '🏠', effect: p => { if(p.housingLevel < 3){ return ['Free Pass!', p.name+' has no roof to cave in!']; } charge(p,1200); return ['-$1,200', p.name+"'s roof caved in! -$1,200"]; } },
    { name: 'Divorce',             icon: '💔', effect: p => { const h=Math.floor(p.money*0.3); charge(p,h); return [`-${fmt(h)}`, `${p.name} is getting divorced! Lost 30% of savings!`]; } },
    { name: 'Gambling Debt',       icon: '🎲', effect: p => { charge(p,700);  return ['-$700', `${p.name} owes $700 in gambling debt!`]; } },
    { name: 'Medical Bills',       icon: '🏥', effect: p => { charge(p,1800); return ['-$1,800', `${p.name} got a massive medical bill! -$1,800`]; } },
    { name: 'DUI',                 icon: '🍺', effect: p => { charge(p,2500); sendToJail(p); return ['-$2,500 + JAIL', `${p.name} got a DUI! Pay $2,500 and go to jail!`]; } },
];

// ── 40 Sarcastic Cards ────────────────────────────────────
const SARCASTIC_CARDS = [
    { name: 'Congratulations!',    icon: '🎉', effect: p => { charge(p,100);  return ['-$100', `Congrats ${p.name}! You found a way to lose $100 doing nothing!`]; } },
    { name: 'Great Job!',          icon: '👏', effect: p => { charge(p,50);   return ['-$50', `Amazing work ${p.name}! You somehow owe $50 for existing.`]; } },
    { name: 'You\'re So Smart',    icon: '🧠', effect: p => { charge(p,300);  return ['-$300', `${p.name} made a "genius" investment. -$300. Big brain moves!`]; } },
    { name: 'Free Money!',         icon: '💸', effect: p => { charge(p,200);  return ['-$200', `${p.name} found "free money"! Just kidding. -$200 in fees.`]; } },
    { name: 'You Got This!',       icon: '💪', effect: p => { charge(p,400);  return ['-$400', `"You got this!" said no one. -$400`]; } },
    { name: 'Living Your Best Life',icon:'🌟', effect: p => { charge(p,250);  return ['-$250', `${p.name} is living their best life... -$250 later.`]; } },
    { name: 'Totally Adulting',    icon: '🧾', effect: p => { charge(p,350);  return ['-$350', `${p.name} is crushing adulting! Just lost $350.`]; } },
    { name: 'Such a Deal!',        icon: '🏷️', effect: p => { charge(p,500);  return ['-$500', `${p.name} found a "deal"! Only cost $500 extra.`]; } },
    { name: 'Smooth Move',         icon: '😎', effect: p => { charge(p,600);  return ['-$600', `Smooth move ${p.name}. Real smooth. -$600`]; } },
    { name: 'Big Plans',           icon: '📝', effect: p => { charge(p,150);  return ['-$150', `${p.name} had big plans. They cost $150 and went nowhere.`]; } },
    { name: 'Winning at Life',     icon: '🏆', effect: p => { charge(p,100);  return ['-$100', `${p.name} is WINNING at life! That's why they lost $100.`]; } },
    { name: 'Peak Performance',    icon: '📊', effect: p => { charge(p,200);  return ['-$200', `${p.name} is at peak performance... of losing money!`]; } },
    { name: 'New Year New You',    icon: '🥂', effect: p => { charge(p,300);  return ['-$300', `New year, new you! Same broke ${p.name}. -$300`]; } },
    { name: 'Self Care',           icon: '🛁', effect: p => { charge(p,400);  return ['-$400', `${p.name} needed "self care." Therapist bill: $400.`]; } },
    { name: 'Manifesting',         icon: '✨', effect: p => { charge(p,0);    return ['Nothing', `${p.name} manifested wealth. The universe said no.`]; } },
    { name: 'Side Hustle',         icon: '😅', effect: p => { charge(p,200);  return ['-$200', `${p.name}'s side hustle cost more to set up than it made.`]; } },
    { name: 'Investment Guru',     icon: '📉', effect: p => { charge(p,800);  return ['-$800', `${p.name} became an investment guru. -$800 says otherwise.`]; } },
    { name: 'Networking Event',    icon: '🤝', effect: p => { charge(p,150);  return ['-$150', `${p.name} networked. Cost $150. Got zero jobs.`]; } },
    { name: 'Meal Prepping',       icon: '🥗', effect: p => { charge(p,100);  return ['-$100', `${p.name} meal prepped. Bought $100 of food, ate pizza anyway.`]; } },
    { name: 'Going to the Gym',    icon: '💪', effect: p => { charge(p,50);   return ['-$50', `${p.name} signed up for a gym. Went once. -$50/month forever.`]; } },
    { name: 'Reading the Room',    icon: '📖', effect: p => { charge(p,0);    return ['Nothing', `${p.name} read the room. The room said nothing. Lost nothing.`]; } },
    { name: 'Hot Take',            icon: '🌶️', effect: p => { charge(p,300);  return ['-$300', `${p.name} posted a hot take online. Got cancelled. Lost $300.`]; } },
    { name: 'Influencer Life',     icon: '📸', effect: p => { charge(p,500);  return ['-$500', `${p.name} bought props for content. 3 views. -$500`]; } },
    { name: 'Life Hack',           icon: '🔧', effect: p => { charge(p,250);  return ['-$250', `${p.name}'s "life hack" made things worse. -$250`]; } },
    { name: 'Organic Groceries',   icon: '🥦', effect: p => { charge(p,200);  return ['-$200', `${p.name} bought organic groceries. Tasted the same. -$200`]; } },
    { name: 'Crypto Expert',       icon: '🪙', effect: p => { charge(p,700);  return ['-$700', `${p.name} became a crypto expert. Lost $700. Classic.`]; } },
    { name: 'Starting a Podcast',  icon: '🎙️', effect: p => { charge(p,400);  return ['-$400', `${p.name} started a podcast. 2 listeners. Both were bots. -$400`]; } },
    { name: 'Being Extra',         icon: '💅', effect: p => { charge(p,350);  return ['-$350', `${p.name} was extra today. Extra expensive. -$350`]; } },
    { name: 'Main Character Energy',icon:'⭐', effect: p => { charge(p,100);  return ['-$100', `${p.name} had main character energy. Reality disagrees. -$100`]; } },
    { name: 'Grinding',            icon: '⚙️',  effect: p => { charge(p,0);    return ['Nothing', `${p.name} is grinding! No results. Just grinding.`]; } },
    { name: 'Positive Vibes Only', icon: '☀️',  effect: p => { charge(p,200);  return ['-$200', `${p.name} chose positive vibes only. Vibes cost $200.`]; } },
    { name: 'NFT Purchase',        icon: '🖼️',  effect: p => { charge(p,500);  return ['-$500', `${p.name} bought an NFT. It\'s now worth $0. -$500`]; } },
    { name: 'Detox Cleanse',       icon: '🧃', effect: p => { charge(p,150);  return ['-$150', `${p.name} did a detox cleanse. Body was already fine. -$150`]; } },
    { name: 'Hustle Culture',      icon: '😤', effect: p => { charge(p,0);    return ['Nothing', `${p.name} hustled for 18 hours. Made $0. Inspirational.`]; } },
    { name: 'Life Coach',          icon: '🎯', effect: p => { charge(p,600);  return ['-$600', `${p.name} hired a life coach. Was told to "believe." -$600`]; } },
    { name: 'Trendy Restaurant',   icon: '🍽️', effect: p => { charge(p,200);  return ['-$200', `${p.name} ate at a trendy spot. Tiny portions. -$200`]; } },
    { name: 'The Algorithm',       icon: '🤖', effect: p => { charge(p,0);    return ['Nothing', `${p.name} fed the algorithm. The algorithm took nothing. This time.`]; } },
    { name: 'Going Viral',         icon: '📣', effect: p => { charge(p,100);  return ['-$100', `${p.name} went viral for something embarrassing. -$100 in dignity.`]; } },
    { name: 'Vision Board',        icon: '🗂️', effect: p => { charge(p,50);   return ['-$50', `${p.name} made a vision board. Vision: still broke. Cost: $50`]; } },
    { name: 'Morning Routine',     icon: '⏰', effect: p => { charge(p,0);    p.happiness=Math.max(0,p.happiness-1); return ['-1 Happiness', `${p.name} woke up at 5am. Still miserable. -1 Happiness.`]; } },
];

// ── Board Layout ─────────────────────────────────────────
// 40 spaces: 4 corners + 12 blank + action spaces
// house, car dealer, job office, house/car/job cards
const BOARD_SPACES = [
    { id: 0,  type: 'corner',  icon: '🏁', name: 'START',       desc: 'Begin your new life!' },
    { id: 1,  type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 2,  type: 'card',    icon: '🃏', name: 'Good Card',   desc: 'Draw a Good Card!' },
    { id: 3,  type: 'job',     icon: '💼', name: 'Job Office',  desc: 'Get or change your job!' },
    { id: 4,  type: 'house',   icon: '🏠', name: 'House',       desc: 'Buy or upgrade housing!' },
    { id: 5,  type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 6,  type: 'card',    icon: '😈', name: 'Bad Card',    desc: 'Draw a Bad Card!' },
    { id: 7,  type: 'hcard',   icon: '🏘️', name: 'House Card',  desc: 'Draw a Housing Card!' },
    { id: 8,  type: 'good',    icon: '💵', name: 'Found $20',   desc: 'Collect $20!' },
    { id: 9,  type: 'jcard',   icon: '📋', name: 'Job Card',    desc: 'Draw a Job Card!' },
    { id: 10, type: 'corner',  icon: '⛓️', name: 'JAIL',        desc: 'Just Visiting... or IN!' },
    { id: 11, type: 'card',    icon: '🏠', name: 'Sarcastic Card', desc: 'Draw a Sarcastic Card!' },
    { id: 12, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 13, type: 'car',     icon: '🚗', name: 'Car Dealer',  desc: 'Buy or upgrade your car!' },
    { id: 14, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 15, type: 'payday',  icon: '💰', name: 'PAYDAY',      desc: 'Collect your paycheck!' },
    { id: 16, type: 'jcard',   icon: '📋', name: 'Job Card',    desc: 'Draw a Job Card!' },
    { id: 17, type: 'ccard',   icon: '🔧', name: 'Car Card',    desc: 'Draw a Car Card!' },
    { id: 18, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 19, type: 'bad',     icon: '🏥', name: 'Hospital',    desc: 'Pay $500!' },
    { id: 20, type: 'corner',  icon: '🎁', name: 'FREE DAY',    desc: '+1 Happiness!' },
    { id: 21, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 22, type: 'card',    icon: '😈', name: 'Bad Card',    desc: 'Draw a Bad Card!' },
    { id: 23, type: 'job',     icon: '💼', name: 'Job Office',  desc: 'Get or change your job!' },
    { id: 24, type: 'bad',     icon: '📋', name: 'TAXES',       desc: 'Pay 10% of total assets!' },
    { id: 25, type: 'house',   icon: '🏠', name: 'House',       desc: 'Buy or upgrade housing!' },
    { id: 26, type: 'hcard',   icon: '🏘️', name: 'House Card',  desc: 'Draw a Housing Card!' },
    { id: 27, type: 'good',    icon: '✈️',  name: 'Vacation Pay',desc: 'Collect $1,200!' },
    { id: 28, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 29, type: 'card',    icon: '🃏', name: 'Good Card',   desc: 'Draw a Good Card!' },
    { id: 30, type: 'corner',  icon: '🚔', name: 'GO TO JAIL',  desc: 'Go directly to Jail!' },
    { id: 31, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 32, type: 'car',     icon: '🚗', name: 'Car Dealer',  desc: 'Buy or upgrade your car!' },
    { id: 33, type: 'ccard',   icon: '🔧', name: 'Car Card',    desc: 'Draw a Car Card!' },
    { id: 34, type: 'good',    icon: '🎰', name: 'Casino Win',  desc: 'Win $1,400!' },
    { id: 35, type: 'jcard',   icon: '📋', name: 'Job Card',    desc: 'Draw a Job Card!' },
    { id: 36, type: 'card',    icon: '🏠', name: 'Sarcastic Card', desc: 'Draw a Sarcastic Card!' },
    { id: 37, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 38, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
    { id: 39, type: 'blank',   icon: '⬜', name: '',            desc: 'Nothing happens here.' },
];

// Clockwise: START=bottom-right corner, goes left along bottom,
// up left side, right along top, down right side back to jail
function getGridPosition(id) {
    if (id <= 10)  return { row: 10, col: 10 - id };       // bottom: right→left
    if (id <= 20)  return { row: 10-(id-10), col: 0 };     // left: bottom→top
    if (id <= 30)  return { row: 0, col: id-20 };           // top: left→right
    return { row: id-30, col: 10 };                         // right: top→bottom
}

// ── Helpers ───────────────────────────────────────────────
function charge(p, amt) { p.money = Math.max(0, p.money - amt); }
function fmt(n) { return '$' + Math.floor(n).toLocaleString(); }

function sendToJail(p) {
    p.position = 10;
    p.inJail = true;
    p.jailTurns = 0;
    if (p.carLevel > 0) p.carImpounded = true;
}

function upgradeHousing(p, lvls) {
    const nl = Math.min(HOUSING.length-1, p.housingLevel+lvls);
    if (nl === p.housingLevel) return p.name + ' already has max housing!';
    const cost = Math.max(0, HOUSING[nl].price - HOUSING[p.housingLevel].price);
    if (p.money >= cost) {
        p.money -= cost; p.housingLevel = nl;
        animateAssetIcon('apHousingIcon');
        return p.name + ' upgraded to ' + HOUSING[nl].name + '!';
    }
    return p.name + "'s broke - can't afford the housing upgrade.";
}

function upgradeCar(p, lvls) {
    const nl = Math.min(CARS.length-1, p.carLevel+lvls);
    if (nl === p.carLevel) return p.name + ' already has max car!';
    const cost = Math.max(0, CARS[nl].price - CARS[p.carLevel].price);
    if (p.money >= cost) {
        p.money -= cost; p.carLevel = nl;
        animateAssetIcon('apCarIcon');
        return p.name + ' upgraded to ' + CARS[nl].name + '!';
    }
    return p.name + "'s broke - can't afford the car upgrade.";
}

function animateAssetIcon(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('upgraded');
    void el.offsetWidth; // force reflow
    el.classList.add('upgraded');
    setTimeout(() => el.classList.remove('upgraded'), 600);
}

function drawCard(deck) { return deck[Math.floor(Math.random()*deck.length)]; }

// ── Screens ───────────────────────────────────────────────
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

function showPlayerSetup() {
    const idx = gameState.currentSetupPlayer;
    document.getElementById('playerSetupTitle').textContent = `Player ${idx+1} Setup`;
    document.getElementById('playerName').value = '';
    document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
    tempSetup = { avatar: '' };
    document.getElementById('nextPlayerBtn').textContent =
        idx === gameState.numPlayers-1 ? 'START CHAOS!' : 'NEXT PLAYER';
}

function selectAvatar(emoji) {
    tempSetup.avatar = emoji;
    document.querySelectorAll('.avatar-btn').forEach(b =>
        b.classList.toggle('selected', b.textContent === emoji));
}

function nextPlayer() {
    const name = document.getElementById('playerName').value.trim();
    if (!tempSetup.avatar) { alert('Pick an avatar!'); return; }
    if (!name) { alert('Enter your name!'); return; }

    gameState.players.push({
        id: gameState.currentSetupPlayer,
        name, avatar: tempSetup.avatar,
        job: 'Unemployed', jobPay: 2000,
        money: 20000, position: 0,
        housingLevel: 0, carLevel: 0,
        inJail: false, jailTurns: 0,
        carImpounded: false, jailFreeCards: 0,
        happiness: 5, turnsPlayed: 0,
        skipTurn: false,
    });

    gameState.currentSetupPlayer++;
    if (gameState.currentSetupPlayer >= gameState.numPlayers) startGame();
    else showPlayerSetup();
}

// ── Start Game ────────────────────────────────────────────
function startGame() {
    gameState.currentPlayerIndex = 0;
    gameState.phase = 'playing';
    showScreen('gameScreen');
    document.getElementById('winGoalDisplay').textContent = `🏆 Goal: ${fmt(gameState.winGoal)}`;
    buildBoard();
    renderPlayerBar();
    updateCurrentPlayerDisplay();
}

// ── Board ─────────────────────────────────────────────────
function buildBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    const cells = {};
    for (let r=0;r<=10;r++) for(let c=0;c<=10;c++) cells[`${r},${c}`]=null;
    BOARD_SPACES.forEach(s => { const p=getGridPosition(s.id); cells[`${p.row},${p.col}`]=s; });

    for (let r=0;r<=10;r++) {
        for (let c=0;c<=10;c++) {
            const space = cells[`${r},${c}`];
            const div = document.createElement('div');
            if (space) {
                div.className = `board-space ${space.type}`;
                div.setAttribute('data-space-id', space.id);
                div.innerHTML = `<div class="space-icon">${space.icon}</div><div class="space-name">${space.name}</div><div class="space-players" id="sp-${space.id}"></div>`;
            } else if (r>=1&&r<=9&&c>=1&&c<=9) {
                if (r===5&&c===5) {
                    div.className='center-area';
                    div.style.gridColumn='2/11';
                    div.style.gridRow='2/11';
                    div.innerHTML=`<div class="center-title">⚡ CHAOS ⚡</div><div class="center-sub">The Game of Life</div><div class="center-goal">🏆 Win: ${fmt(gameState.winGoal)}</div><div class="center-players-grid" id="centerPlayers"></div>`;
                } else { div.style.display='none'; }
            } else {
                div.style.background='transparent';
                div.style.border='none';
            }
            board.appendChild(div);
        }
    }
    updatePlayerPieces();
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

    // Update center player cards
    const centerEl = document.getElementById('centerPlayers');
    if (!centerEl) return;
    centerEl.innerHTML = '';
    gameState.players.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = `center-player-card ${i === gameState.currentPlayerIndex ? 'active' : ''}`;
        card.innerHTML = `
            <div class="cpc-avatar">${p.avatar}</div>
            <div class="cpc-name">${p.name}</div>
            <div class="cpc-money">${fmt(p.money)}</div>
            <div class="cpc-pos">${p.inJail ? '⛓️ JAIL' : BOARD_SPACES[p.position]?.name || ''}</div>
        `;
        centerEl.appendChild(card);
    });
}

// ── Player Bar (left column - compact list) ───────────────
function renderPlayerBar() {
    const bar = document.getElementById('playerInfoBar');
    bar.innerHTML = '';
    gameState.players.forEach((p,i) => {
        const div = document.createElement('div');
        div.className = `player-token ${i===gameState.currentPlayerIndex?'active-player':''}`;
        div.innerHTML = `
            <div class="token-row1">
                <span class="token-avatar">${p.avatar}</span>
                <span class="token-name">${p.name}</span>
            </div>
            <div class="token-money">${fmt(p.money)}</div>
            <div class="token-details">${p.job} | 😊${p.happiness}</div>
            ${p.inJail?'<div class="token-jail">⛓️ IN JAIL</div>':''}
        `;
        bar.appendChild(div);
    });
    updateActivePlayerPanel();
}

// ── Active Player Panel (right column) ───────────────────
function updateActivePlayerPanel() {
    if (gameState.phase !== 'playing') return;
    const p = gameState.players[gameState.currentPlayerIndex];
    if (!p) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('apAvatar', p.avatar);
    set('apName', p.name);
    set('apMoney', fmt(p.money));
    set('apJob', '💼 ' + p.job);
    set('apHappiness', '😊 Happiness: ' + p.happiness + '/10');

    const jailEl = document.getElementById('apJail');
    if (jailEl) {
        if (p.inJail) { jailEl.textContent = '⛓️ IN JAIL - Turn ' + (p.jailTurns+1) + '/3'; jailEl.classList.remove('hidden'); }
        else { jailEl.classList.add('hidden'); }
    }

    // Housing display
    const house = HOUSING[p.housingLevel];
    set('apHousingIcon', house.icon);
    set('apHousingName', house.name);
    renderUpgradeTrack('housingTrack', p.housingLevel, HOUSING.length);

    // Car display
    const car = CARS[p.carLevel];
    set('apCarIcon', car.icon);
    set('apCarName', car.name);
    renderUpgradeTrack('carTrack', p.carLevel, CARS.length);
}

function renderUpgradeTrack(trackId, currentLevel, totalLevels) {
    const el = document.getElementById(trackId);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < totalLevels; i++) {
        const dot = document.createElement('div');
        if (i < currentLevel) {
            dot.className = 'upgrade-dot filled';
        } else if (i === currentLevel) {
            dot.className = 'upgrade-dot current';
        } else {
            dot.className = 'upgrade-dot';
        }
        el.appendChild(dot);
    }
}

function updateCurrentPlayerDisplay() {
    const p = gameState.players[gameState.currentPlayerIndex];
    const hoopty = CARS[p.carLevel].isHoopty;
    updateActivePlayerPanel();
    let rollMsg = 'Roll the dice!';
    if (p.inJail) rollMsg = 'In jail! Turn ' + (p.jailTurns+1) + '/3. Roll doubles to escape!';
    else if (hoopty) rollMsg = '🚗 Hoopty! Roll 1 die — 1-3 dead battery, 4-6 it starts!';
    else if (p.carLevel === 0) rollMsg = '🚶 Walking — Roll 1 die!';
    else if (p.carLevel === 1) rollMsg = '🚲 On your bike — Roll 1 die!';
    else rollMsg = '🚗 You have a ride — Roll 2 dice!';
    document.getElementById('gameMessage').textContent = rollMsg;
    document.getElementById('diceResult').textContent='';
    document.getElementById('rollDiceBtn').disabled=false;
    gameState.waitingForHoopty = false;
}

// ── Dice ──────────────────────────────────────────────────
const DICE_FACES = ['','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];

function animateDice(d1El, d2El, val1, val2, onDone) {
    d1El.classList.add('rolling');
    d2El.classList.add('rolling');
    let ticks = 0;
    const iv = setInterval(() => {
        d1El.textContent = DICE_FACES[Math.floor(Math.random()*6)+1];
        d2El.textContent = DICE_FACES[Math.floor(Math.random()*6)+1];
        ticks++;
        if (ticks > 8) {
            clearInterval(iv);
            d1El.classList.remove('rolling');
            d2El.classList.remove('rolling');
            d1El.textContent = DICE_FACES[val1];
            d2El.textContent = val2 ? DICE_FACES[val2] : '⬛';
            onDone();
        }
    }, 80);
}

function rollDice() {
    document.getElementById('rollDiceBtn').disabled = true;
    const player = gameState.players[gameState.currentPlayerIndex];
    const d1El = document.getElementById('die1');
    const d2El = document.getElementById('die2');
    const hoopty = CARS[player.carLevel].isHoopty;

    if (player.inJail) {
        const die1 = Math.ceil(Math.random()*6);
        const die2 = Math.ceil(Math.random()*6);
        const doubles = die1===die2;
        animateDice(d1El, d2El, die1, die2, () => {
            document.getElementById('diceResult').textContent =
                `${DICE_FACES[die1]} ${DICE_FACES[die2]} = ${die1+die2}${doubles?' 🎲 DOUBLES!':''}`;
            handleJailTurn(player, doubles, die1+die2);
        });
        return;
    }

    if (hoopty) {
        // Roll 1 die for hoopty check
        const die1 = Math.ceil(Math.random()*6);
        animateDice(d1El, d2El, die1, null, () => {
            document.getElementById('diceResult').textContent = `${DICE_FACES[die1]}`;
            if (die1 <= 3) {
                document.getElementById('gameMessage').textContent = '🔋 Dead battery! Walking this round...';
                showCardOverlay('😤','HOOPTY','Dead Battery!',`${player.name} rolled a ${die1}. Dead battery! Skip this turn, you\'re walking.`,'bad');
                player.skipTurn = true;
                setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
            } else {
                document.getElementById('gameMessage').textContent = `Hoopty started! Roll both dice!`;
                showCardOverlay('🚗','HOOPTY','It Started!',`${player.name} rolled a ${die1}! The Hoopty starts! Now roll both dice to move.`,'good');
                setTimeout(() => {
                    hideCardOverlay();
                    // Now roll 2 dice to move
                    const m1 = Math.ceil(Math.random()*6);
                    const m2 = Math.ceil(Math.random()*6);
                    animateDice(d1El, d2El, m1, m2, () => {
                        document.getElementById('diceResult').textContent = `${DICE_FACES[m1]} ${DICE_FACES[m2]} = ${m1+m2}`;
                        movePlayer(player, m1+m2);
                    });
                }, 5000);
            }
        });
        return;
    }

    // No motor vehicle (no car or bike, levels 0-1) = 1 die
    if (player.carLevel <= 1) {
        const label = player.carLevel === 0 ? '🚶 Walking' : '🚲 Biking';
        const die1 = Math.ceil(Math.random()*6);
        animateDice(d1El, d2El, die1, null, () => {
            document.getElementById('diceResult').textContent = `${DICE_FACES[die1]} = ${die1} (${label})`;
            movePlayer(player, die1);
        });
        return;
    }

    // Motor vehicle (level 2+ handled above for Hoopty, level 3+ = 2 dice)
    // Normal roll - 2 dice
    const die1 = Math.ceil(Math.random()*6);
    const die2 = Math.ceil(Math.random()*6);
    const doubles = die1===die2;
    animateDice(d1El, d2El, die1, die2, () => {
        document.getElementById('diceResult').textContent =
            `${DICE_FACES[die1]} ${DICE_FACES[die2]} = ${die1+die2}${doubles?' 🎲 DOUBLES!':''}`;
        movePlayer(player, die1+die2);
    });
}

// ── Jail ─────────────────────────────────────────────────
function handleJailTurn(player, doubles, total) {
    if (doubles) {
        player.inJail = false;
        player.carImpounded = false;
        showCardOverlay('🎲','JAIL BREAK','Doubles! You\'re Free!',`${player.name} rolled doubles and escaped jail!`,'good');
        setTimeout(() => { hideCardOverlay(); movePlayer(player, total); }, 5000);
        return;
    }

    player.jailTurns++;

    if (player.jailTurns >= 3) {
        // Must pay or game over
        const cost = 100 + (player.carImpounded && player.carLevel > 0 ? CARS[player.carLevel].impound : 0);
        if (player.money >= cost) {
            charge(player, cost);
            if (player.carImpounded) player.carImpounded = false;
            player.inJail = false;
            player.jailTurns = 0;
            renderPlayerBar();
            showCardOverlay('⛓️','RELEASED',`Paid ${fmt(cost)} to get out`,`${player.name} paid their way out of jail!`,'bad');
            setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
        } else {
            // Game over - sent back to prison
            gameState.phase = 'over';
            showCardOverlay('🚔','GAME OVER','Sent Back to Prison',`${player.name} couldn't afford bail and is being sent back to prison! GAME OVER!`,'bad');
            setTimeout(() => { hideCardOverlay(); showGameOver(player); }, 5000);
        }
    } else {
        renderPlayerBar();
        showCardOverlay('⛓️','STILL IN JAIL',`Turn ${player.jailTurns}/3`,`${player.name} stays in jail. Roll doubles to escape!`,'bad');
        setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
    }
}

// ── Move ─────────────────────────────────────────────────
function movePlayer(player, steps) {
    const oldPos = player.position;
    const newPos = (oldPos + steps) % 40;
    if (newPos <= oldPos && steps > 0) {
        player.money += player.jobPay;
        document.getElementById('gameMessage').textContent =
            `${player.name} passed START! +${fmt(player.jobPay)}`;
    }
    player.position = newPos;
    player.turnsPlayed++;
    updatePlayerPieces();
    renderPlayerBar();
    setTimeout(() => landOnSpace(player, BOARD_SPACES[newPos]), 500);
}

// ── Land ─────────────────────────────────────────────────
function landOnSpace(player, space) {
    if (!space) { endTurn(); return; }
    try {
    switch(space.type) {
        case 'blank':    handleBlank(player, space); break;
        case 'corner':  handleCorner(player, space); break;
        case 'payday':  handlePayday(player); break;
        case 'card':    handleCardSpace(player, space); break;
        case 'good':    handleGoodSpace(player, space); break;
        case 'bad':     handleBadSpace(player, space); break;
        case 'house':   handleHouseSpace(player); break;
        case 'car':     handleCarDealerSpace(player); break;
        case 'hcard':   handleHousingCard(player); break;
        case 'ccard':   handleCarCard(player); break;
        case 'job':     handleJobOffice(player); break;
        case 'jcard':   handleJobCard(player); break;
        default:        endTurn(); break;
    }
    } catch(e) { console.error("landOnSpace error:", e); endTurn(); }
}


// ── Housing Cards Deck ────────────────────────────────────
const HOUSING_CARDS = [
    { name: 'Free Upgrade!',         effect: p => { const r=upgradeHousing(p,1); return [r.includes('upgraded')?'UPGRADE!':'No change', r]; } },
    { name: 'Landlord Raised Rent',  effect: p => { if(p.housingLevel < 3){ return ['Free Pass!', p.name+' has no landlord - living rough!']; } charge(p,500); return ['-$500', p.name+"'s landlord raised the rent! -$500"]; } },
    { name: 'Pipes Burst',           effect: p => { if(p.housingLevel < 3){ return ['Free Pass!', p.name+' has no plumbing to burst!']; } charge(p,800); return ['-$800', p.name+"'s pipes burst! -$800"]; } },
    { name: 'Raffle Win!',           effect: p => { const r=upgradeHousing(p,2); return [r.includes('upgraded')?'BIG UPGRADE!':'Maxed', r]; } },
    { name: 'Move Back w/ Parents',  effect: p => { p.housingLevel=Math.max(0,p.housingLevel-2); return ['Downgraded', p.name+' moved back with the parents!']; } },
    { name: 'Roof Caved In',         effect: p => { if(p.housingLevel < 3){ return ['Free Pass!', p.name+' has no roof to cave in!']; } charge(p,1200); return ['-$1,200', p.name+"'s roof caved in! -$1,200"]; } },
    { name: 'Free Double Upgrade!',  effect: p => { const r=upgradeHousing(p,2); return [r.includes('upgraded')?'DOUBLE UPGRADE!':'Maxed', r]; } },
    { name: 'House Party Damage',    effect: p => { charge(p,400); return ['-$400', p.name+' had a wild house party. Damage: $400']; } },
];

// ── Car Cards Deck ────────────────────────────────────────
const CAR_CARDS = [
    { name: 'Free Upgrade!',     effect: p => { const r=upgradeCar(p,1); return [r.includes('upgraded')?'UPGRADE!':'No change', r]; } },
    { name: 'Flat Tire',         effect: p => { if(p.carLevel === 0){ return ['Free Pass!', p.name+' has no car - no flat tire!']; } charge(p,150); return ['-$150', p.name+' got a flat tire! -$150']; } },
    { name: 'Engine Blew Up',    effect: p => { if(p.carLevel === 0){ return ['Free Pass!', p.name+' has no car - no engine to blow!']; } charge(p,1500); return ['-$1,500', p.name+" engine blew up! -$1,500"]; } },
    { name: 'Car Raffle Win!',   effect: p => { const r=upgradeCar(p,2); return [r.includes('upgraded')?'BIG UPGRADE!':'Maxed', r]; } },
    { name: 'Car Got Stolen',    effect: p => { if(p.carLevel === 0){ return ['Free Pass!', p.name+' has no car to steal!']; } p.carLevel=Math.max(0,p.carLevel-1); return ['Downgraded', p.name+" car got stolen!"]; } },
    { name: 'Free Oil Change',   effect: p => { p.money+=80; return ['+$80', p.name+' got a free oil change coupon! +$80']; } },
    { name: 'Double Upgrade!',   effect: p => { const r=upgradeCar(p,2); return [r.includes('upgraded')?'DOUBLE UPGRADE!':'Maxed', r]; } },
    { name: 'Fender Bender',     effect: p => { if(p.carLevel === 0){ return ['Free Pass!', p.name+' has no car to fender bend!']; } charge(p,400); return ['-$400', p.name+' had a fender bender! -$400']; } },
];

// ── House Space: buy/upgrade housing ─────────────────────
function handleHouseSpace(player) {
    const cur = HOUSING[player.housingLevel];
    const next = HOUSING[Math.min(HOUSING.length-1, player.housingLevel+1)];
    const alreadyMax = player.housingLevel >= HOUSING.length-1;
    if (alreadyMax) {
        showCardOverlay('🏰','HOUSE',"You Are Maxed Out!", player.name+' already lives in a '+cur.name+'!','good');
        setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        return;
    }
    const cost = Math.max(0, next.price - cur.price);
    const popup = document.getElementById('popup');
    const title = document.getElementById('popupTitle');
    const message = document.getElementById('popupMessage');
    const content = popup.querySelector('.popup-content');
    title.textContent = '🏠 House';
    message.textContent = player.name+', upgrade from '+cur.icon+' '+cur.name+' to '+next.icon+' '+next.name+'?'+(cost>0?' Cost: '+fmt(cost):' FREE!');
    content.className = 'popup-content popup-good';
    popup.classList.remove('hidden');
    content.querySelectorAll('button').forEach(b=>b.remove());
    const yesBtn = document.createElement('button');
    yesBtn.className='btn'; yesBtn.style.marginRight='10px'; yesBtn.textContent='UPGRADE!';
    yesBtn.onclick = () => {
        if (player.money >= cost) {
            player.money -= cost;
            player.housingLevel++;
            renderPlayerBar();
            closePopup();
            showCardOverlay('🏠','UPGRADED!',next.icon+' '+next.name,player.name+' upgraded their home!','good');
            setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
        } else {
            closePopup();
            showCardOverlay('💸','CANT AFFORD IT','Not Enough Money',player.name+' needs '+fmt(cost)+' but only has '+fmt(player.money),'bad');
            setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        }
    };
    const noBtn = document.createElement('button');
    noBtn.className='btn'; noBtn.style.background='linear-gradient(135deg,#0f3460,#16213e)'; noBtn.textContent='PASS';
    noBtn.onclick = () => { closePopup(); endTurn(); };
    content.appendChild(yesBtn);
    content.appendChild(noBtn);
}

// ── Car Dealer Space: buy/upgrade car ────────────────────
function handleCarDealerSpace(player) {
    const cur = CARS[player.carLevel];
    const next = CARS[Math.min(CARS.length-1, player.carLevel+1)];
    const alreadyMax = player.carLevel >= CARS.length-1;
    if (alreadyMax) {
        showCardOverlay('🚀','CAR DEALER',"Already Maxed!", player.name+' already drives a '+cur.name+'!','good');
        setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        return;
    }
    const cost = Math.max(0, next.price - cur.price);
    const popup = document.getElementById('popup');
    const title = document.getElementById('popupTitle');
    const message = document.getElementById('popupMessage');
    const content = popup.querySelector('.popup-content');
    title.textContent = '🚗 Car Dealer';
    message.textContent = player.name+', upgrade from '+cur.icon+' '+cur.name+' to '+next.icon+' '+next.name+'?'+(cost>0?' Cost: '+fmt(cost):' FREE!');
    content.className = 'popup-content popup-good';
    popup.classList.remove('hidden');
    content.querySelectorAll('button').forEach(b=>b.remove());
    const yesBtn = document.createElement('button');
    yesBtn.className='btn'; yesBtn.style.marginRight='10px'; yesBtn.textContent='BUY IT!';
    yesBtn.onclick = () => {
        if (player.money >= cost) {
            player.money -= cost;
            player.carLevel++;
            renderPlayerBar();
            closePopup();
            showCardOverlay('🚗','NEW RIDE!',next.icon+' '+next.name,player.name+' got a new car!','good');
            setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
        } else {
            closePopup();
            showCardOverlay('💸','CANT AFFORD IT','Not Enough Money',player.name+' needs '+fmt(cost)+' but only has '+fmt(player.money),'bad');
            setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        }
    };
    const noBtn = document.createElement('button');
    noBtn.className='btn'; noBtn.style.background='linear-gradient(135deg,#0f3460,#16213e)'; noBtn.textContent='PASS';
    noBtn.onclick = () => { closePopup(); endTurn(); };
    content.appendChild(yesBtn);
    content.appendChild(noBtn);
}

// ── Housing Card Draw ─────────────────────────────────────
function handleHousingCard(player) {
    const card = drawCard(HOUSING_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    const isGood = result[1].includes('upgrade') || result[1].includes('Upgrade') || result[1].includes('Raffle') || result[1].includes('Free');
    showCardOverlay('🏘️','HOUSE CARD', card.name, result[1], isGood?'good':'bad');
    setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}

// ── Car Card Draw ─────────────────────────────────────────
function handleCarCard(player) {
    const card = drawCard(CAR_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    const isGood = result[1].includes('upgrade') || result[1].includes('Upgrade') || result[1].includes('Raffle') || result[1].includes('Free') || result[1].includes('+');
    showCardOverlay('🔧','CAR CARD', card.name, result[1], isGood?'good':'bad');
    setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}


// ── House Space ───────────────────────────────────────────
function handleHouseSpace(player) {
    const cur = HOUSING[player.housingLevel];
    const nextLvl = Math.min(HOUSING.length-1, player.housingLevel+1);
    const next = HOUSING[nextLvl];
    if (player.housingLevel >= HOUSING.length-1) {
        showCardOverlay('🏰','HOUSE',"Already Maxed!", player.name+' already lives in a '+cur.name+'!','good');
        setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        return;
    }
    const cost = Math.max(0, next.price - cur.price);
    const popup = document.getElementById('popup');
    const content = popup.querySelector('.popup-content');
    document.getElementById('popupTitle').textContent = '🏠 House';
    document.getElementById('popupMessage').textContent = player.name+', upgrade from '+cur.icon+' '+cur.name+' to '+next.icon+' '+next.name+'? Cost: '+(cost>0?fmt(cost):'FREE!');
    content.className = 'popup-content popup-good';
    popup.classList.remove('hidden');
    content.querySelectorAll('button').forEach(b=>b.remove());
    const yesBtn = document.createElement('button');
    yesBtn.className='btn'; yesBtn.style.marginRight='10px'; yesBtn.textContent='UPGRADE!';
    yesBtn.onclick = () => {
        if (player.money >= cost) {
            player.money -= cost; player.housingLevel = nextLvl;
            renderPlayerBar(); closePopup();
            showCardOverlay('🏠','UPGRADED!',next.icon+' '+next.name, player.name+' upgraded their home!','good');
            setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
        } else {
            closePopup();
            showCardOverlay('💸','CANT AFFORD IT','Not Enough Money', player.name+' needs '+fmt(cost)+' but only has '+fmt(player.money),'bad');
            setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        }
    };
    const noBtn = document.createElement('button');
    noBtn.className='btn'; noBtn.style.background='linear-gradient(135deg,#0f3460,#16213e)'; noBtn.textContent='PASS';
    noBtn.onclick = () => { closePopup(); endTurn(); };
    content.appendChild(yesBtn); content.appendChild(noBtn);
}

// ── Car Dealer Space ──────────────────────────────────────
function handleCarDealerSpace(player) {
    const cur = CARS[player.carLevel];
    const nextLvl = Math.min(CARS.length-1, player.carLevel+1);
    const next = CARS[nextLvl];
    if (player.carLevel >= CARS.length-1) {
        showCardOverlay('🚀','CAR DEALER',"Already Maxed!", player.name+' already drives a '+cur.name+'!','good');
        setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        return;
    }
    const cost = Math.max(0, next.price - cur.price);
    const popup = document.getElementById('popup');
    const content = popup.querySelector('.popup-content');
    document.getElementById('popupTitle').textContent = '🚗 Car Dealer';
    document.getElementById('popupMessage').textContent = player.name+', upgrade from '+cur.icon+' '+cur.name+' to '+next.icon+' '+next.name+'? Cost: '+(cost>0?fmt(cost):'FREE!');
    content.className = 'popup-content popup-good';
    popup.classList.remove('hidden');
    content.querySelectorAll('button').forEach(b=>b.remove());
    const yesBtn = document.createElement('button');
    yesBtn.className='btn'; yesBtn.style.marginRight='10px'; yesBtn.textContent='BUY IT!';
    yesBtn.onclick = () => {
        if (player.money >= cost) {
            player.money -= cost; player.carLevel = nextLvl;
            renderPlayerBar(); closePopup();
            showCardOverlay('🚗','NEW RIDE!',next.icon+' '+next.name, player.name+' got a new car!','good');
            setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
        } else {
            closePopup();
            showCardOverlay('💸','CANT AFFORD IT','Not Enough Money', player.name+' needs '+fmt(cost)+' but only has '+fmt(player.money),'bad');
            setTimeout(()=>{ hideCardOverlay(); endTurn(); }, 5000);
        }
    };
    const noBtn = document.createElement('button');
    noBtn.className='btn'; noBtn.style.background='linear-gradient(135deg,#0f3460,#16213e)'; noBtn.textContent='PASS';
    noBtn.onclick = () => { closePopup(); endTurn(); };
    content.appendChild(yesBtn); content.appendChild(noBtn);
}

// ── Housing Card Draw ─────────────────────────────────────
function handleHousingCard(player) {
    const card = drawCard(HOUSING_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    const isGood = result[1].includes('upgraded') || result[1].includes('Raffle') || result[1].includes('Free') || result[1].includes('+');
    showCardOverlay('🏘️','HOUSE CARD', card.name, result[1], isGood?'good':'bad');
    setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}

// ── Car Card Draw ─────────────────────────────────────────
function handleCarCard(player) {
    const card = drawCard(CAR_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    const isGood = result[1].includes('upgraded') || result[1].includes('Raffle') || result[1].includes('Free') || result[1].includes('+');
    showCardOverlay('🔧','CAR CARD', card.name, result[1], isGood?'good':'bad');
    setTimeout(()=>{ hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}


function handleBlank(player, space) {
    document.getElementById('gameMessage').textContent = player.name + ' landed on an empty space. Nothing happens!';
    setTimeout(() => { endTurn(); }, 1200);
}

function handleCorner(player, space) {
    if (space.id === 0) {
        showCardOverlay('🏁','START','Begin!',`${player.name} landed on START!`,'good');
        setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
    } else if (space.id === 10) {
        showCardOverlay('⛓️','JAIL','Just Visiting',`${player.name} is just visiting jail. Stay cool!`,'');
        setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
    } else if (space.id === 20) {
        player.happiness = Math.min(10, player.happiness + 1);
        renderPlayerBar();
        showCardOverlay('🎁','FREE DAY','Nothing Happens! +1 Happiness',player.name+' gets a free day! Enjoy the peace. +1 Happiness!','good');
        setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
    } else if (space.id === 30) {
        sendToJail(player);
        renderPlayerBar();
        updatePlayerPieces();
        showCardOverlay('🚔','GO TO JAIL','Busted!',`${player.name} is going directly to jail!${player.carLevel>0?' Car impounded!':''}`,'bad');
        setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
    }
}

function handlePayday(player) {
    player.money += player.jobPay;
    renderPlayerBar();
    showCardOverlay('💰','PAYDAY','Collect Your Check!',`${player.name} collects ${fmt(player.jobPay)} from ${player.job}!`,'good');
    setTimeout(() => { hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}

function handleCardSpace(player, space) {
    let card, result, cardType;

    if (space.name === 'Good Card') {
        card = drawCard(GOOD_CARDS); cardType = 'good';
    } else if (space.name === 'Bad Card') {
        card = drawCard(BAD_CARDS); cardType = 'bad';
    } else if (space.name === 'Sarcastic Card') {
        card = drawCard(SARCASTIC_CARDS); cardType = 'sarcastic';
    } else {
        endTurn(); return;
    }

    // Check if card effect applies (housing/car cards blocked if player has none)
    if ((card.name === 'Free Housing Upgrade' || card.name === 'Home Raffle Win') && player.housingLevel === 0) {
        card = { name: 'Free Pass', icon: '🎫', effect: () => ['Free Pass!', `${player.name} has no housing to upgrade. Free turn!`] };
    }
    if ((card.name === 'Free Car Upgrade' || card.name === 'Car Raffle Win') && player.carLevel === 0) {
        card = { name: 'Free Pass', icon: '🎫', effect: () => ['Free Pass!', `${player.name} has no car to upgrade. Free turn!`] };
    }

    result = card.effect(player);
    renderPlayerBar();
    updatePlayerPieces();

    const typeLabel = cardType === 'good' ? 'GOOD CARD' : cardType === 'bad' ? 'BAD CARD' : 'CHAOS CARD';
    showCardOverlay(card.icon, typeLabel, card.name, result[1], cardType);
    setTimeout(() => { hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}

function handleGoodSpace(player, space) {
    let msg='', label='';
    if (space.name==='Found $20')   { player.money+=20;   label='+$20';    msg=`${player.name} found $20!`; }
    else if (space.name==='Found $50')  { player.money+=50;   label='+$50';    msg=`${player.name} found $50!`; }
    else if (space.name==='Found $100') { player.money+=100;  label='+$100';   msg=`${player.name} found $100!`; }
    else if (space.name==='Picnic')     { player.happiness=Math.min(10,player.happiness+1); label='+1 😊'; msg=`${player.name} had a lovely picnic!`; }
    else if (space.name==='Vacation Pay'){ player.money+=1200; label='+$1,200'; msg=`${player.name} cashed in vacation days!`; }
    else if (space.name==='Casino Win') { player.money+=1400; label='+$1,400'; msg=`${player.name} hit the jackpot!`; }
    else { player.money+=100; label='+$100'; msg=`${player.name} got lucky!`; }
    renderPlayerBar();
    showCardOverlay('✅','LUCKY!',space.name,msg,'good');
    setTimeout(() => { hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}

function handleBadSpace(player, space) {
    let msg='', label='';
    if (space.name==='Scuffed Rims')   { charge(player,100); player.happiness=Math.max(0,player.happiness-2); label='-$100'; msg=`${player.name} scuffed their rims! -$100, -2 Happiness.`; }
    else if (space.name==='Lost Backpack') { charge(player,30);  label='-$30';    msg=`${player.name} lost their backpack!`; }
    else if (space.name==='Out of Gas')    { charge(player,150); label='-$150';   msg=`${player.name} ran out of gas! Tow: $150.`; }
    else if (space.name==='TAXES') { const assets=player.money+HOUSING[player.housingLevel].price+CARS[player.carLevel].price; const t=Math.max(1,Math.round(assets*0.10)); charge(player,t); label='-'+fmt(t); msg=player.name+' owes 10% tax on total assets ('+fmt(assets)+')! Tax bill: '+fmt(t); }
    else if (space.name==='Hospital')      { charge(player,500); label='-$500';   msg=`${player.name} had a hospital visit!`; }
    else if (space.name==='Prom Night')    { charge(player,1000);label='-$1,000'; msg=`${player.name} went to prom! -$1,000`; }
    else if (space.name==='Mugged')        { charge(player,400); label='-$400';   msg=`${player.name} got mugged! -$400`; }
    else if (space.name==='Fender Bender') { charge(player,400); label='-$400';   msg=`${player.name} had a fender bender! -$400`; }
    else if (space.name==='Casino')        {
        const win=Math.random()>0.5;
        if(win){player.money+=200;label='+$200';msg=`${player.name} gambled and WON! +$200!`;}
        else{charge(player,200);label='-$200';msg=`${player.name} gambled and LOST! -$200.`;}
    }
    else { charge(player,100); label='-$100'; msg=`${player.name} had bad luck! -$100.`; }
    renderPlayerBar();
    showCardOverlay('❌','OUCH!',space.name,msg,'bad');
    setTimeout(() => { hideCardOverlay(); endTurn(); }, 5000);
}

// ── Card Overlay ─────────────────────────────────────────
function showCardOverlay(icon, typeLabel, title, body, type) {
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
    overlay.classList.remove('hidden');
}

function hideCardOverlay() {
    const overlay = document.getElementById('cardOverlay');
    const display = document.getElementById('cardDisplay');
    display.classList.add('card-fade-out');
    setTimeout(() => {
        overlay.classList.add('hidden');
        display.classList.remove('card-fade-out');
    }, 500);
}

// ── Win / Game Over ───────────────────────────────────────
function checkWinThenEnd(player) {
    if (!checkWin(player)) endTurn();
}

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
        ws=document.createElement('div');
        ws.id='winScreen'; ws.className='screen hidden';
        ws.innerHTML=`<div class="win-content"><h1>🏆 WINNER! 🏆</h1><div id="winnerAvatar" style="font-size:5em"></div><div id="winnerName" style="font-size:2em;color:#4ecca3;margin:10px 0"></div><div class="win-stats" id="winStats"></div><button class="btn" onclick="location.reload()">PLAY AGAIN!</button></div>`;
        document.body.appendChild(ws);
    }
    document.getElementById('winnerAvatar').textContent=player.avatar;
    document.getElementById('winnerName').textContent=`${player.name} WON!`;
    document.getElementById('winStats').innerHTML=`
        <div class="win-stat"><div class="win-stat-label">Final Money</div><div class="win-stat-value">${fmt(player.money)}</div></div>
        <div class="win-stat"><div class="win-stat-label">Job</div><div class="win-stat-value">${player.job}</div></div>
        <div class="win-stat"><div class="win-stat-label">Home</div><div class="win-stat-value">${HOUSING[player.housingLevel].icon} ${HOUSING[player.housingLevel].name}</div></div>
        <div class="win-stat"><div class="win-stat-label">Car</div><div class="win-stat-value">${CARS[player.carLevel].icon} ${CARS[player.carLevel].name}</div></div>`;
    showScreen('winScreen');
}

function showGameOver(player) {
    let ws=document.getElementById('winScreen');
    if (!ws) {
        ws=document.createElement('div');
        ws.id='winScreen'; ws.className='screen hidden';
        ws.innerHTML=`<div class="win-content" style="border-color:#e94560;box-shadow:0 0 50px rgba(233,69,96,0.5)"><h1 style="color:#e94560">🚔 GAME OVER 🚔</h1><div id="winnerAvatar" style="font-size:5em"></div><div id="winnerName" style="font-size:2em;color:#e94560;margin:10px 0"></div><p style="color:#a8a8b3;margin:10px 0">Sent back to prison. Better luck next time!</p><button class="btn" onclick="location.reload()">TRY AGAIN!</button></div>`;
        document.body.appendChild(ws);
    }
    document.getElementById('winnerAvatar').textContent=player.avatar;
    document.getElementById('winnerName').textContent=`${player.name} is done!`;
    showScreen('winScreen');
}

// ── Popup (kept for compatibility) ───────────────────────
function showPopup(title, message, type) {
    document.getElementById('popupTitle').textContent=title;
    document.getElementById('popupMessage').textContent=message;
    const popup=document.getElementById('popup');
    const content=popup.querySelector('.popup-content');
    content.className='popup-content';
    if(type==='good') content.classList.add('popup-good');
    if(type==='bad')  content.classList.add('popup-bad');
    const existingBtns=content.querySelectorAll('button');
    existingBtns.forEach(b=>b.remove());
    const okBtn=document.createElement('button');
    okBtn.className='btn'; okBtn.textContent='OK!!'; okBtn.onclick=closePopup;
    content.appendChild(okBtn);
    popup.classList.remove('hidden');
}
function closePopup() { document.getElementById('popup').classList.add('hidden'); }
function showMessage(msg) { document.getElementById('gameMessage').textContent=msg; }

// ── Job Cards Deck ────────────────────────────────────────
const JOB_CARDS = [
    { name: 'Dog Walker',     icon: '🐕', pay: 500,   effect: p => { p.job='Dog Walker';    p.jobPay=500;   return p.name+' got hired as a Dog Walker! Payday: $500'; } },
    { name: 'Fruit Picker',   icon: '🍎', pay: 800,   effect: p => { p.job='Fruit Picker';  p.jobPay=800;   return p.name+' got hired as a Fruit Picker! Payday: $800'; } },
    { name: 'Wendys',         icon: '🍔', pay: 2400,  effect: p => { p.job='Wendys';        p.jobPay=2400;  return p.name+' is flipping burgers at Wendys! Payday: $2,400'; } },
    { name: 'Walmart',        icon: '🛒', pay: 2800,  effect: p => { p.job='Walmart';       p.jobPay=2800;  return p.name+' got hired at Walmart! Payday: $2,800'; } },
    { name: 'Factory Worker', icon: '🏭', pay: 3200,  effect: p => { p.job='Factory Worker';p.jobPay=3200;  return p.name+' is working the line! Payday: $3,200'; } },
    { name: 'Trash Collector',icon: '🗑️', pay: 3500,  effect: p => { p.job='Trash Collector';p.jobPay=3500; return p.name+' is on the truck! Payday: $3,500'; } },
    { name: 'House Cleaner',  icon: '🧹', pay: 3800,  effect: p => { p.job='House Cleaner'; p.jobPay=3800;  return p.name+' is scrubbing floors! Payday: $3,800'; } },
    { name: 'Security',       icon: '🔒', pay: 4000,  effect: p => { p.job='Security';      p.jobPay=4000;  return p.name+' is on patrol! Payday: $4,000'; } },
    { name: 'DoorDash',       icon: '🚗', pay: 3000,  effect: p => { p.job='DoorDash';      p.jobPay=3000;  return p.name+' is delivering! Payday: $3,000'; } },
    { name: 'Amazon Driver',  icon: '📦', pay: 5000,  effect: p => { p.job='Amazon Driver'; p.jobPay=5000;  return p.name+' is delivering packages! Payday: $5,000'; } },
    { name: 'Police',         icon: '👮', pay: 5500,  effect: p => { p.job='Police';        p.jobPay=5500;  return p.name+' is on the force! Payday: $5,500'; } },
    { name: 'Prison Guard',   icon: '🚔', pay: 6000,  effect: p => { p.job='Prison Guard';  p.jobPay=6000;  return p.name+' is guarding the pen! Payday: $6,000'; } },
    { name: 'Realtor',        icon: '🏠', pay: 8000,  effect: p => { p.job='Realtor';       p.jobPay=8000;  return p.name+' is selling houses! Payday: $8,000'; } },
    { name: 'Microsoft',      icon: '💻', pay: 12000, effect: p => { p.job='Microsoft';     p.jobPay=12000; return p.name+' landed a tech job at Microsoft! Payday: $12,000'; } },
    { name: 'Got Fired!',     icon: '🔥', pay: 2000,  effect: p => { p.job='Unemployed';    p.jobPay=2000;  return p.name+' got FIRED! Back to Unemployed. Payday: $2,000'; } },
    { name: 'Got Fired!',     icon: '🔥', pay: 2000,  effect: p => { p.job='Unemployed';    p.jobPay=2000;  return p.name+' got FIRED again! Payday: $2,000'; } },
];

// ── Job Office Space ──────────────────────────────────────
function handleJobOffice(player) {
    const jobs = [
        { name: 'Dog Walker',     icon: '🐕', pay: 500   },
        { name: 'Fruit Picker',   icon: '🍎', pay: 800   },
        { name: 'Wendys',         icon: '🍔', pay: 2400  },
        { name: 'Walmart',        icon: '🛒', pay: 2800  },
        { name: 'Factory Worker', icon: '🏭', pay: 3200  },
        { name: 'Trash Collector',icon: '🗑️', pay: 3500  },
        { name: 'House Cleaner',  icon: '🧹', pay: 3800  },
        { name: 'Security',       icon: '🔒', pay: 4000  },
        { name: 'DoorDash',       icon: '🚗', pay: 3000  },
        { name: 'Amazon Driver',  icon: '📦', pay: 5000  },
        { name: 'Police',         icon: '👮', pay: 5500  },
        { name: 'Prison Guard',   icon: '🚔', pay: 6000  },
        { name: 'Realtor',        icon: '🏠', pay: 8000  },
        { name: 'Microsoft',      icon: '💻', pay: 12000 },
    ];
    // Pick a random job that pays more than current (or any if unemployed)
    const better = jobs.filter(j => j.pay > player.jobPay);
    const pool = better.length > 0 ? better : jobs;
    const offer = pool[Math.floor(Math.random() * pool.length)];

    const popup = document.getElementById('popup');
    const content = popup.querySelector('.popup-content');
    document.getElementById('popupTitle').textContent = '💼 Job Office';
    document.getElementById('popupMessage').textContent =
        player.name + ', job offer: ' + offer.icon + ' ' + offer.name +
        ' | Payday: $' + offer.pay.toLocaleString() +
        '\nCurrent: ' + player.job + ' | $' + player.jobPay.toLocaleString();
    content.className = 'popup-content popup-good';
    popup.classList.remove('hidden');
    content.querySelectorAll('button').forEach(b => b.remove());

    const yesBtn = document.createElement('button');
    yesBtn.className = 'btn'; yesBtn.style.marginRight = '10px'; yesBtn.textContent = 'TAKE IT!';
    yesBtn.onclick = () => {
        player.job = offer.name; player.jobPay = offer.pay;
        renderPlayerBar(); closePopup();
        showCardOverlay('💼', 'NEW JOB!', offer.icon + ' ' + offer.name,
            player.name + ' is now working as ' + offer.name + '! New payday: $' + offer.pay.toLocaleString(), 'good');
        setTimeout(() => { hideCardOverlay(); checkWinThenEnd(player); }, 5000);
    };
    const noBtn = document.createElement('button');
    noBtn.className = 'btn'; noBtn.style.background = 'linear-gradient(135deg,#0f3460,#16213e)'; noBtn.textContent = 'PASS';
    noBtn.onclick = () => { closePopup(); endTurn(); };
    content.appendChild(yesBtn); content.appendChild(noBtn);
}

// ── Job Card Draw ─────────────────────────────────────────
function handleJobCard(player) {
    const card = drawCard(JOB_CARDS);
    const result = card.effect(player);
    renderPlayerBar();
    const isGood = card.pay > 2000 && card.name !== 'Got Fired!';
    showCardOverlay(card.icon, 'JOB CARD', card.name, result, isGood ? 'good' : 'bad');
    setTimeout(() => { hideCardOverlay(); checkWinThenEnd(player); }, 5000);
}
