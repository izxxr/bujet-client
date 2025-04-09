import { formatCurrency, formatDate } from "@/lib/utils";
import { Transaction, Account } from "@/types";

interface TransactionItemProps {
  transaction: Transaction;
  account?: Account;
}

export default function TransactionItem({
  transaction,
  account,
}: TransactionItemProps) {
  return (
    <li>
      <a href="#" className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="flex text-sm">
                <p className="font-medium text-purple-700 truncate">
                  {transaction.description || "No description"}
                </p>
                {account && (
                  <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                    in <span className="text-gray-900">{account.name}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="ml-2 flex-shrink-0 flex">
              <p
                className={`px-2 inline-flex text-sm leading-5 font-semibold money ${
                  transaction.amount >= 0 ? "text-green-800" : "text-red-800"
                }`}
              >
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <svg
                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formatDate(transaction.date)}</span>
              </p>
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}
