import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Account, AccountWithBalance } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Building, Wallet, BanknoteIcon } from "lucide-react";

interface AccountCardProps {
  account: AccountWithBalance;
}

export default function AccountCard({ account }: AccountCardProps) {
  const { id, name, type, balance } = account;

  const getAccountIcon = () => {
    switch (type) {
      case 0: // checking account
        return (
          <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
            <Building className="h-6 w-6 text-white" />
          </div>
        );
      case 1: // cash
        return (
          <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
            <BanknoteIcon className="h-6 w-6 text-white" />
          </div>
        );
      case 2: // wallet
        return (
          <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
            <Wallet className="h-6 w-6 text-white" />
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
            <Building className="h-6 w-6 text-white" />
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            {getAccountIcon()}
            <div className="ml-5 w-0 flex-1">
              <div>
                <div className="text-sm font-medium text-gray-500 truncate">
                  {name}
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-semibold money text-gray-900">
                    {formatCurrency(balance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link
            href={`/account/${id}`}
            className="font-medium text-purple-600 hover:text-purple-500"
          >
            View account<span className="sr-only"> {name}</span>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
