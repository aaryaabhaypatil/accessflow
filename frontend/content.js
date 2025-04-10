window.onload = async function () {
    if (typeof webgazer === "undefined") {
        console.error("WebGazer not loaded");
        return;
    }

    const canvas = document.getElementById('gazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let prevX = null, prevY = null;
    const gazeDot = document.getElementById('gazeDot');
    let gazePoints = [];  

    const calibrationPoints = [
        [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
        [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
        [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
    ];

    let calibrationCount = 0;

   
    const makePointInvisible = (point) => {
        point.style.visibility = 'hidden'; 
    };

    const showCalibrationPoint = (xRatio, yRatio) => {
        const point = document.createElement('div');
        point.classList.add('calibration-point');
        point.style.left = `${xRatio * window.innerWidth - 10}px`;
        point.style.top = `${yRatio * window.innerHeight - 10}px`;

        document.body.appendChild(point);
        return point;
    };

    const runCalibration = () => {
        return new Promise(resolve => {
            const showNextPoint = () => {
                if (calibrationCount >= calibrationPoints.length) {
                    resolve();
                    return;
                }

                const [xRatio, yRatio] = calibrationPoints[calibrationCount];
                const point = showCalibrationPoint(xRatio, yRatio);

                let sampleCount = 0;
                const maxSamples = 5; 
                let sampleX = 0, sampleY = 0;

                const onPointClick = (event) => {
                    sampleCount++;
                    const x = event.clientX;
                    const y = event.clientY;

                    sampleX += x;
                    sampleY += y;

                    if (sampleCount >= maxSamples) {
                        const avgX = sampleX / maxSamples;
                        const avgY = sampleY / maxSamples;

                        gazePoints.push({ x: avgX, y: avgY });

                        makePointInvisible(point); 
                        calibrationCount++;
                        showNextPoint();
                    }
                };

                point.addEventListener('click', onPointClick);
            };

            showNextPoint();
        });
    };

    const recheckCalibration = () => {
        return new Promise(resolve => {
            const recheckNextPoint = () => {
                if (calibrationCount >= calibrationPoints.length) {
                    resolve();
                    return;
                }

                const [xRatio, yRatio] = calibrationPoints[calibrationCount];
                const point = showCalibrationPoint(xRatio, yRatio);

                let sampleCount = 0;
                const maxSamples = 5; 
                let sampleX = 0, sampleY = 0;

                const onPointClick = (event) => {
                    sampleCount++;
                    const x = event.clientX;
                    const y = event.clientY;

                    sampleX += x;
                    sampleY += y;

                    if (sampleCount >= maxSamples) {
                        const avgX = sampleX / maxSamples;
                        const avgY = sampleY / maxSamples;

                        gazePoints.push({ x: avgX, y: avgY });

                        makePointInvisible(point); 
                        calibrationCount++;
                        recheckNextPoint();
                    }
                };

                point.addEventListener('click', onPointClick);
            };

            recheckNextPoint();
        });
    };

    await webgazer.setRegression('ridge').begin();

    webgazer
        .showVideo(false) 
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false);

    await runCalibration(); 

    
    if (confirm("Would you like to recheck the calibration points for accuracy?")) {
        calibrationCount = 0;
        await recheckCalibration();
    }

    let lastGazeData = { x: 0, y: 0 };
    let lastTime = Date.now();


    const throttleGazeUpdates = () => {
        const now = Date.now();
        const timeDiff = now - lastTime;

        if (timeDiff >= 50) {
            lastTime = now;

            webgazer.setGazeListener((data) => {
                if (!data) return;
                const x = data.x;
                const y = data.y;

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
                    element.classList.add("gaze-hover");
                    setTimeout(() => element.classList.remove("gaze-hover"), 200);
                }
            });
        }
    };

    setInterval(throttleGazeUpdates, 50);
};
