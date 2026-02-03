// ======================
// CONFIG
// ======================
const TARGET_ID = "bougain";
const MESSAGE_SECONDS = 15;

// plus grand = plus rare (ex: 7 => ~1 bougain pour 7 spawns)
const BOUGAIN_RARITY = 7;

// --- FLOWERS ---
// ✅ colle ici ton tableau FLOWERS (celui que je t’ai donné au-dessus)
 // (NE RIEN METTRE ICI, tu colles le tableau FLOWERS ici à la place de ce commentaire)


// ======================
// STATE
// ======================
const field = document.getElementById("field");
const overlay = document.getElementById("overlay");
const proposal = document.getElementById("proposal");
const gift = document.getElementById("gift");
const burst = document.getElementById("burst");

const overlayFlower = document.getElementById("overlayFlower");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const countdownEl = document.getElementById("countdown");

const btnYesWith = document.getElementById("btnYesWith");
const btnYesWithout = document.getElementById("btnYesWithout");

const loveTimerEl = document.getElementById("loveTimer");
let proposalStart = null;
let proposalInterval = null;

const giftBtn = document.getElementById("giftBtn");
let openProgress = 0;
let giftOpened = false;

let overlayTimer = null;
let countdownTimer = null;
let isLocked = false;

// ======================
// HELPERS
// ======================
function rand(min, max){ return Math.random() * (max - min) + min; }

function clearTimers(){
  if (overlayTimer) clearTimeout(overlayTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  overlayTimer = null;
  countdownTimer = null;
}

function hideAllScreens(){
  overlay.classList.add("hidden");
  proposal.classList.add("hidden");
  gift.classList.add("hidden");
  burst.classList.add("hidden");
}

function resetToHome(){
  clearTimers();
  stopProposalTimer();
  hideAllScreens();
  isLocked = false;
}

function formatTime(sec){
  if (sec < 60) return `${sec} seconde${sec>1?"s":""}`;
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m} minute${m>1?"s":""} ${s} seconde${s>1?"s":""}`;
}

function startProposalTimer(){
  proposalStart = Date.now();
  stopProposalTimer();

  const tick = () => {
    const sec = Math.floor((Date.now() - proposalStart)/1000);
    loveTimerEl.textContent = `${formatTime(sec)} avant d’accepter mon amour ?`;
  };

  tick();
  proposalInterval = setInterval(tick, 1000);
}

function stopProposalTimer(){
  if (proposalInterval) clearInterval(proposalInterval);
  proposalInterval = null;
}

// ======================
// FLOWERS GENERATION (rarity + drift everywhere)
// ======================
const BOUGAIN = FLOWERS.find(f => f.id === TARGET_ID);

function pickFlowerForSpawn(){
  // bougain rare
  const roll = Math.floor(rand(1, BOUGAIN_RARITY + 1)); // 1..rarity
  if (roll === 1 && BOUGAIN) return BOUGAIN;

  // autres fleurs
  const others = FLOWERS.filter(f => f.id !== TARGET_ID);
  return others[Math.floor(Math.random() * others.length)];
}

function spawnFloatingFlower(flower){
  const el = document.createElement("button");
  el.className = "flower";
  el.type = "button";
  el.setAttribute("aria-label", flower.label);

  // image
  const img = document.createElement("img");
  img.src = flower.img;
  img.alt = flower.label;
  img.draggable = false;
  img.className = "flowerImg";
  el.appendChild(img);

  // glow sur bougainvillier
  if (flower.id === TARGET_ID) el.classList.add("bougainGlow");

  // position départ
  el.style.left = `${rand(8, 92)}%`;
  el.style.top  = `${rand(10, 92)}%`;

  // trajectoires
  el.style.setProperty("--dx1", `${rand(-20, 20)}vw`);
  el.style.setProperty("--dy1", `${rand(-25, 25)}vh`);
  el.style.setProperty("--dx2", `${rand(-30, 30)}vw`);
  el.style.setProperty("--dy2", `${rand(-35, 35)}vh`);

  const duration = rand(7, 13); // secondes
  const delay = rand(0, 1.2);
  el.style.animation = `drift ${duration}s ease-in-out ${delay}s infinite alternate`;

  el.addEventListener("click", () => onFlowerClick(flower));
  field.appendChild(el);
}

function buildField(){
  field.innerHTML = "";
  const copies = 14;
  for (let i=0; i<copies; i++){
    spawnFloatingFlower(pickFlowerForSpawn());
  }
}

// ======================
// INTERACTIONS
// ======================
function showOverlay(flower, onDone){
  isLocked = true;
  hideAllScreens();

  // image dans l’overlay
  overlayFlower.innerHTML = "";
  const big = document.createElement("img");
  big.src = flower.img;
  big.alt = flower.label;
  big.className = "overlayImg";
  big.draggable = false;
  overlayFlower.appendChild(big);

  overlayTitle.textContent = `C'est ${flower.label}.`;
  overlayText.textContent = flower.message;

  overlay.classList.remove("hidden");

  let remaining = MESSAGE_SECONDS;
  countdownEl.textContent = remaining;

  clearTimers();

  countdownTimer = setInterval(() => {
    remaining -= 1;
    countdownEl.textContent = Math.max(0, remaining);
    if (remaining <= 0) clearTimers();
  }, 1000);

  overlayTimer = setTimeout(() => {
    clearTimers();
    overlay.classList.add("hidden");
    if (typeof onDone === "function") onDone();
  }, MESSAGE_SECONDS * 1000);
}

function onFlowerClick(flower){
  if (isLocked) return;

  const isTarget = (flower.id === TARGET_ID);

  if (!isTarget){
    showOverlay(flower, () => {
      resetToHome();
      buildField();
    });
    return;
  }

  // bougain
  showOverlay(flower, () => {
    proposal.classList.remove("hidden");
    startProposalTimer();
    isLocked = false;
  });
}

// ======================
// GIFT SEQUENCE
// ======================
function playGiftSequence(includeBougain){
  isLocked = true;
  hideAllScreens();
  stopProposalTimer();

  // attente 5s après choix
  setTimeout(() => {
    gift.classList.remove("hidden");
    setupTapToOpenGift(includeBougain);
    isLocked = false;
  }, 5000);
}

function setupTapToOpenGift(includeBougain){
  openProgress = 0;
  giftOpened = false;

  giftBtn.style.setProperty("--lid-rot", "0deg");
  giftBtn.style.setProperty("--lid-up", "0px");
  giftBtn.style.animation = "none";

  // on évite d’empiler les listeners
  const newBtn = giftBtn.cloneNode(true);
  giftBtn.parentNode.replaceChild(newBtn, giftBtn);

  newBtn.addEventListener("click", () => {
    if (giftOpened) return;

    openProgress = Math.min(1, openProgress + 0.18);
    newBtn.style.setProperty("--lid-rot", `${-35 * openProgress}deg`);
    newBtn.style.setProperty("--lid-up", `${-8 * openProgress}px`);

    if (openProgress >= 1){
      giftOpened = true;
      newBtn.style.animation = "inflate 900ms ease-in-out forwards";

      setTimeout(() => {
        gift.classList.add("hidden");
        burst.classList.remove("hidden");
        launchBurst(includeBougain);

        setTimeout(() => {
          resetToHome();
          buildField();
        }, 2800);
      }, 950);
    }
  });
}

// ======================
// EXPLOSION
// ======================
function launchBurst(includeBougain){
  burst.innerHTML = "";

  const base = ["💖","✨","💐"];
  if (includeBougain) base.push("🌸");

  const petalsCount = 40;

  for (let i=0; i<petalsCount; i++){
    const p = document.createElement("div");
    p.className = "petal";
    p.textContent = base[Math.floor(Math.random() * base.length)];

    p.style.left = `${50 + rand(-6, 6)}%`;
    p.style.top  = `${55 + rand(-6, 6)}%`;

    p.style.setProperty("--dx", `${rand(-45, 45)}vw`);
    p.style.setProperty("--dy", `${rand(-55, 35)}vh`);
    p.style.setProperty("--rot", `${rand(-180, 180)}deg`);

    const dur = rand(2200, 3400);
    const delay = rand(0, 140);
    p.style.animation = `burstFly ${dur}ms ease-out ${delay}ms forwards`;

    burst.appendChild(p);
  }
}

// ======================
// BUTTONS
// ======================
btnYesWith.addEventListener("click", () => playGiftSequence(true));
btnYesWithout.addEventListener("click", () => playGiftSequence(false));

// ======================
// INIT
// ======================
buildField();