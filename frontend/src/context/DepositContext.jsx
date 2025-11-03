// src/context/DepositContext.jsx
import { createContext, useContext, useState } from 'react';

const DepositContext = createContext();

export function DepositProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openDepositModal = () => {
    setIsModalOpen(true);
  };

  const closeDepositModal = () => {
    setIsModalOpen(false);
  };

  return (
    <DepositContext.Provider value={{ isModalOpen, openDepositModal, closeDepositModal }}>
      {children}
    </DepositContext.Provider>
  );
}

export const useDeposit = () => useContext(DepositContext);