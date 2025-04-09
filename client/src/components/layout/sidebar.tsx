import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { accountsApi } from "@/lib/api";
import { getUserInitials } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building, 
  BanknoteIcon, 
  Wallet, 
  Plus, 
  LogOut, 
  User, 
  Settings,
  X
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AccountForm from "@/components/accounts/account-form";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Account } from "@/types";

interface SidebarProps {
  isAccountModalOpenP?: boolean;
  setIsAccountModalOpenP?: (arg0: boolean) => void;
}

export default function Sidebar({ isAccountModalOpenP, setIsAccountModalOpenP }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  let isAccountModalOpen: boolean, setIsAccountModalOpen: (arg0: boolean) => void;

  if (!setIsAccountModalOpenP) {
    [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  } else {
    isAccountModalOpen = !!isAccountModalOpenP;
    setIsAccountModalOpen = setIsAccountModalOpenP;
  }

  const { data: accounts } = useQuery({
    queryKey: ["/accounts"],
    queryFn: async () => {
      if (!user) return [];
      return accountsApi.getAccounts(user.id, user.token);
    },
    enabled: !!user,
  });

  const getAccountIcon = (type: number) => {
    switch (type) {
      case 0: // checking account
        return <Building className="mr-3 h-5 w-5 text-purple-300" />;
      case 1: // cash
        return <BanknoteIcon className="mr-3 h-5 w-5 text-purple-300" />;
      case 2: // wallet
        return <Wallet className="mr-3 h-5 w-5 text-purple-300" />;
      default:
        return <Building className="mr-3 h-5 w-5 text-purple-300" />;
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const openAccountModal = () => setIsAccountModalOpen(true);
  const closeAccountModal = () => setIsAccountModalOpen(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-purple-950">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-purple-900">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="ml-2 text-xl font-semibold text-white">Bujet</span>
            </div>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <Link href="/dashboard">
                  <a
                    className={`${
                      location === "/dashboard"
                        ? "bg-purple-800 text-white"
                        : "text-purple-100 hover:bg-purple-800"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <LayoutDashboard className="mr-3 h-6 w-6 text-white" />
                    Dashboard
                  </a>
                </Link>

                <div className="px-2 py-4">
                  <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Your Accounts
                  </h3>
                  <div className="mt-2 space-y-1">
                    {accounts?.map((account: Account) => (
                      <Link key={account.id} href={`/account/${account.id}`}>
                        <a
                          className={`${
                            location === `/account/${account.id}`
                              ? "bg-purple-800 text-white"
                              : "text-purple-100 hover:bg-purple-800"
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                        >
                          {getAccountIcon(account.type)}
                          <span>{account.name}</span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>

                <button
                  onClick={openAccountModal}
                  className="w-full text-purple-100 hover:bg-purple-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Plus className="mr-3 h-5 w-5 text-purple-300" />
                  Add Account
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header with menu and user dropdown */}
      <div className="md:hidden flex-shrink-0 flex h-16 bg-white shadow items-center justify-between px-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600"
        >
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex items-center">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-800">
                    {user && getUserInitials(user.username, user.display_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.display_name || user?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
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
        </div>
      </div>

      {/* Mobile sidebar - shown when menu is open */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 flex z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-purple-950">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-xl font-bold text-white">Bujet</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                <Link href="/dashboard">
                  <a
                    className={`${
                      location === "/dashboard"
                        ? "bg-purple-800 text-white"
                        : "text-purple-100 hover:bg-purple-800"
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <LayoutDashboard className="mr-3 h-6 w-6 text-white" />
                    Dashboard
                  </a>
                </Link>

                <div className="px-2 py-4">
                  <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Your Accounts
                  </h3>
                  <div className="mt-2 space-y-1">
                    {accounts?.map((account: Account) => (
                      <Link key={account.id} href={`/account/${account.id}`}>
                        <a
                          className={`${
                            location === `/account/${account.id}`
                              ? "bg-purple-800 text-white"
                              : "text-purple-100 hover:bg-purple-800"
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                        >
                          {getAccountIcon(account.type)}
                          <span>{account.name}</span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>

                <button
                  onClick={openAccountModal}
                  className="w-full text-purple-100 hover:bg-purple-800 group flex items-center px-2 py-2 text-base font-medium rounded-md"
                >
                  <Plus className="mr-3 h-5 w-5 text-purple-300" />
                  Add Account
                </button>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-purple-800 p-4">
              <button
                onClick={handleLogout}
                className="flex-shrink-0 group block"
              >
                <div className="flex items-center">
                  <div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-800">
                        {user && getUserInitials(user.username, user.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">
                      {user?.display_name || user?.username}
                    </p>
                    <p className="text-sm font-medium text-purple-300 group-hover:text-purple-200">
                      Log out
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Account Modal */}
      <AccountForm 
        isOpen={isAccountModalOpen} 
        onClose={closeAccountModal}
      />
    </>
  );
}
