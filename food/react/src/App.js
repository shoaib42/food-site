// import logo from './logo.svg';
import './App.css';
import AddFood from './AddFood';
import SearchFood from './SearchFood';
import FoodToCarbs from './FoodToCarbs';
import ICRComponent from './ICRComponent';
import CarbsToFood from './CarbsToFood';
import Header from './Header';

function App() {
  return (
    <div className="App">
      <Header />
      <SearchFood />
      <ICRComponent />
      <FoodToCarbs />
      <CarbsToFood />
      <AddFood />
    </div>
  );
}

export default App;
