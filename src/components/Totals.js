import React from 'react';
import { MOMENT_DIVISOR } from '../utils/constants';

const Totals = ({ totals, isMetric }) => {
    const weightUnit = isMetric ? 'kg' : 'lb';
    const lengthUnit = isMetric ? 'm' : 'in';

    return (
        <div className="totals">
            <div className="total-item">
                <div className="total-label">Total Weight</div>
                <div className="total-value">
                    {totals.weight.toFixed(1)} {weightUnit}
                </div>
            </div>
            <div className="total-item">
                <div className="total-label">Total Moment</div>
                <div className="total-value">
                    {(totals.moment / MOMENT_DIVISOR).toFixed(2)}
                </div>
            </div>
            <div className="total-item">
                <div className="total-label">Total ARM</div>
                <div className="total-value">
                    {totals.arm.toFixed(2)} {lengthUnit}
                </div>
            </div>
        </div>
    );
};

export default Totals;