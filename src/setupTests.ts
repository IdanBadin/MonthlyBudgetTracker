import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock Web Authentication API for biometrics tests
global.PublicKeyCredential = class PublicKeyCredential {
  static isUserVerifyingPlatformAuthenticatorAvailable() {
    return Promise.resolve(false);
  }
} as any;

// Mock navigator.credentials
Object.defineProperty(navigator, 'credentials', {
  writable: true,
  value: {
    create: vi.fn(),
    get: vi.fn(),
    preventSilentAccess: vi.fn(),
    store: vi.fn(),
  },
});

// Mock crypto.getRandomValues
Object.defineProperty(crypto, 'getRandomValues', {
  writable: true,
  value: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
});

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn((...args) => {
    // Allow specific expected errors to pass through
    const message = args[0]?.toString() || '';
    if (
      !message.includes('Not implemented: HTMLFormElement.prototype.submit') &&
      !message.includes('Not implemented: navigation')
    ) {
      originalError(...args);
    }
  });
});

afterEach(() => {
  console.error = originalError;
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Extend expect types
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): any;
  }
}
