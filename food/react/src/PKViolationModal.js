import React from 'react';
import Modal from './Modal';
import useModal from './useModal';

const PKViolationModal = ({ isOpen, onClose, foodRecord, dataObj }) => {
    const { isOpen: showModal, message: modalMessage, openModal, closeModal } = useModal(); // Using the useModal hook
    // Handle the PUT request to update the food record
    const handleUpdateFood = () => {
        onClose();
        fetchWithAuth("api", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataObj)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                if (response.status === 204) {
                    // Handle 204 (No Content) response
                    openModal("Updated successfully");
                } else {
                    openModal("Server error. Please try again later.");
                }
            })
            .catch(error => {
                openModal("Network error. Please check your connection." + error.message);
            });

    };

    return (
        <div className='container'>
            <div className="modal pk-modal" style={{ display: isOpen ? 'block' : 'none' }}>
                <div className="modal-content">
                    <p>{`${foodRecord.food} exists with value ${foodRecord.gramsPerCarb} (grams/carb)`}</p>
                    <p>{`Do you wish to update it with value : ${dataObj.newGramsOfFood / dataObj.newGramsOfCarbs} (grams/carb)`}</p>
                    <div className='modal-content-form'>
                        <button type="submit" id="updateButton" onClick={handleUpdateFood}>Update</button>
                        <button type="button" id="cancelButton" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
            <Modal isOpen={showModal} onClose={closeModal} message={modalMessage} />
        </div >
    );
};

export default PKViolationModal;