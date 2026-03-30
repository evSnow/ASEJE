const assert = require('assert');

const { clampVolume } = require('../source/audioTrigger');

suite('Audio Trigger Helpers', () => {
    test('clampVolume keeps values in the supported range', () => {
        assert.strictEqual(clampVolume(-1), 0);
        assert.strictEqual(clampVolume(2), 1);
        assert.strictEqual(clampVolume(0.4), 0.4);
        assert.strictEqual(clampVolume('bad'), 0.45);
    });
});