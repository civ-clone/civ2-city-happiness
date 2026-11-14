"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const calculateCitizenState_1 = require("@civ-clone/base-city-happiness/lib/calculateCitizenState");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
// A city with more unhappy citizens than happy ones is in civil disorder (OpenCiv2 `src/auto/city.cpp`
//  `city_process_disorder`, richardpenman/civ2@49f26ec).
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance) => [
    new CivilDisorder_1.default('civ2-city-happiness:city/civil-disorder', new Effect_1.default((city, yields = city.yields()) => {
        const [unhappiness, , happiness] = (0, calculateCitizenState_1.citizenSummary)((0, calculateCitizenState_1.calculateCitizenState)(cityGrowthRegistry.getByCity(city), yields, specialistRegistry));
        return unhappiness > happiness;
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=civil-disorder.js.map