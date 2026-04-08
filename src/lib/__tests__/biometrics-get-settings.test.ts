import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBiometricSettings, updateBiometricSettings } from '../biometrics';
import { supabase } from '../supabase';

vi.mock('../supabase');

/**
 * CRITICAL: Tests for previously UNTESTED getBiometricSettings
 * Priority: HIGH — function has 0% coverage
 */
describe('biometrics.ts - getBiometricSettings (Previously Untested)', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should retrieve biometric settings successfully', async () => {
      const mockSettings = {
        loginEnabled: true,
        backupEnabled: false
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { biometric_settings: mockSettings },
              error: null
            })
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual(mockSettings);
    });

    it('should return default settings when user has no preferences', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { biometric_settings: null },
              error: null
            })
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual({
        loginEnabled: false,
        backupEnabled: false
      });
    });

    it('should return default settings when preferences row is missing', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual({
        loginEnabled: false,
        backupEnabled: false
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database query errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual({
        loginEnabled: false,
        backupEnabled: false
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle network failures gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual({
        loginEnabled: false,
        backupEnabled: false
      });
    });

    it('should handle undefined userId', async () => {
      const result = await getBiometricSettings(undefined as any);

      expect(result).toEqual({
        loginEnabled: false,
        backupEnabled: false
      });
    });

    it('should handle null userId', async () => {
      const result = await getBiometricSettings(null as any);

      expect(result).toEqual({
        loginEnabled: false,
        backupEnabled: false
      });
    });

    it('should handle empty string userId', async () => {
      const result = await getBiometricSettings('');

      // Should still attempt query but likely return defaults
      expect(result).toBeDefined();
    });
  });

  describe('Partial settings handling', () => {
    it('should handle settings with only loginEnabled', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { biometric_settings: { loginEnabled: true } },
              error: null
            })
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual({
        loginEnabled: true,
        backupEnabled: false
      });
    });

    it('should handle settings with only backupEnabled', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { biometric_settings: { backupEnabled: true } },
              error: null
            })
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual({
        loginEnabled: false,
        backupEnabled: true
      });
    });

    it('should handle malformed settings object', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { biometric_settings: { invalid: 'data' } },
              error: null
            })
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      // Should return defaults for invalid structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('loginEnabled');
      expect(result).toHaveProperty('backupEnabled');
    });
  });

  describe('Integration with updateBiometricSettings', () => {
    it('should retrieve settings after update', async () => {
      const newSettings = { loginEnabled: true, backupEnabled: true };

      // Mock successful update
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      } as any);

      await updateBiometricSettings(mockUserId, newSettings);

      // Mock successful retrieval
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { biometric_settings: newSettings },
              error: null
            })
          })
        })
      } as any);

      const result = await getBiometricSettings(mockUserId);

      expect(result).toEqual(newSettings);
    });
  });

  describe('Security', () => {
    it('should not expose userId in error messages', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('DB error'))
          })
        })
      } as any);

      await getBiometricSettings('sensitive-user-id-123');

      // Verify error doesn't contain sensitive data
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorArgs = consoleErrorSpy.mock.calls[0];
      const errorMessage = JSON.stringify(errorArgs);
      expect(errorMessage).not.toContain('sensitive-user-id-123');

      consoleErrorSpy.mockRestore();
    });

    it('should prevent user A from reading user B settings', async () => {
      // This test verifies the query uses .eq(user_id)
      const eqSpy = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { biometric_settings: { loginEnabled: false, backupEnabled: false } },
          error: null
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqSpy
        })
      } as any);

      await getBiometricSettings('user-A');

      expect(eqSpy).toHaveBeenCalledWith('user_id', 'user-A');
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time (< 1s)', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { biometric_settings: { loginEnabled: true, backupEnabled: false } },
              error: null
            })
          })
        })
      } as any);

      const start = Date.now();
      await getBiometricSettings(mockUserId);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
