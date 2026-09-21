import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PotholeCase, Severity } from '@/types';

interface CitizenContextProps {
  cases: PotholeCase[];
  addCase: (newCase: PotholeCase) => void;
  updateCase: (updatedCase: PotholeCase) => void;
}

const CitizenContext = createContext<CitizenContextProps | undefined>(undefined);

export const useCitizen = (): CitizenContextProps => {
  const context = useContext(CitizenContext);
  if (!context) {
    throw new Error('useCitizen must be used within a CitizenProvider');
  }
  return context;
};

// Generate a mock case ID
export const generateCaseId = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CF-${num}`;
};

export const CitizenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<PotholeCase[]>([]);

  const addCase = (newCase: PotholeCase) => {
    setCases((prev) => [...prev, newCase]);
  };

  const updateCase = (updatedCase: PotholeCase) => {
    setCases((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? { ...c, ...updatedCase } : c))
    );
  };

  // Initialize with a sample active case for demo purposes
  React.useEffect(() => {
    const sampleCase: PotholeCase = {
      id: 'CF-1023',
      wardId: 'ward-12',
      location: 'MG Road, near Dadar Station',
      landmark: 'Opposite Swaminarayan Temple',
      city: 'Mumbai',
      coordinates: { x: 50, y: 50, lat: 19.0178, lng: 72.8478 },
      severity: 'High' as Severity,
      status: 'REPAIRING',
      description:
        'Deep road cavity causing severe traffic bottleneck during evening peak hours.',
      reportedDate: new Date().toISOString(),
    };
    setCases([sampleCase]);
  }, []);

  return (
    <CitizenContext.Provider value={{ cases, addCase, updateCase }}>
      {children}
    </CitizenContext.Provider>
  );
};
