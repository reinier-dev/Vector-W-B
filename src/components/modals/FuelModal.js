import React, { useState, useEffect } from 'react';

const FuelModal = ({
    isOpen,
    onClose,
    stations,
    stationWeights,
    stationArms,
    isMetric,
    onUpdateWeight,
    showAlert
}) => {
    const [flightTime, setFlightTime] = useState('');
    const [fuelBurnRate, setFuelBurnRate] = useState('');
    const [reserveFuel, setReserveFuel] = useState('');
    const [fuelTanks, setFuelTanks] = useState([]);
    const [fuelSequence, setFuelSequence] = useState([]);

    useEffect(() => {
        if (isOpen) {
            initializeFuelTanks();
        }
    }, [isOpen, stations, stationWeights, stationArms]);

    if (!isOpen) return null;

    const initializeFuelTanks = () => {
        const tanks = [];
        stations.forEach((station, index) => {
            if (station[2] === 'fuel') {
                const stationNumber = index + 1;
                const weight = stationWeights[stationNumber] || 0;
                const arm = stationArms[stationNumber] || station[1];

                tanks.push({
                    id: stationNumber,
                    name: station[0],
                    arm: arm,
                    weight: weight,
                    priority: index
                });
            }
        });

        setFuelTanks(tanks);
    };

    const calculateFuelConsumption = () => {
        if (!flightTime || !fuelBurnRate) {
            showAlert('Please enter flight time and fuel burn rate.', 'warning');
            return;
        }

        const flightTimeNum = parseFloat(flightTime);
        const burnRateNum = parseFloat(fuelBurnRate);
        const reserveNum = reserveFuel ? parseFloat(reserveFuel) : 0;

        if (isNaN(flightTimeNum) || flightTimeNum <= 0 || isNaN(burnRateNum) || burnRateNum <= 0) {
            showAlert('Please enter valid positive numbers for flight time and fuel burn rate.', 'warning');
            return;
        }

        if (reserveFuel && (isNaN(reserveNum) || reserveNum < 0)) {
            showAlert('Please enter a valid positive number for reserve fuel.', 'warning');
            return;
        }

        const totalFuelNeeded = (flightTimeNum * burnRateNum) + reserveNum;
        const totalFuelAvailable = fuelTanks.reduce((sum, tank) => sum + tank.weight, 0);

        if (totalFuelAvailable < totalFuelNeeded) {
            showAlert(
                `Warning: Not enough fuel! Available: ${totalFuelAvailable.toFixed(1)}, Needed: ${totalFuelNeeded.toFixed(1)}`,
                'warning'
            );
        }

        // Simulate fuel consumption
        const sequence = [];
        let remainingToBurn = flightTimeNum * burnRateNum;
        let timeElapsed = 0;

        const availableTanks = fuelTanks.filter(tank => tank.weight > 0);

        availableTanks.forEach(tank => {
            if (remainingToBurn <= 0) return;

            const fuelFromThisTank = Math.min(tank.weight, remainingToBurn);
            const timeForThisTank = fuelFromThisTank / burnRateNum;

            sequence.push({
                tankName: tank.name,
                startTime: timeElapsed,
                endTime: timeElapsed + timeForThisTank,
                fuelBurned: fuelFromThisTank,
                fuelRemaining: tank.weight - fuelFromThisTank
            });

            remainingToBurn -= fuelFromThisTank;
            timeElapsed += timeForThisTank;
        });

        setFuelSequence(sequence);
        showAlert('Fuel consumption sequence calculated successfully!', 'success');
    };

    const simulateFuelBurn = () => {
        if (fuelSequence.length === 0) {
            showAlert('Please calculate fuel consumption sequence first.', 'warning');
            return;
        }

        // Find landing fuel station
        const landingFuelStation = stations.findIndex(station => station[2] === 'landing_fuel');

        if (landingFuelStation !== -1) {
            const totalBurned = fuelSequence.reduce((sum, step) => sum + step.fuelBurned, 0);
            const reserveNum = reserveFuel ? parseFloat(reserveFuel) : 0;
            const landingFuelWeight = Math.max(0, reserveNum);
            const stationNumber = landingFuelStation + 1;

            onUpdateWeight(stationNumber, landingFuelWeight);
            showAlert(
                `Fuel burn simulation applied. Landing fuel set to ${landingFuelWeight.toFixed(1)} (reserves only).`,
                'success'
            );
        } else {
            showAlert('No landing fuel station found to simulate fuel burn.', 'warning');
        }

        onClose();
    };

    const resetFuelPriorities = () => {
        initializeFuelTanks();
        showAlert('Fuel tank priorities reset to default order.', 'success');
    };

    const weightUnit = isMetric ? 'kg' : 'lb';
    const armUnit = isMetric ? 'm' : 'in';

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Fuel Consumption Sequence</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <div className="fuel-section">
                        <h3>Flight Planning</h3>
                        <div className="fuel-planning">
                            <div className="fuel-field">
                                <label htmlFor="flightTime">Estimated Flight Time (hours):</label>
                                <input
                                    type="number"
                                    id="flightTime"
                                    value={flightTime}
                                    onChange={(e) => setFlightTime(e.target.value)}
                                    step="0.1"
                                    min="0"
                                />
                            </div>
                            <div className="fuel-field">
                                <label htmlFor="fuelBurnRate">Fuel Burn Rate (per hour):</label>
                                <input
                                    type="number"
                                    id="fuelBurnRate"
                                    value={fuelBurnRate}
                                    onChange={(e) => setFuelBurnRate(e.target.value)}
                                    step="0.1"
                                    min="0"
                                />
                            </div>
                            <div className="fuel-field">
                                <label htmlFor="reserveFuel">Reserve Fuel:</label>
                                <input
                                    type="number"
                                    id="reserveFuel"
                                    value={reserveFuel}
                                    onChange={(e) => setReserveFuel(e.target.value)}
                                    step="0.1"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="fuel-actions">
                            <button className="btn-primary" onClick={calculateFuelConsumption}>
                                Calculate Sequence
                            </button>
                            <button className="btn-secondary" onClick={simulateFuelBurn}>
                                Simulate Flight
                            </button>
                        </div>
                    </div>

                    <div className="fuel-section">
                        <h3>Fuel Tank Priorities</h3>
                        <p>Current fuel tank order (consumption priority):</p>
                        <div style={{ minHeight: '200px', border: '2px dashed #ddd', borderRadius: '8px', padding: '15px' }}>
                            {fuelTanks.length === 0 ? (
                                <p>No fuel tanks detected. Add fuel weights to see tank priorities.</p>
                            ) : (
                                fuelTanks.map((tank, index) => (
                                    <div
                                        key={tank.id}
                                        style={{
                                            background: 'white',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            marginBottom: '10px',
                                            border: '1px solid #ddd',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                                {tank.name}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>
                                                Weight: {tank.weight.toFixed(1)} {weightUnit} |
                                                Arm: {tank.arm.toFixed(2)} {armUnit}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: '#2196F3',
                                            color: 'white',
                                            padding: '5px 10px',
                                            borderRadius: '15px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            Priority {index + 1}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="fuel-actions">
                            <button className="btn-secondary" onClick={resetFuelPriorities}>
                                Reset to Default
                            </button>
                        </div>
                    </div>

                    {fuelSequence.length > 0 && (
                        <div className="fuel-section">
                            <h3>Fuel Consumption Sequence</h3>
                            {fuelSequence.map((step, index) => (
                                <div
                                    key={index}
                                    style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '10px',
                                        borderLeft: '4px solid #2196F3'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#2196F3' }}>
                                        Step {index + 1}: {step.tankName}
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '10px',
                                        fontSize: '14px'
                                    }}>
                                        <div>Time: {step.startTime.toFixed(1)} - {step.endTime.toFixed(1)} hrs</div>
                                        <div>Fuel Burned: {step.fuelBurned.toFixed(1)} {weightUnit}</div>
                                        <div>Fuel Remaining: {step.fuelRemaining.toFixed(1)} {weightUnit}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FuelModal;