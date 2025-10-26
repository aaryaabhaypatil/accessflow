const removeWebgazerDebug = () => {
  const video = document.getElementById('webgazerVideoFeed');
  if (video) {
    video.remove();  // You already have this
  }

  const overlay = document.getElementById('webgazerFaceOverlay');
  if (overlay) overlay.remove();

  const faceFeedback = document.getElementById('webgazerFaceFeedbackBox');
  if (faceFeedback) faceFeedback.remove();
};


function hideVideoStreamDuringCalibration() {
  const interval = setInterval(() => {
    const video = document.querySelector('video');
    if (video) {
      video.style.display = 'none';
      video.style.opacity = '0';
      video.style.visibility = 'hidden';
    }
  }, 100);
  
  return interval;
}

const interval = setInterval(removeWebgazerDebug, 100);
setTimeout(() => clearInterval(interval), 5000);

window.onload = () => {
  webgazer.setRegression('ridge')
    .setTracker('clmtrackr')
    .begin();
};

window.alert = (msg) => {
  if (typeof msg === "string" && msg.includes("WebGazer works only over https")) {
    return;
  }
  console.log("Alert suppressed:", msg);
};

document.addEventListener("DOMContentLoaded", function () {
  const openPopupBtn = document.getElementById("openPopupBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const feedbackBox = document.getElementById("feedbackBox");
  const blurOverlay = document.getElementById("blurOverlay");
  const calibrateBtn = document.getElementById("calibrateBtn");
  const toggle = document.querySelector(".toggle-switch-popup");

  console.log("Screen size:", window.screen.width, window.screen.height);
  console.log("Viewport size:", window.innerWidth, window.innerHeight);

  let calibrationInProgress = false;
  let currentCalibrationPoint = null;

  let gazeCalibration = {
    points: [],
    isCalibrating: false
  };

  // UNIFIED: Single array to store ALL gaze data from all games
  let allGamesGazeLog = [];
  window.currentGaze = { x: 0, y: 0 };

  async function runGazeCalibration() {
  return new Promise((resolve) => {
    gazeCalibration.points = [];
    gazeCalibration.isCalibrating = true;
    
    const calibrationPoints = [
      { x: 0.1, y: 0.1, name: "Top-Left" },
      { x: 0.9, y: 0.1, name: "Top-Right" },
      { x: 0.5, y: 0.5, name: "Center" },
      { x: 0.1, y: 0.9, name: "Bottom-Left" },
      { x: 0.9, y: 0.9, name: "Bottom-Right" }
    ];

    let pointIndex = 0;

    function showNextPoint() {
      if (pointIndex >= calibrationPoints.length) {
        gazeCalibration.isCalibrating = false;
        console.log("✅ Calibration complete. Points:", gazeCalibration.points);
        resolve();
        return;
      }

      const point = calibrationPoints[pointIndex];
      const screenX = window.innerWidth * point.x;
      const screenY = window.innerHeight * point.y;

      // Create calibration marker
      const marker = document.createElement("div");
      marker.style.position = "fixed";
      marker.style.left = (screenX - 15) + "px";
      marker.style.top = (screenY - 15) + "px";
      marker.style.width = "30px";
      marker.style.height = "30px";
      marker.style.borderRadius = "50%";
      marker.style.background = "yellow";
      marker.style.border = "3px solid red";
      marker.style.zIndex = "99999";
      marker.style.display = "flex";
      marker.style.alignItems = "center";
      marker.style.justifyContent = "center";
      marker.style.fontSize = "12px";
      marker.style.color = "black";
      marker.style.fontWeight = "bold";
      marker.textContent = pointIndex + 1;
      document.body.appendChild(marker);

      // Collect gaze samples for 2 seconds
      let samples = [];
      const startTime = Date.now();
      
      const sampleInterval = setInterval(() => {
        if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
          samples.push({
            gazeX: window.currentGaze.x,
            gazeY: window.currentGaze.y
          });
        }

        if (Date.now() - startTime > 2000) {
          clearInterval(sampleInterval);
          
          // Average the samples
          const avgGaze = {
            x: samples.reduce((sum, s) => sum + s.gazeX, 0) / samples.length,
            y: samples.reduce((sum, s) => sum + s.gazeY, 0) / samples.length
          };

          gazeCalibration.points.push({
            screenX: screenX,
            screenY: screenY,
            gazeX: avgGaze.x,
            gazeY: avgGaze.y
          });

          console.log(`Point ${pointIndex + 1}: Screen(${screenX},${screenY}) -> Gaze(${avgGaze.x.toFixed(0)},${avgGaze.y.toFixed(0)})`);

          marker.remove();
          pointIndex++;
          showNextPoint();
        }
      }, 50);
    }

    showNextPoint();
  });
}

async function runOnboardingAndCalibration() {
  return new Promise(async (resolve) => {
    
    
    const tutorialSteps = [
      {
        title: "Welcome to Eye-Tracking",
        content: [
          "Welcome! This tutorial will guide you through how to use your eyes to interact with the interface.Eye-tracking allows the system to detect where you’re looking and respond accordingly — for example, by selecting, moving, or activating elements based on your gaze."
        ],
        icon: "🎯",
      },
      {
        title: "Mini-Games for Calibration",
        content: [
          "The first part of the tutorial includes a series of three mini-games designed to help train the system. In each game, you’ll see different icons appear on the screen. Your task is to focus on each icon as it appears — this helps collect training data that tells the system where you’re looking.",
          "Note: When you look at the icons during the games, there’s no guarantee that it’s tracking your eyes correctly — even if it says it’s done. The games just help the system learn from how you look at things."
        ],
        icon: "🎮",
        duration: 5000
      },
      {
        title: "Proper Head Positioning ",
        content: [
          "Sit comfortably 50-70cm (arm's length) from your screen.",
          "Your face should be well-lit and clearly visible to the camera.",
          "Avoid backlighting (don't sit in front of a window)."
        ],
        icon: "🪑",
        duration: 6000,
        showPositioningGuide: true
      },
      {
        title: "Gaze & Behavior Tips",
        content: [
          "Blink naturally, but avoid long eye closures or excessive blinking.",
          "Look naturally - don't strain your eyes.",
          "You can pause anytime by clicking the pause icon if you need a break.",

        ],
        icon: "😌",
        duration: 6000
      },
      {
        title: "Target & Focus Tips",
        content: [
          "If you blink, that's okay - just keep looking at the target.",
          "Focus on the CENTER of each game icon."
        ],
        icon: "👀",
        duration: 6000
      },
      {
        title: "What to Avoid ⚠️",
        content: [
          "Avoid covering your face with hands or objects.",
          "Don't squint or close one eye.",
          "Try to maintain consistent lighting (no flickering lights)."
        ],
        icon: "🚫",
        duration: 6000,
        showBadExamples: true
      },
                
      {
        title: "Post Calibration",
        content: [
          "Once calibration is complete, a dot will move around the screen to show where the system thinks you’re looking.",
          "Because this is the first prototype, the tracking might not be very accurate — or it might not work at all in some cases.",
          "That’s completely fine! The goal is to collect feedback on your experience and understand how to improve accuracy and usability in the next version."

        ],
        icon: "〰️",
        duration: 6000
      },
      {
        title: "Ready to Calibrate?",
        content: [
          "Now that you know what to expect, you can begin the calibration games..",
          "Remember: steady gaze, relaxed posture, natural blinking.",
          "The whole process takes about 6-7 minutes.",
          "Let's begin!"
        ],
        icon: "🎮",
        duration: 4000,
        isLast: true
      }
    ];

    // Create tutorial overlay
    let tutorialOverlay = document.createElement("div");
    Object.assign(tutorialOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "#F1F0E4",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "99999",
      opacity: "0",
      transition: "opacity 0.5s ease",
      fontFamily: "'Inter', sans-serif"
    });
    document.body.appendChild(tutorialOverlay);
    setTimeout(() => tutorialOverlay.style.opacity = "1", 10);

    // Progress indicator
    let progressBar = document.createElement("div");
    Object.assign(progressBar.style, {
      position: "absolute",
      top: "30px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "80%",
      maxWidth: "600px",
      height: "6px",
      background: "#BCA88D",
      borderRadius: "10px",
      overflow: "hidden"
    });
    tutorialOverlay.appendChild(progressBar);

    let progressFill = document.createElement("div");
    Object.assign(progressFill.style, {
      height: "100%",
      width: "0%",
      background: "#3E3F29",
      borderRadius: "10px",
      transition: "width 0.5s ease"
    });
    progressBar.appendChild(progressFill);

    // Content container
    let contentContainer = document.createElement("div");
    Object.assign(contentContainer.style, {
      maxWidth: "700px",
      width: "90%",
      padding: "50px",
      background: "#3E3F29",
      borderRadius: "20px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      textAlign: "center"
    });
    tutorialOverlay.appendChild(contentContainer);

    // Navigate through tutorial steps
    for (let i = 0; i < tutorialSteps.length; i++) {
      const step = tutorialSteps[i];
      
      // Update progress
      progressFill.style.width = `${((i + 1) / tutorialSteps.length) * 100}%`;
      
      // Clear previous content
      contentContainer.innerHTML = "";

      // Icon
      let icon = document.createElement("div");
      icon.textContent = step.icon;
      Object.assign(icon.style, {
        fontSize: "80px",
        marginBottom: "20px",
        animation: "bounce 1s ease-in-out"
      });
      contentContainer.appendChild(icon);

      // Add bounce animation if not exists
      if (!document.getElementById("tutorialAnimations")) {
        const style = document.createElement("style");
        style.id = "tutorialAnimations";
        style.textContent = `
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-2deg); }
            75% { transform: translateX(5px) rotate(2deg); }
          }
        `;
        document.head.appendChild(style);
      }

      // Title
      let title = document.createElement("h2");
      title.textContent = step.title;
      Object.assign(title.style, {
        fontSize: "32px",
        fontWeight: "bold",
        color: "#ffffffff",
        marginBottom: "25px",
        animation: "fadeInUp 0.6s ease"
      });
      contentContainer.appendChild(title);

      // Content lines
      step.content.forEach((line, idx) => {
        let p = document.createElement("p");
        p.textContent = line;
        Object.assign(p.style, {
          fontSize: "18px",
          color: "#ffffffff",
          lineHeight: "1.6",
          marginBottom: "15px",
          opacity: "0",
          animation: `fadeInUp 0.6s ease ${idx * 0.2}s forwards`
        });
        contentContainer.appendChild(p);
      });

      // Special visual guides
      if (step.showPositioningGuide) {
        let guide = document.createElement("div");
        Object.assign(guide.style, {
          marginTop: "30px",
          padding: "20px",
          background: "#e8f5e9",
          borderRadius: "10px",
          border: "2px solid #4CAF50"
        });
        guide.innerHTML = `
          <div style="font-size: 30px; margin-bottom: 10px;">
            🧑 ← 50-70cm → 💻
          </div>
          <div style="font-size: 14px; color: #2e7d32; font-weight: 600;">
            Perfect Distance Zone
          </div>
        `;
        contentContainer.appendChild(guide);
      }

      if (step.showBadExamples) {
        let examples = document.createElement("div");
        Object.assign(examples.style, {
          marginTop: "30px",
          display: "flex",
          justifyContent: "space-around",
          gap: "20px"
        });
        
        const bad = [
          { emoji: "🙈", label: "Covering Face" },
          { emoji: "😵‍💫", label: "Head Movement" },
          { emoji: "😑", label: "Squinting" }
        ];
        
        bad.forEach(item => {
          let ex = document.createElement("div");
          Object.assign(ex.style, {
            padding: "15px",
            background: "#ffebee",
            borderRadius: "10px",
            border: "2px solid #f44336",
            animation: "shake 0.5s ease"
          });
          ex.innerHTML = `
            <div style="font-size: 40px;">${item.emoji}</div>
            <div style="font-size: 12px; color: #c62828; margin-top: 5px; font-weight: 600;">${item.label}</div>
          `;
          examples.appendChild(ex);
        });
        
        contentContainer.appendChild(examples);
      }

      // Navigation
      let navContainer = document.createElement("div");
      Object.assign(navContainer.style, {
        marginTop: "40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px"
      });
      contentContainer.appendChild(navContainer);

      // Back button (if not first step)
      let backBtn = document.createElement("button");
      if (i > 0) {
        backBtn.textContent = "← Back";
        Object.assign(backBtn.style, {
          padding: "12px 30px",
          fontSize: "16px",
          fontWeight: "600",
          background: "transparent",
          color: "#F1F0E4",
          border: "2px solid #ffffffff",
          borderRadius: "25px",
          cursor: "pointer",
          transition: "all 0.3s ease"
        });
        
        backBtn.onmouseover = () => {
          backBtn.style.background = "#BCA88D";
          backBtn.style.color = "white";
        };
        backBtn.onmouseout = () => {
          backBtn.style.background = "transparent";
          backBtn.style.color = "#F1F0E4";
        };
      } else {
        // Invisible spacer for first step
        backBtn.style.opacity = "0";
        backBtn.style.pointerEvents = "none";
      }
      navContainer.appendChild(backBtn);

      // Step indicator
      let stepIndicator = document.createElement("div");
      stepIndicator.textContent = `${i + 1} / ${tutorialSteps.length}`;
      Object.assign(stepIndicator.style, {
        fontSize: "14px",
        color: "#757575",
        fontWeight: "600"
      });
      navContainer.appendChild(stepIndicator);

      if (step.isLast) {
        // Start Calibration button
        let startBtn = document.createElement("button");
        startBtn.textContent = "Start Calibration →";
        Object.assign(startBtn.style, {
          padding: "15px 40px",
          fontSize: "18px",
          fontWeight: "700",
          background: "linear-gradient(135deg, #4CAF50, #8BC34A)",
          color: "white",
          border: "none",
          borderRadius: "30px",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(76, 175, 80, 0.4)",
          transition: "all 0.3s ease"
        });
        
        startBtn.onmouseover = () => {
          startBtn.style.transform = "scale(1.05)";
          startBtn.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.6)";
        };
        startBtn.onmouseout = () => {
          startBtn.style.transform = "scale(1)";
          startBtn.style.boxShadow = "0 4px 15px rgba(76, 175, 80, 0.4)";
        };
        
        navContainer.appendChild(startBtn);
        
        // Wait for either button click
        const action = await new Promise(r => {
          startBtn.onclick = () => r('next');
          backBtn.onclick = () => r('back');
        });
        
        if (action === 'back') {
          i -= 2; // Will increment by 1 in loop, so go back 2 to land on previous
          continue;
        }
      } else {
        // Next button
        let nextBtn = document.createElement("button");
        nextBtn.textContent = "Next →";
        Object.assign(nextBtn.style, {
          padding: "12px 30px",
          fontSize: "16px",
          fontWeight: "600",
          background: "#F1F0E4",
          color: "black",
          border: "none",
          borderRadius: "25px",
          cursor: "pointer",
          transition: "all 0.3s ease"
        });
        
        nextBtn.onmouseover = () => nextBtn.style.background = "#BCA88D";
        nextBtn.onmouseout = () => nextBtn.style.background = "#F1F0E4";
        
        navContainer.appendChild(nextBtn);
        
        // Wait for either button click
        const action = await new Promise(r => {
          nextBtn.onclick = () => r('next');
          backBtn.onclick = () => r('back');
        });
        
        if (action === 'back') {
          i -= 2; // Will increment by 1 in loop, so go back 2 to land on previous
          continue;
        }
      }
    }

    // Fade out tutorial
    tutorialOverlay.style.opacity = "0";
    await new Promise(r => setTimeout(r, 500));
    tutorialOverlay.remove();

    console.log("✅ Onboarding tutorial complete");
    resolve();
  });
}

// Add this function to map raw gaze to screen coordinates using calibration:
function mapGazeWithCalibration(rawGaze) {
  if (gazeCalibration.points.length < 2) {
    return rawGaze; // Not calibrated yet
  }

  // Simple linear regression mapping
  const n = gazeCalibration.points.length;

  // Linear regression for X
  const avgGazeX = gazeCalibration.points.reduce((sum, p) => sum + p.gazeX, 0) / n;
  const avgScreenX = gazeCalibration.points.reduce((sum, p) => sum + p.screenX, 0) / n;
  const slopeX = gazeCalibration.points.reduce((sum, p) => sum + (p.gazeX - avgGazeX) * (p.screenX - avgScreenX), 0) /
                 gazeCalibration.points.reduce((sum, p) => sum + (p.gazeX - avgGazeX) ** 2, 0);
  const interceptX = avgScreenX - slopeX * avgGazeX;

  // Linear regression for Y
  const avgGazeY = gazeCalibration.points.reduce((sum, p) => sum + p.gazeY, 0) / n;
  const avgScreenY = gazeCalibration.points.reduce((sum, p) => sum + p.screenY, 0) / n;
  const slopeY = gazeCalibration.points.reduce((sum, p) => sum + (p.gazeY - avgGazeY) * (p.screenY - avgScreenY), 0) /
                 gazeCalibration.points.reduce((sum, p) => sum + (p.gazeY - avgGazeY) ** 2, 0);
  const interceptY = avgScreenY - slopeY * avgGazeY;

  // Map coordinates
  const mappedX = Math.max(0, Math.min(window.innerWidth, slopeX * rawGaze.x + interceptX));
  const mappedY = Math.max(0, Math.min(window.innerHeight, slopeY * rawGaze.y + interceptY));

  return { x: mappedX, y: mappedY };
}

  function showGameIntro(gameName, storyLines, gameIconEmoji) {
    return new Promise((resolve) => {
      let introOverlay = document.createElement("div");
      Object.assign(introOverlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "#00000011",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "30000",
        opacity: "0",
        transition: "opacity 0.5s ease"
      });
      document.body.appendChild(introOverlay);
      
      setTimeout(() => introOverlay.style.opacity = "1", 10);

      let gameIcon = document.createElement("div");
      gameIcon.textContent = gameIconEmoji;
      Object.assign(gameIcon.style, {
        fontSize: "120px",
        marginBottom: "20px",
        animation: "pulse 2s ease-in-out infinite"
      });
      introOverlay.appendChild(gameIcon);

      if (!document.getElementById("pulseAnimation")) {
        const style = document.createElement("style");
        style.id = "pulseAnimation";
        style.textContent = `
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `;
        document.head.appendChild(style);
      }

      let gameTitle = document.createElement("div");
      gameTitle.textContent = gameName;
      Object.assign(gameTitle.style, {
        fontSize: "48px",
        color: "white",
        fontWeight: "bold",
        marginBottom: "40px",
        textAlign: "center",
        textShadow: "0 0 20px rgba(255,215,0,0.5)"
      });
      introOverlay.appendChild(gameTitle);

      let storyContainer = document.createElement("div");
      Object.assign(storyContainer.style, {
        maxWidth: "900px",
        width: "90%",
        // padding: "60px 80px",
        textAlign: "center",
        marginBottom: "50px",
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        minHeight: "300px",
        color: "#2C1810",
        fontWeight: "600", 
        fontSize: "1.1rem",
        lineHeight: "1.6",
        textShadow: "0 1px 2px rgba(255,255,255,0.3)",
        fontFamily: "'Poppins', sans-serif",
        letterSpacing: "0.5px",
        backgroundImage: "url('scroll-6.jpeg')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "transparent",
        position: "relative"
      });
      introOverlay.appendChild(storyContainer);



      const arcadeFont = document.createElement("link");
      arcadeFont.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      arcadeFont.rel = "stylesheet";
      document.head.appendChild(arcadeFont);

      let playButton = document.createElement("button");
      playButton.textContent = "PLAY";
      Object.assign(playButton.style, {
        padding: "20px 60px",
        fontSize: "20px",
        fontFamily: "'Press Start 2P', cursive",
        fontWeight: "bold",
        letterSpacing: "2px",
        background: "#BCA88D",
        color: "#000",
        cursor: "pointer",
        transition: "all 0.3s ease",
        opacity: "0",
        transform: "scale(0.8)",
        pointerEvents: "none",
      });
      introOverlay.appendChild(playButton);

      playButton.addEventListener("mouseenter", () => {
        playButton.style.transform = "scale(1.05)";
        playButton.style.boxShadow = "0 8px 25px rgba(255,215,0,0.4)";
      });

      playButton.addEventListener("mouseleave", () => {
        playButton.style.transform = "scale(1)";
        playButton.style.boxShadow = "0 6px 20px rgba(0,0,0,0.5)";
      });

      let currentLine = 0;
      function showNextStoryLine() {
        if (currentLine < storyLines.length) {
          let lineElement = document.createElement("div");
          lineElement.textContent = storyLines[currentLine];
          Object.assign(lineElement.style, {
            fontSize: "19px",
            fontWeight: "bold",
            color: "#000000ff",
            lineHeight: "1", 
            whiteSpace: "normal",      // ✅ allows text to wrap
            wordWrap: "break-word",    // ✅ breaks long words if needed
            overflowWrap: "break-word",// ✅ ensures wrapping in all browsers
            textAlign: "center",       // optional — keeps it nicely aligned
            maxWidth: "100%",           // ensures it fits within container
            display: "block",             // ✅ ensures it's treated like a paragraph
            width: "100%",      
            opacity: "0",
            animation: "fadeInUp 0.8s ease forwards"
          });
          storyContainer.appendChild(lineElement);
          
          currentLine++;
          setTimeout(showNextStoryLine, 3000);
        } else {
          setTimeout(() => {
            playButton.style.opacity = "1";
            playButton.style.transform = "scale(1)";
            playButton.style.pointerEvents = "auto";
          }, 500);
        }
      }

      setTimeout(showNextStoryLine, 1000);

      playButton.addEventListener("click", () => {

        const togglePauseBtn = document.getElementById("togglePauseBtn");
        if (togglePauseBtn) {
          togglePauseBtn.style.display = "block";
          togglePauseBtn.innerHTML = "⏸";
          togglePauseBtn.title = "Pause";
          console.log("✅ Pause button shown");
        }
        
        introOverlay.style.opacity = "0";
        setTimeout(() => {
          if (introOverlay.parentNode) introOverlay.remove();
          resolve();
        }, 500);
      });
    });
  }

  const pathCanvas = document.createElement("canvas");
  pathCanvas.id = "gazePathCanvas";
  pathCanvas.style.position = "fixed";
  pathCanvas.style.top = "0";
  pathCanvas.style.left = "0";
  pathCanvas.width = window.innerWidth;
  pathCanvas.height = window.innerHeight;
  pathCanvas.style.zIndex = "19999";
  pathCanvas.style.pointerEvents = "none";
  document.body.appendChild(pathCanvas);

  const pathCtx = pathCanvas.getContext("2d");
  let pathDrawingEnabled = false; 

  const brightnessCanvas = document.createElement('canvas');
  brightnessCanvas.width = 160; 
  brightnessCanvas.height = 120;
  const brightnessCtx = brightnessCanvas.getContext('2d');

  function hideGazeDot() {
    if (window.dotGaze) {
      window.dotGaze.style.display = "none";
    }
  }

  function showGazeDot() {
    if (window.dotGaze) {
      window.dotGaze.style.display = "block";
    }
  }

  function waitForVideoReady(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        const video = document.querySelector('video');
        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
          clearInterval(check);
          console.log("✅ Video ready:", video.videoWidth, video.videoHeight);
          resolve(video);
        } else if (Date.now() - start > timeout) {
          clearInterval(check);
          reject("❌ Video never became ready");
        }
      }, 100);
    });
  }

  function detectGlassesReflection(video) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 120;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  const reflectionData = {
    detections: [],
    hasGlasses: false,
    reflectionIntensity: 0,
    samplesCollected: 0
  };

  function analyzeFrame() {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Focus on eye region (approximate upper-middle area)
      const eyeRegionTop = Math.floor(canvas.height * 0.3);
      const eyeRegionBottom = Math.floor(canvas.height * 0.5);
      const eyeRegionLeft = Math.floor(canvas.width * 0.2);
      const eyeRegionRight = Math.floor(canvas.width * 0.8);
      
      let brightPixels = 0;
      let totalPixels = 0;
      let maxBrightness = 0;
      let brightClusters = 0;
      
      for (let y = eyeRegionTop; y < eyeRegionBottom; y++) {
        for (let x = eyeRegionLeft; x < eyeRegionRight; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          
          // Calculate luminance
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          
          if (luminance > 200) {  // Very bright pixels (potential reflection)
            brightPixels++;
            if (luminance > maxBrightness) {
              maxBrightness = luminance;
            }
          }
          totalPixels++;
        }
      }
      
      const reflectionPercentage = (brightPixels / totalPixels) * 100;
      
      // Glasses typically create 2-5% bright spots in eye region
      const hasReflection = reflectionPercentage > 1.5 && maxBrightness > 220;
      
      reflectionData.detections.push({
        timestamp: Date.now(),
        reflectionPercentage: reflectionPercentage.toFixed(2),
        maxBrightness: Math.round(maxBrightness),
        hasReflection: hasReflection
      });
      
      reflectionData.samplesCollected++;
      
      // Calculate overall reflection intensity
      if (reflectionData.detections.length > 10) {
        const recentDetections = reflectionData.detections.slice(-10);
        const avgReflection = recentDetections.reduce((sum, d) => 
          sum + parseFloat(d.reflectionPercentage), 0) / recentDetections.length;
        
        reflectionData.reflectionIntensity = avgReflection;
        reflectionData.hasGlasses = avgReflection > 2.0; // Threshold for glasses detection
      }
    }
  }
  
  // Sample every 500ms
  const detectionInterval = setInterval(analyzeFrame, 500);
  
  return {
    data: reflectionData,
    stop: () => clearInterval(detectionInterval)
  };
}

  function isGazeNearTarget(gazeX, gazeY, targetX, targetY, threshold = 150) {
    // Calculate distance from gaze point to target center
    const distance = Math.sqrt(
      Math.pow(gazeX - targetX, 2) + Math.pow(gazeY - targetY, 2)
    );
    
    // If gaze is within threshold distance, consider it "looking at target"
    // threshold of 150px accounts for ±100px gaze accuracy + buffer
    return distance < threshold;
  }

  // Alternative: Detect which quadrant user is looking at
  function getGazeQuadrant(gazeX, gazeY) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    if (gazeX < centerX && gazeY < centerY) return "top-left";
    if (gazeX >= centerX && gazeY < centerY) return "top-right";
    if (gazeX < centerX && gazeY >= centerY) return "bottom-left";
    if (gazeX >= centerX && gazeY >= centerY) return "bottom-right";
  }


  function createDot(id, emoji) {
    let dot = document.getElementById(id);
    if (!dot) {
      dot = document.createElement("div");
      dot.id = id;
      dot.style.position = "fixed";
      dot.style.zIndex = "15000";
      dot.style.pointerEvents = "none";
      dot.style.display = "none";
      dot.textContent = emoji;
      dot.style.fontSize = "80px";
      document.body.appendChild(dot);
    }
    return dot;
  }

  const birdDot = createDot("birdDot", "🦅");
  const targetDot = createDot("targetDot", "🎯");
  const gemDot = createDot("gemDot", "💎");

  const gazeDot = document.createElement("div");
  gazeDot.id = "gazeDot";
  gazeDot.style.position = "fixed";
  gazeDot.style.width = "20px";
  gazeDot.style.height = "20px";
  gazeDot.style.borderRadius = "50%";
  gazeDot.style.background = "red";
  gazeDot.style.zIndex = "20000";
  gazeDot.style.pointerEvents = "none";
  gazeDot.style.display = "none";
  document.body.appendChild(gazeDot);

  const calibrationPoints = [
    { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 }
  ];

  function waitForValidGaze(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
          clearInterval(check);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(check);
          reject("Gaze not available");
        }
      }, 100);
    });
  }

  function mapGazeToScreen(gaze, video) {
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return { x: 0, y: 0 };
    }

    const rawX = video.mirror ? video.videoWidth - gaze.x : gaze.x;
    const rawY = gaze.y;
    const scaleX = video.clientWidth / video.videoWidth;
    const scaleY = video.clientHeight / video.videoHeight;
    const rect = video.getBoundingClientRect();

    return {
      x: Math.min(Math.max(rawX * scaleX + rect.left, 0), window.innerWidth),
      y: Math.min(Math.max(rawY * scaleY + rect.top, 0), window.innerHeight)
    };
  }

  async function runBirdGame() {
    function showErrorPopup(message) {
      let overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "99999"
      });

      let popup = document.createElement("div");
      Object.assign(popup.style, {
        background: "white",
        padding: "20px 30px",
        borderRadius: "10px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
      });

      let text = document.createElement("p");
      text.textContent = message;
      text.style.marginBottom = "15px";
      text.style.fontSize = "16px";
      text.style.color = "black";

      let button = document.createElement("button");
      button.textContent = "OK";
      Object.assign(button.style, {
        padding: "8px 16px",
        background: "#3E3F29",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      });

      button.onclick = () => document.body.removeChild(overlay);

      popup.appendChild(text);
      popup.appendChild(button);
      overlay.appendChild(popup);
      document.body.appendChild(overlay);
    }

    try {
      await waitForValidGaze();
    } catch (err) {
      showErrorPopup("Camera not ready or gaze data unavailable. Cannot start bird game.");
      return;
    }

    return new Promise(async (resolve) => {
      let scoreDisplay = document.getElementById("birdScoreDisplay");
      if (!scoreDisplay) {
        scoreDisplay = document.createElement("div");
        scoreDisplay.id = "birdScoreDisplay";
        Object.assign(scoreDisplay.style, {
          position: "fixed",
          top: "20px",
          left: "30px",
          fontSize: "32px",
          fontWeight: "bold",
          color: "gold",
          textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 5px rgba(0,0,0,0.5)",
          zIndex: "9999999",
          background: "rgba(0,0,0,0.8)",
          padding: "15px 25px",
          borderRadius: "15px",
          border: "3px solid gold",
          pointerEvents: "none"
        });
        document.body.appendChild(scoreDisplay);
      }
      
      scoreDisplay.style.display = "block";
      let score = 0;
      scoreDisplay.textContent = `Score: ${score}`;
      console.log("Bird game score display shown");

      let birdContainer = document.getElementById("birdContainer");
      if (!birdContainer) {
        birdContainer = document.createElement("div");
        birdContainer.id = "birdContainer";
        document.body.appendChild(birdContainer);
        Object.assign(birdContainer.style, {
          position: "absolute",
          width: "110px",
          height: "110px",
          left: "0px",
          top: "0px",
          zIndex: "999999",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
        });

        birdContainer.appendChild(birdDot);
        Object.assign(birdDot.style, {
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "40px",
          height: "40px",
          transform: "translate(-50%, -50%) scale(1)",
          zIndex: "10",
          display: "block",
          transition: "transform 0.1s linear"
        });

        let progressRing = document.createElement("div");
        progressRing.id = "birdProgressRing";
        birdContainer.appendChild(progressRing);
        Object.assign(progressRing.style, {
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          background: "#f1f0e446",
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: "1",
          transform: "translate(-20%, -20%)"
        });
      }

      birdContainer.style.display = "block";
      const progressRing = document.getElementById("birdProgressRing");

      const totalPoints = 30;
      const dotSize = 110;
      const margin = 20; 

      const points = Array.from({ length: totalPoints }, () => ({
        x: margin + Math.random() * (window.innerWidth - dotSize - margin * 2),
        y: margin + Math.random() * (window.innerHeight - dotSize - margin * 2),
      }));

      let index = 0;

      function updateProgressRing(currentIndex) {
        const percentage = ((currentIndex + 1) / totalPoints) * 100;
        progressRing.style.background = `conic-gradient(
          #7d8d86da ${percentage}%,
          #f1f0e446 ${percentage}% 100%
        )`;
      }

      async function moveToNextPoint() {
        while (gamesPaused) {
          await new Promise(resume => currentGameResolver = resume);
        }

        if (index >= points.length) {
          birdContainer.style.display = "none";
          scoreDisplay.style.display = "none";
          resolve();
          return;
        }

        const startX = parseFloat(birdContainer.style.left) || points[index].x;
        const startY = parseFloat(birdContainer.style.top) || points[index].y;
        const endX = points[index].x;
        const endY = points[index].y;
        const duration = 2000;
        const startTime = performance.now();

        function animate(time) {
          if (gamesPaused) {
            requestAnimationFrame(animate);
            return;
          }

          const elapsed = time - startTime;
          const t = Math.min(elapsed / duration, 1);
          const currentX = startX + (endX - startX) * t;
          const currentY = startY + (endY - startY) * t;

          birdContainer.style.left = `${currentX}px`;
          birdContainer.style.top = `${currentY}px`;

          const scaleMoving = 1 - 0.3 * t; 
          birdDot.style.transform = `translate(-50%, -50%) scale(${scaleMoving})`;

          if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
            // Check if user is looking at the bird target
            const isLookingAtBird = isGazeNearTarget(
              window.currentGaze.x,
              window.currentGaze.y,
              currentX,  // bird position
              currentY,
              150        // 150px threshold
            );
            
            const gazeEntry = {
              time: Date.now(),
              gazeX: window.currentGaze.x,
              gazeY: window.currentGaze.y,
              targetX: currentX,
              targetY: currentY,
              game: "bird",
              pointIndex: index,
              isLookingAtTarget: isLookingAtBird,  // NEW: Boolean indicating if looking at target
              gazeQuadrant: getGazeQuadrant(window.currentGaze.x, window.currentGaze.y),  // NEW: Which area looking
              distanceToTarget: Math.sqrt(
                Math.pow(window.currentGaze.x - currentX, 2) + 
                Math.pow(window.currentGaze.y - currentY, 2)
              )  // NEW: Exact distance for analysis
            };
            allGamesGazeLog.push(gazeEntry);
            // fconsole.log("Bird - Looking at target:", isLookingAtBird, "Distance:", gazeEntry.distanceToTarget);
          }

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            updateProgressRing(index);

            const pulseDuration = 1000; 
            const pulseStart = performance.now();
            async function pulse(time) {
              while (gamesPaused) {
                await new Promise(resume => currentGameResolver = resume);
              }

              const elapsedPulse = time - pulseStart;
              const pulseT = Math.min(elapsedPulse / pulseDuration, 1);
              const scale = 0.7 + 0.6 * Math.sin(pulseT * Math.PI); 
              birdDot.style.transform = `translate(-50%, -50%) scale(${scale})`;

              if (pulseT < 1) {
                requestAnimationFrame(pulse);
              } else {
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
                console.log("Bird score updated:", score);
                
                index++;
                await moveToNextPoint();
              }
            }
            requestAnimationFrame(pulse);
          }
        }

        requestAnimationFrame(animate);
      }

      await moveToNextPoint();
    });
  }

  function runTargetGame() {
    return new Promise(async (resolve) => {
      let scoreDisplay = document.getElementById("targetScoreDisplay");
      if (!scoreDisplay) {
        scoreDisplay = document.createElement("div");
        scoreDisplay.id = "targetScoreDisplay";
        Object.assign(scoreDisplay.style, {
          position: "fixed",
          top: "20px",
          right: "20px",
          fontSize: "32px",
          fontWeight: "bold",
          color: "gold",
          textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 5px rgba(0,0,0,0.5)",
          zIndex: "9999999",
          background: "rgba(0,0,0,0.8)",
          padding: "15px 25px",
          borderRadius: "15px",
          border: "3px solid gold",
          pointerEvents: "none"
        });
        document.body.appendChild(scoreDisplay);
      }

      scoreDisplay.style.display = "block";
      let score = 0;
      scoreDisplay.textContent = `Score: ${score}`;
      console.log("Target game score display shown");

      targetDot.style.display = "block";
      let moves = 0;
      const baseScale = 0.7; 
      const totalPoints = 35;

      function renderTarget(remainingPoints) {
        targetDot.innerHTML = `
          <span style="font-size: 300px; display: block; color: white;">⌖</span>
          <div style="
            position: absolute;
            top: 60%;
            left: 50%;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: #e24319;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            color: black;
            transform: translate(-50%, -50%) scale(0);
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            pointer-events: none;
            transition: transform 0.3s ease-out;
          ">
            ${remainingPoints}
          </div>
        `;
        const numberCircle = targetDot.querySelector("div");
        requestAnimationFrame(() => {
          numberCircle.style.transform = "translate(-50%, -50%) scale(1)";
        });
        targetDot.style.position = "absolute";
        targetDot.style.textAlign = "center";
      }

      function renderExplosion() {
        const targetRect = targetDot.getBoundingClientRect();
        targetDot.style.visibility = "hidden";

        const explosion = document.createElement("span");
        explosion.textContent = "💥";
        Object.assign(explosion.style, {
          position: "fixed",
          left: `${targetRect.left + targetRect.width / 2}px`,
          top: `${targetRect.top + targetRect.height / 2}px`,
          transform: "translate(-50%, -50%) scale(0.3)",
          fontSize: "120px",
          animation: "explode 0.8s ease-out forwards",
          pointerEvents: "none",
          zIndex: "999999",
        });

        document.body.appendChild(explosion);

        const explosionSound = new Audio("explosion-fx-343683.mp3");
        explosionSound.volume = 0.3;
        explosionSound.play().catch(err => console.log("Sound playback blocked:", err));

        if (!document.getElementById("explosionStyles")) {
          const style = document.createElement("style");
          style.id = "explosionStyles";
          style.textContent = `
            @keyframes explode {
              0% {
                transform: translate(-50%, -50%) scale(0.3);
                opacity: 0;
              }
              30% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              60% {
                transform: translate(-50%, -50%) scale(1.2) rotate(8deg);
                opacity: 0.9;
              }
              100% {
                transform: translate(-50%, -50%) scale(1.3) rotate(15deg);
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(style);
        }

        setTimeout(() => {
          explosion.remove();
          targetDot.style.visibility = "visible";
        }, 800);
      }

      async function move() {
        while (gamesPaused) {
          await new Promise(resume => currentGameResolver = resume);
        }

        if (moves >= totalPoints) {
          targetDot.style.display = "none";
          scoreDisplay.style.display = "none";
          resolve();
          return;
        }

        const targetWidth = targetDot.offsetWidth || 200;  
        const targetHeight = targetDot.offsetHeight || 200;  

        const x = Math.random() * (window.innerWidth - targetWidth);
        const y = Math.random() * (window.innerHeight - targetHeight);

        targetDot.style.left = `${x}px`;
        targetDot.style.top = `${y}px`;

        const remainingPoints = totalPoints - moves;
        renderTarget(remainingPoints);

        targetDot.style.transform = `scale(${baseScale})`;
        targetDot.style.transition = "transform 0.3s ease-out";

        if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
          const isLookingAtTarget = isGazeNearTarget(
            window.currentGaze.x,
            window.currentGaze.y,
            x,
            y,
            150
          );
          
          const gazeEntry = {
            time: Date.now(),
            gazeX: window.currentGaze.x,
            gazeY: window.currentGaze.y,
            targetX: x,
            targetY: y,
            game: "target",
            moveIndex: moves,
            isLookingAtTarget: isLookingAtTarget,
            gazeQuadrant: getGazeQuadrant(window.currentGaze.x, window.currentGaze.y),
            distanceToTarget: Math.sqrt(
              Math.pow(window.currentGaze.x - x, 2) + 
              Math.pow(window.currentGaze.y - y, 2)
            )
          };
          allGamesGazeLog.push(gazeEntry);
          console.log(`🎯 TARGET - Looking at target:`, isLookingAtTarget);
        }


        setTimeout(() => {
          targetDot.style.transform = `scale(${baseScale * 0.6})`; 
        }, 100);

        setTimeout(async () => {
          renderExplosion();
          setTimeout(async () => {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            
            moves++;
            if (moves < totalPoints) renderTarget(totalPoints - moves);
            await move();
          }, 800);
        }, 1000);
      }

      await move();
    });
  }

function runGemGame() {
    return new Promise((resolve) => {
      let scoreDisplay = document.getElementById("gemScoreDisplay");
      if (!scoreDisplay) {
        scoreDisplay = document.createElement("div");
        scoreDisplay.id = "gemScoreDisplay";
        Object.assign(scoreDisplay.style, {
          position: "fixed",
          top: "20px",
          right: "20px",
          fontSize: "32px",
          fontWeight: "bold",
          color: "gold",
          textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 5px rgba(0,0,0,0.5)",
          zIndex: "999999",
          background: "rgba(0,0,0,0.6)",
          padding: "15px 25px",
          borderRadius: "15px",
          border: "2px solid gold",
          pointerEvents: "none"
        });
        document.body.appendChild(scoreDisplay);
      }

      scoreDisplay.style.display = "block";
      let score = 0;
      scoreDisplay.textContent = `Score: ${score}`;
      console.log("Gem game score display shown");

      // Create maze canvas
      let mazeCanvas = document.createElement("canvas");
      mazeCanvas.id = "mazeCanvas";
      Object.assign(mazeCanvas.style, {
        position: "fixed",
        top: "55%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "9999999",
      });
      
      const mazeSize = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8, 900);
      mazeCanvas.width = mazeSize;
      mazeCanvas.height = mazeSize;
      document.body.appendChild(mazeCanvas);
      
      const ctx = mazeCanvas.getContext("2d");
      const cellSize = mazeSize / 15; // 15x15 maze

      // Generate maze using recursive backtracking
      function generateMaze(cols, rows) {
        const maze = Array(rows).fill().map(() => Array(cols).fill({
          top: true,
          right: true,
          bottom: true,
          left: true,
          visited: false
        }));
        
        // Create copies for each cell
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            maze[r][c] = { top: true, right: true, bottom: true, left: true, visited: false };
          }
        }

        const stack = [];
        let current = { row: 0, col: 0 };
        maze[0][0].visited = true;

        while (true) {
          const neighbors = [];
          const { row, col } = current;

          if (row > 0 && !maze[row - 1][col].visited) neighbors.push({ row: row - 1, col, dir: 'top' });
          if (col < cols - 1 && !maze[row][col + 1].visited) neighbors.push({ row, col: col + 1, dir: 'right' });
          if (row < rows - 1 && !maze[row + 1][col].visited) neighbors.push({ row: row + 1, col, dir: 'bottom' });
          if (col > 0 && !maze[row][col - 1].visited) neighbors.push({ row, col: col - 1, dir: 'left' });

          if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            if (next.dir === 'top') {
              maze[row][col].top = false;
              maze[next.row][next.col].bottom = false;
            } else if (next.dir === 'right') {
              maze[row][col].right = false;
              maze[next.row][next.col].left = false;
            } else if (next.dir === 'bottom') {
              maze[row][col].bottom = false;
              maze[next.row][next.col].top = false;
            } else if (next.dir === 'left') {
              maze[row][col].left = false;
              maze[next.row][next.col].right = false;
            }

            maze[next.row][next.col].visited = true;
            stack.push(current);
            current = { row: next.row, col: next.col };
          } else if (stack.length > 0) {
            current = stack.pop();
          } else {
            break;
          }
        }

        return maze;
      }

      const maze = generateMaze(15, 15);

      function drawMaze(highlightPath = null) {
        // Clear canvas
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, mazeSize, mazeSize);

        // Draw the solution path first (if provided)
        if (highlightPath && highlightPath.length > 0) {
          ctx.strokeStyle = "#bca88d8a";
          ctx.lineWidth = cellSize * 0.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.beginPath();
          ctx.moveTo(
            highlightPath[0].col * cellSize + cellSize / 2,
            highlightPath[0].row * cellSize + cellSize / 2
          );

          for (let i = 1; i < highlightPath.length; i++) {
            ctx.lineTo(
              highlightPath[i].col * cellSize + cellSize / 2,
              highlightPath[i].row * cellSize + cellSize / 2
            );
          }
          ctx.stroke();
        }

        // Draw maze walls
        ctx.strokeStyle = "#fdfdfdff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#654321";
        ctx.shadowBlur = 5;

        for (let r = 0; r < 15; r++) {
          for (let c = 0; c < 15; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            const cell = maze[r][c];

            ctx.beginPath();
            if (cell.top) {
              ctx.moveTo(x, y);
              ctx.lineTo(x + cellSize, y);
            }
            if (cell.right) {
              ctx.moveTo(x + cellSize, y);
              ctx.lineTo(x + cellSize, y + cellSize);
            }
            if (cell.bottom) {
              ctx.moveTo(x, y + cellSize);
              ctx.lineTo(x + cellSize, y + cellSize);
            }
            if (cell.left) {
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + cellSize);
            }
            ctx.stroke();
          }
        }

        ctx.shadowBlur = 0;

        ctx.fillRect(2, 2, cellSize - 4, cellSize - 4);
        ctx.font = `${cellSize * 0.6}px Arial`;
        ctx.fillText("🚪", cellSize * 0.2, cellSize * 0.7);

        ctx.fillRect(14 * cellSize + 2, 14 * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.font = `${cellSize * 0.6}px Arial`;
        ctx.fillText("🏆", 14 * cellSize + cellSize * 0.2, 14 * cellSize + cellSize * 0.7);
      }

      drawMaze();

      // Create path through maze using BFS
      function findPath() {
        const queue = [{ row: 0, col: 0, path: [{ row: 0, col: 0 }] }];
        const visited = Array(15).fill().map(() => Array(15).fill(false));
        visited[0][0] = true;

        while (queue.length > 0) {
          const { row, col, path } = queue.shift();

          if (row === 14 && col === 14) {
            return path;
          }

          const moves = [];
          if (!maze[row][col].top && row > 0 && !visited[row - 1][col]) 
            moves.push({ row: row - 1, col });
          if (!maze[row][col].right && col < 14 && !visited[row][col + 1]) 
            moves.push({ row, col: col + 1 });
          if (!maze[row][col].bottom && row < 14 && !visited[row + 1][col]) 
            moves.push({ row: row + 1, col });
          if (!maze[row][col].left && col > 0 && !visited[row][col - 1]) 
            moves.push({ row, col: col - 1 });

          for (const move of moves) {
            visited[move.row][move.col] = true;
            queue.push({ 
              row: move.row, 
              col: move.col, 
              path: [...path, move] 
            });
          }
        }
        return [];
      }

      const pathPoints = findPath();
      
      // Redraw maze with the path highlighted
      drawMaze(pathPoints);
      
      gemDot.style.display = "block";
      gemDot.textContent = "💎";
      gemDot.style.fontSize = "40px";
      gemDot.style.zIndex = "99999999";

      let achievement = document.createElement("div");
      achievement.textContent = "🏆";
      Object.assign(achievement.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) scale(0.5)",
        fontSize: "100px",
        opacity: "0",
        transition: "opacity 1s, transform 1s",
        zIndex: "999999",
      });
      document.body.appendChild(achievement);

      async function animateThroughMaze() {
        const canvasRect = mazeCanvas.getBoundingClientRect();
        
        for (let i = 0; i < pathPoints.length; i++) {
          while (gamesPaused) {
            await new Promise(resume => currentGameResolver = resume);
          }

          const point = pathPoints[i];
          const screenX = canvasRect.left + point.col * cellSize + cellSize / 2;
          const screenY = canvasRect.top + point.row * cellSize + cellSize / 2;

          const gemSize = 40; 
          gemDot.style.left = `${screenX}px`;
          gemDot.style.top = `${screenY}px`;
          gemDot.style.transform = "translate(-50%, -50%)";

          const progress = i / pathPoints.length;
          const glowStrength = Math.floor(10 + progress * 50);
          gemDot.style.filter = `drop-shadow(0 0 ${glowStrength}px gold)`;

          if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
            const isLookingAtGem = isGazeNearTarget(
              window.currentGaze.x,
              window.currentGaze.y,
              screenX,
              screenY,
              150
            );
  
            const gazeEntry = {
              time: Date.now(),
              gazeX: window.currentGaze.x,
              gazeY: window.currentGaze.y,
              targetX: screenX,
              targetY: screenY,
              game: "gem",
              moveIndex: i,
              mazeProgress: progress,
              isLookingAtTarget: isLookingAtGem,
              gazeQuadrant: getGazeQuadrant(window.currentGaze.x, window.currentGaze.y),
              distanceToTarget: Math.sqrt(
                Math.pow(window.currentGaze.x - screenX, 2) + 
                Math.pow(window.currentGaze.y - screenY, 2)
              )
            };
            allGamesGazeLog.push(gazeEntry);
            console.log(`💎 GEM - Looking at gem:`, isLookingAtGem);
          }

          score++;
          scoreDisplay.textContent = `Score: ${score}`;

          await new Promise(r => setTimeout(r, 800));
        }

        gemDot.style.display = "none";
        mazeCanvas.remove();
        
        achievement.style.opacity = "1";
        achievement.style.transform = "translate(-50%, -50%) scale(1.5)";
        
        setTimeout(() => {
          achievement.style.opacity = "0";
          achievement.style.transform = "translate(-50%, -50%) scale(0.5)";
          scoreDisplay.style.display = "none";
          setTimeout(() => {
            if (achievement.parentNode) achievement.remove();
            resolve();
          }, 3000);
        }, 4000);
      }

      animateThroughMaze();
    });
  }

  const postCalibrationGazePath = []; 

function startPostCalibrationGazeTracing() {
  console.log("🔍 POST-CALIBRATION GAZE TRACING STARTING");
  console.log("Current gaze value:", window.currentGaze);
  
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.zIndex = "99998";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  let dot = document.getElementById("webgazerGazeDot");
  if (!dot) {
    dot = document.createElement("div");
    dot.id = "webgazerGazeDot";
    dot.style.position = "fixed";
    dot.style.width = "12px";
    dot.style.height = "12px";
    dot.style.background = "blue";
    dot.style.borderRadius = "50%";
    dot.style.zIndex = "99999";
    dot.style.pointerEvents = "none";
    dot.style.left = "50%";
    dot.style.top = "50%";
    document.body.appendChild(dot);
    console.log("✅ Blue gaze dot created");
  }

  const trail = [];
  const TRAIL_LIFETIME = 5000;
  let frameCount = 0;

  function drawTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();
    const alivePoints = trail.filter(p => now - p.time < TRAIL_LIFETIME);

    if (alivePoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(alivePoints[0].x, alivePoints[0].y);
      for (let i = 1; i < alivePoints.length; i++) {
        ctx.lineTo(alivePoints[i].x, alivePoints[i].y);
      }
      ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; 
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (alivePoints.length > 0) {
      const last = alivePoints[alivePoints.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "blue"; 
      ctx.fill();
    }

    trail.length = 0;
    trail.push(...alivePoints);

    requestAnimationFrame(drawTrail);
  }

  function updateGazeDot() {
    frameCount++;
    
    // Debug every 30 frames (roughly every second at 60fps)
    // if (frameCount % 30 === 0) {
    //   console.log("Frame", frameCount, "- window.currentGaze:", window.currentGaze);
    // }

    if (window.currentGaze && isFinite(window.currentGaze.x) && isFinite(window.currentGaze.y)) {
      dot.style.left = window.currentGaze.x - dot.offsetWidth / 2 + "px";
      dot.style.top = window.currentGaze.y - dot.offsetHeight / 2 + "px";
      dot.style.opacity = "1";
      dot.style.display = "block";

      trail.push({ 
        x: window.currentGaze.x, 
        y: window.currentGaze.y, 
        time: Date.now() 
      });
    } else {
      dot.style.opacity = "0.3"; // Make it semi-visible if gaze is 0,0
    }
    
    requestAnimationFrame(updateGazeDot);
  }

  drawTrail();
  updateGazeDot();
  
  console.log("✅ Post-calibration gaze tracing started");
}

  const gazeHistory = [];
  const SMOOTHING_WINDOW = 5; 

  function getSmoothedGaze(newPoint) {
    gazeHistory.push(newPoint);

    if (gazeHistory.length > SMOOTHING_WINDOW) {
      gazeHistory.shift();
    }

    const avg = gazeHistory.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    return {
      x: avg.x / gazeHistory.length,
      y: avg.y / gazeHistory.length,
    };
  }

  function hideWebGazerDot() {
    const tryHide = () => {
      const dot = document.getElementById("webgazerGazeDot");
      if (dot) {
        dot.style.display = "none";      
        dot.style.opacity = "0";         
        dot.style.pointerEvents = "none";
      }
    };

    tryHide();
    setInterval(tryHide, 100); 
  }

async function startGazeTracker() {
  try {
    console.log("Starting gaze tracker...");

    try {
      // Let WebGazer handle getting the video stream itself
      await webgazer
        .setRegression("ridge")
        .setTracker("clmtrackr")
        .showPredictionPoints(false)
        .showVideo(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .setGazeListener((data) => {
          if (!data) return;

          if (!isFinite(data.x) || !isFinite(data.y)) {
            return;
          }

          // Get smoothed raw gaze
          const smoothed = getSmoothedGaze({ x: data.x, y: data.y });
          
          // APPLY CALIBRATION MAPPING if calibration is complete
          let gazeToUse = smoothed;
          if (gazeCalibration.points.length > 0) {
            gazeToUse = mapGazeWithCalibration(smoothed);
          }
          
          window.currentGaze = gazeToUse;

          if (window.dotGaze) {
            window.dotGaze.style.left = `${gazeToUse.x - 10}px`;
            window.dotGaze.style.top = `${gazeToUse.y - 10}px`;
            window.dotGaze.style.display = "none";
          }
        })
        .begin();

      console.log("✅ WebGazer initialized successfully");

      await new Promise(resolve => setTimeout(resolve, 2000));

      function hideAllWebgazerElements() {
        const elements = document.querySelectorAll("[id*='webgazer'], [class*='webgazer']");
        elements.forEach(el => {
          el.style.display = "none";
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        });
      }

      hideAllWebgazerElements();
      setInterval(hideAllWebgazerElements, 100);

      console.log("✅ WebGazer started successfully");

    } catch (err) {
      console.error("❌ WebGazer failed to start:", err);
    }

  } catch (err) {
    console.error("❌ Failed to start gaze tracker:", err);
    alert("Camera access failed. Please allow camera permissions and try again.");
  }
}


console.log("DEBUG: window.currentGaze =", window.currentGaze, "video element =", window.videoElement);

  function startBrightnessLoop(video) {
    const brightnessDisplay = document.getElementById("brightness-display");
    if (!brightnessDisplay) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    console.log("inside brightness loop");

    function calcBrightness() {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0;
        for (let i = 0; i < frame.data.length; i += 4) {
          sum += 0.2126 * frame.data[i] + 0.7152 * frame.data[i + 1] + 0.0722 * frame.data[i + 2];
        }
        const avgBrightness = Math.round(sum / (frame.data.length / 4));
        brightnessDisplay.textContent = `Brightness: ${avgBrightness}`;
      } else {
        console.log("Video not ready yet", video.readyState, video.videoWidth, video.videoHeight);
      }

      requestAnimationFrame(calcBrightness);
    }

    calcBrightness();
  }

  function hideGazeDots() {
    if (window.dotGaze) window.dotGaze.style.display = "none";
    const webgazerDot = document.getElementById("webgazerGazeDot");
    if (webgazerDot) webgazerDot.style.display = "none";
  }
  
  function showGazeDots() {
    if (window.dotGaze) window.dotGaze.style.display = "block";
    const webgazerDot = document.getElementById("webgazerGazeDot");
    if (webgazerDot) webgazerDot.style.display = "block";
  }


  let glassesReflectionData = null;
  async function startGames() {
    if (calibrationInProgress) return;
    calibrationInProgress = true;

    hideGazeDots();

    try {
      await startGazeTracker();

      // ✅ WAIT for video to be ready BEFORE starting detection
      console.log("⏳ Waiting for video to be ready...");
      await new Promise(resolve => setTimeout(resolve, 3000)); // Give WebGazer time to initialize

      const videoHideInterval = hideVideoStreamDuringCalibration();
      
      // ✅ NOW try to get the video and start detection
      const video = document.querySelector('video');
      let reflectionDetector = null;
      
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        console.log("✅ Video found:", video.videoWidth, "x", video.videoHeight);
        reflectionDetector = detectGlassesReflection(video);
        console.log("👓 Glasses reflection detection started");
      } else {
        console.warn("⚠️ Video element not ready yet");
      }
      
      // Store cleanup function
      window.cleanupCalibration = () => {
        clearInterval(videoHideInterval);
        if (reflectionDetector) {
          reflectionDetector.stop();
          glassesReflectionData = reflectionDetector.data;
          console.log("📊 Glasses Detection Results:", glassesReflectionData);
        } else {
          console.warn("⚠️ No reflection detector to clean up");
        }
      };
    } catch (err) {
      calibrationInProgress = false;
      return;
    }
    
    if (blurOverlay) blurOverlay.classList.add("active");
    await runOnboardingAndCalibration();


    const video = document.querySelector('video');
    if (video && video.videoWidth > 0 && video.videoHeight > 0 && !window.reflectionDetectorStarted) {
      console.log("🔄 Starting reflection detection after tutorial");
      const reflectionDetector = detectGlassesReflection(video);
      window.reflectionDetectorStarted = true;
      
      // Update cleanup to use this detector
      const oldCleanup = window.cleanupCalibration;
      window.cleanupCalibration = () => {
        if (oldCleanup) oldCleanup();
        if (reflectionDetector) {
          reflectionDetector.stop();
          glassesReflectionData = reflectionDetector.data;
          console.log("📊 Glasses Detection Results (from tutorial):", glassesReflectionData);
        }
      };
    }

    await showGameIntro(
      "Level 1/3: Bird Game",
      [
        "A gentle breeze flows through the forest…",
        "A mysterious bird flutters into view.",
        "Follow the bird carefully — it knows the way forward."
      ],
      "🦅"
    );
    await runWithPause(runBirdGame);

    await showGameIntro(
      "Level 2/3: Target Game",
      [
        "The bird vanishes into the shadows…",
        "Targets suddenly appear around you.",
        "Strike carefully — your focus guides the way."
      ],
      "⌖"
    );
    await runWithPause(runTargetGame);

    await showGameIntro(
      "Level 3/3: Maze Game",
      [
        "A quiet mist rolls in as the ground begins to shift…",
        "Walls rise around you, forming a twisting maze.",
        "Use your gaze — only focus will lead you out."
      ],
      `₪`
    );
    await runWithPause(runGemGame);

    await finishGames();
    console.log("📍 About to start post-calibration tracing. Current gaze:", window.currentGaze);
    startPostCalibrationGazeTracing();
    console.log("📍 Post-calibration tracing should now be running. Current gaze:", window.currentGaze);
    showGazeDots(); 
  }

  async function finishGames() {
    calibrationInProgress = false;
    birdDot.style.display = "none";
    targetDot.style.display = "none";
    gemDot.style.display = "none";
    blurOverlay.classList.remove("active");
    if (blurOverlay) blurOverlay.style.display = "none";
    
    // Hide the pause button when calibration is complete
    const togglePauseBtn = document.getElementById("togglePauseBtn");
    if (togglePauseBtn) {
      togglePauseBtn.style.display = "none";
      togglePauseBtn.innerHTML = "⏸";
      togglePauseBtn.title = "Pause";
      
      // Remove old listeners by cloning
      const newBtn = togglePauseBtn.cloneNode(true);
      togglePauseBtn.parentNode.replaceChild(newBtn, togglePauseBtn);
      newBtn.addEventListener("click", togglePause);
      
      console.log("✅ Pause button initialized");
    }
    
    pathDrawingEnabled = true;
     if (window.cleanupCalibration) {
        window.cleanupCalibration();
      }

    console.log("✅ ALL GAMES COMPLETED - Total gaze points collected:", allGamesGazeLog.length);
    console.log("👓 GLASSES REFLECTION ANALYSIS:");
    if (glassesReflectionData) {
      console.log("  Has Glasses Detected:", glassesReflectionData.hasGlasses);
      console.log("  Reflection Intensity:", glassesReflectionData.reflectionIntensity.toFixed(2) + "%");
      console.log("  Total Samples:", glassesReflectionData.samplesCollected);
      console.log("  Full Detection Data:", glassesReflectionData.detections);
    } else {
      console.log("  No reflection data collected");
    }
    console.log("📊 Complete gaze data from all games:", allGamesGazeLog);
    
    const dataSent = await sendGazeDataToBackend(allGamesGazeLog);
    
    if (dataSent) {
      console.log("✅ Gaze data sent to backend successfully");
    } else {
      console.warn("⚠️ Could not send gaze data to backend, but calibration is complete");
    }

    // Also save locally as backup
    try {
      localStorage.setItem('allGamesGazeData', JSON.stringify(allGamesGazeLog));
      console.log("💾 Gaze data backed up to localStorage");
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    let popupOverlay = document.createElement("div");
    Object.assign(popupOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "30000"
    });
    document.body.appendChild(popupOverlay);

    let popupBox = document.createElement("div");
    Object.assign(popupBox.style, {
      background: "white",
      padding: "20px 30px",
      borderRadius: "12px",
      textAlign: "center",
      maxWidth: "400px",
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333",
      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    });
    popupOverlay.appendChild(popupBox);

    let message = document.createElement("div");
    message.textContent = "Calibration complete! The Blue dot now shows your real-time gaze with path.";
    popupBox.appendChild(message);

    let closeButton = document.createElement("button");
    closeButton.textContent = "OK";
    Object.assign(closeButton.style, {
      marginTop: "15px",
      padding: "8px 16px",
      fontSize: "16px",
      background: "#3E3F29",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer"
    });
    popupBox.appendChild(closeButton);

    closeButton.onclick = () => {
      if (popupOverlay.parentNode) popupOverlay.remove();
    };
  }

  const toggleSwitch = document.getElementById("toggle-switch-popup");
  let isTrackingOn = false;

  if (calibrateBtn) {
    calibrateBtn.addEventListener("click", () => {
      startGames(); 
    });
  }

  // Declare variables for pause/resume functionality
  let gamesPaused = false;
  let currentGameResolver = null;

  function pauseGames() {
    gamesPaused = true;
    console.log("Calibration games paused.");
  }

  function resumeGames() {
    if (!gamesPaused) return;
    gamesPaused = false;
    console.log("Calibration games resumed.");

    if (currentGameResolver) {
      currentGameResolver();
      currentGameResolver = null;
    }
  }

  function togglePause() {
    const togglePauseBtn = document.getElementById("togglePauseBtn");

    if (!togglePauseBtn) {
      console.error("❌ Pause button not found!");
      return;
    }
    if (gamesPaused) {
      resumeGames();
      if (togglePauseBtn) {
        togglePauseBtn.innerHTML = "⏸";
        togglePauseBtn.title = "Pause";
      }
    } else {
      pauseGames();
      if (togglePauseBtn) {
        togglePauseBtn.innerHTML = "▶";
        togglePauseBtn.title = "Resume";
      }
    }
  }

  // Set up the toggle button
  const togglePauseBtn = document.getElementById("togglePauseBtn");
  if (togglePauseBtn) {
    togglePauseBtn.style.display = "none"; // Hide initially
    togglePauseBtn.innerHTML = "⏸"; // Set initial icon
    togglePauseBtn.title = "Pause"; // Set initial tooltip
    togglePauseBtn.addEventListener("click", togglePause); // Add event listener

  }

  async function runWithPause(gameFn) {
    while (gamesPaused) {
      await new Promise(resolve => {
        currentGameResolver = resolve;
      });
    }
    return gameFn();
  }

  async function initGazeTracking() {
    if (!window.webgazer) {
      alert("WebGazer is not loaded!");
      throw new Error("WebGazer not found");
    }

    let correctionModel = null;
    const storedModel = localStorage.getItem("calibrationModel");
    if (storedModel) {
      correctionModel = JSON.parse(storedModel);
    }

    if (!window.dotGaze) {
      const dotGaze = document.createElement("div");
      dotGaze.style.position = "fixed";
      dotGaze.style.width = "20px";
      dotGaze.style.height = "20px";
      dotGaze.style.background = "red";
      dotGaze.style.borderRadius = "50%";
      dotGaze.style.zIndex = "10002";
      dotGaze.style.pointerEvents = "none";
      document.body.appendChild(dotGaze);
      window.dotGaze = dotGaze;
    }

    

    await webgazer
      .setRegression("ridge")
      .setTracker("clmtrackr")
      .setGazeListener((data) => {
        if (!data || !isFinite(data.x) || !isFinite(data.y)) {
          window.currentGaze = { x: 0, y: 0 };
          return;
        }

        window.currentGaze = { x: data.x, y: data.y };
        if (window.dotGaze) {
          window.dotGaze.style.left = `${window.currentGaze.x - 10}px`;
          window.dotGaze.style.top = `${window.currentGaze.y - 10}px`;
          window.dotGaze.style.zIndex = "100000";
        }
      })
      .begin();
    
    const webgazerDot = document.getElementById("webgazerGazeDot");
    if (webgazerDot) {
      webgazerDot.style.display = "none";
      webgazerDot.style.opacity = "0";
      webgazerDot.style.width = "0px";
      webgazerDot.style.height = "0px";
    }
    
    webgazer.showVideo(true).showFaceOverlay(false).showFaceFeedbackBox(false);
    console.log("Gaze tracking started, custom dot visible.");
  }

  if (openPopupBtn && popupOverlay) {
    openPopupBtn.addEventListener("click", () => {
      popupOverlay.style.display = "flex";
    });

    let dwellTimer = null;

    openPopupBtn.addEventListener("mouseenter", () => {
      dwellTimer = setTimeout(() => {
        popupOverlay.style.display = "flex";
      }, 5000); 
    });

    openPopupBtn.addEventListener("mouseleave", () => {
      if (dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    });
  }

  async function sendGazeDataToBackend(gazeData) {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        totalPoints: gazeData.length,
        gameBreakdown: {
          bird: gazeData.filter(d => d.game === "bird").length,
          target: gazeData.filter(d => d.game === "target").length,
          gem: gazeData.filter(d => d.game === "gem").length
        },
        gazePoints: gazeData
      };

      const response = await fetch('http://localhost:3000/save-gaze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log("✅ Gaze data successfully sent to backend");
        return true;
      } else {
        console.error("❌ Failed to send gaze data. Status:", response.status);
        return false;
      }
    } catch (err) {
      console.error("❌ Error sending gaze data to backend:", err);
      return false;
    }
  }
  if (closeBtn && popupOverlay) {
    closeBtn.addEventListener("click", () => popupOverlay.style.display = "none");

    let dwellTimer;
    closeBtn.addEventListener("mouseenter", () => {
      dwellTimer = setTimeout(() => {
        popupOverlay.style.display = "none";
      }, 5000);
    });

    closeBtn.addEventListener("mouseleave", () => {
      clearTimeout(dwellTimer);
    });
  }

  const scrollLeftSelect = document.getElementById("scrollLeftSelect");
  const scrollRightSelect = document.getElementById("scrollRightSelect");
  const scrollUpSelect = document.getElementById("scrollUpSelect");
  const scrollDownSelect = document.getElementById("scrollDownSelect");
  const triggerSelect = document.getElementById("triggerSelect");
  const addButton = document.getElementById("addButton");
  if (addButton) addButton.addEventListener("click", () => console.log("Add Settings button clicked!"));

  const saveButton = document.getElementById("saveButton");
  if (saveButton) saveButton.addEventListener("click", function () {
    const preferences = {
      "Scroll Left": scrollLeftSelect?.value || "",
      "Scroll Right": scrollRightSelect?.value || "",
      "Scroll Up": scrollUpSelect?.value || "",
      "Scroll Down": scrollDownSelect?.value || "",
      "Trigger or choose": triggerSelect?.value || ""
    };
    if (chrome?.storage?.local) chrome.storage.local.set({ gazePreferences: preferences }, () => showFeedbackBox());
    else showFeedbackBox();
  });

  if (chrome?.storage?.local) {
    chrome.storage.local.get(["gazePreferences"], function (data) {
      if (data.gazePreferences) {
        if (scrollLeftSelect) scrollLeftSelect.value = data.gazePreferences["Scroll Left"] || "";
        if (scrollRightSelect) scrollRightSelect.value = data.gazePreferences["Scroll Right"] || "";
        if (scrollUpSelect) scrollUpSelect.value = data.gazePreferences["Scroll Up"] || "";
        if (scrollDownSelect) scrollDownSelect.value = data.gazePreferences["Scroll Down"] || "";
        if (triggerSelect) triggerSelect.value = data.gazePreferences["Trigger or choose"] || "";
      }

      function addDwellOpen(selectElement) {
        if (!selectElement) return;
        let dwellTimer;

        selectElement.addEventListener("mouseenter", () => {
          dwellTimer = setTimeout(() => {
            selectElement.focus();
            selectElement.size = selectElement.options.length;
          }, 7000); 
        });

        selectElement.addEventListener("mouseleave", () => {
          clearTimeout(dwellTimer);
          selectElement.size = 0; 
        });

        selectElement.addEventListener("change", () => {
          selectElement.size = 0; 
        });
      }

      addDwellOpen(scrollLeftSelect);
      addDwellOpen(scrollRightSelect);
      addDwellOpen(scrollUpSelect);
      addDwellOpen(scrollDownSelect);
      addDwellOpen(triggerSelect);
    });
  }

  function showFeedbackBox() {
    if (!feedbackBox) return;
    feedbackBox.textContent = "Preferences saved!";
    feedbackBox.style.display = "block";
    document.body.appendChild(feedbackBox);
    feedbackBox.style.position = "fixed";
    feedbackBox.style.zIndex = "99999";
    const popupContent = document.getElementById("popupContent");

    if (!popupContent) return;
    popupContent.style.filter = "blur(3px)";
    let popupBlurTimer = setTimeout(() => {
      feedbackBox.style.display = "none";
      popupContent.style.filter = "none";
      clearTimeout(popupBlurTimer);
      if (popupOverlay) popupOverlay.style.display = "none";
    }, 1000);
  }

  window.getGazeData = () => {
    console.log("📊 Total gaze points:", allGamesGazeLog.length);
    console.log("🎮 Breakdown by game:");
    console.log("  🦅 Bird:", allGamesGazeLog.filter(d => d.game === "bird").length);
    console.log("  🎯 Target:", allGamesGazeLog.filter(d => d.game === "target").length);
    console.log("  💎 Gem:", allGamesGazeLog.filter(d => d.game === "gem").length);
    return allGamesGazeLog;
  };

  console.log("💡 Tip: Type 'window.getGazeData()' in console to view all collected gaze data");
  window.getReflectionData = () => {
  if (glassesReflectionData) {
    console.log("👓 Glasses Reflection Data:");
    console.log("  Has Glasses:", glassesReflectionData.hasGlasses);
    console.log("  Reflection Intensity:", glassesReflectionData.reflectionIntensity.toFixed(2) + "%");
    console.log("  Samples:", glassesReflectionData.samplesCollected);
    console.log("  All Detections:", glassesReflectionData.detections);
    return glassesReflectionData;
  } else {
    console.log("❌ No reflection data available yet - calibration may not have started");
    return null;
  }
};

console.log("💡 Tip: Type 'window.getReflectionData()' in console to view glasses reflection data");

});