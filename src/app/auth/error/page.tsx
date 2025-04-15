export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-6">Authentication Error</h2>
        <p className="mb-4">
          There was an error during the authentication process.
        </p>
        <p className="text-muted-foreground mb-6">
          Please try again or contact support if the problem persists.
        </p>
        <a 
          href="/auth/signin" 
          className="inline-block py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to Sign In
        </a>
      </div>
    </div>
  );
}
