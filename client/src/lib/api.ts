import { error } from "console";
import { Account, Transaction, User, UserUpdateRequest } from "../types";

const API_BASE_URL = process.env.BUJET_SERVER_BASE_URL || "https://bujet-api.onrender.com";


// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    if (typeof errorData.detail == "string") {
      throw new Error(errorData.detail);
    } else if (typeof errorData.detail == "object") {
      const field = errorData.detail[0].loc[errorData.detail[0].loc.length - 1];
      throw new Error(`In ${field}, ${errorData.detail[0].msg.toLowerCase()}`)
    }

    throw new Error("An unknown error occured.");
  }

  if (response.status == 204) {
    return {} as Promise<T>;
  }

  return response.json() as Promise<T>;
}

// Auth API
export const authApi = {
  signUp: async (data: { username: string; display_name?: string; password: string }): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<User>(response);
  },

  signIn: async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/user/`, {
      method: 'GET',
      headers: {
        'X-User-Username': username,
        'X-User-Password': password
      }
    });
    return handleResponse<User>(response);
  },

  updateUser: async (data: UserUpdateRequest, userId: string, token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/user/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-User-Token': token
      },
      body: JSON.stringify(data)
    });
    return handleResponse<User>(response);
  },

  deleteUser: async (userId: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/user/`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });

    await handleResponse(response);
  }
};

// Accounts API
export const accountsApi = {
  getAccounts: async (userId: string, token: string): Promise<Account[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    return handleResponse<Account[]>(response);
  },

  getAccount: async (accountId: string, userId: string, token: string): Promise<Account> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    return handleResponse<Account>(response);
  },

  createAccount: async (data: Omit<Account, 'id' | 'user_id'>, userId: string, token: string): Promise<Account> => {
    const response = await fetch(`${API_BASE_URL}/accounts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-User-Token': token
      },
      body: JSON.stringify(data)
    });
    return handleResponse<Account>(response);
  },

  updateAccount: async (
    accountId: string, 
    data: Omit<Account, 'id' | 'user_id' | 'type'>, 
    userId: string, 
    token: string
  ): Promise<Account> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}.`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-User-Token': token
      },
      body: JSON.stringify(data)
    });
    return handleResponse<Account>(response);
  },

  deleteAccount: async (accountId: string, userId: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    
    await handleResponse(response);
  },

  getAccountBalance: async (accountId: string, userId: string, token: string): Promise<{ balance: number }> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/balance/`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    return handleResponse<{ balance: number }>(response);
  }
};

// Transactions API
export const transactionsApi = {
  getTransactions: async (
    accountId: string, 
    userId: string, 
    token: string, 
    params?: { 
      before?: string; 
      after?: string; 
      limit?: number 
    }
  ): Promise<Transaction[]> => {
    let url = `${API_BASE_URL}/accounts/${accountId}/transactions/`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.before) queryParams.append('before', params.before);
      if (params.after) queryParams.append('after', params.after);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    
    const response = await fetch(url, {
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    return handleResponse<Transaction[]>(response);
  },

  getTransaction: async (accountId: string, transactionId: string, userId: string, token: string): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/transactions/${transactionId}/`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    return handleResponse<Transaction>(response);
  },

  createTransaction: async (
    accountId: string, 
    data: Omit<Transaction, 'id' | 'account_id'>, 
    userId: string, 
    token: string
  ): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-User-Token': token
      },
      body: JSON.stringify(data)
    });
    return handleResponse<Transaction>(response);
  },

  updateTransaction: async (
    accountId: string, 
    transactionId: string, 
    data: Omit<Transaction, 'id' | 'account_id'>, 
    userId: string, 
    token: string
  ): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/transactions/${transactionId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-User-Token': token
      },
      body: JSON.stringify(data)
    });
    return handleResponse<Transaction>(response);
  },

  deleteTransaction: async (accountId: string, transactionId: string, userId: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/transactions/${transactionId}/`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    
    await handleResponse(response);
  },

  getTransactionsCount: async (accountId: string, userId: string, token: string): Promise<{ count: number }> => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/transactions-count/`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Token': token
      }
    });
    return handleResponse<{ count: number }>(response);
  }
};
