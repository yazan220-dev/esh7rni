import AuthForm from "@/components/auth/AuthForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <AuthForm type="signin" />
      </div>
    </div>
  );
}
