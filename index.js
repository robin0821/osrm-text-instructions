var ordinalize = require('number-to-words').toWordsOrdinal;
var instructions = require('./instructions.json');
var useLane = require('./lib/use-lane');
var utils = require('./lib/utils');

// Assertions
if (Object !== instructions.constructor) throw 'instructions must be object';

module.exports = {
    compile: function(step, version, callback) {
        // TODO: Validations

        var type = step.maneuver.type;
        var modifier = step.maneuver.modifier;

        if (!instructions[version]) { return callback(new Error('Invalid version')); }
        if (!type) { return callback(new Error('Missing step maneuver type')); }
        if (!modifier) { return callback(new Error('Missing step maneuver modifier')); }
        if (!instructions[version][type]) return callback(new Error('Unknown type', type));
        if (!step.maneuver.modifier) return callback(new Error('No maneuver provided'));

        // First check if the modifier for this maneuver has a special instruction
        // If not, use the `defaultInstruction`
        var instruction = instructions[version][type][modifier]
            ? instructions[version][type][modifier] : instructions[version][type].defaultInstruction;

        // Special cases, code here should be kept to a minimum
        // If possible, change the instruction in `instructions.json`
        // This switch statement is for specical cases that occur at runtime
        switch (type) {
        case 'arrive':
            // TODO, add wayPoint argument
            // instruction = instruction.replace('{nth}', nthWaypoint).replace('  ', ' ');
            break;
        case 'depart':
            // Always use cardinal direction for departure.
            instruction = instruction.replace('{modifier}', utils.getDirectionFromDegree(step.maneuver.bearing_after)[0]);
            break;
        case 'notification':
            // TODO
            break;
        case 'rotary':
            instruction = instruction.replace('{rotary_name}', step.rotary_name || 'the rotary');
            if (step.name && step.maneuver.exit) {
                instruction += ' and take the ' + ordinalize(step.maneuver.exit) + ' exit onto {way_name}';
            } else if (step.maneuver.exit) {
                instruction += ' and take the ' + ordinalize(step.maneuver.exit) + ' exit';
            } else if (step.name) {
                instruction += ' and exit onto {way_name}';
            }
            break;
        case 'use lane':
            instruction = useLane(step, instruction);
            break;
        default:
            break;
        }

        // Handle instructions with names
        if (step.name && step.name !== '') {
            instruction = instruction
                .replace('[', '')
                .replace(']', '')
                .replace('{way_name}', step.name);
        } else {
            instruction = instruction.replace(/\[.+\]/, '');
        }

        // Cleaning for all instructions
        instruction = instruction
            // If a modifier is not provided, calculate direction given bearing
            .replace('{modifier}', modifier || utils.getDirectionFromDegree(step.maneuver.bearing_after)[0])
            .trim();

        return callback(null, instruction);
    }
};
