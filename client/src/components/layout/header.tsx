import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import MobileMenu from "./mobile-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import blogCompanyLogo from "@assets/blog company.png";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (user: any) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.username ? user.username[0].toUpperCase() : "U";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <img src={blogCompanyLogo} alt="Blog Company" className="h-8 w-auto" />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <a className={`text-neutral-700 hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors ${location === "/" ? "text-red-500" : ""}`}>
                Home
              </a>
            </Link>
            <Link href="/">
              <a className="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 px-3 py-2 text-sm font-medium">
                Explore
              </a>
            </Link>
            {user && (
              <Link href="/bookmarks">
                <a className="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 px-3 py-2 text-sm font-medium">
                  Bookmarks
                </a>
              </Link>
            )}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center text-neutral-600 dark:text-neutral-300 hover:text-primary-500 px-3 py-2 text-sm font-medium">
                    <Bell className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 dark:bg-neutral-800 dark:border-neutral-700">
                  <div className="p-2 text-sm font-medium text-center border-b dark:border-neutral-700 dark:text-white">
                    Notifications
                  </div>
                  <div className="py-4 text-xs text-center text-neutral-500 dark:text-neutral-400">
                    No new notifications
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          
          {/* Search */}
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <form className="relative" onSubmit={(e) => e.preventDefault()}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-10 pr-3 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          </div>
          
          

          {/* User Menu (logged in state) */}
          <div className="flex items-center ml-4">
            {user ? (
              <>
                <Link href="/create-article">
                  <Button variant="default" className="hidden md:block bg-primary-500 hover:bg-primary-600 rounded-full px-6">
                    Write an article
                  </Button>
                </Link>
                <div className="ml-4 relative flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-white dark:bg-neutral-800 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span className="sr-only">Open user menu</span>
                        <Avatar>
                          <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 dark:bg-neutral-800 dark:border-neutral-700">
                      <div className="p-2 text-sm font-medium dark:text-white">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.username}
                      </div>
                      <DropdownMenuSeparator className="dark:border-neutral-700" />
                      <Link href={`/profile/${user.id}`}>
                        <DropdownMenuItem className="dark:hover:bg-neutral-700 dark:text-neutral-200">
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/create-article">
                        <DropdownMenuItem className="dark:hover:bg-neutral-700 dark:text-neutral-200">
                          Write Article
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/bookmarks">
                        <DropdownMenuItem className="dark:hover:bg-neutral-700 dark:text-neutral-200">
                          Bookmarks
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/settings">
                        <DropdownMenuItem className="dark:hover:bg-neutral-700 dark:text-neutral-200">
                          Settings
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="dark:border-neutral-700" />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="dark:hover:bg-neutral-700 dark:text-neutral-200">
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="space-x-2">
                <Link href="/auth">
                  <Button variant="outline" className="rounded-full">Sign in</Button>
                </Link>
                <Link href="/auth">
                  <Button className="rounded-full bg-primary-500 hover:bg-primary-600">Get started</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
    </header>
  );
}
