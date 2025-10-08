// === Basic Balance System ===
let balance = 1000;
const balanceEl = document.getElementById("balance");
const toast = document.getElementById("toast");

function updateBalance() {
  balanceEl.textContent = `$${balance}`;
}

document.getElementById("addMoney").onclick = () => {
  balance += 500;
  showToast("Added $500!");
  updateBalance();
};

document.getElementById("resetMoney").onclick = () => {
  balance = 1000;
  showToast("Balance reset to $1,000");
  updateBalance();
};

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}

// === Tab Navigation ===
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    document.querySelectorAll(".game").forEach((g) => g.classList.remove("visible"));
    document.getElementById(target).classList.add("visible");
  });
});

// === Slots ===
document.getElementById("spinBtn").onclick = () => {
  const bet = parseInt(document.getElementById("slotBet").value);
  if (bet > balance || bet <= 0) return showToast("Invalid bet");

  const symbols = ["🍒", "🍋", "🍇", "💎", "7️⃣"];
  const r1 = symbols[Math.floor(Math.random() * symbols.length)];
  const r2 = symbols[Math.floor(Math.random() * symbols.length)];
  const r3 = symbols[Math.floor(Math.random() * symbols.length)];

  document.getElementById("r1").textContent = r1;
  document.getElementById("r2").textContent = r2;
  document.getElementById("r3").textContent = r3;

  if (r1 === r2 && r2 === r3) {
    balance += bet * 10;
    showToast("🎉 JACKPOT! You win 10x!");
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    balance += bet * 2;
    showToast("Nice! You won double!");
  } else {
    balance -= bet;
    showToast("No luck this time!");
  }
  updateBalance();
};

// === Coin Flip ===
document.querySelectorAll(".flipBtn").forEach((btn) => {
  btn.onclick = () => {
    const bet = parseInt(document.getElementById("coinBet").value);
    if (bet > balance || bet <= 0) return showToast("Invalid bet");

    const userChoice = btn.dataset.choice;
    const flip = Math.random() < 0.5 ? "H" : "T";
    document.getElementById("coin").textContent = flip;

    if (flip === userChoice) {
      balance += bet;
      showToast("🪙 You won!");
    } else {
      balance -= bet;
      showToast("Lost the flip!");
    }
    updateBalance();
  };
});

// === Blackjack (Simplified) ===
document.getElementById("dealBtn").onclick = () => {
  const bet = parseInt(document.getElementById("bjBet").value);
  if (bet > balance || bet <= 0) return showToast("Invalid bet");

  const draw = () => Math.floor(Math.random() * 11) + 1;
  const player = draw() + draw();
  const dealer = draw() + draw();

  document.getElementById("bjPlayer").textContent = player;
  document.getElementById("bjDealer").textContent = dealer;

  if (player > 21) {
    balance -= bet;
    showToast("Bust! You lose!");
  } else if (player > dealer || dealer > 21) {
    balance += bet;
    showToast("You win!");
  } else {
    balance -= bet;
    showToast("Dealer wins!");
  }
  updateBalance();
};

// === Roulette (Simple) ===
document.getElementById("spinWheel").onclick = () => {
  const bet = parseInt(document.getElementById("ruBet").value);
  if (bet > balance || bet <= 0) return showToast("Invalid bet");

  const type = document.getElementById("ruType").value;
  const number = Math.floor(Math.random() * 37);
  const color = number === 0 ? "green" : number % 2 ? "red" : "black";

  let win = false;
  if (type === "red" && color === "red") win = true;
  if (type === "black" && color === "black") win = true;
  if (type === "number" && number === 7) win = true; // lucky 7 🎯

  if (win) {
    balance += bet * (type === "number" ? 35 : 2);
    showToast(`Roulette hit ${color} ${number}! You win!`);
  } else {
    balance -= bet;
    showToast(`Landed on ${color} ${number}. You lost.`);
  }
  updateBalance();
};

// === Poker (Fake random hand) ===
document.getElementById("dealPoker").onclick = () => {
  const bet = parseInt(document.getElementById("pokerBet").value);
  if (bet > balance || bet <= 0) return showToast("Invalid bet");

  const hands = [
    "Pair of Aces",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
    "Nothing special",
  ];
  const result = hands[Math.floor(Math.random() * hands.length)];

  document.getElementById("pokerHand").textContent = result;

  if (result.includes("Flush") || result.includes("Four") || result.includes("Full"))
    balance += bet * 5;
  else if (result.includes("Pair") || result.includes("Three"))
    balance += bet * 2;
  else balance -= bet;

  showToast(`You got a ${result}!`);
  updateBalance();
};
