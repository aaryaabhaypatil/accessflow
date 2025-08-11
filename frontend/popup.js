document.addEventListener("DOMContentLoaded", function () {
  // Popup elements
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");

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

  // Toggle switch click
  if (toggleSwitch) {
    toggleSwitch.addEventListener("click", function () {
      isTrackingOn = !isTrackingOn;

      if (isTrackingOn) {
        this.classList.add("active");  
        console.log("Toggle clicked. Eye tracking is now ON.");

      } else {
        this.classList.remove("active");
        console.log("Toggle clicked. Eye tracking is now OFF.");

      }
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

  // Save button
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

      // Save preferences to chrome.storage.local
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ gazePreferences: preferences }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving preferences:", chrome.runtime.lastError);
          } else {
            console.log("Preferences saved successfully:", preferences);
          }
        });
      } else {
        console.warn("chrome.storage.local is not available. Are you running this as a Chrome extension?");
      }
    });
  } else {
    console.error("Save button element not found.");
  }

  // Load preferences from chrome.storage.local on popup load
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
});
