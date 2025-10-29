# 🔎 Undercover Game

A modern web adaptation of the party game **Undercover**, built as a Progressive Web App with **Next.js + TypeScript**. Play with friends on phones or desktop — private role reveals, offline support, and lightweight session persistence make it great for casual gatherings.

---

## ✨ Technologies

- **Next.js** (React + TypeScript)
- **Tailwind CSS** for styling
- **Framer Motion** for confetti animations
- **idb / IndexedDB** for local persistence (via a small `usePersistSession` hook)

---

## 🚀 Features

- 🎭 **Roles** — Civilians, Undercover, and Mr. White
- 🔤 **Word Pair System** — Civilians and Undercover receive similar words; Mr. White gets no word and can try to guess later
- 📱 **Installable** — Add to home screen, works offline after first load
- 🔀 **Smart Role Assignment** — Automatic, balanced distribution (guarantees at least one Undercover and one Mr. White)
- 🧠 **Session Persistence** — Sessions are saved to IndexedDB so the game survives refreshes and temporary disconnects
- 🧩 **Private Reveals** — Role/word modals shown privately to each player
- 🎉 **Confetti & Feedback** — Lottie-driven confetti on wins (lazy-loaded to reduce bundle size)
- ⚡ **Optimized for performance** — React Context + `useReducer`, memoized player cards, and dynamic import of heavy libs

---

## 🏗️ Component / File overview

(Located under `src/app/game/`)

- `GameProvider.tsx` — Context + reducer: central game state (`session`, `players`, `wordpool`)
- `hooks/usePersistSession.tsx` — IndexedDB persistence, debounced writes
- `components/Lobby.tsx` — Player lobby, name input, start game flow
- `components/GameBoard.tsx` — Game board, reveal flow, Mr. White guess modal
- `components/PlayerCard.tsx` — Memoized small UI for each player
- `components/Confetti.tsx` — Dynamically imports `framer-motion` and plays confetti
- `components/modals/*` — `WelcomeModal`, `RevealModal`, `GuessModal`
- `utils/checkGameEnd.ts` — Centralized game-end logic
- `public/data/wordpool.json` — Word pair list used to pick pairs

---

## 📍 Development / Running locally

### Prerequisites

- Node.js ≥ 18

### Quick start

```bash
# Clone
git clone https://github.com/your-username/undercover-game.git
cd undercover-game

# Install
npm install

# Run dev server
npm run dev
```

Open http://localhost:3000.

or you can access this link to play: https://undercover-game-pwa.vercel.app/

---

🎮 How to play

- Open the app and start a new session.
- Choose total players (this controls role distribution).
- Each player types their name and taps Add. The app assigns a role privately.
- When ready, tap Start Game. Players tap their own name to privately reveal role & word.
- Discuss, accuse, and reveal players — the engine tracks reveals and checks win conditions.
- If Mr. White is revealed, they get one guess; a correct guess ends the game in Mr. White’s favor.
- Winners: Civilians, Undercover, or Mr. White based on the rules above.

---

🧭 Design decisions & tips

- State is centralized in GameProvider so multiple components can react without prop drilling.
- usePersistSession uses idb with debounced writes to IndexedDB so you don’t overwhelm storage on rapid updates.
- Framer Motion is used to have dynamic animations with minimal impact.
- checkGameEnd contains game-winning logic so it can be unit-tested independently.

---

## 📜 License

MIT License © 2025 Henrique Fernandes
