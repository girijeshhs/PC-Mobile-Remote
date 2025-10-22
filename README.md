# 📱 Phone Remote Control

Control your laptop's media playback and volume from your phone using a React frontend and Python Flask backend over local Wi-Fi.

## Features

- ✅ **Media Controls**: Play/Pause, Next Track, Previous Track
- 🔊 **Volume Controls**: Volume Up, Volume Down, Mute
- 📱 **Gesture Control**: Tilt your phone to control playback and volume
- 🎤 **Voice Commands**: Use voice to control media (HTTPS only)
- 🌐 **LAN Connection**: Works over local Wi-Fi - no internet required
- 💯 **Free Tools**: Uses only free, open-source tools

## Prerequisites

### On Laptop
- Python 3.7+
- pip (Python package manager)

### On Phone
- Modern mobile browser (Chrome, Safari, Firefox)
- Same Wi-Fi network as laptop

## Installation & Setup

### 1. Backend Setup (Laptop)

```bash
# Navigate to backend directory
cd phone-remote-control/backend

# Install Python dependencies
pip install -r requirements.txt

# On macOS, you may need to install Python dependencies with:
pip3 install -r requirements.txt

# For Linux users, you may also need to install xdotool:
# sudo apt-get install xdotool  # Debian/Ubuntu
# sudo yum install xdotool      # CentOS/RHEL
```

### 2. Frontend Setup (Laptop)

```bash
# Navigate to frontend directory
cd phone-remote-control/frontend

# Install Node.js dependencies
npm install

# This will install React and all required packages
```

## Running the Application

### Step 1: Start the Backend Server (Laptop)

```bash
# In the backend directory
cd backend
python app.py

# Or on macOS/Linux:
python3 app.py
```

**Important**: The terminal will display your local IP address. Note this down!

Example output:
```
============================================================
Phone Remote Control Backend Starting...
Local IP: 192.168.1.5
Access from phone: http://192.168.1.5:5000
============================================================
```

### Step 2: Start the React Frontend (Laptop)

Open a **new terminal window** and run:

```bash
# In the frontend directory
cd frontend
npm start
```

This will start the React development server. It usually opens `http://localhost:3000` in your default browser.

### Step 3: Connect from Phone

1. **Find Your Laptop's Local IP**: 
   - The Flask backend will display it when it starts
   - On macOS: System Preferences → Network → your connection → IP address
   - On Windows: Open Command Prompt and type `ipconfig` (look for IPv4 Address)
   - On Linux: Run `hostname -I` in terminal

2. **Open Browser on Phone**:
   - Connect to the same Wi-Fi as your laptop
   - Open your phone's web browser
   - Navigate to: `http://YOUR_LAPTOP_IP:3000`
   - Example: `http://192.168.1.5:3000`

3. **Configure Backend URL**:
   - In the app's input field, enter: `http://YOUR_LAPTOP_IP:5000`
   - Example: `http://192.168.1.5:5000`
   - Tap "Check Connection"
   - You should see "🟢 Connected"

## Usage

### Basic Controls
- **Play/Pause**: Toggle media playback
- **Next/Previous**: Navigate between tracks
- **Volume Up/Down**: Adjust system volume
- **Mute**: Toggle mute

### Gesture Control (Tilt)
1. Tap "Enable Gestures" button
2. Grant permission if prompted (iOS 13+ requires permission)
3. Tilt your phone to control:
   - **Tilt Forward**: Volume Up
   - **Tilt Backward**: Volume Down
   - **Tilt Left**: Previous Track
   - **Tilt Right**: Next Track

### Voice Commands (HTTPS Only)
⚠️ **Note**: Voice recognition requires HTTPS. See HTTPS Setup below.

1. Tap "Enable Voice" button
2. Say commands like:
   - "play" or "pause"
   - "next"
   - "previous" or "back"
   - "volume up" or "louder"
   - "volume down" or "quieter"
   - "mute"

## Enabling HTTPS for Voice Commands

Voice recognition API requires a secure context (HTTPS). Here are your options:

### Option 1: ngrok (Easiest)
```bash
# Install ngrok from https://ngrok.com
# Then run:
ngrok http 3000
# Use the HTTPS URL provided by ngrok on your phone
```

### Option 2: Self-Signed Certificate (Development)
```bash
# In the frontend directory, set environment variable:
# macOS/Linux:
HTTPS=true npm start

# Windows Command Prompt:
set HTTPS=true&&npm start

# Windows PowerShell:
($env:HTTPS = "true") -and (npm start)
```

Then access via `https://YOUR_LAPTOP_IP:3000` (you'll need to accept the security warning).

### Option 3: Local Domain with mkcert
```bash
# Install mkcert
brew install mkcert  # macOS
# OR download from https://github.com/FiloSottile/mkcert

# Create local CA
mkcert -install

# Create certificate
mkcert localhost YOUR_LAPTOP_IP

# Use with React (requires additional configuration)
```

## Troubleshooting

### Can't Connect from Phone
- ✅ Ensure both devices are on the same Wi-Fi network
- ✅ Check firewall settings on laptop (may need to allow connections on port 5000 and 3000)
- ✅ On macOS: System Preferences → Security & Privacy → Firewall → Firewall Options → Uncheck "Block all incoming connections"
- ✅ Verify the IP address is correct
- ✅ Try accessing `http://LAPTOP_IP:5000` directly in phone browser to test backend

### Media Keys Not Working
- ✅ **macOS**: Should work out of the box
- ✅ **Windows**: Ensure no other media player is stealing focus
- ✅ **Linux**: Install `xdotool` package
- ✅ Try playing media first, then use the remote control

### Gesture Control Not Working
- ✅ iOS 13+: You must grant permission when prompted
- ✅ Some browsers may not support DeviceOrientation API
- ✅ Try using Chrome or Safari on mobile

### Voice Commands Not Working
- ✅ Voice recognition ONLY works over HTTPS
- ✅ Some browsers don't support Web Speech API (use Chrome)
- ✅ Ensure microphone permission is granted

## Technical Details

### Architecture
```
Phone (React App) → [HTTP/HTTPS over LAN] → Laptop (Flask Backend) → System Media Keys
```

### Ports Used
- **5000**: Flask backend API
- **3000**: React development server

### API Endpoints

#### `GET /`
Health check - returns server status

#### `POST /api/control`
Execute media commands
```json
{
  "command": "play_pause" | "next" | "previous" | "volume_up" | "volume_down" | "mute"
}
```

#### `POST /api/volume`
Volume control with steps
```json
{
  "action": "up" | "down" | "mute",
  "steps": 1
}
```

#### `POST /api/keyboard`
Execute keyboard shortcuts
```json
{
  "keys": ["ctrl", "c"]  // or single key: "space"
}
```

## Security Considerations

- This app is designed for **local network use only**
- Do not expose the Flask backend to the internet without proper authentication
- For production use, implement:
  - Authentication/Authorization
  - HTTPS with valid certificates
  - Rate limiting
  - Input validation

## Platform Support

| OS | Media Keys | Volume Control | Notes |
|---|---|---|---|
| macOS | ✅ | ✅ | Works out of the box |
| Windows | ✅ | ✅ | Works with pyautogui |
| Linux | ✅ | ✅ | Requires xdotool |

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---|---|---|---|---|
| Basic Controls | ✅ | ✅ | ✅ | ✅ |
| Gesture/Tilt | ✅ | ✅ | ✅ | ✅ |
| Voice Commands | ✅ | ✅ (iOS 14.5+) | ❌ | ✅ |

## Building for Production

### Frontend
```bash
cd frontend
npm run build
# Serve the 'build' folder with a static server
```

### Backend
For production, use a WSGI server like gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## License

This project is free to use and modify.

## Credits

Built with:
- React 18
- Flask 3.0
- pyautogui
- Love ❤️
