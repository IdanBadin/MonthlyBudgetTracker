import { supabase } from './supabase';

// Check if biometrics are available on the device
export async function isBiometricsAvailable(): Promise<boolean> {
  try {
    // Check if the Web Authentication API is available
    if (!window.PublicKeyCredential) {
      return false;
    }

    // Check if the device supports biometric authentication
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Register biometric credentials
export async function registerBiometrics(userId: string): Promise<boolean> {
  try {
    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Monthly Budget Tracker',
        id: window.location.hostname
      },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: userId,
        displayName: 'User'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'none'
    };

    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Store the credential ID in the user's preferences
    const { error } = await supabase
      .from('user_preferences')
      .update({
        biometric_credentials: {
          credential_id: Array.from(new Uint8Array((credential.rawId))),
          registered_at: new Date().toISOString()
        }
      })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error registering biometrics:', error);
    return false;
  }
}

// Verify biometric authentication
export async function verifyBiometrics(userId: string): Promise<boolean> {
  try {
    // Get the stored credential ID
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('biometric_credentials')
      .eq('user_id', userId)
      .single();

    if (preferencesError || !preferences?.biometric_credentials?.credential_id) {
      throw new Error('No biometric credentials found');
    }

    // Generate a new challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create assertion options
    const assertionOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id: new Uint8Array(preferences.biometric_credentials.credential_id),
        type: 'public-key',
        transports: ['internal']
      }],
      timeout: 60000,
      userVerification: 'required'
    };

    // Verify the credential
    const assertion = await navigator.credentials.get({
      publicKey: assertionOptions
    });

    return !!assertion;
  } catch (error) {
    console.error('Error verifying biometrics:', error);
    return false;
  }
}

// Remove biometric credentials
export async function removeBiometrics(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .update({
        biometric_credentials: null,
        biometric_settings: {
          loginEnabled: false,
          backupEnabled: false
        }
      })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing biometrics:', error);
    return false;
  }
}

// Check if biometrics are enabled for the user
export async function isBiometricsEnabled(userId: string): Promise<boolean> {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('biometric_credentials')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return !!preferences?.biometric_credentials?.credential_id;
  } catch {
    return false;
  }
}

// Update biometric settings
export async function updateBiometricSettings(userId: string, settings: {
  loginEnabled: boolean;
  backupEnabled: boolean;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .update({
        biometric_settings: settings
      })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating biometric settings:', error);
    return false;
  }
}

// Get biometric settings
export async function getBiometricSettings(userId: string): Promise<{
  loginEnabled: boolean;
  backupEnabled: boolean;
} | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('biometric_settings')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.biometric_settings || null;
  } catch (error) {
    console.error('Error getting biometric settings:', error);
    return null;
  }
}