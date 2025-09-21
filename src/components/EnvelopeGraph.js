import React, { useRef, useEffect, useState } from 'react';
import { calculateCGFromMac, isWithinMacLimits } from '../utils/calculations';

const EnvelopeGraph = ({ envelopeData, macConfig, isMetric }) => {
    const canvasRef = useRef(null);
    const [viewMode, setViewMode] = useState('cg-weight'); // 'cg-weight' or 'mac-weight'
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [showFlightPath, setShowFlightPath] = useState(true);
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

    useEffect(() => {
        drawGraph();
    }, [envelopeData, macConfig, isMetric, viewMode, showFlightPath]);

    const drawGraph = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

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

        if (viewMode === 'cg-weight') {
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
                // Default ranges
                xMin = isMetric ? 5 : 200;
                xMax = isMetric ? 8 : 300;
                yMin = 0;
                yMax = 60000;
            }
        } else {
            xLabel = '%MAC';
            yLabel = isMetric ? 'Weight (kg)' : 'Weight (lb)';

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

        // Draw grid
        drawGrid(ctx, margin, graphWidth, graphHeight);

        // Draw axes
        drawAxes(ctx, margin, graphWidth, graphHeight);

        // Draw MAC limits
        drawMacLimits(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax);

        // Plot data points
        plotDataPoints(ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax);

        // Draw labels
        drawAxisLabels(ctx, width, height, margin, xLabel, yLabel, xMin, xMax, yMin, yMax);
    };

    const drawGrid = (ctx, margin, graphWidth, graphHeight) => {
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

        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            if (i % 2 === 0 && i > 0 && i < 10) continue;
            const y = margin.top + (i / 10) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + graphWidth, y);
            ctx.stroke();
        }
    };

    const drawAxes = (ctx, margin, graphWidth, graphHeight) => {
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
    };

    const drawMacLimits = (ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) => {
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        if (viewMode === 'mac-weight') {
            // Draw MAC min limit
            const minMacX = margin.left + ((macConfig.macMin - xMin) / (xMax - xMin)) * graphWidth;
            if (minMacX > margin.left && minMacX < margin.left + graphWidth) {
                ctx.beginPath();
                ctx.moveTo(minMacX, margin.top);
                ctx.lineTo(minMacX, margin.top + graphHeight - 1);
                ctx.stroke();
            }

            // Draw MAC max limit
            const maxMacX = margin.left + ((macConfig.macMax - xMin) / (xMax - xMin)) * graphWidth;
            if (maxMacX > margin.left && maxMacX < margin.left + graphWidth) {
                ctx.beginPath();
                ctx.moveTo(maxMacX, margin.top);
                ctx.lineTo(maxMacX, margin.top + graphHeight - 1);
                ctx.stroke();
            }
        } else {
            // Draw MAC limits for CG-weight view
            const dataWeights = [envelopeData.zfw.weight, envelopeData.tow.weight, envelopeData.ldw.weight].filter(w => w > 0);
            if (dataWeights.length > 0) {
                const minDataWeight = Math.min(...dataWeights);
                const maxDataWeight = Math.max(...dataWeights);

                [minDataWeight, maxDataWeight].forEach(weight => {
                    if (weight <= 0) return;

                    try {
                        const cgForMinMac = calculateCGFromMac(macConfig.macMin, macConfig);
                        const cgForMaxMac = calculateCGFromMac(macConfig.macMax, macConfig);

                        if (cgForMinMac && cgForMaxMac) {
                            const y = margin.top + graphHeight - ((weight - yMin) / (yMax - yMin)) * graphHeight;

                            if (y > margin.top + 1 && y < margin.top + graphHeight - 1) {
                                let xMin_px = margin.left + ((cgForMinMac - xMin) / (xMax - xMin)) * graphWidth;
                                let xMax_px = margin.left + ((cgForMaxMac - xMin) / (xMax - xMin)) * graphWidth;

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
            }
        }

        ctx.setLineDash([]);
    };

    const plotDataPoints = (ctx, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) => {
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
            if (viewMode === 'cg-weight') {
                x = margin.left + ((point.data.cg - xMin) / (xMax - xMin)) * graphWidth;
            } else {
                x = margin.left + ((point.data.mac - xMin) / (xMax - xMin)) * graphWidth;
            }
            y = margin.top + graphHeight - ((point.data.weight - yMin) / (yMax - yMin)) * graphHeight;

            const inLimits = isWithinMacLimits(point.data.mac, macConfig);

            // Draw point
            ctx.fillStyle = inLimits ? point.color : '#ff4d4d';
            ctx.beginPath();
            ctx.arc(x, y, hoveredPoint?.name === point.name ? 8 : 6, 0, 2 * Math.PI);
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(point.name, x, y - 15);
        });
    };

    const drawFlightPath = (ctx, points, margin, graphWidth, graphHeight, xMin, xMax, yMin, yMax) => {
        const validPoints = points.filter(p => p.data.weight > 0);
        if (validPoints.length < 2) return;

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

            if (viewMode === 'cg-weight') {
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
        ctx.setLineDash([]);
    };

    const drawAxisLabels = (ctx, width, height, margin, xLabel, yLabel, xMin, xMax, yMin, yMax) => {
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
    };

    const toggleView = () => {
        setViewMode(viewMode === 'cg-weight' ? 'mac-weight' : 'cg-weight');
    };

    const toggleFlightPath = () => {
        setShowFlightPath(!showFlightPath);
    };

    const resetZoom = () => {
        // Reset zoom functionality would go here
        drawGraph();
    };

    const centerOnPoints = () => {
        // Center on points functionality would go here
        drawGraph();
    };

    return (
        <div className="envelope-graph-container">
            <div className="summary-title">CG Envelope Graph</div>
            <canvas
                ref={canvasRef}
                width={300}
                height={200}
                style={{ width: '100%', height: '200px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '10px', cursor: 'crosshair' }}
            />
            <div className="graph-controls">
                <button className="btn-secondary btn-small" onClick={toggleView}>
                    Toggle View
                </button>
                <button className="btn-secondary btn-small" onClick={resetZoom}>
                    Reset Zoom
                </button>
                <button className="btn-secondary btn-small" onClick={centerOnPoints}>
                    Center on Data
                </button>
                <button className="btn-secondary btn-small" onClick={toggleFlightPath}>
                    Flight Path
                </button>
            </div>
            <div className="graph-info">
                Hover over points for details • Scroll to zoom • Drag to pan
            </div>
        </div>
    );
};

export default EnvelopeGraph;