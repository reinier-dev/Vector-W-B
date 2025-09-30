// Constants
        const MOMENT_DIVISOR = 100;
        const IN_TO_M = 0.0254;
        const LB_TO_KG = 0.45359237;

        // MAC Configuration - now with custom formula
        let macConfig = {
            formula: "20 + ((CG - 232.28) / 86.22) * 100",
            macMin: 16,
            macMax: 30
        };

        // Station definitions
        const STATIONS = [
            ["Basic Aircraft", 236.6, "basic"],
            ["Crew (2)", 80.7, "basic"],
            ["Crew's Baggage", 140.0, "basic"],
            ["Steward's Equipment", 140.0, "basic"],
            ["Emergency Equipment", 150.0, "basic"],
            ["Extra Equipment", 150.0, "basic"],
            ["Potable Water", 240.0, "basic"],
            ["Cargo", 460.0, "basic"],
            ["Other", 0.0, "basic"],
            ["Other", 0.0, "basic"],
            ["Fuel Tank InBoard", 246.5, "fuel"],
            ["Fuel Tank OutBoard", 246.5, "fuel"],
            ["Landing Fuel (Est.)", 246.5, "landing_fuel"]
        ];

        // State
        let isMetric = false;
        let history = [];
        let macConfigCollapsed = true;
        let aircraftProfiles = [];
        let currentProfile = null;
        let envelopeCanvas = null;
        let envelopeCtx = null;
        let envelopeViewMode = 'cg-weight'; // 'cg-weight' or 'mac-weight'
        let envelopeData = {
            zfw: { cg: 0, weight: 0, mac: 0 },
            tow: { cg: 0, weight: 0, mac: 0 },
            ldw: { cg: 0, weight: 0, mac: 0 }
        };
        let cargoItems = [];
        let fuelTankPriorities = [];
        let fuelSequenceData = [];

        // Enhanced graph interactivity variables
        let graphTransform = { x: 0, y: 0, scale: 1 };
        let isDragging = false;
        let lastMousePos = { x: 0, y: 0 };
        let hoveredPoint = null;
        let tooltip = null;
        let showFlightPath = true;
        let graphMargin = { top: 20, right: 20, bottom: 40, left: 50 };
        let graphWidth = 0;
        let graphHeight = 0;
        let currentGraphRanges = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };

        // Predefined aircraft templates
        const AIRCRAFT_TEMPLATES = {
            'cessna172': {
                name: 'Cessna 172N',
                description: 'Standard Cessna 172N configuration',
                macConfig: {
                    formula: "((CG - 35.0) / 14.9) * 100",
                    macMin: 15,
                    macMax: 38
                },
                stations: [
                    ["Empty Weight", 39.0, "basic", 1500],
                    ["Pilot", 37.0, "basic", 0],
                    ["Passenger", 37.0, "basic", 0],
                    ["Rear Passenger", 73.0, "basic", 0],
                    ["Baggage Area 1", 95.0, "basic", 0],
                    ["Baggage Area 2", 123.0, "basic", 0],
                    ["Fuel", 48.0, "fuel", 0],
                    ["Oil", 32.0, "basic", 0]
                ]
            },
            'piper28': {
                name: 'Piper PA-28',
                description: 'Standard Piper PA-28 Cherokee configuration',
                macConfig: {
                    formula: "((CG - 86.0) / 13.2) * 100",
                    macMin: 17,
                    macMax: 35
                },
                stations: [
                    ["Empty Weight", 88.8, "basic", 1340],
                    ["Front Seats", 85.5, "basic", 0],
                    ["Rear Seats", 118.1, "basic", 0],
                    ["Baggage", 142.8, "basic", 0],
                    ["Fuel", 95.0, "fuel", 0],
                    ["Oil", 75.0, "basic", 0]
                ]
            },
            'airbus319': {
                name: 'Airbus A319',
                description: 'Standard Airbus A319 configuration',
                macConfig: {
                    formula: "20 + ((CG - 232.28) / 86.22) * 100",
                    macMin: 16,
                    macMax: 30
                },
                stations: [
                    ["Basic Aircraft", 236.6, "basic", 0],
                    ["Crew (2)", 80.7, "basic", 0],
                    ["Crew's Baggage", 140.0, "basic", 0],
                    ["Steward's Equipment", 140.0, "basic", 0],
                    ["Emergency Equipment", 150.0, "basic", 0],
                    ["Extra Equipment", 150.0, "basic", 0],
                    ["Potable Water", 240.0, "basic", 0],
                    ["Cargo", 460.0, "basic", 0],
                    ["Other", 0.0, "basic", 0],
                    ["Other", 0.0, "basic", 0],
                    ["Fuel Tank InBoard", 246.5, "fuel", 0],
                    ["Fuel Tank OutBoard", 246.5, "fuel", 0],
                    ["Landing Fuel (Est.)", 246.5, "landing_fuel", 0]
                ]
            }
        };

        // Initialize the application
        function init() {
            loadAircraftProfiles();
            loadCustomStationNames(); // Load custom station names first
            populateStationTable();
            setupEventListeners();
            validateAndUpdateFormula();
            setupEnvelopeGraph();
            loadData(); // Load saved weight data
            recalculate();
            updateProfileSelect();
            // Start with MAC config collapsed
            toggleMacConfig();
        }

        function populateStationTable() {
            const tbody = document.getElementById('stationTableBody');
            tbody.innerHTML = '';

            STATIONS.forEach((station, index) => {
                const row = document.createElement('tr');
                const [description, arm, type] = station;
                const stationNumber = index + 1;

                // Add data attribute for mobile card view
                row.setAttribute('data-station', `Station ${stationNumber}`);

                row.innerHTML = `
                    <td data-label="#">${stationNumber}</td>
                    <td class="station-desc" data-label="Station">${description}</td>
                    <td data-label="Weight">
                        <input type="number"
                               id="weight_${stationNumber}"
                               class="weight-input"
                               value="0"
                               step="0.1"
                               onchange="validateWeightInput(${stationNumber}); saveData(); recalculate()"
                               oninput="validateWeightInput(${stationNumber}); saveData(); recalculate()">
                    </td>
                    <td data-label="Arm">
                        <input type="number"
                               id="arm_${stationNumber}"
                               value="${arm}"
                               step="0.01"
                               onchange="recalculate()"
                               oninput="recalculate()">
                    </td>
                    <td class="moment-cell" id="moment_${stationNumber}" data-label="Moment">0.00</td>
                `;

                tbody.appendChild(row);
            });
        }

        function setupEventListeners() {
            document.getElementById('unitSwitch').addEventListener('change', toggleUnits);
            document.getElementById('themeSwitch').addEventListener('change', toggleTheme);
        }

        function toggleMacConfig() {
            const toggle = document.getElementById('macToggle');
            const config = document.getElementById('macConfig');

            macConfigCollapsed = !macConfigCollapsed;

            if (macConfigCollapsed) {
                config.style.display = 'none';
                toggle.classList.add('collapsed');
            } else {
                config.style.display = 'grid';
                toggle.classList.remove('collapsed');
            }
        }

        function validateAndUpdateFormula() {
            const formulaInput = document.getElementById('macFormula');
            const formula = formulaInput.value.trim();
            const statusDiv = document.getElementById('formulaStatus');

            try {
                // Test the formula with a sample CG value
                const testCG = 240;
                const testResult = evaluateFormula(formula, testCG);

                if (isNaN(testResult) || !isFinite(testResult)) {
                    throw new Error('Formula produces invalid result');
                }

                // Formula is valid
                macConfig.formula = formula;
                statusDiv.style.background = '#d4edda';
                statusDiv.style.color = '#155724';
                statusDiv.textContent = `✓ Formula valid. Test: CG=${testCG} → %MAC=${testResult.toFixed(2)}%`;

                // Update display
                updateMacFormulaDisplay();
                recalculate();

            } catch (error) {
                // Formula is invalid
                statusDiv.style.background = '#f8d7da';
                statusDiv.style.color = '#721c24';
                statusDiv.textContent = `✗ Invalid formula: ${error.message}`;
            }
        }

        function evaluateFormula(formula, cgValue) {
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

        function updateMacFormulaDisplay() {
            const formulaDisplay = document.getElementById('macFormulaDisplay');
            formulaDisplay.textContent = `Current: %MAC = ${macConfig.formula}`;
        }

        function updateMacLimits() {
            macConfig.macMin = parseFloat(document.getElementById('macMin').value) || 16;
            macConfig.macMax = parseFloat(document.getElementById('macMax').value) || 30;

            const rangeDisplay = document.getElementById('macRangeDisplay');
            rangeDisplay.textContent = `${macConfig.macMin}% ≤ %MAC ≤ ${macConfig.macMax}%`;

            recalculate();
        }

        function resetMacDefaults() {
            document.getElementById('macFormula').value = "20 + ((CG - 232.28) / 86.22) * 100";
            document.getElementById('macMin').value = 16;
            document.getElementById('macMax').value = 30;
            validateAndUpdateFormula();
            updateMacLimits();
        }

        function testFormula() {
            const formula = document.getElementById('macFormula').value.trim();
            const testCG = prompt('Enter a test CG value to test the formula:', '240');

            if (testCG === null) return;

            const cgValue = parseFloat(testCG);
            if (isNaN(cgValue)) {
                alert('Please enter a valid number for CG.');
                return;
            }

            try {
                const result = evaluateFormula(formula, cgValue);
                alert(`Test Result:\nCG = ${cgValue}\n%MAC = ${result.toFixed(4)}%\n\nFormula: ${formula}`);
            } catch (error) {
                alert(`Error testing formula:\n${error.message}`);
            }
        }

        function calculateMacPercentage(cg) {
            try {
                const cgValue = isMetric ? cg / IN_TO_M : cg;
                return evaluateFormula(macConfig.formula, cgValue);
            } catch (error) {
                console.error('Error calculating MAC percentage:', error);
                return 0;
            }
        }

        function getStationData() {
            return STATIONS.map((station, index) => {
                const stationNumber = index + 1;
                const weight = parseFloat(document.getElementById(`weight_${stationNumber}`).value) || 0;
                const arm = parseFloat(document.getElementById(`arm_${stationNumber}`).value) || 0;
                const moment = weight * arm;

                return {
                    number: stationNumber,
                    description: station[0],
                    type: station[2],
                    weight,
                    arm,
                    moment
                };
            });
        }

        function recalculate() {
            const stationData = getStationData();
            let zfwWeight = 0, zfwMoment = 0;
            let fuelWeight = 0, fuelMoment = 0;
            let landingFuelWeight = 0, landingFuelMoment = 0;
            let totalWeight = 0, totalMoment = 0;

            stationData.forEach((station, index) => {
                const stationNumber = index + 1;

                // Update moment display
                document.getElementById(`moment_${stationNumber}`).textContent =
                    (station.moment / MOMENT_DIVISOR).toFixed(2);

                // Accumulate weights and moments
                if (station.type !== 'landing_fuel') {
                    totalWeight += station.weight;
                    totalMoment += station.moment;
                }

                if (station.type === 'fuel') {
                    fuelWeight += station.weight;
                    fuelMoment += station.moment;
                } else if (station.type === 'landing_fuel') {
                    landingFuelWeight = station.weight;
                    landingFuelMoment = station.moment;
                } else {
                    zfwWeight += station.weight;
                    zfwMoment += station.moment;
                }
            });

            // Update totals
            const weightUnit = isMetric ? 'kg' : 'lb';
            const lengthUnit = isMetric ? 'm' : 'in';

            // Calculate total ARM (total moment / total weight)
            let totalArm = 0;
            if (totalWeight > 0) {
                totalArm = totalMoment / totalWeight;
            }

            document.getElementById('totalWeight').textContent = `${totalWeight.toFixed(1)} ${weightUnit}`;
            document.getElementById('totalMoment').textContent = (totalMoment / MOMENT_DIVISOR).toFixed(2);
            document.getElementById('totalArm').textContent = `${totalArm.toFixed(2)} ${lengthUnit}`;

            // Calculate and update fuel totals
            let fuelArm = 0;
            if (fuelWeight > 0) {
                fuelArm = fuelMoment / fuelWeight;
            }

            const fuelWeightEl = document.getElementById('totalFuelWeight');
            const fuelMomentEl = document.getElementById('totalFuelMoment');
            const fuelArmEl = document.getElementById('totalFuelArm');

            if (fuelWeightEl) {
                fuelWeightEl.textContent = `${fuelWeight.toFixed(1)} ${weightUnit}`;
            }
            if (fuelMomentEl) {
                fuelMomentEl.textContent = (fuelMoment / MOMENT_DIVISOR).toFixed(2);
            }
            if (fuelArmEl) {
                fuelArmEl.textContent = fuelWeight > 0 ? `${fuelArm.toFixed(3)} ${lengthUnit}` : `0.000 ${lengthUnit}`;
            }

            // Calculate and update summaries
            updateSummary('zfw', zfwWeight, zfwMoment);
            updateSummary('tow', zfwWeight + fuelWeight, zfwMoment + fuelMoment);
            updateSummary('ldw', zfwWeight + landingFuelWeight, zfwMoment + landingFuelMoment);

            // Update envelope graph
            updateEnvelopeData();

            // Check overall limits with debouncing
            clearTimeout(window.limitsCheckTimeout);
            window.limitsCheckTimeout = setTimeout(checkOverallLimits, 1000);
        }

        function updateSummary(type, weight, moment) {
            const weightUnit = isMetric ? 'kg' : 'lb';
            const lengthUnit = isMetric ? 'm' : 'in';

            let cg = 0, mac = 0;
            if (weight > 0) {
                cg = moment / weight;
                mac = calculateMacPercentage(cg);
            }

            const weightElement = document.getElementById(`${type}Weight`);
            const cgElement = document.getElementById(`${type}CG`);
            const summaryBox = cgElement.closest('.summary-box');

            weightElement.textContent = `W: ${weight.toFixed(1)} ${weightUnit}`;
            cgElement.textContent = `CG: ${cg.toFixed(3)} ${lengthUnit} | %MAC: ${mac.toFixed(2)}%`;

            // Check if within limits
            const isInLimits = mac >= macConfig.macMin && mac <= macConfig.macMax;

            // Update color coding and animations
            cgElement.className = 'summary-cg ' + (isInLimits ? 'cg-ok' : 'cg-warning');

            // Update summary box styling
            if (summaryBox) {
                summaryBox.classList.toggle('out-of-limits', !isInLimits);

                // Remove existing status indicator
                const existingIndicator = summaryBox.querySelector('.status-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }

                // Add status indicator
                const indicator = document.createElement('div');
                indicator.className = `status-indicator ${isInLimits ? 'ok' : 'warning'}`;
                indicator.textContent = isInLimits ? '✓' : '!';
                summaryBox.style.position = 'relative';
                summaryBox.appendChild(indicator);
            }

            // Show alert for critical out-of-limits conditions
            if (!isInLimits && weight > 0) {
                const typeName = type === 'zfw' ? 'Zero Fuel Weight' :
                                type === 'tow' ? 'Take-off Weight' : 'Landing Weight';
                showAlert(`${typeName} CG is outside limits: ${mac.toFixed(2)}%`, 'warning');
            }
        }

        function toggleUnits() {
            const unitSwitch = document.getElementById('unitSwitch');
            const wasMetric = isMetric;
            isMetric = unitSwitch.checked;

            // Convert existing values
            STATIONS.forEach((station, index) => {
                const stationNumber = index + 1;
                const weightInput = document.getElementById(`weight_${stationNumber}`);
                const armInput = document.getElementById(`arm_${stationNumber}`);

                if (isMetric && !wasMetric) {
                    // Convert to metric
                    weightInput.value = (parseFloat(weightInput.value) * LB_TO_KG).toFixed(2);
                    armInput.value = (parseFloat(armInput.value) * IN_TO_M).toFixed(2);
                } else if (!isMetric && wasMetric) {
                    // Convert to imperial
                    weightInput.value = (parseFloat(weightInput.value) / LB_TO_KG).toFixed(2);
                    armInput.value = (parseFloat(armInput.value) / IN_TO_M).toFixed(2);
                }
            });

            // Update headers
            const weightUnit = isMetric ? 'kg' : 'lb';
            const lengthUnit = isMetric ? 'm' : 'in';
            const momentUnit = isMetric ? 'kg·m' : 'lb·in';

            document.getElementById('weightHeader').textContent = `Weight (${weightUnit})`;
            document.getElementById('armHeader').textContent = `Arm (${lengthUnit})`;
            document.getElementById('momentHeader').textContent = `Moment/100 (${momentUnit})`;

            // Note: Formula remains in user's preferred units - they can modify as needed
            recalculate();
        }

        function toggleTheme() {
            const themeSwitch = document.getElementById('themeSwitch');
            if (themeSwitch.checked) {
                document.body.classList.add('light-mode');
            } else {
                document.body.classList.remove('light-mode');
            }
        }

        function clearAll() {
            STATIONS.forEach((station, index) => {
                const stationNumber = index + 1;
                document.getElementById(`weight_${stationNumber}`).value = '0';
            });

            // Also clear cargo items
            cargoItems = [];
            updateCargoInStationTable();

            // Save the cleared data
            saveData();
            recalculate();
        }

        function saveCalculation() {
            const name = prompt('Name this calculation:');
            if (!name) return;

            const stationData = getStationData();

            // Capture the envelope graph as an image
            let envelopeGraphImage = null;
            const canvas = document.getElementById('envelopeCanvas');
            if (canvas) {
                try {
                    envelopeGraphImage = canvas.toDataURL('image/png');
                } catch (error) {
                    console.error('Error capturing envelope graph:', error);
                }
            }

            const calculation = {
                name,
                unit: isMetric ? 'kg-m' : 'lb-in',
                timestamp: new Date().toLocaleString(),
                macConfig: { ...macConfig }, // Save current MAC configuration
                stations: stationData.map((station, index) => ({
                    number: station.number,
                    description: station.description,
                    type: STATIONS[index][2], // Include station type
                    weight: station.weight,
                    arm: station.arm,
                    moment: station.moment
                })),
                summary: {
                    zfw: getSummaryData('zfw'),
                    tow: getSummaryData('tow'),
                    ldw: getSummaryData('ldw')
                },
                envelopeGraph: envelopeGraphImage // Save the graph image
            };

            history.push(calculation);
            alert(`Calculation "${name}" saved successfully!`);
        }

        function getSummaryData(type) {
            const weightElement = document.getElementById(`${type}Weight`);
            const cgElement = document.getElementById(`${type}CG`);
            return {
                weight: weightElement.textContent,
                cg: cgElement.textContent
            };
        }

        function openHistoryModal() {
            const modal = document.getElementById('historyModal');
            const content = document.getElementById('historyContent');

            if (history.length === 0) {
                content.innerHTML = '<p>No saved calculations.</p>';
            } else {
                content.innerHTML = generateHistoryHTML();
            }

            modal.style.display = 'block';
        }

        function closeHistoryModal() {
            document.getElementById('historyModal').style.display = 'none';
        }

        function generateHistoryHTML() {
            let html = '';

            history.forEach((calc, index) => {
                html += `
                    <h3>Calculation: ${calc.name} (${calc.unit}) - ${calc.timestamp}</h3>
                `;

                // Show MAC configuration if available
                if (calc.macConfig) {
                    html += `
                        <h4>MAC Configuration:</h4>
                        <p><strong>Formula:</strong> ${calc.macConfig.formula}</p>
                        <p><strong>Valid Range:</strong> ${calc.macConfig.macMin}% - ${calc.macConfig.macMax}%</p>
                    `;
                }

                html += `
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Station</th>
                                <th>Weight</th>
                                <th>Arm</th>
                                <th>Moment/100</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                calc.stations.forEach(station => {
                    html += `
                        <tr>
                            <td>${station.number}</td>
                            <td style="text-align: left;">${station.description}</td>
                            <td>${station.weight.toFixed(1)}</td>
                            <td>${station.arm.toFixed(2)}</td>
                            <td>${(station.moment / MOMENT_DIVISOR).toFixed(2)}</td>
                        </tr>
                    `;
                });

                html += `
                        </tbody>
                    </table>
                    <h4 style="margin-top: 15px;">Summary</h4>
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Weight</th>
                                <th>CG | %MAC</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Zero Fuel</td>
                                <td>${calc.summary.zfw.weight}</td>
                                <td>${calc.summary.zfw.cg}</td>
                            </tr>
                            <tr>
                                <td>Take-off</td>
                                <td>${calc.summary.tow.weight}</td>
                                <td>${calc.summary.tow.cg}</td>
                            </tr>
                            <tr>
                                <td>Landing</td>
                                <td>${calc.summary.ldw.weight}</td>
                                <td>${calc.summary.ldw.cg}</td>
                            </tr>
                        </tbody>
                    </table>
                    <hr style="margin: 20px 0;">
                `;
            });

            return html;
        }

        function exportHistoryToPDF() {
            if (history.length === 0) {
                alert('No calculations to export.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 15;
            const contentWidth = pageWidth - (2 * margin);

            history.forEach((calc, calcIndex) => {
                if (calcIndex > 0) {
                    doc.addPage();
                }

                let currentY = margin;

                // HEADER SECTION
                doc.setFillColor(33, 150, 243); // Professional blue
                doc.rect(margin, currentY, contentWidth, 25, 'F');

                // Company logo area
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text('WEIGHT & BALANCE', margin + 5, currentY + 10);
                doc.setFontSize(12);
                doc.text('CALCULATION REPORT', margin + 5, currentY + 18);

                // Document info
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const headerInfo = [
                    `Calculation: ${calc.name}`,
                    `Date: ${new Date(calc.timestamp).toLocaleDateString()}`,
                    `Units: ${calc.unit}`,
                    `Page ${calcIndex + 1} of ${history.length}`
                ];

                headerInfo.forEach((info, i) => {
                    doc.text(info, pageWidth - margin - 5, currentY + 7 + (i * 4), { align: 'right' });
                });

                currentY += 35;

                // AIRCRAFT INFORMATION SECTION
                doc.setTextColor(0, 0, 0);
                doc.setFillColor(240, 248, 255);
                doc.rect(margin, currentY, contentWidth, 30, 'F');
                doc.setLineWidth(0.5);
                doc.rect(margin, currentY, contentWidth, 30);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('AIRCRAFT INFORMATION', margin + 5, currentY + 8);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                const leftColumn = margin + 5;
                const rightColumn = margin + (contentWidth / 2);

                // Left column
                doc.text('Aircraft Registration: _______________', leftColumn, currentY + 16);
                doc.text('Aircraft Type: ____________________', leftColumn, currentY + 22);

                // Right column
                doc.text('Flight Number: ___________________', rightColumn, currentY + 16);
                doc.text('Date/Time: _______________________', rightColumn, currentY + 22);

                currentY += 40;

                // MAC CONFIGURATION SECTION
                if (calc.macConfig) {
                    doc.setFillColor(255, 248, 225);
                    doc.rect(margin, currentY, contentWidth, 25, 'F');
                    doc.setLineWidth(0.5);
                    doc.rect(margin, currentY, contentWidth, 25);

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text('MAC CONFIGURATION', margin + 5, currentY + 8);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);

                    // Split formula if too long
                    const formula = calc.macConfig.formula;
                    doc.text('Formula: %MAC = ' + formula, margin + 5, currentY + 16);
                    doc.text(`Valid Range: ${calc.macConfig.macMin}% ≤ %MAC ≤ ${calc.macConfig.macMax}%`,
                             margin + 5, currentY + 21);

                    currentY += 35;
                }

                // WEIGHT AND BALANCE TABLE
                doc.setFillColor(33, 150, 243);
                doc.rect(margin, currentY, contentWidth, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('LOADING SCHEDULE', margin + 5, currentY + 7);

                currentY += 12;
                doc.setTextColor(0, 0, 0);

                // Table headers
                doc.setFillColor(245, 245, 245);
                doc.rect(margin, currentY, contentWidth, 8, 'F');
                doc.setLineWidth(0.3);
                doc.rect(margin, currentY, contentWidth, 8);

                const colWidths = {
                    station: 15,
                    description: 70,
                    weight: 30,
                    arm: 25,
                    moment: 30
                };

                let colX = margin + 2;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text('#', colX, currentY + 5);
                colX += colWidths.station;
                doc.text('STATION', colX, currentY + 5);
                colX += colWidths.description;
                doc.text('WEIGHT', colX, currentY + 5);
                colX += colWidths.weight;
                doc.text('ARM', colX, currentY + 5);
                colX += colWidths.arm;
                doc.text('MOMENT/100', colX, currentY + 5);

                currentY += 10;

                // Table data
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                let rowCount = 0;

                calc.stations.forEach(station => {
                    if (station.weight > 0) {
                        // Check if we need a new page
                        if (currentY > pageHeight - 60) {
                            doc.addPage();
                            currentY = margin + 20;
                        }

                        // Alternating row background
                        if (rowCount % 2 === 0) {
                            doc.setFillColor(250, 250, 250);
                            doc.rect(margin, currentY - 2, contentWidth, 8, 'F');
                        }

                        // Draw cell borders
                        doc.setLineWidth(0.1);
                        doc.setDrawColor(200, 200, 200);
                        doc.rect(margin, currentY - 2, contentWidth, 8);

                        colX = margin + 2;
                        doc.text(station.number.toString(), colX, currentY + 3);
                        colX += colWidths.station;

                        // Truncate description if too long
                        const description = station.description.length > 25 ?
                                          station.description.substring(0, 22) + '...' :
                                          station.description;
                        doc.text(description, colX, currentY + 3);
                        colX += colWidths.description;

                        doc.text(station.weight.toFixed(1), colX, currentY + 3);
                        colX += colWidths.weight;
                        doc.text(station.arm.toFixed(2), colX, currentY + 3);
                        colX += colWidths.arm;
                        doc.text((station.moment / MOMENT_DIVISOR).toFixed(2), colX, currentY + 3);

                        currentY += 8;
                        rowCount++;
                    }
                });

                currentY += 10;

                // FUEL TOTALS SECTION
                if (currentY > pageHeight - 50) {
                    doc.addPage();
                    currentY = margin + 20;
                }

                // Calculate fuel totals
                let totalFuelWeight = 0;
                let totalFuelMoment = 0;
                let totalFuelArm = 0;

                calc.stations.forEach(station => {
                    // Use the type saved in the calculation, or fallback to STATIONS
                    const stationType = station.type || (STATIONS[station.number - 1] ? STATIONS[station.number - 1][2] : 'basic');
                    if (stationType === 'fuel') {
                        totalFuelWeight += station.weight;
                        totalFuelMoment += station.moment;
                    }
                });

                if (totalFuelWeight > 0) {
                    totalFuelArm = totalFuelMoment / totalFuelWeight;
                }

                console.log('PDF Fuel Totals:', { totalFuelWeight, totalFuelMoment, totalFuelArm });

                // Fuel totals box
                doc.setFillColor(225, 240, 255);
                doc.rect(margin, currentY, contentWidth, 20, 'F');
                doc.setLineWidth(0.5);
                doc.setDrawColor(33, 150, 243);
                doc.rect(margin, currentY, contentWidth, 20);

                doc.setTextColor(33, 150, 243);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('⛽ FUEL TOTALS', margin + 5, currentY + 7);

                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                const fuelUnit = calc.unit === 'kg-m' ? 'kg' : 'lb';
                const fuelArmUnit = calc.unit === 'kg-m' ? 'm' : 'in';

                doc.text(`Weight: ${totalFuelWeight.toFixed(1)} ${fuelUnit}`, margin + 5, currentY + 13);
                doc.text(`Moment: ${(totalFuelMoment / MOMENT_DIVISOR).toFixed(2)}`, margin + 60, currentY + 13);
                doc.text(`ARM: ${totalFuelArm.toFixed(3)} ${fuelArmUnit}`, margin + 115, currentY + 13);

                currentY += 28;

                // SUMMARY SECTION
                if (currentY > pageHeight - 80) {
                    doc.addPage();
                    currentY = margin + 20;
                }

                doc.setFillColor(33, 150, 243);
                doc.rect(margin, currentY, contentWidth, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('WEIGHT & BALANCE SUMMARY', margin + 5, currentY + 7);

                currentY += 12;
                doc.setTextColor(0, 0, 0);

                // Summary data
                const summaryData = [
                    ['Zero Fuel Weight', calc.summary.zfw],
                    ['Take-off Weight', calc.summary.tow],
                    ['Landing Weight', calc.summary.ldw]
                ];

                summaryData.forEach((item, i) => {
                    const [label, data] = item;
                    const cgParts = data.cg.split('|');
                    const macValue = cgParts[1] ? parseFloat(cgParts[1].replace('%MAC: ', '').replace('%', '')) : 0;
                    const isInRange = macValue >= calc.macConfig.macMin && macValue <= calc.macConfig.macMax;

                    // Row background
                    const bgColor = isInRange ? [220, 252, 231] : [254, 226, 226];
                    doc.setFillColor(...bgColor);
                    doc.rect(margin, currentY, contentWidth, 12, 'F');

                    // Status indicator
                    const statusColor = isInRange ? [34, 197, 94] : [239, 68, 68];
                    doc.setFillColor(...statusColor);
                    doc.circle(margin + 8, currentY + 6, 3, 'F');

                    // Text
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text(label, margin + 15, currentY + 4);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.text(data.weight, margin + 15, currentY + 8);

                    // CG and MAC
                    doc.text(cgParts[0].trim(), margin + 80, currentY + 4);
                    if (cgParts[1]) {
                        const macColor = isInRange ? [34, 197, 94] : [239, 68, 68];
                        doc.setTextColor(...macColor);
                        doc.setFont('helvetica', 'bold');
                        doc.text(cgParts[1].trim(), margin + 80, currentY + 8);
                        doc.setTextColor(0, 0, 0);
                    }

                    // Status text
                    const statusText = isInRange ? 'WITHIN LIMITS' : 'OUT OF LIMITS';
                    const statusTextColor = isInRange ? [34, 197, 94] : [239, 68, 68];
                    doc.setTextColor(...statusTextColor);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.text(statusText, margin + 140, currentY + 6);
                    doc.setTextColor(0, 0, 0);

                    currentY += 14;
                });

                // CG ENVELOPE GRAPH
                currentY += 5;
                if (currentY > pageHeight - 80) {
                    doc.addPage();
                    currentY = margin + 20;
                }

                doc.setFillColor(33, 150, 243);
                doc.rect(margin, currentY, contentWidth, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('CG ENVELOPE GRAPH', margin + 5, currentY + 7);

                currentY += 12;
                doc.setTextColor(0, 0, 0);

                // Add the envelope graph from saved image
                if (calc.envelopeGraph) {
                    try {
                        // Use saved graph image
                        const graphWidth = contentWidth;
                        const graphHeight = contentWidth * 0.67; // Approximate aspect ratio

                        // Check if we need a new page for the graph
                        if (currentY + graphHeight > pageHeight - 20) {
                            doc.addPage();
                            currentY = margin + 20;
                        }

                        doc.addImage(calc.envelopeGraph, 'PNG', margin, currentY, graphWidth, graphHeight);
                        currentY += graphHeight + 10;
                    } catch (error) {
                        console.error('Error adding envelope graph to PDF:', error);
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(9);
                        doc.text('Graph could not be rendered', margin + 5, currentY + 10);
                        currentY += 20;
                    }
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(9);
                    doc.text('Graph not available (save a new calculation to include graph)', margin + 5, currentY + 10);
                    currentY += 20;
                }

                // APPROVAL SECTION
                currentY += 5;
                const allInRange = summaryData.every(item => {
                    const cgParts = item[1].cg.split('|');
                    if (cgParts[1]) {
                        const macValue = parseFloat(cgParts[1].replace('%MAC: ', '').replace('%', ''));
                        return macValue >= calc.macConfig.macMin && macValue <= calc.macConfig.macMax;
                    }
                    return true;
                });

                const approvalColor = allInRange ? [220, 252, 231] : [254, 226, 226];
                const approvalTextColor = allInRange ? [22, 163, 74] : [185, 28, 28];
                const approvalText = allInRange ? '✓ APPROVED FOR FLIGHT' : '✗ NOT APPROVED - CHECK LIMITS';

                doc.setFillColor(...approvalColor);
                doc.rect(margin, currentY, contentWidth, 15, 'F');
                doc.setLineWidth(1);
                doc.setDrawColor(...approvalTextColor);
                doc.rect(margin, currentY, contentWidth, 15);

                doc.setTextColor(...approvalTextColor);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text(approvalText, pageWidth / 2, currentY + 10, { align: 'center' });

                currentY += 25;

                // CERTIFICATION SECTION
                if (currentY > pageHeight - 50) {
                    doc.addPage();
                    currentY = margin + 20;
                }

                doc.setTextColor(0, 0, 0);
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, currentY, contentWidth, 35, 'F');
                doc.setLineWidth(0.5);
                doc.rect(margin, currentY, contentWidth, 35);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('CERTIFICATION', margin + 5, currentY + 8);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                const certLines = [
                    'Pilot: _________________________________ License: _________________',
                    'Date: _____________ Time: _______ Signature: _____________________',
                    '',
                    'Technician: _____________________________ Cert #: _________________',
                    'Date: _____________ Time: _______ Signature: _____________________'
                ];

                certLines.forEach((line, i) => {
                    doc.text(line, margin + 5, currentY + 15 + (i * 4));
                });

                // FOOTER
                const footerY = pageHeight - 15;
                doc.setFillColor(33, 150, 243);
                doc.rect(margin, footerY, contentWidth, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);

                const timestamp = new Date().toLocaleString();
                doc.text('CONFIDENTIAL - AVIATION CALCULATION REPORT', margin + 2, footerY + 5);
                doc.text(`Generated: ${timestamp}`, pageWidth - margin - 2, footerY + 5, { align: 'right' });
                doc.text(`Document ID: WB-${calc.name.replace(/\s+/g, '-')}-${Date.now()}`,
                         pageWidth / 2, footerY + 5, { align: 'center' });
            });

            const fileName = `Weight-Balance-Report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            // Show success message
            showAlert(`PDF exported successfully: ${fileName}`, 'success', 3000);
        }

        // LocalStorage Data Persistence Functions
        function saveData() {
            try {
                const weightData = [];

                // Recorre todas las estaciones y obtiene los valores de peso
                STATIONS.forEach((station, index) => {
                    const stationNumber = index + 1;
                    const weightInput = document.getElementById(`weight_${stationNumber}`);
                    const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;

                    weightData.push({
                        stationNumber: stationNumber,
                        weight: weight,
                        description: station[0] // Guardamos también la descripción para validación
                    });
                });

                // Guarda en localStorage
                localStorage.setItem('weightBalanceData', JSON.stringify(weightData));

                console.log('Weight data saved to localStorage:', weightData);
            } catch (error) {
                console.error('Error saving weight data:', error);
                showAlert('Error saving data to local storage', 'warning', 2000);
            }
        }

        function loadData() {
            try {
                const savedData = localStorage.getItem('weightBalanceData');

                if (savedData) {
                    const weightData = JSON.parse(savedData);

                    // Carga los datos guardados en los inputs correspondientes
                    weightData.forEach(data => {
                        const weightInput = document.getElementById(`weight_${data.stationNumber}`);
                        if (weightInput) {
                            weightInput.value = data.weight.toFixed(1);
                        }
                    });

                    console.log('Weight data loaded from localStorage:', weightData);
                    showAlert('Previous weight data loaded successfully', 'success', 2000);
                } else {
                    console.log('No saved weight data found in localStorage');
                }
            } catch (error) {
                console.error('Error loading weight data:', error);
                showAlert('Error loading saved data', 'warning', 2000);
            }
        }

        function clearSavedData() {
            try {
                localStorage.removeItem('weightBalanceData');
                console.log('Saved weight data cleared from localStorage');
                showAlert('Saved data cleared successfully', 'success', 2000);
            } catch (error) {
                console.error('Error clearing saved data:', error);
                showAlert('Error clearing saved data', 'warning', 2000);
            }
        }

        // Station Name Management Functions
        function loadStationNames() {
            // Cargar los nombres actuales de las estaciones en los inputs
            document.getElementById('station8Name').value = STATIONS[7][0]; // Station 8 (index 7)
            document.getElementById('station9Name').value = STATIONS[8][0]; // Station 9 (index 8)
            document.getElementById('station10Name').value = STATIONS[9][0]; // Station 10 (index 9)
        }

        function updateStationName(stationNumber) {
            const inputId = `station${stationNumber}Name`;
            const newName = document.getElementById(inputId).value.trim();

            if (newName === '') {
                alert('Station name cannot be empty');
                loadStationNames(); // Restore original name
                return;
            }

            // Update the STATIONS array
            const stationIndex = stationNumber - 1;
            STATIONS[stationIndex][0] = newName;

            // Update the table display
            const stationCell = document.querySelector(`#stationTableBody tr:nth-child(${stationNumber}) .station-desc`);
            if (stationCell) {
                stationCell.textContent = newName;
            }

            // Save the updated station names to localStorage
            saveStationNames();

            showAlert(`Station ${stationNumber} name updated to: ${newName}`, 'success', 2000);
        }

        function resetStationNames() {
            if (confirm('Reset station names to default? This will clear any custom names.')) {
                // Reset to original names
                STATIONS[7][0] = 'Cargo';
                STATIONS[8][0] = 'Other';
                STATIONS[9][0] = 'Other';

                // Update inputs
                loadStationNames();

                // Update table
                populateStationTable();

                // Save changes
                saveStationNames();

                showAlert('Station names reset to default', 'success', 2000);
            }
        }

        function saveStationNames() {
            try {
                const stationNames = {
                    station8: STATIONS[7][0],
                    station9: STATIONS[8][0],
                    station10: STATIONS[9][0]
                };
                localStorage.setItem('customStationNames', JSON.stringify(stationNames));
            } catch (error) {
                console.error('Error saving station names:', error);
            }
        }

        function loadCustomStationNames() {
            try {
                const saved = localStorage.getItem('customStationNames');
                if (saved) {
                    const stationNames = JSON.parse(saved);

                    // Apply saved names
                    if (stationNames.station8) STATIONS[7][0] = stationNames.station8;
                    if (stationNames.station9) STATIONS[8][0] = stationNames.station9;
                    if (stationNames.station10) STATIONS[9][0] = stationNames.station10;

                    console.log('Custom station names loaded:', stationNames);
                }
            } catch (error) {
                console.error('Error loading custom station names:', error);
            }
        }

        // Aircraft Profile Management Functions
        function loadAircraftProfiles() {
            const saved = localStorage.getItem('aircraftProfiles');
            if (saved) {
                try {
                    aircraftProfiles = JSON.parse(saved);
                } catch (e) {
                    console.error('Error loading aircraft profiles:', e);
                    aircraftProfiles = [];
                }
            }
        }

        function saveAircraftProfiles() {
            try {
                localStorage.setItem('aircraftProfiles', JSON.stringify(aircraftProfiles));
            } catch (e) {
                console.error('Error saving aircraft profiles:', e);
                alert('Error saving aircraft profiles. Storage may be full.');
            }
        }

        function updateProfileSelect() {
            const select = document.getElementById('aircraftProfileSelect');
            select.innerHTML = '<option value="">Select Aircraft Profile</option>';

            aircraftProfiles.forEach((profile, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = profile.name;
                select.appendChild(option);
            });
        }

        function openProfileModal() {
            const modal = document.getElementById('profileModal');
            updateProfileList();
            modal.style.display = 'block';
        }

        function closeProfileModal() {
            document.getElementById('profileModal').style.display = 'none';
            document.getElementById('profileName').value = '';
            document.getElementById('profileDescription').value = '';
        }

        function saveCurrentAsProfile() {
            const name = document.getElementById('profileName').value.trim();
            const description = document.getElementById('profileDescription').value.trim();

            if (!name) {
                alert('Please enter a profile name.');
                return;
            }

            // Check if name already exists
            if (aircraftProfiles.some(p => p.name === name)) {
                if (!confirm(`Profile "${name}" already exists. Overwrite?`)) {
                    return;
                }
                // Remove existing profile
                aircraftProfiles = aircraftProfiles.filter(p => p.name !== name);
            }

            const profile = {
                name,
                description,
                macConfig: { ...macConfig },
                stations: STATIONS.map((station, index) => {
                    const stationNumber = index + 1;
                    const weight = parseFloat(document.getElementById(`weight_${stationNumber}`).value) || 0;
                    const arm = parseFloat(document.getElementById(`arm_${stationNumber}`).value) || 0;
                    return [station[0], arm, station[2], weight];
                }),
                unit: isMetric ? 'metric' : 'imperial',
                timestamp: new Date().toISOString()
            };

            aircraftProfiles.push(profile);
            saveAircraftProfiles();
            updateProfileSelect();
            updateProfileList();

            alert(`Profile "${name}" saved successfully!`);
            document.getElementById('profileName').value = '';
            document.getElementById('profileDescription').value = '';
        }

        function loadAircraftProfile() {
            const select = document.getElementById('aircraftProfileSelect');
            const profileIndex = select.value;

            if (profileIndex === '') {
                currentProfile = null;
                return;
            }

            const profile = aircraftProfiles[profileIndex];
            if (!profile) return;

            currentProfile = profile;

            // Load MAC configuration
            macConfig = { ...profile.macConfig };
            document.getElementById('macFormula').value = profile.macConfig.formula;
            document.getElementById('macMin').value = profile.macConfig.macMin;
            document.getElementById('macMax').value = profile.macConfig.macMax;
            validateAndUpdateFormula();
            updateMacLimits();

            // Load station data
            STATIONS.length = 0;
            profile.stations.forEach(station => {
                STATIONS.push([station[0], station[1], station[2]]);
            });

            // Switch units if needed
            const profileIsMetric = profile.unit === 'metric';
            if (profileIsMetric !== isMetric) {
                document.getElementById('unitSwitch').checked = profileIsMetric;
                toggleUnits();
            }

            // Repopulate table and load weights
            populateStationTable();

            // Load saved weights
            profile.stations.forEach((station, index) => {
                const stationNumber = index + 1;
                const weightInput = document.getElementById(`weight_${stationNumber}`);
                if (weightInput && station[3] !== undefined) {
                    weightInput.value = station[3];
                }
            });

            recalculate();
            alert(`Loaded profile: ${profile.name}`);
        }

        function loadTemplate() {
            const templateKey = prompt(`Available templates:\n- cessna172: Cessna 172N\n- piper28: Piper PA-28\n- airbus319: Airbus A319\n\nEnter template key:`);

            if (!templateKey || !AIRCRAFT_TEMPLATES[templateKey]) {
                if (templateKey) alert('Template not found.');
                return;
            }

            const template = AIRCRAFT_TEMPLATES[templateKey];
            document.getElementById('profileName').value = template.name;
            document.getElementById('profileDescription').value = template.description;

            // Apply template configuration
            macConfig = { ...template.macConfig };
            document.getElementById('macFormula').value = template.macConfig.formula;
            document.getElementById('macMin').value = template.macConfig.macMin;
            document.getElementById('macMax').value = template.macConfig.macMax;

            // Apply template stations
            STATIONS.length = 0;
            template.stations.forEach(station => {
                STATIONS.push([station[0], station[1], station[2]]);
            });

            populateStationTable();

            // Load template weights
            template.stations.forEach((station, index) => {
                const stationNumber = index + 1;
                const weightInput = document.getElementById(`weight_${stationNumber}`);
                if (weightInput && station[3] !== undefined) {
                    weightInput.value = station[3];
                }
            });

            validateAndUpdateFormula();
            updateMacLimits();
            recalculate();

            alert(`Template "${template.name}" loaded successfully!`);
        }

        function updateProfileList() {
            const listDiv = document.getElementById('profileList');

            if (aircraftProfiles.length === 0) {
                listDiv.innerHTML = '<p>No saved profiles.</p>';
                return;
            }

            let html = '';
            aircraftProfiles.forEach((profile, index) => {
                html += `
                    <div class="profile-item">
                        <div class="profile-item-header">
                            <span class="profile-item-name">${profile.name}</span>
                            <span style="font-size: 12px; color: #666;">${new Date(profile.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div class="profile-item-description">${profile.description || 'No description'}</div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 10px;">
                            Units: ${profile.unit}, Stations: ${profile.stations.length}, Formula: ${profile.macConfig.formula.substring(0, 30)}...
                        </div>
                        <div class="profile-item-actions">
                            <button class="btn-primary btn-small" onclick="loadProfileByIndex(${index})">Load</button>
                            <button class="btn-secondary btn-small" onclick="duplicateProfile(${index})">Duplicate</button>
                            <button class="btn-danger btn-small" onclick="deleteProfile(${index})">Delete</button>
                        </div>
                    </div>
                `;
            });

            listDiv.innerHTML = html;
        }

        function loadProfileByIndex(index) {
            document.getElementById('aircraftProfileSelect').value = index;
            loadAircraftProfile();
            closeProfileModal();
        }

        function duplicateProfile(index) {
            const profile = aircraftProfiles[index];
            const newName = prompt('Enter name for duplicated profile:', profile.name + ' (Copy)');

            if (!newName) return;

            const newProfile = {
                ...profile,
                name: newName,
                timestamp: new Date().toISOString()
            };

            aircraftProfiles.push(newProfile);
            saveAircraftProfiles();
            updateProfileSelect();
            updateProfileList();

            alert(`Profile duplicated as "${newName}"`);
        }

        function deleteProfile(index) {
            const profile = aircraftProfiles[index];
            if (confirm(`Delete profile "${profile.name}"?`)) {
                aircraftProfiles.splice(index, 1);
                saveAircraftProfiles();
                updateProfileSelect();
                updateProfileList();

                // Clear selection if deleted profile was selected
                const select = document.getElementById('aircraftProfileSelect');
                if (select.value == index) {
                    select.value = '';
                    currentProfile = null;
                }
            }
        }

        // Cargo Management Functions
        function openCargoModal() {
            const modal = document.getElementById('cargoModal');
            loadStationNames();
            modal.style.display = 'block';
        }

        function closeCargoModal() {
            document.getElementById('cargoModal').style.display = 'none';
        }

        function acceptCargoChanges() {
            // Apply all station name changes
            const stations = [
                { number: 8, inputId: 'station8Name' },
                { number: 9, inputId: 'station9Name' },
                { number: 10, inputId: 'station10Name' }
            ];

            let changesApplied = false;

            stations.forEach(station => {
                const newName = document.getElementById(station.inputId).value.trim();

                if (newName && newName !== STATIONS[station.number - 1][0]) {
                    // Update the STATIONS array
                    STATIONS[station.number - 1][0] = newName;

                    // Update the table display
                    const stationCell = document.querySelector(`#stationTableBody tr:nth-child(${station.number}) .station-desc`);
                    if (stationCell) {
                        stationCell.textContent = newName;
                    }

                    changesApplied = true;
                }
            });

            // Save the updated station names to localStorage
            if (changesApplied) {
                saveStationNames();
                showAlert('Station name changes have been saved successfully!', 'success', 2000);
            } else {
                showAlert('No changes to save', 'success', 1500);
            }

            // Close the modal
            closeCargoModal();
        }




        // Close modal when clicking outside
        window.onclick = function(event) {
            const historyModal = document.getElementById('historyModal');
            const profileModal = document.getElementById('profileModal');
            const cargoModal = document.getElementById('cargoModal');

            if (event.target === historyModal) {
                closeHistoryModal();
            }
            if (event.target === profileModal) {
                closeProfileModal();
            }
            if (event.target === cargoModal) {
                closeCargoModal();
            }

            const fuelModal = document.getElementById('fuelModal');
            if (event.target === fuelModal) {
                closeFuelModal();
            }
        }

        // Fuel Sequence Management Functions
        function openFuelModal() {
            const modal = document.getElementById('fuelModal');

            // Clear fuel planning inputs to ensure they show empty
            document.getElementById('flightTime').value = '';
            document.getElementById('fuelBurnRate').value = '';
            document.getElementById('reserveFuel').value = '';

            initializeFuelTanks();
            updateFuelTanksList();
            modal.style.display = 'block';
        }

        function closeFuelModal() {
            document.getElementById('fuelModal').style.display = 'none';
        }

        function initializeFuelTanks() {
            // Find all fuel tanks from the station data
            const fuelTanks = [];
            STATIONS.forEach((station, index) => {
                if (station[2] === 'fuel') {
                    const stationNumber = index + 1;
                    const weightInput = document.getElementById(`weight_${stationNumber}`);
                    const armInput = document.getElementById(`arm_${stationNumber}`);
                    const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
                    const arm = armInput ? parseFloat(armInput.value) || station[1] : station[1];

                    fuelTanks.push({
                        id: stationNumber,
                        name: station[0],
                        arm: arm,
                        weight: weight,
                        priority: fuelTankPriorities.find(p => p.id === stationNumber)?.priority || index
                    });
                }
            });

            // Sort by current priority
            fuelTanks.sort((a, b) => a.priority - b.priority);

            // Update priorities array
            fuelTankPriorities = fuelTanks.map((tank, index) => ({
                id: tank.id,
                priority: index
            }));
        }

        function updateFuelTanksList() {
            const listDiv = document.getElementById('fuelTanksList');

            if (fuelTankPriorities.length === 0) {
                listDiv.innerHTML = '<p>No fuel tanks detected. Add fuel weights to see tank priorities.</p>';
                return;
            }

            const weightUnit = isMetric ? 'kg' : 'lb';
            const armUnit = isMetric ? 'm' : 'in';

            let html = '';
            fuelTankPriorities.forEach((priorityItem, index) => {
                const station = STATIONS[priorityItem.id - 1];
                const weightInput = document.getElementById(`weight_${priorityItem.id}`);
                const armInput = document.getElementById(`arm_${priorityItem.id}`);
                const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
                const arm = armInput ? parseFloat(armInput.value) || station[1] : station[1];

                html += `
                    <div class="fuel-tank-item"
                         draggable="true"
                         data-tank-id="${priorityItem.id}"
                         ondragstart="handleFuelTankDragStart(event)"
                         ondragover="handleFuelTankDragOver(event)"
                         ondrop="handleFuelTankDrop(event)">
                        <div class="fuel-tank-info">
                            <div class="fuel-tank-name">${station[0]}</div>
                            <div class="fuel-tank-details">
                                Weight: ${weight.toFixed(1)} ${weightUnit} |
                                Arm: ${arm.toFixed(2)} ${armUnit}
                            </div>
                        </div>
                        <div class="fuel-priority">Priority ${index + 1}</div>
                    </div>
                `;
            });

            listDiv.innerHTML = html;
        }

        // Drag and drop functions for fuel tank reordering
        let draggedTankId = null;

        function handleFuelTankDragStart(event) {
            draggedTankId = event.target.getAttribute('data-tank-id');
            event.target.classList.add('dragging');
        }

        function handleFuelTankDragOver(event) {
            event.preventDefault();
        }

        function handleFuelTankDrop(event) {
            event.preventDefault();

            const targetTankId = event.currentTarget.getAttribute('data-tank-id');
            if (draggedTankId && targetTankId && draggedTankId !== targetTankId) {
                // Reorder the priorities
                const draggedIndex = fuelTankPriorities.findIndex(p => p.id == draggedTankId);
                const targetIndex = fuelTankPriorities.findIndex(p => p.id == targetTankId);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // Remove dragged item and insert at target position
                    const draggedItem = fuelTankPriorities.splice(draggedIndex, 1)[0];
                    fuelTankPriorities.splice(targetIndex, 0, draggedItem);

                    // Update priorities
                    fuelTankPriorities.forEach((item, index) => {
                        item.priority = index;
                    });

                    updateFuelTanksList();
                }
            }

            // Clean up
            document.querySelectorAll('.fuel-tank-item').forEach(item => {
                item.classList.remove('dragging');
            });
            draggedTankId = null;
        }

        function resetFuelPriorities() {
            initializeFuelTanks();
            updateFuelTanksList();
            alert('Fuel tank priorities reset to default order.');
        }

        function calculateFuelConsumption() {
            const flightTimeValue = document.getElementById('flightTime').value.trim();
            const burnRateValue = document.getElementById('fuelBurnRate').value.trim();
            const reserveValue = document.getElementById('reserveFuel').value.trim();

            if (!flightTimeValue || !burnRateValue) {
                alert('Please enter flight time and fuel burn rate.');
                return;
            }

            const flightTime = parseFloat(flightTimeValue);
            const burnRate = parseFloat(burnRateValue);
            const reserve = reserveValue ? parseFloat(reserveValue) : 0;

            if (isNaN(flightTime) || flightTime <= 0 || isNaN(burnRate) || burnRate <= 0) {
                alert('Please enter valid positive numbers for flight time and fuel burn rate.');
                return;
            }

            if (reserveValue && (isNaN(reserve) || reserve < 0)) {
                alert('Please enter a valid positive number for reserve fuel.');
                return;
            }

            const totalFuelNeeded = (flightTime * burnRate) + reserve;

            // Get current fuel loads
            const fuelTanks = fuelTankPriorities.map(priorityItem => {
                const station = STATIONS[priorityItem.id - 1];
                const weightInput = document.getElementById(`weight_${priorityItem.id}`);
                const armInput = document.getElementById(`arm_${priorityItem.id}`);
                const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
                const arm = armInput ? parseFloat(armInput.value) || station[1] : station[1];

                return {
                    ...priorityItem,
                    name: station[0],
                    arm: arm,
                    weight: weight,
                    remaining: weight
                };
            }).filter(tank => tank.weight > 0);

            const totalFuelAvailable = fuelTanks.reduce((sum, tank) => sum + tank.weight, 0);

            if (totalFuelAvailable < totalFuelNeeded) {
                alert(`Warning: Not enough fuel! Available: ${totalFuelAvailable.toFixed(1)}, Needed: ${totalFuelNeeded.toFixed(1)}`);
            }

            // Simulate fuel consumption
            const sequence = [];
            let remainingToBurn = flightTime * burnRate; // Don't consume reserves
            let timeElapsed = 0;

            fuelTanks.forEach(tank => {
                if (remainingToBurn <= 0) return;

                const fuelFromThisTank = Math.min(tank.remaining, remainingToBurn);
                const timeForThisTank = fuelFromThisTank / burnRate;

                sequence.push({
                    tankName: tank.name,
                    startTime: timeElapsed,
                    endTime: timeElapsed + timeForThisTank,
                    fuelBurned: fuelFromThisTank,
                    fuelRemaining: tank.remaining - fuelFromThisTank
                });

                remainingToBurn -= fuelFromThisTank;
                timeElapsed += timeForThisTank;
            });

            fuelSequenceData = sequence;
            displayFuelSequence();
            calculateCGTravel();
        }

        function simulateFuelBurn() {
            if (fuelSequenceData.length === 0) {
                alert('Please calculate fuel consumption sequence first.');
                return;
            }

            // Apply the fuel consumption to landing fuel
            const landingFuelStations = STATIONS.map((station, index) => ({ station, index })).filter(item =>
                item.station[2] === 'landing_fuel'
            );

            if (landingFuelStations.length > 0) {
                const totalBurned = fuelSequenceData.reduce((sum, step) => sum + step.fuelBurned, 0);
                const reserveValue = document.getElementById('reserveFuel').value.trim();
                const reserve = reserveValue ? parseFloat(reserveValue) : 0;

                const landingFuelWeight = Math.max(0, reserve);
                const stationNumber = landingFuelStations[0].index + 1;
                const landingFuelInput = document.getElementById(`weight_${stationNumber}`);

                if (landingFuelInput) {
                    landingFuelInput.value = landingFuelWeight.toFixed(1);
                    recalculate();
                    alert(`Fuel burn simulation applied. Landing fuel set to ${landingFuelWeight.toFixed(1)} (reserves only).`);
                }
            } else {
                alert('No landing fuel station found to simulate fuel burn.');
            }

            closeFuelModal();
        }

        function displayFuelSequence() {
            const resultsDiv = document.getElementById('fuelSequenceResults');

            if (fuelSequenceData.length === 0) {
                resultsDiv.innerHTML = '<p>No fuel sequence calculated.</p>';
                return;
            }

            const weightUnit = isMetric ? 'kg' : 'lb';

            let html = '<h4>Fuel Consumption Sequence</h4>';

            fuelSequenceData.forEach((step, index) => {
                html += `
                    <div class="fuel-sequence-step">
                        <div class="fuel-sequence-header">Step ${index + 1}: ${step.tankName}</div>
                        <div class="fuel-sequence-details">
                            <div>Time: ${step.startTime.toFixed(1)} - ${step.endTime.toFixed(1)} hrs</div>
                            <div>Fuel Burned: ${step.fuelBurned.toFixed(1)} ${weightUnit}</div>
                            <div>Fuel Remaining: ${step.fuelRemaining.toFixed(1)} ${weightUnit}</div>
                        </div>
                    </div>
                `;
            });

            resultsDiv.innerHTML = html;
        }

        function calculateCGTravel() {
            // This is a simplified CG travel calculation
            // In a real application, this would show how CG changes as fuel is consumed
            const flightTimeValue = document.getElementById('flightTime').value.trim();
            const flightTime = flightTimeValue ? parseFloat(flightTimeValue) : 0;

            if (flightTime > 0) {
                const resultsDiv = document.getElementById('fuelSequenceResults');

                // Calculate current TOW and LDW CG
                const towCG = envelopeData.tow.cg;
                const ldwCG = envelopeData.ldw.cg;
                const cgTravel = Math.abs(towCG - ldwCG);

                const cgAnalysis = `
                    <div class="fuel-sequence-step">
                        <div class="fuel-sequence-header">CG Travel Analysis</div>
                        <div class="fuel-sequence-details">
                            <div>Take-off CG: ${towCG.toFixed(3)} ${isMetric ? 'm' : 'in'}</div>
                            <div>Landing CG: ${ldwCG.toFixed(3)} ${isMetric ? 'm' : 'in'}</div>
                            <div>CG Travel: ${cgTravel.toFixed(3)} ${isMetric ? 'm' : 'in'}</div>
                            <div>Direction: ${towCG > ldwCG ? 'Forward' : 'Aft'}</div>
                        </div>
                    </div>
                `;

                resultsDiv.innerHTML += cgAnalysis;
            }
        }

        // Enhanced Feedback Functions
        function showAlert(message, type = 'warning', duration = 4000) {
            // Remove existing alerts
            const existingAlerts = document.querySelectorAll('.alert-banner');
            existingAlerts.forEach(alert => {
                alert.classList.add('hiding');
                setTimeout(() => alert.remove(), 500);
            });

            // Create new alert
            const alert = document.createElement('div');
            alert.className = `alert-banner ${type}`;
            alert.textContent = message;

            // Add close button
            const closeBtn = document.createElement('span');
            closeBtn.innerHTML = ' ×';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.marginLeft = '10px';
            closeBtn.onclick = () => {
                alert.classList.add('hiding');
                setTimeout(() => alert.remove(), 500);
            };
            alert.appendChild(closeBtn);

            document.body.appendChild(alert);

            // Auto remove after duration
            setTimeout(() => {
                if (document.body.contains(alert)) {
                    alert.classList.add('hiding');
                    setTimeout(() => alert.remove(), 500);
                }
            }, duration);
        }

        function validateWeightInput(stationNumber) {
            const weightInput = document.getElementById(`weight_${stationNumber}`);
            const weight = parseFloat(weightInput.value) || 0;

            // Remove previous styling
            weightInput.classList.remove('out-of-limits');

            // Check weight limits
            if (weight < 0) {
                weightInput.classList.add('out-of-limits');
                showAlert('Weight cannot be negative', 'warning', 2000);
            } else if (weight > 60000) {
                weightInput.classList.add('out-of-limits');
                showAlert(`Weight exceeds maximum limit: ${weight.toFixed(1)}`, 'warning', 3000);
            }
        }

        function checkOverallLimits() {
            const stationData = getStationData();
            let totalWeight = 0;
            let issues = [];

            stationData.forEach(station => {
                if (station.type !== 'landing_fuel') {
                    totalWeight += station.weight;
                }
            });

            // Check maximum total weight limit
            if (totalWeight > 60000) {
                issues.push(`Total weight (${totalWeight.toFixed(1)}) exceeds maximum limit of 60,000`);
            }

            // Check if any MAC values are out of limits
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

            // Show comprehensive alert if there are issues
            if (issues.length > 0) {
                const issueText = issues.join('; ');
                showAlert(`⚠️ FLIGHT SAFETY ALERT: ${issueText}`, 'warning', 8000);
            } else if (totalWeight > 0) {
                // All checks passed
                showAlert('✓ All weight and balance checks passed', 'success', 3000);
            }
        }

        // Envelope Graph Functions
        function setupEnvelopeGraph() {
            envelopeCanvas = document.getElementById('envelopeCanvas');
            envelopeCtx = envelopeCanvas.getContext('2d');

            // Set actual canvas size for crisp rendering
            const rect = envelopeCanvas.getBoundingClientRect();
            envelopeCanvas.width = rect.width * window.devicePixelRatio;
            envelopeCanvas.height = rect.height * window.devicePixelRatio;
            envelopeCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

            // Store graph dimensions
            graphWidth = rect.width - graphMargin.left - graphMargin.right;
            graphHeight = rect.height - graphMargin.top - graphMargin.bottom;

            // Add enhanced interactivity
            setupGraphInteractivity();
            createTooltip();

            drawEnvelopeGraph();
        }

        function drawEnvelopeGraph() {
            if (!envelopeCtx) return;

            const canvas = envelopeCanvas;
            const ctx = envelopeCtx;
            const width = canvas.width / window.devicePixelRatio;
            const height = canvas.height / window.devicePixelRatio;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Define margins
            const margin = { top: 20, right: 20, bottom: 40, left: 50 };
            const graphWidth = width - margin.left - margin.right;
            const graphHeight = height - margin.top - margin.bottom;

            // Determine data ranges based on view mode
            let xLabel, yLabel, xMin, xMax, yMin, yMax;

            if (envelopeViewMode === 'cg-weight') {
                xLabel = isMetric ? 'Center of Gravity (m)' : 'Center of Gravity (in)';
                yLabel = isMetric ? 'Weight (kg)' : 'Weight (lb)';

                // Calculate reasonable ranges
                const cgValues = [envelopeData.zfw.cg, envelopeData.tow.cg, envelopeData.ldw.cg].filter(v => v > 0);
                const weightValues = [envelopeData.zfw.weight, envelopeData.tow.weight, envelopeData.ldw.weight].filter(v => v > 0);

                if (cgValues.length > 0 && weightValues.length > 0) {
                    const cgRange = Math.max(...cgValues) - Math.min(...cgValues);
                    const weightRange = Math.max(...weightValues) - Math.min(...weightValues);

                    xMin = Math.min(...cgValues) - cgRange * 0.1;
                    xMax = Math.max(...cgValues) + cgRange * 0.1;
                    yMin = Math.max(0, Math.min(...weightValues) - weightRange * 0.1);
                    yMax = Math.max(...weightValues) + weightRange * 0.1;
                } else {
                    // Default ranges - adjusted for 60,000 maximum weight
                    xMin = isMetric ? 5 : 200;
                    xMax = isMetric ? 8 : 300;
                    yMin = 0;
                    yMax = 60000;
                }
            } else {
                xLabel = '%MAC';
                yLabel = isMetric ? 'Weight (kg)' : 'Weight (lb)';

                const macValues = [envelopeData.zfw.mac, envelopeData.tow.mac, envelopeData.ldw.mac].filter(v => v > 0);
                const weightValues = [envelopeData.zfw.weight, envelopeData.tow.weight, envelopeData.ldw.weight].filter(v => v > 0);

                xMin = Math.max(0, macConfig.macMin - 5);
                xMax = macConfig.macMax + 5;

                if (weightValues.length > 0) {
                    const weightRange = Math.max(...weightValues) - Math.min(...weightValues);
                    yMin = Math.max(0, Math.min(...weightValues) - weightRange * 0.1);
                    yMax = Math.max(...weightValues) + weightRange * 0.1;
                } else {
                    yMin = 0;
                    yMax = 60000;
                }
            }

            // Store current ranges for interactivity
            currentGraphRanges = { xMin, xMax, yMin, yMax };

            // Draw grid and axes
            ctx.strokeStyle = '#f0f0f0';
            ctx.lineWidth = 1;

            // Vertical grid lines
            for (let i = 0; i <= 10; i++) {
                const x = margin.left + (i / 10) * graphWidth;
                ctx.beginPath();
                ctx.moveTo(x, margin.top);
                ctx.lineTo(x, margin.top + graphHeight);
                ctx.stroke();
            }

            // Horizontal grid lines (avoid label positions)
            for (let i = 0; i <= 10; i++) {
                // Skip lines that would overlap with Y-axis labels (at 0, 2, 4, 6, 8, 10)
                if (i % 2 === 0 && i > 0 && i < 10) continue;

                const y = margin.top + (i / 10) * graphHeight;
                ctx.beginPath();
                ctx.moveTo(margin.left, y);
                ctx.lineTo(margin.left + graphWidth, y);
                ctx.stroke();
            }

            // Draw axes
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;

            // X-axis
            ctx.beginPath();
            ctx.moveTo(margin.left, margin.top + graphHeight);
            ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
            ctx.stroke();

            // Y-axis
            ctx.beginPath();
            ctx.moveTo(margin.left, margin.top);
            ctx.lineTo(margin.left, margin.top + graphHeight);
            ctx.stroke();

            // Draw MAC limits if in CG-Weight mode
            if (envelopeViewMode === 'cg-weight') {
                drawMacLimits(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax);
            } else {
                drawMacLimitsForMacView(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax);
            }

            // Plot data points
            plotDataPoints(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax);

            // Draw labels
            drawAxisLabels(ctx, width, height, margin, xLabel, yLabel, xMin, xMax, yMin, yMax);
        }

        function drawMacLimits(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) {
            // Get actual data points weights
            const dataWeights = [envelopeData.zfw.weight, envelopeData.tow.weight, envelopeData.ldw.weight].filter(w => w > 0);

            if (dataWeights.length === 0) return;

            // Find min and max weights from actual data, then create 2 lines near these extremes
            const minDataWeight = Math.min(...dataWeights);
            const maxDataWeight = Math.max(...dataWeights);

            const weights = [minDataWeight, maxDataWeight];

            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            weights.forEach(weight => {
                if (weight <= 0) return;

                try {
                    // Calculate CG for min and max MAC at this weight
                    const cgForMinMac = calculateCGFromMac(macConfig.macMin);
                    const cgForMaxMac = calculateCGFromMac(macConfig.macMax);

                    if (cgForMinMac && cgForMaxMac) {
                        const y = margin.top + graphHeight - ((weight - yMin) / (yMax - yMin)) * graphHeight;

                        // Only draw if y is within the graph area (not overlapping axes)
                        if (y > margin.top + 1 && y < margin.top + graphHeight - 1) {
                            let xMin_px = margin.left + ((cgForMinMac - xMin) / (xMax - xMin)) * graphWidth;
                            let xMax_px = margin.left + ((cgForMaxMac - xMin) / (xMax - xMin)) * graphWidth;

                            // Clamp line endpoints to not exceed Y-axis boundaries
                            xMin_px = Math.max(margin.left, Math.min(xMin_px, margin.left + graphWidth));
                            xMax_px = Math.max(margin.left, Math.min(xMax_px, margin.left + graphWidth));

                            ctx.beginPath();
                            ctx.moveTo(xMin_px, y);
                            ctx.lineTo(xMax_px, y);
                            ctx.stroke();
                        }
                    }
                } catch (e) {
                    // Skip if calculation fails
                }
            });

            ctx.setLineDash([]);
        }

        function drawMacLimitsForMacView(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) {
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            // Draw MAC min limit - clamp to graph boundaries
            const minMacX = margin.left + ((macConfig.macMin - xMin) / (xMax - xMin)) * graphWidth;
            if (minMacX > margin.left && minMacX < margin.left + graphWidth) {
                ctx.beginPath();
                ctx.moveTo(minMacX, margin.top);
                ctx.lineTo(minMacX, margin.top + graphHeight - 1);
                ctx.stroke();
            }

            // Draw MAC max limit - clamp to graph boundaries
            const maxMacX = margin.left + ((macConfig.macMax - xMin) / (xMax - xMin)) * graphWidth;
            if (maxMacX > margin.left && maxMacX < margin.left + graphWidth) {
                ctx.beginPath();
                ctx.moveTo(maxMacX, margin.top);
                ctx.lineTo(maxMacX, margin.top + graphHeight - 1);
                ctx.stroke();
            }

            ctx.setLineDash([]);
        }

        function calculateCGFromMac(macPercent) {
            try {
                // This is a simplified reverse calculation
                // For more complex formulas, this would need to be solved algebraically
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

        function plotDataPoints(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) {
            const points = [
                { name: 'ZFW', data: envelopeData.zfw, color: '#2196F3' },
                { name: 'TOW', data: envelopeData.tow, color: '#4CAF50' },
                { name: 'LDW', data: envelopeData.ldw, color: '#FF9800' }
            ];

            // Draw flight path if enabled
            if (showFlightPath) {
                drawFlightPath(ctx, points, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax);
            }

            points.forEach(point => {
                if (point.data.weight <= 0) return;

                let x, y;
                if (envelopeViewMode === 'cg-weight') {
                    x = margin.left + ((point.data.cg - xMin) / (xMax - xMin)) * graphWidth;
                } else {
                    x = margin.left + ((point.data.mac - xMin) / (xMax - xMin)) * graphWidth;
                }
                y = margin.top + graphHeight - ((point.data.weight - yMin) / (yMax - yMin)) * graphHeight;

                // Check if point is within limits
                const isInLimits = point.data.mac >= macConfig.macMin && point.data.mac <= macConfig.macMax;

                // Draw point
                ctx.fillStyle = isInLimits ? point.color : '#ff4d4d';
                ctx.beginPath();
                ctx.arc(x, y, hoveredPoint?.name === point.name ? 8 : 6, 0, 2 * Math.PI);
                ctx.fill();

                // Draw border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Highlight hovered point
                if (hoveredPoint?.name === point.name) {
                    ctx.strokeStyle = point.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y, 10, 0, 2 * Math.PI);
                    ctx.stroke();
                }

                // Draw label
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(point.name, x, y - 15);
            });
        }

        function drawFlightPath(ctx, points, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) {
            // Filter points with valid data
            const validPoints = points.filter(p => p.data.weight > 0);
            if (validPoints.length < 2) return;

            // Sort points by flight sequence: ZFW -> TOW -> LDW
            const sequenceOrder = ['ZFW', 'TOW', 'LDW'];
            const sortedPoints = validPoints.sort((a, b) =>
                sequenceOrder.indexOf(a.name) - sequenceOrder.indexOf(b.name)
            );

            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);

            ctx.beginPath();
            for (let i = 0; i < sortedPoints.length; i++) {
                const point = sortedPoints[i];
                let x, y;

                if (envelopeViewMode === 'cg-weight') {
                    x = margin.left + ((point.data.cg - xMin) / (xMax - xMin)) * graphWidth;
                } else {
                    x = margin.left + ((point.data.mac - xMin) / (xMax - xMin)) * graphWidth;
                }
                y = margin.top + graphHeight - ((point.data.weight - yMin) / (yMax - yMin)) * graphHeight;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            // Draw arrows
            for (let i = 0; i < sortedPoints.length - 1; i++) {
                const currentPoint = sortedPoints[i];
                const nextPoint = sortedPoints[i + 1];
                drawArrow(ctx, currentPoint, nextPoint, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax);
            }

            ctx.setLineDash([]);
        }

        function drawArrow(ctx, fromPoint, toPoint, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) {
            let fromX, fromY, toX, toY;

            if (envelopeViewMode === 'cg-weight') {
                fromX = margin.left + ((fromPoint.data.cg - xMin) / (xMax - xMin)) * graphWidth;
                toX = margin.left + ((toPoint.data.cg - xMin) / (xMax - xMin)) * graphWidth;
            } else {
                fromX = margin.left + ((fromPoint.data.mac - xMin) / (xMax - xMin)) * graphWidth;
                toX = margin.left + ((toPoint.data.mac - xMin) / (xMax - xMin)) * graphWidth;
            }

            fromY = margin.top + graphHeight - ((fromPoint.data.weight - yMin) / (yMax - yMin)) * graphHeight;
            toY = margin.top + graphHeight - ((toPoint.data.weight - yMin) / (yMax - yMin)) * graphHeight;

            // Calculate arrow position (midpoint)
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;

            // Calculate arrow direction
            const angle = Math.atan2(toY - fromY, toX - fromX);
            const arrowLength = 8;

            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(
                midX - arrowLength * Math.cos(angle - Math.PI / 6),
                midY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                midX - arrowLength * Math.cos(angle + Math.PI / 6),
                midY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
        }

        function drawAxisLabels(ctx, width, height, margin, xLabel, yLabel, xMin, xMax, yMin, yMax) {
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';

            // X-axis label
            ctx.textAlign = 'center';
            ctx.fillText(xLabel, width / 2, height - 5);

            // Y-axis label
            ctx.save();
            ctx.translate(15, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.fillText(yLabel, 0, 0);
            ctx.restore();

            // X-axis values
            ctx.textAlign = 'center';
            for (let i = 0; i <= 5; i++) {
                const value = xMin + (i / 5) * (xMax - xMin);
                const x = margin.left + (i / 5) * (width - margin.left - margin.right);
                ctx.fillText(value.toFixed(1), x, height - margin.bottom + 15);
            }

            // Y-axis values
            ctx.textAlign = 'right';
            for (let i = 0; i <= 5; i++) {
                const value = yMin + (i / 5) * (yMax - yMin);
                const y = margin.top + (height - margin.top - margin.bottom) - (i / 5) * (height - margin.top - margin.bottom);
                ctx.fillText(Math.round(value), margin.left - 5, y + 4);
            }
        }

        function updateEnvelopeData() {
            const stationData = getStationData();
            let zfwWeight = 0, zfwMoment = 0;
            let fuelWeight = 0, fuelMoment = 0;
            let landingFuelWeight = 0, landingFuelMoment = 0;

            stationData.forEach(station => {
                if (station.type === 'fuel') {
                    fuelWeight += station.weight;
                    fuelMoment += station.moment;
                } else if (station.type === 'landing_fuel') {
                    landingFuelWeight = station.weight;
                    landingFuelMoment = station.moment;
                } else {
                    zfwWeight += station.weight;
                    zfwMoment += station.moment;
                }
            });

            // Calculate CG and MAC for each condition
            envelopeData.zfw = calculateEnvelopePoint(zfwWeight, zfwMoment);
            envelopeData.tow = calculateEnvelopePoint(zfwWeight + fuelWeight, zfwMoment + fuelMoment);
            envelopeData.ldw = calculateEnvelopePoint(zfwWeight + landingFuelWeight, zfwMoment + landingFuelMoment);

            drawEnvelopeGraph();
        }

        function calculateEnvelopePoint(weight, moment) {
            let cg = 0, mac = 0;
            if (weight > 0) {
                cg = moment / weight;
                mac = calculateMacPercentage(cg);
            }
            return { cg, weight, mac };
        }

        function toggleEnvelopeView() {
            envelopeViewMode = envelopeViewMode === 'cg-weight' ? 'mac-weight' : 'cg-weight';
            drawEnvelopeGraph();
        }

        function resetEnvelopeZoom() {
            graphTransform = { x: 0, y: 0, scale: 1 };
            drawEnvelopeGraph();
        }

        // Enhanced Graph Interactivity Functions
        function setupGraphInteractivity() {
            // Mouse move for hover detection
            envelopeCanvas.addEventListener('mousemove', handleMouseMove);

            // Mouse wheel for zoom
            envelopeCanvas.addEventListener('wheel', handleMouseWheel);

            // Mouse down/up/leave for pan
            envelopeCanvas.addEventListener('mousedown', handleMouseDown);
            envelopeCanvas.addEventListener('mousemove', handleMouseDrag);
            envelopeCanvas.addEventListener('mouseup', handleMouseUp);
            envelopeCanvas.addEventListener('mouseleave', handleMouseLeave);

            // Touch events for mobile
            envelopeCanvas.addEventListener('touchstart', handleTouchStart);
            envelopeCanvas.addEventListener('touchmove', handleTouchMove);
            envelopeCanvas.addEventListener('touchend', handleTouchEnd);

            // Click for point interaction
            envelopeCanvas.addEventListener('click', handleCanvasClick);
        }

        function createTooltip() {
            tooltip = document.createElement('div');
            tooltip.className = 'graph-tooltip';
            tooltip.style.display = 'none';
            document.body.appendChild(tooltip);
        }

        function getMousePos(e) {
            const rect = envelopeCanvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        function handleMouseMove(e) {
            if (isDragging) return;

            const mousePos = getMousePos(e);
            const hitPoint = detectPointHit(mousePos);

            if (hitPoint !== hoveredPoint) {
                hoveredPoint = hitPoint;
                updateTooltip(e, hitPoint);
                envelopeCanvas.style.cursor = hitPoint ? 'pointer' : 'default';
            }
        }

        function handleMouseWheel(e) {
            e.preventDefault();

            const mousePos = getMousePos(e);
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

            // Zoom towards mouse position
            graphTransform.scale *= zoomFactor;
            graphTransform.scale = Math.max(0.5, Math.min(5, graphTransform.scale));

            drawEnvelopeGraph();
        }

        function handleMouseDown(e) {
            if (e.button === 0) { // Left click
                isDragging = true;
                lastMousePos = getMousePos(e);
                envelopeCanvas.style.cursor = 'grabbing';
            }
        }

        function handleMouseDrag(e) {
            if (!isDragging) return;

            const currentPos = getMousePos(e);
            const deltaX = currentPos.x - lastMousePos.x;
            const deltaY = currentPos.y - lastMousePos.y;

            graphTransform.x += deltaX;
            graphTransform.y += deltaY;

            lastMousePos = currentPos;
            drawEnvelopeGraph();
        }

        function handleMouseUp(e) {
            isDragging = false;
            envelopeCanvas.style.cursor = hoveredPoint ? 'pointer' : 'default';
        }

        function handleMouseLeave(e) {
            isDragging = false;
            hoveredPoint = null;
            hideTooltip();
            envelopeCanvas.style.cursor = 'default';
        }

        function handleCanvasClick(e) {
            const mousePos = getMousePos(e);
            const hitPoint = detectPointHit(mousePos);

            if (hitPoint) {
                showPointDetails(hitPoint);
            }
        }

        function detectPointHit(mousePos) {
            const points = [
                { name: 'ZFW', data: envelopeData.zfw, color: '#2196F3' },
                { name: 'TOW', data: envelopeData.tow, color: '#4CAF50' },
                { name: 'LDW', data: envelopeData.ldw, color: '#FF9800' }
            ];

            for (const point of points) {
                if (point.data.weight <= 0) continue;

                const screenPos = dataToScreenCoords(
                    point.data,
                    currentGraphRanges.xMin,
                    currentGraphRanges.xMax,
                    currentGraphRanges.yMin,
                    currentGraphRanges.yMax
                );
                const distance = Math.sqrt(
                    Math.pow(mousePos.x - screenPos.x, 2) +
                    Math.pow(mousePos.y - screenPos.y, 2)
                );

                if (distance <= 12) { // 12px hit radius
                    return point;
                }
            }
            return null;
        }

        function dataToScreenCoords(data, xMin, xMax, yMin, yMax) {
            const canvas = envelopeCanvas;
            const width = canvas.width / window.devicePixelRatio;
            const height = canvas.height / window.devicePixelRatio;
            const margin = graphMargin;

            let x, y;
            if (envelopeViewMode === 'cg-weight') {
                x = margin.left + ((data.cg - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
            } else {
                x = margin.left + ((data.mac - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
            }
            y = margin.top + (height - margin.top - margin.bottom) - ((data.weight - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

            return { x, y };
        }

        function updateTooltip(e, point) {
            if (!point) {
                hideTooltip();
                return;
            }

            const weightUnit = isMetric ? 'kg' : 'lb';
            const cgUnit = isMetric ? 'm' : 'in';

            tooltip.innerHTML = `
                <strong>${point.name}</strong><br>
                Weight: ${point.data.weight.toFixed(1)} ${weightUnit}<br>
                CG: ${point.data.cg.toFixed(3)} ${cgUnit}<br>
                %MAC: ${point.data.mac.toFixed(2)}%
            `;

            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY - 10) + 'px';
        }

        function hideTooltip() {
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        }

        function showPointDetails(point) {
            const weightUnit = isMetric ? 'kg' : 'lb';
            const cgUnit = isMetric ? 'm' : 'in';
            const mac = point.data.mac;
            const isInLimits = mac >= macConfig.macMin && mac <= macConfig.macMax;
            const limitStatus = isInLimits ? '✓ Within Limits' : '⚠️ Outside Limits';

            showAlert(
                `${point.name} Details:\n` +
                `Weight: ${point.data.weight.toFixed(1)} ${weightUnit}\n` +
                `CG: ${point.data.cg.toFixed(3)} ${cgUnit}\n` +
                `%MAC: ${point.data.mac.toFixed(2)}% ${limitStatus}`,
                isInLimits ? 'success' : 'warning',
                5000
            );
        }

        // New control functions
        function centerOnPoints() {
            graphTransform = { x: 0, y: 0, scale: 1 };
            drawEnvelopeGraph();
        }

        function toggleFlightPath() {
            showFlightPath = !showFlightPath;
            drawEnvelopeGraph();
        }

        // Touch event handlers (basic implementation)
        function handleTouchStart(e) {
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                lastMousePos = { x: touch.clientX, y: touch.clientY };
                isDragging = true;
            }
        }

        function handleTouchMove(e) {
            e.preventDefault();
            if (isDragging && e.touches.length === 1) {
                const touch = e.touches[0];
                const currentPos = { x: touch.clientX, y: touch.clientY };
                const deltaX = currentPos.x - lastMousePos.x;
                const deltaY = currentPos.y - lastMousePos.y;

                graphTransform.x += deltaX;
                graphTransform.y += deltaY;

                lastMousePos = currentPos;
                drawEnvelopeGraph();
            }
        }

        function handleTouchEnd(e) {
            e.preventDefault();
            isDragging = false;
        }

        // Initialize the app when page loads
        window.onload = init;