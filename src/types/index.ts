export interface WordPair {
  civilian: string;
  undercover: string;
}

export interface Player {
  id: number;
  name: string;
  revealed: boolean;
  role: 'civilian' | 'undercover' | 'mrwhite' | null;
  word: string | null;
}

export interface PlayerWithRole extends Omit<Player, 'role'> {
  role: 'civilian' | 'undercover' | 'mrwhite';
  word: string | null;
}

export interface GameSession {
  startedAt?: string;
  pair: WordPair;
  players: PlayerWithRole[];
  revealedCount: number;
  winner?: 'civilian' | 'undercover' | 'mrwhite';
}

export interface AppProps {
  Component: React.ComponentType<any>;
  pageProps: any;
}
