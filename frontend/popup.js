
const toggleSwitch = document.getElementById('toggleSwitch');
let isOn = false;


// Add an event listener that runs when the DOM content is fully loaded.
document.addEventListener("DOMContentLoaded", function () {
    const toggleSwitch = document.getElementById('toggleSwitch');
    let isOn = false;
    // Checking if the toggle switch element was found.
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

    const saveButton = document.getElementById("saveButton");

    if (saveButton) {
        saveButton.addEventListener("click", function () {
            console.log("Save Preferences button clicked!");
        });
    } else {
        console.error("saveButton element not found.");
    }
    const addButton = document.getElementById("addButton");

    if (addButton) {
        addButton.addEventListener("click", function () {
            console.log("Add new gesture button clicked!");
        });
    } else {
        console.error("addButton element not found.");
    }
    if (!isOn) {
        console.error("chrome.storage is not available. Are you running this as a Chrome extension?");
    }
});
