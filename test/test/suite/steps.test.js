// Unit test for stepsOne command registration

const assert = require('assert');
const path = require('path');

// Load the function from the source
const { stepsOne } = require('../../source/steps');

suite('stepsOne Command Test', () => {
    test('should register aseje.stepOne command and add to subscriptions', () => {

        // Fake extension context
        const context = {
            subscriptions: [],
            extensionPath: path.join(__dirname, '..', '..') // repo root
        };

        // Execute
        stepsOne(context);

        // Validate
        assert.ok(
            context.subscriptions.length >= 1,
            'stepsOne should push at least one command into context.subscriptions'
        );
    });
});
