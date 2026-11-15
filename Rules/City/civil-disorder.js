"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const stagedHappiness_1 = require("../../lib/stagedHappiness");
// A city with fewer happy citizens than unhappy ones, the angry among them, once its happiness is worked out in Civ2's
//  stages (`lib/stagedHappiness`), is in civil disorder (OpenCiv2 `src/auto/city.cpp` `city_process_disorder`,
//  `happy_count - unhappy_count < 0`, richardpenman/civ2@49f26ec).
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance) => [
    new CivilDisorder_1.default('civ2-city-happiness:city/civil-disorder', new Effect_1.default((city, yields = city.yields()) => {
        const { happy, unhappy } = (0, stagedHappiness_1.default)(city, yields, {
            cityGrowthRegistry,
            playerGovernmentRegistry,
            specialistRegistry,
        });
        return unhappy > happy;
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=civil-disorder.js.map