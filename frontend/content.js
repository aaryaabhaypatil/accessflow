function correctDrift(predX, predY) {
    const anchor = { x: window.innerWidth * 0.9, y: window.innerHeight * 0.9 };
    const dist = Math.hypot(predX - anchor.x, predY - anchor.y);
    if (dist < 100) {
        predX = (predX + anchor.x) / 2;
        predY = (predY + anchor.y) / 2;
    }
    return { x: predX, y: predY };
}

window.onload = async function () {
    if (typeof webgazer === "undefined") {
        console.error("WebGazer not loaded");
        return;
    }

    const canvas = document.getElementById('gazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gazeDot = document.getElementById('gazeDot');

    await webgazer.setRegression('ridge').begin();
    webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);

    const calibrationDot = document.createElement('div');
    calibrationDot.id = 'calibrationDot';
    calibrationDot.style.position = 'absolute';
    calibrationDot.style.width = '20px';
    calibrationDot.style.height = '20px';
    calibrationDot.style.borderRadius = '50%';
    calibrationDot.style.backgroundColor = 'red';
    calibrationDot.style.zIndex = '9999';
    document.body.appendChild(calibrationDot);

    function generateCombinedCalibrationPoints(numGridPointsPerRow, numRandomPoints, numEdgePoints) {
        const points = [];
        const gridPoints = [];
        for (let i = 0; i < numGridPointsPerRow; i++) {
            for (let j = 0; j < numGridPointsPerRow; j++) {
                const x = j / (numGridPointsPerRow - 1);
                const y = i / (numGridPointsPerRow - 1);
                gridPoints.push({ x, y });
            }
        }
        points.push(...gridPoints);

        for (let i = 0; i < numRandomPoints; i++) {
            let newPoint;
            let tooClose;
            let attempts = 0;
            do {
                newPoint = { x: Math.random(), y: Math.random() };
                tooClose = false;
                for (const existingPoint of points) {
                    const distance = Math.sqrt(
                        Math.pow(newPoint.x - existingPoint.x, 2) + Math.pow(newPoint.y - existingPoint.y, 2)
                    );
                    if (distance < 0.1) {
                        tooClose = true;
                        break;
                    }
                }
                attempts++;
                if (attempts > 100) break;
            } while (tooClose);
            if (!tooClose) {
                points.push(newPoint);
            }
        }

        const edgePoints = [
            { x: 0.5, y: 0.05 },
            { x: 0.5, y: 0.95 },
            { x: 0.05, y: 0.5 },
            { x: 0.95, y: 0.5 },
        ];
        points.push(...edgePoints);

        const cornerEdgePoints = [
            { x: 0.1, y: 0.1 },
            { x: 0.1, y: 0.9 },
            { x: 0.9, y: 0.1 },
            { x: 0.9, y: 0.9 },
        ];
        points.push(...cornerEdgePoints);

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        return shuffleArray(points);
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
        const numGridPoints = 5;
        const numRandomPoints = 30;
        const numEdgePoints = 4;
        const calibrationPoints = generateCombinedCalibrationPoints(numGridPoints, numRandomPoints, numEdgePoints);
        const pauseTime = 1600;
        const moveDuration = 2000;

        alert(`Calibration will now start with ${calibrationPoints.length} points following a combined pattern (grid, random, and edges). Please focus carefully on the red dot.`);

        for (let i = 0; i < calibrationPoints.length; i++) {
            const point = calibrationPoints[i];
            calibrationDot.style.left = `${point.x * window.innerWidth - 10}px`;
            calibrationDot.style.top = `${point.y * window.innerHeight - 10}px`;
            await new Promise(resolve => setTimeout(resolve, pauseTime));
            webgazer.recordScreenPosition(point.x, point.y, 'calibration');
            await new Promise(resolve => setTimeout(resolve, 200));
            if (i < calibrationPoints.length - 1) {
                await animateDot(point.x, point.y, calibrationPoints[i + 1].x, calibrationPoints[i + 1].y, moveDuration);
            }
        }

        await webgazer.end();
        await webgazer.setRegression('ridge').begin();

        calibrationDot.remove();
        alert("High-accuracy calibration complete with a variety of points!");
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
                    console.log("Gazed at 'gazeAtMe' for 1 seconds!");
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
                console.log("Gaze dwell triggered on:", element);
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
            const corrected = correctDrift(latestX, latestY);
            const x = corrected.x;
            const y = corrected.y;

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
