import React from 'react';

const Header = () => {
    const handleLogout = async () => {
        try {
            const response = await fetch('../logout', {
                method: 'GET',
            });
    
            if (response.redirected) {
                window.location.href = response.url;
            } else if (!response.ok) {
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