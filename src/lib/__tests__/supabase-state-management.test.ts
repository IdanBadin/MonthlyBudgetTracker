import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../supabase';

/**
 * CRITICAL: Auth state management tests
 * Tests the onAuthStateChange callbacks that handle session lifecycle
 */
describe('supabase.ts - Auth State Management', () => {
  let authCallback: (event: string, session: any) => void;
  let localStorageClearSpy: any;
  let reloadSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Spy on critical side effects
    localStorageClearSpy = vi.spyOn(Storage.prototype, 'clear');
    reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true
    });

    // Capture the auth callback
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      };
    });
  });

  describe('SIGNED_OUT event', () => {
    it('should clear localStorage when user signs out', () => {
      authCallback('SIGNED_OUT', null);
      expect(localStorageClearSpy).toHaveBeenCalled();
    });

    it('should reload page after clearing storage', () => {
      authCallback('SIGNED_OUT', null);
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should handle SIGNED_OUT in correct order: clear then reload', () => {
      const callOrder: string[] = [];
      localStorageClearSpy.mockImplementation(() => callOrder.push('clear'));
      reloadSpy.mockImplementation(() => callOrder.push('reload'));

      authCallback('SIGNED_OUT', null);

      expect(callOrder).toEqual(['clear', 'reload']);
    });
  });

  describe('USER_DELETED event', () => {
    it('should clear localStorage when user account deleted', () => {
      authCallback('USER_DELETED', null);
      expect(localStorageClearSpy).toHaveBeenCalled();
    });

    it('should reload page after user deletion', () => {
      authCallback('USER_DELETED', null);
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('TOKEN_REFRESHED event', () => {
    it('should update localStorage with refreshed session', () => {
      const mockSession = {
        access_token: 'new_token',
        refresh_token: 'new_refresh',
        expires_at: Date.now() + 3600000,
        user: { id: 'user123' }
      };

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      authCallback('TOKEN_REFRESHED', mockSession);

      expect(setItemSpy).toHaveBeenCalledWith(
        'supabase.auth.token',
        JSON.stringify(mockSession)
      );
    });

    it('should not reload page on token refresh', () => {
      const mockSession = { access_token: 'token', user: { id: '123' } };

      authCallback('TOKEN_REFRESHED', mockSession);

      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should handle null session on TOKEN_REFRESHED gracefully', () => {
      expect(() => authCallback('TOKEN_REFRESHED', null)).not.toThrow();
    });
  });

  describe('SIGNED_IN event', () => {
    it('should accept valid session on SIGNED_IN', () => {
      const validSession = {
        access_token: 'token',
        user: { id: 'user123' }
      };

      authCallback('SIGNED_IN', validSession);

      expect(localStorageClearSpy).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should clear and reload if SIGNED_IN has null session (invalid)', () => {
      authCallback('SIGNED_IN', null);

      expect(localStorageClearSpy).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Session initialization', () => {
    it('should clear storage and reload on getSession failure', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockRejectedValue(new Error('Network error'));

      // Trigger initialization (happens on module load)
      await expect(supabase.auth.getSession()).rejects.toThrow();

      expect(localStorageClearSpy).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid state changes without race conditions', () => {
      authCallback('SIGNED_IN', { access_token: 'token1', user: { id: '1' } });
      authCallback('TOKEN_REFRESHED', { access_token: 'token2', user: { id: '1' } });
      authCallback('SIGNED_OUT', null);

      expect(localStorageClearSpy).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should not crash on unknown event types', () => {
      expect(() => authCallback('UNKNOWN_EVENT' as any, null)).not.toThrow();
    });
  });
});
