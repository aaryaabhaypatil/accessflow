// Calibration Mini-Games for Eye-Tracking
let calibrationData = [];
let isCalibrating = false;

function correctDrift(x, y) {
  if (calibrationData.length === 0) return { x, y };
  const avgCalib = calibrationData.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 }
  );
  avgCalib.x /= calibrationData.length;
  avgCalib.y /= calibrationData.length;
  return {
    x: x - avgCalib.x,
    y: y - avgCalib.y,
  };
}

function getHeadShift() {
  const positions = webgazer.getTracker()?.getPositions();
  if (!positions) return { dx: 0, dy: 0 };
  const leftEye = positions.find((p) => p.name === "leftEye");
  const rightEye = positions.find((p) => p.name === "rightEye");
  const nose = positions.find((p) => p.name === "nose");
  if (leftEye && rightEye && nose) {
    const headCenterX = (leftEye.x + rightEye.x) / 2;
    const dx = headCenterX - nose.x;
    const dy = (leftEye.y + rightEye.y) / 2 - nose.y;
    return { dx, dy };
  }
  return { dx: 0, dy: 0 };
}

window.onload = async function () {
  if (typeof webgazer === "undefined") return;

  const canvas = document.getElementById("gazeCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const gazeDot = document.getElementById("gazeDot");

  await webgazer
    .setRegression("ridge")
    .begin();

  webgazer
    .showVideo(false)
    .showFaceOverlay(false)
    .showFaceFeedbackBox(false)
    .showPredictionPoints(false);

  // Create calibrationDot and alertBox dynamically if not exist
  let calibrationDot = document.getElementById("calibrationDot");
  if (!calibrationDot) {
    calibrationDot = document.createElement("div");
    calibrationDot.id = "calibrationDot";
    document.body.appendChild(calibrationDot);
  }

  let alertBox = document.getElementById("alertBox");
  if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.id = "alertBox";
    document.body.appendChild(alertBox);
  }

  function getRandomPosition() {
    return {
      x: Math.random() * (window.innerWidth - 60),
      y: Math.random() * (window.innerHeight - 60),
    };
  }

  async function collectGazeDataAtPoint(duration = 800) {
    return new Promise((resolve) => {
      let gazeSamples = [];
      const startTime = performance.now();
      function collect(currentTime) {
        const elapsed = currentTime - startTime;
        if (elapsed < duration) {
          const gazeData = webgazer.getCurrentPrediction();
          if (
            gazeData &&
            typeof gazeData.x !== "undefined" &&
            typeof gazeData.y !== "undefined"
          ) {
            gazeSamples.push({ x: gazeData.x, y: gazeData.y });
          }
          requestAnimationFrame(collect);
        } else {
          if (gazeSamples.length > 0) {
            const avgX =
              gazeSamples.reduce((sum, s) => sum + s.x, 0) / gazeSamples.length;
            const avgY =
              gazeSamples.reduce((sum, s) => sum + s.y, 0) / gazeSamples.length;
            calibrationData.push({
              x: avgX - window.innerWidth / 2,
              y: avgY - window.innerHeight / 2,
            });
          }
          resolve();
        }
      }
      requestAnimationFrame(collect);
    });
  }

  async function showGameAlert(message, subtext = "") {
    alertBox.innerHTML = `<div>${message}</div><div style="font-size: 18px; margin-top: 8px;">${subtext}</div>`;
    alertBox.style.display = "block";
    await new Promise((r) => setTimeout(r, 1800));
    alertBox.style.display = "none";
  }

  async function targetPopGame() {
    await showGameAlert("🎯", "Let's play Target Pop! Look at the target before it pops.");
    for (let i = 0; i < 10; i++) {
      calibrationDot.style.display = "none";
      await new Promise((r) => setTimeout(r, 300));
      const pos = getRandomPosition();
      calibrationDot.style.left = `${pos.x}px`;
      calibrationDot.style.top = `${pos.y}px`;
      calibrationDot.style.backgroundColor = "transparent";
      calibrationDot.innerText = "🎯";
      calibrationDot.style.display = "flex";
      await collectGazeDataAtPoint();
      calibrationDot.innerText = "💥";
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  async function birdFollowGame() {
    await showGameAlert("🐦", "Time for Bird Chase! Follow the bird with your eyes.");
    const steps = 25;
    let start = getRandomPosition();
    for (let i = 0; i < steps; i++) {
      const end = getRandomPosition();
      const duration = 2200;
      const startTime = performance.now();

      calibrationDot.innerText = "🐦";
      calibrationDot.style.backgroundColor = "transparent";
      calibrationDot.style.animation = "wiggle 0.5s ease";

      calibrationDot.style.boxShadow = "0 0 20px 5px gold";

      const trail = document.createElement("div");
      Object.assign(trail.style, {
        position: "absolute",
        left: `${start.x}px`,
        top: `${start.y}px`,
        width: "20px",
        height: "20px",
        backgroundColor: "rgba(0, 150, 255, 0.4)",
        borderRadius: "50%",
        zIndex: 9998,
        transition: "opacity 1s ease-out",
      });
      document.body.appendChild(trail);
      setTimeout(() => (trail.style.opacity = "0"), 10);
      setTimeout(() => trail.remove(), 1100);

      setTimeout(() => {
        calibrationDot.style.animation = "";
        calibrationDot.style.boxShadow = "";
      }, 500);

      await new Promise((resolve) => {
        function animate(t) {
          const elapsed = t - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const x = start.x + (end.x - start.x) * progress;
          const y = start.y + (end.y - start.y) * progress;
          calibrationDot.style.left = `${x}px`;
          calibrationDot.style.top = `${y}px`;
          if (progress < 1) requestAnimationFrame(animate);
          else resolve();
        }
        requestAnimationFrame(animate);
      });

      await collectGazeDataAtPoint(800);
      start = end;
    }
  }

  async function gemCollectorGame() {
    await showGameAlert("💎", "Ready for Gem Hunt? Collect them with your eyes!");
    for (let i = 0; i < 15; i++) {
      calibrationDot.style.display = "none";
      await new Promise((r) => setTimeout(r, 300));
      const pos = getRandomPosition();
      calibrationDot.style.left = `${pos.x}px`;
      calibrationDot.style.top = `${pos.y}px`;
      calibrationDot.innerText = "💎";
      calibrationDot.style.backgroundColor = "gold";
      calibrationDot.style.display = "flex";
      await collectGazeDataAtPoint();
      calibrationDot.innerText = "✨";
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  async function runCalibrationMiniGames() {
    isCalibrating = true;
    calibrationDot.style.display = "block";
    await targetPopGame();
    await birdFollowGame();
    await gemCollectorGame();
    calibrationDot.style.display = "none";
    isCalibrating = false;
    console.log("Calibration complete.", calibrationData);
  }

  const gazeBuffer = [];
  const bufferSize = 15;
  let latestX = null,
    latestY = null;
  let prevX = null,
    prevY = null;

  function setupGazeListener() {
    webgazer.setGazeListener((data) => {
      if (!data || isCalibrating) return;
      if (typeof data.x !== "undefined" && typeof data.y !== "undefined") {
        gazeBuffer.push({ x: data.x, y: data.y });
        if (gazeBuffer.length > bufferSize) gazeBuffer.shift();
        const sum = gazeBuffer.reduce(
          (acc, point) => {
            acc.x += point.x;
            acc.y += point.y;
            return acc;
          },
          { x: 0, y: 0 }
        );
        latestX = sum.x / gazeBuffer.length;
        latestY = sum.y / gazeBuffer.length;
      }
    });
  }

  function drawLoop() {
    requestAnimationFrame(drawLoop);
    if (
      latestX != null &&
      latestY != null &&
      isFinite(latestX) &&
      isFinite(latestY)
    ) {
      let { x, y } = correctDrift(
        latestX - window.innerWidth / 2,
        latestY - window.innerHeight / 2
      );
      const { dx, dy } = getHeadShift();
      x = x + window.innerWidth / 2 - dx;
      y = y + window.innerHeight / 2 - dy;

      gazeDot.style.left = `${x - 5}px`;
      gazeDot.style.top = `${y - 5}px`;

      if (prevX !== null && prevY !== null) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "rgba(0, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      prevX = x;
      prevY = y;
    }
  }

  setupGazeListener();
  runCalibrationMiniGames().then(() => drawLoop());

  // Optional: Toggle switch logic (example)
  const toggleSwitch = document.getElementById("toggleSwitch");
  toggleSwitch.addEventListener("click", () => {
    toggleSwitch.classList.toggle("active");
    // Add your toggle functionality here, e.g. start/stop tracking
    if (toggleSwitch.classList.contains("active")) {
      console.log("Tracking ON");
    } else {
      console.log("Tracking OFF");
    }
  });

  // Optional: Add button logic
  const addButton = document.getElementById("addButton");
  addButton.addEventListener("click", () => {
    const action = document.getElementById("customActionSelect").value;
    const gesture = document.getElementById("customGestureSelect").value;
    if (!action || !gesture) {
      alert("Please select both an action and a gesture to add.");
      return;
    }
    alert(`Added custom mapping: Action = ${action}, Gesture = ${gesture}`);
    // Here you could append to a list or save custom mappings as needed
  });

  // Optional: Save button logic
  const saveButton = document.getElementById("saveButton");
  saveButton.addEventListener("click", () => {
    alert("Settings saved!");
    // Implement saving logic as needed (localStorage, backend, etc.)
  });
};
