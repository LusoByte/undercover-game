# 🔎 Undercover Game (PWA)

A modern web adaptation of the popular party game **“Undercover”** built with **Next.js** (PWA).  
Play with friends on your phone or browser — no downloads required.

---

## ✨ Features

- 🎭 **Roles**: Civilians, Undercover, and Mr. White
- 🗣️ **Word Pair System**: Civilians and Undercover get similar words, while Mr. White guesses without a word
- 📱 **Cross-Platform PWA**: Add to home screen & play like a native app
- 🔀 **Smart Role Assignment**: Guarantees exactly one Undercover & one Mr. White per session
- 🏆 **Win Conditions**:
  - Civilians win if Undercover is found
  - Undercover wins if all Civilians are out
  - Mr. White wins if Civilians + Undercover are eliminated

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript)
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Database**: IndexedDB (local persistence)

---

## 🏃 Getting Started (Local)

### Prerequisites

- Node.js ≥ 18

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/undercover-game.git
cd undercover-game
```

```bash
npm install
npm run dev
```

- Visit http://localhost:3000

---

## 📱 PWA Support

- Works offline after first load
- Installable on iOS & Android
- Fullscreen experience with custom icon

---

## 🎮 How to Play

- Open the app and start a new session
- Each player joins with their name
- Tap your name to reveal your role & word (private modal)
- Discuss, accuse, and vote players out
- The game engine tracks roles and determines the winner 🎉

---

## 📜 License

MIT License © 2025 Henrique Fernandes
