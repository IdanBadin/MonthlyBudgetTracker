import { supabase } from './supabase';
import { Transaction } from '../types/database';
import { subMonths, format } from 'date-fns';
import toast from 'react-hot-toast';

export type BackupData = {
  transactions: Transaction[];
  preferences: any;
  layouts: any;
  startingBalances: any;
  internalTransfers: any;
  timestamp: string;
  version: string;
  retentionMonths: number;
  cutoffDate: string;
};

const CURRENT_BACKUP_VERSION = '1.1';

export async function createBackup(userId: string, backupType: 'auto' | 'manual' = 'auto'): Promise<boolean> {
  try {
    // Get user's data retention setting
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('data_retention_months')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const retentionMonths = profile?.data_retention_months || 6; // Default to 6 months
    const cutoffDate = subMonths(new Date(), retentionMonths);
    const formattedCutoffDate = format(cutoffDate, 'yyyy-MM-dd');

    // Fetch user data within retention period only
    const [
      { data: transactions },
      { data: preferences },
      { data: layouts },
      { data: startingBalances },
      { data: internalTransfers }
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', formattedCutoffDate), // Only include data within retention period
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('starting_balances')
        .select('*')
        .eq('user_id', userId)
        .gte('month', formattedCutoffDate), // Only include balances within retention period
      supabase
        .from('internal_transfers')
        .select('*')
        .eq('user_id', userId)
        .gte('date', formattedCutoffDate) // Only include transfers within retention period
    ]);

    const backupData: BackupData = {
      transactions: transactions || [],
      preferences: preferences || [],
      layouts: layouts || [],
      startingBalances: startingBalances || [],
      internalTransfers: internalTransfers || [],
      timestamp: new Date().toISOString(),
      version: CURRENT_BACKUP_VERSION,
      retentionMonths,
      cutoffDate: formattedCutoffDate
    };

    // Create backup record
    const { error } = await supabase
      .from('data_backups')
      .insert([{
        user_id: userId,
        backup_data: backupData,
        backup_type: backupType
      }]);

    if (error) throw error;

    // Clean up old backups (keep last 10)
    const { data: oldBackups } = await supabase
      .from('data_backups')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('backup_type', backupType)
      .order('created_at', { ascending: false });

    if (oldBackups && oldBackups.length > 10) {
      const backupsToDelete = oldBackups.slice(10);
      if (backupsToDelete.length > 0) {
        await supabase
          .from('data_backups')
          .delete()
          .in('id', backupsToDelete.map(b => b.id));
      }
    }

    return true;
  } catch (error) {
    console.error('Backup creation failed:', error);
    return false;
  }
}

export async function restoreFromBackup(userId: string, backupId: string): Promise<boolean> {
  try {
    // Fetch the backup
    const { data: backup, error: backupError } = await supabase
      .from('data_backups')
      .select('backup_data')
      .eq('id', backupId)
      .eq('user_id', userId)
      .single();

    if (backupError || !backup) throw backupError || new Error('Backup not found');

    const backupData: BackupData = backup.backup_data;

    // Create a backup before restoration
    await createBackup(userId, 'auto');

    // Get current user's retention setting to ensure we don't restore data outside retention period
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('data_retention_months')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const currentRetentionMonths = profile?.data_retention_months || 6;
    const currentCutoffDate = subMonths(new Date(), currentRetentionMonths);
    const formattedCurrentCutoffDate = format(currentCutoffDate, 'yyyy-MM-dd');

    // Filter backup data to only include data within current retention period
    const filteredTransactions = backupData.transactions.filter(t => t.date >= formattedCurrentCutoffDate);
    const filteredStartingBalances = backupData.startingBalances?.filter(b => b.month >= formattedCurrentCutoffDate) || [];
    const filteredInternalTransfers = backupData.internalTransfers?.filter(t => t.date >= formattedCurrentCutoffDate) || [];

    // Start a batch operation
    const operations = [];

    // Restore transactions (only within current retention period)
    if (filteredTransactions.length > 0) {
      operations.push(
        supabase
          .from('transactions')
          .delete()
          .eq('user_id', userId)
          .gte('date', formattedCurrentCutoffDate)
          .then(() => 
            supabase
              .from('transactions')
              .insert(filteredTransactions.map(t => ({ ...t, user_id: userId })))
          )
      );
    }

    // Restore starting balances (only within current retention period)
    if (filteredStartingBalances.length > 0) {
      operations.push(
        supabase
          .from('starting_balances')
          .delete()
          .eq('user_id', userId)
          .gte('month', formattedCurrentCutoffDate)
          .then(() =>
            supabase
              .from('starting_balances')
              .insert(filteredStartingBalances.map(b => ({ ...b, user_id: userId })))
          )
      );
    }

    // Restore internal transfers (only within current retention period)
    if (filteredInternalTransfers.length > 0) {
      operations.push(
        supabase
          .from('internal_transfers')
          .delete()
          .eq('user_id', userId)
          .gte('date', formattedCurrentCutoffDate)
          .then(() =>
            supabase
              .from('internal_transfers')
              .insert(filteredInternalTransfers.map(t => ({ ...t, user_id: userId })))
          )
      );
    }

    // Restore preferences
    if (backupData.preferences.length > 0) {
      operations.push(
        supabase
          .from('user_preferences')
          .update(backupData.preferences[0])
          .eq('user_id', userId)
      );
    }

    // Restore layouts
    if (backupData.layouts && backupData.layouts.length > 0) {
      operations.push(
        supabase
          .from('dashboard_layouts')
          .delete()
          .eq('user_id', userId)
          .then(() =>
            supabase
              .from('dashboard_layouts')
              .insert(backupData.layouts.map(l => ({ ...l, user_id: userId })))
          )
      );
    }

    await Promise.all(operations);

    return true;
  } catch (error) {
    console.error('Restore failed:', error);
    return false;
  }
}

export async function getBackups(userId: string): Promise<{
  id: string;
  created_at: string;
  backup_type: string;
}[]> {
  try {
    const { data, error } = await supabase
      .from('data_backups')
      .select('id, created_at, backup_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch backups:', error);
    return [];
  }
}

export async function scheduleBackup(userId: string): Promise<void> {
  const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  // Check last backup
  const { data: lastBackup } = await supabase
    .from('data_backups')
    .select('created_at')
    .eq('user_id', userId)
    .eq('backup_type', 'auto')
    .order('created_at', { ascending: false })
    .limit(1);

  if (lastBackup && lastBackup.length > 0) {
    const lastBackupTime = new Date(lastBackup[0].created_at).getTime();
    const now = new Date().getTime();

    if (now - lastBackupTime < BACKUP_INTERVAL) {
      return; // Skip if last backup was less than 24 hours ago
    }
  }

  const success = await createBackup(userId, 'auto');
  if (!success) {
    console.error('Scheduled backup failed');
  }
}