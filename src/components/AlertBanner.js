import React, { useEffect, useState } from 'react';

const AlertBanner = ({ message, type = 'warning', onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 500);
    };

    return (
        <div className={`alert-banner ${type} ${!isVisible ? 'hiding' : ''}`}>
            <span>{message}</span>
            <button className="alert-close" onClick={handleClose}>
                ×
            </button>
        </div>
    );
};

export default AlertBanner;