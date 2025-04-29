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
    console.log('Canvas size:', canvas.width, canvas.height);

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

    function generateGridCalibrationPoints(rows, cols) {
        const points = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                points.push({ x: j / (cols - 1), y: i / (rows - 1) });
            }
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

    async function collectGazeDataAtPoint() {
        return new Promise(resolve => {
            let gazeSamples = [];
            const sampleDuration = 1000; 
            const startTime = performance.now();
            function collectGaze(currentTime) {
                const elapsed = currentTime - startTime;
                if (elapsed < sampleDuration) {
                    const gazeData = webgazer.getCurrentPrediction();
                    if (gazeData && typeof gazeData.x !== 'undefined' && typeof gazeData.y !== 'undefined') {
                        gazeSamples.push({ x: gazeData.x, y: gazeData.y });
                    }
                    requestAnimationFrame(collectGaze);
                } else {
                    if (gazeSamples.length > 0) {
                        const avgX = gazeSamples.reduce((sum, sample) => sum + sample.x, 0) / gazeSamples.length;
                        const avgY = gazeSamples.reduce((sum, sample) => sum + sample.y, 0) / gazeSamples.length;
                        calibrationData.push({ x: avgX - window.innerWidth / 2, y: avgY - window.innerHeight / 2 });
                    }
                    resolve();
                }
            }
            requestAnimationFrame(collectGaze);
        });
    }

    async function highAccuracyCalibration() {
        isCalibrating = true;
        alert("Calibration will begin now. Please follow the dot!");
        const points = generateGridCalibrationPoints(5, 5); 
        const totalPoints = points.length;
        let currentPoint = 0;

        document.getElementById('progressContainer').style.display = 'block';

        for (const point of points) {
            await animateDot(0.5, 0.5, point.x, point.y, 2000);
            await collectGazeDataAtPoint();

            currentPoint++;
            const progress = (currentPoint / totalPoints) * 100;
            updateCalibrationProgress(progress);
        }

        console.log('Calibration complete');
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
    const bufferSize = 10;
    let latestX = null, latestY = null;
    let prevX = null, prevY = null;
    let gazeTimer = null;
    let gazeTarget = null;

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

    function handleGazeDwellSelection(x, y) {
        console.log("Gaze coordinates:", x, y);

        if (isFinite(x) && isFinite(y) && x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight) {
            const element = document.elementFromPoint(x, y);
            if (element) {
                element.classList.add('gaze-hover');
                setTimeout(() => element.classList.remove('gaze-hover'), 100);
            }
        } else {
            console.error("Invalid gaze coordinates detected:", x, y);
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

            handleGazeDwellSelection(x, y);
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