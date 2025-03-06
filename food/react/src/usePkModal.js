import {useState} from 'react';

const usePkModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [foodRecord, setFoodRecord] = useState('');
  const [dataObj, setDataObj] = useState('');

  const openModal = (foodR, dObj) => {
    setFoodRecord(foodR);
    setDataObj(dObj);
    setIsOpen(true);
  };

  const closeModal = () => {
    setFoodRecord('');
    setDataObj('');
    setIsOpen(false);
  };

  return { isOpen, foodRecord, dataObj, openModal, closeModal };
};

export default usePkModal;
