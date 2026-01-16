# Poxil - Pixel Art and Animation Creator

A modern web-based tool for creating retro-style pixel art and frame-by-frame animations with real-time collaboration.

## Features

- Interactive canvas editor with customizable grid
- Complete toolset: pencil, eraser, color picker, bucket fill
- Frame-by-frame animation with timeline
- Onion skinning for smooth animations
- Undo/redo functionality
- Export as GIF or PNG sprite sheets
- Real-time collaboration on shared canvases
- Secure user authentication
- Cloud-based project management
- Responsive design

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, Socket.io-client
- **Backend**: Node.js + TypeScript, Express.js, Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better-auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Poxil
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Configure database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. Start development servers:
```bash
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

## Project Structure

```
Poxil/
├── frontend/          # React + Vite application
├── backend/           # Express.js API server
├── package.json       # Root workspace configuration
└── README.md
```

## License

MIT License - see LICENSE file for details

## Author

Dibyendu Sahoo
