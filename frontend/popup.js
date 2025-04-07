


// Add an event listener that runs when the DOM content is fully loaded.
document.addEventListener("DOMContentLoaded", function () {
    // Toggle Switch (Assuming you have toggleSwitch defined elsewhere)
    const toggleSwitch = document.getElementById('toggleSwitch');
    let isOn = false;

    if (toggleSwitch) {
        toggleSwitch.addEventListener('click', function() {
            isOn = !isOn;

            if (isOn) {
                this.classList.add('on');
                console.log(`Toggle clicked. Eye tracking is now ${isOn ? "ON" : "OFF"}.`);
            } else {
                this.classList.remove('on');
            }
        });
    }

    // Get the select elements for preferences
    const scrollLeftSelect = document.getElementById("scrollLeftSelect");
    const scrollRightSelect = document.getElementById("scrollRightSelect");
    const scrollUpSelect = document.getElementById("scrollUpSelect");
    const scrollDownSelect = document.getElementById("scrollDownSelect");
    const triggerSelect = document.getElementById("triggerSelect");


    // Add Button
    const addButton = document.getElementById("addButton");

    if (addButton) {
        addButton.addEventListener("click", function () {
            console.log("Add Settings button clicked!");
            console.log("Adding a new preference (example).");
        });
    } else {
        console.error("addButton element not found.");
    }

    // Save Button (Save all existing preferences)
    const saveButton = document.getElementById("saveButton");

    if (saveButton) {
        saveButton.addEventListener("click", function () {
            console.log("Save Preferences button clicked!");

            // Get the selected values from the select elements
            const preferences = {
                "Scroll Left": scrollLeftSelect ? scrollLeftSelect.value : "",
                "Scroll Right": scrollRightSelect ? scrollRightSelect.value : "",
                "Scroll Up": scrollUpSelect ? scrollUpSelect.value : "",
                "Scroll Down": scrollDownSelect ? scrollDownSelect.value : "",
                "Trigger or choose": triggerSelect ? triggerSelect.value : ""
            };
            console.log("Preferences to be saved:", preferences);

            // Print the selected preferences to the console with names
            console.log("Scroll Left:", scrollLeftSelect.value);
            console.log("Scroll Right:", scrollRightSelect.value);
            console.log("Scroll Up:", scrollUpSelect.value);
            console.log("Scroll Down:", scrollDownSelect.value);
            console.log("Trigger:", triggerSelect.value);

            // Save the preferences to chrome.storage.local
            chrome.storage.local.set({ gazePreferences: preferences }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error saving preferences:", chrome.runtime.lastError);
                } else {
                    console.log("Preferences saved successfully:", preferences);
                }
            });
        });
    } else {
        console.error("saveButton element not found.");
    }

    if (!isOn) {
        console.error("chrome.storage is not available. Are you running this as a Chrome extension?");
    }

    // Load saved preferences on popup load
    chrome.storage.local.get(["gazePreferences"], function (data) {
        if (chrome.runtime.lastError) {
            console.error("Error loading preferences:", chrome.runtime.lastError);
            return;
        }

        if (data.gazePreferences) {
            scrollLeftSelect.value = data.gazePreferences["Scroll Left"] || "";
            scrollRightSelect.value = data.gazePreferences["Scroll Right"] || "";
            scrollUpSelect.value = data.gazePreferences["Scroll Up"] || "";
            scrollDownSelect.value = data.gazePreferences["Scroll Down"] || "";
            triggerSelect.value = data.gazePreferences["Trigger"] || "";
        }
    });
});