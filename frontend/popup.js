const removeWebgazerDebug = () => {
  const video = document.getElementById('webgazerVideoFeed');
  if (video) video.remove();

  const overlay = document.getElementById('webgazerFaceOverlay');
  if (overlay) overlay.remove();

  const faceFeedback = document.getElementById('webgazerFaceFeedbackBox');
  if (faceFeedback) faceFeedback.remove();
};

const interval = setInterval(removeWebgazerDebug, 100);
setTimeout(() => clearInterval(interval), 5000);

window.onload = () => {
  webgazer.setRegression('ridge')
    .setTracker('clmtrackr')
    .begin();
};

window.alert = (msg) => {
  if (typeof msg === "string" && msg.includes("WebGazer works only over https")) {
    return;
  }
  console.log("Alert suppressed:", msg);
};

document.addEventListener("DOMContentLoaded", function () {
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const feedbackBox = document.getElementById("feedbackBox");
  const blurOverlay = document.getElementById("blurOverlay");
  const calibrateBtn = document.getElementById("calibrateBtn");
  const toggle = document.querySelector(".toggle-switch-popup");

  console.log("Screen size:", window.screen.width, window.screen.height);
  console.log("Viewport size:", window.innerWidth, window.innerHeight);

  let calibrationInProgress = false;
  let currentCalibrationPoint = null;

  // UNIFIED: Single array to store ALL gaze data from all games
  let allGamesGazeLog = [];

  function showGameIntro(gameName, storyLines, gameIconEmoji) {
    return new Promise((resolve) => {
      let introOverlay = document.createElement("div");
      Object.assign(introOverlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "#00000011",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "30000",
        opacity: "0",
        transition: "opacity 0.5s ease"
      });
      document.body.appendChild(introOverlay);
      
      setTimeout(() => introOverlay.style.opacity = "1", 10);

      let gameIcon = document.createElement("div");
      gameIcon.textContent = gameIconEmoji;
      Object.assign(gameIcon.style, {
        fontSize: "120px",
        marginBottom: "20px",
        animation: "pulse 2s ease-in-out infinite"
      });
      introOverlay.appendChild(gameIcon);

      if (!document.getElementById("pulseAnimation")) {
        const style = document.createElement("style");
        style.id = "pulseAnimation";
        style.textContent = `
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `;
        document.head.appendChild(style);
      }

      let gameTitle = document.createElement("div");
      gameTitle.textContent = gameName;
      Object.assign(gameTitle.style, {
        fontSize: "48px",
        color: "white",
        fontWeight: "bold",
        marginBottom: "40px",
        textAlign: "center",
        textShadow: "0 0 20px rgba(255,215,0,0.5)"
      });
      introOverlay.appendChild(gameTitle);

      let storyContainer = document.createElement("div");
      Object.assign(storyContainer.style, {
        maxWidth: "900px",
        width: "90%",
        // padding: "60px 80px",
        textAlign: "center",
        marginBottom: "50px",
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        minHeight: "300px",
        color: "#2C1810",
        fontWeight: "600", 
        fontSize: "1.1rem",
        lineHeight: "1.6",
        textShadow: "0 1px 2px rgba(255,255,255,0.3)",
        fontFamily: "'Poppins', sans-serif",
        letterSpacing: "0.5px",
        backgroundImage: "url('scroll-6.jpeg')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "transparent",
        position: "relative"
      });
      introOverlay.appendChild(storyContainer);



      const arcadeFont = document.createElement("link");
      arcadeFont.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      arcadeFont.rel = "stylesheet";
      document.head.appendChild(arcadeFont);

      let playButton = document.createElement("button");
      playButton.textContent = "PLAY";
      Object.assign(playButton.style, {
        padding: "20px 60px",
        fontSize: "20px",
        fontFamily: "'Press Start 2P', cursive",
        fontWeight: "bold",
        letterSpacing: "2px",
        background: "#7D8D86",
        color: "#000",
        cursor: "pointer",
        transition: "all 0.3s ease",
        opacity: "0",
        transform: "scale(0.8)",
        pointerEvents: "none",
      });
      introOverlay.appendChild(playButton);

      playButton.addEventListener("mouseenter", () => {
        playButton.style.transform = "scale(1.05)";
        playButton.style.boxShadow = "0 8px 25px rgba(255,215,0,0.4)";
      });

      playButton.addEventListener("mouseleave", () => {
        playButton.style.transform = "scale(1)";
        playButton.style.boxShadow = "0 6px 20px rgba(0,0,0,0.5)";
      });

      let currentLine = 0;
      function showNextStoryLine() {
        if (currentLine < storyLines.length) {
          let lineElement = document.createElement("div");
          lineElement.textContent = storyLines[currentLine];
          Object.assign(lineElement.style, {
            fontSize: "19px",
            fontWeight: "bold",
            color: "#000000ff",
            lineHeight: "1", 
            whiteSpace: "normal",      // ✅ allows text to wrap
            wordWrap: "break-word",    // ✅ breaks long words if needed
            overflowWrap: "break-word",// ✅ ensures wrapping in all browsers
            textAlign: "center",       // optional — keeps it nicely aligned
            maxWidth: "100%",           // ensures it fits within container
            display: "block",             // ✅ ensures it's treated like a paragraph
            width: "100%",      
            opacity: "0",
            animation: "fadeInUp 0.8s ease forwards"
          });
          storyContainer.appendChild(lineElement);
          
          currentLine++;
          setTimeout(showNextStoryLine, 3000);
        } else {
          setTimeout(() => {
            playButton.style.opacity = "1";
            playButton.style.transform = "scale(1)";
            playButton.style.pointerEvents = "auto";
          }, 500);
        }
      }

      setTimeout(showNextStoryLine, 1000);

      playButton.addEventListener("click", () => {
        // Show the pause button when Play Game is clicked
        const togglePauseBtn = document.getElementById("togglePauseBtn");
        if (togglePauseBtn) {
          togglePauseBtn.style.display = "block";
        }
        
        introOverlay.style.opacity = "0";
        setTimeout(() => {
          if (introOverlay.parentNode) introOverlay.remove();
          resolve();
        }, 500);
      });
    });
  }

  const pathCanvas = document.createElement("canvas");
  pathCanvas.id = "gazePathCanvas";
  pathCanvas.style.position = "fixed";
  pathCanvas.style.top = "0";
  pathCanvas.style.left = "0";
  pathCanvas.width = window.innerWidth;
  pathCanvas.height = window.innerHeight;
  pathCanvas.style.zIndex = "19999";
  pathCanvas.style.pointerEvents = "none";
  document.body.appendChild(pathCanvas);

  const pathCtx = pathCanvas.getContext("2d");
  let pathDrawingEnabled = false; 

  const brightnessCanvas = document.createElement('canvas');
  brightnessCanvas.width = 160; 
  brightnessCanvas.height = 120;
  const brightnessCtx = brightnessCanvas.getContext('2d');

  function hideGazeDot() {
    if (window.dotGaze) {
      window.dotGaze.style.display = "none";
    }
  }

  function showGazeDot() {
    if (window.dotGaze) {
      window.dotGaze.style.display = "block";
    }
  }

  function waitForVideoReady(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        const video = document.querySelector('video');
        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
          clearInterval(check);
          console.log("✅ Video ready:", video.videoWidth, video.videoHeight);
          resolve(video);
        } else if (Date.now() - start > timeout) {
          clearInterval(check);
          reject("❌ Video never became ready");
        }
      }, 100);
    });
  }

  initGazeTracking();

  function createDot(id, emoji) {
    let dot = document.getElementById(id);
    if (!dot) {
      dot = document.createElement("div");
      dot.id = id;
      dot.style.position = "fixed";
      dot.style.zIndex = "15000";
      dot.style.pointerEvents = "none";
      dot.style.display = "none";
      dot.textContent = emoji;
      dot.style.fontSize = "80px";
      document.body.appendChild(dot);
    }
    return dot;
  }

  const birdDot = createDot("birdDot", "🦅");
  const targetDot = createDot("targetDot", "🎯");
  const gemDot = createDot("gemDot", "💎");

  const gazeDot = document.createElement("div");
  gazeDot.id = "gazeDot";
  gazeDot.style.position = "fixed";
  gazeDot.style.width = "20px";
  gazeDot.style.height = "20px";
  gazeDot.style.borderRadius = "50%";
  gazeDot.style.background = "red";
  gazeDot.style.zIndex = "20000";
  gazeDot.style.pointerEvents = "none";
  gazeDot.style.display = "none";
  document.body.appendChild(gazeDot);

  const calibrationPoints = [
    { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 }
  ];

  function waitForValidGaze(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
          clearInterval(check);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(check);
          reject("Gaze not available");
        }
      }, 100);
    });
  }

  function mapGazeToScreen(gaze, video) {
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return { x: 0, y: 0 };
    }

    const rawX = video.mirror ? video.videoWidth - gaze.x : gaze.x;
    const rawY = gaze.y;
    const scaleX = video.clientWidth / video.videoWidth;
    const scaleY = video.clientHeight / video.videoHeight;
    const rect = video.getBoundingClientRect();

    return {
      x: Math.min(Math.max(rawX * scaleX + rect.left, 0), window.innerWidth),
      y: Math.min(Math.max(rawY * scaleY + rect.top, 0), window.innerHeight)
    };
  }

  async function runBirdGame() {
    function showErrorPopup(message) {
      let overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "99999"
      });

      let popup = document.createElement("div");
      Object.assign(popup.style, {
        background: "white",
        padding: "20px 30px",
        borderRadius: "10px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
      });

      let text = document.createElement("p");
      text.textContent = message;
      text.style.marginBottom = "15px";
      text.style.fontSize = "16px";
      text.style.color = "black";

      let button = document.createElement("button");
      button.textContent = "OK";
      Object.assign(button.style, {
        padding: "8px 16px",
        background: "#3E3F29",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      });

      button.onclick = () => document.body.removeChild(overlay);

      popup.appendChild(text);
      popup.appendChild(button);
      overlay.appendChild(popup);
      document.body.appendChild(overlay);
    }

    try {
      await waitForValidGaze();
    } catch (err) {
      showErrorPopup("Camera not ready or gaze data unavailable. Cannot start bird game.");
      return;
    }

    return new Promise(async (resolve) => {
      let scoreDisplay = document.getElementById("birdScoreDisplay");
      if (!scoreDisplay) {
        scoreDisplay = document.createElement("div");
        scoreDisplay.id = "birdScoreDisplay";
        Object.assign(scoreDisplay.style, {
          position: "fixed",
          top: "20px",
          left: "30px",
          fontSize: "32px",
          fontWeight: "bold",
          color: "gold",
          textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 5px rgba(0,0,0,0.5)",
          zIndex: "9999999",
          background: "rgba(0,0,0,0.8)",
          padding: "15px 25px",
          borderRadius: "15px",
          border: "3px solid gold",
          pointerEvents: "none"
        });
        document.body.appendChild(scoreDisplay);
      }
      
      scoreDisplay.style.display = "block";
      let score = 0;
      scoreDisplay.textContent = `Score: ${score}`;
      console.log("Bird game score display shown");

      let birdContainer = document.getElementById("birdContainer");
      if (!birdContainer) {
        birdContainer = document.createElement("div");
        birdContainer.id = "birdContainer";
        document.body.appendChild(birdContainer);
        Object.assign(birdContainer.style, {
          position: "absolute",
          width: "110px",
          height: "110px",
          left: "0px",
          top: "0px",
          zIndex: "999999",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
        });

        birdContainer.appendChild(birdDot);
        Object.assign(birdDot.style, {
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "40px",
          height: "40px",
          transform: "translate(-50%, -50%) scale(1)",
          zIndex: "10",
          display: "block",
          transition: "transform 0.1s linear"
        });

        let progressRing = document.createElement("div");
        progressRing.id = "birdProgressRing";
        birdContainer.appendChild(progressRing);
        Object.assign(progressRing.style, {
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          background: "conic-gradient(rgba(228, 199, 199, 1) 0%, rgb(141, 92, 41) 0%)",
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: "1",
          transform: "translate(-20%, -20%)"
        });
      }

      birdContainer.style.display = "block";
      const progressRing = document.getElementById("birdProgressRing");

      const totalPoints = 30;
      const dotSize = 110;
      const margin = 20; 

      const points = Array.from({ length: totalPoints }, () => ({
        x: margin + Math.random() * (window.innerWidth - dotSize - margin * 2),
        y: margin + Math.random() * (window.innerHeight - dotSize - margin * 2),
      }));

      let index = 0;

      function updateProgressRing(currentIndex) {
        const percentage = ((currentIndex + 1) / totalPoints) * 100;
        progressRing.style.background = `conic-gradient(
          rgba(228, 199, 199, 1) ${percentage}%,
          rgb(141, 92, 41) ${percentage}%
        )`;
      }

      async function moveToNextPoint() {
        while (gamesPaused) {
          await new Promise(resume => currentGameResolver = resume);
        }

        if (index >= points.length) {
          birdContainer.style.display = "none";
          scoreDisplay.style.display = "none";
          resolve();
          return;
        }

        const startX = parseFloat(birdContainer.style.left) || points[index].x;
        const startY = parseFloat(birdContainer.style.top) || points[index].y;
        const endX = points[index].x;
        const endY = points[index].y;
        const duration = 2000;
        const startTime = performance.now();

        function animate(time) {
          if (gamesPaused) {
            requestAnimationFrame(animate);
            return;
          }

          const elapsed = time - startTime;
          const t = Math.min(elapsed / duration, 1);
          const currentX = startX + (endX - startX) * t;
          const currentY = startY + (endY - startY) * t;

          birdContainer.style.left = `${currentX}px`;
          birdContainer.style.top = `${currentY}px`;

          const scaleMoving = 1 - 0.3 * t; 
          birdDot.style.transform = `translate(-50%, -50%) scale(${scaleMoving})`;

          if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
            const mappedGaze = mapGazeToScreen(window.currentGaze, window.videoElement); 
            const gazeEntry = {
              time: Date.now(),
              gazeX: mappedGaze.x,
              gazeY: mappedGaze.y,
              targetX: currentX,
              targetY: currentY,
              game: "bird",
              pointIndex: index,
            };
            allGamesGazeLog.push(gazeEntry);
            console.log("GazeX:", gazeEntry.gazeX, "GazeY: ",gazeEntry.gazeY, "TargetX: ", gazeEntry.targetX, "TargetY: ", gazeEntry.targetY);
          }

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            updateProgressRing(index);

            const pulseDuration = 1000; 
            const pulseStart = performance.now();
            async function pulse(time) {
              while (gamesPaused) {
                await new Promise(resume => currentGameResolver = resume);
              }

              const elapsedPulse = time - pulseStart;
              const pulseT = Math.min(elapsedPulse / pulseDuration, 1);
              const scale = 0.7 + 0.6 * Math.sin(pulseT * Math.PI); 
              birdDot.style.transform = `translate(-50%, -50%) scale(${scale})`;

              if (pulseT < 1) {
                requestAnimationFrame(pulse);
              } else {
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
                console.log("Bird score updated:", score);
                
                index++;
                await moveToNextPoint();
              }
            }
            requestAnimationFrame(pulse);
          }
        }

        requestAnimationFrame(animate);
      }

      await moveToNextPoint();
    });
  }

  function runTargetGame() {
    return new Promise(async (resolve) => {
      let scoreDisplay = document.getElementById("targetScoreDisplay");
      if (!scoreDisplay) {
        scoreDisplay = document.createElement("div");
        scoreDisplay.id = "targetScoreDisplay";
        Object.assign(scoreDisplay.style, {
          position: "fixed",
          top: "20px",
          right: "20px",
          fontSize: "32px",
          fontWeight: "bold",
          color: "gold",
          textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 5px rgba(0,0,0,0.5)",
          zIndex: "9999999",
          background: "rgba(0,0,0,0.8)",
          padding: "15px 25px",
          borderRadius: "15px",
          border: "3px solid gold",
          pointerEvents: "none"
        });
        document.body.appendChild(scoreDisplay);
      }

      scoreDisplay.style.display = "block";
      let score = 0;
      scoreDisplay.textContent = `Score: ${score}`;
      console.log("Target game score display shown");

      targetDot.style.display = "block";
      let moves = 0;
      const baseScale = 0.7; 
      const totalPoints = 35;

      function renderTarget(remainingPoints) {
        targetDot.innerHTML = `
          <span style="font-size: 300px; display: block; color: white;">⌖</span>
          <div style="
            position: absolute;
            top: 60%;
            left: 50%;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: #e24319;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            color: black;
            transform: translate(-50%, -50%) scale(0);
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            pointer-events: none;
            transition: transform 0.3s ease-out;
          ">
            ${remainingPoints}
          </div>
        `;
        const numberCircle = targetDot.querySelector("div");
        requestAnimationFrame(() => {
          numberCircle.style.transform = "translate(-50%, -50%) scale(1)";
        });
        targetDot.style.position = "absolute";
        targetDot.style.textAlign = "center";
      }

      function renderExplosion() {
        const targetRect = targetDot.getBoundingClientRect();
        targetDot.style.visibility = "hidden";

        const explosion = document.createElement("span");
        explosion.textContent = "💥";
        Object.assign(explosion.style, {
          position: "fixed",
          left: `${targetRect.left + targetRect.width / 2}px`,
          top: `${targetRect.top + targetRect.height / 2}px`,
          transform: "translate(-50%, -50%) scale(0.3)",
          fontSize: "120px",
          animation: "explode 0.8s ease-out forwards",
          pointerEvents: "none",
          zIndex: "999999",
        });

        document.body.appendChild(explosion);

        const explosionSound = new Audio("explosion-fx-343683.mp3");
        explosionSound.volume = 0.3;
        explosionSound.play().catch(err => console.log("Sound playback blocked:", err));

        if (!document.getElementById("explosionStyles")) {
          const style = document.createElement("style");
          style.id = "explosionStyles";
          style.textContent = `
            @keyframes explode {
              0% {
                transform: translate(-50%, -50%) scale(0.3);
                opacity: 0;
              }
              30% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              60% {
                transform: translate(-50%, -50%) scale(1.2) rotate(8deg);
                opacity: 0.9;
              }
              100% {
                transform: translate(-50%, -50%) scale(1.3) rotate(15deg);
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(style);
        }

        setTimeout(() => {
          explosion.remove();
          targetDot.style.visibility = "visible";
        }, 800);
      }

      async function move() {
        while (gamesPaused) {
          await new Promise(resume => currentGameResolver = resume);
        }

        if (moves >= totalPoints) {
          targetDot.style.display = "none";
          scoreDisplay.style.display = "none";
          resolve();
          return;
        }

        const targetWidth = targetDot.offsetWidth || 200;  
        const targetHeight = targetDot.offsetHeight || 200;  

        const x = Math.random() * (window.innerWidth - targetWidth);
        const y = Math.random() * (window.innerHeight - targetHeight);

        targetDot.style.left = `${x}px`;
        targetDot.style.top = `${y}px`;

        const remainingPoints = totalPoints - moves;
        renderTarget(remainingPoints);

        targetDot.style.transform = `scale(${baseScale})`;
        targetDot.style.transition = "transform 0.3s ease-out";

        if (window.currentGaze && window.currentGaze.x !== null && window.currentGaze.y !== null) {
          const gazeEntry = {
            time: Date.now(),
            gazeX: window.currentGaze.x,
            gazeY: window.currentGaze.y,
            targetX: x,
            targetY: y,
            game: "target",
            moveIndex: moves
          };
          allGamesGazeLog.push(gazeEntry);
        }

        setTimeout(() => {
          targetDot.style.transform = `scale(${baseScale * 0.6})`; 
        }, 100);

        setTimeout(async () => {
          renderExplosion();
          setTimeout(async () => {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            
            moves++;
            if (moves < totalPoints) renderTarget(totalPoints - moves);
            await move();
          }, 800);
        }, 1000);
      }

      await move();
    });
  }

function runGemGame() {
    return new Promise((resolve) => {
      let scoreDisplay = document.getElementById("gemScoreDisplay");
      if (!scoreDisplay) {
        scoreDisplay = document.createElement("div");
        scoreDisplay.id = "gemScoreDisplay";
        Object.assign(scoreDisplay.style, {
          position: "fixed",
          top: "20px",
          right: "20px",
          fontSize: "32px",
          fontWeight: "bold",
          color: "gold",
          textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 5px rgba(0,0,0,0.5)",
          zIndex: "999999",
          background: "rgba(0,0,0,0.6)",
          padding: "15px 25px",
          borderRadius: "15px",
          border: "2px solid gold",
          pointerEvents: "none"
        });
        document.body.appendChild(scoreDisplay);
      }

      scoreDisplay.style.display = "block";
      let score = 0;
      scoreDisplay.textContent = `Score: ${score}`;
      console.log("Gem game score display shown");

      // Create maze canvas
      let mazeCanvas = document.createElement("canvas");
      mazeCanvas.id = "mazeCanvas";
      Object.assign(mazeCanvas.style, {
        position: "fixed",
        top: "55%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "9999999",
      });
      
      const mazeSize = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8, 900);
      mazeCanvas.width = mazeSize;
      mazeCanvas.height = mazeSize;
      document.body.appendChild(mazeCanvas);
      
      const ctx = mazeCanvas.getContext("2d");
      const cellSize = mazeSize / 15; // 15x15 maze

      // Generate maze using recursive backtracking
      function generateMaze(cols, rows) {
        const maze = Array(rows).fill().map(() => Array(cols).fill({
          top: true,
          right: true,
          bottom: true,
          left: true,
          visited: false
        }));
        
        // Create copies for each cell
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            maze[r][c] = { top: true, right: true, bottom: true, left: true, visited: false };
          }
        }

        const stack = [];
        let current = { row: 0, col: 0 };
        maze[0][0].visited = true;

        while (true) {
          const neighbors = [];
          const { row, col } = current;

          if (row > 0 && !maze[row - 1][col].visited) neighbors.push({ row: row - 1, col, dir: 'top' });
          if (col < cols - 1 && !maze[row][col + 1].visited) neighbors.push({ row, col: col + 1, dir: 'right' });
          if (row < rows - 1 && !maze[row + 1][col].visited) neighbors.push({ row: row + 1, col, dir: 'bottom' });
          if (col > 0 && !maze[row][col - 1].visited) neighbors.push({ row, col: col - 1, dir: 'left' });

          if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            if (next.dir === 'top') {
              maze[row][col].top = false;
              maze[next.row][next.col].bottom = false;
            } else if (next.dir === 'right') {
              maze[row][col].right = false;
              maze[next.row][next.col].left = false;
            } else if (next.dir === 'bottom') {
              maze[row][col].bottom = false;
              maze[next.row][next.col].top = false;
            } else if (next.dir === 'left') {
              maze[row][col].left = false;
              maze[next.row][next.col].right = false;
            }

            maze[next.row][next.col].visited = true;
            stack.push(current);
            current = { row: next.row, col: next.col };
          } else if (stack.length > 0) {
            current = stack.pop();
          } else {
            break;
          }
        }

        return maze;
      }

      const maze = generateMaze(15, 15);

      function drawMaze(highlightPath = null) {
        // Clear canvas
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, mazeSize, mazeSize);

        // Draw the solution path first (if provided)
        if (highlightPath && highlightPath.length > 0) {
          ctx.strokeStyle = "#bca88d8a";
          ctx.lineWidth = cellSize * 0.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.beginPath();
          ctx.moveTo(
            highlightPath[0].col * cellSize + cellSize / 2,
            highlightPath[0].row * cellSize + cellSize / 2
          );

          for (let i = 1; i < highlightPath.length; i++) {
            ctx.lineTo(
              highlightPath[i].col * cellSize + cellSize / 2,
              highlightPath[i].row * cellSize + cellSize / 2
            );
          }
          ctx.stroke();
        }

        // Draw maze walls
        ctx.strokeStyle = "#fdfdfdff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#654321";
        ctx.shadowBlur = 5;

        for (let r = 0; r < 15; r++) {
          for (let c = 0; c < 15; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            const cell = maze[r][c];

            ctx.beginPath();
            if (cell.top) {
              ctx.moveTo(x, y);
              ctx.lineTo(x + cellSize, y);
            }
            if (cell.right) {
              ctx.moveTo(x + cellSize, y);
              ctx.lineTo(x + cellSize, y + cellSize);
            }
            if (cell.bottom) {
              ctx.moveTo(x, y + cellSize);
              ctx.lineTo(x + cellSize, y + cellSize);
            }
            if (cell.left) {
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + cellSize);
            }
            ctx.stroke();
          }
        }

        ctx.shadowBlur = 0;

        ctx.fillRect(2, 2, cellSize - 4, cellSize - 4);
        ctx.font = `${cellSize * 0.6}px Arial`;
        ctx.fillText("🚪", cellSize * 0.2, cellSize * 0.7);

        ctx.fillRect(14 * cellSize + 2, 14 * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.font = `${cellSize * 0.6}px Arial`;
        ctx.fillText("🏆", 14 * cellSize + cellSize * 0.2, 14 * cellSize + cellSize * 0.7);
      }

      drawMaze();

      // Create path through maze using BFS
      function findPath() {
        const queue = [{ row: 0, col: 0, path: [{ row: 0, col: 0 }] }];
        const visited = Array(15).fill().map(() => Array(15).fill(false));
        visited[0][0] = true;

        while (queue.length > 0) {
          const { row, col, path } = queue.shift();

          if (row === 14 && col === 14) {
            return path;
          }

          const moves = [];
          if (!maze[row][col].top && row > 0 && !visited[row - 1][col]) 
            moves.push({ row: row - 1, col });
          if (!maze[row][col].right && col < 14 && !visited[row][col + 1]) 
            moves.push({ row, col: col + 1 });
          if (!maze[row][col].bottom && row < 14 && !visited[row + 1][col]) 
            moves.push({ row: row + 1, col });
          if (!maze[row][col].left && col > 0 && !visited[row][col - 1]) 
            moves.push({ row, col: col - 1 });

          for (const move of moves) {
            visited[move.row][move.col] = true;
            queue.push({ 
              row: move.row, 
              col: move.col, 
              path: [...path, move] 
            });
          }
        }
        return [];
      }

      const pathPoints = findPath();
      
      // Redraw maze with the path highlighted
      drawMaze(pathPoints);
      
      gemDot.style.display = "block";
      gemDot.textContent = "💎";
      gemDot.style.fontSize = "40px";
      gemDot.style.zIndex = "99999999";

      let achievement = document.createElement("div");
      achievement.textContent = "🏆";
      Object.assign(achievement.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) scale(0.5)",
        fontSize: "100px",
        opacity: "0",
        transition: "opacity 1s, transform 1s",
        zIndex: "999999",
      });
      document.body.appendChild(achievement);

      async function animateThroughMaze() {
        const canvasRect = mazeCanvas.getBoundingClientRect();
        
        for (let i = 0; i < pathPoints.length; i++) {
          while (gamesPaused) {
            await new Promise(resume => currentGameResolver = resume);
          }

          const point = pathPoints[i];
          const screenX = canvasRect.left + point.col * cellSize + cellSize / 2;
          const screenY = canvasRect.top + point.row * cellSize + cellSize / 2;

          const gemSize = 40; 
          gemDot.style.left = `${screenX}px`;
          gemDot.style.top = `${screenY}px`;
          gemDot.style.transform = "translate(-50%, -50%)";

          const progress = i / pathPoints.length;
          const glowStrength = Math.floor(10 + progress * 50);
          gemDot.style.filter = `drop-shadow(0 0 ${glowStrength}px gold)`;

          if (window.currentGaze && window.currentGaze.x !== null && window.currentGaze.y !== null) {
            const gazeEntry = {
              time: Date.now(),
              gazeX: window.currentGaze.x,
              gazeY: window.currentGaze.y,
              targetX: screenX,
              targetY: screenY,
              game: "gem",
              moveIndex: i,
              mazeProgress: progress
            };
            allGamesGazeLog.push(gazeEntry);
          }

          score++;
          scoreDisplay.textContent = `Score: ${score}`;

          await new Promise(r => setTimeout(r, 800));
        }

        gemDot.style.display = "none";
        mazeCanvas.remove();
        
        achievement.style.opacity = "1";
        achievement.style.transform = "translate(-50%, -50%) scale(1.5)";
        
        setTimeout(() => {
          achievement.style.opacity = "0";
          achievement.style.transform = "translate(-50%, -50%) scale(0.5)";
          scoreDisplay.style.display = "none";
          setTimeout(() => {
            if (achievement.parentNode) achievement.remove();
            resolve();
          }, 3000);
        }, 4000);
      }

      animateThroughMaze();
    });
  }

  const postCalibrationGazePath = []; 

  function startPostCalibrationGazeTracing() {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.zIndex = "99998";
    canvas.style.pointerEvents = "none";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    let dot = document.getElementById("webgazerGazeDot");
    if (!dot) {
      dot = document.createElement("div");
      dot.id = "webgazerGazeDot";
      dot.style.position = "fixed";
      dot.style.width = "12px";
      dot.style.height = "12px";
      dot.style.background = "red";
      dot.style.borderRadius = "50%";
      dot.style.zIndex = "99999";
      dot.style.pointerEvents = "none";
      dot.style.left = "50%";
      dot.style.top = "50%";
      document.body.appendChild(dot);
      console.log("✅ Gaze dot created");
    }

    const gazeHistory = [];
    const SMOOTHING_WINDOW = 5;
    const trail = [];
    const TRAIL_LIFETIME = 5000; 

    function getSmoothedGaze(newPoint) {
      if (!newPoint || newPoint.x == null || newPoint.y == null) return null;
      gazeHistory.push(newPoint);
      if (gazeHistory.length > SMOOTHING_WINDOW) gazeHistory.shift();

      const avg = gazeHistory.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
      );
      return {
        x: avg.x / gazeHistory.length,
        y: avg.y / gazeHistory.length
      };
    }

    webgazer.setGazeListener((data) => {
      if (!data) return;

      const smoothed = getSmoothedGaze({ x: data.x, y: data.y });
      if (!smoothed) return;

      dot.style.left = smoothed.x - dot.offsetWidth / 2 + "px";
      dot.style.top = smoothed.y - dot.offsetHeight / 2 + "px";

      trail.push({ x: smoothed.x, y: smoothed.y, time: Date.now() });
    });

    function drawTrail() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      const alivePoints = trail.filter(p => now - p.time < TRAIL_LIFETIME);

      if (alivePoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(alivePoints[0].x, alivePoints[0].y);
        for (let i = 1; i < alivePoints.length; i++) {
          ctx.lineTo(alivePoints[i].x, alivePoints[i].y);
        }
        ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; 
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      if (alivePoints.length > 0) {
        const last = alivePoints[alivePoints.length - 1];
        ctx.beginPath();
        ctx.arc(last.x, last.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "blue"; 
        ctx.fill();
      }

      trail.length = 0;
      trail.push(...alivePoints);

      requestAnimationFrame(drawTrail);
    }

    drawTrail();
  }

  const gazeHistory = [];
  const SMOOTHING_WINDOW = 5; 

  function getSmoothedGaze(newPoint) {
    gazeHistory.push(newPoint);

    if (gazeHistory.length > SMOOTHING_WINDOW) {
      gazeHistory.shift();
    }

    const avg = gazeHistory.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    return {
      x: avg.x / gazeHistory.length,
      y: avg.y / gazeHistory.length,
    };
  }

  function hideWebGazerDot() {
    const tryHide = () => {
      const dot = document.getElementById("webgazerGazeDot");
      if (dot) {
        dot.style.display = "none";      
        dot.style.opacity = "0";         
        dot.style.pointerEvents = "none";
      }
    };

    tryHide();
    setInterval(tryHide, 100); 
  }

  async function startGazeTracker() {
    try {
      console.log("Starting gaze tracker...");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      window.videoElement = video;
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.display = "none";
      document.body.appendChild(video);

      await new Promise((resolve) => {
        video.onloadeddata = () => {
          video.play();
          resolve();
        };
      });

      await new Promise((resolve) => {
        function checkVideoReady() {
          if (video.readyState >= 3 && video.videoWidth > 0 && video.videoHeight > 0) {
            console.log("Video is ready!", video.videoWidth, video.videoHeight);
            resolve();
          } else {
            requestAnimationFrame(checkVideoReady);
          }
        }
        checkVideoReady();
      });

      function debugWebGazerDot() {
        const allDots = document.querySelectorAll("[id*='webgazer'], [class*='webgazer']");
        console.log("Found WebGazer elements:", allDots);

        allDots.forEach((el, i) => {
          console.log(`Element ${i}:`, el, "display:", getComputedStyle(el).display);
        });
      }

      function hideAllWebgazerElements() {
        const elements = document.querySelectorAll("[id*='webgazer'], [class*='webgazer']");
        elements.forEach(el => {
          if (el.id !== 'webgazerGazeDot') {
            el.style.display = "none";
            el.style.opacity = "0";
            el.style.visibility = "hidden";
          }
        });
      }

      try {
        await webgazer
          .setRegression("ridge")
          .setTracker("TFFacemesh")
          .showPredictionPoints(false)
          .setGazeListener((data) => {
            if (!data || !isFinite(data.x) || !isFinite(data.y)) return;

            const mapped = mapGazeToScreen(data, video);
            const smoothed = getSmoothedGaze({ x: mapped.x, y: mapped.y });
            window.currentGaze = smoothed;

            if (window.dotGaze) {
              window.dotGaze.style.left = `${smoothed.x - 10}px`;
              window.dotGaze.style.top = `${smoothed.y - 10}px`;
            }
          })
          .begin();

        debugWebGazerDot();
        setInterval(hideAllWebgazerElements, 100);

        console.log("WebGazer started ✅");
        startBrightnessLoop(video);
      } catch (err) {
        console.error("WebGazer failed to start:", err);
        startBrightnessLoop(video);
      }

    } catch (err) {
      console.error("❌ Failed to start gaze tracker:", err);
    }
  }

  function startBrightnessLoop(video) {
    const brightnessDisplay = document.getElementById("brightness-display");
    if (!brightnessDisplay) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    console.log("inside brightness loop");

    function calcBrightness() {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0;
        for (let i = 0; i < frame.data.length; i += 4) {
          sum += 0.2126 * frame.data[i] + 0.7152 * frame.data[i + 1] + 0.0722 * frame.data[i + 2];
        }
        const avgBrightness = Math.round(sum / (frame.data.length / 4));
        brightnessDisplay.textContent = `Brightness: ${avgBrightness}`;
      } else {
        console.log("Video not ready yet", video.readyState, video.videoWidth, video.videoHeight);
      }

      requestAnimationFrame(calcBrightness);
    }

    calcBrightness();
  }

  function hideGazeDots() {
    if (window.dotGaze) window.dotGaze.style.display = "none";
    const webgazerDot = document.getElementById("webgazerGazeDot");
    if (webgazerDot) webgazerDot.style.display = "none";
  }
  
  function showGazeDots() {
    if (window.dotGaze) window.dotGaze.style.display = "block";
    const webgazerDot = document.getElementById("webgazerGazeDot");
    if (webgazerDot) webgazerDot.style.display = "block";
  }

  async function startGames() {
    if (calibrationInProgress) return;
    calibrationInProgress = true;

    hideGazeDots();

    try {
      await startGazeTracker();
    } catch (err) {
      calibrationInProgress = false;
      return;
    }

    if (blurOverlay) blurOverlay.classList.add("active");

    await showGameIntro(
      "Bird Game",
      [
        "A gentle breeze flows through the forest…",
        "A mysterious bird flutters into view.",
        "Follow the bird carefully — it knows the way forward."
      ],
      "🦅"
    );
    await runWithPause(runBirdGame);

    await showGameIntro(
      "Target Game",
      [
        "The bird vanishes into the shadows…",
        "Targets suddenly appear around you.",
        "Strike carefully — your focus guides the way."
      ],
      "🎯"
    );
    await runWithPause(runTargetGame);

    await showGameIntro(
      "Maze Game",
      [
        "A quiet mist rolls in as the ground begins to shift…",
        "Walls rise around you, forming a twisting maze.",
        "Use your gaze — only focus will lead you out."
      ],
      "🌀"
    );
    await runWithPause(runGemGame);

    finishGames();
    startPostCalibrationGazeTracing();
    showGazeDots(); 
  }

  function finishGames() {
    calibrationInProgress = false;
    birdDot.style.display = "none";
    targetDot.style.display = "none";
    gemDot.style.display = "none";
    blurOverlay.classList.remove("active");
    if (blurOverlay) blurOverlay.style.display = "none";
    
    // Hide the pause button when calibration is complete
    const togglePauseBtn = document.getElementById("togglePauseBtn");
    if (togglePauseBtn) togglePauseBtn.style.display = "none";
    
    pathDrawingEnabled = true;

    console.log("✅ ALL GAMES COMPLETED - Total gaze points collected:", allGamesGazeLog.length);
    console.log("📊 Complete gaze data from all games:", allGamesGazeLog);
    
    try {
      localStorage.setItem('allGamesGazeData', JSON.stringify(allGamesGazeLog));
      console.log("💾 Gaze data saved to localStorage");
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    let popupOverlay = document.createElement("div");
    Object.assign(popupOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "30000"
    });
    document.body.appendChild(popupOverlay);

    let popupBox = document.createElement("div");
    Object.assign(popupBox.style, {
      background: "white",
      padding: "20px 30px",
      borderRadius: "12px",
      textAlign: "center",
      maxWidth: "400px",
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333",
      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    });
    popupOverlay.appendChild(popupBox);

    let message = document.createElement("div");
    message.textContent = "Calibration complete! The Blue dot now shows your real-time gaze with path.";
    popupBox.appendChild(message);

    let closeButton = document.createElement("button");
    closeButton.textContent = "OK";
    Object.assign(closeButton.style, {
      marginTop: "15px",
      padding: "8px 16px",
      fontSize: "16px",
      background: "#3E3F29",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer"
    });
    popupBox.appendChild(closeButton);

    closeButton.onclick = () => {
      if (popupOverlay.parentNode) popupOverlay.remove();
    };
  }

  const toggleSwitch = document.getElementById("toggle-switch-popup");
  let isTrackingOn = false;

  if (calibrateBtn) {
    calibrateBtn.addEventListener("click", () => {
      startGames(); 
    });
  }

  // Declare variables for pause/resume functionality
  let gamesPaused = false;
  let currentGameResolver = null;

  function pauseGames() {
    gamesPaused = true;
    console.log("Calibration games paused.");
  }

  function resumeGames() {
    if (!gamesPaused) return;
    gamesPaused = false;
    console.log("Calibration games resumed.");

    if (currentGameResolver) {
      currentGameResolver();
      currentGameResolver = null;
    }
  }

  function togglePause() {
    const togglePauseBtn = document.getElementById("togglePauseBtn");
    if (gamesPaused) {
      resumeGames();
      if (togglePauseBtn) {
        togglePauseBtn.textContent = "Pause";
        togglePauseBtn.title = "Pause";
      }
    } else {
      pauseGames();
      if (togglePauseBtn) {
        togglePauseBtn.textContent = "Resume";
        togglePauseBtn.title = "Resume";
      }
    }
  }

  // Set up the toggle button
  const togglePauseBtn = document.getElementById("togglePauseBtn");
  if (togglePauseBtn) {
    togglePauseBtn.style.display = "none"; // Hide initially
    togglePauseBtn.addEventListener("click", togglePause); // Add event listener
  }

  async function runWithPause(gameFn) {
    while (gamesPaused) {
      await new Promise(resolve => {
        currentGameResolver = resolve;
      });
    }
    return gameFn();
  }

  async function initGazeTracking() {
    if (!window.webgazer) {
      alert("WebGazer is not loaded!");
      throw new Error("WebGazer not found");
    }

    let correctionModel = null;
    const storedModel = localStorage.getItem("calibrationModel");
    if (storedModel) {
      correctionModel = JSON.parse(storedModel);
    }

    if (!window.dotGaze) {
      const dotGaze = document.createElement("div");
      dotGaze.style.position = "fixed";
      dotGaze.style.width = "20px";
      dotGaze.style.height = "20px";
      dotGaze.style.background = "red";
      dotGaze.style.borderRadius = "50%";
      dotGaze.style.zIndex = "10002";
      dotGaze.style.pointerEvents = "none";
      document.body.appendChild(dotGaze);
      window.dotGaze = dotGaze;
    }

    window.currentGaze = { x: 0, y: 0 };

    await webgazer
      .setRegression("ridge")
      .setTracker("clmtrackr")
      .setGazeListener((data) => {
        if (!data || !isFinite(data.x) || !isFinite(data.y)) {
          window.currentGaze = { x: 0, y: 0 };
          return;
        }

        window.currentGaze = { x: data.x, y: data.y };
        if (window.dotGaze) {
          window.dotGaze.style.left = `${window.currentGaze.x - 10}px`;
          window.dotGaze.style.top = `${window.currentGaze.y - 10}px`;
          window.dotGaze.style.zIndex = "100000";
        }
      })
      .begin();
    
    const webgazerDot = document.getElementById("webgazerGazeDot");
    if (webgazerDot) {
      webgazerDot.style.display = "none";
      webgazerDot.style.opacity = "0";
      webgazerDot.style.width = "0px";
      webgazerDot.style.height = "0px";
    }
    
    webgazer.showVideo(true).showFaceOverlay(false).showFaceFeedbackBox(false);
    console.log("Gaze tracking started, custom dot visible.");
  }

  if (openPopupBtn && popupOverlay) {
    openPopupBtn.addEventListener("click", () => {
      popupOverlay.style.display = "flex";
    });

    let dwellTimer = null;

    openPopupBtn.addEventListener("mouseenter", () => {
      dwellTimer = setTimeout(() => {
        popupOverlay.style.display = "flex";
      }, 5000); 
    });

    openPopupBtn.addEventListener("mouseleave", () => {
      if (dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    });
  }

  if (closeBtn && popupOverlay) {
    closeBtn.addEventListener("click", () => popupOverlay.style.display = "none");

    let dwellTimer;
    closeBtn.addEventListener("mouseenter", () => {
      dwellTimer = setTimeout(() => {
        popupOverlay.style.display = "none";
      }, 5000);
    });

    closeBtn.addEventListener("mouseleave", () => {
      clearTimeout(dwellTimer);
    });
  }

  const scrollLeftSelect = document.getElementById("scrollLeftSelect");
  const scrollRightSelect = document.getElementById("scrollRightSelect");
  const scrollUpSelect = document.getElementById("scrollUpSelect");
  const scrollDownSelect = document.getElementById("scrollDownSelect");
  const triggerSelect = document.getElementById("triggerSelect");
  const addButton = document.getElementById("addButton");
  if (addButton) addButton.addEventListener("click", () => console.log("Add Settings button clicked!"));

  const saveButton = document.getElementById("saveButton");
  if (saveButton) saveButton.addEventListener("click", function () {
    const preferences = {
      "Scroll Left": scrollLeftSelect?.value || "",
      "Scroll Right": scrollRightSelect?.value || "",
      "Scroll Up": scrollUpSelect?.value || "",
      "Scroll Down": scrollDownSelect?.value || "",
      "Trigger or choose": triggerSelect?.value || ""
    };
    if (chrome?.storage?.local) chrome.storage.local.set({ gazePreferences: preferences }, () => showFeedbackBox());
    else showFeedbackBox();
  });

  if (chrome?.storage?.local) {
    chrome.storage.local.get(["gazePreferences"], function (data) {
      if (data.gazePreferences) {
        if (scrollLeftSelect) scrollLeftSelect.value = data.gazePreferences["Scroll Left"] || "";
        if (scrollRightSelect) scrollRightSelect.value = data.gazePreferences["Scroll Right"] || "";
        if (scrollUpSelect) scrollUpSelect.value = data.gazePreferences["Scroll Up"] || "";
        if (scrollDownSelect) scrollDownSelect.value = data.gazePreferences["Scroll Down"] || "";
        if (triggerSelect) triggerSelect.value = data.gazePreferences["Trigger or choose"] || "";
      }

      function addDwellOpen(selectElement) {
        if (!selectElement) return;
        let dwellTimer;

        selectElement.addEventListener("mouseenter", () => {
          dwellTimer = setTimeout(() => {
            selectElement.focus();
            selectElement.size = selectElement.options.length;
          }, 7000); 
        });

        selectElement.addEventListener("mouseleave", () => {
          clearTimeout(dwellTimer);
          selectElement.size = 0; 
        });

        selectElement.addEventListener("change", () => {
          selectElement.size = 0; 
        });
      }

      addDwellOpen(scrollLeftSelect);
      addDwellOpen(scrollRightSelect);
      addDwellOpen(scrollUpSelect);
      addDwellOpen(scrollDownSelect);
      addDwellOpen(triggerSelect);
    });
  }

  function showFeedbackBox() {
    if (!feedbackBox) return;
    feedbackBox.textContent = "Preferences saved!";
    feedbackBox.style.display = "block";
    document.body.appendChild(feedbackBox);
    feedbackBox.style.position = "fixed";
    feedbackBox.style.zIndex = "99999";
    const popupContent = document.getElementById("popupContent");

    if (!popupContent) return;
    popupContent.style.filter = "blur(3px)";
    let popupBlurTimer = setTimeout(() => {
      feedbackBox.style.display = "none";
      popupContent.style.filter = "none";
      clearTimeout(popupBlurTimer);
      if (popupOverlay) popupOverlay.style.display = "none";
    }, 1000);
  }

  window.getGazeData = () => {
    console.log("📊 Total gaze points:", allGamesGazeLog.length);
    console.log("🎮 Breakdown by game:");
    console.log("  🦅 Bird:", allGamesGazeLog.filter(d => d.game === "bird").length);
    console.log("  🎯 Target:", allGamesGazeLog.filter(d => d.game === "target").length);
    console.log("  💎 Gem:", allGamesGazeLog.filter(d => d.game === "gem").length);
    return allGamesGazeLog;
  };

  console.log("💡 Tip: Type 'window.getGazeData()' in console to view all collected gaze data");

});