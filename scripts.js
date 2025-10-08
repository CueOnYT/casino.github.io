/* Cuemo's Casino - scripts.js
   - Theme saved in localStorage ("cuemo_theme": "dark"|"light")
   - Balance saved in localStorage ("cuemo_balance")
   - Multiple simple game implementations (simplified rules)
*/

/* -------------------------
   Utilities / State
   ------------------------- */
const LS_THEME = 'cuemo_theme_v1';
const LS_BAL = 'cuemo_balance_v1';

const toastEl = document.getElementById('toast');
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(()=> toastEl.classList.remove('show'), 2400);
}
function format(n){ return '$' + Number(n).toLocaleString(); }

function readLSBalance(){ return Number(localStorage.getItem(LS_BAL) ?? 1000); }
function saveLSBalance(v){ localStorage.setItem(LS_BAL, Math.max(0, Math.round(v))); renderBalance(); }
function adjustBal(delta){ saveLSBalance(readLSBalance()+delta); }
function renderBalance(){ document.getElementById('balance').textContent = format(readLSBalance()); }

/* -------------------------
   Theme toggle (remember choice)
   ------------------------- */
const body = document.body;
const themeToggle = document.getElementById('themeToggle');

function applyThemeFromStorage(){
  const t = localStorage.getItem(LS_THEME) || 'light';
  if (t === 'dark') body.classList.add('dark');
  else body.classList.remove('dark');
  themeToggle.textContent = (t === 'dark') ? 'Cherry Mode' : 'Night Mode';
}
themeToggle.addEventListener('click', ()=>{
  const nowDark = body.classList.toggle('dark');
  localStorage.setItem(LS_THEME, nowDark ? 'dark' : 'light');
  themeToggle.textContent = nowDark ? 'Cherry Mode' : 'Night Mode';
});
applyThemeFromStorage();

/* -------------------------
   Initialize balance UI & quick actions
   ------------------------- */
if (localStorage.getItem(LS_BAL) === null) localStorage.setItem(LS_BAL, 1000);
renderBalance();

document.getElementById('addMoney').addEventListener('click', ()=>{ adjustBal(500); toast('Added $500 (fake)'); });
document.getElementById('resetMoney').addEventListener('click', ()=>{
  if (confirm('Reset fake balance to $1,000?')){ localStorage.setItem(LS_BAL, 1000); renderBalance(); toast('Balance reset'); }
});

/* -------------------------
   Tabs navigation (animated)
   ------------------------- */
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    const name = btn.dataset.tab;
    document.querySelectorAll('.panel').forEach(panel=>{
      if (panel.id === name){
        panel.classList.add('visible');
        panel.style.opacity = 0;
        panel.style.transform = 'translateY(6px)';
        requestAnimationFrame(()=>{ panel.style.opacity = 1; panel.style.transform = 'translateY(0)'; });
      } else {
        panel.classList.remove('visible');
      }
    });
  });
});

/* -------------------------
   Tiny helper: read numeric input
   ------------------------- */
function readInput(id, fallback=0){
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = Number(el.value);
  return isNaN(v) ? fallback : Math.max(0, Math.round(v));
}

/* =========================
   SLOTS
   ========================= */
const slotSymbols = ['🍒','🍋','🍊','🍉','⭐','🔔','7️⃣'];
function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

document.getElementById('spinBtn').addEventListener('click', async ()=>{
  const bet = readInput('slotBet', 10);
  if (bet <= 0) return toast('Enter a bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  adjustBal(-bet);

  const r1 = document.getElementById('slot-r1'),
        r2 = document.getElementById('slot-r2'),
        r3 = document.getElementById('slot-r3');
  // spin animation
  [r1,r2,r3].forEach(el=>el.classList.add('spin'));
  for (let i=0;i<12;i++){
    r1.textContent = randChoice(slotSymbols);
    r2.textContent = randChoice(slotSymbols);
    r3.textContent = randChoice(slotSymbols);
    await new Promise(r=>setTimeout(r, 60 + i*10));
  }
  [r1,r2,r3].forEach(el=>el.classList.remove('spin'));

  const a=r1.textContent,b=r2.textContent,c=r3.textContent;
  let multiplier = 0;
  if (a===b && b===c) multiplier = 10;
  else if (a===b || b===c || a===c) multiplier = 3;
  if (a==='7️⃣' && b==='7️⃣' && c==='7️⃣') multiplier = 25;
  const win = Math.round(bet * multiplier);
  if (win>0){ adjustBal(win); toast(`You won ${format(win)} (${multiplier}×)`); } 
  else toast(`No win — lost ${format(bet)}`);
});

/* =========================
   COIN FLIP
   ========================= */
let coinChoice = 'H';
document.querySelectorAll('.flipBtn').forEach(b=>{
  b.addEventListener('click', async ()=>{
    const bet = readInput('coinBet', 10);
    if (bet<=0) return toast('Enter bet > 0');
    if (readLSBalance() < bet) return toast('Insufficient funds');
    adjustBal(-bet);

    // animate coin
    const face = document.getElementById('coinFace');
    face.classList.add('flip');
    await new Promise(r=>setTimeout(r, 700));
    face.classList.remove('flip');

    const result = Math.random() < 0.5 ? 'H' : 'T';
    face.textContent = result;
    if (result === b.dataset.choice){ adjustBal(bet*2); toast(`You guessed right - won ${format(bet*2)}`); }
    else toast(`Wrong — lost ${format(bet)}`);
  });
});

/* =========================
   BLACKJACK (simplified)
   ========================= */
function newDeck(){
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = [];
  for (let s of suits) for (let r of ranks) deck.push(r + s);
  // shuffle
  for (let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  return deck;
}
function value(card){
  const r = card.slice(0,-1);
  if (r==='A') return 11;
  if (['J','Q','K'].includes(r)) return 10;
  return Number(r);
}
function handValue(hand){
  let total = hand.reduce((s,c)=>s+value(c),0);
  let aces = hand.filter(c=>c.startsWith('A')).length;
  while (total>21 && aces>0){ total -= 10; aces--; }
  return total;
}
let bjState = null;
document.getElementById('bjDeal').addEventListener('click', ()=>{
  const bet = readInput('bjBet', 20);
  if (bet <= 0) return toast('Enter a bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  adjustBal(-bet);

  const deck = newDeck();
  const player = [deck.pop(), deck.pop()];
  const dealer = [deck.pop(), deck.pop()];
  bjState = {deck, player, dealer, bet, settled:false};
  document.getElementById('bjPlayer').textContent = player.join(' ');
  document.getElementById('bjDealer').textContent = dealer[0] + ' [hidden]';
  document.getElementById('bjHit').disabled = false;
  document.getElementById('bjStand').disabled = false;
  document.getElementById('bjDeal').disabled = true;
  toast('Hit or Stand?');
});
document.getElementById('bjHit').addEventListener('click', ()=>{
  if (!bjState) return;
  bjState.player.push(bjState.deck.pop());
  document.getElementById('bjPlayer').textContent = bjState.player.join(' ');
  if (handValue(bjState.player) > 21) resolveBJ();
});
document.getElementById('bjStand').addEventListener('click', resolveBJ);

function resolveBJ(){
  if (!bjState || bjState.settled) return;
  while (handValue(bjState.dealer) < 17) bjState.dealer.push(bjState.deck.pop());
  const pv = handValue(bjState.player), dv = handValue(bjState.dealer);
  document.getElementById('bjPlayer').textContent = bjState.player.join(' ') + ` (${pv})`;
  document.getElementById('bjDealer').textContent = bjState.dealer.join(' ') + ` (${dv})`;

  let payout = 0;
  if (pv > 21) { toast(`Bust — lost ${format(bjState.bet)}`); }
  else if (dv > 21 || pv > dv) { payout = bjState.bet * 2; toast(`You win ${format(payout)}`); }
  else if (pv === dv) { payout = bjState.bet; toast(`Push — bet returned ${format(bjState.bet)}`); }
  else toast(`Dealer wins — lost ${format(bjState.bet)}`);

  if (payout) adjustBal(payout);
  bjState.settled = true;
  document.getElementById('bjHit').disabled = true;
  document.getElementById('bjStand').disabled = true;
  document.getElementById('bjDeal').disabled = false;
}

/* =========================
   VIDEO POKER (5-card draw)
   ========================= */
function vpDeckFactory(){
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const suits = ['♠','♥','♦','♣'];
  const d = [];
  for (let r of ranks) for (let s of suits) d.push({r,s});
  for (let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function vpRank(hand){
  const order = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
  const counts = {}; hand.forEach(c=>counts[c.r]=(counts[c.r]||0)+1);
  const vals = Object.values(counts).sort((a,b)=>b-a);
  const suits = new Set(hand.map(c=>c.s));
  const isFlush = suits.size === 1;
  const sorted = hand.map(c=>order[c.r]).sort((a,b)=>a-b);
  let isStraight = true;
  for (let i=1;i<sorted.length;i++) if (sorted[i] !== sorted[i-1]+1) isStraight=false;
  if (!isStraight){
    const alt = sorted.map(v=>v===14?1:v).sort((a,b)=>a-b);
    let altStraight=true; for (let i=1;i<alt.length;i++) if (alt[i] !== alt[i-1]+1) altStraight=false;
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
function renderVPCards(){
  const el = document.getElementById('vpCards'); el.innerHTML = '';
  if (!vpState) { el.textContent = '—'; return; }
  vpState.hand.forEach((c,i)=>{
    const d = document.createElement('div');
    d.className = 'vp-card' + (vpState.hold[i] ? ' held' : '');
    d.textContent = c.r + c.s;
    d.addEventListener('click', ()=>{ if (!vpState.drew){ vpState.hold[i]=!vpState.hold[i]; renderVPCards(); } });
    el.appendChild(d);
  });
}

document.getElementById('vpDeal').addEventListener('click', ()=>{
  const bet = readInput('vpBet', 10);
  if (bet<=0) return toast('Enter bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  adjustBal(-bet);
  const d = vpDeckFactory();
  const hand = [d.pop(), d.pop(), d.pop(), d.pop(), d.pop()];
  vpState = {deck:d, hand, hold:[false,false,false,false,false], bet, drew:false};
  renderVPCards();
  document.getElementById('vpDraw').disabled = false;
});
document.getElementById('vpDraw').addEventListener('click', ()=>{
  if (!vpState) return;
  for (let i=0;i<5;i++) if (!vpState.hold[i]) vpState.hand[i] = vpState.deck.pop();
  vpState.drew = true; renderVPCards();
  const res = vpRank(vpState.hand);
  const payout = Math.round(vpState.bet * res.mult);
  if (payout>0){ adjustBal(payout); toast(`${res.name} — you won ${format(payout)}`); } else toast(`No win (${res.name})`);
  document.getElementById('vpDraw').disabled = true;
  setTimeout(()=>{ vpState=null; renderVPCards(); }, 900);
});

/* =========================
   ROULETTE
   ========================= */
const redSet = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
document.getElementById('ruSpin').addEventListener('click', ()=>{
  const type = document.getElementById('ruType').value;
  const choice = document.getElementById('ruChoice').value.trim().toLowerCase();
  const bet = readInput('ruBet', 10);
  if (bet<=0) return toast('Enter bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  adjustBal(-bet);

  const resultNum = Math.floor(Math.random()*37);
  const color = resultNum === 0 ? 'green' : (redSet.has(resultNum) ? 'red' : 'black');
  let win = 0, message = `${resultNum} ${color}`;

  if (type === 'number'){
    if (String(resultNum) === choice) win = bet * 36;
  } else if (type === 'color'){
    if ((choice === 'red' && color==='red') || (choice === 'black' && color==='black')) win = bet * 2;
  } else if (type === 'parity'){
    if (resultNum === 0) win = 0;
    else if (choice === 'even' && resultNum % 2 === 0) win = bet * 2;
    else if (choice === 'odd' && resultNum % 2 === 1) win = bet * 2;
  }
  if (win){ adjustBal(win); toast(`Result: ${message} — you won ${format(win)}`); }
  else toast(`Result: ${message} — lost ${format(bet)}`);
  document.getElementById('ruResult').textContent = `Result: ${message}`;
});

/* =========================
   MINESWEEPER
   ========================= */
const msBoardEl = document.getElementById('ms-board');
const msStatus = document.getElementById('ms-status');
let msState = null;

function msNewGame(){
  const diff = document.getElementById('ms-diff').value;
  let rows, cols, mines;
  if (diff === 'easy'){ rows=6; cols=6; mines=6; }
  else if (diff === 'med'){ rows=8; cols=8; mines=12; }
  else { rows=10; cols=10; mines=20; }
  // create grid
  const total = rows*cols;
  const arr = Array(total).fill(0);
  // place mines
  let placed = 0;
  while (placed < mines){
    const idx = Math.floor(Math.random()*total);
    if (arr[idx] !== 'M'){ arr[idx] = 'M'; placed++; }
  }
  // compute neighbor counts
  const grid = [];
  for (let r=0;r<rows;r++){
    const row = [];
    for (let c=0;c<cols;c++){
      const i = r*cols + c;
      if (arr[i] === 'M'){ row.push({mine:true,adj:0, revealed:false, flagged:false}); continue;}
      // count neighbors
      let cnt = 0;
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++){
        if (dr===0 && dc===0) continue;
        const rr = r+dr, cc=c+dc;
        if (rr<0||rr>=rows||cc<0||cc>=cols) continue;
        const ii = rr*cols + cc;
        if (arr[ii] === 'M') cnt++;
      }
      row.push({mine:false,adj:cnt,revealed:false,flagged:false});
    }
    grid.push(row);
  }
  msState = { rows, cols, mines, grid, started:false, over:false, flags:0 };
  renderMS();
  msStatus.textContent = `Mines: ${mines} • Flags: 0`;
}
function renderMS(){
  msBoardEl.innerHTML = '';
  if (!msState) return;
  msBoardEl.style.gridTemplateColumns = `repeat(${msState.cols}, 36px)`;
  for (let r=0;r<msState.rows;r++){
    for (let c=0;c<msState.cols;c++){
      const cell = msState.grid[r][c];
      const el = document.createElement('div');
      el.className = 'ms-cell';
      if (cell.revealed){
        if (cell.mine) el.textContent = '💣';
        else if (cell.adj > 0) el.textContent = cell.adj;
        else el.textContent = '';
        el.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))';
        el.style.cursor = 'default';
      } else {
        el.addEventListener('click', ()=> msReveal(r,c));
        el.addEventListener('contextmenu', (e)=>{ e.preventDefault(); msFlag(r,c); });
        el.addEventListener('touchend', (e)=>{ /* simple long-press alternative not implemented for short code */ }, {passive:true});
        if (cell.flagged){ el.classList.add('flag'); el.textContent = '⚑'; }
      }
      msBoardEl.appendChild(el);
    }
  }
}
function msReveal(r,c){
  if (!msState || msState.over) return;
  const cell = msState.grid[r][c];
  if (cell.flagged || cell.revealed) return;
  cell.revealed = true;
  if (cell.mine){
    msState.over = true;
    revealAllMines();
    msStatus.textContent = 'BOOM! You hit a mine — game over.';
    toast('BOOM — you lost the minesweeper round');
    return;
  }
  // if zero-adj, flood fill neighbors
  if (cell.adj === 0){
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++){
      const rr=r+dr, cc=c+dc;
      if (rr<0||rr>=msState.rows||cc<0||cc>=msState.cols) continue;
      if (!msState.grid[rr][cc].revealed) msReveal(rr,cc);
    }
  }
  renderMS();
  checkMSWin();
}
function msFlag(r,c){
  if (!msState || msState.over) return;
  const cell = msState.grid[r][c];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  msState.flags += cell.flagged ? 1 : -1;
  renderMS();
  msStatus.textContent = `Mines: ${msState.mines} • Flags: ${msState.flags}`;
  checkMSWin();
}
function revealAllMines(){
  for (let r=0;r<msState.rows;r++) for (let c=0;c<msState.cols;c++){
    if (msState.grid[r][c].mine) msState.grid[r][c].revealed = true;
  }
  renderMS();
}
function checkMSWin(){
  let ok = true;
  for (let r=0;r<msState.rows;r++) for (let c=0;c<msState.cols;c++){
    const cell = msState.grid[r][c];
    if (!cell.mine && !cell.revealed) ok = false;
  }
  if (ok){
    msState.over = true;
    msStatus.textContent = 'Congratulations — board cleared!';
    toast('You cleared the board! Nice job');
    adjustBal(100); // small reward for win
  }
}
document.getElementById('ms-new').addEventListener('click', msNewGame);
msNewGame(); // start on load

/* =========================
   KENO (1..40)
   ========================= */
const kenoContainer = document.getElementById('kenoPick');
const KENO_MAX = 40;
let kenoSelected = new Set();
function renderKenoGrid(){
  kenoContainer.innerHTML = '';
  for (let i=1;i<=KENO_MAX;i++){
    const el = document.createElement('div');
    el.className = 'keno-num' + (kenoSelected.has(i)?' active':'');
    el.textContent = i;
    el.addEventListener('click', ()=>{
      if (kenoSelected.has(i)) kenoSelected.delete(i);
      else if (kenoSelected.size < 10) kenoSelected.add(i);
      else { toast('Max 10 numbers'); return; }
      renderKenoGrid();
    });
    kenoContainer.appendChild(el);
  }
}
renderKenoGrid();

document.getElementById('kenoPlay').addEventListener('click', ()=>{
  const bet = readInput('kenoBet', 5);
  if (bet<=0) return toast('Enter bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  if (kenoSelected.size === 0) return toast('Pick at least one number');
  adjustBal(-bet);
  const pool = Array.from({length:KENO_MAX}, (_,i)=>i+1);
  for (let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  const draws = pool.slice(0,10);
  const hits = Array.from(kenoSelected).filter(n=>draws.includes(n));
  const matches = hits.length;
  let payout = 0;
  if (matches > 0) payout = Math.round(bet * matches * (1 + matches*0.5));
  if (payout > 0){ adjustBal(payout); document.getElementById('kenoResult').textContent = `Draws: ${draws.join(', ')} — Hits: ${hits.join(', ')} — Win ${format(payout)}`; toast(`Keno: ${matches} hits — won ${format(payout)}`); }
  else { document.getElementById('kenoResult').textContent = `Draws: ${draws.join(', ')} — Hits: none`; toast(`Keno: no hits — lost ${format(bet)}`); }
});

/* =========================
   CRAPS (simplified)
   ========================= */
let crapsPoint = null;
document.getElementById('crapsRoll').addEventListener('click', ()=>{
  const bet = readInput('crapsBet', 10);
  if (bet<=0) return toast('Enter bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  const d1 = 1 + Math.floor(Math.random()*6);
  const d2 = 1 + Math.floor(Math.random()*6);
  const total = d1 + d2;
  document.getElementById('crapsDice').textContent = `${d1} + ${d2} = ${total}`;
  if (!crapsPoint){
    if (total === 7 || total === 11){ adjustBal(bet*2); toast(`Natural ${total}! You win ${format(bet*2)}`); }
    else if ([2,3,12].includes(total)){ toast(`Craps ${total} — you lose ${format(bet)}`); }
    else { crapsPoint = total; document.getElementById('crapsState').textContent = `Point: ${crapsPoint}`; toast(`Point established: ${crapsPoint}`); }
  } else {
    if (total === crapsPoint){ adjustBal(bet*2); toast(`Made point ${total}! You win ${format(bet*2)}`); crapsPoint = null; document.getElementById('crapsState').textContent='Point: —'; }
    else if (total === 7){ toast(`Seven out — you lose ${format(bet)} and point cleared`); crapsPoint = null; document.getElementById('crapsState').textContent='Point: —'; }
    else { toast(`Rolled ${total}. Keep trying for point ${crapsPoint}`); }
  }
});

/* =========================
   BACCARAT (very simplified 2-card)
   ========================= */
function drawCardValueBaccarat(){
  const r = Math.floor(Math.random()*13);
  if (r === 0) return {r:'A',v:1};
  if (r >= 9) return {r:['10','J','Q','K'][r-9], v:0};
  return {r:String(r+1), v: r+1};
}
document.getElementById('bacBtn').addEventListener('click', ()=>{
  const bet = readInput('bacBet', 20);
  if (bet<=0) return toast('Enter bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  adjustBal(-bet);

  const p = [drawCardValueBaccarat(), drawCardValueBaccarat()];
  const b = [drawCardValueBaccarat(), drawCardValueBaccarat()];
  const pt = (p[0].v + p[1].v) % 10;
  const bt = (b[0].v + b[1].v) % 10;
  document.getElementById('bacResult').textContent = `Player ${p.map(x=>x.r).join(' ')} (${pt}) — Banker ${b.map(x=>x.r).join(' ')} (${bt})`;
  const choice = document.getElementById('bacChoice').value;
  let payout = 0;
  if ((choice==='player' && pt>bt) || (choice==='banker' && bt>pt) || (choice==='tie' && pt===bt)){
    if (choice==='player' && pt>bt) payout = bet * 2;
    if (choice==='banker' && bt>pt) payout = Math.round(bet * 1.95);
    if (choice==='tie' && pt===bt) payout = bet * 8;
    adjustBal(payout); toast(`Result — you won ${format(payout)}`);
  } else toast(`Result — you lost ${format(bet)}`);
});

/* =========================
   DICE DUEL
   ========================= */
document.getElementById('diceRoll').addEventListener('click', ()=>{
  const bet = readInput('diceBet', 10);
  if (bet<=0) return toast('Enter bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  adjustBal(-bet);
  const you = 1 + Math.floor(Math.random()*6);
  const cpu = 1 + Math.floor(Math.random()*6);
  document.getElementById('diceResult').textContent = `You: ${you} — CPU: ${cpu}`;
  if (you > cpu){ adjustBal(bet*2); toast(`You win ${format(bet*2)}!`); }
  else if (you === cpu){ adjustBal(bet); toast('Tie — bet returned'); }
  else toast(`You lost ${format(bet)}.`);
});

/* =========================
   WAR
   ========================= */
function drawCardSimple(){
  const vals = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const v = vals[Math.floor(Math.random()*vals.length)];
  const map = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
  return {label:v, val:map[v]};
}
document.getElementById('warPlay').addEventListener('click', ()=>{
  const bet = readInput('warBet', 10);
  if (bet<=0) return toast('Enter bet > 0');
  if (readLSBalance() < bet) return toast('Insufficient funds');
  adjustBal(-bet);
  let player = drawCardSimple(), cpu = drawCardSimple();
  while (player.val === cpu.val){
    // war — draw again quickly (simplified)
    player = drawCardSimple(); cpu = drawCardSimple();
  }
  document.getElementById('warResult').textContent = `You: ${player.label} — CPU: ${cpu.label}`;
  if (player.val > cpu.val){ adjustBal(bet*2); toast(`You win ${format(bet*2)}!`); }
  else toast(`You lost ${format(bet)}.`);
});

/* =========================
   Misc: render initial UI state
   ========================= */
renderBalance();

/* end of file */
