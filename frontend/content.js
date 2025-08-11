// Popup open/close
const openBtn = document.getElementById('openPopupBtn');
const popupOverlay = document.getElementById('popupOverlay');
const closeBtn = document.getElementById('closeBtn');
const toggleSwitch = document.getElementById('toggleSwitch');

openBtn.addEventListener('click', () => {
  popupOverlay.style.display = 'flex';
  startWebGazer();
});

closeBtn.addEventListener('click', () => {
  popupOverlay.style.display = 'none';
  stopWebGazer();
});

toggleSwitch.addEventListener('click', () => {
  toggleSwitch.classList.toggle('active');

});



let webgazerStarted = false;

const gazeDot = document.getElementById('gazeDot');
const canvas = document.getElementById('gazeCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startWebGazer() {
  if (webgazerStarted) return;
  webgazerStarted = true;

  webgazer
    .setRegression('ridge') // example config
    .setGazeListener(function(data, elapsedTime) {
      if (data == null) {
        gazeDot.style.display = 'none';
        return;
      }
      gazeDot.style.display = 'block';
      const x = data.x;
      const y = data.y;

      // Position gazeDot relative to the popupContent
      const popupRect = document.getElementById('popupContent').getBoundingClientRect();
      let gazeX = x - popupRect.left;
      let gazeY = y - popupRect.top;

      // Clamp values inside popupContent bounds
      gazeX = Math.min(Math.max(gazeX, 0), popupRect.width);
      gazeY = Math.min(Math.max(gazeY, 0), popupRect.height);

      gazeDot.style.left = gazeX - 6 + 'px'; // center the 12px dot
      gazeDot.style.top = gazeY - 6 + 'px';

    })
    .begin()
    .showVideo(false)
    .showPredictionPoints(false);
}

function stopWebGazer() {
  if (!webgazerStarted) return;
  webgazerStarted = false;
  webgazer.end();
  gazeDot.style.display = 'none';
}

