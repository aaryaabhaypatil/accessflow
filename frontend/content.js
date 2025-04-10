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

    const calibrationPoints = [
        [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
        [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
        [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
    ];

    let calibrationCount = 0;

    const runCalibration = () => {
        return new Promise(resolve => {
            const showNextPoint = () => {
                if (calibrationCount >= calibrationPoints.length) {
                    resolve();
                    return;
                }

                const [xRatio, yRatio] = calibrationPoints[calibrationCount];
                const point = document.createElement('div');
                point.classList.add('calibration-point');
                point.style.left = `${xRatio * window.innerWidth - 10}px`;
                point.style.top = `${yRatio * window.innerHeight - 10}px`;

                document.body.appendChild(point);

                point.addEventListener('click', () => {
                    for (let i = 0; i < 5; i++) {
                        webgazer.recordScreenPosition(
                            xRatio * window.innerWidth,
                            yRatio * window.innerHeight,
                            'click'
                        );
                    }
                    document.body.removeChild(point);
                    calibrationCount++;
                    showNextPoint();
                });
            };

            showNextPoint();
        });
    };

    await webgazer.setRegression('ridge').begin();

    webgazer
        .showVideo(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false);

    await runCalibration();

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
};
