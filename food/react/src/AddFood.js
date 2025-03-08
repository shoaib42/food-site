import React, { useState } from 'react';
import Modal from './Modal';
import useModal from './useModal';
import usePkModal from './usePkModal';
import PKViolationModal from './PKViolationModal';
import fetchHandleRedirect from './fetchWithHandleRedirect';

const AddFood = () => {
    const [newFood, setNewFood] = useState('');
    const [newGramsOfFood, setNewGramsOfFood] = useState('');
    const [newGramsOfCarbs, setNewGramsOfCarbs] = useState('');
    const { isOpen: showModal, message: modalMessage, openModal, closeModal } = useModal(); // Using the useModal hook
    const { isOpen: showPkModal, foodRecord: fr, dataObj: dobj, openModal: openPkModal, closeModal: closePkModal } = usePkModal(); // Using the useModal hook

    const handleFormSubmit = (event) => {
        event.preventDefault();

        const dataObj = {
            newFood,
            newGramsOfFood,
            newGramsOfCarbs
        };
        
        fetchHandleRedirect("api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataObj)
        })
            .then(response => {
                if (!response.ok && !response.status === 409) {
                    throw new Error("Network response was not ok");
                }
                if (response.status === 201 || response.status === 409) {
                    return response.json();
                } else {
                    throw new Error("Server error. Please try again later.");
                }
            })
            .then(data => {
                if (data.message === "pk violation") {
                    openPkModal(data.record, dataObj);
                } else if (data.success) {
                    openModal("Food added successfully!");
                } else {
                    throw new Error("Unknown error in add/update");
                }
            })
            .catch(error => {
                openModal("Error : " + error.message);
            });
    };

    return (
        <div className="container">
            <h1>Add Food</h1>
            <form onSubmit={handleFormSubmit}>
                <label htmlFor="newFood">New Food:</label>
                <input type="text" id="newFood" name="newFood" value={newFood} onChange={(e) => setNewFood(e.target.value)} placeholder="Enter new food name" required />

                <label htmlFor="newGramsOfFood">Grams of Food:</label>
                <input type="number" id="newGramsOfFood" name="newGramsOfFood" value={newGramsOfFood} onChange={(e) => setNewGramsOfFood(e.target.value)} min="0" step="0.1" placeholder="Enter grams of food" required />

                <label htmlFor="newGramsOfCarbs">Grams of Carbs:</label>
                <input type="number" id="newGramsOfCarbs" name="newGramsOfCarbs" value={newGramsOfCarbs} onChange={(e) => setNewGramsOfCarbs(e.target.value)} min="0" placeholder="Enter grams of carbs" required />

                <button type="submit">Add Food</button>
            </form>
            <PKViolationModal isOpen={showPkModal} onClose={closePkModal} foodRecord={fr} dataObj={dobj} />
            <Modal isOpen={showModal} onClose={closeModal} message={modalMessage} />
        </div>
    );
};

export default AddFood;
