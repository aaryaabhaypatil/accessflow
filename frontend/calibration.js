window.onload = async function () {
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
      if (!data) { currentGaze = null; return; }
      let raw = { x: data.x, y: data.y };
      if (correctionModel) {
        const [a, b, c, d, e, f] = correctionModel;
        currentGaze = { x: a * raw.x + b * raw.y + c, y: d * raw.x + e * raw.y + f };
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
    if (calibrationDone && currentGaze) {
      let last = gazePath[gazePath.length - 1];
      let filtered = getMedianGaze(currentGaze);
      let smooth = getSmoothedGaze(filtered);
      smooth = limitJump(last, smooth);

      

      ctx.fillStyle = "limegreen";
      ctx.beginPath(); ctx.arc(smooth.x, smooth.y, 3, 0, 2 * Math.PI); ctx.fill();

      if (last) {
        ctx.beginPath();
        ctx.strokeStyle = "limegreen";
        ctx.lineWidth = 2;
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(smooth.x, smooth.y);
        ctx.stroke();
      }

      gazePath.push({ x: smooth.x, y: smooth.y });
      coordDisplay.innerText = `Gaze: (${smooth.x.toFixed(1)}, ${smooth.y.toFixed(1)})`;
    }

    requestAnimationFrame(traceGazePath);
  }
  async function saveDataset() {
    const chunkSize = 1000; // number of points per chunk
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
};
