import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "react-error-boundary";
import { LoadingFallback } from "./components/LoadingFallback";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  console.error('🔥 Error Boundary Caught:', error);
  
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-2xl font-bold text-primary mb-4">Oops! Something went wrong</h2>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-destructive font-mono">{error.message}</p>
        </div>
        <div className="space-y-2">
          <button 
            onClick={resetErrorBoundary}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

const App = () => {
  console.log('🏁 App component rendering...');
  
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('🔥 Global Error Boundary:', error, errorInfo);
      }}
    >
      <React.Suspense fallback={<LoadingFallback />}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
