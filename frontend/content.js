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
    const calibrationPoints = [
        [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
        [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
        [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
    ];

    let gazePoints = [], prevX = null, prevY = null;

    const makePointInvisible = (point) => {
        point.style.backgroundColor = 'green';
        setTimeout(() => point.remove(), 50);
    };

    const showCalibrationPoint = (xRatio, yRatio) => {
        const point = document.createElement('div');
        point.classList.add('calibration-point');
        point.style.left = `${xRatio * window.innerWidth - 10}px`;
        point.style.top = `${yRatio * window.innerHeight - 10}px`;
        document.body.appendChild(point);
        return point;
    };

    const collectCalibrationSamples = (point) => {
        return new Promise((resolve) => {
            let sampleCount = 0;
            const maxSamples = 5;
            let sampleX = 0, sampleY = 0;

            const onClick = (event) => {
                sampleCount++;
                sampleX += event.clientX;
                sampleY += event.clientY;

                if (sampleCount >= maxSamples) {
                    point.removeEventListener('click', onClick);
                    const avgX = sampleX / maxSamples;
                    const avgY = sampleY / maxSamples;
                    gazePoints.push({ x: avgX, y: avgY });
                    makePointInvisible(point);
                    resolve();
                }
            };

            point.addEventListener('click', onClick);
        });
    };

    const calibrate = async () => {
        for (const [xRatio, yRatio] of calibrationPoints) {
            const point = showCalibrationPoint(xRatio, yRatio);
            await collectCalibrationSamples(point);
        }
    };

    await webgazer.setRegression('ridge').begin();
    webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);

    await calibrate();

    if (confirm("Would you like to recheck the calibration points for accuracy?")) {
        gazePoints = []; // Clear previous points
        await calibrate();
    }

    // Dwell selection variables
    let gazeTimer = null;
    let gazeTarget = null;

    const handleGazeDwellSelection = (x, y) => {
        const element = document.elementFromPoint(x, y);
        if (!element || !element.classList.contains('gaze-selectable')) {
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
            }, 2000); // 2-second dwell
        }
    };

    // Gaze listener
    webgazer.setGazeListener((data) => {
        if (!data) return;

        const x = data.x;
        const y = data.y;

        // Update gaze dot
        gazeDot.style.left = `${x - 5}px`;
        gazeDot.style.top = `${y - 5}px`;

        // Draw trail
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

        // Highlight element under gaze
        const element = document.elementFromPoint(x, y);
        if (element) {
            element.classList.add('gaze-hover');
            setTimeout(() => element.classList.remove('gaze-hover'), 200);
        }

        // Dwell-to-select handler
        handleGazeDwellSelection(x, y);
    });
};
