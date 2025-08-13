document.addEventListener("DOMContentLoaded", function () {
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const feedbackBox = document.getElementById("feedbackBox");
  const toggle = document.querySelector(".toggle-switch-popup");
  const blurOverlay = document.getElementById("blurOverlay");

  let calibrationInProgress = false;

  // --- Create dots if they don't exist ---
  let birdDot = document.getElementById("birdDot");
  if (!birdDot) {
    birdDot = document.createElement("div");
    birdDot.id = "birdDot";
    birdDot.style.position = "fixed";
    birdDot.style.fontSize = "30px";
    birdDot.style.zIndex = "15000";
    birdDot.style.pointerEvents = "none";
    birdDot.style.display = "none";
    birdDot.textContent = "🐦";
    birdDot.style.fontSize = "80px";
    document.body.appendChild(birdDot);
  }

  let targetDot = document.getElementById("targetDot");
  if (!targetDot) {
    targetDot = document.createElement("div");
    targetDot.id = "targetDot";
    targetDot.style.position = "fixed";
    targetDot.style.fontSize = "30px";
    targetDot.style.zIndex = "15000";
    targetDot.style.pointerEvents = "none";
    targetDot.style.display = "none";
    targetDot.textContent = "🎯";
    targetDot.style.fontSize = "80px";
    document.body.appendChild(targetDot);
  }

  let gemDot = document.getElementById("gemDot");
  if (!gemDot) {
    gemDot = document.createElement("div");
    gemDot.id = "gemDot";
    gemDot.style.position = "fixed";
    gemDot.style.fontSize = "30px";
    gemDot.style.zIndex = "15000";
    gemDot.style.pointerEvents = "none";
    gemDot.style.display = "none";
    gemDot.textContent = "💎";
    gemDot.style.fontSize = "80px";
    document.body.appendChild(gemDot);
  }

  const calibrationPoints = [
    { x: 0.1, y: 0.1 },
    { x: 0.5, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.9 },
    { x: 0.5, y: 0.9 },
    { x: 0.9, y: 0.9 }
  ];

  // -------------------- Calibration (Bird Game) --------------------
  function startGames() {
    if (calibrationInProgress) return;
    calibrationInProgress = true;
    if (blurOverlay) {
      blurOverlay.classList.add("active");
      blurOverlay.style.display = "block";
      blurOverlay.style.opacity = "1";
    }
    runBirdGameSeries(() => {
      runTargetGameSeries(() => {
        runGemGameSeries(() => {
          finishGames();
        });
      });
    });
  }

  function runBirdGameSeries(callback) {
    // Randomize the calibration points order
    const points = [...calibrationPoints];
    for (let i = points.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [points[i], points[j]] = [points[j], points[i]];
    }

    let index = 0;
    const collectedData = []; // store gaze data per point

    function next() {
      if (index >= points.length) {
        console.log("Collected gaze data:", collectedData);
        callback();
        return;
      }

      runBirdGame(points[index], (medianGaze) => {
        collectedData.push({ point: points[index], medianGaze });
        index++;
        next();
      });
    }

    next();
  }

  function runBirdGame(point, callback) {
    const birdDot = document.getElementById("birdDot");
    const samples = [];
    const requiredSamples = 5;
    let sampleCount = 0;

    birdDot.style.left = `${window.innerWidth * point.x}px`;
    birdDot.style.top = `${window.innerHeight * point.y}px`;
    birdDot.textContent = "🐦";
    birdDot.style.display = "block";

    // Pulsate effect
    let scale = 1;
    const pulsateInterval = setInterval(() => {
      scale = scale === 1 ? 1.3 : 1;
      birdDot.style.transform = `scale(${scale})`;
    }, 500);

    // Collect gaze samples
    const sampleInterval = setInterval(() => {
      if (window.webgazer) {
        const prediction = webgazer.getCurrentPrediction();
        if (prediction) samples.push({ x: prediction.x, y: prediction.y });
      }
      sampleCount++;
      if (sampleCount >= requiredSamples) {
        clearInterval(sampleInterval);
        clearInterval(pulsateInterval);
        birdDot.style.display = "none";

        // Compute median gaze for this point
        const medianGaze = {
          x: median(samples.map(s => s.x)),
          y: median(samples.map(s => s.y))
        };
        callback(medianGaze);
      }
    }, 300);
  }

  function median(values) {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  // -------------------- Target & Gem Games (unchanged) --------------------
  function runTargetGameSeries(callback) {
    let index = 0;
    function next() {
      if (index >= calibrationPoints.length) {
        callback();
        return;
      }
      runTargetGame(calibrationPoints[index], () => {
        index++;
        next();
      });
    }
    next();
  }

  function runTargetGame(point, callback) {
    targetDot.style.left = `${window.innerWidth * point.x}px`;
    targetDot.style.top = `${window.innerHeight * point.y}px`;
    targetDot.textContent = "🎯";
    targetDot.style.display = "block";
    setTimeout(() => {
      targetDot.textContent = "💥";
      setTimeout(() => {
        targetDot.style.display = "none";
        callback();
      }, 500);
    }, 1500);
  }

  function runGemGameSeries(callback) {
    let index = 0;
    function next() {
      if (index >= calibrationPoints.length) {
        callback();
        return;
      }
      runGemGame(calibrationPoints[index], () => {
        index++;
        next();
      });
    }
    next();
  }

  function runGemGame(point, callback) {
    gemDot.style.left = `${window.innerWidth * point.x}px`;
    gemDot.style.top = `${window.innerHeight * point.y}px`;
    gemDot.textContent = "💎";
    gemDot.style.display = "block";
    setTimeout(() => {
      gemDot.textContent = "✨";
      setTimeout(() => {
        gemDot.style.display = "none";
        callback();
      }, 500);
    }, 1500);
  }

  // -------------------- Finish --------------------
  function finishGames() {
    calibrationInProgress = false;
    birdDot.style.display = "none";
    targetDot.style.display = "none";
    gemDot.style.display = "none";
    if (blurOverlay) {
      blurOverlay.style.opacity = "0";
      setTimeout(() => {
        blurOverlay.style.display = "none";
      }, 300);
      blurOverlay.classList.remove("active");
    }
    alert("All games complete!");
  }

  const calibrateBtn = document.getElementById("calibrateBtn");
  if (calibrateBtn) calibrateBtn.addEventListener("click", startGames);

  // -------------------- Toggle & Popup --------------------
  if (localStorage.getItem("toggleActive") === "true") toggle.classList.add("active");
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    localStorage.setItem("toggleActive", toggle.classList.contains("active"));
  });

  const toggleSwitch = document.getElementById("toggleSwitch");
  let isTrackingOn = false;
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

  // -------------------- Preferences --------------------
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
