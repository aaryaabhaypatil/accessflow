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
  let gameGazeLog = []
  function mapGazeToScreen(gaze, video) {
    // Map from video coordinates to window coordinates
    return {
        x: Math.min(Math.max(gaze.x / video.videoWidth * window.innerWidth, 0), window.innerWidth),
        y: Math.min(Math.max(gaze.y / video.videoHeight * window.innerHeight, 0), window.innerHeight)
    };
  }




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

async function runBirdGame() {
// Reusable popup function
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
          const gazeEntry = {
            time: Date.now(),
            gazeX: window.currentGaze.x,
            gazeY: window.currentGaze.y,
            targetX: currentX,
            targetY: currentY,
            game: "bird",
            pointIndex: index,
          };
          gameGazeLog.push(gazeEntry);
        }

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          updateProgressRing(index);

          const pulseDuration = 500; 
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
      await new Promise(res => setTimeout(res, 5000));
    }

    if (storyMessage.parentNode) storyMessage.remove();


    targetDot.style.display = "block";
    let moves = 0;
    const baseScale = 0.7; 
    const totalPoints = 30;

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
      }, 50);

      setTimeout(async () => {
        renderExplosion();
        setTimeout(async () => {
          moves++;
          if (moves < totalPoints) renderTarget(totalPoints - moves);
          await move();
        }, 500);
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
















const postCalibrationGazePath = []; // Separate path for after calibration

function startPostCalibrationGazeTracing() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.zIndex = "10000";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const gazeHistory = [];
  const historyLength = 5;
  const smoothFactor = 0.2;
  let smoothedGaze = { x: 0, y: 0 };

  function getMedianGaze(rawGaze) {
    gazeHistory.push(rawGaze);
    if (gazeHistory.length > historyLength) gazeHistory.shift();
    const xs = gazeHistory.map(p => p.x).sort((a, b) => a - b);
    const ys = gazeHistory.map(p => p.y).sort((a, b) => a - b);
    return { x: xs[Math.floor(xs.length / 2)], y: ys[Math.floor(ys.length / 2)] };
  }

  function getSmoothedGaze(rawGaze) {
    smoothedGaze.x = smoothedGaze.x * (1 - smoothFactor) + rawGaze.x * smoothFactor;
    smoothedGaze.y = smoothedGaze.y * (1 - smoothFactor) + rawGaze.y * smoothFactor;
    return { ...smoothedGaze };
  }

  function limitJump(lastPoint, newPoint, maxDistance = 100) {
    if (!lastPoint) return newPoint;
    const dx = newPoint.x - lastPoint.x;
    const dy = newPoint.y - lastPoint.y;
    const distance = Math.hypot(dx, dy);
    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      return { x: lastPoint.x + dx * ratio, y: lastPoint.y + dy * ratio };
    }
    return newPoint;
  }

  function trace() {
    if (window.currentGaze && window.currentGaze.x !== null && window.currentGaze.y !== null) {
      let last = postCalibrationGazePath[postCalibrationGazePath.length - 1];
      const filtered = getMedianGaze(window.currentGaze);
      const smooth = getSmoothedGaze(filtered);
      const limited = limitJump(last, smooth);


      ctx.fillStyle = "cyan";
      ctx.beginPath();
      ctx.arc(limited.x, limited.y, 3, 0, 2 * Math.PI);
      ctx.fill();

      if (last) {
        ctx.beginPath();
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2;
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(limited.x, limited.y);
        ctx.stroke();
      }

      postCalibrationGazePath.push({ x: limited.x, y: limited.y });
    }
    requestAnimationFrame(trace);
  }

  trace();
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

  await runWithPause(runBirdGame);
  await runWithPause(runTargetGame);
  await runWithPause(runGemGame);

  finishGames();
  startPostCalibrationGazeTracing();

  showGazeDots(); // Show dots after games
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
  openPopupBtn.addEventListener("click", () => popupOverlay.style.display = "flex");
}
if (closeBtn && popupOverlay) {
  closeBtn.addEventListener("click", () => popupOverlay.style.display = "none");
}
  // Settings values
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
    });
  }
  // Visual feedback when settings are saved
  function showFeedbackBox() {
    if (!feedbackBox) return;
    // if (blurOverlay) blurOverlay.style.display = 'block';
    feedbackBox.textContent = "Preferences saved!";
    feedbackBox.style.display = "block";
    setTimeout(() => {
      feedbackBox.style.display = "none";
      // if (blurOverlay) blurOverlay.style.display = "none";
      if (popupOverlay) popupOverlay.style.display = "none";
    }, 1000);
  }


//    async function startCalibration() {
//      window.initGazeDot();
//      window.currentGaze = { x: 0, y: 0 };
//      const dataset = [];
//      const stored = localStorage.getItem("gazeDataset");
//      if (stored) {
//          dataset.push(...JSON.parse(stored));
//      }


//      let correctionModel = null;
//      let calibrationDone = false;
//      const gazePath = [];
//      const smoothFactor = 0.2;
//      let smoothedGaze = { x: 0, y: 0 };
//      const gazeHistory = [];
//      const historyLength = 5;


//      //Functions to get accurate gaze data
//      function getSmoothedGaze(rawGaze) {
//          smoothedGaze.x = smoothedGaze.x * (1 - smoothFactor) + rawGaze.x * smoothFactor;
//          smoothedGaze.y = smoothedGaze.y * (1 - smoothFactor) + rawGaze.y * smoothFactor;
//          return { ...smoothedGaze };
//      }
//      function getMedianGaze(rawGaze) {
//          gazeHistory.push(rawGaze);
//          if (gazeHistory.length > historyLength) gazeHistory.shift();
//          const xs = gazeHistory.map(p => p.x).sort((a, b) => a - b);
//          const ys = gazeHistory.map(p => p.y).sort((a, b) => a - b);
//          return { x: xs[Math.floor(xs.length / 2)], y: ys[Math.floor(ys.length / 2)] };
//      }
//      function limitJump(lastPoint, newPoint, maxDistance = 100) {
//          if (!lastPoint) return newPoint;
//          const dx = newPoint.x - lastPoint.x;
//          const dy = newPoint.y - lastPoint.y;
//          const distance = Math.hypot(dx, dy);
//          if (distance > maxDistance) {
//              const ratio = maxDistance / distance;
//              return { x: lastPoint.x + dx * ratio, y: lastPoint.y + dy * ratio };
//          }
//          return newPoint;
//      }


//      await webgazer.setRegression('ridge')
//     .setTracker('clmtrackr')
//     .setGazeListener((data) => {
//         if (!data || !isFinite(data.x) || !isFinite(data.y)) {
//             window.currentGaze = { x: 0, y: 0 };
//             return;
//         }

//         let raw = mapGazeToScreen(data, video);

//         // ✅ apply calibration correction if available
        
//         if (correctionModel) {
//           const [a, b, c, d, e, f] = correctionModel;
//           const corrected = {
//               x: a * raw.x + b * raw.y + c,
//               y: d * raw.x + e * raw.y + f
//           };
//           console.log("Raw gaze:", raw, "Corrected gaze:", corrected); // <-- NEW
//           window.currentGaze = corrected;
//         } else {
//             window.currentGaze = raw;
//         }

//         // ✅ apply smoothing + jump limiting
//         const filtered = getMedianGaze(raw);
//         const smooth = getSmoothedGaze(filtered);
//         const limited = limitJump(window.currentGaze, smooth);

//         // ✅ always feed the unified global gaze
//         window.currentGaze = limited;

//         // keep gaze dot updated
//         window.updateGazeDot();
//     })
//     .begin();



//      webgazer.showVideo(true).showFaceOverlay(false).showFaceFeedbackBox(false);


//      const dot = document.createElement("div");
//      dot.style.position = "fixed";
//      dot.style.width = "50px";
//      dot.style.height = "50px";
//      dot.style.background = "blue";
//      dot.style.borderRadius = "50%";
//      dot.style.zIndex = "9999";
//      document.body.appendChild(dot);


//      const dotGaze = document.createElement("div");
//      dotGaze.style.position = "fixed";
//      dotGaze.style.width = "20px";
//      dotGaze.style.height = "20px";
//      dotGaze.style.background = "red";
//      dotGaze.style.borderRadius = "50%";
//      dotGaze.style.zIndex = "10002";
//      dotGaze.style.pointerEvents = "none";
//      document.body.appendChild(dotGaze);


//      const canvas = document.createElement("canvas");
//      canvas.width = window.innerWidth;
//      canvas.height = window.innerHeight;
//      canvas.style.position = "fixed";
//      canvas.style.left = "0";
//      canvas.style.top = "0";
//      canvas.style.zIndex = "10000";
//      canvas.style.pointerEvents = "none";
//      document.body.appendChild(canvas);
//      const ctx = canvas.getContext("2d");


//      const coordDisplay = document.createElement("div");
//      coordDisplay.style.position = "fixed";
//      coordDisplay.style.top = "10px";
//      coordDisplay.style.left = "10px";
//      coordDisplay.style.background = "rgba(0,0,0,0.5)";
//      coordDisplay.style.color = "white";
//      coordDisplay.style.padding = "5px 10px";
//      coordDisplay.style.borderRadius = "5px";
//      coordDisplay.style.zIndex = "10001";
//      document.body.appendChild(coordDisplay);


//      const rows = 7, cols = 9;
//      const positions = [];
//      const screenWidth = window.innerWidth, screenHeight = window.innerHeight;
//      for (let i = 0; i < rows; i++)
//          for (let j = 0; j < cols; j++)
//              positions.push({ x: (j + 0.5) * (screenWidth / cols), y: (i + 0.5) * (screenHeight / rows) });


//      let current = 0;
//      const calibrationPairs = [];


//      function getMedian(values) {
//          if (!values.length) return null;
//          values.sort((a, b) => a - b);
//          const mid = Math.floor(values.length / 2);
//          return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
//      }


//      function filterOutliers(samples, threshold = 150) {
//          if (!samples.length) return samples;
//          const meanX = samples.reduce((a, s) => a + s.x, 0) / samples.length;
//          const meanY = samples.reduce((a, s) => a + s.y, 0) / samples.length;
//          return samples.filter(s => Math.hypot(s.x - meanX, s.y - meanY) < threshold);
//      }


//      function fitAffineModel(pairs) {
//          if (pairs.length < 3) return [1, 0, 0, 0, 1, 0];
//          const X = [], Y = [];
//          for (let p of pairs) {
//              X.push([p.gazeX, p.gazeY, 1, 0, 0, 0]); Y.push(p.dotX);
//              X.push([0, 0, 0, p.gazeX, p.gazeY, 1]); Y.push(p.dotY);
//          }
//          function transpose(mat) { return mat[0].map((_, col) => mat.map(row => row[col])); }
//          function multiply(a, b) {
//              const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
//              for (let i = 0; i < a.length; i++) for (let j = 0; j < b[0].length; j++) for (let k = 0; k < b.length; k++)
//                  result[i][j] += a[i][k] * b[k][j];
//              return result;
//          }
//          function invertMatrix(m) {
//              const n = m.length;
//              const I = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => i === j ? 1 : 0));
//              for (let i = 0; i < n; i++) {
//                  let diag = m[i][i]; for (let j = 0; j < n; j++) { m[i][j] /= diag; I[i][j] /= diag; }
//                  for (let k = 0; k < n; k++) { if (k === i) continue; let factor = m[k][i]; for (let j = 0; j < n; j++) { m[k][j] -= factor * m[i][j]; I[k][j] -= factor * I[i][j]; } }
//              }
//              return I;
//          }
//          const XT = transpose(X), XTX = multiply(XT, X), XTY = multiply(XT, Y.map(v => [v])), XTXinv = invertMatrix(XTX);
//          const coeffs = multiply(XTXinv, XTY);
//          return coeffs.map(v => v[0]);
//      }


//      function moveDot() {
//          if (current >= positions.length) {
//              correctionModel = fitAffineModel(calibrationPairs);
//              console.log("Affine correction coefficients:", correctionModel);
//              dot.style.display = "none";
//              calibrationDone = true;
//              alert("Calibration finished!");
//              saveDataset();
//              return;
//          }


//          const pos = positions[current];
//          dot.style.left = `${pos.x - 25}px`;
//          dot.style.top = `${pos.y - 25}px`;


//          const samples = [];
//          const interval = setInterval(() => {
//              if (currentGaze) samples.push({ x: currentGaze.x, y: currentGaze.y });
//          }, 100);


//          setTimeout(() => {
//              clearInterval(interval);
//              if (samples.length > 0) {
//                  const filtered = filterOutliers(samples, 150);
//                  const medianX = getMedian(filtered.map(s => s.x));
//                  const medianY = getMedian(filtered.map(s => s.y));
//                  calibrationPairs.push({ gazeX: medianX, gazeY: medianY, dotX: pos.x, dotY: pos.y });


//                  samples.forEach(s => {
//                      console.log("Raw gaze sample:", s); // <-- NEW
//                      console.log("Calibration pair (median filtered):", { medianX, medianY, dotX: pos.x, dotY: pos.y });
//                      dataset.push({
//                          rawX: s.x,
//                          rawY: s.y,
//                          screenX: pos.x,
//                          screenY: pos.y
//                      });
//                  });
//                  localStorage.setItem("gazeDataset", JSON.stringify(dataset));
//              }
//              current++;
//              moveDot();
//          }, 2000);
//      }

//      function traceGazePath() {
//         if (window.currentGaze) {
//             window.dotGaze.style.left = `${window.currentGaze.x - 10}px`;
//             window.dotGaze.style.top = `${window.currentGaze.y - 10}px`;

//             if (calibrationDone) {
//                 const last = gazePath[gazePath.length - 1];
//                 const current = window.currentGaze;

//                 ctx.fillStyle = "limegreen";
//                 ctx.beginPath();
//                 ctx.arc(current.x, current.y, 3, 0, 2 * Math.PI);
//                 ctx.fill();

//                 if (last) {
//                     ctx.beginPath();
//                     ctx.strokeStyle = "limegreen";
//                     ctx.lineWidth = 2;
//                     ctx.moveTo(last.x, last.y);
//                     ctx.lineTo(current.x, current.y);
//                     ctx.stroke();
//                 }

//                 gazePath.push({ x: current.x, y: current.y });
//                 coordDisplay.innerText = `Gaze: (${current.x.toFixed(1)}, ${current.y.toFixed(1)})`;
//             }
//         }
//         requestAnimationFrame(traceGazePath);
//     }



//      async function saveDataset() {
//          const chunkSize = 1000;
//          for (let i = 0; i < dataset.length; i += chunkSize) {
//              const chunk = dataset.slice(i, i + chunkSize);
//              try {
//                  const res = await fetch('http://localhost:3000/save-gaze', {
//                      method: 'POST',
//                      headers: { 'Content-Type': 'application/json' },
//                      body: JSON.stringify(chunk)
//                  });
//                  if (!res.ok) throw new Error('Failed to save');
//              } catch (err) {
//                  console.error('❌ Failed to save chunk:', err);
//              }
//          }
//          console.log('All chunks sent successfully!');
//      }


//      moveDot();     
//      traceGazePath();
//  }
});