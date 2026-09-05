import React, { createContext, useContext } from 'react'

export const ShiftGuardContext = createContext({
  isInShift: true,
  isReceptionist: false,
  shiftStatus: null,
  loadingShift: false,
  openHandoverModal: () => {},
  guardAction: (fn) => {
    if (typeof fn === 'function') fn()
  },
  refreshShiftStatus: async () => {},
})

export function useShiftGuard() {
  return useContext(ShiftGuardContext)
}

export function ShiftGuardProvider({ children }) {
  const value = {
    isInShift: true,
    isReceptionist: false,
    shiftStatus: null,
    loadingShift: false,
    openHandoverModal: () => {},
    guardAction: (fn) => {
      if (typeof fn === 'function') fn()
    },
    refreshShiftStatus: async () => {},
  }

  return (
    <ShiftGuardContext.Provider value={value}>
      {children}
    </ShiftGuardContext.Provider>
  )
}
