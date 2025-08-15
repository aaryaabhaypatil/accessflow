window.onload = async function () {

  let currentGaze = null;

  await webgazer.setRegression('ridge')
    .setTracker('clmtrackr')
    .setGazeListener((data, elapsedTime) => {
      if (data == null) {
        currentGaze = null;
        return;
      }
      currentGaze = { x: data.x, y: data.y };
    })
    .begin();

  webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);

  const dot = document.createElement("div");
  dot.id = "calibrationDot";
  dot.style.position = "fixed";
  dot.style.width = "50px"; 
  dot.style.height = "50px";
  dot.style.background = "blue";
  dot.style.borderRadius = "50%";
  dot.style.zIndex = "9999";
  document.body.appendChild(dot);

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const rows = 5;
  const cols = 5;
  const positions = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let x = (col + 0.5) * (screenWidth / cols);
      let y = (row + 0.5) * (screenHeight / rows);
      positions.push({ x, y });
    }
  }

  let current = 0;
  const calibrationResults = [];

  function getMedian(values) {
    if (values.length === 0) return null;
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0
      ? values[mid]
      : (values[mid - 1] + values[mid]) / 2;
  }

  function moveDot() {
    if (current >= positions.length) {
      console.log("Calibration complete!");
      console.log("Results:", calibrationResults);
      localStorage.setItem("calibrationData", JSON.stringify(calibrationResults));
      alert("Calibration finished. Data saved to localStorage.");
      return;
    }

    const pos = positions[current];
    dot.style.left = `${pos.x - 25}px`; 
    dot.style.top = `${pos.y - 25}px`;
    console.log("Dot at:", pos);


    const samples = [];
    const interval = setInterval(() => {
      if (currentGaze) {
        samples.push({ x: currentGaze.x, y: currentGaze.y });
        console.log("Collected gaze:", currentGaze);
      }
    }, 200);

    setTimeout(() => {
      clearInterval(interval);

      if (samples.length > 0) {
        const medianX = getMedian(samples.map(s => s.x));
        const medianY = getMedian(samples.map(s => s.y));

        calibrationResults.push({
          dotX: pos.x,
          dotY: pos.y,
          medianGazeX: medianX,
          medianGazeY: medianY,
          sampleCount: samples.length
        });

        console.log(`Dot ${current + 1}: Median gaze at (${medianX}, ${medianY})`);
      } else {
        calibrationResults.push({
          dotX: pos.x,
          dotY: pos.y,
          medianGazeX: null,
          medianGazeY: null,
          sampleCount: 0
        });

        console.log(`Dot ${current + 1}: No gaze detected`);
      }

      current++;
      moveDot(); 
    }, 2000); 
  }

  moveDot();
};
