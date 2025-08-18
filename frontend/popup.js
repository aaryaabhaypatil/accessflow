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




// Separate log for the target game
const targetGazeLog = []; 

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

      // Log gaze at spawn
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
        console.log("Target game gaze:", gazeEntry);
      }

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

 // Separate log for the gem game
const gemGazeLog = [];
function runGemGame() {
  return new Promise((resolve) => {
    gemDot.style.display = "block";
    let moves = 0;

    function move() {
      if (moves >= 5) {
        gemDot.style.display = "none";
        resolve();
        return;
      }

      const x = Math.random() * (window.innerWidth - 100);
      const y = Math.random() * (window.innerHeight - 100);
      gemDot.style.left = `${x}px`;
      gemDot.style.top = `${y}px`;
      gemDot.textContent = "💎"; 

      // Log gaze at spawn
      if (window.currentGaze && window.currentGaze.x !== null && window.currentGaze.y !== null) {
        const gazeEntry = {
          time: Date.now(),
          gazeX: window.currentGaze.x,
          gazeY: window.currentGaze.y,
          targetX: x,
          targetY: y,
          game: "gem",
          moveIndex: moves
        };
        gemGazeLog.push(gazeEntry);
        console.log("Gem game gaze:", gazeEntry);
      }

      setTimeout(() => {
        gemDot.textContent = "✨"; 
        setTimeout(() => {
          gemDot.textContent = "💎";
          moves++;
          move();
        }, 500);
      }, 1000);
    }

    move();
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

      // Draw gaze path
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

      window.currentGaze = { x, y }; 

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
  startPostCalibrationGazeTracing();
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


   async function startCalibration() {
     window.initGazeDot();
     window.currentGaze = { x: 0, y: 0 };
     const dataset = [];
     const stored = localStorage.getItem("gazeDataset");
     if (stored) {
         dataset.push(...JSON.parse(stored));
     }


     let correctionModel = null;
     let calibrationDone = false;
     const gazePath = [];
     const smoothFactor = 0.2;
     let smoothedGaze = { x: 0, y: 0 };
     const gazeHistory = [];
     const historyLength = 5;


     //Functions to get accurate gaze data
     function getSmoothedGaze(rawGaze) {
         smoothedGaze.x = smoothedGaze.x * (1 - smoothFactor) + rawGaze.x * smoothFactor;
         smoothedGaze.y = smoothedGaze.y * (1 - smoothFactor) + rawGaze.y * smoothFactor;
         return { ...smoothedGaze };
     }
     function getMedianGaze(rawGaze) {
         gazeHistory.push(rawGaze);
         if (gazeHistory.length > historyLength) gazeHistory.shift();
         const xs = gazeHistory.map(p => p.x).sort((a, b) => a - b);
         const ys = gazeHistory.map(p => p.y).sort((a, b) => a - b);
         return { x: xs[Math.floor(xs.length / 2)], y: ys[Math.floor(ys.length / 2)] };
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


     await webgazer.setRegression('ridge')
    .setTracker('clmtrackr')
    .setGazeListener((data) => {
        if (!data || !isFinite(data.x) || !isFinite(data.y)) {
            window.currentGaze = { x: 0, y: 0 };
            return;
        }

        let raw = { x: data.x, y: data.y };

        // ✅ apply calibration correction if available
        if (correctionModel) {
            const [a, b, c, d, e, f] = correctionModel;
            raw = {
                x: a * raw.x + b * raw.y + c,
                y: d * raw.x + e * raw.y + f
            };
        }

        // ✅ apply smoothing + jump limiting
        const filtered = getMedianGaze(raw);
        const smooth = getSmoothedGaze(filtered);
        const limited = limitJump(window.currentGaze, smooth);

        // ✅ always feed the unified global gaze
        window.currentGaze = limited;

        // keep gaze dot updated
        window.updateGazeDot();
    })
    .begin();



     webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);


     const dot = document.createElement("div");
     dot.style.position = "fixed";
     dot.style.width = "50px";
     dot.style.height = "50px";
     dot.style.background = "blue";
     dot.style.borderRadius = "50%";
     dot.style.zIndex = "9999";
     document.body.appendChild(dot);


     const dotGaze = document.createElement("div");
     dotGaze.style.position = "fixed";
     dotGaze.style.width = "20px";
     dotGaze.style.height = "20px";
     dotGaze.style.background = "red";
     dotGaze.style.borderRadius = "50%";
     dotGaze.style.zIndex = "10002";
     dotGaze.style.pointerEvents = "none";
     document.body.appendChild(dotGaze);


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


     const coordDisplay = document.createElement("div");
     coordDisplay.style.position = "fixed";
     coordDisplay.style.top = "10px";
     coordDisplay.style.left = "10px";
     coordDisplay.style.background = "rgba(0,0,0,0.5)";
     coordDisplay.style.color = "white";
     coordDisplay.style.padding = "5px 10px";
     coordDisplay.style.borderRadius = "5px";
     coordDisplay.style.zIndex = "10001";
     document.body.appendChild(coordDisplay);


     const rows = 7, cols = 9;
     const positions = [];
     const screenWidth = window.innerWidth, screenHeight = window.innerHeight;
     for (let i = 0; i < rows; i++)
         for (let j = 0; j < cols; j++)
             positions.push({ x: (j + 0.5) * (screenWidth / cols), y: (i + 0.5) * (screenHeight / rows) });


     let current = 0;
     const calibrationPairs = [];


     function getMedian(values) {
         if (!values.length) return null;
         values.sort((a, b) => a - b);
         const mid = Math.floor(values.length / 2);
         return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
     }


     function filterOutliers(samples, threshold = 150) {
         if (!samples.length) return samples;
         const meanX = samples.reduce((a, s) => a + s.x, 0) / samples.length;
         const meanY = samples.reduce((a, s) => a + s.y, 0) / samples.length;
         return samples.filter(s => Math.hypot(s.x - meanX, s.y - meanY) < threshold);
     }


     function fitAffineModel(pairs) {
         if (pairs.length < 3) return [1, 0, 0, 0, 1, 0];
         const X = [], Y = [];
         for (let p of pairs) {
             X.push([p.gazeX, p.gazeY, 1, 0, 0, 0]); Y.push(p.dotX);
             X.push([0, 0, 0, p.gazeX, p.gazeY, 1]); Y.push(p.dotY);
         }
         function transpose(mat) { return mat[0].map((_, col) => mat.map(row => row[col])); }
         function multiply(a, b) {
             const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
             for (let i = 0; i < a.length; i++) for (let j = 0; j < b[0].length; j++) for (let k = 0; k < b.length; k++)
                 result[i][j] += a[i][k] * b[k][j];
             return result;
         }
         function invertMatrix(m) {
             const n = m.length;
             const I = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => i === j ? 1 : 0));
             for (let i = 0; i < n; i++) {
                 let diag = m[i][i]; for (let j = 0; j < n; j++) { m[i][j] /= diag; I[i][j] /= diag; }
                 for (let k = 0; k < n; k++) { if (k === i) continue; let factor = m[k][i]; for (let j = 0; j < n; j++) { m[k][j] -= factor * m[i][j]; I[k][j] -= factor * I[i][j]; } }
             }
             return I;
         }
         const XT = transpose(X), XTX = multiply(XT, X), XTY = multiply(XT, Y.map(v => [v])), XTXinv = invertMatrix(XTX);
         const coeffs = multiply(XTXinv, XTY);
         return coeffs.map(v => v[0]);
     }


     function moveDot() {
         if (current >= positions.length) {
             correctionModel = fitAffineModel(calibrationPairs);
             dot.style.display = "none";
             calibrationDone = true;
             alert("Calibration finished!");
             saveDataset();
             return;
         }


         const pos = positions[current];
         dot.style.left = `${pos.x - 25}px`;
         dot.style.top = `${pos.y - 25}px`;


         const samples = [];
         const interval = setInterval(() => {
             if (currentGaze) samples.push({ x: currentGaze.x, y: currentGaze.y });
         }, 100);


         setTimeout(() => {
             clearInterval(interval);
             if (samples.length > 0) {
                 const filtered = filterOutliers(samples, 150);
                 const medianX = getMedian(filtered.map(s => s.x));
                 const medianY = getMedian(filtered.map(s => s.y));
                 calibrationPairs.push({ gazeX: medianX, gazeY: medianY, dotX: pos.x, dotY: pos.y });


                 samples.forEach(s => {
                     dataset.push({
                         rawX: s.x,
                         rawY: s.y,
                         screenX: pos.x,
                         screenY: pos.y
                     });
                 });
                 localStorage.setItem("gazeDataset", JSON.stringify(dataset));
             }
             current++;
             moveDot();
         }, 2000);
     }

     function traceGazePath() {
        if (window.currentGaze) {
            window.dotGaze.style.left = `${window.currentGaze.x - 10}px`;
            window.dotGaze.style.top = `${window.currentGaze.y - 10}px`;

            if (calibrationDone) {
                const last = gazePath[gazePath.length - 1];
                const current = window.currentGaze;

                ctx.fillStyle = "limegreen";
                ctx.beginPath();
                ctx.arc(current.x, current.y, 3, 0, 2 * Math.PI);
                ctx.fill();

                if (last) {
                    ctx.beginPath();
                    ctx.strokeStyle = "limegreen";
                    ctx.lineWidth = 2;
                    ctx.moveTo(last.x, last.y);
                    ctx.lineTo(current.x, current.y);
                    ctx.stroke();
                }

                gazePath.push({ x: current.x, y: current.y });
                coordDisplay.innerText = `Gaze: (${current.x.toFixed(1)}, ${current.y.toFixed(1)})`;
            }
        }
        requestAnimationFrame(traceGazePath);
    }



     async function saveDataset() {
         const chunkSize = 1000;
         for (let i = 0; i < dataset.length; i += chunkSize) {
             const chunk = dataset.slice(i, i + chunkSize);
             try {
                 const res = await fetch('http://localhost:3000/save-gaze', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(chunk)
                 });
                 if (!res.ok) throw new Error('Failed to save');
             } catch (err) {
                 console.error('❌ Failed to save chunk:', err);
             }
         }
         console.log('All chunks sent successfully!');
     }


     moveDot();     
     traceGazePath();
 }








  
});
