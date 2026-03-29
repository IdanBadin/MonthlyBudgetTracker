import { supabase } from './supabase';

export async function updateProfileName(email: string, name: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('email', email);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
}