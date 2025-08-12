document.addEventListener("DOMContentLoaded", function () {
  // Popup elements
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");

  // Feedback box element (you need to add this in your HTML with id="feedbackBox")
  const feedbackBox = document.getElementById("feedbackBox");
  const toggle = document.querySelector(".toggle-switch-popup");

  // Load saved state from localStorage
  if (localStorage.getItem("toggleActive") === "true") {
    toggle.classList.add("active");
  }

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    localStorage.setItem("toggleActive", toggle.classList.contains("active"));
  });

  // Toggle switch
  const toggleSwitch = document.getElementById("toggleSwitch");
  let isTrackingOn = false;

  // Open popup on button click
  if (openPopupBtn && popupOverlay) {
    openPopupBtn.addEventListener("click", () => {
      popupOverlay.style.display = "flex";
    });
  } else {
    console.error("Open popup button or popup overlay not found.");
  }

  // Close popup on close button click
  if (closeBtn && popupOverlay) {
    closeBtn.addEventListener("click", () => {
      popupOverlay.style.display = "none";
    });
  } else {
    console.error("Close button or popup overlay not found.");
  }

  // Toggle switch with persistence in localStorage
  if (toggleSwitch) {
    // Load saved state
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

      // Save toggle state
      localStorage.setItem('isTrackingOn', isTrackingOn.toString());
    });
  } else {
    console.error("Toggle switch element not found.");
  }

  // Select elements
  const scrollLeftSelect = document.getElementById("scrollLeftSelect");
  const scrollRightSelect = document.getElementById("scrollRightSelect");
  const scrollUpSelect = document.getElementById("scrollUpSelect");
  const scrollDownSelect = document.getElementById("scrollDownSelect");
  const triggerSelect = document.getElementById("triggerSelect");

  // Add button
  const addButton = document.getElementById("addButton");
  if (addButton) {
    addButton.addEventListener("click", function () {
      console.log("Add Settings button clicked!");
    });
  } else {
    console.error("Add button element not found.");
  }

  // Save button with feedback box
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

      // Save preferences to chrome.storage.local if available
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
        // Show feedback anyway
        showFeedbackBox();
      }
    });
  } else {
    console.error("Save button element not found.");
  }

  // Load preferences on popup load
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
      } else {
        console.warn("Gaze preferences not found or invalid:", data);
      }
    });
  } else {
    console.warn("chrome.storage.local is not available. Are you running this as a Chrome extension?");
  }

  // Show the feedback box as a popup overlay, then hide it and close popup after 2 seconds
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
