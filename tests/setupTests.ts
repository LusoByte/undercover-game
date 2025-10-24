import '@testing-library/jest-dom/vitest'; // adds jest-dom matchers to Vitest. :contentReference[oaicite:6]{index=6}
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Basic cleanup after each test
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
