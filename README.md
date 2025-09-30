# Vector W&B - Weight & Balance Calculator

A professional web-based Weight & Balance calculator for aircraft, featuring an intuitive interface with real-time calculations, CG envelope visualization, and comprehensive fuel management capabilities.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### Core Functionality
- **Real-time Weight & Balance Calculations** - Instant computation of weight, moment, arm, and center of gravity
- **Interactive CG Envelope Graph** - Visual representation of aircraft CG with zoom, pan, and flight path tracking
- **Custom %MAC Formula Configuration** - Define and validate custom Mean Aerodynamic Chord formulas
- **Dual Unit System** - Switch seamlessly between Imperial (lb/in) and Metric (kg/m) units
- **Light/Dark Mode** - Professional aviation-themed interface with Apple-inspired design

### Advanced Features
- **Aircraft Profile Management** - Save and load multiple aircraft configurations
- **Fuel Consumption Sequencing** - Drag-and-drop fuel tank priority management with CG travel analysis
- **Cargo Management** - Customizable station names and cargo configurations
- **Calculation History** - Save, view, and export past calculations to PDF
- **Real-time Validation** - Visual alerts and warnings for out-of-limit conditions
- **Cross-browser Compatible** - Works on Chrome, Firefox, Safari, Edge, and IE11+

## Screenshots

### Main Interface
Professional aviation-themed design with glassmorphism effects and real-time calculations.

### CG Envelope Graph
Interactive visualization showing Zero Fuel Weight, Take-off Weight, and Landing Weight positions relative to the aircraft's CG envelope.

### Fuel Sequence Planning
Advanced fuel burn simulation with drag-and-drop tank priority management.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/reinier-dev/Vector-W-B.git
cd Vector-W-B
```

2. Open `index.html` in your web browser:
```bash
open index.html
```

Or serve it using a local web server:
```bash
python -m http.server 8000
# Then navigate to http://localhost:8000
```

## Usage

### Basic Operation

1. **Configure Aircraft Profile**
   - Click "Manage Profiles" to create or load an aircraft configuration
   - Set up stations with their respective arms and weight limits

2. **Enter Weight Data**
   - Input weights for each station (pilot, passengers, cargo, fuel)
   - Watch real-time updates of total weight, moment, and CG position

3. **Monitor CG Status**
   - Check the summary boxes for Zero Fuel, Take-off, and Landing weights
   - View the CG Envelope Graph to ensure all points are within limits
   - Green indicators show safe conditions, red indicates out-of-limits

4. **Fuel Planning**
   - Click "Fuel Sequence" to configure fuel burn priorities
   - Simulate flight fuel consumption and CG travel
   - Ensure CG remains within limits throughout the flight

5. **Save & Export**
   - Click "Save Calculation" to store the current configuration
   - Use "View History" to access past calculations
   - Export to PDF for flight documentation

### Custom MAC Formula

The %MAC (Percent Mean Aerodynamic Chord) can be customized:

1. Expand the "%MAC Configuration" section
2. Enter your formula using 'CG' as the variable
3. Example: `20 + ((CG - 232.28) / 86.22) * 100`
4. Set MAC Min and Max limits
5. Click "Test Formula" to validate

## Technical Details

### Technologies Used
- Pure HTML5, CSS3, and JavaScript (ES5+ compatible)
- HTML5 Canvas for graph rendering
- jsPDF for PDF export functionality
- LocalStorage for data persistence
- CSS backdrop-filter for glassmorphism effects

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 10+)
- Internet Explorer 11: ✅ Supported with vendor prefixes

### Color Palette
Professional aviation-inspired design:
- **Aviation Blue**: #003D5B, #0A6A8C
- **Space Gray**: #1C1C1E, #2C2C2E
- **Aviation Amber**: #FF9F0A, #FF8C42
- **Aviation Green**: #30D158
- **Alert Red**: #FF453A

## Configuration

### Aircraft Profile Structure
```javascript
{
  "name": "Cessna 172N",
  "description": "Standard configuration",
  "stations": [
    {
      "description": "Empty Weight",
      "arm": 232.28,
      "weight": 1500,
      "maxWeight": 1700
    },
    // ... more stations
  ],
  "macFormula": "20 + ((CG - 232.28) / 86.22) * 100",
  "macMin": 16,
  "macMax": 30
}
```

### Fuel Tank Priority
Fuel consumption follows the configured tank priority order, allowing precise CG travel analysis during flight.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Mobile app version (iOS/Android)
- [ ] Cloud sync for aircraft profiles
- [ ] Multi-aircraft fleet management
- [ ] Integration with flight planning software
- [ ] Performance calculations (takeoff/landing distances)
- [ ] Weather integration for density altitude calculations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Reinier**
GitHub: [@reinier-dev](https://github.com/reinier-dev)

## Acknowledgments

- Aviation industry standards for Weight & Balance calculations
- Modern web design principles and best practices
- Cross-browser compatibility testing community

## Support

For support, issues, or feature requests, please open an issue on GitHub:
https://github.com/reinier-dev/Vector-W-B/issues

---

**Note**: This application is intended for flight planning purposes. Always verify calculations with official aircraft documentation and follow all applicable aviation regulations.

**Version**: 1.0.0
**Last Updated**: 2025