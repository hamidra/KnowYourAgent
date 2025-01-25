"use client";
import { usePrivy } from "@privy-io/react-auth";

const Header = () => {
  const { login, authenticated, logout, user } = usePrivy();
  const email = user?.email?.address;
  const address = user?.wallet?.address;

  return (
    <header className="w-full p-4 bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-stretch">
        <h1 className="text-xl font-bold flex items-center">AI Chat</h1>
        {authenticated ? (
          <div className="flex items-stretch gap-4">
            <div className="flex items-stretch gap-4">
              <div className="bg-gray-100 rounded-3xl px-4  flex flex-col justify-center">
                <p className="font-light text-sm max-w-[200px]">
                  {address
                    ? address.length > 8
                      ? `${address.slice(0, 5)}...${address.slice(-5)}`
                      : address
                    : "No wallet"}
                </p>
                {email && <p className="text-xs text-gray-500">{email}</p>}
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-3xl text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="px-4 py-2 text-white rounded-3xl bg-blue-600 rounded hover:bg-blue-700 transition-colors flex items-center"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
