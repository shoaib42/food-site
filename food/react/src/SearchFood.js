import React, { useState } from 'react';
import { useFood } from './SelectionProvider';
import fetchHandleRedirect from './fetchWithHandleRedirect';

const SearchFood = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const { selectFood } = useFood();

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value.length >= 3) {
      // Make Fetch request to fetch food suggestions
      fetchHandleRedirect("api?q=" + encodeURIComponent(event.target.value))
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(data => {
          if (data.found) {
            setFoodSuggestions(data.data);
          } else {
            setFoodSuggestions([]);
            console.log("No results found for '" + event.target.value + "'");
          }
        })
        .catch(error => {
          console.error("Fetch failed:", error);
        });
    } else {
      setFoodSuggestions([]);
    }
  };

  const clearFood = () => {
    setSearchQuery('');
    setFoodSuggestions([]);
  };

  const selectFoodFromList = (food) => {
    selectFood(food);
    setSearchQuery(food.food);
    setFoodSuggestions([]);
  };

  return (
    <div className="container">
      <h2>Search</h2>
      <div className="search-wrapper">
        <input type="text" value={searchQuery} className="search-input" placeholder="Search for a food" onChange={handleSearchChange} />
        <span className="clear-input" onClick={clearFood}>&#10006;</span>
      </div>
      <div id="foodSuggestions">
        {foodSuggestions.map((food, index) => (
          <div key={index} className="foodSuggestion" onClick={() => selectFoodFromList(food)}>
            {food.food}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchFood;
