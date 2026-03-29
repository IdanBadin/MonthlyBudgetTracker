import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { subMonths, format } from 'npm:date-fns@3.3.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get all users with their data retention settings
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, data_retention_months');

    if (profilesError) throw profilesError;

    let totalDeletedTransactions = 0;
    let totalDeletedBalances = 0;
    let totalDeletedTransfers = 0;
    const processedUsers = [];

    // Process each user individually based on their retention settings
    for (const profile of profiles || []) {
      const retentionMonths = profile.data_retention_months || 6; // Default to 6 months
      const cutoffDate = subMonths(new Date(), retentionMonths);
      const formattedCutoffDate = format(cutoffDate, 'yyyy-MM-dd');

      try {
        // Delete old transactions for this user
        const { error: transactionsError, count: deletedTransactions } = await supabaseClient
          .from('transactions')
          .delete({ count: 'exact' })
          .eq('user_id', profile.id)
          .lt('date', formattedCutoffDate);

        if (transactionsError) {
          console.error(`Error deleting transactions for user ${profile.id}:`, transactionsError);
          continue;
        }

        // Delete old starting balances for this user
        const { error: balancesError, count: deletedBalances } = await supabaseClient
          .from('starting_balances')
          .delete({ count: 'exact' })
          .eq('user_id', profile.id)
          .lt('month', formattedCutoffDate);

        if (balancesError) {
          console.error(`Error deleting balances for user ${profile.id}:`, balancesError);
          continue;
        }

        // Delete old internal transfers for this user
        const { error: transfersError, count: deletedTransfers } = await supabaseClient
          .from('internal_transfers')
          .delete({ count: 'exact' })
          .eq('user_id', profile.id)
          .lt('date', formattedCutoffDate);

        if (transfersError) {
          console.error(`Error deleting transfers for user ${profile.id}:`, transfersError);
          continue;
        }

        // Track totals and user processing
        totalDeletedTransactions += deletedTransactions || 0;
        totalDeletedBalances += deletedBalances || 0;
        totalDeletedTransfers += deletedTransfers || 0;

        processedUsers.push({
          userId: profile.id,
          retentionMonths,
          cutoffDate: formattedCutoffDate,
          deletedTransactions: deletedTransactions || 0,
          deletedBalances: deletedBalances || 0,
          deletedTransfers: deletedTransfers || 0
        });

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully cleaned up old data based on user retention settings',
        summary: {
          totalProcessedUsers: processedUsers.length,
          totalDeletedTransactions,
          totalDeletedBalances,
          totalDeletedTransfers
        },
        userDetails: processedUsers
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Cleanup function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to clean up old data'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});