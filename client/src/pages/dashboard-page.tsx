import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { accountsApi, transactionsApi } from "@/lib/api";
import { formatCurrency, getUserInitials } from "@/lib/utils";
import { Account, Transaction, AccountWithBalance } from "@/types";
import Sidebar from "@/components/layout/sidebar";
import AccountCard from "@/components/accounts/account-card";
import TransactionItem from "@/components/transactions/transaction-item";
import SettingsForm from "@/components/user/settings-form";
import { Plus, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// User Menu Component with Avatar
function UserMenu({ user }: { user: { username: string; display_name: string | null } }) {
  const { logoutMutation } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-purple-200">
              <AvatarFallback className="bg-purple-700 text-white">
                {getUserInitials(user.username, user.display_name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.display_name || user.username}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.username}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Form Dialog */}
      <SettingsForm isOpen={isSettingsOpen} onClose={closeSettings} />
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [accountsWithBalance, setAccountsWithBalance] = useState<AccountWithBalance[]>([]);
  
  // Fetch all accounts
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["/accounts"],
    queryFn: async () => {
      if (!user) return [];
      return accountsApi.getAccounts(user.id, user.token);
    },
    enabled: !!user,
  });

  // Fetch all account balances
  useEffect(() => {
    if (!user || !accounts || accounts.length === 0) return;

    const fetchBalances = async () => {
      let total = 0;
      const accountsWithBalanceData: AccountWithBalance[] = [];

      for (const account of accounts) {
        try {
          const balanceData = await accountsApi.getAccountBalance(
            account.id,
            user.id,
            user.token
          );
          let balance = balanceData.balance;
          total += balance;
          accountsWithBalanceData.push({
            ...account,
            balance: balance,
          });
        } catch (error) {
          console.error(`Error fetching balance for account ${account.id}:`, error);
          accountsWithBalanceData.push({
            ...account,
            balance: 0,
          });
        }
      }

      setTotalBalance(total);
      setAccountsWithBalance(accountsWithBalanceData);
    };

    fetchBalances();
  }, [user, accounts]);

  // Fetch recent transactions from all accounts
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/recent-transactions"],
    queryFn: async () => {
      if (!user || !accounts || accounts.length === 0) return [];
      
      const allTransactions: Transaction[] = [];
      
      for (const account of accounts) {
        try {
          const transactions = await transactionsApi.getTransactions(
            account.id,
            user.id,
            user.token,
            { limit: 10 }
          );
          allTransactions.push(...transactions.map(t => ({ ...t, account })));
        } catch (error) {
          console.error(`Error fetching transactions for account ${account.id}:`, error);
        }
      }
      
      // Sort by date (newest first) and limit to 10
      return allTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
    enabled: !!user && !!accounts && accounts.length > 0,
  });

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar isAccountModalOpenP={isAccountModalOpen} setIsAccountModalOpenP={setIsAccountModalOpen} />

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none dashboard-bg">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              
              {/* User Avatar Dropdown */}
              {user && (
                <div className="hidden md:block">
                  <UserMenu user={user} />
                </div>
              )}
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Balance Summary */}
              <div className="bg-white overflow-hidden shadow rounded-lg mt-6">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Balance
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold money text-gray-900">
                      {isLoadingAccounts ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        accounts && accounts.length > 0 ? (
                          accountsWithBalance.length > 0 ? (
                            formatCurrency(totalBalance)
                          ) : (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          )
                        ) : (
                          "0.00"
                        )
                      )}
                    </dd>
                  </dl>
                </div>
              </div>

              {/* Account Cards */}
              <div className="mt-8">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Your Accounts</h2>
                <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {isLoadingAccounts ? (
                    <div className="col-span-full flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                    </div>
                  ) : (
                    <>
                      {accountsWithBalance.map((account) => (
                        <AccountCard key={account.id} account={account} />
                      ))}
                      
                      {/* Add Account Card */}
                      <Card className="bg-gray-50 border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          className="text-purple-600 hover:text-purple-900 flex items-center"
                          onClick={() => setIsAccountModalOpen(true)}
                        >
                          <Plus className="h-6 w-6 mr-2" />
                          <span>Add Account</span>
                        </Button>
                      </Card>
                    </>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-8">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md mt-2">
                  {isLoadingTransactions || !accounts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>Create an account to start tracking transactions</p>
                    </div>
                  ) : recentTransactions && recentTransactions.length > 0 ? (
                    <ul role="list" className="divide-y divide-gray-200">
                      {recentTransactions.map((transaction: any) => {
                        const account = transaction.account as Account;
                        return (
                          <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                            account={account}
                          />
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <p>No recent transactions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}