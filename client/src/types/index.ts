export interface User {
  id: string;
  username: string;
  display_name: string | null;
  token: string;
  password: string;
}

// Include additional fields for user updates
export interface UserUpdateRequest {
  username?: string;
  display_name?: string | null;
  password?: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: number; // 0: checking account, 1: cash, 2: wallet
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  amount: number; // in minor units format
  description: string | null;
  date: string; // ISO date string
}

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface TransactionWithAccount extends Transaction {
  account?: Account;
}

export interface PaginationParams {
  before?: string;
  after?: string;
  limit?: number;
}
