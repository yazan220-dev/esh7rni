export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-6">Check your email</h2>
        <p className="mb-4">
          A sign in link has been sent to your email address.
        </p>
        <p className="text-muted-foreground">
          Please check your email (including spam folder) for a link to sign in.
        </p>
      </div>
    </div>
  );
}
