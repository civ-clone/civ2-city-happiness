"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const content_1 = require("../../lib/content");
const BornContent_1 = require("@civ-clone/base-city-happiness/Rules/BornContent");
const Effect_1 = require("@civ-clone/core-rule/Effect");
/**
 * How many of a city's citizens are born content (base-city-happiness' `BornContent`), for a player or its AI to see
 *  what one more citizen would be: those `Rules/City/yield` gives (`lib/content`), less the unhappy citizens a person's
 *  empire adds. Asked by nothing in the rules themselves.
 */
const getRules = (registries = {}) => {
    const { content, empireSize } = (0, content_1.default)(registries);
    return [
        new BornContent_1.default('civ2-city-happiness:city/born-content', new Effect_1.default((city) => content(city) - empireSize(city))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=born-content.js.map