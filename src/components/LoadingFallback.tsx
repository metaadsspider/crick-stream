import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingFallback = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="bg-gradient-dark rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="flex space-x-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </div>
        </div>

        {/* Match Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-card rounded-2xl overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-24 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;