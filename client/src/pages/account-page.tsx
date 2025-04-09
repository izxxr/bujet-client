import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { accountsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getAccountTypeLabel } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

import Sidebar from "@/components/layout/sidebar";
import TransactionTable from "@/components/transactions/transaction-table";
import TransactionForm from "@/components/transactions/transaction-form";
import AccountForm from "@/components/accounts/account-form";

import { Button } from "@/components/ui/button";
import { Pencil, Plus, Loader2, Building, Wallet, BanknoteIcon } from "lucide-react";

export default function AccountPage() {
  const { id: accountId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);

  // Fetch account details
  const {
    data: account,
    isLoading: isLoadingAccount,
    isError: isAccountError,
  } = useQuery({
    queryKey: [`/accounts/${accountId}`],
    queryFn: async () => {
      if (!user || !accountId) return null;
      return accountsApi.getAccount(accountId, user.id, user.token);
    },
    enabled: !!user && !!accountId,
  });

  // Fetch account balance
  const {
    data: balanceData,
    isLoading: isLoadingBalance,
  } = useQuery({
    queryKey: [`/accounts/${accountId}/balance`],
    queryFn: async () => {
      if (!user || !accountId) return { balance: 0 };
      return accountsApi.getAccountBalance(accountId, user.id, user.token);
    },
    enabled: !!user && !!accountId,
  });



  const openTransactionModal = () => setIsTransactionModalOpen(true);
  const closeTransactionModal = () => setIsTransactionModalOpen(false);
  
  const openEditAccountModal = () => setIsEditAccountModalOpen(true);
  const closeEditAccountModal = () => setIsEditAccountModalOpen(false);

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none dashboard-bg">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Account Details</h1>
            </div>
            <br />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {isLoadingAccount ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                </div>
              ) : account ? (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {account.type === 0 ? (
                          <Building className="h-6 w-6 text-purple-700" />
                        ) : account.type === 1 ? (
                          <BanknoteIcon className="h-6 w-6 text-purple-700" />
                        ) : (
                          <Wallet className="h-6 w-6 text-purple-700" />
                        )}
                      </div>
                      <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                          {account.name}
                        </h1>
                        <p className="text-xs mt-1 text-gray-500">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openEditAccountModal}
                        className="flex items-center"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                  {account.description && (
                    <p className="mt-3 text-sm text-gray-600">
                      {account.description}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-red-500">
                  Account not found
                </div>
              )}
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Balance Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg mt-6">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Current Balance
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold money text-gray-900">
                      {isLoadingBalance ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : account ? (
                        formatCurrency(
                          balanceData?.balance || 0
                        )
                      ) : (
                        "0.00"
                      )}
                    </dd>
                  </dl>
                </div>
              </div>

              {/* Add Transaction Button */}
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={openTransactionModal}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>

              {/* Transactions Table */}
              {account && (
                <div className="mt-4">
                  <TransactionTable
                    accountId={accountId}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Transaction Modal */}
      {account && (
        <TransactionForm
          isOpen={isTransactionModalOpen}
          onClose={closeTransactionModal}
          accountId={accountId}
        />
      )}

      {/* Edit Account Modal */}
      {account && (
        <AccountForm
          isOpen={isEditAccountModalOpen}
          onClose={closeEditAccountModal}
          accountToEdit={account}
        />
      )}
    </div>
  );
}