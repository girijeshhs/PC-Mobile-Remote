#!/usr/bin/env python3
"""
Flask backend for phone remote control
Handles media playback and volume control commands
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui
import platform
import subprocess
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Detect OS
OS_TYPE = platform.system()
logger.info(f"Running on {OS_TYPE}")


def execute_media_command(command):
    """Execute media control commands based on OS"""
    try:
        if OS_TYPE == "Darwin":  # macOS
            # Use AppleScript for better Spotify/macOS media control
            applescript_map = {
                "play_pause": 'tell application "Spotify" to playpause',
                "next": 'tell application "Spotify" to next track',
                "previous": 'tell application "Spotify" to previous track',
            }
            
            # For volume, use osascript with system volume
            if command == "volume_up":
                subprocess.run(["osascript", "-e", "set volume output volume (output volume of (get volume settings) + 6)"])
                return True
            elif command == "volume_down":
                subprocess.run(["osascript", "-e", "set volume output volume (output volume of (get volume settings) - 6)"])
                return True
            elif command == "mute":
                subprocess.run(["osascript", "-e", "set volume output muted (not (output muted of (get volume settings)))"])
                return True
            elif command in applescript_map:
                # Execute AppleScript command
                result = subprocess.run(
                    ["osascript", "-e", applescript_map[command]],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    return True
                else:
                    logger.error(f"AppleScript error: {result.stderr}")
                    return False
                
        elif OS_TYPE == "Windows":
            key_map = {
                "play_pause": "playpause",
                "next": "nexttrack",
                "previous": "prevtrack",
                "volume_up": "volumeup",
                "volume_down": "volumedown",
                "mute": "volumemute"
            }
            
            if command in key_map:
                pyautogui.press(key_map[command])
                return True
                
        elif OS_TYPE == "Linux":
            # Use xdotool for Linux
            key_map = {
                "play_pause": "XF86AudioPlay",
                "next": "XF86AudioNext",
                "previous": "XF86AudioPrev",
                "volume_up": "XF86AudioRaiseVolume",
                "volume_down": "XF86AudioLowerVolume",
                "mute": "XF86AudioMute"
            }
            
            if command in key_map:
                subprocess.run(["xdotool", "key", key_map[command]])
                return True
        
        return False
    except Exception as e:
        logger.error(f"Error executing command {command}: {e}")
        return False


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "service": "Phone Remote Control Backend",
        "os": OS_TYPE
    })


@app.route('/api/control', methods=['POST'])
def control():
    """Handle control commands from frontend"""
    try:
        data = request.get_json()
        command = data.get('command')
        
        if not command:
            return jsonify({"error": "No command provided"}), 400
        
        logger.info(f"Received command: {command}")
        
        success = execute_media_command(command)
        
        if success:
            return jsonify({
                "status": "success",
                "command": command,
                "message": f"Executed {command}"
            })
        else:
            return jsonify({
                "status": "error",
                "command": command,
                "message": f"Failed to execute {command}"
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/keyboard', methods=['POST'])
def keyboard():
    """Handle keyboard shortcuts"""
    try:
        data = request.get_json()
        keys = data.get('keys')
        
        if not keys:
            return jsonify({"error": "No keys provided"}), 400
        
        logger.info(f"Executing keyboard shortcut: {keys}")
        
        if isinstance(keys, list):
            pyautogui.hotkey(*keys)
        else:
            pyautogui.press(keys)
        
        return jsonify({
            "status": "success",
            "message": f"Executed keyboard command: {keys}"
        })
        
    except Exception as e:
        logger.error(f"Error processing keyboard command: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/volume', methods=['POST'])
def volume():
    """Handle volume changes with percentage"""
    try:
        data = request.get_json()
        action = data.get('action')
        steps = data.get('steps', 1)
        
        if not action:
            return jsonify({"error": "No action provided"}), 400
        
        logger.info(f"Volume action: {action}, steps: {steps}")
        
        for _ in range(steps):
            if action == "up":
                execute_media_command("volume_up")
            elif action == "down":
                execute_media_command("volume_down")
            elif action == "mute":
                execute_media_command("mute")
        
        return jsonify({
            "status": "success",
            "action": action,
            "steps": steps
        })
        
    except Exception as e:
        logger.error(f"Error processing volume command: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Get local IP for LAN access
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    logger.info("=" * 60)
    logger.info("Phone Remote Control Backend Starting...")
    logger.info(f"Local IP: {local_ip}")
    logger.info(f"Access from phone: http://{local_ip}:5000")
    logger.info("=" * 60)
    
    # Run on all interfaces to allow LAN access
    app.run(host='0.0.0.0', port=5000, debug=True)
