import {useState} from 'react';

const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const openModal = (msg) => {
    setMessage(msg);
    setIsOpen(true);
  };

  const closeModal = () => {
    setMessage('');
    setIsOpen(false);
  };

  return { isOpen, message, openModal, closeModal };
};

export default useModal;
