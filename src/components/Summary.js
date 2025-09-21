import React from 'react';
import { isWithinMacLimits } from '../utils/calculations';

const Summary = ({ envelopeData, macConfig, isMetric }) => {
    const weightUnit = isMetric ? 'kg' : 'lb';
    const lengthUnit = isMetric ? 'm' : 'in';

    const SummaryBox = ({ title, data, type }) => {
        const { weight, cg, mac } = data;
        const inLimits = weight > 0 ? isWithinMacLimits(mac, macConfig) : true;

        return (
            <div className={`summary-box ${!inLimits ? 'out-of-limits' : ''}`}>
                <div className="summary-title">{title}</div>
                <div className="summary-weight">
                    W: {weight.toFixed(1)} {weightUnit}
                </div>
                <div className={`summary-cg ${inLimits ? 'cg-ok' : 'cg-warning'}`}>
                    CG: {cg.toFixed(3)} {lengthUnit} | %MAC: {mac.toFixed(2)}%
                </div>
                <div className={`status-indicator ${inLimits ? 'ok' : 'warning'}`}>
                    {inLimits ? '✓' : '!'}
                </div>
            </div>
        );
    };

    return (
        <>
            <SummaryBox
                title="Zero Fuel"
                data={envelopeData.zfw}
                type="zfw"
            />
            <SummaryBox
                title="Take-off"
                data={envelopeData.tow}
                type="tow"
            />
            <SummaryBox
                title="Landing"
                data={envelopeData.ldw}
                type="ldw"
            />
        </>
    );
};

export default Summary;