# Live Video Streaming with MediaSoup SFU

A real-time video streaming application built using MediaSoup (Selective Forwarding Unit), WebSocket, Express, and React. This project demonstrates a scalable video conferencing solution that efficiently handles multiple participants. The SFU architecture ensures optimal bandwidth usage by selectively forwarding media streams to participants, making it ideal for multi-participant video conferences.

## Features

-   Real-time video streaming with low latency (typically < 100ms)
-   Selective Forwarding Unit (SFU) architecture using MediaSoup
    -   Efficient bandwidth management
    -   Scalable to hundreds of participants
    -   Reduced server load compared to MCU architecture
-   WebRTC-based peer connections
    -   Direct browser-to-browser communication
    -   Built-in NAT traversal
    -   Adaptive bitrate streaming
-   Room-based video conferencing
    -   Multiple concurrent rooms support
    -   Dynamic room creation and management
-   Support for multiple participants
    -   Each participant can send/receive multiple streams
    -   Independent quality control per participant
-   Efficient bandwidth usage through selective forwarding
    -   Only necessary streams are forwarded to each participant
    -   Automatic quality adaptation based on network conditions

## Tech Stack

### Server

-   Node.js with TypeScript
    -   Type-safe backend development
    -   Enhanced code maintainability
-   Express.js
    -   RESTful API endpoints
    -   WebSocket server integration
-   MediaSoup
    -   SFU implementation
    -   WebRTC transport management
    -   Room and router management
-   WebSocket (ws)
    -   Real-time bidirectional communication
    -   Signaling server for WebRTC
-   TypeScript
    -   Static type checking
    -   Better IDE support
    -   Enhanced code quality

### Client

-   React with TypeScript
    -   Component-based architecture
    -   Type-safe frontend development
-   Vite
    -   Fast development server
    -   Optimized build process
-   MediaSoup Client
    -   WebRTC client implementation
    -   Transport and device management
-   WebRTC
    -   Native browser APIs
    -   Media stream handling
    -   Peer connection management

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/               # Source code
│   │   ├── App.tsx        # Main application component
│   │   ├── useApp.ts      # Custom hook for MediaSoup logic
│   │   └── components/    # Reusable UI components
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
└── server/                # Express backend
    ├── src/              # Source code
    │   ├── MediaSoup/    # MediaSoup implementation
    │   │   ├── index.ts  # Main MediaSoup class
    │   │   └── types.ts  # TypeScript interfaces
    │   ├── sockets/      # WebSocket handlers
    │   │   ├── index.ts  # Socket connection management
    │   │   └── events/   # Socket event handlers
    │   └── config/       # Configuration files
    └── package.json      # Backend dependencies
```

## Getting Started

### Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn
-   Modern web browser with WebRTC support
-   Basic understanding of WebRTC and MediaSoup concepts

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Live-video-streaming
```

2. Install server dependencies:

```bash
cd server
npm install
```

3. Install client dependencies:

```bash
cd ../client
npm install
```

### Running the Application

1. Start the server:

```bash
cd server
npm start
```

The server will start on port 3000 by default.

2. Start the client:

```bash
cd client
npm run dev
```

The development server will start on port 5173.

3. Open your browser and navigate to `http://localhost:5173`

## How It Works

### Server-Side Flow

1. The server initializes a MediaSoup worker and creates a router for each room
    - Worker handles WebRTC operations
    - Router manages media streams and participants
2. When a client connects:
    - A WebRTC transport is created with specific ports (40000-49999)
    - Transport configuration is sent to the client
    - Room management and participant tracking begin

### Client-Side Flow

1. Client initialization:
    - Creates a MediaSoup device
    - Sets up local media streams (camera/microphone)
2. Connection process:
    - Establishes WebSocket connection for signaling
    - Creates and connects WebRTC transport
    - Produces local media streams
    - Consumes remote media streams

### Media Flow

1. Local participant:
    - Captures media from device
    - Sends to server via WebRTC transport
2. Remote participants:
    - Receive media through SFU
    - Display in video elements
3. Quality adaptation:
    - Automatic bitrate adjustment
    - Network condition monitoring
    - Stream quality optimization

## MediaSoup Configuration

The server is configured with the following codecs:

### Audio Configuration

-   Codec: Opus
-   Sample Rate: 48kHz
-   Channels: 2 (stereo)
-   Bitrate: Adaptive

### Video Configuration

-   Codec: VP8
-   Frame Rate: Adaptive
-   Resolution: Dynamic
-   Bitrate: Adaptive

## Development

### TypeScript Configuration

-   Strict type checking enabled
-   Modern ECMAScript features
-   Path aliases for clean imports

### Code Quality

-   ESLint for code style enforcement
-   Prettier for consistent formatting
-   TypeScript for type safety

### Build Process

-   Vite for fast development
-   Optimized production builds
-   Hot Module Replacement (HMR)

## Performance Considerations

-   SFU architecture scales better than MCU for many participants
-   WebRTC's built-in congestion control
-   Adaptive bitrate streaming
-   Efficient media forwarding
-   Room-based isolation for better resource management

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
