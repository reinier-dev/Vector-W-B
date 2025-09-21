// Constants
export const MOMENT_DIVISOR = 100;
export const IN_TO_M = 0.0254;
export const LB_TO_KG = 0.45359237;

// Station definitions
export const STATIONS = [
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

// Predefined aircraft templates
export const AIRCRAFT_TEMPLATES = {
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