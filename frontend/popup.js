document.addEventListener("DOMContentLoaded", function () {
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const feedbackBox = document.getElementById("feedbackBox");
  const toggle = document.querySelector(".toggle-switch-popup");

  let calibrationDot = document.getElementById("calibrationDot");
  if (!calibrationDot) {
    calibrationDot = document.createElement("div");
    calibrationDot.id = "calibrationDot";
    calibrationDot.style.position = "fixed";
    calibrationDot.style.width = "20px";
    calibrationDot.style.height = "20px";
    calibrationDot.style.backgroundColor = "red";
    calibrationDot.style.borderRadius = "50%";
    calibrationDot.style.zIndex = "15000";
    calibrationDot.style.pointerEvents = "none";
    calibrationDot.style.display = "none";
    document.body.appendChild(calibrationDot);
  }

  const blurOverlay = document.getElementById("blurOverlay");

  const calibrationPoints = [
    { x: 0.1, y: 0.1 },
    { x: 0.5, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.9 },
    { x: 0.5, y: 0.9 },
    { x: 0.9, y: 0.9 }
  ];

  let currentCalibrationIndex = 0;
  let calibrationInProgress = false;
  const fixationDuration = 1500;
  const animationRadius = 15;

  let animationFrameId;
  let animationStartTime;

  function startCalibrationGame() {
    if (calibrationInProgress) return;
    calibrationInProgress = true;
    currentCalibrationIndex = 0;

    if (blurOverlay) {
      blurOverlay.classList.add("active");
      blurOverlay.style.display = "block";
      blurOverlay.style.opacity = "1";
    }

    calibrationDot.style.display = "block";
    nextCalibrationPoint();
  }

  function nextCalibrationPoint() {
    if (currentCalibrationIndex >= calibrationPoints.length) {
      finishCalibration();
      return;
    }
    const point = calibrationPoints[currentCalibrationIndex];
    animateCalibrationDot(point.x, point.y);
    setTimeout(() => {
      console.log(`Calibration point ${currentCalibrationIndex + 1} recorded at (${point.x}, ${point.y})`);
      currentCalibrationIndex++;
      nextCalibrationPoint();
    }, fixationDuration);
  }

  function animateCalibrationDot(normX, normY) {
    cancelAnimationFrame(animationFrameId);
    animationStartTime = performance.now();

    function updatePosition(timestamp) {
      const elapsed = timestamp - animationStartTime;
      const angle = (elapsed / 1000) * 2 * Math.PI * 0.5;
      const centerX = window.innerWidth * normX;
      const centerY = window.innerHeight * normY;
      const offsetX = animationRadius * Math.cos(angle);
      const offsetY = animationRadius * Math.sin(angle);

      calibrationDot.style.left = `${centerX + offsetX - 10}px`;
      calibrationDot.style.top = `${centerY + offsetY - 10}px`;

      animationFrameId = requestAnimationFrame(updatePosition);
    }

    animationFrameId = requestAnimationFrame(updatePosition);
  }

  function finishCalibration() {
    cancelAnimationFrame(animationFrameId);
    calibrationDot.style.display = "none";
    calibrationInProgress = false;

    if (blurOverlay) {
      blurOverlay.style.opacity = "0";
      setTimeout(() => {
        blurOverlay.style.display = "none";
      }, 300);
    }
    blurOverlay.classList.remove("active");
    alert("Calibration complete! Thank you for playing.");
  }

  const calibrateBtn = document.getElementById("calibrateBtn");
  if (calibrateBtn) {
    calibrateBtn.addEventListener("click", () => {
      if (!calibrationInProgress) {
        startCalibrationGame();
      } else {
        alert("Calibration is already in progress!");
      }
    });
  }

  if (localStorage.getItem("toggleActive") === "true") {
    toggle.classList.add("active");
  }

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    localStorage.setItem("toggleActive", toggle.classList.contains("active"));
  });

  const toggleSwitch = document.getElementById("toggleSwitch");
  let isTrackingOn = false;

  if (openPopupBtn && popupOverlay) {
    openPopupBtn.addEventListener("click", () => {
      popupOverlay.style.display = "flex";
    });
  }

  if (closeBtn && popupOverlay) {
    closeBtn.addEventListener("click", () => {
      popupOverlay.style.display = "none";
    });
  }

  if (toggleSwitch) {
    const savedState = localStorage.getItem('isTrackingOn');
    isTrackingOn = savedState === 'true';

    if (isTrackingOn) {
      toggleSwitch.classList.add("active");
    } else {
      toggleSwitch.classList.remove("active");
    }

    toggleSwitch.addEventListener("click", function () {
      isTrackingOn = !isTrackingOn;

      if (isTrackingOn) {
        this.classList.add("active");
        console.log("Toggle clicked. Eye tracking is now ON.");
      } else {
        this.classList.remove("active");
        console.log("Toggle clicked. Eye tracking is now OFF.");
      }

      localStorage.setItem('isTrackingOn', isTrackingOn.toString());
    });
  }

  const scrollLeftSelect = document.getElementById("scrollLeftSelect");
  const scrollRightSelect = document.getElementById("scrollRightSelect");
  const scrollUpSelect = document.getElementById("scrollUpSelect");
  const scrollDownSelect = document.getElementById("scrollDownSelect");
  const triggerSelect = document.getElementById("triggerSelect");

  const addButton = document.getElementById("addButton");
  if (addButton) {
    addButton.addEventListener("click", function () {
      console.log("Add Settings button clicked!");
    });
  }

  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      console.log("Save Preferences button clicked!");

      const preferences = {
        "Scroll Left": scrollLeftSelect ? scrollLeftSelect.value : "",
        "Scroll Right": scrollRightSelect ? scrollRightSelect.value : "",
        "Scroll Up": scrollUpSelect ? scrollUpSelect.value : "",
        "Scroll Down": scrollDownSelect ? scrollDownSelect.value : "",
        "Trigger or choose": triggerSelect ? triggerSelect.value : ""
      };

      console.log("Preferences to be saved:", preferences);

      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ gazePreferences: preferences }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving preferences:", chrome.runtime.lastError);
          } else {
            console.log("Preferences saved successfully:", preferences);
            showFeedbackBox();
          }
        });
      } else {
        console.warn("chrome.storage.local is not available. Are you running this as a Chrome extension?");
        showFeedbackBox();
      }
    });
  }

  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["gazePreferences"], function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error loading preferences:", chrome.runtime.lastError);
        return;
      }
      if (data.gazePreferences && typeof data.gazePreferences === "object") {
        if (scrollLeftSelect) scrollLeftSelect.value = data.gazePreferences["Scroll Left"] || "";
        if (scrollRightSelect) scrollRightSelect.value = data.gazePreferences["Scroll Right"] || "";
        if (scrollUpSelect) scrollUpSelect.value = data.gazePreferences["Scroll Up"] || "";
        if (scrollDownSelect) scrollDownSelect.value = data.gazePreferences["Scroll Down"] || "";
        if (triggerSelect) triggerSelect.value = data.gazePreferences["Trigger or choose"] || "";
      }
    });
  }

  function showFeedbackBox() {
    if (!feedbackBox) return;
    const blurOverlay = document.getElementById('blurOverlay');
    if (blurOverlay) blurOverlay.style.display = 'block';

    feedbackBox.textContent = "Preferences saved!";
    feedbackBox.style.display = "block";

    setTimeout(() => {
      feedbackBox.style.display = "none";
      if (blurOverlay) blurOverlay.style.display = "none";

      if (popupOverlay) {
        popupOverlay.style.display = "none";
      }
    }, 1000);
  }
});
