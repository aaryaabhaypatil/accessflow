// JavaScript for handling the popup interactions
// This controls the enable/disable action for eye-tracking

const toggleSwitch = document.getElementById('toggleSwitch');
let isOn = false;

toggleSwitch.addEventListener('click', function() {
  isOn = !isOn;

  if (isOn) {
    this.classList.add('on');
  } else {
    this.classList.remove('on');
  }
});