# Camera Chess

A real-time chess game recording and analysis application that uses computer vision to detect and track chess moves from camera input. Built with React, TypeScript, and Redux Toolkit.

## 🎯 Overview

Camera Chess is an innovative application that allows chess players to:
- Record their over-the-board games using a camera
- Upload videos of chess games for analysis
- Analyze games with AI-powered move detection
- Track board position with adjustable corner markers
- View game analysis and move history

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3.1** - Modern React with hooks and functional components
- **TypeScript 5.5.3** - Type-safe JavaScript development
- **Vite 5.4.2** - Fast build tool and dev server

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Lucide React 0.344.0** - Beautiful SVG icons
- **PostCSS 8.4.35** & **Autoprefixer 10.4.18** - CSS processing

### State Management
- **Redux Toolkit 2.9.0** - Modern Redux with simplified syntax
- **React Redux 9.2.0** - React bindings for Redux

### Routing
- **React Router DOM 7.9.4** - Client-side routing

### Chess Logic
- **Chess.js 1.4.0** - Chess game logic and validation

### Database (Configured but not used)
- **Supabase 2.57.4** - Backend as a service (ready for future features)

### Development Tools
- **ESLint 9.9.1** - Code linting and quality
- **TypeScript ESLint 8.3.0** - TypeScript-specific linting rules

## 📁 Project Structure

```
project/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ChessBoard.tsx   # Chess board visualization
│   │   ├── CornerMarker.tsx # Draggable corner markers for calibration
│   │   ├── Sidebar.tsx      # Game information sidebar
│   │   └── VideoCanvas.tsx  # Camera feed and overlay canvas
│   ├── pages/              # Main application pages
│   │   ├── Analyze.tsx     # Game analysis page
│   │   ├── FAQ.tsx         # Frequently asked questions
│   │   ├── Home.tsx        # Landing page with navigation
│   │   ├── Record.tsx      # Live recording interface
│   │   └── Upload.tsx      # Video upload interface
│   ├── store/              # Redux state management
│   │   ├── cornersSlice.ts # Corner marker positions
│   │   ├── gameSlice.ts    # Chess game state (FEN, PGN)
│   │   ├── hooks.ts        # Typed Redux hooks
│   │   ├── store.ts        # Store configuration
│   │   └── uiSlice.ts      # UI state management
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx           # Application entry point
│   ├── index.css          # Global styles and Tailwind imports
│   └── vite-env.d.ts      # Vite type definitions
├── public/                 # Static assets
├── .env                   # Environment variables (empty)
├── .gitignore            # Git ignore rules
├── eslint.config.js      # ESLint configuration
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.app.json     # App-specific TypeScript config
├── tsconfig.node.json    # Node-specific TypeScript config
└── vite.config.ts        # Vite configuration
```

## 🎮 Features

### 🏠 Home Page
- Welcome screen with navigation to all major features
- Clean, modern UI with gradient backgrounds
- Quick access buttons to record, upload, analyze, and FAQ

### 📹 Record Game
- Real-time camera feed interface
- Adjustable corner markers for board calibration
- Responsive design with mobile orientation warnings
- Overlay system for tracking board boundaries

### 📤 Upload Video
- Video file upload for offline analysis
- Support for recorded game videos

### 📊 Analyze Game
- Game analysis and review interface
- Move-by-move breakdown (planned feature)

### ❓ FAQ
- Help and documentation
- Usage instructions and troubleshooting

### 🎯 Components

#### ChessBoard
- Renders chess positions from FEN notation
- Unicode chess piece symbols
- Responsive sizing
- Light/dark square highlighting

#### CornerMarker
- Draggable markers for board calibration
- Visual feedback for positioning
- Stores positions in Redux state

#### VideoCanvas
- Camera feed display area
- Overlay canvas for board detection
- Corner marker integration

#### Sidebar
- Game information display
- Move history and analysis
- Player information

## 🔄 State Management

The application uses Redux Toolkit with three main slices:

### gameSlice
- **fen**: Current board position in FEN notation
- **pgn**: Game moves in PGN format
- Actions: `setGameState`, `resetGame`

### cornersSlice
- **positions**: Four corner markers (a1, h1, a8, h8) with x,y coordinates
- Actions: `updateCornerPosition`, `resetCorners`

### uiSlice
- UI state management (expandable for future features)

## 🎨 Design System

### Color Scheme
- **Primary**: Slate tones (900, 800, 700, 600)
- **Accents**: 
  - Blue (400) for recording features
  - Green (400) for upload features
  - Purple (400) for analysis features
  - Yellow (400) for help features

### Typography
- Modern, clean fonts
- Consistent sizing hierarchy
- Good contrast for accessibility

### Components
- Rounded corners and soft shadows
- Hover effects and transitions
- Responsive grid layouts
- Mobile-first design approach

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Modern web browser with camera support

### Installation & Running

See the [How to Run](#how-to-run) section below for detailed terminal instructions.

## 🔮 Future Enhancements

The project structure is designed to support:
- AI-powered move detection
- Supabase integration for game storage
- Real-time multiplayer features
- Advanced game analysis
- Mobile app development
- Integration with chess engines

## 📝 Development Notes

- Built with modern React patterns (hooks, functional components)
- TypeScript for type safety and better developer experience
- Responsive design with mobile considerations
- Modular component architecture
- Scalable state management with Redux Toolkit
- Fast development server with Vite
- Code quality with ESLint and TypeScript

---

*This project represents a foundation for advanced chess game recording and analysis, with room for expansion into AI-powered features and real-time game processing.*