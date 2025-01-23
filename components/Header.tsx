"use client";
import { usePrivy } from '@privy-io/react-auth';

const Header = () => {
  const { login, authenticated, logout } = usePrivy();

  return (
    <header className="w-full p-4 bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">AI Chat</h1>
        {authenticated ? (
          <button
            onClick={logout}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={login}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header; 