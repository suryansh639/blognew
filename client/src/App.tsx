import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "./hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import ArticlePage from "./pages/article-page";
import CreateArticlePage from "./pages/create-article-page";
import ProfilePage from "./pages/profile-page";
import EditArticlePage from "./pages/edit-article-page";
import SettingsPage from "./pages/settings-page";
import BookmarksPage from "./pages/bookmarks-page";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/article/:id" component={ArticlePage} />
      <ProtectedRoute path="/create-article" component={CreateArticlePage} />
      <ProtectedRoute path="/edit-article/:id" component={EditArticlePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/bookmarks" component={BookmarksPage} />
      <Route path="/profile/:id" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;