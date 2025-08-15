window.onload = async function () {

  let currentGaze = null;
  let correctionModel = null;

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

    const X = [];
    const Yx = [];
    const Yy = [];
    pairs.forEach(p => {
      X.push([p.gazeX, p.gazeY, 1]);
      Yx.push(p.dotX);
      Yy.push(p.dotY);
    });

    function pseudoInverse(A) {

      const AT = A[0].map((_, i) => A.map(row => row[i]));
      const ATA = AT.map(row => AT.map((_, j) => row.reduce((sum, _, k) => sum + AT[k][j] * row[k], 0)));
    }

    function fitLinear(X, Y) {
      const n = X.length;
      const x1 = X.map(r => r[0]);
      const x2 = X.map(r => r[1]);
      const bias = X.map(r => r[2]);


      const meanX1 = x1.reduce((a, b) => a + b) / n;
      const meanX2 = x2.reduce((a, b) => a + b) / n;
      const meanBias = bias.reduce((a, b) => a + b) / n;
      const meanY = Y.reduce((a, b) => a + b) / n;


      return [0, 0, meanY]; 
    }

    const [a, b, c] = fitLinear(X, Yx);
    const [d, e, f] = fitLinear(X, Yy);

    return [a, b, c, d, e, f];
  }

  function moveDot() {
    if (current >= positions.length) {
      console.log("Calibration complete!");
      console.log("Calibration pairs:", calibrationPairs);


      correctionModel = fitAffineModel(calibrationPairs);
      console.log("Correction model:", correctionModel);

      alert("Calibration finished. Model fitted.");
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
        const filtered = filterOutliers(samples, 150);
        const medianX = getMedian(filtered.map(s => s.x));
        const medianY = getMedian(filtered.map(s => s.y));

        calibrationPairs.push({
          gazeX: medianX,
          gazeY: medianY,
          dotX: pos.x,
          dotY: pos.y
        });

        console.log(`Dot ${current + 1}: Gaze (${medianX}, ${medianY}) → Dot (${pos.x}, ${pos.y})`);
      } else {
        console.log(`Dot ${current + 1}: No gaze detected`);
      }

      current++;
      moveDot();
    }, 2000);
  }

  moveDot();
};
