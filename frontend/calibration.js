document.addEventListener("DOMContentLoaded", function () {
  console.log("Precalibration script loaded. Preparing 63-point calibration...");


  const calibrationDot = document.createElement("div");
  calibrationDot.id = "precalDot";
  calibrationDot.style.position = "fixed";
  calibrationDot.style.width = "40px";
  calibrationDot.style.height = "40px";
  calibrationDot.style.borderRadius = "50%";
  calibrationDot.style.background = "blue";
  calibrationDot.style.zIndex = "20000";
  calibrationDot.style.pointerEvents = "none";
  calibrationDot.style.display = "none";
  document.body.appendChild(calibrationDot);


  const rows = 7;
  const cols = 9;
  const calibrationPoints = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = (j + 0.5) / cols;
      const y = (i + 0.5) / rows;
      calibrationPoints.push({ x: x, y: y });
    }
  }

  async function startPrecalibration() {
    if (!window.webgazer) {
      console.error("WebGazer not loaded!");
      return;
    }

    console.log("Starting 63-point precalibration...");


    await webgazer.setRegression("ridge")
      .setGazeListener(() => {}) 
      .begin();
    webgazer.showVideo(true).showFaceOverlay(true);

    const precalData = [];


    for (let i = 0; i < calibrationPoints.length; i++) {
      const point = calibrationPoints[i];
      const px = window.innerWidth * point.x;
      const py = window.innerHeight * point.y;

      calibrationDot.style.left = `${px - 20}px`;
      calibrationDot.style.top = `${py - 20}px`;
      calibrationDot.style.display = "block";

      console.log(`Calibrating point ${i + 1}/${calibrationPoints.length} at actual (${px}, ${py})`);

      const samples = [];
      const requiredSamples = 5;
      let collected = 0;


      await new Promise(resolve => {
        const interval = setInterval(() => {
          const prediction = webgazer.getCurrentPrediction();
          if (prediction) {
            const gazeX = Math.min(Math.max(prediction.x, 0), window.innerWidth);
            const gazeY = Math.min(Math.max(prediction.y, 0), window.innerHeight);

            samples.push({ x: gazeX, y: gazeY });
            collected++;

            console.log(`Point ${i + 1}: Actual (${px}, ${py}) | User gaze: (${gazeX}, ${gazeY})`);
          }

          if (collected >= requiredSamples) {
            clearInterval(interval);
            precalData.push({
              screenX: px,
              screenY: py,
              gazeSamples: samples
            });
            calibrationDot.style.display = "none";
            setTimeout(resolve, 200);
          }
        }, 300);
      });
    }

    console.log("Precalibration complete!");
    console.log("Collected data:", precalData);

   
    localStorage.setItem("precalibrationData", JSON.stringify(precalData));
    alert("Precalibration finished. Data saved to localStorage.");
  }

  startPrecalibration();
});
