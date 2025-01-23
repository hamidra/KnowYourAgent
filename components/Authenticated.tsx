"use client";
import { usePrivy } from '@privy-io/react-auth';
import { ReactNode } from 'react';
import Login from './Login';

interface AuthenticatedProps {
  children: ReactNode;
}

const Authenticated = ({ children }: AuthenticatedProps) => {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Login />;
  }

  return <>{children}</>;
};

export default Authenticated; 