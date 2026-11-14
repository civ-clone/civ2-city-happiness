"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Yields_1 = require("../../Yields");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const martialLaw_1 = require("@civ-clone/civ2-government/martialLaw");
const martialLaw_2 = require("@civ-clone/base-government-martial-law/lib/martialLaw");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const High_1 = require("@civ-clone/core-rule/Priorities/High");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const government_1 = require("@civ-clone/civ2-city/lib/government");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
// OpenCiv2 `src/auto/city.cpp` `city_calc_trade_happiness` (richardpenman/civ2@49f26ec): each 2 luxuries make a
//  citizen happier (stage 1); the improvements' content is civ2-city-improvement's (stage 2, `Low`); then the
//  government's units (stage 3): martial law under Anarchy to Communism, by civ2-government's table, and under
//  Fundamentalism no unhappy citizens at all. The wonders (stage 4) come after.
const getRules = (playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => {
    const level = (city) => {
        try {
            return (0, martialLaw_2.martialLawLevel)(martialLaw_1.martialLawTable, playerGovernmentRegistry.getByPlayer(city.player()));
        }
        catch (e) {
            return null;
        }
    };
    return [
        new Cost_1.default('civ2-city-happiness:city/cost/luxuries', new High_1.default(), new Effect_1.default((city, yields) => new Yields_1.LuxuryHappiness(Math.floor((0, reduceYields_1.reduceYield)(yields, Yields_1.Luxuries) / 2), Yields_1.Luxuries.name))),
        // After the improvements here and the wonders in civ2-wonder, which are `Low`, as civ1-city-happiness's.
        new Cost_1.default('civ2-city-happiness:city/cost/martial-law', new Priority_1.default(3500), new Criterion_1.default((city) => level(city) !== null), new Criterion_1.default((city, yields) => (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness) > 0), new Effect_1.default((city, yields) => (0, martialLaw_2.martialLaw)(city, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness), level(city), martialLaw_1.keepsMartialLaw, unitRegistry))),
        new Cost_1.default('civ2-city-happiness:city/cost/fundamentalism', new Priority_1.default(3500), new Criterion_1.default((city) => (0, government_1.default)(city.player(), playerGovernmentRegistry) ===
            governments_1.FUNDAMENTALISM), new Criterion_1.default((city, yields) => (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness) > 0), new Effect_1.default((city, yields) => new Yields_1.GovernmentContent(Math.trunc((0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness)), 'Fundamentalism'))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=cost.js.map