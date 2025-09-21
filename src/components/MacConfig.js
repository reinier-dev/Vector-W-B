import React, { useState, useEffect } from 'react';
import { validateMacFormula } from '../utils/calculations';

const MacConfig = ({
    macConfig,
    onConfigChange,
    collapsed,
    onToggleCollapse,
    showAlert
}) => {
    const [formulaStatus, setFormulaStatus] = useState({ isValid: true, message: '' });

    useEffect(() => {
        validateAndUpdateFormula(macConfig.formula);
    }, [macConfig.formula]);

    const validateAndUpdateFormula = (formula) => {
        const validation = validateMacFormula(formula);
        setFormulaStatus(validation);

        if (validation.isValid) {
            onConfigChange({
                ...macConfig,
                formula
            });
        }
    };

    const handleFormulaChange = (e) => {
        const formula = e.target.value.trim();
        validateAndUpdateFormula(formula);
    };

    const handleMacMinChange = (e) => {
        const macMin = parseFloat(e.target.value) || 16;
        onConfigChange({
            ...macConfig,
            macMin
        });
    };

    const handleMacMaxChange = (e) => {
        const macMax = parseFloat(e.target.value) || 30;
        onConfigChange({
            ...macConfig,
            macMax
        });
    };

    const resetMacDefaults = () => {
        const defaultConfig = {
            formula: "20 + ((CG - 232.28) / 86.22) * 100",
            macMin: 16,
            macMax: 30
        };
        onConfigChange(defaultConfig);
        showAlert('MAC configuration reset to defaults', 'success', 2000);
    };

    const testFormula = () => {
        const testCG = prompt('Enter a test CG value to test the formula:', '240');

        if (testCG === null) return;

        const cgValue = parseFloat(testCG);
        if (isNaN(cgValue)) {
            showAlert('Please enter a valid number for CG.', 'warning');
            return;
        }

        const validation = validateMacFormula(macConfig.formula);
        if (validation.isValid) {
            try {
                const result = validation.testResult;
                showAlert(
                    `Test Result: CG = ${cgValue}, %MAC = ${result.toFixed(4)}%`,
                    'success',
                    5000
                );
            } catch (error) {
                showAlert(`Error testing formula: ${error.message}`, 'warning');
            }
        } else {
            showAlert('Cannot test invalid formula', 'warning');
        }
    };

    return (
        <>
            <div
                className={`mac-toggle ${collapsed ? 'collapsed' : ''}`}
                onClick={onToggleCollapse}
            >
                <span><strong>%MAC Configuration</strong></span>
                <span className="toggle-icon">▼</span>
            </div>

            {!collapsed && (
                <div className="mac-config">
                    <div className="mac-field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="macFormula">Custom %MAC Formula:</label>
                        <input
                            type="text"
                            id="macFormula"
                            value={macConfig.formula}
                            placeholder="Enter formula using 'CG' as variable. Ex: 20 + ((CG - 232.28) / 86.22) * 100"
                            onChange={handleFormulaChange}
                            style={{
                                width: '100%',
                                fontFamily: "'Courier New', monospace",
                                fontSize: '14px',
                                padding: '12px'
                            }}
                        />
                    </div>

                    <div className="mac-field">
                        <label htmlFor="macMin">MAC Min (%):</label>
                        <input
                            type="number"
                            id="macMin"
                            value={macConfig.macMin}
                            step="0.01"
                            onChange={handleMacMinChange}
                        />
                    </div>

                    <div className="mac-field">
                        <label htmlFor="macMax">MAC Max (%):</label>
                        <input
                            type="number"
                            id="macMax"
                            value={macConfig.macMax}
                            step="0.01"
                            onChange={handleMacMaxChange}
                        />
                    </div>

                    <div className="mac-field">
                        <button className="btn-config" onClick={resetMacDefaults}>
                            Reset Default
                        </button>
                    </div>

                    <div className="mac-field">
                        <button className="btn-config" onClick={testFormula}>
                            Test Formula
                        </button>
                    </div>

                    <div className="mac-formula">
                        <h4>Formula Information:</h4>
                        <div className="mac-formula-text">
                            Current: %MAC = {macConfig.formula}
                        </div>
                        <p>
                            <strong>Valid range:</strong> {macConfig.macMin}% ≤ %MAC ≤ {macConfig.macMax}%
                        </p>
                        <p>
                            <strong>Instructions:</strong> Use 'CG' as the variable for Center of Gravity.
                            Standard math operators: +, -, *, /, (, )
                        </p>
                        <div
                            style={{
                                marginTop: '10px',
                                padding: '8px',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                background: formulaStatus.isValid ? '#d4edda' : '#f8d7da',
                                color: formulaStatus.isValid ? '#155724' : '#721c24'
                            }}
                        >
                            {formulaStatus.message}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MacConfig;