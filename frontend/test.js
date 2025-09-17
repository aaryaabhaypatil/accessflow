// gazeTest.js
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.webgazer) {
    console.error("WebGazer not found! Make sure webgazer.js is included.");
    return;
  }

  // Request webcam access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    document.body.appendChild(video);

    await new Promise(resolve => {
      video.onloadeddata = () => resolve();
    });
  } catch (err) {
    console.error("Camera access failed:", err);
    return;
  }

  const targetX = window.innerWidth / 2;
  const targetY = window.innerHeight / 2;

  const targetDot = document.createElement("div");
  Object.assign(targetDot.style, {
    position: "fixed",
    left: `${targetX - 10}px`,
    top: `${targetY - 10}px`,
    width: "20px",
    height: "20px",
    backgroundColor: "green",
    borderRadius: "50%",
    zIndex: "999999",
  });
  document.body.appendChild(targetDot);

  const gazeDot = document.createElement("div");
  Object.assign(gazeDot.style, {
    position: "fixed",
    width: "15px",
    height: "15px",
    backgroundColor: "red",
    borderRadius: "50%",
    zIndex: "999999",
    pointerEvents: "none",
  });
  document.body.appendChild(gazeDot);

  const gazeLog = [];

  await webgazer
    .setRegression("ridge")
    .setTracker("TFFacemesh")
    .showPredictionPoints(false)
    .setGazeListener((data) => {
      if (!data || !isFinite(data.x) || !isFinite(data.y)) return;

      const x = Math.min(Math.max(data.x, 0), window.innerWidth);
      const y = Math.min(Math.max(data.y, 0), window.innerHeight);

      gazeDot.style.left = `${x - 7.5}px`;
      gazeDot.style.top = `${y - 7.5}px`;

      const errorX = x - targetX;
      const errorY = y - targetY;

      const logEntry = {
        time: Date.now(),
        gazeX: x,
        gazeY: y,
        targetX,
        targetY,
        errorX,
        errorY,
      };

      gazeLog.push(logEntry);
      console.log("Gaze vs Target:", logEntry);
    })
    .begin();

  console.log("WebGazer started ✅. Look at the green dot!");
});
