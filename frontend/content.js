let calibrationData = [];
let isCalibrating = false;

function correctDrift(x, y) {
    if (calibrationData.length === 0) return { x, y };
    const avgCalib = calibrationData.reduce((acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
    }), { x: 0, y: 0 });
    avgCalib.x /= calibrationData.length;
    avgCalib.y /= calibrationData.length;
    return {
        x: x - avgCalib.x,
        y: y - avgCalib.y
    };
}

function getHeadShift() {
    const positions = webgazer.getTracker()?.getPositions();
    if (!positions) return { dx: 0, dy: 0 };
    const leftEye = positions.find(p => p.name === 'leftEye');
    const rightEye = positions.find(p => p.name === 'rightEye');
    const nose = positions.find(p => p.name === 'nose');
    if (leftEye && rightEye && nose) {
        const headCenterX = (leftEye.x + rightEye.x) / 2;
        const dx = headCenterX - nose.x;
        const dy = (leftEye.y + rightEye.y) / 2 - nose.y;
        return { dx, dy };
    }
    return { dx: 0, dy: 0 };
}

window.onload = async function () {
    if (typeof webgazer === "undefined") return;

    const canvas = document.getElementById('gazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gazeDot = document.getElementById('gazeDot');

    await webgazer.setRegression('ridge').begin();
    webgazer.showVideo(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .showPredictionPoints(false);

    const calibrationDot = document.createElement('div');
    calibrationDot.id = 'calibrationDot';
    calibrationDot.style.position = 'absolute';
    calibrationDot.style.width = '30px';
    calibrationDot.style.height = '30px';
    calibrationDot.style.zIndex = 9999;

    const dotCore = document.createElement('div');
    dotCore.style.width = '20px';
    dotCore.style.height = '20px';
    dotCore.style.borderRadius = '50%';
    dotCore.style.backgroundColor = 'red';
    dotCore.style.position = 'absolute';
    dotCore.style.top = '5px';
    dotCore.style.left = '5px';
    dotCore.style.zIndex = 2;

    const progressRing = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    progressRing.setAttribute("width", "30");
    progressRing.setAttribute("height", "30");
    progressRing.style.position = "absolute";
    progressRing.style.top = "0";
    progressRing.style.left = "0";
    progressRing.style.zIndex = 1;

    const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgCircle.setAttribute("cx", "15");
    bgCircle.setAttribute("cy", "15");
    bgCircle.setAttribute("r", "13");
    bgCircle.setAttribute("stroke", "rgba(255,255,255,0.6)");
    bgCircle.setAttribute("stroke-width", "2");
    bgCircle.setAttribute("fill", "none");

    const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progressCircle.setAttribute("cx", "15");
    progressCircle.setAttribute("cy", "15");
    progressCircle.setAttribute("r", "13");
    progressCircle.setAttribute("stroke", "lime");
    progressCircle.setAttribute("stroke-width", "2");
    progressCircle.setAttribute("fill", "none");
    progressCircle.setAttribute("stroke-dasharray", "100");
    progressCircle.setAttribute("stroke-dashoffset", "100");

    progressRing.appendChild(bgCircle);
    progressRing.appendChild(progressCircle);
    calibrationDot.appendChild(dotCore);
    calibrationDot.appendChild(progressRing);
    document.body.appendChild(calibrationDot);

    function generateZigzagRandomPoints(rows, cols) {
        const points = [];
        const cellWidth = 1 / cols;
        const cellHeight = 1 / rows;
        for (let row = 0; row < rows; row++) {
            const rowPoints = [];
            for (let col = 0; col < cols; col++) {
                const jitterX = Math.random() * 0.4 + 0.3;
                const jitterY = Math.random() * 0.4 + 0.3;
                rowPoints.push({
                    x: (col + jitterX) * cellWidth,
                    y: (row + jitterY) * cellHeight
                });
            }
            if (row % 2 !== 0) rowPoints.reverse();
            points.push(...rowPoints);
        }
        return points;
    }

    function animateDot(startX, startY, endX, endY, duration) {
        const startTime = performance.now();
        return new Promise(resolve => {
            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                calibrationDot.style.left = `${currentX * window.innerWidth - 15}px`;
                calibrationDot.style.top = `${currentY * window.innerHeight - 15}px`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(animate);
        });
    }

    async function collectGazeDataAtPoint() {
        return new Promise(resolve => {
            let gazeSamples = [];
            const sampleDuration = 1200;
            const startTime = performance.now();

            function updateProgress(progress) {
                const percent = Math.min(Math.max(progress, 0), 1);
                const offset = 100 - percent * 100;
                progressCircle.setAttribute("stroke-dashoffset", offset);
            }

            function collectGaze(currentTime) {
                const elapsed = currentTime - startTime;
                updateProgress(elapsed / sampleDuration);

                if (elapsed < sampleDuration) {
                    const gazeData = webgazer.getCurrentPrediction();
                    if (gazeData && typeof gazeData.x !== 'undefined' && typeof gazeData.y !== 'undefined') {
                        gazeSamples.push({ x: gazeData.x, y: gazeData.y });
                    }
                    requestAnimationFrame(collectGaze);
                } else {
                    updateProgress(1);
                    if (gazeSamples.length > 0) {
                        const avgX = gazeSamples.reduce((sum, s) => sum + s.x, 0) / gazeSamples.length;
                        const avgY = gazeSamples.reduce((sum, s) => sum + s.y, 0) / gazeSamples.length;
                        calibrationData.push({ x: avgX - window.innerWidth / 2, y: avgY - window.innerHeight / 2 });
                    }
                    updateProgress(0);
                    resolve();
                }
            }

            requestAnimationFrame(collectGaze);
        });
    }

    async function highAccuracyCalibration() {
        isCalibrating = true;
        alert("Calibration will begin. Please follow the red dot.");
        const points = generateZigzagRandomPoints(7, 7);
        let lastX = points[0].x;
        let lastY = points[0].y;

        calibrationDot.style.left = `${lastX * window.innerWidth - 15}px`;
        calibrationDot.style.top = `${lastY * window.innerHeight - 15}px`;
        await collectGazeDataAtPoint();

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            await animateDot(lastX, lastY, point.x, point.y, 1200);
            await collectGazeDataAtPoint();
            lastX = point.x;
            lastY = point.y;
        }

        calibrationDot.style.display = 'none';
        isCalibrating = false;
    }

    const gazeBuffer = [];
    const bufferSize = 15;
    let latestX = null, latestY = null;
    let prevX = null, prevY = null;

    function setupGazeListener() {
        webgazer.setGazeListener((data) => {
            if (!data || isCalibrating) return;
            if (typeof data.x !== 'undefined' && typeof data.y !== 'undefined') {
                gazeBuffer.push({ x: data.x, y: data.y });
                if (gazeBuffer.length > bufferSize) {
                    gazeBuffer.shift();
                }
                const sum = gazeBuffer.reduce((acc, point) => {
                    acc.x += point.x;
                    acc.y += point.y;
                    return acc;
                }, { x: 0, y: 0 });
                latestX = sum.x / gazeBuffer.length;
                latestY = sum.y / gazeBuffer.length;
            }
        });
    }

    function drawLoop() {
        if (latestX != null && latestY != null) {
            if (!isFinite(latestX) || !isFinite(latestY)) return;
            let { x, y } = correctDrift(latestX - window.innerWidth / 2, latestY - window.innerHeight / 2);
            const { dx, dy } = getHeadShift();
            x = x + window.innerWidth / 2 - dx;
            y = y + window.innerHeight / 2 - dy;

            gazeDot.style.left = `${x - 5}px`;
            gazeDot.style.top = `${y - 5}px`;

            if (prevX !== null && prevY !== null) {
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            prevX = x;
            prevY = y;
        }

        requestAnimationFrame(drawLoop);
    }

    await highAccuracyCalibration();
    alert("Calibration complete!");

    await webgazer.clearGazeListener();
    await webgazer.begin();
    setupGazeListener();
    drawLoop();
};
