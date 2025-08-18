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


  // tracking calibration
  let calibrationInProgress = false;
  // for target game
  let currentCalibrationPoint = null;

  // Storing gaze data during claibration games
  let gameGazeLog = []
  



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
  const gemDot = createDot("gemDot", "💎✨");


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
    // Wait until gaze is available
    try {
      await waitForValidGaze();
    } catch (err) {
      alert("Camera not ready or gaze data unavailable. Cannot start bird game.");
      return;
    }

    birdDot.style.display = "block";
    const points = Array.from({ length: 15 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    }));
    let index = 0;

    function moveToNextPoint() {
      if (index >= points.length) {
        birdDot.style.display = "none";
        return;
      }

      const startX = parseFloat(birdDot.style.left) || points[index].x;
      const startY = parseFloat(birdDot.style.top) || points[index].y;
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

        birdDot.style.left = `${currentX}px`;
        birdDot.style.top = `${currentY}px`;

        // Collect gaze
        if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
          gameGazeLog.push({
            time: Date.now(),
            gazeX: window.currentGaze.x,
            gazeY: window.currentGaze.y,
            targetX: currentX,
            targetY: currentY,
            game: "bird",
            pointIndex: index
          });
        }

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          index++;
          moveToNextPoint();
        }
      }
      requestAnimationFrame(animate);
    }

    moveToNextPoint();
}

    async function runBirdGame() {
      await waitForValidGaze();
      return new Promise((resolve) => {
        birdDot.style.display = "block";
        const points = Array.from({ length: 15 }, () => ({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        }));
        let index = 0;
      function moveToNextPoint() {
        if (index >= points.length) {
          birdDot.style.display = "none";
          resolve(); 
          return;
        }
        const startX = parseFloat(birdDot.style.left) || points[index].x;
        const startY = parseFloat(birdDot.style.top) || points[index].y;
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
          birdDot.style.left = `${currentX}px`;
          birdDot.style.top = `${currentY}px`;
          if (window.currentGaze && window.currentGaze.x !== null && window.currentGaze.y !== null) {
            const gazeEntry = {
              time: Date.now(),
              gazeX: window.currentGaze.x,
              gazeY: window.currentGaze.y,
              targetX: currentX,
              targetY: currentY,
              game: "bird",
              pointIndex: index
            };
            gameGazeLog.push(gazeEntry);
            console.log("Bird game gaze:", gazeEntry);
          }
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            index++;
            moveToNextPoint();
          }
        }
        requestAnimationFrame(animate);
      }
      moveToNextPoint();
      });
    }






  function runTargetGame() {
    return new Promise((resolve) => {
      targetDot.style.display = "block";
      let moves = 0;

      function move() {
        if (moves >= 5) {
          targetDot.style.display = "none";
          resolve();
          return;
        }
        const x = Math.random() * (window.innerWidth - 100);
        const y = Math.random() * (window.innerHeight - 100);
        targetDot.style.left = `${x}px`;
        targetDot.style.top = `${y}px`;
        targetDot.textContent = "🎯";

        setTimeout(() => {
          targetDot.textContent = "💥";
          setTimeout(() => {
            targetDot.textContent = "🎯";
            moves++;
            move();
          }, 500);
        }, 1000);
      }
      move();
    });
  }

// Start WebGazer and wait until camera is ready
async function startGazeTracker() {
  if (!window.webgazer) {
    alert("WebGazer is not loaded!");
    throw new Error("WebGazer not found");
  }

  try {
    await webgazer
      .setRegression('ridge')
      .setGazeListener((data) => {
        if (data) {
          const x = Math.min(Math.max(data.x, 0), window.innerWidth);
          const y = Math.min(Math.max(data.y, 0), window.innerHeight);

          // store globally for the games
          window.currentGaze = { x, y };

          gazeDot.style.left = `${x - 10}px`;
          gazeDot.style.top = `${y - 10}px`;
          gazeDot.style.display = "block";
        }
      })
      .begin();

    webgazer.showVideo(true).showFaceOverlay(true);

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 25;
      const checkReady = setInterval(() => {
        const prediction = webgazer.getCurrentPrediction();
        attempts++;
        if (prediction) {
          clearInterval(checkReady);
          console.log("Camera ready");
          startTrackingLoop();
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkReady);
          alert("Camera not available. Cannot start calibration games.");
          reject(new Error("Camera not available"));
        }
      }, 200);
    });

  } catch (err) {
    console.error("Camera permission denied or error starting WebGazer:", err);
    alert("Camera access denied. Cannot start calibration games.");
    throw err;
  }
}


// Continuous gaze tracking loop
function startTrackingLoop() {
  function loop() {
    const prediction = webgazer.getCurrentPrediction();
    if (prediction && isFinite(prediction.x) && isFinite(prediction.y)) {
      const x = Math.min(Math.max(prediction.x, 0), window.innerWidth);
      const y = Math.min(Math.max(prediction.y, 0), window.innerHeight);

      gazeDot.style.left = `${x - 10}px`;
      gazeDot.style.top = `${y - 10}px`;
      gazeDot.style.display = "block";

      window.currentGaze = { x, y }; // safe assignment

      if (pathDrawingEnabled) {
        pathCtx.fillStyle = "rgba(255,0,0,0.6)";
        pathCtx.beginPath();
        pathCtx.arc(x, y, 3, 0, 2 * Math.PI);
        pathCtx.fill();
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
}


// Start games only if camera is ready
startGames = async function () {
  if (calibrationInProgress) return;
  calibrationInProgress = true;

  try {
    // will throw if camera fails
    await startGazeTracker(); 
  } catch (err) {
    // stop execution if camera is not available
    calibrationInProgress = false;
    return; 
  }

  // Blur screen for fewer distractions
  if (blurOverlay) {
    blurOverlay.style.display = "block";
    blurOverlay.style.opacity = "1";
  }

  // Run mini-games in sequence
  await runWithPause(runBirdGame);
  await runWithPause(runTargetGame);
  await runWithPause(runGemGame);

  finishGames();
};




  function finishGames() {
    calibrationInProgress = false;
    birdDot.style.display = "none";
    targetDot.style.display = "none";
    gemDot.style.display = "none";
    if (blurOverlay) blurOverlay.style.display = "none";
    pathDrawingEnabled = true;
    alert("Calibration complete! Red dot now shows your real-time gaze with path.");
}


const toggleSwitch = document.getElementById("toggle-switch-popup");
let isTrackingOn = false;

// Start training claibration only when the toggle is turned on
if (toggleSwitch) {
  const savedState = localStorage.getItem('isTrackingOn') === 'true';
  isTrackingOn = savedState;
  toggleSwitch.classList.toggle("active", isTrackingOn);
  if (isTrackingOn) {
    startCalibration();
  }
  toggleSwitch.addEventListener("click", function () {
    isTrackingOn = !isTrackingOn;
    this.classList.toggle("active", isTrackingOn);
    localStorage.setItem('isTrackingOn', isTrackingOn.toString());
    if (isTrackingOn) {
      startCalibration(); 
    } else {

      if (window.webgazer) {
        webgazer.pause();
        console.log("Calibration paused.");
      }
    }
  });
}

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
    if (blurOverlay) blurOverlay.style.display = 'block';
    feedbackBox.textContent = "Preferences saved!";
    feedbackBox.style.display = "block";
    setTimeout(() => {
      feedbackBox.style.display = "none";
      if (blurOverlay) blurOverlay.style.display = "none";
      if (popupOverlay) popupOverlay.style.display = "none";
    }, 1000);
  }
});
