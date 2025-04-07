

window.onload = function () {
    if (typeof webgazer === "undefined") {
        console.error("WebGazer not loaded");
        return;
    }
    // Start the gaze listener using WebGazer
    webgazer.setGazeListener((data, timestamp) => {
    if (data == null) 
        return;
    // x-coordinate and y-coordinate of the gaze
    const x = data.x; 
    const y = data.y; 

    // Find the element currently under the user's gaze
    const element = document.elementFromPoint(x, y);
    if (element) {
    element.classList.add("gaze-hover");

    // Remove the effect after a short delay
    setTimeout(() => {
        element.classList.remove("gaze-hover");
    }, 200); 
    }
    }).begin();

    

    // Hide webcam preview
    webgazer
    .showVideo(false)
    .showFaceOverlay(false)
    .showFaceFeedbackBox(false);
    
    console.log("Gaze tracking started");

};
  

