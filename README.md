# SaathiFy - Learn. Grow. Belong.

An accessible learning platform designed to bridge educational gaps for students with disabilities, featuring real-time Indian Sign Language (ISL) translation, AI-powered tutoring, and inclusive document reading tools.

---

## Problem Statement

Over 2.68 crore Indians live with disabilities, and many face significant barriers to accessing quality education. Traditional learning platforms often fail to accommodate:

- **Deaf and Hard of Hearing students** - No real-time sign language support for live lectures
- **Visually impaired learners** - Inaccessible documents and lack of proper TTS
- **Students with learning disabilities** - Complex academic content without simplification options
- **Regional language speakers** - Limited support for Hindi and Indian languages

**SaathiFy** addresses these challenges by providing an inclusive, AI-powered learning companion that adapts to each student's unique needs.

---

## Key Features

### 1. Real-Time ISL Avatar
- **Live System Audio Capture** - Captures any audio playing on your computer (lectures, videos, meetings)
- **Speech-to-Text (ASR)** - Uses Faster-Whisper for accurate transcription
- **ISL Gloss Translation** - Converts English text to Indian Sign Language gloss
- **3D Animated Avatar** - Real-time signing with Three.js/React Three Fiber
- **Always-on-Top Popup** - Non-intrusive window that stays visible during any activity

### 2. Dost AI - Your Learning Companion
- **Voice-First Interface** - Tap to speak, get spoken responses
- **Dual Personality Modes**:
  - **Teacher Mode** - Structured, curriculum-aligned explanations
  - **Friend Mode** - Casual, encouraging conversations
- **Age-Adaptive Responses** - Content complexity adjusts based on learner age
- **Multilingual Support** - English, Hindi, and Hinglish responses
- **Powered by Gemini 2.5 Flash** - Fast, accurate AI responses

### 3. Accessible Document Library
- **PDF & PPTX Upload** - Upload course materials directly
- **AI-Powered Restructuring** - Converts documents into accessible, structured blocks
- **Text-to-Speech Reader** - Real browser speech synthesis with:
  - Play/Pause controls
  - Speed adjustment (0.75x - 2x)
  - Section navigation
  - Auto-scroll synchronization
- **Semantic Headings Navigation** - Jump to any section instantly

### 4. Voice Dictation Studio
- **Hands-Free Note Taking** - Real-time speech-to-text transcription
- **Live Audio Visualization** - Web Audio API waveform display
- **Multi-Language Support** - English and Hindi dictation
- **Export Options** - Copy to clipboard or download as .txt
- **Document Attachment** - Link notes to library documents

### 5. Accessibility-First Design
- **WCAG 2.1 AA Compliant** - High contrast, keyboard navigation, screen reader support
- **Customizable Profiles** - Font size, contrast modes, motion preferences
- **Keyboard Shortcuts** - Full keyboard navigation throughout
- **Live Announcements** - ARIA live regions for screen reader users

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool & Dev Server |
| Tailwind CSS | Styling |
| Three.js / React Three Fiber | 3D Avatar Rendering |
| Zustand | State Management |
| React Router | Navigation |
| Web Speech API | Speech Recognition & Synthesis |
| Web Audio API | Audio Visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Runtime |
| FastAPI | API Framework |
| Faster-Whisper | Speech Recognition (ASR) |
| PyPDF / python-pptx | Document Parsing |
| Google GenAI SDK | Gemini AI Integration |
| WebSockets | Real-time Communication |
| SoundCard / PyAudioWPatch | System Audio Capture |

### AI/ML
| Model | Purpose |
|-------|---------|
| Faster-Whisper (small) | Speech-to-Text |
| Gemini 2.5 Flash | Dost AI, Document Restructuring |
| Rule-based + Hybrid | ISL Gloss Translation |

---

## Project Structure

```
SaathiFy/
├── isl-live/
│   ├── backend/                    # FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/                # API Endpoints
│   │   │   │   ├── documents.py    # Document upload/convert
│   │   │   │   ├── dost.py         # Dost AI chat
│   │   │   │   ├── pipeline.py     # ISL pipeline control
│   │   │   │   └── equations.py    # Math explanations
│   │   │   ├── services/
│   │   │   │   ├── ai/             # Gemini client & key manager
│   │   │   │   ├── asr/            # Faster-Whisper ASR
│   │   │   │   ├── audio/          # System audio capture
│   │   │   │   ├── documents/      # PDF/PPTX parsing
│   │   │   │   └── translation/    # ISL gloss translation
│   │   │   ├── models/             # Pydantic models
│   │   │   ├── config.py           # Environment configuration
│   │   │   └── main.py             # FastAPI app entry
│   │   ├── data/
│   │   │   ├── signs/              # ISL vocabulary & synonyms
│   │   │   └── uploads/            # Temporary file storage
│   │   └── .env                    # API keys (not committed)
│   │
│   ├── new-frontend/               # Main React Frontend
│   │   ├── src/
│   │   │   ├── avatar/             # 3D ISL Avatar components
│   │   │   ├── components/
│   │   │   │   ├── features/       # Feature-specific components
│   │   │   │   │   ├── dost/       # Dost AI chat
│   │   │   │   │   ├── library/    # Document library
│   │   │   │   │   ├── reader/     # Document reader & TTS
│   │   │   │   │   └── dictate/    # Voice dictation
│   │   │   │   ├── layout/         # App shell & navigation
│   │   │   │   └── ui/             # Reusable UI components
│   │   │   ├── pages/app/          # Route pages
│   │   │   ├── services/           # API & WebSocket clients
│   │   │   ├── store/              # Zustand state management
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   └── types/              # TypeScript definitions
│   │   └── index.html
│   │
│   └── avatar-frontend/            # Standalone Avatar Popup
│       └── src/                    # Minimal avatar-only app
│
└── README.md                       # This file
```

---

## Installation

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **CUDA-capable GPU** (recommended for Faster-Whisper)
- **Chrome, Edge, or Brave** browser (for Web Speech API)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/saathify.git
cd saathify
```

### 2. Backend Setup
```bash
cd isl-live/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API key
echo "GEMINI_API_KEYS=your_gemini_api_key_here" > .env
```

### 3. Frontend Setup
```bash
cd isl-live/new-frontend

# Install dependencies
npm install --legacy-peer-deps

# (Optional) Avatar popup frontend
cd ../avatar-frontend
npm install --legacy-peer-deps
```

### 4. Get a Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Add it to `backend/.env`:
   ```
   GEMINI_API_KEYS=your_key_here
   ```

---

## Running the Application

### Start Backend Server
```bash
cd isl-live/backend
python -m app.main
```
Backend runs on `http://localhost:8000`

### Start Main Frontend
```bash
cd isl-live/new-frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

### Start Avatar Popup (Optional)
```bash
cd isl-live/avatar-frontend
npm run dev
```
Avatar popup runs on `http://localhost:5174`

---

## Usage Guide

### ISL Avatar (Real-Time Sign Language)
1. Go to **Home** page
2. Click **"Launch ISL Avatar"** button
3. A popup window opens with the 3D avatar
4. Play any audio on your computer (YouTube, Zoom, etc.)
5. The avatar signs the spoken content in real-time
6. Close the popup to stop the pipeline

### Dost AI (AI Tutor)
1. Go to **Dost AI** page
2. Tap the large **microphone button**
3. Speak your question clearly
4. Tap again to send (or wait for auto-send)
5. Dost responds with text and voice
6. Toggle voice responses with the speaker icon

### Document Library
1. Go to **Documents** page
2. Click **"Upload Course Material"**
3. Select a PDF or PPTX file
4. Wait for conversion to complete
5. Click on the document to open the reader
6. Use **"Read Aloud"** for text-to-speech

### Voice Dictation
1. Go to **Voice Notes** page
2. Select your language (English/Hindi)
3. Click **"Start"** to begin recording
4. Speak naturally - text appears in real-time
5. Use punctuation buttons for formatting
6. Export as .txt or copy to clipboard

---

## API Endpoints

### Pipeline Control
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pipeline/start` | POST | Start ISL translation pipeline |
| `/api/pipeline/stop` | POST | Stop the pipeline |
| `/api/status` | GET | Get system status and metrics |

### Documents
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | GET | List all documents |
| `/api/documents` | POST | Upload a document (multipart) |
| `/api/documents/{id}` | GET | Get document by ID |
| `/api/documents/{id}/convert` | POST | Convert uploaded document |

### Dost AI
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dost/chat` | POST | Send message to Dost AI |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `/ws/live` | Real-time ISL translation stream |
| `/ws/classroom/{id}` | Live classroom collaboration |

---

## Configuration

Environment variables in `backend/.env`:

```env
# Gemini AI (required for Dost AI and document restructuring)
GEMINI_API_KEYS=key1,key2,key3

# Server
WEBSOCKET_PORT=8000
LOG_LEVEL=INFO

# ASR (Speech Recognition)
ASR_MODEL=small
ASR_DEVICE=auto
ASR_COMPUTE_TYPE=auto

# Audio Capture
AUDIO_SAMPLE_RATE=16000
AUDIO_CHUNK_SECONDS=3.0
AUDIO_BACKEND=soundcard
```

---

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Web Speech API (STT) | Yes | Yes | No | No |
| Speech Synthesis (TTS) | Yes | Yes | Yes | Yes |
| WebGL (3D Avatar) | Yes | Yes | Yes | Yes |
| Web Audio API | Yes | Yes | Yes | Yes |

**Recommendation:** Use **Chrome** or **Edge** for full functionality.

---

## Accessibility Features

- **Keyboard Navigation** - All features accessible via keyboard
- **Screen Reader Support** - ARIA labels and live regions
- **High Contrast Mode** - Enhanced visibility option
- **Reduced Motion** - Respects `prefers-reduced-motion`
- **Focus Indicators** - Visible focus states throughout
- **Skip Links** - Jump to main content
- **Semantic HTML** - Proper heading hierarchy
- **Text Scaling** - Supports browser zoom up to 200%

---

## Known Limitations

1. **Speech Recognition** - Only works in Chromium browsers
2. **System Audio Capture** - Windows only (WASAPI loopback)
3. **ISL Vocabulary** - Limited to common academic terms
4. **OCR for Handwritten Notes** - Not yet implemented
5. **Offline Mode** - Requires internet for AI features

---

## Future Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline ISL dictionary
- [ ] Regional language ASR (Hindi, Tamil, etc.)
- [ ] Collaborative classrooms with ISL
- [ ] Integration with LMS platforms (Moodle, Canvas)
- [ ] Browser extension for any website
- [ ] ISL avatar customization

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Team

Built with love for the **Craft n Code Hackathon** by Team SaathiFy.

| Name | GitHub | LinkedIn |
|------|--------|----------|
| Harshvardhan Khaitan | [HarshvardhanKh](https://github.com/HarshvardhanKh) | [harshvardhankh](https://www.linkedin.com/in/harshvardhankh/) |
| Piyush Agarwal | [Piyush5525](https://github.com/Piyush5525) | [piyush-agarwal-97b731316](https://www.linkedin.com/in/piyush-agarwal-97b731316/) |
| Disha Chopra | [DISHA7-debug](https://github.com/DISHA7-debug) | [disha-chopra-116244339](https://www.linkedin.com/in/disha-chopra-116244339/) |


---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Faster-Whisper](https://github.com/guillaumekln/faster-whisper) for speech recognition
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for 3D rendering
- The deaf and disability communities for guidance on accessibility

---

<p align="center">
  <strong>SaathiFy</strong> - Making education accessible for everyone.
</p>
