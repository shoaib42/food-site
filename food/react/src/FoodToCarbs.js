import React, { useState, useEffect } from 'react';
import { useFood } from './SelectionProvider';
import Result from './Result';

const FoodToCarbs = () => {
    const { selectedFood, ICR } = useFood();
    const [gramsOfFood, setGramsOfFood] = useState('');
    const [carbMessage, setCarbMessage] = useState('');
    const [insulinMessage, setInsulinMessage] = useState('');
    const [skittles, setSkittles] = useState('');

    useEffect(() => {
        calculateCarbs();
    }, [gramsOfFood, selectedFood, ICR]);

    const calculateCarbs = () => {
        setSkittles('');
        setInsulinMessage('');
        if (gramsOfFood > 0) {
            const carbAmountInFood = gramsOfFood / selectedFood.gramsPerCarb;
            const roundedCarbs = Math.round(carbAmountInFood * 10) / 10;
            setCarbMessage(`There are ${roundedCarbs} carbs in ${gramsOfFood}g of ${selectedFood.food}`);
            if (ICR > 0) {
                const insulinAmount = carbAmountInFood / ICR;
                const roundedDownUnits = Math.floor(insulinAmount * 2)/ 2; // rounded to 0.5
                const roundedUpUnits = roundedDownUnits + 0.5; // rounded up to 0.5

                const roundedDownCoverage = roundedDownUnits * ICR;
                const roundedUpCoverage = roundedUpUnits * ICR;

                // rounded up give better coverage as it is closer to the actual carb amount
                if ( Math.abs(roundedUpCoverage - carbAmountInFood) < Math.abs(roundedDownCoverage - carbAmountInFood)) {
                    const carbsMissing = Math.round((roundedUpCoverage - carbAmountInFood) * 100 ) / 100;
                    const carbsMissingFloor = Math.ceil(carbsMissing);
                    if ( carbsMissingFloor > 0 ) {
                        setSkittles(`If you take ${roundedUpUnits} units of insulin, it will cover ${roundedUpCoverage} and you'll need to add ${carbsMissingFloor} skittles to get best coverage`);
                    } else {
                        setSkittles(`If you take ${roundedUpUnits} units of insulin, gives the closest coverage with a carb difference of ${carbsMissing}`);
                    }
                }
                setInsulinMessage(`Safer insulin dose: ${roundedDownUnits} units, covers ${roundedDownCoverage} carbs and misses ${Math.abs(Math.floor((roundedDownCoverage - carbAmountInFood) * 10 )/ 10)} carbs`) ;
            }
        }
    };

    const handleInputChange = (event) => {
        setGramsOfFood(event.target.value);
      };

    if (selectedFood === null) return null;

    return (
        <div className="container">
            <h2>Get Carbs from weight of {selectedFood.food}</h2>
            <input type="number" id="gramsOfFood" value={gramsOfFood} min="0" step="0.1" placeholder={`Enter grams of ${selectedFood.food}`} onChange={handleInputChange}></input>
            {gramsOfFood > 0 && <Result message={carbMessage}/>}
            {gramsOfFood > 0 && ICR > 0  && skittles && <Result message={skittles}/>}
            {gramsOfFood > 0 && ICR > 0  && <Result message={insulinMessage}/>}
        </div>
    );
};

export default FoodToCarbs;