import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 justify-center bg-[#FAFAFA] px-4 py-10 sm:px-5 sm:py-14">
      <div className="w-full max-w-lg">
        <LoginForm />
      </div>
    </main>
  );
}
