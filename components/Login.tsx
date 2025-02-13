"use client";
import { usePrivy } from "@privy-io/react-auth";

const Login = () => {
  const { login } = usePrivy();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-3xl font-bold text-center">
          Welcome to KYA Chat
        </h1>
        <button
          onClick={login}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
