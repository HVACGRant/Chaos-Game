// ============================================================
//  CHAOS — Sarcastic Card Decks  |  20 cards each
//  Drop-in replacement for the three const blocks in game.js:
//    SARCASTIC_CARDS        (Normal mode — profane)
//    FUNNY_SARCASTIC_CARDS  (Funny mode — clean)
//    ADULT_SARCASTIC_CARDS  (Sarcastic mode — profane)
//  Mechanics match existing helpers: charge, scaledFine,
//  adjustHappiness, fmt. Most return 'sarcastic' type.
// ============================================================

// ── NORMAL MODE — SARCASTIC (20) ──────────────────────────
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
];

// ── FUNNY MODE — SARCASTIC (20) ───────────────────────────
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
];

// ── SARCASTIC (ADULT) MODE — SARCASTIC (20) ───────────────
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
];
