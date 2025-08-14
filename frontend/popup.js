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

  // Helper: create a calibration dot
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

  // --- NEW: real-time gaze dot ---
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

  


  // ---------------------------
  // Calibration + Gaze tracker
  // ---------------------------
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
    alert("Calibration complete! Red dot now shows your real-time gaze.");
  }

  // --- UI TOGGLES & BUTTONS ---
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
});
