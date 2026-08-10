// context/DashboardContext.tsx
'use client';
import { createContext, useContext, useState } from 'react';

interface DashboardContextType {
  waitingCount: number;
  setWaitingCount: (count: number) => void;
}

const DashboardContext = createContext<DashboardContextType>({
  waitingCount: 0,
  setWaitingCount: () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [waitingCount, setWaitingCount] = useState(0);
  return (
    <DashboardContext.Provider value={{ waitingCount, setWaitingCount }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);