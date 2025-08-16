window.onload = async function () {
  let currentGaze = null;
  let correctionModel = null;
  const gazePath = [];


  await webgazer.setRegression('ridge')
    .setTracker('clmtrackr')
    .setGazeListener((data) => {
      if (data == null) {
        currentGaze = null;
        return;
      }
      let raw = { x: data.x, y: data.y };

      if (correctionModel) {
        const [a, b, c, d, e, f] = correctionModel;
        const correctedX = a * raw.x + b * raw.y + c;
        const correctedY = d * raw.x + e * raw.y + f;
        currentGaze = { x: correctedX, y: correctedY };
      } else {
        currentGaze = raw;
      }
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


  const rows = 7;
  const cols = 9;
  const positions = [];
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      positions.push({ x: (j + 0.5) * (screenWidth / cols), y: (i + 0.5) * (screenHeight / rows) });
    }
  }

  let current = 0;
  const calibrationPairs = [];

  function getMedian(values) {
    if (values.length === 0) return null;
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0
      ? values[mid]
      : (values[mid - 1] + values[mid]) / 2;
  }

  function filterOutliers(samples, threshold = 150) {
    if (samples.length === 0) return samples;
    const meanX = samples.reduce((a, s) => a + s.x, 0) / samples.length;
    const meanY = samples.reduce((a, s) => a + s.y, 0) / samples.length;
    return samples.filter(s =>
      Math.hypot(s.x - meanX, s.y - meanY) < threshold
    );
  }

  function fitAffineModel(pairs) {
    if (pairs.length === 0) return [0, 0, 0, 0, 0, 0];

    return [1, 0, 0, 0, 1, 0];
  }

  function moveDot() {
  if (current >= positions.length) {
    correctionModel = fitAffineModel(calibrationPairs);
    dot.style.display = "none";
    alert("Calibration finished!");
    requestAnimationFrame(traceGazePath);
    return;
  }

  const pos = positions[current];
  dot.style.left = `${pos.x - 25}px`;
  dot.style.top = `${pos.y - 25}px`;

  const samples = [];
  const interval = setInterval(() => {
    if (currentGaze) {
      samples.push({ x: currentGaze.x, y: currentGaze.y });


      console.log(`Gaze coordinates → x: ${currentGaze.x.toFixed(2)}, y: ${currentGaze.y.toFixed(2)}`);
      if (correctionModel) {
        const [a, b, c, d, e, f] = correctionModel;
        const userX = a * currentGaze.x + b * currentGaze.y + c;
        const userY = d * currentGaze.x + e * currentGaze.y + f;
        console.log(`User coordinates → x: ${userX.toFixed(2)}, y: ${userY.toFixed(2)}`);
      } else {

        console.log(`User coordinates → x: ${currentGaze.x.toFixed(2)}, y: ${currentGaze.y.toFixed(2)}`);
      }
    }
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    if (samples.length > 0) {
      const filtered = filterOutliers(samples, 150);
      const medianX = getMedian(filtered.map(s => s.x));
      const medianY = getMedian(filtered.map(s => s.y));
      calibrationPairs.push({ gazeX: medianX, gazeY: medianY, dotX: pos.x, dotY: pos.y });
      console.log(`Dot ${current + 1}: Median Gaze (${medianX.toFixed(2)}, ${medianY.toFixed(2)}) → Dot (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
    }
    current++;
    moveDot();
  }, 2000);
}


  function traceGazePath() {
    if (currentGaze) {

      ctx.fillStyle = "limegreen";
      ctx.beginPath();
      ctx.arc(currentGaze.x, currentGaze.y, 3, 0, 2 * Math.PI);
      ctx.fill();


      if (gazePath.length > 0) {
        const last = gazePath[gazePath.length - 1];
        ctx.beginPath();
        ctx.strokeStyle = "limegreen";
        ctx.lineWidth = 2;
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(currentGaze.x, currentGaze.y);
        ctx.stroke();
      }

      gazePath.push({ x: currentGaze.x, y: currentGaze.y });
    }

    requestAnimationFrame(traceGazePath);
  }

  moveDot();
};
