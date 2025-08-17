


document.addEventListener("DOMContentLoaded", function () {
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const feedbackBox = document.getElementById("feedbackBox");
  const blurOverlay = document.getElementById("blurOverlay");
  const calibrateBtn = document.getElementById("calibrateBtn");
  const toggle = document.querySelector(".toggle-switch-popup");
  const pauseBtn = document.getElementById("pauseCalibrationBtn");
  const resumeBtn = document.getElementById("resumeCalibrationBtn");

  let calibrationInProgress = false;
  let currentCalibrationPoint = null;
  let gazeDataLog = [];

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




async function startCalibration() {

    window.initGazeDot();

    const dataset = [];
    const stored = localStorage.getItem("gazeDataset");
    if (stored) {
        dataset.push(...JSON.parse(stored));
    }

    let currentGaze = null;
    let correctionModel = null;
    let calibrationDone = false;
    const gazePath = [];

    const smoothFactor = 0.2;
    let smoothedGaze = { x: 0, y: 0 };
    const gazeHistory = [];
    const historyLength = 5;

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
            if (!data) { window.currentGaze.x = 0; window.currentGaze.y = 0; return; }
            let raw = { x: data.x, y: data.y };
            if (correctionModel) {
                const [a, b, c, d, e, f] = correctionModel;
                window.currentGaze.x = a * raw.x + b * raw.y + c;
                window.currentGaze.y = d * raw.x + e * raw.y + f;
            } else {
                window.currentGaze.x = raw.x;
                window.currentGaze.y = raw.y;
            }
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
                let last = gazePath[gazePath.length - 1];
                const filtered = getMedianGaze(window.currentGaze);
                const smooth = getSmoothedGaze(filtered);
                const limited = limitJump(last, smooth);

                ctx.fillStyle = "limegreen";
                ctx.beginPath(); 
                ctx.arc(limited.x, limited.y, 3, 0, 2 * Math.PI); 
                ctx.fill();

                if (last) {
                    ctx.beginPath();
                    ctx.strokeStyle = "limegreen";
                    ctx.lineWidth = 2;
                    ctx.moveTo(last.x, last.y);
                    ctx.lineTo(limited.x, limited.y);
                    ctx.stroke();
                }

                gazePath.push({ x: limited.x, y: limited.y });
                coordDisplay.innerText = `Gaze: (${limited.x.toFixed(1)}, ${limited.y.toFixed(1)})`;
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


  function median(values) {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  async function startGames() {
    if (calibrationInProgress) return;
    calibrationInProgress = true;

    await startGazeTracker();

    if (blurOverlay) {
      blurOverlay.style.display = "block";
      blurOverlay.style.opacity = "1";
    }

    await runBirdGame();
    await runTargetGame();
    await runGemGame();

    finishGames();
  }



  function runBirdGame() {
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



  function runGemGame() {
  return new Promise(async resolve => {
    const numPoints = 15;

    for (let i = 0; i < numPoints; i++) {

      const x = Math.random() * (window.innerWidth - 80);
      const y = Math.random() * (window.innerHeight - 80);

   
      gemDot.style.left = `${x}px`;
      gemDot.style.top = `${y}px`;
      gemDot.textContent = "💎";
      gemDot.style.display = "block";


      await new Promise(res => setTimeout(res, 800));
      gemDot.textContent = "✨";


      await new Promise(res => setTimeout(res, 800));
      gemDot.style.display = "none";
    }

    resolve(); 
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


  function runCalibrationPoint(point, dot, callback, type) {
    const samples = [];
    const requiredSamples = 5;
    let sampleCount = 0;

    currentCalibrationPoint = {
      id: `${type}-${point.x}-${point.y}`,
      x: window.innerWidth * point.x,
      y: window.innerHeight * point.y
    };

    dot.style.left = `${currentCalibrationPoint.x}px`;
    dot.style.top = `${currentCalibrationPoint.y}px`;
    dot.style.display = "block";

    const pulsateInterval = setInterval(() => {
      dot.style.transform = `scale(${dot.style.transform === "scale(1.3)" ? 1 : 1.3})`;
    }, 500);

    const sampleInterval = setInterval(() => {
      if (window.webgazer) {
        const prediction = webgazer.getCurrentPrediction();
        if (prediction) {
          const gazeX = Math.min(Math.max(prediction.x, 0), window.innerWidth);
          const gazeY = Math.min(Math.max(prediction.y, 0), window.innerHeight);

          samples.push({ x: gazeX, y: gazeY });
          gazeDot.style.left = `${gazeX - 10}px`;
          gazeDot.style.top = `${gazeY - 10}px`;
          gazeDot.style.display = "block";

          console.log("Target:", { x: currentCalibrationPoint.x, y: currentCalibrationPoint.y },
                      "User gaze:", { x: gazeX, y: gazeY });
        }
      }

      sampleCount++;
      if (sampleCount >= requiredSamples) {
        clearInterval(sampleInterval);
        clearInterval(pulsateInterval);
        dot.style.display = "none";

        const medianGaze = {
          x: median(samples.map(s => s.x)),
          y: median(samples.map(s => s.y))
        };

        currentCalibrationPoint = null;
        callback(medianGaze);
      }
    }, 300);
  }

  async function startGazeTracker() {
    if (!window.webgazer) return;

    try {
      await webgazer.setRegression('ridge')
       .setGazeListener((data) => {
          if (data) {
            const x = Math.min(Math.max(data.x, 0), window.innerWidth);
            const y = Math.min(Math.max(data.y, 0), window.innerHeight);

            gazeDot.style.left = `${x - 10}px`;
            gazeDot.style.top = `${y - 10}px`;
            gazeDot.style.display = "block";

            if (pathDrawingEnabled) {
              pathCtx.fillStyle = "rgba(255,0,0,0.6)";
              pathCtx.beginPath();
              pathCtx.arc(x, y, 3, 0, 2 * Math.PI);
              pathCtx.fill();
            }
          }
        })

        .begin();
      webgazer.showVideo(true).showFaceOverlay(true);
      console.log("Gaze tracking started");
    } catch (err) {
      console.error("Camera permission denied or error starting WebGazer:", err);
    }
  }

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


if (calibrateBtn) {
  calibrateBtn.addEventListener("click", () => {
    startGames(); 
  });
}

let gamesPaused = false;
let currentGameResolver = null; // Keeps track of the game promise resolver

function pauseGames() {
  gamesPaused = true;
  console.log("Calibration games paused.");
}

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

// Wrap a game so it respects pause/resume
async function runWithPause(gameFn) {
  while (gamesPaused) {
    await new Promise(resolve => {
      currentGameResolver = resolve;
    });
  }
  return gameFn();
}

// Override startGames to use pausable wrappers
const originalStartGames = startGames;
startGames = async function () {
  if (calibrationInProgress) return;
  calibrationInProgress = true;

  await startGazeTracker();

  if (blurOverlay) {
    blurOverlay.style.display = "block";
    blurOverlay.style.opacity = "1";
  }

  await runWithPause(runBirdGame);
  await runWithPause(runTargetGame);
  await runWithPause(runGemGame);

  finishGames();
};

if (openPopupBtn && popupOverlay) {
  openPopupBtn.addEventListener("click", () => popupOverlay.style.display = "flex");
}
if (closeBtn && popupOverlay) {
  closeBtn.addEventListener("click", () => popupOverlay.style.display = "none");
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
    });
  }

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
