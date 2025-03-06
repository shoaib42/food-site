import React from 'react';
import { useFood } from './SelectionProvider';

const ICRComponent = () => {
  const { ICR, updateICR } = useFood();

  const handleInputChange = (event) => {
    updateICR(event.target.value);
  };

  return (
    <div className="container">
      <h2>ICR</h2>
      <div className="icr-layout">
        <div className="left">1</div>
        <div className="middle">:</div>
        <div className="right">
            <input type="number" value={ICR} min="0" placeholder="ICR" onChange={handleInputChange}></input>
        </div>
      </div>
    </div>
  );
};

export default ICRComponent;
