"use client";

import React, { useEffect, useState, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";
import { openDB } from "idb";
import type {
  WordPair,
  GameSession,
  PlayerWithRole,
} from "../types/index";

const DB_NAME = "undercover-db";
const STORE = "sessions";
const SESSION_KEY = "current_session_v1";

// IndexedDB helpers
async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db: any) {
      db.createObjectStore(STORE);
    },
  });
}

async function saveSession(session: GameSession) {
  const db = await getDB();
  await db.put(STORE, session, SESSION_KEY);
}

async function loadSession() {
  const db = await getDB();
  return await db.get(STORE, SESSION_KEY);
}

async function clearSession() {
  const db = await getDB();
  await db.delete(STORE, SESSION_KEY);
}

function titleCaseRole(r: string | null | undefined) {
  if (!r) return "";
  if (r.toLowerCase() === "mrwhite") return "Mr. White";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

export default function Game() {
  const [wordpool, setWordpool] = useState<WordPair[]>([]);
  const [pair, setPair] = useState<WordPair | null>(null);
  const [players, setPlayers] = useState<PlayerWithRole[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [session, setSession] = useState<GameSession | null>(null);

  // Welcome modal state
  const [welcomeModal, setWelcomeModal] = useState<{
    open: boolean;
    playerCount: number | null;
  }>({ open: true, playerCount: null });

  // modal for private reveal when adding a player
  const [revealModal, setRevealModal] = useState<{
    open: boolean;
    player: PlayerWithRole | null;
  }>({ open: false, player: null });

  // modal for Mr. White to guess after being revealed in-game
  const [guessModal, setGuessModal] = useState<{
    open: boolean;
    player: PlayerWithRole | null;
    guess: string;
    feedback?: string;
  }>({ open: false, player: null, guess: "", feedback: undefined });

  const lottieRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const pendingConfettiRef = useRef(false);

  // Calculate required roles based on player count
  function calculateRequiredRoles(playerCount: number): {
    civilian: number;
    undercover: number;
    mrwhite: number;
  } {
    // Always need at least 1 undercover and 1 mrwhite
    let undercover = 1;
    let mrwhite = 1;

    // For larger groups, add more undercover players
    if (playerCount >= 8) {
      undercover = 2;
    }
    if (playerCount >= 12) {
      undercover = 3;
    }

    // The rest are civilians
    const civilian = playerCount - undercover - mrwhite;

    return { civilian, undercover, mrwhite };
  }

  // Handle player count selection from welcome modal
  function handlePlayerCountSelection(count: number) {
    setWelcomeModal({ open: false, playerCount: count });
  }

  // Load wordpool & restore session on client only
  useEffect(() => {
    let mounted = true;

    fetch("../data/wordpool.json")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setWordpool(data);
      })
      .catch((e) => console.warn("Could not load wordpool:", e));

    loadSession().then((s) => {
      if (!mounted) return;
      if (s) {
        setSession(s);
        setPlayers((s.players || []) as PlayerWithRole[]);
        if ((s as any).pair) setPair((s as any).pair);
        // If session exists, close welcome modal
        setWelcomeModal({ open: false, playerCount: null });
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Lottie confetti setup
  useEffect(() => {
    if (lottieRef.current) {
      try {
        animRef.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path: "/lottie/confetti.json",
        });

        console.log("🎉 Lottie confetti animation loaded successfully!");

        // If a confetti play was requested before the animation was ready, play now
        if (pendingConfettiRef.current) {
          try {
            animRef.current?.goToAndPlay(0, true);
          } catch (e) {
            console.warn("Confetti animation error:", e);
          }
          pendingConfettiRef.current = false;
        }
      } catch (error) {
        console.error("Failed to load lottie confetti animation:", error);
      }

      return () => {
        if (animRef.current) {
          animRef.current.destroy();
          animRef.current = null;
        }
      };
    }
  }, []);

  // Helper to create CSS confetti as fallback
  function createCSSConfetti(intensity: "full" | "small" = "full") {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
    ];
    const confettiCount = intensity === "full" ? 100 : 20;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti-piece";

      // Distribute confetti across the entire screen width
      confetti.style.left = Math.random() * window.innerWidth + "px";
      confetti.style.top = "-20px"; // Start above the viewport

      // Randomize animation properties
      confetti.style.animationDelay = Math.random() * 1 + "s";
      confetti.style.animationDuration = Math.random() * 2 + 2 + "s";

      // Randomize confetti properties
      confetti.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = Math.random() * 8 + 4 + "px";
      confetti.style.height = Math.random() * 8 + 4 + "px";

      // Add some rotation variation
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

      document.body.appendChild(confetti);

      // Remove confetti after animation completes
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 6000);
    }
  }

  // Persist session whenever it changes
  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  function pickPairIfNeeded() {
    if (pair) return pair;
    if (wordpool.length === 0) return null;
    const p = wordpool[Math.floor(Math.random() * wordpool.length)];
    setPair(p);
    setSession((s) => ({ ...(s || {}), pair: p } as GameSession));
    return p;
  }

  function addPlayer() {
    if (!nameInput.trim()) return;
    if (wordpool.length === 0) return;
    if (!welcomeModal.playerCount) return; // Must have selected player count first

    const chosenPair = pickPairIfNeeded();
    if (!chosenPair) return;

    // Calculate required roles based on selected player count
    const requiredRoles = calculateRequiredRoles(welcomeModal.playerCount);

    // Count current roles
    const currentRoles = {
      civilian: players.filter((p) => p.role === "civilian").length,
      undercover: players.filter((p) => p.role === "undercover").length,
      mrwhite: players.filter((p) => p.role === "mrwhite").length,
    };

    // Determine what role this player should get - randomly choose from available roles
    const availableRoles: Array<"civilian" | "undercover" | "mrwhite"> = [];

    if (currentRoles.mrwhite < requiredRoles.mrwhite) {
      availableRoles.push("mrwhite");
    }
    if (currentRoles.undercover < requiredRoles.undercover) {
      availableRoles.push("undercover");
    }
    if (currentRoles.civilian < requiredRoles.civilian) {
      availableRoles.push("civilian");
    }

    // Randomly select from available roles
    const randomIndex = Math.floor(Math.random() * availableRoles.length);
    const role = availableRoles[randomIndex];

    // Assign word based on role
    const word =
      role === "undercover"
        ? chosenPair.undercover
        : role === "civilian"
        ? chosenPair.civilian
        : null;

    const newPlayer: PlayerWithRole = {
      id: Math.random(),
      name: nameInput.trim(),
      revealed: false,
      role: role as "civilian" | "undercover" | "mrwhite",
      word,
    };

    const finalPlayers = [...players, newPlayer];
    setPlayers(finalPlayers);

    // Show modal with correct role
    setRevealModal({ open: true, player: newPlayer });

    // Update session
    const nextSession: GameSession = {
      ...(session || {}),
      pair: chosenPair,
      players: finalPlayers,
      revealedCount: finalPlayers.filter((p) => p.revealed).length,
    };
    setSession(nextSession);
    saveSession(nextSession);

    setNameInput("");
  }

  function startGame() {
    if (players.length < 4) {
      alert("Needed at least 4 players");
      return;
    }
    if (!pair && wordpool.length === 0) {
      alert("Wordpool not loaded");
      return;
    }
    if (!welcomeModal.playerCount) {
      alert("Please select player count first");
      return;
    }

    const chosenPair = pair || pickPairIfNeeded()!;

    // Use calculated roles based on selected player count
    const requiredRoles = calculateRequiredRoles(welcomeModal.playerCount);

    // Check if players already have the correct role distribution
    const currentRoles = {
      civilian: players.filter((p) => p.role === "civilian").length,
      undercover: players.filter((p) => p.role === "undercover").length,
      mrwhite: players.filter((p) => p.role === "mrwhite").length,
    };

    // If roles are already correctly distributed, just start the game
    if (
      currentRoles.civilian === requiredRoles.civilian &&
      currentRoles.undercover === requiredRoles.undercover &&
      currentRoles.mrwhite === requiredRoles.mrwhite
    ) {
      const newSession: GameSession = {
        startedAt: new Date().toISOString(),
        pair: chosenPair,
        players: players,
        revealedCount: 0,
      } as GameSession;

      setSession(newSession);
      saveSession(newSession);
      return;
    }

    // If roles are not correctly distributed, reassign them
    const assigned = [...players];

    // Reset all roles first
    assigned.forEach((p) => {
      p.role = "civilian";
      p.word = chosenPair.civilian;
    });

    // Create arrays of indices for random role assignment
    const playerIndices = Array.from({ length: assigned.length }, (_, i) => i);

    // Randomly assign undercover roles
    let undercoverCount = 0;
    const shuffledIndices = [...playerIndices].sort(() => Math.random() - 0.5);

    for (
      let i = 0;
      i < shuffledIndices.length && undercoverCount < requiredRoles.undercover;
      i++
    ) {
      const playerIndex = shuffledIndices[i];
      if (assigned[playerIndex].role === "civilian") {
        assigned[playerIndex].role = "undercover";
        assigned[playerIndex].word = chosenPair.undercover;
        undercoverCount++;
      }
    }

    // Randomly assign mrwhite roles from remaining civilians
    let mrwhiteCount = 0;
    const remainingIndices = shuffledIndices.filter(
      (i) => assigned[i].role === "civilian"
    );

    for (
      let i = 0;
      i < remainingIndices.length && mrwhiteCount < requiredRoles.mrwhite;
      i++
    ) {
      const playerIndex = remainingIndices[i];
      assigned[playerIndex].role = "mrwhite";
      assigned[playerIndex].word = null;
      mrwhiteCount++;
    }

    const newSession: GameSession = {
      startedAt: new Date().toISOString(),
      pair: chosenPair,
      players: assigned,
      revealedCount: assigned.filter((p) => p.revealed).length,
    } as GameSession;

    setPlayers(assigned);
    setSession(newSession);
    saveSession(newSession);
  }

  function checkGameEnd(
    players: PlayerWithRole[],
    pair: WordPair | null
  ): "civilian" | "undercover" | "mrwhite" | null {
    if (!pair) return null;

    const undercoverAlive = players.some(
      (p) => p.role === "undercover" && !p.revealed
    );
    const civilianAlive = players.some(
      (p) => p.role === "civilian" && !p.revealed
    );

    const mrwhiteAlive = players.some(
      (p) => p.role === "mrwhite" && !p.revealed
    );

    if (!civilianAlive && !undercoverAlive && mrwhiteAlive) return "mrwhite";

    if (
      (undercoverAlive || (undercoverAlive && mrwhiteAlive)) &&
      !civilianAlive
    )
      return "undercover";

    if (!undercoverAlive && !mrwhiteAlive && civilianAlive) return "civilian";

    return null;
  }

  function reveal(index: number) {
    if (!session) return;

    const playersUpdated = session.players.map((p, i) =>
      i === index ? { ...p, revealed: true } : p
    );
    const revealedCount = playersUpdated.filter((p) => p.revealed).length;
    let winner: GameSession["winner"] = session.winner;

    const revealedPlayer = playersUpdated[index];

    // If Mr. White revealed, open guess modal immediately
    if (revealedPlayer.role === "mrwhite") {
      setGuessModal({
        open: true,
        player: revealedPlayer,
        guess: "",
        feedback: undefined,
      });
    }

    // Determine winner based on current reveals (except Mr. White)
    if (revealedPlayer.role !== "mrwhite") {
      const g = checkGameEnd(playersUpdated, pair!);
      if (g) winner = g;
    }

    const next: GameSession = {
      ...session,
      players: playersUpdated,
      revealedCount,
      winner,
    } as GameSession;
    setSession(next);
    saveSession(next);

    // Play confetti when the game is won
    if (winner) {
      setTimeout(() => {
        createCSSConfetti("full");
      }, 100);
    }
  }

  function submitMrWhiteGuess() {
    if (!guessModal.player || !pair || !session) return;
    const guess = guessModal.guess.trim().toLowerCase();
    const civilian = pair.civilian.trim().toLowerCase();

    if (guess === civilian) {
      // Mr. White guessed correctly → Mr. White wins immediately
      const playersRevealed = session.players.map((p) => ({
        ...p,
        revealed: true,
      }));
      const next: GameSession = {
        ...session,
        players: playersRevealed,
        revealedCount: playersRevealed.length,
        winner: "mrwhite",
        endedAt: new Date().toISOString(),
      } as GameSession;
      setSession(next);
      saveSession(next);

      setGuessModal({
        open: false,
        player: null,
        guess: "",
        feedback: undefined,
      });
      return;
    }

    // Incorrect guess → close modal, game continues
    setGuessModal((g) => ({
      ...g,
      feedback: "Incorrect guess — game continues.",
    }));

    // Optionally check if Mr. White is now effectively eliminated
    const playersUpdated = session.players.map((p) =>
      p.id === guessModal.player!.id ? { ...p, revealed: true } : p
    );
    const winnerAfterGuess = checkGameEnd(playersUpdated, pair!);
    if (winnerAfterGuess) {
      const next: GameSession = {
        ...session,
        players: playersUpdated,
        revealedCount: playersUpdated.length,
        winner: winnerAfterGuess,
      };
      setSession(next);
      saveSession(next);
    }
  }

  function closeGuessModal() {
    setGuessModal({
      open: false,
      player: null,
      guess: "",
      feedback: undefined,
    });
  }

  function closeMrWhiteModal() {
    if (!guessModal.player || !pair || !session) return;

    setGuessModal({
      open: false,
      player: null,
      guess: "",
      feedback: undefined,
    });

    const playersUpdated = session.players.map((p) =>
      p.id === guessModal.player!.id ? { ...p, revealed: true } : p
    );
    const winnerAfterGuess = checkGameEnd(playersUpdated, pair!);
    console.log("winnerAfterGuess: ", winnerAfterGuess);
    if (winnerAfterGuess) {
      const next: GameSession = {
        ...session,
        players: playersUpdated,
        revealedCount: playersUpdated.length,
        winner: winnerAfterGuess,
      };
      setSession(next);
      saveSession(next);
    }
  }

  function closeModal() {
    setRevealModal({ open: false, player: null });
  }

  function resetGame() {
    setSession(null);
    setPlayers([]);
    setPair(null);
    setWelcomeModal({ open: true, playerCount: null });
    clearSession();
  }

  const isGameStarted = !!session?.startedAt;
  const allRevealed = session?.players.every((p) => p.revealed);

  return (
    <div className="">
      {/* Welcome Modal - Cannot be closed until player count is selected */}
      {welcomeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-stone-900 rounded-lg p-8 w-full max-w-md mx-4 text-center text-white">
            <h1 className="text-3xl font-bold mb-6 text-blue-400">
              Welcome to Undercover!
            </h1>
            <p className="text-lg mb-8 text-white/80">
              Choose how many players will be in this session to ensure proper
              role distribution.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((count) => {
                const roles = calculateRequiredRoles(count);
                return (
                  <button
                    key={count}
                    onClick={() => handlePlayerCountSelection(count)}
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all hover:scale-105"
                  >
                    <div className="text-xl font-bold mb-1">{count}</div>
                    <div className="text-xs text-white/60">
                      {roles.undercover} Undercover
                      <br />
                      {roles.mrwhite} Mr. White
                      <br />
                      {roles.civilian} Civilians
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-sm text-white/60">
              Role distribution is automatically calculated to ensure a balanced
              game.
            </div>
          </div>
        </div>
      )}

      {/* Add players / lobby */}
      {!isGameStarted ? (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Add Players</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              placeholder="Player name"
              className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={addPlayer}
              disabled={
                !welcomeModal.playerCount ||
                players.length >= (welcomeModal.playerCount || 0)
              }
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {welcomeModal.playerCount &&
            players.length >= welcomeModal.playerCount && (
              <div className="mb-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30 text-yellow-200 text-sm">
                Maximum players reached ({welcomeModal.playerCount}). You can
                now start the game or change the player count.
              </div>
            )}

          {welcomeModal.playerCount && (
            <div className="mb-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <h3 className="font-medium text-blue-300 mb-2">
                Session Configuration
              </h3>
              <div className="text-sm text-white/80">
                <div>
                  Total Players:{" "}
                  <span className="font-semibold">
                    {welcomeModal.playerCount}
                  </span>
                </div>
                <div className="mt-1">
                  {(() => {
                    const roles = calculateRequiredRoles(
                      welcomeModal.playerCount
                    );
                    return (
                      <>
                        <span className="text-red-400">
                          {roles.undercover} Undercover
                        </span>{" "}
                        •
                        <span className="text-yellow-400">
                          {" "}
                          {roles.mrwhite} Mr. White
                        </span>{" "}
                        •
                        <span className="text-green-400">
                          {" "}
                          {roles.civilian} Civilians
                        </span>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() =>
                    setWelcomeModal({ open: true, playerCount: null })
                  }
                  className="mt-3 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Change Player Count
                </button>
              </div>
            </div>
          )}

          {players.length > 0 && (
            <>
              <h3 className="font-medium">Players ({players.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white/10 rounded-lg p-3 text-center"
                  >
                    <div className="font-medium">{p.name}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={startGame}
                disabled={players.length < (welcomeModal.playerCount || 4)}
                className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Start Game ({players.length}/{welcomeModal.playerCount || 4})
              </button>
            </>
          )}

          {pair && (
            <div className="mt-4 text-sm text-white/60">
              (Current word pair selected — private reveals use this pair)
            </div>
          )}
        </div>
      ) : (
        // Game in progress
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Game in Progress</h2>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Reset Game
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {session?.players.map((p, i) => (
              <div
                key={p.id}
                className={`bg-white/10 rounded-lg p-4 text-center cursor-pointer transition-all hover:scale-105 ${
                  p.revealed
                    ? "ring-2 ring-green-400 bg-green-900/20"
                    : "hover:bg-white/20"
                }`}
                onClick={() => !p.revealed && reveal(i)}
              >
                <div className="font-medium text-lg mb-2">{p.name}</div>
                {p.revealed && (
                  <div className="space-y-2">
                    <div
                      className={`text-sm px-2 py-1 rounded-full ${
                        p.role === "undercover"
                          ? "bg-red-600"
                          : p.role === "mrwhite"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                      }`}
                    >
                      {p.role === "undercover"
                        ? "Undercover"
                        : p.role === "mrwhite"
                        ? "Mr. White"
                        : "Civilian"}
                    </div>

                    {p.role === "mrwhite" ? (
                      <div className="text-sm italic">-</div>
                    ) : (
                      <div className="text-lg font-bold">{p.word}</div>
                    )}
                  </div>
                )}
                {!p.revealed && (
                  <div className="text-white/60">Click to reveal</div>
                )}
              </div>
            ))}
          </div>

          {session?.winner === "mrwhite" ? (
            <div className="mt-6 text-center">
              <div className="text-2xl font-bold mb-2">
                The Mr. White player won!
              </div>
            </div>
          ) : session?.winner === "undercover" ? (
            <div className="mt-6 text-center">
              <div className="text-2xl font-bold mb-2">Game Complete!</div>
              <div className="text-lg">The undercover player won!</div>
            </div>
          ) : session?.winner === "civilian" ? (
            <div className="mt-6 text-center">
              <div className="text-2xl font-bold mb-2">Game Complete!</div>
              <div className="text-lg">The civilians won!</div>
            </div>
          ) : null}
        </div>
      )}

      {/* Reveal modal (private) */}
      {revealModal.open && revealModal.player && (
        <div className="fixed m-0 inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative bg-stone-900 rounded-lg p-6 w-full max-w-md mx-4 text-center text-white">
            <h3 className="text-xl font-semibold mb-2">
              Hello, {revealModal.player.name}!
            </h3>
            <div className="mb-4 text-sm text-white/70">
              This is your private role reveal.
            </div>

            <div
              className="inline-block px-4 py-2 rounded-full mb-4 text-sm font-medium"
              style={{
                background:
                  revealModal.player.role === "undercover"
                    ? "rgba(220,38,38,0.2)"
                    : revealModal.player.role === "mrwhite"
                    ? "rgba(234,179,8,0.15)"
                    : "rgba(34,197,94,0.15)",
              }}
            >
              {titleCaseRole(revealModal.player.role)}
            </div>

            {revealModal.player.role === "mrwhite" ? (
              <div className="text-sm italic mb-4">
                You are <strong>Mr. White</strong>.
              </div>
            ) : (
              <div className="text-lg font-bold mb-4">
                Your word: "{revealModal.player.word}"
              </div>
            )}

            <button
              onClick={closeModal}
              className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Guess modal for Mr. White (appears when Mr. White is revealed in-game) */}
      {guessModal.open && guessModal.player && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeGuessModal}
          />
          <div className="relative bg-stone-900 rounded-lg p-6 w-full max-w-md mx-4 text-center text-white">
            <h3 className="text-xl font-semibold mb-2">
              Mr. White — make your guess
            </h3>
            <div className="mb-4 text-sm text-white/70">
              You have been revealed as Mr. White. If you guess the correct word
              the game ends and you win.
            </div>

            <input
              type="text"
              value={guessModal.guess}
              onChange={(e) =>
                setGuessModal((g) => ({ ...g, guess: e.target.value }))
              }
              placeholder="Enter your guess"
              className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/20 text-white placeholder-white/60 mb-3 focus:outline-none"
            />

            {guessModal.feedback && (
              <div className="text-sm text-yellow-300 mb-2">
                {guessModal.feedback}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={submitMrWhiteGuess}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
              >
                Submit Guess
              </button>
              <button
                onClick={closeMrWhiteModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={lottieRef}
        className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
}
