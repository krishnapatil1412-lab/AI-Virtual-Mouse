import { useEffect, useRef, useState } from 'react';
import {
  socket,
  connectSocket,
  disconnectSocket
} from '../services/socketService';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import './LiveDemo.css';

function LiveDemo() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [gesture, setGesture] = useState('Camera Off');
  const [error, setError] = useState('');

  // -----------------------------------------
  // CREATE MEDIAPIPE HAND LANDMARKER
  // -----------------------------------------
  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
    );

    const handLandmarker = await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',

          delegate: 'GPU',
        },

        runningMode: 'VIDEO',

        numHands: 1,
      }
    );

    handLandmarkerRef.current = handLandmarker;
  };

  // -----------------------------------------
  // START CAMERA
  // -----------------------------------------
  const startCamera = async () => {
    try {
      setError('');

      // Create MediaPipe model if it doesn't exist
      if (!handLandmarkerRef.current) {
        await createHandLandmarker();
      }

      // Ask browser for camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
        },

        audio: false,
      });

      const video = videoRef.current;

      video.srcObject = stream;

      video.onloadeddata = () => {
        setCameraActive(true);

        detectHands();
      };
    } catch (err) {
      console.error('Camera Error:', err);

      setError(
        'Camera access failed. Please allow camera permission and try again.'
      );
    }
  };

  // -----------------------------------------
  // STOP CAMERA
  // -----------------------------------------
  const stopCamera = () => {
    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const video = videoRef.current;

    // Stop webcam tracks
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
    }

    setCameraActive(false);

    setGesture('Camera Off');
  };

  // -----------------------------------------
  // CLEANUP WHEN PAGE IS CLOSED
  // -----------------------------------------
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  // -----------------------------------------
// SOCKET.IO CONNECTION
// -----------------------------------------
useEffect(() => {
  connectSocket();

  const handleConnect = () => {
    console.log('✅ Connected to Render:', socket.id);
  };

  const handleDisconnect = () => {
    console.log('🔴 Disconnected from Render');
  };

  const handleConnectError = (error) => {
    console.error('❌ Connection Error:', error.message);
  };

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);

  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('connect_error', handleConnectError);
  };
}, []);

  // -----------------------------------------
  // DETECT HANDS
  // -----------------------------------------
  const detectHands = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handLandmarker = handLandmarkerRef.current;

    // If something isn't ready, try again
    if (
      !video ||
      !canvas ||
      !handLandmarker ||
      video.readyState < 2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(detectHands);

      return;
    }

    const ctx = canvas.getContext('2d');

    // Match canvas size with video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Detect hand
    const results = handLandmarker.detectForVideo(
      video,
      performance.now()
    );

    // Clear previous frame
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // -----------------------------------------
    // IF HAND FOUND
    // -----------------------------------------
    if (
      results.landmarks &&
      results.landmarks.length > 0
    ) {
      const landmarks = results.landmarks[0];

      // Draw hand landmarks
      drawHand(
        ctx,
        landmarks,
        canvas.width,
        canvas.height
      );

      // Detect gesture
      const currentGesture =
        detectGesture(landmarks);

      setGesture(currentGesture);
    }

    // -----------------------------------------
    // NO HAND FOUND
    // -----------------------------------------
    else {
      setGesture('No Hand Detected');
    }

    // Continue detection
    animationFrameRef.current =
      requestAnimationFrame(detectHands);
  };

  // -----------------------------------------
  // DRAW HAND LANDMARKS
  // -----------------------------------------
  const drawHand = (
    ctx,
    landmarks,
    width,
    height
  ) => {
    // Landmark color
    ctx.fillStyle = '#00ff88';

    landmarks.forEach((point) => {
      ctx.beginPath();

      ctx.arc(
        point.x * width,
        point.y * height,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();
    });

    // Draw connections
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],

      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],

      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12],

      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16],

      [13, 17],
      [17, 18],
      [18, 19],
      [19, 20],

      [0, 17],
    ];

    ctx.strokeStyle = '#00ff88';

    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const point1 = landmarks[start];
      const point2 = landmarks[end];

      ctx.beginPath();

      ctx.moveTo(
        point1.x * width,
        point1.y * height
      );

      ctx.lineTo(
        point2.x * width,
        point2.y * height
      );

      ctx.stroke();
    });
  };

  // -----------------------------------------
  // DETECT GESTURE
  // -----------------------------------------
  const detectGesture = (landmarks) => {
    // Thumb tip
    const thumbTip = landmarks[4];

    // Index finger tip
    const indexTip = landmarks[8];

    // Calculate distance between thumb
    // and index finger
    const distance = Math.sqrt(
      Math.pow(
        thumbTip.x - indexTip.x,
        2
      ) +
      Math.pow(
        thumbTip.y - indexTip.y,
        2
      )
    );

    // If thumb and index finger
    // are very close
    if (distance < 0.05) {
      return 'Pinch / Click';
    }

    return 'Hand Detected';
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------
  return (
    <div className="live-demo">

      {/* HEADER */}
      <div className="demo-header">

        <h1>AI Virtual Mouse</h1>

        <p>
          Control the virtual interface using
          hand gestures.
        </p>

      </div>

      {/* MAIN LAYOUT */}
      <div className="demo-layout">

        {/* CAMERA SECTION */}
        <div className="camera-section">

          <div className="camera-container">

            {/* WEBCAM */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            {/* LANDMARK CANVAS */}
            <canvas
              ref={canvasRef}
            />

            {/* CAMERA OFF MESSAGE */}
            {!cameraActive && (
              <div className="camera-overlay">

                <span>
                  Camera is currently off
                </span>

              </div>
            )}

          </div>

          {/* CAMERA BUTTON */}
          <div className="camera-controls">

            {!cameraActive ? (

              <button
                className="start-button"
                onClick={startCamera}
              >
                Start Camera
              </button>

            ) : (

              <button
                className="stop-button"
                onClick={stopCamera}
              >
                Stop Camera
              </button>

            )}

          </div>

          {/* ERROR */}
          {error && (
            <p className="camera-error">
              {error}
            </p>
          )}

        </div>

        {/* GESTURE PANEL */}
        <div className="gesture-panel">

          <h2>
            Gesture Status
          </h2>

          {/* CURRENT STATUS */}
          <div className="gesture-status">

            <span
              className={`status-dot ${
                cameraActive
                  ? 'active'
                  : ''
              }`}
            ></span>

            <span>
              {gesture}
            </span>

          </div>

          {/* INSTRUCTIONS */}
          <div className="gesture-info">

            <div className="gesture-item">

              <strong>
                ☝️ Move
              </strong>

              <span>
                Move your index finger
              </span>

            </div>

            <div className="gesture-item">

              <strong>
                🤏 Pinch
              </strong>

              <span>
                Bring thumb and index
                finger together
              </span>

            </div>

            <div className="gesture-item">

              <strong>
                ✋ Hand
              </strong>

              <span>
                Show your hand to the camera
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default LiveDemo;