# Chess Universe Mapper

An interactive "slippy map" application where every tile represents a unique chess position. Explore the vast universe of chess positions through an intuitive map interface.

## Overview

Chess Universe Mapper is a creative visualization project that treats chess positions as geographic locations on an interactive map. Built with modern web technologies, it provides a unique way to explore and understand chess positions by navigating through them as if they were locations on Earth.

### Key Features

- **Interactive Chess Map**: Navigate through a boundless grid of chess positions using familiar map controls (pan, zoom)
- **Procedural Position Generation**: Each tile generates deterministic chess positions based on its coordinates
- **Real-time Statistics**: View detailed statistics for each position including:
  - Number of games played from that position
  - Average ELO of players
  - Win rate percentages
- **Multiple Zoom Levels**: Explore positions at different depths of complexity (0-10 zoom levels)
- **Opening Library**: Discover common chess openings mapped to specific coordinates
- **Responsive Design**: Fully responsive interface that works on desktop and mobile devices
- **Dark Mode**: Beautiful dark theme optimized for long viewing sessions

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with shadcn/ui components
- **Map Library**: MapLibre GL JS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Form Management**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/bun
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chess-universe-mapper
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
chess-universe-mapper/
├── src/
│   ├── components/
│   │   ├── ChessMap.tsx       # Main map component with tile layer
│   │   ├── ChessBoard.tsx     # Reusable chess board visualization
│   │   ├── PositionPanel.tsx  # Panel showing position details
│   │   ├── ControlPanel.tsx   # Map controls and actions
│   │   ├── StatusPanel.tsx    # Status information
│   │   ├── TileInfo.tsx       # Tile coordinate and FEN info
│   │   └── ui/                # shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx          # Main page
│   │   └── NotFound.tsx       # 404 page
│   ├── utils/
│   │   └── chessLogic.ts      # Chess position generation logic
│   ├── hooks/                 # Custom React hooks
│   ├── App.tsx                # App entry point
│   └── main.tsx               # ReactDOM render
├── public/                    # Static assets
├── index.html                 # HTML entry point
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## How It Works

### Map Tiles as Chess Positions

The application uses a custom MapLibre tile layer where each map tile represents a chess position. The position is generated deterministically from the tile's coordinates (x, y, z):

- **Zoom Level (z)**: Determines the complexity/depth of the position (more moves = higher zoom)
- **Tile Coordinates (x, y)**: Used as a seed to generate unique positions

### Chess Position Generation

Positions are generated using:
1. **Predefined Openings**: Common openings are mapped to specific coordinates at low zoom levels
2. **Procedural Generation**: For other tiles, moves are generated using a deterministic hash of the coordinates
3. **FEN Notation**: Each position is represented as a FEN (Forsyth-Edwards Notation) string

### Statistics

Each position displays:
- **Games**: Estimated number of games played from that position
- **Average ELO**: Typical ELO range for players reaching this position
- **Win Rate**: Win percentage for the side to move

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Customization

#### Adding New Openings

Edit `src/utils/chessLogic.ts` and add entries to `OPENING_POSITIONS`:

```typescript
const OPENING_POSITIONS: { [key: string]: string[] } = {
  'z,x,y': ['e4', 'e5', 'Nf3', ...], // Your opening moves
  // Add more openings...
};
```

#### Styling

The project uses Tailwind CSS. Customize the theme in:
- `tailwind.config.ts` - Tailwind configuration
- `src/index.css` - Global styles and CSS variables

## Deployment

### GitHub Pages

This project includes a GitHub Actions workflow for automatic deployment to GitHub Pages.

1. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Source: "GitHub Actions"

2. Push to the `main` branch - the workflow will automatically build and deploy.

### Other Platforms

The built `dist` folder can be deployed to any static hosting service:
- Vercel: `vercel --prod`
- Netlify: `netlify deploy --prod`
- AWS S3 + CloudFront
- Any traditional web server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for learning and experimentation.

## Acknowledgments

- [MapLibre GL JS](https://maplibre.org) for the excellent WebGL map library
- [shadcn/ui](https://ui.shadcn.com) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
