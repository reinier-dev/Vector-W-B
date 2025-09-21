import { useState, useEffect } from 'react';

const CargoModal = ({
    isOpen,
    onClose,
    stationNames,
    onUpdateStationNames,
    showAlert
}) => {
    const [station8Name, setStation8Name] = useState('');
    const [station9Name, setStation9Name] = useState('');
    const [station10Name, setStation10Name] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Load current station names
            setStation8Name(stationNames[7] || 'Cargo');
            setStation9Name(stationNames[8] || 'Other');
            setStation10Name(stationNames[9] || 'Other');
        }
    }, [isOpen, stationNames]);

    if (!isOpen) return null;

    const resetStationNames = () => {
        if (window.confirm('Reset station names to default? This will clear any custom names.')) {
            setStation8Name('Cargo');
            setStation9Name('Other');
            setStation10Name('Other');
            showAlert('Station names reset to default', 'success', 2000);
        }
    };

    const acceptChanges = () => {
        const newStationNames = [...stationNames];
        let changesApplied = false;

        // Update station names if they've changed
        if (station8Name.trim() && station8Name !== stationNames[7]) {
            newStationNames[7] = station8Name.trim();
            changesApplied = true;
        }

        if (station9Name.trim() && station9Name !== stationNames[8]) {
            newStationNames[8] = station9Name.trim();
            changesApplied = true;
        }

        if (station10Name.trim() && station10Name !== stationNames[9]) {
            newStationNames[9] = station10Name.trim();
            changesApplied = true;
        }

        if (changesApplied) {
            onUpdateStationNames(newStationNames);

            // Save to localStorage
            try {
                const customNames = {
                    station8: newStationNames[7],
                    station9: newStationNames[8],
                    station10: newStationNames[9]
                };
                localStorage.setItem('customStationNames', JSON.stringify(customNames));
                showAlert('Station name changes have been saved successfully!', 'success', 2000);
            } catch (error) {
                showAlert('Error saving station names', 'warning', 2000);
            }
        } else {
            showAlert('No changes to save', 'success', 1500);
        }

        onClose();
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Cargo Management</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <div className="cargo-section">
                        <h3>Station Name Editor</h3>
                        <div className="station-editor">
                            <div className="station-field">
                                <label>Station 8 (Cargo):</label>
                                <input
                                    type="text"
                                    value={station8Name}
                                    onChange={(e) => setStation8Name(e.target.value)}
                                    placeholder="Enter station name"
                                />
                            </div>
                            <div className="station-field">
                                <label>Station 9 (Other):</label>
                                <input
                                    type="text"
                                    value={station9Name}
                                    onChange={(e) => setStation9Name(e.target.value)}
                                    placeholder="Enter station name"
                                />
                            </div>
                            <div className="station-field">
                                <label>Station 10 (Other):</label>
                                <input
                                    type="text"
                                    value={station10Name}
                                    onChange={(e) => setStation10Name(e.target.value)}
                                    placeholder="Enter station name"
                                />
                            </div>
                            <div className="station-actions">
                                <button className="btn-secondary" onClick={resetStationNames}>
                                    Reset to Default
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-primary" onClick={acceptChanges}>
                        Accept Changes
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CargoModal;