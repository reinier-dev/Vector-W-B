// LocalStorage Data Persistence Functions

export function saveData(weightData) {
    try {
        localStorage.setItem('weightBalanceData', JSON.stringify(weightData));
        console.log('Weight data saved to localStorage:', weightData);
    } catch (error) {
        console.error('Error saving weight data:', error);
        throw new Error('Error saving data to local storage');
    }
}

export function loadData() {
    try {
        const savedData = localStorage.getItem('weightBalanceData');
        if (savedData) {
            const weightData = JSON.parse(savedData);
            console.log('Weight data loaded from localStorage:', weightData);
            return weightData;
        }
        console.log('No saved weight data found in localStorage');
        return null;
    } catch (error) {
        console.error('Error loading weight data:', error);
        throw new Error('Error loading saved data');
    }
}

export function clearSavedData() {
    try {
        localStorage.removeItem('weightBalanceData');
        console.log('Saved weight data cleared from localStorage');
    } catch (error) {
        console.error('Error clearing saved data:', error);
        throw new Error('Error clearing saved data');
    }
}

// Station Name Management Functions
export function saveStationNames(stationNames) {
    try {
        const customNames = {
            station8: stationNames[7],
            station9: stationNames[8],
            station10: stationNames[9]
        };
        localStorage.setItem('customStationNames', JSON.stringify(customNames));
    } catch (error) {
        console.error('Error saving station names:', error);
    }
}

export function loadStationNames() {
    try {
        const saved = localStorage.getItem('customStationNames');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    } catch (error) {
        console.error('Error loading custom station names:', error);
        return null;
    }
}

// Aircraft Profile Management Functions
export function saveAircraftProfiles(profiles) {
    try {
        localStorage.setItem('aircraftProfiles', JSON.stringify(profiles));
    } catch (error) {
        console.error('Error saving aircraft profiles:', error);
        throw new Error('Error saving aircraft profiles. Storage may be full.');
    }
}

export function loadAircraftProfiles() {
    try {
        const saved = localStorage.getItem('aircraftProfiles');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    } catch (error) {
        console.error('Error loading aircraft profiles:', error);
        return [];
    }
}

// History Management Functions
export function saveHistory(history) {
    try {
        localStorage.setItem('calculationHistory', JSON.stringify(history));
    } catch (error) {
        console.error('Error saving calculation history:', error);
        throw new Error('Error saving calculation history');
    }
}

export function loadHistory() {
    try {
        const saved = localStorage.getItem('calculationHistory');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    } catch (error) {
        console.error('Error loading calculation history:', error);
        return [];
    }
}