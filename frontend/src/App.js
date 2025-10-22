import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [backendUrl, setBackendUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [tiltData, setTiltData] = useState({ beta: 0, gamma: 0 });
  const [lastCommand, setLastCommand] = useState('');
  const [recognition, setRecognition] = useState(null);

  // Check backend connection
  const checkConnection = useCallback(async () => {
    if (!backendUrl) return;
    
    try {
      const response = await fetch(backendUrl);
      const data = await response.json();
      if (data.status === 'running') {
        setIsConnected(true);
        setMessage(`Connected to ${data.os}`);
      }
    } catch (error) {
      setIsConnected(false);
      setMessage('Backend not reachable');
    }
  }, [backendUrl]);

  // Send command to backend
  const sendCommand = useCallback(async (command) => {
    if (!backendUrl) {
      setMessage('Please set backend URL first');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage(`✓ ${command}`);
        setLastCommand(command);
      } else {
        setMessage(`✗ ${command} failed`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }, [backendUrl]);

  // Volume control with steps
  const sendVolumeCommand = useCallback(async (action, steps = 1) => {
    if (!backendUrl) return;

    try {
      await fetch(`${backendUrl}/api/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, steps })
      });
      setMessage(`Volume ${action}`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }, [backendUrl]);

  // Gesture/Tilt detection
  useEffect(() => {
    if (!gestureEnabled) return;

    let lastTiltTime = 0;
    const tiltThreshold = 30; // degrees
    const tiltCooldown = 1000; // ms

    const handleOrientation = (event) => {
      const beta = event.beta; // Front-to-back tilt (-180 to 180)
      const gamma = event.gamma; // Left-to-right tilt (-90 to 90)
      
      setTiltData({ beta: Math.round(beta), gamma: Math.round(gamma) });

      const now = Date.now();
      if (now - lastTiltTime < tiltCooldown) return;

      // Tilt forward = volume up
      if (beta > tiltThreshold) {
        sendCommand('volume_up');
        lastTiltTime = now;
      }
      // Tilt backward = volume down
      else if (beta < -tiltThreshold) {
        sendCommand('volume_down');
        lastTiltTime = now;
      }
      // Tilt left = previous track
      else if (gamma < -tiltThreshold) {
        sendCommand('previous');
        lastTiltTime = now;
      }
      // Tilt right = next track
      else if (gamma > tiltThreshold) {
        sendCommand('next');
        lastTiltTime = now;
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [gestureEnabled, backendUrl, sendCommand]);

  // Voice recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      
      setMessage(`Heard: "${command}"`);

      // Map voice commands
      if (command.includes('play') || command.includes('pause')) {
        sendCommand('play_pause');
      } else if (command.includes('next')) {
        sendCommand('next');
      } else if (command.includes('previous') || command.includes('back')) {
        sendCommand('previous');
      } else if (command.includes('volume up') || command.includes('louder')) {
        sendVolumeCommand('up', 3);
      } else if (command.includes('volume down') || command.includes('quieter')) {
        sendVolumeCommand('down', 3);
      } else if (command.includes('mute')) {
        sendCommand('mute');
      }
    };

    recognitionInstance.onerror = (event) => {
      setMessage(`Voice error: ${event.error}`);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [backendUrl, sendCommand, sendVolumeCommand]);

  // Toggle voice recognition
  const toggleVoice = () => {
    if (!recognition) {
      setMessage('Voice recognition not supported');
      return;
    }

    if (voiceEnabled) {
      recognition.stop();
      setVoiceEnabled(false);
      setMessage('Voice control disabled');
    } else {
      recognition.start();
      setVoiceEnabled(true);
      setMessage('Voice control enabled (say: play, pause, next, previous, volume up, volume down, mute)');
    }
  };

  // Request device orientation permission (iOS 13+)
  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setGestureEnabled(true);
          setMessage('Gesture control enabled');
        } else {
          setMessage('Permission denied');
        }
      } catch (error) {
        setMessage('Permission error');
      }
    } else {
      setGestureEnabled(true);
      setMessage('Gesture control enabled');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📱 Phone Remote Control</h1>
        
        {/* Connection Setup */}
        <div className="connection-panel">
          <input
            type="text"
            placeholder="Backend URL (e.g., http://192.168.1.5:5000)"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            className="url-input"
          />
          <button onClick={checkConnection} className="btn-connect">
            Check Connection
          </button>
          <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>

        {/* Status Message */}
        <div className="message">{message}</div>

        {/* Media Controls */}
        <div className="control-grid">
          <button 
            onClick={() => sendCommand('previous')} 
            className="btn-control btn-previous"
            disabled={!isConnected}
          >
            ⏮️ Previous
          </button>
          
          <button 
            onClick={() => sendCommand('play_pause')} 
            className="btn-control btn-play"
            disabled={!isConnected}
          >
            ⏯️ Play/Pause
          </button>
          
          <button 
            onClick={() => sendCommand('next')} 
            className="btn-control btn-next"
            disabled={!isConnected}
          >
            ⏭️ Next
          </button>
        </div>

        {/* Volume Controls */}
        <div className="volume-controls">
          <button 
            onClick={() => sendVolumeCommand('down')} 
            className="btn-volume"
            disabled={!isConnected}
          >
            🔉 Volume Down
          </button>
          
          <button 
            onClick={() => sendCommand('mute')} 
            className="btn-volume"
            disabled={!isConnected}
          >
            🔇 Mute
          </button>
          
          <button 
            onClick={() => sendVolumeCommand('up')} 
            className="btn-volume"
            disabled={!isConnected}
          >
            🔊 Volume Up
          </button>
        </div>

        {/* Advanced Features */}
        <div className="advanced-controls">
          <button 
            onClick={requestOrientationPermission}
            className={`btn-feature ${gestureEnabled ? 'active' : ''}`}
            disabled={!isConnected}
          >
            {gestureEnabled ? '✓ Gesture ON' : 'Enable Gestures'}
          </button>
          
          <button 
            onClick={toggleVoice}
            className={`btn-feature ${voiceEnabled ? 'active' : ''}`}
            disabled={!isConnected}
          >
            {voiceEnabled ? '🎤 Voice ON' : '🎤 Enable Voice'}
          </button>
        </div>

        {/* Tilt Data Display */}
        {gestureEnabled && (
          <div className="tilt-display">
            Tilt: β={tiltData.beta}° γ={tiltData.gamma}°
            <br />
            <small>Tilt phone to control</small>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Enter your laptop's IP address and port (shown in backend terminal)</li>
            <li>Tap buttons to control media playback</li>
            <li>Enable gestures to tilt phone for controls</li>
            <li>Enable voice (HTTPS only) to use voice commands</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;
