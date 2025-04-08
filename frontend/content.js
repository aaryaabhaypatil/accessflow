window.onload = function () {
    if (typeof webgazer === "undefined") {
        console.error("WebGazer not loaded");
        return;
    }

    // Create a canvas element for drawing the gaze trace
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Set canvas size to match the window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Store previous gaze coordinates
    let prevX = null;
    let prevY = null;

    // Start the gaze listener using WebGazer
    webgazer.setGazeListener((data, timestamp) => {
        if (data == null) return;

        // x-coordinate and y-coordinate of the gaze
        const x = data.x;
        const y = data.y;

        // Draw a line from the previous gaze point to the current one
        if (prevX !== null && prevY !== null) {
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';  // Line color (green, semi-transparent)
            ctx.lineWidth = 2;  // Line width
            ctx.stroke();
        }

        // Update the previous gaze coordinates for the next frame
        prevX = x;
        prevY = y;

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
};
