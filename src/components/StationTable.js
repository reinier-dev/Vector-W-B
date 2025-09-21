import React from 'react';
import { MOMENT_DIVISOR } from '../utils/constants';
import { validateWeightInput } from '../utils/calculations';

const StationTable = ({
    stations,
    stationNames,
    stationWeights,
    stationArms,
    isMetric,
    onWeightChange,
    onArmChange
}) => {
    const weightUnit = isMetric ? 'kg' : 'lb';
    const lengthUnit = isMetric ? 'm' : 'in';
    const momentUnit = isMetric ? 'kg·m' : 'lb·in';

    const handleWeightInputChange = (stationNumber, value) => {
        const weight = parseFloat(value) || 0;

        // Validate weight and show visual feedback
        const issues = validateWeightInput(weight);
        const input = document.getElementById(`weight_${stationNumber}`);

        if (input) {
            input.classList.remove('out-of-limits');
            if (issues.length > 0) {
                input.classList.add('out-of-limits');
            }
        }

        onWeightChange(stationNumber, weight);
    };

    const handleArmInputChange = (stationNumber, value) => {
        const arm = parseFloat(value) || 0;
        onArmChange(stationNumber, arm);
    };

    const calculateMoment = (stationNumber) => {
        const weight = stationWeights[stationNumber] || 0;
        const arm = stationArms[stationNumber] || stations[stationNumber - 1][1];
        return (weight * arm) / MOMENT_DIVISOR;
    };

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Station</th>
                        <th>Weight ({weightUnit})</th>
                        <th>Arm ({lengthUnit})</th>
                        <th>Moment/100 ({momentUnit})</th>
                    </tr>
                </thead>
                <tbody>
                    {stations.map((station, index) => {
                        const stationNumber = index + 1;
                        const [description, defaultArm, type] = station;
                        const displayName = stationNames[index] || description;
                        const weight = stationWeights[stationNumber] || 0;
                        const arm = stationArms[stationNumber] || defaultArm;
                        const moment = calculateMoment(stationNumber);

                        return (
                            <tr key={stationNumber}>
                                <td>{stationNumber}</td>
                                <td className="station-desc">{displayName}</td>
                                <td>
                                    <input
                                        type="number"
                                        id={`weight_${stationNumber}`}
                                        className="weight-input"
                                        value={weight || ''}
                                        step="0.1"
                                        onChange={(e) => handleWeightInputChange(stationNumber, e.target.value)}
                                        placeholder="0"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        id={`arm_${stationNumber}`}
                                        value={arm || ''}
                                        step="0.01"
                                        onChange={(e) => handleArmInputChange(stationNumber, e.target.value)}
                                        placeholder={defaultArm.toString()}
                                    />
                                </td>
                                <td className="moment-cell">
                                    {moment.toFixed(2)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default StationTable;