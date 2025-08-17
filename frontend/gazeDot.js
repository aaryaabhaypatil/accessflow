window.currentGaze = { x: 0, y: 0 };
window.dotGaze = null;

window.initGazeDot = function() {
  if (window.dotGaze) return;
  const dot = document.createElement("div");
  dot.style.position = "fixed";
  dot.style.width = "20px";
  dot.style.height = "20px";
  dot.style.background = "red";
  dot.style.borderRadius = "50%";
  dot.style.zIndex = "10002";
  dot.style.pointerEvents = "none";
  document.body.appendChild(dot);
  window.dotGaze = dot;
};

window.updateGazeDot = function() {
  if (!window.dotGaze) return;
  window.dotGaze.style.left = `${window.currentGaze.x - 10}px`;
  window.dotGaze.style.top = `${window.currentGaze.y - 10}px`;
};
