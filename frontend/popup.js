document.addEventListener("DOMContentLoaded", function () {
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const feedbackBox = document.getElementById("feedbackBox");
  const blurOverlay = document.getElementById("blurOverlay");
  const calibrateBtn = document.getElementById("calibrateBtn");
  const toggle = document.querySelector(".toggle-switch-popup");

  let calibrationInProgress = false;
  let currentCalibrationPoint = null;
  let gazeDataLog = [];


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

  const calibrationPoints = [
    { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 }
  ];


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

    await runBirdGameSeries();
    await runTargetGameSeries();
    await runGemGameSeries();

    finishGames();
  }

  function runBirdGameSeries() {
    return runGameSeries(calibrationPoints, runBirdGame, "bird");
  }

  function runTargetGameSeries() {
    return runGameSeries(calibrationPoints, runTargetGame, "target");
  }

  function runGemGameSeries() {
    return runGameSeries(calibrationPoints, runGemGame, "gem");
  }

  function runGameSeries(points, runGameFn, gameName) {
    return new Promise(resolve => {
      const shuffled = [...points].sort(() => Math.random() - 0.5);
      let index = 0;

      function next() {
        if (index >= shuffled.length) return resolve();
        runGameFn(shuffled[index], () => {
          index++;
          next();
        });
      }
      next();
    });
  }


  function runBirdGame(point, callback) {
    runCalibrationPoint(point, birdDot, callback, "bird");
  }

  function runTargetGame(point, callback) {
    runCalibrationPoint(point, targetDot, callback, "target");
  }

  function runGemGame(point, callback) {
    gemDot.style.left = `${window.innerWidth * point.x}px`;
    gemDot.style.top = `${window.innerHeight * point.y}px`;
    gemDot.style.display = "block";
    setTimeout(() => {
      gemDot.style.display = "none";
      callback();
    }, 1000);
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
          samples.push({ x: prediction.x, y: prediction.y });
          console.log("Target:", { x: currentCalibrationPoint.x, y: currentCalibrationPoint.y }, 
                      "User gaze:", { x: prediction.x, y: prediction.y });
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


  function finishGames() {
    calibrationInProgress = false;
    birdDot.style.display = "none";
    targetDot.style.display = "none";
    gemDot.style.display = "none";
    if (blurOverlay) blurOverlay.style.display = "none";
    alert("Calibration complete!");
  }

  async function startGazeTracker() {
    if (!window.webgazer) return;

    try {
      await webgazer.setRegression('ridge')
        .setGazeListener((data, elapsedTime) => { /* we log inside runCalibrationPoint */ })
        .begin();
      webgazer.showVideo(true).showFaceOverlay(true);
      console.log("Gaze tracking started");
    } catch (err) {
      console.error("Camera permission denied or error starting WebGazer:", err);
    }
  }
  if (localStorage.getItem("toggleActive") === "true") toggle.classList.add("active");
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    localStorage.setItem("toggleActive", toggle.classList.contains("active"));
  });

  const toggleSwitch = document.getElementById("toggleSwitch");
  let isTrackingOn = false;

  if (calibrateBtn) calibrateBtn.addEventListener("click", startGames);

  if (openPopupBtn && popupOverlay) openPopupBtn.addEventListener("click", () => popupOverlay.style.display = "flex");
  if (closeBtn && popupOverlay) closeBtn.addEventListener("click", () => popupOverlay.style.display = "none");
  if (toggleSwitch) {
    const savedState = localStorage.getItem('isTrackingOn');
    isTrackingOn = savedState === 'true';
    toggleSwitch.classList.toggle("active", isTrackingOn);
    toggleSwitch.addEventListener("click", function () {
      isTrackingOn = !isTrackingOn;
      this.classList.toggle("active", isTrackingOn);
      localStorage.setItem('isTrackingOn', isTrackingOn.toString());
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
  // Draw live gaze path
const gazeCanvas = document.getElementById("gazePathCanvas");
const ctx = gazeCanvas.getContext("2d");

function resizeCanvas() {
  gazeCanvas.width = window.innerWidth;
  gazeCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let lastX = null;
let lastY = null;

function startGazePathTracking() {
  if (!window.webgazer) return;
  ctx.clearRect(0, 0, gazeCanvas.width, gazeCanvas.height);

  webgazer.setGazeListener((data) => {
    if (data) {
      const x = data.x;
      const y = data.y;


      if (lastX !== null && lastY !== null) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }


      ctx.fillStyle = "rgba(0, 0, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      lastX = x;
      lastY = y;
    }
  });
}


function finishGames() {
  calibrationInProgress = false;
  birdDot.style.display = "none";
  targetDot.style.display = "none";
  gemDot.style.display = "none";
  if (blurOverlay) blurOverlay.style.display = "none";
  alert("Calibration complete! Now tracking your gaze path...");
  startGazePathTracking();
}

});
