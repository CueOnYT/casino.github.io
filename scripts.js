/* Cuemo's Casino — scripts.js
   - Fake-money demo
   - Balance stored in localStorage under key 'cuemo_balance_v1'
   - Includes slots, coin flip, blackjack, roulette, video poker, baccarat, craps, keno
*/

(() => {
  // ---- Utilities & balance ----
  const BAL_KEY = 'cuemo_balance_v1';
  const STARTING = 1000;
  const toastEl = document.getElementById('toast');

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._h);
    toastEl._h = setTimeout(() => toastEl.classList.remove('show'), 2500);
  }
  function format(n) { return '$' + Number(n).toLocaleString(); }
  function getBal() { return Number(localStorage.getItem(BAL_KEY) ?? STARTING); }
  function setBal(v) { localStorage.setItem(BAL_KEY, Math.max(0, Math.round(v))); renderBal(); }
  function adjustBal(delta) { setBal(getBal() + delta); }

  function renderBal() { document.getElementById('balance').textContent = format(getBal()); }

  // initialize
  if (localStorage.getItem(BAL_KEY) === null) localStorage.setItem(BAL_KEY, STARTING);
  renderBal();

  // Quick bet UI
  document.querySelectorAll('.chip').forEach(b => {
    b.addEventListener('click', () => document.getElementById('customBet').value = b.dataset.bet);
  });
  document.getElementById('addCash').addEventListener('click', ()=> { adjustBal(500); toast('Added $500 (fake)');});
  document.getElementById('resetBtn').addEventListener('click', ()=> {
    if (confirm('Reset fake balance to $1,000?')) { localStorage.setItem(BAL_KEY, STARTING); renderBal(); toast('Balance reset'); }
  });

  function readInput(id, fallback = 0) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = Number(el.value || fallback);
    return isNaN(v) ? fallback : Math.max(0, Math.round(v));
  }

  // ---- Slots ----
  const slotSymbols = ['🍒','🍋','🍊','🍉','⭐','🔔','7️⃣'];
  function randChoice(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  document.getElementById('spinBtn').addEventListener('click', async () => {
    const bet = readInput('slotBet', 10);
    if (bet <= 0) return toast('Enter a bet > $0');
    if (getBal() < bet) return toast('Insufficient funds');

    adjustBal(-bet);
    // animate reels
    const r1 = document.getElementById('slot-r1');
    const r2 = document.getElementById('slot-r2');
    const r3 = document.getElementById('slot-r3');
    [r1, r2, r3].forEach(el => el.classList.add('spin'));

    // spinning effect: change symbols rapidly
    let spins = 12;
    for (let i = 0; i < spins; i++) {
      r1.textContent = randChoice(slotSymbols);
      r2.textContent = randChoice(slotSymbols);
      r3.textContent = randChoice(slotSymbols);
      await new Promise(res => setTimeout(res, 70 + i*6));
    }
    [r1, r2, r3].forEach(el => el.classList.remove('spin'));

    const a = r1.textContent, b = r2.textContent, c = r3.textContent;
    // scoring
    let multiplier = 0;
    const set = new Set([a,b,c]);
    if (a === b && b === c) multiplier = 10;         // three of a kind
    else if (a === b || b === c || a === c) multiplier = 3; // pair
    // jackpot: all 7️⃣
    if (a === '7️⃣' && b === '7️⃣' && c === '7️⃣') multiplier = 25;
    const win = Math.round(bet * multiplier);
    if (win > 0) { adjustBal(win); toast(`You won ${format(win)}! (${multiplier}×)`); }
    else toast(`No win — try again. Lost ${format(bet)}`);
  });

  // ---- Coin flip ----
  let coinChoice = 'H';
  document.querySelectorAll('#game-coin .controls [data-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      coinChoice = btn.dataset.choice;
      document.querySelectorAll('#game-coin .controls button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      toast(`Selected ${coinChoice === 'H' ? 'Heads' : 'Tails'}`);
    });
  });
  document.getElementById('flipBtn').addEventListener('click', async () => {
    const bet = readInput('coinBet', 10);
    if (bet <= 0) return toast('Bet must be > $0');
    if (getBal() < bet) return toast('Insufficient funds');
    adjustBal(-bet);
    const faceEl = document.getElementById('coinFace');
    faceEl.classList.add('flip');
    await new Promise(r => setTimeout(r, 700));
    faceEl.classList.remove('flip');
    const result = Math.random() < 0.5 ? 'H' : 'T';
    faceEl.textContent = result === 'H' ? 'H' : 'T';
    if (result === coinChoice) {
      const win = bet * 2;
      adjustBal(win);
      toast(`You guessed right! Win ${format(win)}`);
    } else {
      toast(`Wrong — lost ${format(bet)}`);
    }
  });

  // ---- Blackjack (very simplified) ----
  function newDeck() {
    const suits = ['♠','♥','♦','♣'];
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const deck = [];
    for (let s of suits) for (let r of ranks) deck.push(r + s);
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function cardValue(card) {
    const r = card.slice(0, -1);
    if (r === 'A') return 11;
    if (['J','Q','K'].includes(r)) return 10;
    return Number(r);
  }
  function handValue(hand) {
    let total = hand.reduce((s,c) => s + cardValue(c), 0);
    // handle aces
    let aces = hand.filter(c => c.startsWith('A')).length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }

  let bjState = null;
  document.getElementById('bjDeal').addEventListener('click', () => {
    const bet = readInput('bjBet', 20);
    if (bet <= 0) return toast('Enter bet > 0');
    if (getBal() < bet) return toast('Insufficient funds');
    adjustBal(-bet);
    const deck = newDeck();
    const player = [deck.pop(), deck.pop()];
    const dealer = [deck.pop(), deck.pop()];
    bjState = { deck, player, dealer, bet, settled: false };
    document.getElementById('bjPlayer').textContent = player.join(' ');
    document.getElementById('bjDealer').textContent = dealer[0] + ' [hidden]';
    // enable hit/stand
    document.getElementById('bjHit').disabled = false;
    document.getElementById('bjStand').disabled = false;
    document.getElementById('bjDeal').disabled = true;
    toast('Blackjack: Hit or Stand?');
    // immediate blackjack check
    const pv = handValue(player);
    const dv = handValue(dealer);
    if (pv === 21 || dv === 21) {
      // immediate resolution on next action
      // let user still see, but auto-resolve after tiny delay
      setTimeout(() => resolveBlackjack(), 700);
    }
  });

  document.getElementById('bjHit').addEventListener('click', () => {
    if (!bjState) return;
    bjState.player.push(bjState.deck.pop());
    document.getElementById('bjPlayer').textContent = bjState.player.join(' ');
    const pv = handValue(bjState.player);
    if (pv > 21) { // bust
      resolveBlackjack();
    }
  });
  document.getElementById('bjStand').addEventListener('click', () => resolveBlackjack());

  function resolveBlackjack() {
    if (!bjState || bjState.settled) return;
    const { deck, player, dealer, bet } = bjState;
    // dealer hits until 17
    while (handValue(dealer) < 17) dealer.push(deck.pop());
    const pv = handValue(player), dv = handValue(dealer);
    document.getElementById('bjPlayer').textContent = player.join(' ') + ` (${pv})`;
    document.getElementById('bjDealer').textContent = dealer.join(' ') + ` (${dv})`;
    let result = '';
    if (pv > 21) result = 'bust';
    else if (dv > 21) result = 'dealer bust';
    else if (pv === dv) result = 'push';
    else if (pv === 21 && player.length === 2) result = 'player blackjack';
    else if (dv === 21 && dealer.length === 2) result = 'dealer blackjack';
    else if (pv > dv) result = 'player';
    else result = 'dealer';

    let payout = 0;
    if (result === 'player blackjack') {
      payout = Math.round(bet * 2.5); // 1.5x plus return
      toast(`Blackjack! You win ${format(payout)}`);
    } else if (result === 'player' || result === 'dealer bust') {
      payout = bet * 2;
      toast(`You win ${format(payout)}`);
    } else if (result === 'push') {
      payout = bet; // return
      toast(`Push — bet returned ${format(bet)}`);
    } else {
      toast(`You lost ${format(bet)}`);
    }
    if (payout) adjustBal(payout);
    // disable hit/stand
    document.getElementById('bjHit').disabled = true;
    document.getElementById('bjStand').disabled = true;
    document.getElementById('bjDeal').disabled = false;
    bjState.settled = true;
  }

  // ---- Roulette ----
  const redSet = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  document.getElementById('ruSpin').addEventListener('click', async () => {
    const type = document.getElementById('ruType').value;
    const choice = document.getElementById('ruChoice').value.trim().toLowerCase();
    const bet = readInput('ruBet', 10);
    if (bet <= 0) return toast('Enter a bet > 0');
    if (getBal() < bet) return toast('Insufficient funds');
    adjustBal(-bet);
    // spin result 0-36
    const resultNum = Math.floor(Math.random() * 37);
    const color = resultNum === 0 ? 'green' : (redSet.has(resultNum) ? 'red' : 'black');
    let win = 0, message = `${resultNum} ${color.toUpperCase()}`;

    if (type === 'number') {
      if (String(resultNum) === choice) { win = bet * 36; }
    } else if (type === 'color') {
      if ((choice === 'red' && color === 'red') || (choice === 'black' && color === 'black')) { win = bet * 2; }
    } else if (type === 'parity') {
      if (resultNum === 0) win = 0;
      else if (choice === 'even' && resultNum % 2 === 0) win = bet * 2;
      else if (choice === 'odd' && resultNum % 2 === 1) win = bet * 2;
    }
    if (win) { adjustBal(win); toast(`Result: ${message} — you won ${format(win)}`); }
    else toast(`Result: ${message} — lost ${format(bet)}`);
    document.getElementById('ruResult').textContent = `Result: ${message}`;
  });

  // ---- Video Poker (5-card draw simplified) ----
  const vpDeckFactory = () => {
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const suits = ['♠','♥','♦','♣'];
    const d = [];
    for (let r of ranks) for (let s of suits) d.push({r,s});
    // shuffle
    for (let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
    return d;
  };
  function vpRank(hand) {
    // hand: array of {r,s}
    // simplified paytable: pair -> 1x, two pair -> 2x, trips -> 3x, straight -> 4x, flush ->6x, full house -> 9x, quads -> 25x, straight flush -> 50x, royal flush -> 250x
    const ranksOrder = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    const counts = {};
    hand.forEach(c => counts[c.r] = (counts[c.r]||0)+1);
    const vals = Object.values(counts).sort((a,b)=>b-a);
    const suits = new Set(hand.map(c=>c.s));
    const isFlush = suits.size === 1;
    const sorted = hand.map(c => ranksOrder[c.r]).sort((a,b)=>a-b);
    // check straight (handle A low)
    let isStraight = true;
    for (let i=1;i<sorted.length;i++) if (sorted[i] !== sorted[i-1]+1) isStraight = false;
    // A-2-3-4-5 special
    if (!isStraight) {
      const alt = sorted.map(v => v===14?1:v).sort((a,b)=>a-b);
      let altStraight = true;
      for (let i=1;i<alt.length;i++) if (alt[i] !== alt[i-1]+1) altStraight = false;
      if (altStraight) isStraight = true;
    }
    if (isStraight && isFlush && sorted.includes(14) && sorted.includes(10)) return {name:'Royal Flush',mult:250};
    if (isStraight && isFlush) return {name:'Straight Flush',mult:50};
    if (vals[0] === 4) return {name:'Four of a Kind',mult:25};
    if (vals[0]===3 && vals[1]===2) return {name:'Full House',mult:9};
    if (isFlush) return {name:'Flush',mult:6};
    if (isStraight) return {name:'Straight',mult:4};
    if (vals[0]===3) return {name:'Three of a Kind',mult:3};
    if (vals[0]===2 && vals[1]===2) return {name:'Two Pair',mult:2};
    if (vals[0]===2) return {name:'One Pair',mult:1};
    return {name:'No Pair',mult:0};
  }

  let vpState = null;
  const vpCardsEl = document.getElementById('vpCards');
  function renderVPCards() {
    vpCardsEl.innerHTML = '';
    if (!vpState) { vpCardsEl.textContent = '—'; return; }
    vpState.hand.forEach((c, idx) => {
      const div = document.createElement('div');
      div.className = 'vp-card' + (vpState.hold[idx] ? ' held' : '');
      div.textContent = c.r + c.s;
      div.addEventListener('click', () => {
        if (!vpState.drew) {
          vpState.hold[idx] = !vpState.hold[idx];
          renderVPCards();
        }
      });
      vpCardsEl.appendChild(div);
    });
  }

  document.getElementById('vpDeal').addEventListener('click', () => {
    const bet = readInput('vpBet', 10);
    if (bet <= 0) return toast('Enter bet > 0');
    if (getBal() < bet) return toast('Insufficient funds');
    adjustBal(-bet);
    const d = vpDeckFactory();
    const hand = [d.pop(), d.pop(), d.pop(), d.pop(), d.pop()];
    vpState = { deck: d, hand, hold: [false,false,false,false,false], bet, drew: false };
    renderVPCards();
    document.getElementById('vpDraw').disabled = false;
  });

  document.getElementById('vpDraw').addEventListener('click', () => {
    if (!vpState) return;
    // replace non-held
    for (let i=0;i<5;i++) if (!vpState.hold[i]) vpState.hand[i] = vpState.deck.pop();
    vpState.drew = true;
    renderVPCards();
    // evaluate
    const res = vpRank(vpState.hand);
    const payout = Math.round(vpState.bet * res.mult);
    if (payout > 0) { adjustBal(payout); toast(`${res.name} — you won ${format(payout)}`); }
    else toast(`No win (${res.name}) — lost ${format(vpState.bet)}`);
    // clear state after a short delay
    document.getElementById('vpDraw').disabled = true;
    setTimeout(()=>{ vpState = null; renderVPCards(); }, 900);
  });

  // ---- Baccarat ----
  function drawCardValueForBaccarat() {
    // Baccarat card values: A=1, 2-9 as numeric, 10/J/Q/K = 0
    const r = Math.floor(Math.random()*13);
    if (r === 0) return {r:'A',v:1};
    if (r >= 9) return {r: ['10','J','Q','K'][r-9], v:0};
    return {r: String(r+1), v: r+1};
  }
  document.getElementById('bacBtn').addEventListener('click', () => {
    const bet = readInput('bacBet', 20);
    if (bet <= 0) return toast('Enter bet > 0');
    if (getBal() < bet) return toast('Insufficient funds');
    adjustBal(-bet);
    // draw 2 cards each, simple rules (no third-card complexity for demo: total mod10)
    const p = [drawCardValueForBaccarat(), drawCardValueForBaccarat()];
    const b = [drawCardValueForBaccarat(), drawCardValueForBaccarat()];
    const pt = (p[0].v + p[1].v) % 10;
    const bt = (b[0].v + b[1].v) % 10;
    document.getElementById('bacPlayer').textContent = `${p.map(x=>x.r).join(' ')} (${pt})`;
    document.getElementById('bacBanker').textContent = `${b.map(x=>x.r).join(' ')} (${bt})`;
    const choice = document.getElementById('bacChoice').value;
    let payout = 0;
    if ((choice === 'player' && pt > bt) || (choice === 'banker' && bt > pt) || (choice === 'tie' && pt === bt)) {
      if (choice === 'player' && pt > bt) payout = bet * 2;
      if (choice === 'banker' && bt > pt) payout = Math.round(bet * 1.95);
      if (choice === 'tie' && pt === bt) payout = bet * 8;
      adjustBal(payout);
      toast(`Result: Player ${pt} - Banker ${bt} — you won ${format(payout)}`);
    } else {
      toast(`Result: Player ${pt} - Banker ${bt} — lost ${format(bet)}`);
    }
  });

  // ---- Craps (very simplified pass-line) ----
  let crapsPoint = null;
  document.getElementById('crapsRoll').addEventListener('click', () => {
    const bet = readInput('crapsBet', 10);
    if (bet <= 0) return toast('Enter bet > 0');
    if (getBal() < bet) return toast('Insufficient funds');
    // Roll two dice
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const total = d1 + d2;
    document.getElementById('crapsDice').textContent = `${d1} + ${d2} = ${total}`;
    // if no point established: come-out roll
    if (!crapsPoint) {
      if (total === 7 || total === 11) { adjustBal(bet * 2); toast(`Natural ${total}! You win ${format(bet*2)}`); }
      else if (total === 2 || total === 3 || total === 12) { toast(`Craps ${total} — you lose ${format(bet)}`); }
      else { crapsPoint = total; document.getElementById('crapsState').textContent = `Point: ${crapsPoint}`; toast(`Point established: ${crapsPoint}`); }
    } else {
      // point is active
      if (total === crapsPoint) { adjustBal(bet * 2); toast(`Made point ${total}! You win ${format(bet*2)}`); crapsPoint = null; document.getElementById('crapsState').textContent = `Point: —`; }
      else if (total === 7) { toast(`Seven out — you lose ${format(bet)} and point cleared`); crapsPoint = null; document.getElementById('crapsState').textContent = `Point: —`; }
      else { toast(`Rolled ${total}. Keep trying for point ${crapsPoint}`); }
    }
  });

  // ---- Keno (1..40, pick up to 10) ----
  const kenoContainer = document.getElementById('kenoPick');
  const kenoResultEl = document.getElementById('kenoResult');
  const KENO_MAX = 40;
  let kenoSelected = new Set();
  function renderKenoGrid() {
    kenoContainer.innerHTML = '';
    for (let i=1;i<=KENO_MAX;i++) {
      const el = document.createElement('div');
      el.className = 'keno-num' + (kenoSelected.has(i) ? ' active' : '');
      el.textContent = i;
      el.addEventListener('click', () => {
        if (kenoSelected.has(i)) kenoSelected.delete(i);
        else if (kenoSelected.size < 10) kenoSelected.add(i);
        else { toast('Max 10 numbers'); return; }
        renderKenoGrid();
      });
      kenoContainer.appendChild(el);
    }
  }
  renderKenoGrid();

  document.getElementById('kenoPlay').addEventListener('click', () => {
    const bet = readInput('kenoBet', 5);
    if (bet <= 0) return toast('Enter bet > 0');
    if (getBal() < bet) return toast('Insufficient funds');
    if (kenoSelected.size === 0) return toast('Pick at least one number');
    adjustBal(-bet);
    // draw 10 numbers
    const pool = Array.from({length:KENO_MAX}, (_,i)=>i+1);
    for (let i = pool.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    const draws = pool.slice(0, 10);
    const hits = Array.from(kenoSelected).filter(n => draws.includes(n));
    // simple payout table (very simplified): payout = bet * hits.length * (1 + hits.length*0.5)
    const matches = hits.length;
    let payout = 0;
    if (matches > 0) payout = Math.round(bet * matches * (1 + matches*0.5));
    if (payout > 0) { adjustBal(payout); kenoResultEl.textContent = `Draws: ${draws.join(', ')} — Hits: ${hits.join(', ')} — Win ${format(payout)}`; toast(`Keno: ${matches} hits — won ${format(payout)}`); }
    else { kenoResultEl.textContent = `Draws: ${draws.join(', ')} — Hits: none`; toast(`Keno: no hits — lost ${format(bet)}`); }
  });

  // initial small UI state
  renderBal();
  // reset some dynamic displays
  document.getElementById('bjHit').disabled = true;
  document.getElementById('bjStand').disabled = true;
  document.getElementById('vpDraw').disabled = true;

  // small accessibility: pressing Enter on custom bet should fill into focused bet (nice to have)
  document.getElementById('customBet').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value;
      // try to populate currently visible inputs: slot, coin, bj, ru, vp, bac, craps, keno
      ['slotBet','coinBet','bjBet','ruBet','vpBet','bacBet','crapsBet','kenoBet'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });
      toast('Quick bet updated');
    }
  });

})();
