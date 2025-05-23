import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!isOpen) return null;

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden bg-white dark:bg-neutral-900 border-b dark:border-neutral-800">
      <div className="pt-2 pb-3 space-y-1">
        <Link href="/">
          <a 
            className={`${
              location === "/" 
                ? "bg-neutral-50 dark:bg-neutral-800 border-l-4 border-primary-500 text-primary-700 dark:text-primary-400"
                : "border-l-4 border-transparent text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 hover:text-neutral-800 dark:hover:text-white"
            } block pl-3 pr-4 py-2 text-base font-medium`}
            onClick={closeMenu}
          >
            Home
          </a>
        </Link>
        <Link href="/">
          <a 
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 hover:text-neutral-800 dark:hover:text-white"
            onClick={closeMenu}
          >
            Explore
          </a>
        </Link>
        {user && (
          <Link href="/bookmarks">
            <a 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 hover:text-neutral-800 dark:hover:text-white"
              onClick={closeMenu}
            >
              Bookmarks
            </a>
          </Link>
        )}
        {user && (
          <Link href="/">
            <a 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 hover:text-neutral-800 dark:hover:text-white"
              onClick={closeMenu}
            >
              Notifications
            </a>
          </Link>
        )}
        {user ? (
          <>
            <Link href={`/profile/${user.id}`}>
              <a 
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 hover:text-neutral-800 dark:hover:text-white"
                onClick={closeMenu}
              >
                Profile
              </a>
            </Link>
            <Link href="/create-article">
              <a 
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-primary-600 dark:text-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 hover:text-primary-700 dark:hover:text-primary-300"
                onClick={closeMenu}
              >
                Write
              </a>
            </Link>
          </>
        ) : (
          <>
            <Link href="/auth">
              <a 
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 hover:text-neutral-800 dark:hover:text-white"
                onClick={closeMenu}
              >
                Sign In
              </a>
            </Link>
            <Link href="/auth">
              <a 
                className="block pl-3 pr-4 py-2 border-l-4 border-primary-500 text-base font-medium text-primary-600 dark:text-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-primary-300 hover:text-primary-700 dark:hover:text-primary-300"
                onClick={closeMenu}
              >
                Get Started
              </a>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
