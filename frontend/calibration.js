

window.onload = async function () {

  await webgazer.setRegression('ridge')
    .setTracker('clmtrackr')
    .setGazeListener((data, elapsedTime) => {
      if (data == null) {
        console.log("User gaze: not detected");
        return;
      }
      let x = data.x;
      let y = data.y;
      console.log("User gaze:", { x: Math.round(x), y: Math.round(y) });
    })
    .begin();


  webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);


  const dot = document.createElement("div");
  dot.id = "calibrationDot";
  dot.style.position = "fixed";
  dot.style.width = "20px";
  dot.style.height = "20px";
  dot.style.background = "red";
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
  function moveDot() {
    if (current >= positions.length) {
      console.log("Calibration complete!");
      return;
    }
    const pos = positions[current];
    dot.style.left = `${pos.x - 10}px`;
    dot.style.top = `${pos.y - 10}px`;
    console.log("Dot at:", pos);

    current++;
    setTimeout(moveDot, 2000); 
  }

  moveDot();
};
