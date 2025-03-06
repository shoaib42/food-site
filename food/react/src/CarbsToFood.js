import React, { useState, useEffect } from 'react';
import { useFood } from './SelectionProvider';
import Result from './Result';


const CarbsToFood = () => {
    const { selectedFood, ICR } = useFood();
    const [gramsOfFood, setGramsOfFood] = useState(0);
    const [carbAmount, setCarbAmount] = useState('');
    const [insulinMessage, setInsulinMessage] = useState('');

    useEffect(() => {
        calculateFood();
    }, [carbAmount, selectedFood, ICR]);

    const calculateFood = () => {
        setInsulinMessage('');
        if (carbAmount > 0) {
            const gOfFood = Math.round(carbAmount * selectedFood.gramsPerCarb * 10) / 10;
            setGramsOfFood(`Take ${gOfFood}g of ${selectedFood.food} to get ${carbAmount}g of carbs`);
            if (ICR > 0) {
                const insulinAmount = carbAmount / ICR;
                const roundedDownUnits = Math.floor(insulinAmount * 2) / 2; // rounded to 0.5
                const roundedDownCoverage = roundedDownUnits * ICR;
                setInsulinMessage(`Safer insulin dose: ${roundedDownUnits} units,  misses ${Math.abs(Math.floor((roundedDownCoverage - carbAmount) * 10) / 10)} carbs`);
            }
        }

    };

    const handleInputChange = (event) => {
        setCarbAmount(event.target.value);
    };

    if (selectedFood === null) return null;

    return (

        <div className="container">
            <h3>Get Grams of {selectedFood.food}</h3>
            <input type="number" id="carbAmount" value={carbAmount} min="0" step="1" placeholder={`Enter carbs`} onChange={handleInputChange}></input>
            {carbAmount > 0 && <Result message={gramsOfFood} />}
            {carbAmount > 0 && ICR > 0 && <Result message={insulinMessage} />}
        </div>

    );
};

export default CarbsToFood;