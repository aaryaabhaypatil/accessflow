
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

  // To open up the setting
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  // Closing the settings
  const closeBtn = document.getElementById("closeBtn");
  // Visual feedback after saving preferences
  const feedbackBox = document.getElementById("feedbackBox");
  // Blurring background for calibration and preferences feedback
  const blurOverlay = document.getElementById("blurOverlay");
  // For calibration games
  const calibrateBtn = document.getElementById("calibrateBtn");
  // For training data calibration
  const toggle = document.querySelector(".toggle-switch-popup");
  // Pausing calibration
  const pauseBtn = document.getElementById("pauseCalibrationBtn");
  //Resume calibration
  const resumeBtn = document.getElementById("resumeCalibrationBtn");

  console.log("Screen size:", window.screen.width, window.screen.height);
  console.log("Viewport size:", window.innerWidth, window.innerHeight);

  // tracking calibration
  let calibrationInProgress = false;
  // for target game
  let currentCalibrationPoint = null;

  // Storing gaze data during claibration games
//   let gameGazeLog = []
//  function mapGazeToScreen(gaze, video) {
//     if (!video || video.videoWidth === 0 || video.videoHeight === 0) return { x: 0, y: 0 };
//     const videoAR = video.videoWidth / video.videoHeight;
//     const screenAR = window.innerWidth / window.innerHeight;
//     let scale, offsetX = 0, offsetY = 0;

//     if (screenAR > videoAR) {
//         // Screen is wider than video
//         scale = window.innerHeight / video.videoHeight;
//         offsetX = (window.innerWidth - video.videoWidth * scale) / 2;
//     } else {
//         // Screen is taller than video
//         scale = window.innerWidth / video.videoWidth;
//         offsetY = (window.innerHeight - video.videoHeight * scale) / 2;
//     }

//     return {
//         x: Math.min(Math.max(gaze.x * scale + offsetX, 0), window.innerWidth),
//         y: Math.min(Math.max(gaze.y * scale + offsetY, 0), window.innerHeight)
//     };
// }






  // Canvas for drawing gaze path
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




  // Start camera as soon as the extension is on
  initGazeTracking();



  // Calibration dot as emojis for the games
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

  const birdDot = createDot("birdDot", "🐦");
  const targetDot = createDot("targetDot", "🎯");
  const gemDot = createDot("gemDot", "💎");


  // To track users gaze during gamified calibration
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

let gameGazeLog = [];

function mapGazeToScreen(gaze, video) {
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        return { x: 0, y: 0 };
    }

    // Flip X if video is mirrored
    const rawX = video.mirror ? video.videoWidth - gaze.x : gaze.x;
    const rawY = gaze.y;

    // Scale to actual displayed video size
    const scaleX = video.clientWidth / video.videoWidth;
    const scaleY = video.clientHeight / video.videoHeight;

    // Get video element position on page
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
        let storyMessage = document.createElement("div");
        Object.assign(storyMessage.style, {
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "24px",
            color: "gold",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: "20001",
        });
        document.body.appendChild(storyMessage);

        const storyLines = [
            "A gentle breeze flows through the forest…",
            "A mysterious bird flutters into view.",
            "Follow the bird carefully — it knows the way forward."
        ];

        await new Promise(res => setTimeout(res, 2000));

        for (let i = 0; i < storyLines.length; i++) {
            storyMessage.textContent = storyLines[i];
            await new Promise(res => setTimeout(res, 5000));
        }

        if (storyMessage.parentNode) storyMessage.remove();

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
                background: "conic-gradient(rgba(0,150,255,0.8) 0%, rgba(0,150,255,0.3) 0%)",
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
                rgba(0,150,255,0.8) ${percentage}%,
                rgba(0,150,255,0.3) ${percentage}%
            )`;
        }

        function moveToNextPoint() {
            if (index >= points.length) {
                birdContainer.style.display = "none";
                console.log("Collected gaze coordinates:", gameGazeLog);
                resolve();
                return;
            }

            const startX = parseFloat(birdContainer.style.left) || points[index].x;
            const startY = parseFloat(birdContainer.style.top) || points[index].y;
            const endX = points[index].x;
            const endY = points[index].y;
            const duration = 4000;
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
                    // Use the corrected mapping function
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
                    gameGazeLog.push(gazeEntry);
                    console.log("GazeX:", gazeEntry.gazeX, "GazeY: ",gazeEntry.gazeY, "TargetX: ", gazeEntry.targetX, "TargetY: ", gazeEntry.targetY);
                }

                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    updateProgressRing(index);

                    const pulseDuration = 1000; 
                    const pulseStart = performance.now();
                    function pulse(time) {
                        const elapsedPulse = time - pulseStart;
                        const pulseT = Math.min(elapsedPulse / pulseDuration, 1);
                        const scale = 0.7 + 0.6 * Math.sin(pulseT * Math.PI); 
                        birdDot.style.transform = `translate(-50%, -50%) scale(${scale})`;

                        if (pulseT < 1) {
                            requestAnimationFrame(pulse);
                        } else {
                            index++;
                            moveToNextPoint();
                        }
                    }
                    requestAnimationFrame(pulse);
                }
            }

            requestAnimationFrame(animate);
        }

        moveToNextPoint();
    });
}









const targetGazeLog = []; 

function runTargetGame() {
  return new Promise(async (resolve) => {
    // Story message container
    let storyMessage = document.createElement("div");
    Object.assign(storyMessage.style, {
      position: "absolute",
      top: "10%",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "24px",
      color: "gold",
      fontWeight: "bold",
      textAlign: "center",
      zIndex: "20001",
    });
    document.body.appendChild(storyMessage);

    const storyLines = [
      "The bird vanishes into the shadows, leaving an unsettling silence in the clearing…",
      "Targets suddenly appear around you — can you hit them all before they disappear?",
      "Strike carefully — your focus guides the way to the hidden gems beyond."
    ];


    await new Promise(res => setTimeout(res, 2000));


    for (let i = 0; i < storyLines.length; i++) {
      storyMessage.textContent = storyLines[i];
      await new Promise(res => setTimeout(res, 6000));
    }

    if (storyMessage.parentNode) storyMessage.remove();


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
      targetDot.innerHTML = `<div style="position: relative; display: inline-block;">
        <span style="font-size: 300px; display: block;">💥</span>
      </div>`;
    }

    async function move() {
      while (gamesPaused) {
        await new Promise(resume => currentGameResolver = resume);
      }

      if (moves >= totalPoints) {
        targetDot.style.display = "none";
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
        targetGazeLog.push(gazeEntry);
      }

      setTimeout(() => {
        targetDot.style.transform = `scale(${baseScale * 0.6})`; 
      }, 100);

      setTimeout(async () => {
        renderExplosion();
        setTimeout(async () => {
          moves++;
          if (moves < totalPoints) renderTarget(totalPoints - moves);
          await move();
        }, 800);
      }, 1000);
    }

    move();
  });
}











const gemGazeLog = [];
function runGemGame() {
  return new Promise((resolve) => {

    // Story message
    let storyMessage = document.createElement("div");
    Object.assign(storyMessage.style, {
      position: "absolute",
      top: "10%",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "24px",
      color: "gold",
      fontWeight: "bold",
      textAlign: "center",
      zIndex: "20001",
    });
    document.body.appendChild(storyMessage);

    // Cave overlay
    let caveOverlay = document.createElement("div");
    Object.assign(caveOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "black",
      opacity: "0.9",
      transition: "opacity 1s ease",
      zIndex: "1000", // lower than other interactive elements
    });
    document.body.appendChild(caveOverlay);


    // Cave door emoji
    let caveEmoji = document.createElement("div");
    caveEmoji.textContent = "🚪"; 
    Object.assign(caveEmoji.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "200px",
      opacity: "0.2",
      filter: "blur(3px)",
      transition: "opacity 1s ease, filter 1s ease",
      zIndex: "20002",
    });
    document.body.appendChild(caveEmoji);

    // Achievement emoji
    let achievement = document.createElement("div");
    achievement.textContent = "🏆";
    Object.assign(achievement.style, {
      position: "absolute",
      top: "55%",
      left: "50%",
      transform: "translate(-50%, -50%) scale(0.5)",
      fontSize: "80px",
      opacity: "0",
      transition: "opacity 1s, transform 1s",
      zIndex: "20003",
    });
    document.body.appendChild(achievement);

    // Updated story lines
    const storyLines = [
      "Well done! You’ve unlocked the path to a hidden cave…",
      "Gems glimmer faintly in the darkness.",
      "Keep your eyes on them, and watch as the cave slowly brightens.",
      "The entrance finally opens, revealing the treasure within!"
    ];

    async function showStoryLines() {
      // Wait 2 seconds before showing instructions
      await new Promise(r => setTimeout(r, 2000));

      for (let i = 0; i < storyLines.length; i++) {
        storyMessage.textContent = storyLines[i];
        caveOverlay.style.opacity = String(0.9 - i * 0.2);
        await new Promise(r => setTimeout(r, 5000));
      }

      caveOverlay.style.opacity = "0";
      setTimeout(() => {
        if (caveOverlay.parentNode) caveOverlay.remove();
        if (storyMessage.parentNode) storyMessage.remove();

        startGemGame(resolve);
      }, 1000);
    }

    function startGemGame(done) {
      let moves = 0;
      const totalMoves = 30;
      gemDot.style.display = "block";

      async function move() {
        if (moves >= totalMoves) {
          gemDot.style.display = "none";
          if (caveEmoji.parentNode) caveEmoji.remove();
          achievement.style.opacity = "1";
          achievement.style.transform = "translate(-50%, -50%) scale(1)";
          setTimeout(() => {
            achievement.style.opacity = "0";
            achievement.style.transform = "translate(-50%, -50%) scale(0.5)";
            done();
          }, 1500);
          return;
        }

        const dotSize = 100; 
        const margin = 10;

        const x = margin + Math.random() * (window.innerWidth - dotSize - margin * 2);
        const y = margin + Math.random() * (window.innerHeight - dotSize - margin * 2);

        gemDot.style.left = `${x}px`;
        gemDot.style.top = `${y}px`;
        gemDot.textContent = "💎";


        const progress = moves / totalMoves;
        const glowStrength = Math.floor(10 + progress * 40);
        gemDot.style.filter = `drop-shadow(0 0 ${glowStrength}px gold)`;
        gemDot.style.transition = "filter 0.4s ease";

        caveEmoji.style.opacity = String(0.2 + progress * 0.8);
        caveEmoji.style.filter = `blur(${3 - progress * 3}px)`;

        if (window.currentGaze && window.currentGaze.x !== null && window.currentGaze.y !== null) {
          gemGazeLog.push({
            time: Date.now(),
            gazeX: window.currentGaze.x,
            gazeY: window.currentGaze.y,
            targetX: x,
            targetY: y,
            game: "gem",
            moveIndex: moves,
          });
        }

        setTimeout(async () => {
          gemDot.textContent = "✨";
          setTimeout(async () => {
            gemDot.textContent = "💎";
            moves++;
            await move();
          }, 500);
        }, 1000);
      }

      move();
    }

    showStoryLines();
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
      ctx.arc(last.x, last.y, 6, 0, 2 * Math.PI);
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

          window.dotGaze.style.left = `${smoothed.x - 10}px`;
          window.dotGaze.style.top = `${smoothed.y - 10}px`;
        })
        .begin();


      debugWebGazerDot();

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
      // console.log(`Brightness: ${avgBrightness}`);
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



// Start games only if camera is ready
async function startGames() {
  if (calibrationInProgress) return;
  calibrationInProgress = true;

  hideGazeDots(); // Hide dots at start

  try {
    await startGazeTracker();
  } catch (err) {
    calibrationInProgress = false;
    return;
  }

  if (blurOverlay) blurOverlay.classList.add("active");

  // await runWithPause(runBirdGame);
  // await runWithPause(runTargetGame);
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
  pathDrawingEnabled = true;


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
  message.textContent = "Calibration complete! The red dot now shows your real-time gaze with path.";
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

// Start training claibration only when the toggle is turned on
// if (toggleSwitch) {
//   const savedState = localStorage.getItem('isTrackingOn') === 'true';
//   isTrackingOn = savedState;
//   toggleSwitch.classList.toggle("active", isTrackingOn);
//   if (isTrackingOn) {
//     startCalibration();
//   }
//   toggleSwitch.addEventListener("click", function () {
//     isTrackingOn = !isTrackingOn;
//     this.classList.toggle("active", isTrackingOn);
//     localStorage.setItem('isTrackingOn', isTrackingOn.toString());
//     if (isTrackingOn) {
//       startCalibration(); 
//     } else {

//       if (window.webgazer) {
//         webgazer.pause();
//         console.log("Calibration paused.");
//       }
//     }
//   });
// }

// Start user calibration games if clicked on calibrate button
if (calibrateBtn) {
  calibrateBtn.addEventListener("click", () => {
    startGames(); 
  });
}

let gamesPaused = false;
let currentGameResolver = null;
// Pausing caliration games
function pauseGames() {
  gamesPaused = true;
  console.log("Calibration games paused.");
}
// Resuming calibraiton games
function resumeGames() {
  if (!gamesPaused) return;
  gamesPaused = false;
  console.log("Calibration games resumed.");

  // If a game was waiting, continue it
  if (currentGameResolver) {
    currentGameResolver();
    currentGameResolver = null;
  }
}
if (pauseBtn) pauseBtn.addEventListener("click", pauseGames);
if (resumeBtn) resumeBtn.addEventListener("click", resumeGames);


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
    correctionModel = JSON.parse(storedModel); // [a, b, c, d, e, f]
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
  // Click event (existing)
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

});