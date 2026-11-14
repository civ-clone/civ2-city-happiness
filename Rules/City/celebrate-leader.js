"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const calculateCitizenState_1 = require("@civ-clone/base-city-happiness/lib/calculateCitizenState");
const happiness_1 = require("../../data/happiness");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const government_1 = require("@civ-clone/civ2-city/lib/government");
// A city celebrates with no unhappy citizens, more than 2 citizens, at least half of them (rounded up) happy, and not
//  under Anarchy (OpenCiv2 `src/auto/city.cpp` `city_process_disorder`, richardpenman/civ2@49f26ec).
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance) => [
    new CelebrateLeader_1.default('civ2-city-happiness:city/celebrate-leader', new Criterion_1.default((city) => cityGrowthRegistry.getByCity(city).size() > happiness_1.celebrationMinimumSize), new Effect_1.default((city, yields = city.yields()) => {
        const cityGrowth = cityGrowthRegistry.getByCity(city), [unhappiness, , happiness] = (0, calculateCitizenState_1.citizenSummary)((0, calculateCitizenState_1.calculateCitizenState)(cityGrowth, yields, specialistRegistry));
        return (unhappiness === 0 &&
            Math.floor(happiness) >= (0, happiness_1.celebrationHappy)(cityGrowth.size()) &&
            (0, government_1.default)(city.player(), playerGovernmentRegistry) !== governments_1.ANARCHY);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=celebrate-leader.js.map