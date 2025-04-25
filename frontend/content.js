let calibrationOffset = { x: 0, y: 0 };

function correctDrift(predX, predY) {
    return {
        x: predX - calibrationOffset.x,
        y: predY - calibrationOffset.y,
    };
}

function getHeadShift() {
    const positions = webgazer.getTracker().getPositions();
    if (!positions) return { dx: 0, dy: 0 };
    const leftEye = positions.find(p => p.name === 'leftEye');
    const rightEye = positions.find(p => p.name === 'rightEye');
    const nose = positions.find(p => p.name === 'nose');
    if (leftEye && rightEye && nose) {
        const headCenterX = (leftEye.x + rightEye.x) / 2;
        const dx = headCenterX - nose.x;
        return { dx, dy: 0 };
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
    calibrationDot.style.width = '20px';
    calibrationDot.style.height = '20px';
    calibrationDot.style.borderRadius = '50%';
    calibrationDot.style.backgroundColor = 'red';
    calibrationDot.style.zIndex = '9999';
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

    async function animateDot(startX, startY, endX, endY, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();
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

    async function highAccuracyCalibration() {
        const points = generateGridCalibrationPoints(9, 7);  // 63 points for better accuracy
        for (const point of points) {
            await animateDot(0.5, 0.5, point.x, point.y, 1000);
        }
        calibrationOffset = { x: 0.5, y: 0.5 }; // Store the calibration offset after calibration
        console.log('Calibration complete');
        calibrationDot.style.display = 'none'; // Hide the calibration dot after calibration
    }

    await highAccuracyCalibration();

    let gazeTimer = null;
    let gazeTarget = null;
    let latestX = null, latestY = null;
    let prevX = null, prevY = null;

    const handleGazeDwellSelection = (x, y) => {
        const element = document.elementFromPoint(x, y);
        if (!element) {
            clearTimeout(gazeTimer);
            gazeTimer = null;
            gazeTarget = null;
            return;
        }
        if (element.id === "gazeAtMe") {
            if (gazeTarget !== element) {
                clearTimeout(gazeTimer);
                gazeTarget = element;
                gazeTimer = setTimeout(() => {
                    element.classList.add('reacted');
                    element.innerText = "You looked at me!";
                }, 1000);
            }
            return;
        }
        if (!element.classList.contains('gaze-selectable')) {
            clearTimeout(gazeTimer);
            gazeTimer = null;
            gazeTarget = null;
            return;
        }
        if (element !== gazeTarget) {
            clearTimeout(gazeTimer);
            gazeTarget = element;
            gazeTimer = setTimeout(() => {
                element.classList.add('selected');
                element.click?.();
            }, 1000);
        }
    };

    const gazeBuffer = [];
    const bufferSize = 10;

    webgazer.setGazeListener((data) => {
        if (!data) return;
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
    });

    function drawLoop() {
        if (latestX && latestY) {
            let { x, y } = correctDrift(latestX, latestY);
            const { dx } = getHeadShift();
            x -= dx;

            // Debugging
            console.log(`Gaze Coordinates: X: ${x}, Y: ${y}`);

            // Update gaze dot position
            gazeDot.style.left = `${x - 5}px`;
            gazeDot.style.top = `${y - 5}px`;

            // Drawing the path (if needed)
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

            const element = document.elementFromPoint(x, y);
            if (element) {
                element.classList.add('gaze-hover');
                setTimeout(() => element.classList.remove('gaze-hover'), 100);
            }

            handleGazeDwellSelection(x, y);
        }

        requestAnimationFrame(drawLoop);
    }

    drawLoop();
};
