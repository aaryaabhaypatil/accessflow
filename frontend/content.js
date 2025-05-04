let calibrationData = [];
let isCalibrating = false;

let dwellStartTime = null;
let dwellTarget = null;
const DWELL_TIME_THRESHOLD = 800;

const CALIBRATION_DURATION = 2000;
const CALIBRATION_POINTS = 49;
const CALIBRATION_DELAY = 750;
const RANDOMIZATION_FACTOR = 0.25;
const STABILITY_THRESHOLD = 20;
const STABLE_SAMPLES_THRESHOLD = 12;

const DRIFT_CORRECTION_SCALE = 1.0;

function correctDrift(x, y) {
    if (calibrationData.length === 0) return { x, y };
    const avgCalib = calibrationData.reduce((acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
    }), { x: 0, y: 0 });
    avgCalib.x /= calibrationData.length;
    avgCalib.y /= calibrationData.length;
    return {
        x: x - avgCalib.x * DRIFT_CORRECTION_SCALE,
        y: y - avgCalib.y * DRIFT_CORRECTION_SCALE
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
        return { dx: dx * 0.6, dy: dy * 0.6 };
    }
    return { dx: 0, dy: 0 };
}

window.onload = async function () {
    if (typeof webgazer === "undefined") {
        alert("Webgazer not found. Please ensure it is correctly integrated.");
        return;
    }

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
    Object.assign(calibrationDot.style, {
        position: 'absolute',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'red', 
        zIndex: 9999
    });
    document.body.appendChild(calibrationDot);

    function generateCalibrationPoints() {
        const points = [];
        const numPointsPerRow = Math.round(Math.sqrt(CALIBRATION_POINTS));
        for (let i = 0; i < CALIBRATION_POINTS; i++) {
            const row = Math.floor(i / numPointsPerRow);
            const col = i % numPointsPerRow;
            let x = (col + 0.5) / numPointsPerRow;
            let y = (row + 0.5) / numPointsPerRow;
            x += (Math.random() - 0.5) * (1 / numPointsPerRow) * RANDOMIZATION_FACTOR;
            y += (Math.random() - 0.5) * (1 / numPointsPerRow) * RANDOMIZATION_FACTOR;
            x = Math.max(0.125, Math.min(0.875, x));
            y = Math.max(0.125, Math.min(0.875, y));
            points.push({ x, y });
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
                calibrationDot.style.left = `${currentX * window.innerWidth - 10}px`;
                calibrationDot.style.top = `${currentY * window.innerHeight - 10}px`;
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(animate);
        });
    }

    async function collectGazeDataAtPoint(pointIndex, targetX, targetY) {
        return new Promise(resolve => {
            let gazeSamples = [];
            let lastX = null;
            let lastY = null;
            let stableCount = 0;
            const startTime = performance.now();

            function collectGaze(currentTime) {
                const elapsed = currentTime - startTime;
                if (elapsed < CALIBRATION_DURATION) {
                    const gazeData = webgazer.getCurrentPrediction();
                    if (gazeData && typeof gazeData.x !== 'undefined' && typeof gazeData.y !== 'undefined') {
                        const { x, y } = gazeData;
                        const distance = lastX !== null && lastY !== null ? Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2)) : 0;
                        if (distance < STABILITY_THRESHOLD) {
                            stableCount++;
                        } else {
                            stableCount = 0;
                        }
                        lastX = x;
                        lastY = y;
                        gazeSamples.push({ x, y });
                    }
                    requestAnimationFrame(collectGaze);
                } else {
                    if (stableCount >= STABLE_SAMPLES_THRESHOLD && gazeSamples.length > 0) {
                        const avgX = gazeSamples.reduce((sum, sample) => sum + sample.x, 0) / gazeSamples.length;
                        const avgY = gazeSamples.reduce((sum, sample) => sum + sample.y, 0) / gazeSamples.length;
                        calibrationData.push({
                            rawX: avgX,
                            rawY: avgY,
                            offsetX: avgX - targetX * window.innerWidth,
                            offsetY: avgY - targetY * window.innerHeight,
                            pointIndex
                        });
                        console.log(`Calib ${pointIndex + 1}: Target(${targetX.toFixed(2)}, ${targetY.toFixed(2)}), Raw(${avgX.toFixed(2)}, ${avgY.toFixed(2)}), Offset(${ (avgX - targetX * window.innerWidth).toFixed(2)}, ${(avgY - targetY * window.innerHeight).toFixed(2)})`);
                    } else {
                        console.warn(`Calib ${pointIndex + 1}: Not enough stable samples (${stableCount}/${STABLE_SAMPLES_THRESHOLD}). Skipping.`);
                    }
                    resolve();
                }
            }
            requestAnimationFrame(collectGaze);
        });
    }

    async function highAccuracyCalibration() {
        isCalibrating = true;
        alert("Calibration will begin now. Please focus on the lime dot!");
        const points = generateCalibrationPoints();
        const totalPoints = points.length;
        let currentPointIndex = 0;

        document.getElementById('progressContainer').style.display = 'block';

        let prevX = 0.5;
        let prevY = 0.5;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            await animateDot(prevX, prevY, point.x, point.y, 1000); 
            await collectGazeDataAtPoint(i, point.x, point.y);
            prevX = point.x;
            prevY = point.y;
            currentPointIndex++;
            const progress = (currentPointIndex / totalPoints) * 100;
            updateCalibrationProgress(progress);
        }

        console.log('Calibration complete. Calibration data:', calibrationData);
        calibrationDot.style.display = 'none';
        document.getElementById('progressContainer').style.display = 'none';
        isCalibrating = false;
    }

    function updateCalibrationProgress(progress) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.innerText = `${Math.round(progress)}%`;
        }
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
                console.log("Gaze Listener:", { latestX, latestY });
            }
        });
    }

    function handleGazeDwellSelection(x, y) {
        if (!isFinite(x) || !isFinite(y) || x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
            console.error("Invalid gaze coordinates detected:", x, y);
            dwellStartTime = null;
            dwellTarget = null;
            return;
        }
        const element = document.elementFromPoint(x, y);
        if (element !== dwellTarget) {
            dwellTarget = element;
            dwellStartTime = performance.now();
        } else if (element && dwellStartTime !== null) {
            const dwellDuration = performance.now() - dwellStartTime;
            if (dwellDuration >= DWELL_TIME_THRESHOLD) {
                element.classList.add('gaze-selected');
                element.click();
                console.log('Element clicked by gaze:', element);
                setTimeout(() => element.classList.remove('gaze-selected'), 500);
                dwellStartTime = null;
                dwellTarget = null;
            }
        }
    }

    function drawLoop() {
        if (latestX != null && latestY != null) {
            if (!isFinite(latestX) || !isFinite(latestY)) {
                console.error("Invalid gaze coordinates detected in drawLoop:", latestX, latestY);
                return;
            }
            let { x, y } = correctDrift(latestX - window.innerWidth / 2, latestY - window.innerHeight / 2);
            const { dx, dy } = getHeadShift();
            x = x + window.innerWidth / 2 - dx;
            y = y + window.innerHeight / 2 - dy;

            gazeDot.style.left = `${x - 5}px`;
            gazeDot.style.top = `${y - 5}px`;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(prevX === null ? x : prevX, prevY === null ? y : prevY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'; 
            ctx.lineWidth = 2;
            ctx.stroke();

            prevX = x;
            prevY = y;
    
            console.log("Draw Loop:", { rawLatestX: latestX, rawLatestY: latestY, correctedX: x, correctedY: y, prevX, prevY });
        } else {
            prevX = null;
            prevY = null;
    
            console.log("Draw Loop: No latest gaze data, resetting prevX/Y");
        }
        requestAnimationFrame(drawLoop);
    }

    await highAccuracyCalibration();
    alert("Calibration complete! Thank you.");

    await webgazer.clearGazeListener();
    await webgazer.begin();
    webgazer.showVideo(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .showPredictionPoints(false);

    setupGazeListener();
    drawLoop();
};