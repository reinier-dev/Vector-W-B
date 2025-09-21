import React, { useState } from 'react';

const ProfileModal = ({
    isOpen,
    onClose,
    aircraftProfiles,
    onSaveProfiles,
    templates,
    currentConfig,
    showAlert
}) => {
    const [profileName, setProfileName] = useState('');
    const [profileDescription, setProfileDescription] = useState('');

    if (!isOpen) return null;

    const saveCurrentAsProfile = () => {
        if (!profileName.trim()) {
            showAlert('Please enter a profile name.', 'warning');
            return;
        }

        // Check if name already exists
        const existingIndex = aircraftProfiles.findIndex(p => p.name === profileName);
        if (existingIndex !== -1) {
            if (!window.confirm(`Profile "${profileName}" already exists. Overwrite?`)) {
                return;
            }
        }

        const profile = {
            name: profileName,
            description: profileDescription,
            macConfig: { ...currentConfig.macConfig },
            stations: currentConfig.stations.map((station, index) => {
                const stationNumber = index + 1;
                const weight = currentConfig.stationWeights[stationNumber] || 0;
                const arm = currentConfig.stationArms[stationNumber] || station[1];
                return [station[0], arm, station[2], weight];
            }),
            unit: currentConfig.isMetric ? 'metric' : 'imperial',
            timestamp: new Date().toISOString()
        };

        const newProfiles = [...aircraftProfiles];
        if (existingIndex !== -1) {
            newProfiles[existingIndex] = profile;
        } else {
            newProfiles.push(profile);
        }

        onSaveProfiles(newProfiles);
        showAlert(`Profile "${profileName}" saved successfully!`, 'success');
        setProfileName('');
        setProfileDescription('');
    };

    const loadTemplate = () => {
        const templateKey = prompt(
            `Available templates:\n- cessna172: Cessna 172N\n- piper28: Piper PA-28\n- airbus319: Airbus A319\n\nEnter template key:`
        );

        if (!templateKey || !templates[templateKey]) {
            if (templateKey) showAlert('Template not found.', 'warning');
            return;
        }

        const template = templates[templateKey];
        setProfileName(template.name);
        setProfileDescription(template.description);

        showAlert(`Template "${template.name}" loaded successfully!`, 'success');
    };

    const loadProfileByIndex = (index) => {
        // This would trigger loading the profile in the main app
        showAlert('Profile loading would be handled by parent component', 'info');
        onClose();
    };

    const duplicateProfile = (index) => {
        const profile = aircraftProfiles[index];
        const newName = prompt('Enter name for duplicated profile:', profile.name + ' (Copy)');

        if (!newName) return;

        const newProfile = {
            ...profile,
            name: newName,
            timestamp: new Date().toISOString()
        };

        onSaveProfiles([...aircraftProfiles, newProfile]);
        showAlert(`Profile duplicated as "${newName}"`, 'success');
    };

    const deleteProfile = (index) => {
        const profile = aircraftProfiles[index];
        if (window.confirm(`Delete profile "${profile.name}"?`)) {
            const newProfiles = aircraftProfiles.filter((_, i) => i !== index);
            onSaveProfiles(newProfiles);
            showAlert(`Profile "${profile.name}" deleted`, 'success');
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Aircraft Profile Management</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <div className="profile-section">
                        <h3>Create New Profile</h3>
                        <div className="profile-form">
                            <div className="profile-field">
                                <label htmlFor="profileName">Profile Name:</label>
                                <input
                                    type="text"
                                    id="profileName"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="e.g., Cessna 172N"
                                />
                            </div>
                            <div className="profile-field">
                                <label htmlFor="profileDescription">Description:</label>
                                <input
                                    type="text"
                                    id="profileDescription"
                                    value={profileDescription}
                                    onChange={(e) => setProfileDescription(e.target.value)}
                                    placeholder="e.g., Standard configuration with dual controls"
                                />
                            </div>
                            <div className="profile-actions">
                                <button className="btn-primary" onClick={saveCurrentAsProfile}>
                                    Save Current Configuration
                                </button>
                                <button className="btn-secondary" onClick={loadTemplate}>
                                    Load from Template
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3>Saved Profiles</h3>
                        {aircraftProfiles.length === 0 ? (
                            <p>No saved profiles.</p>
                        ) : (
                            aircraftProfiles.map((profile, index) => (
                                <div key={index} className="profile-item">
                                    <div className="profile-item-header">
                                        <span className="profile-item-name">{profile.name}</span>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            {new Date(profile.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="profile-item-description">
                                        {profile.description || 'No description'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                                        Units: {profile.unit}, Stations: {profile.stations.length},
                                        Formula: {profile.macConfig.formula.substring(0, 30)}...
                                    </div>
                                    <div className="profile-item-actions">
                                        <button
                                            className="btn-primary btn-small"
                                            onClick={() => loadProfileByIndex(index)}
                                        >
                                            Load
                                        </button>
                                        <button
                                            className="btn-secondary btn-small"
                                            onClick={() => duplicateProfile(index)}
                                        >
                                            Duplicate
                                        </button>
                                        <button
                                            className="btn-danger btn-small"
                                            onClick={() => deleteProfile(index)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;