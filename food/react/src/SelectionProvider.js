import React, { createContext, useState, useContext } from 'react';

const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  const [selectedFood, setSelectedFood] = useState(null);
  const [ICR, setICR] = useState(0);

  const selectFood = (food) => {
    setSelectedFood(food);
  };

  const updateICR = (icr) => {
    setICR(icr);
  };

  return (
    <SelectionContext.Provider value={{ selectedFood, selectFood, ICR, updateICR }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useFood = () => useContext(SelectionContext);
