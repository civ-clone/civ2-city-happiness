"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const cityStatus_1 = require("../../lib/cityStatus");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const cityStatus_2 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
const getRules = (pendingEffects = core_pending_effect_1.instance) => [
    // A captured city, taken by force or incited, starts out for its captor neither in disorder nor celebrating (OpenCiv2
    //  `src/auto/city.cpp` `city_capture_aftermath`, richardpenman/civ2@49f26ec, which clears both of the
    //  city's flags). Dropped rather than ended, so the captor isn't told order was restored
    //  or the celebration is over. At `High`, ahead of the other packages' `Captured` rules that read the city's status.
    new Captured_1.default('civ2-city-happiness:city/captured/forget-status', new Priorities_1.High(), new Effect_1.default((city) => (0, cityStatus_2.forgetCityStatuses)(city, [cityStatus_1.CIVIL_DISORDER, cityStatus_1.LEADER_CELEBRATION], pendingEffects))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=captured.js.map