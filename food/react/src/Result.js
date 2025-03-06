import React from 'react';

const Result = ({ message }) => {
  if (!message || message === '') return null;

  return (
    <div className="result">
      <div className="result-content">
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Result;
