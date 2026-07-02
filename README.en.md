# Rubik Cube Solver & Trainer (2x2 / 3x3)

[中文說明](README.md) | [Live Demo](https://kavwang.github.io/RubiKCube/)

<!-- TODO: Add Demo Screenshot or GIF -->
<!-- ![Demo Screenshot](docs/demo-screenshot.png) -->

A client-side Rubik's Cube teaching and solving tool that runs entirely in the browser. Key features include:

- 2x2 & 3x3 **LBL (Layer-by-Layer) method tutorials** with step-by-step interactive animations.
- 2x2 **Optimal Solver** (Bidirectional BFS, God's Number ≤ 11 moves) with step-by-step animations.
- 3x3 **Kociemba's Two-Phase Solver** (Self-developed pure JS solver, averaging ~21 moves) with step-by-step animations.
- 3D interactive view (supports drag-to-rotate, auto-locks camera during editing and playing to avoid accidental rotation).
- Facelet color painting, scramble formula input, and random scrambler.
- **Apple-styled** Light / Dark mode auto-switching.
- Multi-language support (i18n).

The core philosophy of this project is to help users not just "get the answer", but "learn how to restore it step by step". Users can also switch to the fastest solver mode to inspect more efficient solution paths.

---

## Technical Architecture

The project has been fully upgraded to a modern frontend stack:

| Technology | Purpose |
|---|---|
| **Vite** | Fast module bundler and development server |
| **TailwindCSS v4** | Style framework, customized with Apple-styled Light / Dark themes |
| **Three.js** v0.185.0 | 3D rendering and rotation animations |
| **Custom Kociemba Solver** | 3x3 Kociemba's Two-Phase algorithm (pure JavaScript implementation from scratch) |
| **Web Workers** | Performs solve computations in a background thread to prevent UI freezing |
| **Node.js `node:test`** | Native test runner, zero third-party testing dependencies (no Jest/Mocha required) |
| **GitHub Actions** | CI for auto testing + CD for auto building and deploying to GitHub Pages |

---

## Features Overview

### Home (Mode Selection)
- Select between `2x2` and `3x3` solvers.
- Features an auto-rotating 3D preview of the cube.

### 2x2 Solver
- Paint sticker colors manually.
- Generate valid random scrambles.
- Step-by-step guide with auto-play controls.
- LBL Layer-by-Layer method vs. Bidirectional BFS Optimal Solver (finds shortest paths under 11 moves instantly).
- **Invalid Corner Detection & Visual Indicator**: If input colors result in an invalid corner orientation sum (indicating a corner twist), the system detects candidate twisted corners and flashes them with an orange pulse on the 3D canvas.

### 3x3 Solver
- Unified UI/UX styling with the 2x2 solver.
- Input and apply scramble formulas.
- **LBL Tutorial Solver**:
  1. Bottom Cross
  2. Bottom Corners (F2L prep)
  3. Middle Layer Edges
  4. Last Layer Orientation (OLL) & Permutation (PLL) (broken down by steps)
- **Kociemba's Two-Phase Solver**:
  - Uses a self-developed Kociemba 2-phase algorithm to search for near-optimal paths.
  - Solves any scrambled state in ~21 moves on average.
  - Significantly fewer moves than the LBL method.
- Interactive playback controls: step forward/backward, jump to start/end, auto-play.

---

## Project Structure

```text
RubiKCube/
├─ index.html                        # Homepage
├─ two-by-two.html                   # 2x2 Page
├─ three-by-three.html               # 3x3 Page
├─ home-page.js                      # Homepage Entry point
├─ two-by-two.js                     # 2x2 Entry point
├─ three-by-three.js                 # 3x3 Entry point
├─ vite.config.js                    # Vite configuration
├─ package.json                      # NPM script & dependencies definitions
├─ LICENSE                           # Apache License 2.0
│
├─ .github/workflows/
│  └─ ci-deploy.yml                  # GitHub Actions CI/CD (Test & Deploy)
│
├─ src/
│  ├─ i18n/                          # Multi-language locales
│  ├─ shared/                        # Shared UI components and hooks
│  ├─ styles/                        # TailwindCSS global styles & themes
│  ├─ two-by-two/                    # 2x2 modules (Clean Architecture)
│  │  ├─ application/                #   Controller, solver Web Worker
│  │  ├─ domain/                     #   LBL/Optimal solvers, state management
│  │  └─ infrastructure/             #   Three.js 3D rendering
│  │
│  └─ three-by-three/                # 3x3 modules (Clean Architecture)
│     ├─ application/                #   Controller, solver Web Worker
│     ├─ domain/                     #   LBL solver, state management
│     │  └─ two-phase/               #   Custom Kociemba solver
│     │     ├─ cubie-cube.js         #     Cubie representation & moves
│     │     ├─ coordinates.js        #     Coordinate encoding/decoding
│     │     ├─ move-tables.js        #     Precomputed move transition tables
│     │     ├─ pruning-tables.js     #     BFS pruning heuristic tables
│     │     ├─ solver.js             #     IDA* search main solver loop
│     │     └─ facelet-parser.js     #     54-facelet map parser
│     └─ infrastructure/             #   Three.js 3D rendering & animations
│
└─ tests/
   ├─ unit/                          # Unit tests (Cube Engine, Two-Phase coordinates)
   └─ smoke/                         # Smoke tests (solvability & verification)
```

---

## Architecture Design (Clean Architecture)

Both 2x2 and 3x3 modules adhere to a unified three-tier clean architecture:

### Application Layer
- Role: Coordinates UI components, event handlers, state transitions, and playback control.
- Decoupled from algorithm details (delegated via Domain APIs).
- Offloads solver computations to a Web Worker to avoid freezing the main UI thread.

### Domain Layer
- Role: Core business rules, rules of rotation, and solvers.
- Pure computational models, independent of DOM or rendering frameworks.
- Easily covered by unit tests.

### Infrastructure Layer
- Role: 3D rendering, animations, cameras, and user drag controls (Three.js).

This layout allows algorithms and rendering details to be updated independently, lowering maintenance costs.

---

## Development & Getting Started

Ensure you have [Node.js](https://nodejs.org/) installed (v20+ LTS recommended).

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production (output to dist/ folder)
npm run build
```

After starting `npm run dev`, open the URL printed in the terminal (usually `http://localhost:5173/`).

---

## Testing

The project uses Node.js native test runner (`node:test`).

### Run Commands

```bash
npm run test          # Run all tests
npm run test:unit     # Run unit tests only
npm run test:smoke    # Run smoke tests only
```

### Test Coverage

#### Unit Tests
- Scramble formula parsing correctness.
- Rejection of invalid move notations.
- Clockwise & counterclockwise move cancellations.
- **Two-Phase cubie properties** (rotation transitions, move cancellations).
- **Two-Phase coordinate maps** (get/set consistency for Twist, Flip, UDSlice, CornerPerm, EdgePerm, UDSlicePerm).

#### Smoke Tests
- Runs 50 random scrambles through both LBL and Kociemba solvers (for 3x3) and LBL/Optimal solvers (for 2x2).
- Verifies that all solutions successfully restore the solved state.
- Asserts that Kociemba/Optimal average move lengths are statistically shorter than LBL.
- Validates phase boundaries and move length consistency.

---

## CI / CD

The repository is integrated with GitHub Actions (`.github/workflows/ci-deploy.yml`):

- **CI**: Triggers `npm test` on every push/PR to the `main` branch.
- **CD**: Triggers Vite build (`npm run build`) and deploys output to GitHub Pages on every push to `main` when tests pass.

---

## Browser Support

Supports modern browsers with ES Modules and Web Workers support:

| Browser | Min Version |
|---|---|
| Chrome | 89+ |
| Edge | 89+ |
| Firefox | 108+ |
| Safari | 16.4+ |

---

## Maintenance Principles

1. `application` layer should not touch Three.js low-level rendering.
2. `infrastructure` layer should not implement solver algorithms.
3. `domain` layer must not access the DOM.
4. Always add unit/smoke tests before merging new algorithms.

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).
