// ============================================================
//  CHAOS - The Game of Life  |  game.js
// ============================================================

// ─── Game State ───────────────────────────────────────────
let gameState = {
    players: [],
    currentPlayerIndex: 0,
    numPlayers: 0,
    winGoal: 1000000,
    currentSetupPlayer: 0,
    diceRolled: false,
    phase: 'setup',   // setup | playing | over
};

let tempSetup = { avatar: '', job: '', jobPay: 0, name: '' };

// ─── Job Paydays ──────────────────────────────────────────
const JOB_PAYS = {
    'Dog Walker': 500, 'Fruit Picker': 800, 'Wendys': 2400,
    'Walmart': 2800, 'Factory Worker': 3200, 'Trash Collector': 3500,
    'House Cleaner': 3800, 'Security': 4000, 'DoorDash': 3000,
    'Farmer': 3500, 'Catering': 4000, 'Labor': 4500,
    'Amazon Driver': 5000, 'Police': 5500, 'Prison Guard': 6000,
    'Realtor': 8000, 'Microsoft': 12000,
};

// ─── Housing Levels ───────────────────────────────────────
const HOUSING = [
    { level: 0,  name: 'Homeless',          icon: '🏚️',  price: 0      },
    { level: 1,  name: 'Car Living',         icon: '🚗',  price: 0      },
    { level: 2,  name: "Friend's Couch",     icon: '🛋️',  price: 500    },
    { level: 3,  name: 'Apartment',          icon: '🏢',  price: 2000   },
    { level: 4,  name: 'Mobile Home',        icon: '🏠',  price: 4000   },
    { level: 5,  name: 'RV',                 icon: '🚌',  price: 6000   },
    { level: 6,  name: 'Duplex',             icon: '🏘️',  price: 10000  },
    { level: 7,  name: 'Studio',             icon: '🏙️',  price: 15000  },
    { level: 8,  name: '1 Bedroom',          icon: '🏡',  price: 20000  },
    { level: 9,  name: '2 Bedroom',          icon: '🏡',  price: 30000  },
    { level: 10, name: '3 Bedroom',          icon: '🏠',  price: 45000  },
    { level: 11, name: '4 Bedroom',          icon: '🏠',  price: 65000  },
    { level: 12, name: 'Skyline Apartment',  icon: '🌆',  price: 90000  },
    { level: 13, name: 'Mansion',            icon: '🏰',  price: 150000 },
];

// ─── Car Levels ───────────────────────────────────────────
const CARS = [
    { level: 0,  name: 'No Car',      icon: '🚶', price: 0,     impound: 0   },
    { level: 1,  name: 'Bike',        icon: '🚲', price: 200,   impound: 50  },
    { level: 2,  name: 'Hoopty',      icon: '🚗', price: 1000,  impound: 100 },
    { level: 3,  name: 'Daily Fixer', icon: '🚙', price: 3000,  impound: 150 },
    { level: 4,  name: 'Gas Car',     icon: '🚗', price: 8000,  impound: 200 },
    { level: 5,  name: 'Hybrid',      icon: '🚘', price: 14000, impound: 250 },
    { level: 6,  name: 'Electric',    icon: '⚡',  price: 22000, impound: 300 },
    { level: 7,  name: 'Motorcycle',  icon: '🏍️', price: 10000, impound: 200 },
    { level: 8,  name: 'Truck',       icon: '🚚', price: 18000, impound: 300 },
    { level: 9,  name: 'Classic Car', icon: '🏎️', price: 35000, impound: 500 },
    { level: 10, name: 'Sports Car',  icon: '🚀', price: 60000, impound: 800 },
];

// ─── Life Cards ───────────────────────────────────────────
const LIFE_CARDS = [
    { name: 'Speeding Ticket',       icon: '🚨', effect: (p) => { charge(p, 200);  return `${p.name} got a speeding ticket! Pay $200.`; } },
    { name: 'Car Wreck',             icon: '💥', effect: (p) => { charge(p, 500);  return `${p.name} had a car wreck! Pay $500.`; } },
    { name: 'Credit Card Payment',   icon: '💳', effect: (p) => { charge(p, 300);  return `${p.name} has a credit card payment due! Pay $300.`; } },
    { name: 'Fuel for Vehicle',      icon: '⛽', effect: (p) => { charge(p, 100);  return `${p.name} needs to fill up! Pay $100.`; } },
    { name: 'Boyfriend/Girlfriend',  icon: '💑', effect: (p) => { charge(p, 500);  return `${p.name} got a partner! Date night costs $500.`; } },
    { name: 'Baby',                  icon: '👶', effect: (p) => { charge(p, 1000); return `${p.name} had a baby! Pay $1,000.`; } },
    { name: 'Dentist',               icon: '🦷', effect: (p) => { charge(p, 400);  return `${p.name} needs a dentist! Pay $400.`; } },
    { name: 'Eye Doctor',            icon: '👁️',  effect: (p) => { charge(p, 250);  return `${p.name} needs new glasses! Pay $250.`; } },
    { name: 'Chiropractor',          icon: '💆', effect: (p) => { charge(p, 300);  return `${p.name} threw their back out! Pay $300.`; } },
    { name: 'Doctor Visit',          icon: '🏥', effect: (p) => { charge(p, 350);  return `${p.name} is sick! Doctor visit costs $350.`; } },
    { name: 'Knee Surgery',          icon: '🩺', effect: (p) => { charge(p, 2000); return `${p.name} needs knee surgery! Pay $2,000.`; } },
    { name: 'Broke a Tooth',         icon: '😬', effect: (p) => { charge(p, 800);  return `${p.name} broke a tooth! Dental bill: $800.`; } },
    { name: 'Got Robbed',            icon: '🔫', effect: (p) => { charge(p, 500);  return `${p.name} got robbed! Lost $500.`; } },
    { name: 'Bought Groceries',      icon: '🛒', effect: (p) => { charge(p, 150);  return `${p.name} bought groceries. Pay $150.`; } },
    { name: 'Found $100',            icon: '💰', effect: (p) => { p.money += 100;  return `${p.name} found $100 on the ground!`; } },
    { name: 'Karen Alert!',          icon: '😤', effect: (p) => { sendToJail(p);   return `${p.name} was being a Karen and got arrested! Go to Jail!`; } },
    { name: 'Tax Refund',            icon: '📋', effect: (p) => { p.money += 500;  return `${p.name} got a tax refund! +$500`; } },
    { name: 'Side Hustle Pays Off',  icon: '💼', effect: (p) => { p.money += 800;  return `${p.name}'s side hustle paid off! +$800`; } },
];

// ─── Housing Cards ────────────────────────────────────────
const HOUSING_CARDS = [
    { name: 'Upgrade Your Home!',          effect: (p) => upgradeHousing(p, 1) },
    { name: 'Landlord Raised Rent',        effect: (p) => { charge(p, 500); return `${p.name}'s landlord raised the rent! Pay $500.`; } },
    { name: 'House Party!',                effect: (p) => { charge(p, 300); return `${p.name} threw a house party! Pay $300.`; } },
    { name: 'Pipes Burst',                 effect: (p) => { charge(p, 800); return `${p.name}'s pipes burst! Pay $800.`; } },
    { name: 'Win a Raffle - Free Upgrade!',effect: (p) => upgradeHousing(p, 1) },
    { name: 'Move Back with Parents',      effect: (p) => { p.housingLevel = Math.max(0, p.housingLevel - 2); return `${p.name} had to move back with the parents. Housing downgraded!`; } },
];

// ─── Car Cards ────────────────────────────────────────────
const CAR_CARDS = [
    { name: 'Upgrade Your Ride!',  effect: (p) => upgradeCar(p, 1) },
    { name: 'Flat Tire',           effect: (p) => { charge(p, 150);  return `${p.name} got a flat tire! Pay $150.`; } },
    { name: 'Engine Blew Up',      effect: (p) => { charge(p, 1500); return `${p.name}'s engine blew up! Pay $1,500.`; } },
    { name: 'Won a Car Raffle!',   effect: (p) => upgradeCar(p, 2) },
    { name: 'Fender Bender',       effect: (p) => { charge(p, 400);  return `${p.name} had a fender bender! Pay $400.`; } },
    { name: 'Car Got Stolen',      effect: (p) => { p.carLevel = Math.max(0, p.carLevel - 1); return `${p.name}'s car got stolen! Car downgraded.`; } },
];

// ─── Jail Cards ───────────────────────────────────────────
const JAIL_CARDS = [
    { name: 'Go Directly to Jail!',  effect: (p) => { sendToJail(p); return `${p.name} is going to jail!`; } },
    { name: 'Get Out of Jail Free',  effect: (p) => { p.jailFreeCards = (p.jailFreeCards||0)+1; return `${p.name} got a Get Out of Jail Free card!`; } },
    { name: 'Disturbing the Peace',  effect: (p) => { sendToJail(p); return `${p.name} disturbed the peace and got arrested!`; } },
    { name: 'Outstanding Warrant',   effect: (p) => { sendToJail(p); return `${p.name} had an outstanding warrant. Off to jail!`; } },
];

// ─── Board Layout ─────────────────────────────────────────
const BOARD_SPACES = [
    { id: 0,  type: 'corner',  icon: '🏁', name: 'START',         desc: 'Begin your new life!' },
    { id: 1,  type: 'bad',     icon: '🔥', name: 'Scuffed Rims',  desc: 'Pay $100 - 2 Happiness' },
    { id: 2,  type: 'card',    icon: '🃏', name: 'Life Card',      desc: 'Draw a Life Card' },
    { id: 3,  type: 'good',    icon: '💵', name: 'Found $20',      desc: 'Collect $20!' },
    { id: 4,  type: 'payday',  icon: '💰', name: 'PAYDAY',         desc: 'Collect your paycheck!' },
    { id: 5,  type: 'bad',     icon: '🎰', name: 'Casino',         desc: 'Gamble $200 - win or lose!' },
    { id: 6,  type: 'card',    icon: '🏠', name: 'Housing Card',   desc: 'Draw a Housing Card' },
    { id: 7,  type: 'good',    icon: '🧺', name: 'Picnic +1 😊',   desc: '+1 Happiness! Lovely day.' },
    { id: 8,  type: 'bad',     icon: '💸', name: 'Lost Backpack',  desc: 'Lost $30!' },
    { id: 9,  type: 'card',    icon: '🚗', name: 'Car Card',       desc: 'Draw a Car Card' },
    { id: 10, type: 'corner',  icon: '⛓️', name: 'JAIL',           desc: 'Just Visiting... or IN jail!' },
    { id: 11, type: 'job',     icon: '📦', name: 'Amazon Driver',  desc: 'Get hired! $5,000/payday', jobPay: 5000, job: 'Amazon Driver' },
    { id: 12, type: 'card',    icon: '🃏', name: 'Life Card',      desc: 'Draw a Life Card' },
    { id: 13, type: 'bad',     icon: '⛽', name: 'Out of Gas',     desc: 'Tow truck costs $150!' },
    { id: 14, type: 'card',    icon: '🔒', name: 'Jail Card',      desc: 'Draw a Jail Card' },
    { id: 15, type: 'payday',  icon: '💰', name: 'PAYDAY',         desc: 'Collect your paycheck!' },
    { id: 16, type: 'card',    icon: '🃏', name: 'Life Card',      desc: 'Draw a Life Card' },
    { id: 17, type: 'job',     icon: '🛒', name: 'Work at Walmart',desc: 'Get hired! $2,800/payday', jobPay: 2800, job: 'Walmart' },
    { id: 18, type: 'card',    icon: '🚗', name: 'Car Card',       desc: 'Draw a Car Card' },
    { id: 19, type: 'bad',     icon: '🏥', name: 'Hospital Visit', desc: 'Pay $500 medical bill!' },
    { id: 20, type: 'corner',  icon: '🎁', name: 'FREE DAY',       desc: 'Relax! Nothing happens.' },
    { id: 21, type: 'good',    icon: '💵', name: 'Scam Money',     desc: 'Collect $100!' },
    { id: 22, type: 'card',    icon: '🔒', name: 'Jail Card',      desc: 'Draw a Jail Card' },
    { id: 23, type: 'job',     icon: '👮', name: 'Police Job',     desc: 'Get hired! $5,500/payday', jobPay: 5500, job: 'Police' },
    { id: 24, type: 'bad',     icon: '📋', name: 'TAXES',          desc: 'Pay 10x your payday!' },
    { id: 25, type: 'payday',  icon: '💰', name: 'PAYDAY',         desc: 'Collect your paycheck!' },
    { id: 26, type: 'card',    icon: '🃏', name: 'Life Card',      desc: 'Draw a Life Card' },
    { id: 27, type: 'job',     icon: '🚔', name: 'Prison Guard',   desc: 'Get hired! $6,000/payday', jobPay: 6000, job: 'Prison Guard' },
    { id: 28, type: 'card',    icon: '🏠', name: 'Housing Card',   desc: 'Draw a Housing Card' },
    { id: 29, type: 'good',    icon: '✈️',  name: '$1,200 Vacation',desc: 'Collect $1,200 vacation pay!' },
    { id: 30, type: 'corner',  icon: '🚔', name: 'GO TO JAIL',     desc: 'Go directly to Jail!' },
    { id: 31, type: 'job',     icon: '🏠', name: 'Realtor Job',    desc: 'Get hired! $8,000/payday', jobPay: 8000, job: 'Realtor' },
    { id: 32, type: 'card',    icon: '🃏', name: 'Life Card',      desc: 'Draw a Life Card' },
    { id: 33, type: 'card',    icon: '🚗', name: 'Car Card',       desc: 'Draw a Car Card' },
    { id: 34, type: 'payday',  icon: '💰', name: 'PAYDAY',         desc: 'Collect your paycheck!' },
    { id: 35, type: 'good',    icon: '🎰', name: 'Casino Jackpot', desc: 'Win $1,400!' },
    { id: 36, type: 'card',    icon: '🏠', name: 'Housing Card',   desc: 'Draw a Housing Card' },
    { id: 37, type: 'job',     icon: '💻', name: 'Microsoft Job',  desc: 'Get hired! $12,000/payday', jobPay: 12000, job: 'Microsoft' },
    { id: 38, type: 'bad',     icon: '🎓', name: 'Prom Night',     desc: 'Spend $1,000!' },
    { id: 39, type: 'card',    icon: '🃏', name: 'Life Card',      desc: 'Draw a Life Card' },
];

// ─── Grid Position Calculator ─────────────────────────────
function getGridPosition(spaceId) {
    if (spaceId <= 10) {
        return { row: 10, col: 10 - spaceId };
    } else if (spaceId <= 19) {
        return { row: 10 - (spaceId - 10), col: 0 };
    } else if (spaceId <= 30) {
        return { row: 0, col: spaceId - 20 };
    } else {
        return { row: spaceId - 30, col: 10 };
    }
}

// ─── Helper Functions ─────────────────────────────────────
function charge(player, amount) {
    player.money = Math.max(0, player.money - amount);
}

function sendToJail(player) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    if (player.carLevel > 0) player.carImpounded = true;
}

function upgradeHousing(player, levels) {
    const newLevel = Math.min(HOUSING.length - 1, player.housingLevel + levels);
    const cost = HOUSING[newLevel].price - HOUSING[player.housingLevel].price;
    if (player.money >= cost) {
        player.money -= cost;
        player.housingLevel = newLevel;
        return `${player.name} upgraded to ${HOUSING[newLevel].name}! Paid $${cost.toLocaleString()}.`;
    } else {
        return `${player.name} can't afford the housing upgrade right now.`;
    }
}

function upgradeCar(player, levels) {
    const newLevel = Math.min(CARS.length - 1, player.carLevel + levels);
    const cost = CARS[newLevel].price - CARS[player.carLevel].price;
    if (player.money >= cost) {
        player.money -= cost;
        player.carLevel = newLevel;
        return `${player.name} upgraded to a ${CARS[newLevel].name}! Paid $${cost.toLocaleString()}.`;
    } else {
        return `${player.name} can't afford the car upgrade right now.`;
    }
}

function drawCard(deck) {
    return deck[Math.floor(Math.random() * deck.length)];
}

function fmt(n) {
    return '$' + Math.floor(n).toLocaleString();
}

// ─── Screen Management ────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// ─── Intro ────────────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', () => showScreen('setupScreen'));

// ─── Setup Screen ─────────────────────────────────────────
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
    const btn = document.getElementById('setupDoneBtn');
    if (gameState.numPlayers > 0 && gameState.winGoal > 0) {
        btn.classList.remove('hidden');
    }
}

function setupPlayers() {
    gameState.players = [];
    gameState.currentSetupPlayer = 0;
    showPlayerSetup();
    showScreen('playerSetupScreen');
}

function showPlayerSetup() {
    const idx = gameState.currentSetupPlayer;
    document.getElementById('playerSetupTitle').textContent = `Player ${idx + 1} Setup`;
    document.getElementById('playerName').value = '';
    document.getElementById('jobSelect').value = '';
    document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
    tempSetup = { avatar: '', job: '', jobPay: 0, name: '' };
    const btn = document.getElementById('nextPlayerBtn');
    btn.textContent = (idx === gameState.numPlayers - 1) ? 'START CHAOS!' : 'NEXT PLAYER';
}

function selectAvatar(emoji) {
    tempSetup.avatar = emoji;
    document.querySelectorAll('.avatar-btn').forEach(b => {
        b.classList.toggle('selected', b.textContent === emoji);
    });
}

function nextPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const jobVal = document.getElementById('jobSelect').value;

    if (!tempSetup.avatar) { alert('Pick an avatar!'); return; }
    if (!jobVal) { alert('Pick a job!'); return; }
    if (!name) { alert('Enter your name!'); return; }

    const player = {
        id: gameState.currentSetupPlayer,
        name: name,
        avatar: tempSetup.avatar,
        job: jobVal,
        jobPay: JOB_PAYS[jobVal] || 2000,
        money: 20000,
        position: 0,
        housingLevel: 0,
        carLevel: 0,
        inJail: false,
        jailTurns: 0,
        carImpounded: false,
        jailFreeCards: 0,
        happiness: 5,
        turnsPlayed: 0,
    };

    gameState.players.push(player);
    gameState.currentSetupPlayer++;

    if (gameState.currentSetupPlayer >= gameState.numPlayers) {
        startGame();
    } else {
        showPlayerSetup();
    }
}

// ─── Start Game ───────────────────────────────────────────
function startGame() {
    gameState.currentPlayerIndex = 0;
    gameState.phase = 'playing';
    showScreen('gameScreen');
    buildBoard();
    renderPlayerBar();
    updateCurrentPlayerDisplay();
}

// ─── Board Building ───────────────────────────────────────
function buildBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';

    const cells = {};
    for (let r = 0; r <= 10; r++) {
        for (let c = 0; c <= 10; c++) {
            cells[`${r},${c}`] = null;
        }
    }

    BOARD_SPACES.forEach(space => {
        const pos = getGridPosition(space.id);
        cells[`${pos.row},${pos.col}`] = space;
    });

    for (let r = 0; r <= 10; r++) {
        for (let c = 0; c <= 10; c++) {
            const space = cells[`${r},${c}`];
            const div = document.createElement('div');

            if (space) {
                div.className = `board-space ${space.type}`;
                div.setAttribute('data-space-id', space.id);
                div.innerHTML = `
                    <div class="space-icon">${space.icon}</div>
                    <div class="space-name">${space.name}</div>
                    ${space.jobPay ? `<div class="space-value">${fmt(space.jobPay)}</div>` : ''}
                    <div class="player-pieces" id="pieces-${space.id}"></div>
                `;
            } else if (r >= 1 && r <= 9 && c >= 1 && c <= 9) {
                if (r === 5 && c === 5) {
                    div.className = 'center-area';
                    div.style.gridColumn = '2 / 11';
                    div.style.gridRow = '2 / 11';
                    div.innerHTML = `
                        <div class="center-title">⚡ CHAOS ⚡</div>
                        <div class="center-subtitle">The Game of Life</div>
                        <div style="margin-top:15px; color:#4ecca3; font-size:0.8em;">Win Goal: ${fmt(gameState.winGoal)}</div>
                    `;
                } else {
                    div.style.display = 'none';
                }
            } else {
                div.style.background = 'transparent';
                div.style.border = 'none';
            }

            board.appendChild(div);
        }
    }

    updatePlayerPieces();
}

// ─── Player Pieces on Board ───────────────────────────────
function updatePlayerPieces() {
    document.querySelectorAll('.player-pieces').forEach(el => el.innerHTML = '');

    gameState.players.forEach(p => {
        const container = document.getElementById(`pieces-${p.position}`);
        if (container) {
            const piece = document.createElement('span');
            piece.className = 'player-piece';
            piece.textContent = p.avatar;
            piece.title = p.name;
            container.appendChild(piece);
        }
    });
}

// ─── Player Info Bar ──────────────────────────────────────
function renderPlayerBar() {
    const bar = document.getElementById('playerInfoBar');
    bar.innerHTML = '';

    gameState.players.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = `player-token ${i === gameState.currentPlayerIndex ? 'active-player' : ''}`;
        div.id = `token-${i}`;
        div.innerHTML = `
            <div class="token-avatar">${p.avatar}</div>
            <div class="token-name">${p.name}</div>
            <div class="token-money">${fmt(p.money)}</div>
            <div class="token-happiness">😊 ${p.happiness}/10</div>
            <div style="font-size:0.8em;color:#a8a8b3;">${HOUSING[p.housingLevel].icon} ${HOUSING[p.housingLevel].name}</div>
            <div style="font-size:0.8em;color:#a8a8b3;">${CARS[p.carLevel].icon} ${CARS[p.carLevel].name}</div>
            ${p.inJail ? '<div style="color:#e94560;font-size:0.8em;">⛓️ IN JAIL</div>' : ''}
        `;
        bar.appendChild(div);
    });
}

function updateCurrentPlayerDisplay() {
    const p = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('currentPlayerInfo').innerHTML =
        `${p.avatar} <strong>${p.name}</strong>'s Turn &nbsp;|&nbsp; ${fmt(p.money)} &nbsp;|&nbsp; ${p.job}`;
    document.getElementById('gameMessage').textContent = p.inJail
        ? `You're in jail! Turn ${p.jailTurns}/3. Roll doubles to escape free, or pay $100 + $300 impound after 3 turns.`
        : 'Roll the dice!';
    document.getElementById('diceResult').textContent = '';
    document.getElementById('rollDiceBtn').disabled = false;
}

// ─── Dice Rolling ─────────────────────────────────────────
function rollDice() {
    const btn = document.getElementById('rollDiceBtn');
    btn.disabled = true;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const doubles = die1 === die2;

    const diceEmojis = ['', '1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];
    document.getElementById('diceResult').textContent =
        `${diceEmojis[die1]} ${diceEmojis[die2]} = ${total}${doubles ? ' 🎲 DOUBLES!' : ''}`;

    const player = gameState.players[gameState.currentPlayerIndex];

    if (player.inJail) {
        handleJailTurn(player, doubles, total);
    } else {
        movePlayer(player, total);
    }
}

// ─── Jail Logic ───────────────────────────────────────────
function handleJailTurn(player, doubles, total) {
    if (doubles) {
        player.inJail = false;
        player.carImpounded = false;
        let msg = `${player.name} rolled doubles and got out of jail free!`;
        movePlayer(player, total);
        showPopup('🎲 DOUBLES! JAIL BREAK!', msg, 'good');
        return;
    }

    player.jailTurns++;

    if (player.jailTurns >= 3) {
        let cost = 100;
        let msg = `${player.name} served 3 turns in jail. Pay $100 to get out.`;
        if (player.carImpounded && player.carLevel > 0) {
            cost += CARS[player.carLevel].impound;
            msg += ` Plus $${CARS[player.carLevel].impound} to get car out of impound!`;
            player.carImpounded = false;
        }
        charge(player, cost);
        player.inJail = false;
        player.jailTurns = 0;
        showPopup('⛓️ RELEASED!', msg + ` Total: ${fmt(cost)}`, 'bad');
        renderPlayerBar();
        setTimeout(endTurn, 1500);
    } else {
        showPopup('⛓️ STILL IN JAIL', `${player.name} stays in jail. Turn ${player.jailTurns}/3. Roll doubles next turn to escape!`, 'bad');
        renderPlayerBar();
        setTimeout(endTurn, 1500);
    }
}

// ─── Move Player ──────────────────────────────────────────
function movePlayer(player, steps) {
    const oldPos = player.position;
    let newPos = (player.position + steps) % 40;

    if (newPos < oldPos || (oldPos + steps) >= 40) {
        player.money += player.jobPay;
        showMessage(`${player.name} passed START and collected ${fmt(player.jobPay)}!`);
    }

    player.position = newPos;
    player.turnsPlayed++;
    updatePlayerPieces();
    renderPlayerBar();

    setTimeout(() => landOnSpace(player, BOARD_SPACES[newPos]), 400);
}

// ─── Land on Space ────────────────────────────────────────
function landOnSpace(player, space) {
    switch (space.type) {
        case 'corner':
            handleCorner(player, space);
            break;
        case 'payday':
            player.money += player.jobPay;
            renderPlayerBar();
            showPopup('💰 PAYDAY!', `${player.name} collects ${fmt(player.jobPay)} from their ${player.job} job!`, 'good');
            setTimeout(endTurn, 1800);
            break;
        case 'card':
            handleCard(player, space);
            break;
        case 'good':
            handleGoodSpace(player, space);
            break;
        case 'bad':
            handleBadSpace(player, space);
            break;
        case 'job':
            handleJobSpace(player, space);
            break;
        default:
            endTurn();
    }
}

// ─── Corner Handlers ──────────────────────────────────────
function handleCorner(player, space) {
    if (space.id === 0) {
        showPopup('🏁 START!', `${player.name} is at the starting line!`, 'good');
        setTimeout(endTurn, 1500);
    } else if (space.id === 10) {
        showPopup('⛓️ JAIL', `${player.name} is just visiting jail. Stay cool!`, '');
        setTimeout(endTurn, 1500);
    } else if (space.id === 20) {
        showPopup('🎁 FREE DAY!', `${player.name} gets a free day! Nothing happens. Enjoy the peace.`, 'good');
        setTimeout(endTurn, 1500);
    } else if (space.id === 30) {
        sendToJail(player);
        renderPlayerBar();
        updatePlayerPieces();
        showPopup('🚔 GO TO JAIL!', `${player.name} is going directly to jail! Car gets impounded too if you have one!`, 'bad');
        setTimeout(endTurn, 1800);
    }
}

// ─── Card Handlers ────────────────────────────────────────
function handleCard(player, space) {
    let card, result;

    if (space.name === 'Life Card') {
        card = drawCard(LIFE_CARDS);
        result = card.effect(player);
    } else if (space.name === 'Housing Card') {
        card = drawCard(HOUSING_CARDS);
        result = card.effect(player);
    } else if (space.name === 'Car Card') {
        card = drawCard(CAR_CARDS);
        result = card.effect(player);
    } else if (space.name === 'Jail Card') {
        card = drawCard(JAIL_CARDS);
        result = card.effect(player);
    }

    renderPlayerBar();
    updatePlayerPieces();

    const isGood = result && (result.includes('+') || result.includes('Collect') || result.includes('upgrade') || result.includes('Upgrade') || result.includes('free'));
    showPopup(`${space.icon} ${card ? card.name : space.name}`, result || 'Something happened!', isGood ? 'good' : 'bad');
    setTimeout(() => {
        closePopup();
        checkWin(player);
    }, 2000);
}

// ─── Good/Bad Space Handlers ──────────────────────────────
function handleGoodSpace(player, space) {
    let msg = '';
    if (space.name === 'Found $20')          { player.money += 20;   msg = `${player.name} found $20!`; }
    else if (space.name === 'Scam Money')    { player.money += 100;  msg = `${player.name} scammed someone for $100!`; }
    else if (space.name === 'Picnic +1 😊')  { player.happiness = Math.min(10, player.happiness + 1); msg = `${player.name} had a lovely picnic! +1 Happiness!`; }
    else if (space.name === '$1,200 Vacation'){ player.money += 1200; msg = `${player.name} got vacation pay! +$1,200!`; }
    else if (space.name === 'Casino Jackpot') { player.money += 1400; msg = `${player.name} hit the jackpot! +$1,400!`; }
    else { player.money += 100; msg = `${player.name} got lucky!`; }

    renderPlayerBar();
    showPopup('✅ NICE!', msg, 'good');
    setTimeout(() => { closePopup(); checkWin(player); }, 1800);
}

function handleBadSpace(player, space) {
    let msg = '';
    if (space.name === 'Scuffed Rims')      { charge(player, 100); player.happiness = Math.max(0, player.happiness - 2); msg = `${player.name} scuffed their rims! -$100, -2 Happiness.`; }
    else if (space.name === 'Lost Backpack') { charge(player, 30);  msg = `${player.name} lost their backpack! -$30.`; }
    else if (space.name === 'Out of Gas')    { charge(player, 150); msg = `${player.name} ran out of gas! Tow costs $150.`; }
    else if (space.name === 'TAXES') {
        const tax = player.jobPay * 10;
        charge(player, tax);
        msg = `${player.name} has to pay TAXES! 10x payday = ${fmt(tax)} gone!`;
    }
    else if (space.name === 'Hospital Visit'){ charge(player, 500);  msg = `${player.name} had a hospital visit! -$500.`; }
    else if (space.name === 'Prom Night')    { charge(player, 1000); msg = `${player.name} went to prom! -$1,000.`; }
    else if (space.name === 'Casino') {
        const win = Math.random() > 0.5;
        if (win) { player.money += 200; msg = `${player.name} gambled $200 at the casino and WON! +$200!`; }
        else     { charge(player, 200); msg = `${player.name} gambled $200 at the casino and LOST! -$200.`; }
    }
    else { charge(player, 100); msg = `${player.name} had some bad luck! -$100.`; }

    renderPlayerBar();
    showPopup('❌ OUCH!', msg, 'bad');
    setTimeout(endTurn, 1800);
}

// ─── Job Space ────────────────────────────────────────────
function handleJobSpace(player, space) {
    if (space.job && space.jobPay) {
        const popup = document.getElementById('popup');
        const title = document.getElementById('popupTitle');
        const message = document.getElementById('popupMessage');
        const btnContainer = popup.querySelector('.popup-content');

        title.textContent = `${space.icon} ${space.name}`;
        message.textContent = `${player.name}, do you want to take this job?\nCurrent: ${player.job} (${fmt(player.jobPay)}/payday)\nNew: ${space.job} (${fmt(space.jobPay)}/payday)`;
        popup.classList.remove('hidden');
        popup.querySelector('.popup-content').className = 'popup-content';

        const existingBtns = btnContainer.querySelectorAll('button');
        existingBtns.forEach(b => b.remove());

        const yesBtn = document.createElement('button');
        yesBtn.className = 'btn';
        yesBtn.style.marginRight = '10px';
        yesBtn.textContent = 'TAKE THE JOB!';
        yesBtn.onclick = () => {
            player.job = space.job;
            player.jobPay = space.jobPay;
            renderPlayerBar();
            updateCurrentPlayerDisplay();
            btnContainer.querySelectorAll('button').forEach(b => b.remove());
            const okBtn = document.createElement('button');
            okBtn.className = 'btn';
            okBtn.textContent = 'OK!!';
            okBtn.onclick = () => { closePopup(); endTurn(); };
            btnContainer.appendChild(okBtn);
            message.textContent = `${player.name} is now working as ${space.job}! New payday: ${fmt(space.jobPay)}`;
        };

        const noBtn = document.createElement('button');
        noBtn.className = 'btn';
        noBtn.style.background = 'linear-gradient(135deg, #0f3460, #16213e)';
        noBtn.textContent = 'PASS';
        noBtn.onclick = () => { closePopup(); endTurn(); };

        btnContainer.appendChild(yesBtn);
        btnContainer.appendChild(noBtn);
    } else {
        endTurn();
    }
}

// ─── End Turn ─────────────────────────────────────────────
function endTurn() {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (checkWin(player)) return;

    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.numPlayers;
    renderPlayerBar();
    updateCurrentPlayerDisplay();
}

// ─── Win Check ────────────────────────────────────────────
function checkWin(player) {
    if (player.money >= gameState.winGoal) {
        showWin(player);
        return true;
    }
    return false;
}

function showWin(player) {
    gameState.phase = 'over';

    let winScreen = document.getElementById('winScreen');
    if (!winScreen) {
        winScreen = document.createElement('div');
        winScreen.id = 'winScreen';
        winScreen.className = 'screen hidden';
        winScreen.innerHTML = `
            <div class="win-content">
                <h1>🏆 WINNER! 🏆</h1>
                <div id="winnerAvatar" style="font-size:5em;"></div>
                <div id="winnerName" style="font-size:2em;color:#4ecca3;margin:10px 0;"></div>
                <div class="win-stats" id="winStats"></div>
                <button class="btn" onclick="location.reload()">PLAY AGAIN!</button>
            </div>
        `;
        document.body.appendChild(winScreen);
    }

    document.getElementById('winnerAvatar').textContent = player.avatar;
    document.getElementById('winnerName').textContent = `${player.name} WON!`;
    document.getElementById('winStats').innerHTML = `
        <div class="win-stat"><div class="win-stat-label">Final Money</div><div class="win-stat-value">${fmt(player.money)}</div></div>
        <div class="win-stat"><div class="win-stat-label">Job</div><div class="win-stat-value">${player.job}</div></div>
        <div class="win-stat"><div class="win-stat-label">Home</div><div class="win-stat-value">${HOUSING[player.housingLevel].icon} ${HOUSING[player.housingLevel].name}</div></div>
        <div class="win-stat"><div class="win-stat-label">Car</div><div class="win-stat-value">${CARS[player.carLevel].icon} ${CARS[player.carLevel].name}</div></div>
    `;

    showScreen('winScreen');
}

// ─── Popup ────────────────────────────────────────────────
function showPopup(title, message, type) {
    document.getElementById('popupTitle').textContent = title;
    document.getElementById('popupMessage').textContent = message;
    const popup = document.getElementById('popup');
    const content = popup.querySelector('.popup-content');
    content.className = 'popup-content';
    if (type === 'good') content.classList.add('popup-good');
    if (type === 'bad') content.classList.add('popup-bad');

    const existingBtns = content.querySelectorAll('button');
    existingBtns.forEach(b => b.remove());
    const okBtn = document.createElement('button');
    okBtn.className = 'btn';
    okBtn.textContent = 'OK!!';
    okBtn.onclick = closePopup;
    content.appendChild(okBtn);

    popup.classList.remove('hidden');
}

function closePopup() {
    document.getElementById('popup').classList.add('hidden');
}

function showMessage(msg) {
    document.getElementById('gameMessage').textContent = msg;
}

// ─── Board Space Info on Click ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gameBoard')?.addEventListener('click', (e) => {
        const space = e.target.closest('.board-space');
        if (!space) return;
        const spaceId = parseInt(space.getAttribute('data-space-id'));
        if (isNaN(spaceId)) return;
        const spaceData = BOARD_SPACES[spaceId];
        if (!spaceData) return;
        showPopup(`${spaceData.icon} ${spaceData.name}`, spaceData.desc, '');
    });
});
