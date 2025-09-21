import React from 'react';

const HistoryModal = ({ isOpen, onClose, history }) => {
    if (!isOpen) return null;

    const exportToPDF = () => {
        // For now, show an alert - in a real implementation, you'd use jsPDF
        alert('PDF export functionality would be implemented here using jsPDF library');
    };

    const generateHistoryHTML = () => {
        if (history.length === 0) {
            return '<p>No saved calculations.</p>';
        }

        return history.map((calc, index) => `
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
                <h3>Calculation: ${calc.name} (${calc.unit}) - ${calc.timestamp}</h3>

                ${calc.macConfig ? `
                    <h4>MAC Configuration:</h4>
                    <p><strong>Formula:</strong> ${calc.macConfig.formula}</p>
                    <p><strong>Valid Range:</strong> ${calc.macConfig.macMin}% - ${calc.macConfig.macMax}%</p>
                ` : ''}

                <table class="history-table" style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px; border: 1px solid #ddd;">#</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Station</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Weight</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Arm</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Moment/100</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${calc.stations.filter(station => station.weight > 0).map(station => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${station.number}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">${station.description}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${station.weight.toFixed(1)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${station.arm.toFixed(2)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${(station.moment / 100).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h4 style="margin-top: 15px;">Summary</h4>
                <table class="history-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px; border: 1px solid #ddd;">Type</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Weight</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">CG | %MAC</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">Zero Fuel</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${calc.summary.zfw.weight}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${calc.summary.zfw.cg}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">Take-off</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${calc.summary.tow.weight}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${calc.summary.tow.cg}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">Landing</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${calc.summary.ldw.weight}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${calc.summary.ldw.cg}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <hr style="margin: 20px 0;" />
        `).join('');
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Calculation History</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <button className="btn-primary" onClick={exportToPDF} style={{ margin: '10px 0' }}>
                        Export to PDF
                    </button>
                    <div dangerouslySetInnerHTML={{ __html: generateHistoryHTML() }} />
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;