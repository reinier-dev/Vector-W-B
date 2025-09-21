import React from 'react';

const Header = ({
    isMetric,
    isLightMode,
    aircraftProfiles,
    currentProfile,
    onToggleUnits,
    onToggleTheme,
    onProfileChange,
    onOpenProfileModal,
    onLoadProfile
}) => {
    const handleProfileSelect = (e) => {
        const profileIndex = e.target.value;
        if (profileIndex === '') {
            onProfileChange(null);
            return;
        }

        const profile = aircraftProfiles[profileIndex];
        if (profile) {
            onLoadProfile(profile);
        }
    };

    return (
        <div className="header">
            <h1>Vector W&B – Form F</h1>
            <div className="controls">
                <div className="profile-controls">
                    <select
                        className="profile-select"
                        value={currentProfile ? aircraftProfiles.indexOf(currentProfile) : ''}
                        onChange={handleProfileSelect}
                    >
                        <option value="">Select Aircraft Profile</option>
                        {aircraftProfiles.map((profile, index) => (
                            <option key={index} value={index}>
                                {profile.name}
                            </option>
                        ))}
                    </select>
                    <button className="btn-config" onClick={onOpenProfileModal}>
                        Manage Profiles
                    </button>
                </div>

                <div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isMetric}
                            onChange={onToggleUnits}
                        />
                        <span className="slider"></span>
                    </label>
                    <span className="switch-label">Metric (kg/m)</span>
                </div>

                <div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isLightMode}
                            onChange={onToggleTheme}
                        />
                        <span className="slider"></span>
                    </label>
                    <span className="switch-label">Light mode</span>
                </div>
            </div>
        </div>
    );
};

export default Header;