// ===== CANVAS SETUP =====
const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ===== IMAGES =====
const images = [
  "../images/img1.jpg",
  "../images/img4.jpeg",
  "../images/img5.jpeg",
  "../images/img6.jpeg",
  "../images/img7.jpeg",
  "../images/img8.jpeg",
  "../images/img9.jpeg",
  "../images/img10.jpeg",
  "../images/img11.jpeg",
  "../images/img12.jpeg",
  "../images/img13.jpeg",
  "../images/img14.jpeg",
  "../images/img15.svg",
  "../images/img16.jpeg",
  "../images/img2.jpg",
  "../images/img3.jpg"
];

// ===== STARS =====
let stars = [];
const TOTAL_STARS = 150;
const SPECIAL_STAR_COUNT = 16;
const controlPanel = document.getElementById("controlPanel");

function createFallbackImageDataUri(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#27163d"/>
      <text x="50%" y="48%" text-anchor="middle" fill="#ffe39a" font-family="Segoe UI, Arial" font-size="62" font-weight="700">${label}</text>
      <text x="50%" y="58%" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial" font-size="28" opacity="0.9">Memory</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function isInsideControlZone(x, y) {
  const rect = controlPanel.getBoundingClientRect();
  const marginX = 36;
  const marginY = 20;
  return (
    x >= rect.left - marginX &&
    x <= rect.right + marginX &&
    y >= rect.top - marginY &&
    y <= rect.bottom + marginY
  );
}

const uniqueSpecialImages = [...images];
while (uniqueSpecialImages.length < SPECIAL_STAR_COUNT) {
  uniqueSpecialImages.push(
    createFallbackImageDataUri(`Memory ${uniqueSpecialImages.length + 1}`)
  );
}

for (let i = 0; i < TOTAL_STARS; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1.5,
    blink: Math.random(),
    special: false,
    img: images[Math.floor(Math.random() * images.length)]
  });
}

const candidateSpecialStarIndices = stars
  .map((star, index) => (isInsideControlZone(star.x, star.y) ? -1 : index))
  .filter(index => index !== -1);

const starIndices =
  candidateSpecialStarIndices.length >= SPECIAL_STAR_COUNT
    ? candidateSpecialStarIndices
    : [...Array(stars.length).keys()];

for (let i = starIndices.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [starIndices[i], starIndices[j]] = [starIndices[j], starIndices[i]];
}

for (let i = 0; i < SPECIAL_STAR_COUNT; i++) {
  const index = starIndices[i];
  const star = stars[index];
  star.special = true;
  star.size += 1.2;
  star.img = uniqueSpecialImages[i];
}

// ===== DRAW STARS =====
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    star.blink += 0.05;
    let opacity = 0.5 + Math.abs(Math.sin(star.blink)) * 0.5;

    ctx.beginPath();

    if (star.special) {
      ctx.fillStyle = `rgba(255, 225, 120, ${opacity})`;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255, 210, 80, 0.9)";
    } else {
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.shadowBlur = 0;
    }

    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(drawStars);
}

drawStars();

// ===== CLICKABLE STARS =====
canvas.addEventListener("click", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  stars.forEach(star => {
    const dist = Math.hypot(star.x - x, star.y - y);

    if (dist < 8 && star.special) {
      showImage(star.img);
    }
  });
});

// ===== CURSOR HOVER =====
canvas.addEventListener("mousemove", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  canvas.style.cursor = "default";

  stars.forEach(star => {
    const dist = Math.hypot(star.x - x, star.y - y);
    if (dist < 8 && star.special) {
      canvas.style.cursor = "pointer";
    }
  });
});

// ===== POPUP =====
const popup = document.getElementById("popup");
const popupImg = document.getElementById("popupImg");
const closeBtn = document.getElementById("close");

function showImage(src) {
  popup.classList.remove("hidden");
  popupImg.src = src;
}

closeBtn.onclick = () => popup.classList.add("hidden");
popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.classList.add("hidden");
  }
});

popupImg.addEventListener("error", () => {
  popupImg.removeAttribute("src");
  popupImg.setAttribute("alt", "Image not found. Check image paths.");
});

// ===== MUSIC SYSTEM =====
const audio = new Audio();

const songs = [
  { title: "Vizhi Veekura", file: "vizhi-veekura.mp3" },
  { title: "Dheema", file: "dheema.mp3" },
  { title: "Pavazha Malli", file: "pavazha-malli.mp3" },
  { title: "Pattuma", file: "pattuma.mp3" },
  { title: "Mutta Kalakki", file: "mutta-kalakki.mp3" }
];

let currentSong = 0;
const nowPlayingLabel = document.getElementById("nowPlaying");
const startBtn = document.getElementById("startBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

function updateNowPlaying() {
  nowPlayingLabel.textContent = `Now playing: ${songs[currentSong].title}`;
}

async function tryPlayFromPaths(paths) {
  for (const path of paths) {
    const played = await new Promise((resolve) => {
      const onCanPlay = () => {
        cleanup();
        audio.play().then(() => resolve(true)).catch(() => resolve(false));
      };
      const onError = () => {
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        audio.removeEventListener("canplay", onCanPlay);
        audio.removeEventListener("error", onError);
      };

      audio.addEventListener("canplay", onCanPlay, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.src = path;
      audio.load();
    });

    if (played) {
      return true;
    }
  }

  return false;
}

async function playSong() {
  updateNowPlaying();
  const song = songs[currentSong];
  const played = await tryPlayFromPaths([
    `music/${song.file}`,
    `../music/${song.file}`
  ]);

  if (!played) {
    nowPlayingLabel.textContent = "Now playing: Song file missing or blocked";
    startBtn.textContent = "Play me";
    startBtn.disabled = false;
  }
}

function shufflePlaylist(playImmediately = true) {
  for (let i = songs.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [songs[i], songs[j]] = [songs[j], songs[i]];
  }
  currentSong = 0;
  if (playImmediately) {
    playSong();
  } else {
    updateNowPlaying();
  }
}

shuffleBtn.addEventListener("click", () => {
  shufflePlaylist(true);
  startBtn.textContent = "Playing";
  startBtn.disabled = true;
});

// Next song on end
audio.addEventListener("ended", () => {
  currentSong++;

  if (currentSong >= songs.length) {
    currentSong = 0;
    shufflePlaylist(false);
  }

  playSong();
});

startBtn.addEventListener("click", () => {
  currentSong = 0;
  playSong();
  startBtn.textContent = "Playing";
  startBtn.disabled = true;
});
