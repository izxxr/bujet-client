import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Transaction } from "@/types";
import TransactionForm from "./transaction-form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TransactionTableProps {
  accountId: string;
}

export default function TransactionTable({
  accountId,
}: TransactionTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationState, setPaginationState] = useState<{
    beforeDate?: string;
    afterDate?: string;
  }>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get total transaction count
  const { data: transactionCount } = useQuery({
    queryKey: [`/accounts/${accountId}/transactions-count`],
    queryFn: async () => {
      if (!user) return { count: 0 };
      return transactionsApi.getTransactionsCount(
        accountId,
        user.id,
        user.token
      );
    },
    enabled: !!user && !!accountId,
  });

  // Get transactions for the current page
  const { data: transactions, isLoading } = useQuery({
    queryKey: [`/accounts/${accountId}/transactions`, { limit, ...paginationState }],
    queryFn: async () => {
      if (!user) return [];
      return transactionsApi.getTransactions(
        accountId,
        user.id,
        user.token,
        { 
          limit,
          before: paginationState.beforeDate,
          after: paginationState.afterDate
        }
      );
    },
    enabled: !!user && !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      if (!user) throw new Error("User not authenticated");
      return transactionsApi.deleteTransaction(
        accountId,
        transactionId,
        user.id,
        user.token
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      // Invalidate both transactions and transaction count
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/transactions-count`] });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/balance`] });
      setIsDeleteDialogOpen(false);
      
      // Reset to first page if we're on a page with no transactions after delete
      if (transactions && transactions.length === 1) {
        setPaginationState({});
        setCurrentPage(1);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionFormOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      deleteMutation.mutate(selectedTransaction.id);
    }
  };

  const totalPages = transactionCount 
    ? Math.ceil(transactionCount.count / limit) 
    : 0;

  // Go to next page
  const goToNextPage = () => {
    if (!transactions || transactions.length === 0) return;
    if (currentPage >= totalPages) return;
    
    // Get the oldest transaction date from current page as the 'after' parameter
    const oldestTransaction = transactions[transactions.length - 1];
    setPaginationState({
      beforeDate: oldestTransaction.date
    });
    setCurrentPage(currentPage + 1);
  };

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage === 1) return;
    
    if (!transactions || transactions.length === 0) {
      setPaginationState({});
      setCurrentPage(1);
      return;
    }
    
    // If we're on page 2 going back to page 1, just reset pagination
    if (currentPage === 2) {
      setPaginationState({});
      setCurrentPage(1);
      return;
    }
    
    // Get the newest transaction date from current page as the 'before' parameter
    const newestTransaction = transactions[0];
    setPaginationState({
      afterDate: newestTransaction.date
    });
    setCurrentPage(currentPage - 1);
  };

  // Go to specific page number
  const goToPage = (pageNumber: number) => {
    if (pageNumber === currentPage) return;
    if (pageNumber < 1 || pageNumber > totalPages) return;
    if (pageNumber === 1) {
      // Reset pagination for first page
      setPaginationState({});
      setCurrentPage(1);
    } else if (pageNumber > currentPage) {
      // Going forward, get all transactions from the beginning up to this page
      goToNextPage();
    } else {
      // Going backward
      goToPreviousPage();
    }
  };

  const handleSelectLimit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    // Reset pagination when changing limit
    setPaginationState({});
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg leading-6 font-medium text-gray-900">
          Transactions
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Show:</span>
          <select
            value={limit}
            onChange={handleSelectLimit}
            className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={40}>40</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <TableCell className="text-sm text-gray-500">
                    {formatDateTime(transaction.date)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-900">
                    {transaction.description}
                  </TableCell>
                  <TableCell
                    className={`text-sm text-right money font-medium ${
                      transaction.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTransaction(transaction)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTransaction(transaction)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {transactions && transactions.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-md shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={goToPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={transactions.length < limit}
              onClick={goToNextPage}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{" "}
                <span className="font-medium">
                  {(currentPage - 1) * limit + transactions.length}
                </span>{" "}
                of <span className="font-medium">{transactionCount?.count || 'many'}</span>{" "}
                results
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={goToPreviousPage}
                    className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
                  />
                </PaginationItem>
                
                {/* First page is always shown */}
                <PaginationItem>
                  <PaginationLink 
                    isActive={currentPage === 1} 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(1);
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                
                {/* If we're beyond page 3, add ellipsis after page 1 */}
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                      ...
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Show previous page if we're not on page 1 or 2 */}
                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(currentPage - 1);
                      }}
                    >
                      {currentPage - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Show current page if not page 1 */}
                {currentPage !== 1 && (
                  <PaginationItem>
                    <PaginationLink 
                      isActive={true} 
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Show next page if there are more results */}
                {transactions.length === limit && (
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(currentPage + 1);
                      }}
                    >
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={goToNextPage}
                    className={
                      transactions.length < limit
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Edit/Add Transaction Modal */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => {
          setIsTransactionFormOpen(false);
          setSelectedTransaction(null);
        }}
        accountId={accountId}
        transactionToEdit={selectedTransaction || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
