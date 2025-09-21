import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import MacConfig from './components/MacConfig';
import StationTable from './components/StationTable';
import Summary from './components/Summary';
import EnvelopeGraph from './components/EnvelopeGraph';
import Totals from './components/Totals';
import ActionButtons from './components/ActionButtons';
import HistoryModal from './components/modals/HistoryModal';
import ProfileModal from './components/modals/ProfileModal';
import CargoModal from './components/modals/CargoModal';
import FuelModal from './components/modals/FuelModal';
import AlertBanner from './components/AlertBanner';
import { STATIONS, MOMENT_DIVISOR, AIRCRAFT_TEMPLATES } from './utils/constants';
import { evaluateFormula, calculateMacPercentage, validateWeightInput } from './utils/calculations';
import { loadData, saveData, clearSavedData } from './utils/storage';

function App() {
  // Core state
  const [isMetric, setIsMetric] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [stationWeights, setStationWeights] = useState({});
  const [stationArms, setStationArms] = useState({});
  const [stationNames, setStationNames] = useState(STATIONS.map(s => s[0]));

  // MAC Configuration
  const [macConfig, setMacConfig] = useState({
    formula: "20 + ((CG - 232.28) / 86.22) * 100",
    macMin: 16,
    macMax: 30
  });
  const [macConfigCollapsed, setMacConfigCollapsed] = useState(true);

  // Modals
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [cargoModalOpen, setCargoModalOpen] = useState(false);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);

  // Profiles and History
  const [aircraftProfiles, setAircraftProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [history, setHistory] = useState([]);

  // Calculated values
  const [envelopeData, setEnvelopeData] = useState({
    zfw: { cg: 0, weight: 0, mac: 0 },
    tow: { cg: 0, weight: 0, mac: 0 },
    ldw: { cg: 0, weight: 0, mac: 0 }
  });
  const [totals, setTotals] = useState({
    weight: 0,
    moment: 0,
    arm: 0
  });

  // Alerts
  const [alerts, setAlerts] = useState([]);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = () => {
    // Load custom station names
    loadCustomStationNames();

    // Initialize station arms with default values
    const initialArms = {};
    STATIONS.forEach((station, index) => {
      initialArms[index + 1] = station[1];
    });
    setStationArms(initialArms);

    // Load saved data
    const savedData = loadData();
    if (savedData) {
      setStationWeights(savedData);
    }

    // Load aircraft profiles
    loadAircraftProfiles();
  };

  // Load custom station names from localStorage
  const loadCustomStationNames = () => {
    try {
      const saved = localStorage.getItem('customStationNames');
      if (saved) {
        const customNames = JSON.parse(saved);
        const updatedNames = [...stationNames];
        if (customNames.station8) updatedNames[7] = customNames.station8;
        if (customNames.station9) updatedNames[8] = customNames.station9;
        if (customNames.station10) updatedNames[9] = customNames.station10;
        setStationNames(updatedNames);
      }
    } catch (error) {
      console.error('Error loading custom station names:', error);
    }
  };

  // Load aircraft profiles from localStorage
  const loadAircraftProfiles = () => {
    try {
      const saved = localStorage.getItem('aircraftProfiles');
      if (saved) {
        setAircraftProfiles(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading aircraft profiles:', error);
    }
  };

  // Save aircraft profiles to localStorage
  const saveAircraftProfiles = useCallback((profiles) => {
    try {
      localStorage.setItem('aircraftProfiles', JSON.stringify(profiles));
      setAircraftProfiles(profiles);
    } catch (error) {
      console.error('Error saving aircraft profiles:', error);
      showAlert('Error saving aircraft profiles. Storage may be full.', 'warning');
    }
  }, []);

  // Recalculate all values when weights or arms change
  useEffect(() => {
    recalculate();
  }, [stationWeights, stationArms, macConfig, isMetric]);

  const recalculate = () => {
    let zfwWeight = 0, zfwMoment = 0;
    let fuelWeight = 0, fuelMoment = 0;
    let landingFuelWeight = 0, landingFuelMoment = 0;
    let totalWeight = 0, totalMoment = 0;

    STATIONS.forEach((station, index) => {
      const stationNumber = index + 1;
      const weight = stationWeights[stationNumber] || 0;
      const arm = stationArms[stationNumber] || station[1];
      const moment = weight * arm;

      if (station[2] !== 'landing_fuel') {
        totalWeight += weight;
        totalMoment += moment;
      }

      if (station[2] === 'fuel') {
        fuelWeight += weight;
        fuelMoment += moment;
      } else if (station[2] === 'landing_fuel') {
        landingFuelWeight = weight;
        landingFuelMoment = moment;
      } else {
        zfwWeight += weight;
        zfwMoment += moment;
      }
    });

    // Calculate total ARM
    const totalArm = totalWeight > 0 ? totalMoment / totalWeight : 0;

    // Update totals
    setTotals({
      weight: totalWeight,
      moment: totalMoment,
      arm: totalArm
    });

    // Calculate envelope data
    const newEnvelopeData = {
      zfw: calculateEnvelopePoint(zfwWeight, zfwMoment),
      tow: calculateEnvelopePoint(zfwWeight + fuelWeight, zfwMoment + fuelMoment),
      ldw: calculateEnvelopePoint(zfwWeight + landingFuelWeight, zfwMoment + landingFuelMoment)
    };

    setEnvelopeData(newEnvelopeData);

    // Check limits
    setTimeout(() => checkOverallLimits(newEnvelopeData), 1000);
  };

  const calculateEnvelopePoint = (weight, moment) => {
    let cg = 0, mac = 0;
    if (weight > 0) {
      cg = moment / weight;
      mac = calculateMacPercentage(cg, macConfig, isMetric);
    }
    return { cg, weight, mac };
  };

  const checkOverallLimits = (envelopeData) => {
    const issues = [];

    // Check maximum total weight
    if (totals.weight > 60000) {
      issues.push(`Total weight (${totals.weight.toFixed(1)}) exceeds maximum limit`);
    }

    // Check MAC limits
    const macValues = [
      { name: 'Zero Fuel', data: envelopeData.zfw },
      { name: 'Take-off', data: envelopeData.tow },
      { name: 'Landing', data: envelopeData.ldw }
    ];

    macValues.forEach(item => {
      if (item.data.weight > 0) {
        const isInLimits = item.data.mac >= macConfig.macMin && item.data.mac <= macConfig.macMax;
        if (!isInLimits) {
          issues.push(`${item.name} CG (${item.data.mac.toFixed(2)}%) is outside limits`);
        }
      }
    });

    if (issues.length > 0) {
      showAlert(`⚠️ FLIGHT SAFETY ALERT: ${issues.join('; ')}`, 'warning', 8000);
    } else if (totals.weight > 0) {
      showAlert('✓ All weight and balance checks passed', 'success', 3000);
    }
  };

  // Alert system
  const showAlert = (message, type = 'warning', duration = 4000) => {
    const alertId = Date.now();
    const alert = { id: alertId, message, type };

    setAlerts(prev => [...prev, alert]);

    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, duration);
  };

  // Weight input handlers
  const handleWeightChange = (stationNumber, value) => {
    const weight = parseFloat(value) || 0;

    // Validate weight
    if (weight < 0) {
      showAlert('Weight cannot be negative', 'warning', 2000);
    } else if (weight > 60000) {
      showAlert(`Weight exceeds maximum limit: ${weight.toFixed(1)}`, 'warning', 3000);
    }

    setStationWeights(prev => ({
      ...prev,
      [stationNumber]: weight
    }));

    // Save to localStorage
    const newWeights = { ...stationWeights, [stationNumber]: weight };
    saveData(newWeights);
  };

  const handleArmChange = (stationNumber, value) => {
    const arm = parseFloat(value) || 0;
    setStationArms(prev => ({
      ...prev,
      [stationNumber]: arm
    }));
  };

  // Unit conversion
  const toggleUnits = () => {
    const newIsMetric = !isMetric;

    // Convert existing values
    const LB_TO_KG = 0.45359237;
    const IN_TO_M = 0.0254;

    if (newIsMetric && !isMetric) {
      // Convert to metric
      const newWeights = {};
      const newArms = {};

      Object.entries(stationWeights).forEach(([station, weight]) => {
        newWeights[station] = weight * LB_TO_KG;
      });

      Object.entries(stationArms).forEach(([station, arm]) => {
        newArms[station] = arm * IN_TO_M;
      });

      setStationWeights(newWeights);
      setStationArms(newArms);
    } else if (!newIsMetric && isMetric) {
      // Convert to imperial
      const newWeights = {};
      const newArms = {};

      Object.entries(stationWeights).forEach(([station, weight]) => {
        newWeights[station] = weight / LB_TO_KG;
      });

      Object.entries(stationArms).forEach(([station, arm]) => {
        newArms[station] = arm / IN_TO_M;
      });

      setStationWeights(newWeights);
      setStationArms(newArms);
    }

    setIsMetric(newIsMetric);
  };

  // Clear functions
  const clearAll = () => {
    setStationWeights({});
    saveData({});
    showAlert('All weights cleared', 'success', 2000);
  };

  const handleClearSavedData = () => {
    clearSavedData();
    showAlert('Saved data cleared successfully', 'success', 2000);
  };

  // Save calculation to history
  const saveCalculation = () => {
    const name = prompt('Name this calculation:');
    if (!name) return;

    const calculation = {
      name,
      unit: isMetric ? 'kg-m' : 'lb-in',
      timestamp: new Date().toLocaleString(),
      macConfig: { ...macConfig },
      stations: STATIONS.map((station, index) => {
        const stationNumber = index + 1;
        const weight = stationWeights[stationNumber] || 0;
        const arm = stationArms[stationNumber] || station[1];
        return {
          number: stationNumber,
          description: stationNames[index],
          weight,
          arm,
          moment: weight * arm
        };
      }),
      summary: {
        zfw: {
          weight: `W: ${envelopeData.zfw.weight.toFixed(1)} ${isMetric ? 'kg' : 'lb'}`,
          cg: `CG: ${envelopeData.zfw.cg.toFixed(3)} ${isMetric ? 'm' : 'in'} | %MAC: ${envelopeData.zfw.mac.toFixed(2)}%`
        },
        tow: {
          weight: `W: ${envelopeData.tow.weight.toFixed(1)} ${isMetric ? 'kg' : 'lb'}`,
          cg: `CG: ${envelopeData.tow.cg.toFixed(3)} ${isMetric ? 'm' : 'in'} | %MAC: ${envelopeData.tow.mac.toFixed(2)}%`
        },
        ldw: {
          weight: `W: ${envelopeData.ldw.weight.toFixed(1)} ${isMetric ? 'kg' : 'lb'}`,
          cg: `CG: ${envelopeData.ldw.cg.toFixed(3)} ${isMetric ? 'm' : 'in'} | %MAC: ${envelopeData.ldw.mac.toFixed(2)}%`
        }
      }
    };

    setHistory(prev => [...prev, calculation]);
    showAlert(`Calculation "${name}" saved successfully!`, 'success', 3000);
  };

  return (
    <div className={`app ${isLightMode ? 'light-mode' : ''}`}>
      <div className="container">
        <Header
          isMetric={isMetric}
          isLightMode={isLightMode}
          aircraftProfiles={aircraftProfiles}
          currentProfile={currentProfile}
          onToggleUnits={toggleUnits}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          onProfileChange={setCurrentProfile}
          onOpenProfileModal={() => setProfileModalOpen(true)}
          onLoadProfile={(profile) => {
            // Load profile logic here
            setCurrentProfile(profile);
            setMacConfig(profile.macConfig);
            // Load station data, weights, etc.
            showAlert(`Loaded profile: ${profile.name}`, 'success');
          }}
        />

        <MacConfig
          macConfig={macConfig}
          onConfigChange={setMacConfig}
          collapsed={macConfigCollapsed}
          onToggleCollapse={() => setMacConfigCollapsed(!macConfigCollapsed)}
          showAlert={showAlert}
        />

        <div className="main-content">
          <StationTable
            stations={STATIONS}
            stationNames={stationNames}
            stationWeights={stationWeights}
            stationArms={stationArms}
            isMetric={isMetric}
            onWeightChange={handleWeightChange}
            onArmChange={handleArmChange}
          />

          <div className="summary-container">
            <Summary
              envelopeData={envelopeData}
              macConfig={macConfig}
              isMetric={isMetric}
            />
            <EnvelopeGraph
              envelopeData={envelopeData}
              macConfig={macConfig}
              isMetric={isMetric}
            />
          </div>
        </div>

        <Totals
          totals={totals}
          isMetric={isMetric}
        />

        <ActionButtons
          onClear={clearAll}
          onClearSaved={handleClearSavedData}
          onOpenCargo={() => setCargoModalOpen(true)}
          onOpenFuel={() => setFuelModalOpen(true)}
          onOpenHistory={() => setHistoryModalOpen(true)}
          onSaveCalculation={saveCalculation}
          onExit={() => window.close()}
        />
      </div>

      {/* Modals */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        history={history}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        aircraftProfiles={aircraftProfiles}
        onSaveProfiles={saveAircraftProfiles}
        templates={AIRCRAFT_TEMPLATES}
        currentConfig={{
          macConfig,
          stations: STATIONS,
          stationWeights,
          stationArms,
          isMetric
        }}
        showAlert={showAlert}
      />

      <CargoModal
        isOpen={cargoModalOpen}
        onClose={() => setCargoModalOpen(false)}
        stationNames={stationNames}
        onUpdateStationNames={setStationNames}
        showAlert={showAlert}
      />

      <FuelModal
        isOpen={fuelModalOpen}
        onClose={() => setFuelModalOpen(false)}
        stations={STATIONS}
        stationWeights={stationWeights}
        stationArms={stationArms}
        isMetric={isMetric}
        onUpdateWeight={handleWeightChange}
        showAlert={showAlert}
      />

      {/* Alert Banners */}
      {alerts.map(alert => (
        <AlertBanner
          key={alert.id}
          message={alert.message}
          type={alert.type}
          onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
        />
      ))}
    </div>
  );
}

export default App;