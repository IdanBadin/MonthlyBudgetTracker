import { Language, Currency } from '../lib/i18n';

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  created_at: string;
};

export type InternalTransfer = {
  id: string;
  user_id: string;
  amount: number;
  from_account: string;
  to_account: string;
  description: string;
  date: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name?: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark';
  theme_colors?: {
    primary: string;
    secondary: string;
  };
  dashboard_settings?: {
    showBalance: boolean;
    compactView: boolean;
  };
  data_retention_months?: number;
  created_at: string;
};