import React from "react";
import { AlertTriangle, RefreshCw, Wifi } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface NetworkErrorState {
  hasError: boolean;
  errorMessage: string;
  retryCount: number;
}

export class NetworkErrorBoundary extends React.Component<
  NetworkErrorBoundaryProps,
  NetworkErrorState
> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): NetworkErrorState {
    // Check if it's a network-related error
    const isNetworkError = error.message.includes('Failed to fetch') ||
                          error.message.includes('Network error') ||
                          error.message.includes('Unable to connect');
    
    if (isNetworkError) {
      return {
        hasError: true,
        errorMessage: error.message,
        retryCount: 0,
      };
    }

    // For non-network errors, don't catch them
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Network error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      errorMessage: "",
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <Wifi className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-heading">
                Connection Problem
              </CardTitle>
              <CardDescription className="font-body">
                Unable to connect to the server. Please check your internet connection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500" />
                  <div>
                    <p className="font-medium">Troubleshooting tips:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Check your internet connection</li>
                      <li>• Refresh the page</li>
                      <li>• Try again in a few moments</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>

              {this.state.retryCount > 2 && (
                <div className="text-xs text-muted-foreground text-center p-2 bg-muted rounded">
                  Still having issues? Try refreshing the entire page or contact support.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useNetworkErrorHandler() {
  const [networkError, setNetworkError] = React.useState<string | null>(null);

  const handleNetworkError = React.useCallback((error: Error) => {
    if (error.message.includes('Failed to fetch') ||
        error.message.includes('Network error') ||
        error.message.includes('Unable to connect')) {
      setNetworkError(error.message);
      return true; // Handled
    }
    return false; // Not handled
  }, []);

  const clearNetworkError = React.useCallback(() => {
    setNetworkError(null);
  }, []);

  const retryWithErrorHandler = React.useCallback(async (
    asyncFn: () => Promise<any>,
    maxRetries = 2
  ) => {
    let retries = 0;
    while (retries <= maxRetries) {
      try {
        const result = await asyncFn();
        clearNetworkError();
        return result;
      } catch (error) {
        if (error instanceof Error && handleNetworkError(error) && retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        throw error;
      }
    }
  }, [handleNetworkError, clearNetworkError]);

  return {
    networkError,
    clearNetworkError,
    retryWithErrorHandler,
  };
}
