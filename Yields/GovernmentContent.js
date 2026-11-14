"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernmentContent = void 0;
const Unhappiness_1 = require("@civ-clone/base-city-yield-unhappiness/Unhappiness");
const NegativeYield_1 = require("@civ-clone/core-yield/NegativeYield");
/**
 * Unhappy citizens the government itself makes content: under Fundamentalism, all of them. A candidate for a
 * `base-city-yield-*` package once a second rule set needs it.
 */
class GovernmentContent extends Unhappiness_1.default {
}
exports.GovernmentContent = GovernmentContent;
(0, NegativeYield_1.makeNegative)(GovernmentContent);
exports.default = GovernmentContent;
//# sourceMappingURL=GovernmentContent.js.map