document.addEventListener("DOMContentLoaded", function () {
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const feedbackBox = document.getElementById("feedbackBox");
  const blurOverlay = document.getElementById("blurOverlay");
  const calibrateBtn = document.getElementById("calibrateBtn");

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


  if (calibrateBtn) calibrateBtn.addEventListener("click", startGames);

  if (openPopupBtn && popupOverlay) openPopupBtn.addEventListener("click", () => popupOverlay.style.display = "flex");
  if (closeBtn && popupOverlay) closeBtn.addEventListener("click", () => popupOverlay.style.display = "none");
});
