export interface WordPair {
  civilian: string;
  undercover: string;
}

export type WordPairRevealed = WordPair | null;

export type PlayerWithRole = {
  id: number;
  name: string;
  role: 'civilian' | 'undercover' | 'mrwhite';
  word: string | null;
  revealed: boolean;
};

export type PlayerRolesRevealed = {
  role: 'civilian' | 'undercover' | 'mrwhite';
  revealed: boolean;
};

export type GameSession = {
  startedAt?: string;
  endedAt?: string;
  pair?: WordPair | null;
  players?: PlayerWithRole[];
  revealedCount?: number;
  winner?: 'civilian' | 'undercover' | 'mrwhite' | null;
};

export type State = {
  session: GameSession | null;
  wordpool: WordPair[];
};

export type Action =
  | { type: 'SET_SESSION'; payload: GameSession | null }
  | { type: 'SET_PAIR'; payload: WordPair }
  | { type: 'SET_PLAYERS'; payload: PlayerWithRole[] }
  | { type: 'ADD_PLAYER'; payload: PlayerWithRole }
  | { type: 'UPDATE_PLAYER'; payload: { index: number; player: PlayerWithRole } }
  | { type: 'SET_WORDPOOL'; payload: WordPair[] }
  | { type: 'RESET' };

export type GameContextValue = {
  state: State;
  dispatch: React.Dispatch<Action>;
  persist: { loadSession: () => Promise<GameSession | null>; clearSession: () => Promise<void> } | null;
};
