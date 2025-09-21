import React from 'react';

const ActionButtons = ({
    onClear,
    onClearSaved,
    onOpenCargo,
    onOpenFuel,
    onOpenHistory,
    onSaveCalculation,
    onExit
}) => {
    return (
        <div className="buttons">
            <div className="btn-group">
                <button className="btn-secondary" onClick={onClear}>
                    Clear
                </button>
                <button className="btn-secondary" onClick={onClearSaved}>
                    Clear Saved Data
                </button>
                <button className="btn-config" onClick={onOpenCargo}>
                    Manage Cargo
                </button>
                <button className="btn-config" onClick={onOpenFuel}>
                    Fuel Sequence
                </button>
                <button className="btn-danger" onClick={onExit}>
                    Exit
                </button>
            </div>
            <div className="btn-group">
                <button className="btn-primary" onClick={onOpenHistory}>
                    View History
                </button>
                <button className="btn-primary" onClick={onSaveCalculation}>
                    Save Calculation
                </button>
            </div>
        </div>
    );
};

export default ActionButtons;