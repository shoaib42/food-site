import React from 'react';
import fetchHandleRedirect from './fetchWithHandleRedirect';

const Header = () => {
    const handleLogout = async () => {
        try {
            const response = await fetchHandleRedirect('../logout', {
                method: 'GET',
            });
            if (!response.ok) {
                console.error('Logout failed:', response.statusText);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };
  
    return (
        <div className="container">
            <h1>Carb Calculator</h1>
            <div className="icon-group">
                {/* <i className="fas fa-cog"></i> {/* Icon for settings */}
                <i className="fas fa-sign-out-alt" id="logout-icon" onClick={handleLogout}></i>
            </div>
        </div>
    );
  };

  export default Header;