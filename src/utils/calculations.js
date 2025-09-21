import { IN_TO_M } from './constants';

// Formula evaluation function
export function evaluateFormula(formula, cgValue) {
    // Replace CG with the actual value
    let expression = formula.replace(/CG/gi, cgValue.toString());

    // Basic security check - only allow numbers, operators, parentheses, and decimal points
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        throw new Error('Formula contains invalid characters');
    }

    // Evaluate the expression safely
    try {
        return Function('"use strict"; return (' + expression + ')')();
    } catch (e) {
        throw new Error('Mathematical error in formula');
    }
}

// Calculate MAC percentage
export function calculateMacPercentage(cg, macConfig, isMetric) {
    try {
        const cgValue = isMetric ? cg / IN_TO_M : cg;
        return evaluateFormula(macConfig.formula, cgValue);
    } catch (error) {
        console.error('Error calculating MAC percentage:', error);
        return 0;
    }
}

// Validate weight input
export function validateWeightInput(weight) {
    const issues = [];

    if (weight < 0) {
        issues.push('Weight cannot be negative');
    }

    if (weight > 60000) {
        issues.push(`Weight exceeds maximum limit: ${weight.toFixed(1)}`);
    }

    return issues;
}

// Calculate CG from MAC percentage (reverse calculation)
export function calculateCGFromMac(macPercent, macConfig) {
    try {
        const formula = macConfig.formula;

        // For simple linear formulas like "a + ((CG - b) / c) * d = macPercent"
        // We can solve for CG
        if (formula.includes('((CG') && formula.includes(') /')) {
            const parts = formula.match(/([\d\.]+)\s*\+\s*\(\(CG\s*-\s*([\d\.]+)\)\s*\/\s*([\d\.]+)\)\s*\*\s*([\d\.]+)/);
            if (parts) {
                const a = parseFloat(parts[1]);
                const b = parseFloat(parts[2]);
                const c = parseFloat(parts[3]);
                const d = parseFloat(parts[4]);

                // Solve: a + ((CG - b) / c) * d = macPercent
                // CG = ((macPercent - a) * c / d) + b
                return ((macPercent - a) * c / d) + b;
            }
        }
    } catch (e) {
        console.error('Error calculating CG from MAC:', e);
    }
    return null;
}

// Validate MAC formula
export function validateMacFormula(formula) {
    try {
        // Test the formula with a sample CG value
        const testCG = 240;
        const testResult = evaluateFormula(formula, testCG);

        if (isNaN(testResult) || !isFinite(testResult)) {
            throw new Error('Formula produces invalid result');
        }

        return {
            isValid: true,
            testResult,
            testCG,
            message: `✓ Formula valid. Test: CG=${testCG} → %MAC=${testResult.toFixed(2)}%`
        };
    } catch (error) {
        return {
            isValid: false,
            message: `✗ Invalid formula: ${error.message}`
        };
    }
}

// Check if a point is within MAC limits
export function isWithinMacLimits(mac, macConfig) {
    return mac >= macConfig.macMin && mac <= macConfig.macMax;
}

// Calculate station moment
export function calculateMoment(weight, arm) {
    return weight * arm;
}

// Get station data with calculations
export function getStationData(stations, stationWeights, stationArms, stationNames) {
    return stations.map((station, index) => {
        const stationNumber = index + 1;
        const weight = stationWeights[stationNumber] || 0;
        const arm = stationArms[stationNumber] || station[1];
        const moment = calculateMoment(weight, arm);

        return {
            number: stationNumber,
            description: stationNames[index] || station[0],
            type: station[2],
            weight,
            arm,
            moment
        };
    });
}