"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.isAggressive = void 0;
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const militaryUnhappiness_1 = require("@civ-clone/base-government-military-unhappiness/lib/militaryUnhappiness");
const content_1 = require("../../lib/content");
const happiness_1 = require("../../data/happiness");
const militaryUnhappiness_2 = require("@civ-clone/civ2-government/militaryUnhappiness");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fortress_1 = require("@civ-clone/base-tile-improvement-fortress/Fortress");
const Yields_1 = require("../../Yields");
const hasImprovementOrWonder_1 = require("@civ-clone/base-wonder/lib/hasImprovementOrWonder");
const PoliceStation_1 = require("@civ-clone/base-city-improvement-policestation/PoliceStation");
const WomensSuffrage_1 = require("@civ-clone/base-wonder-womenssuffrage/WomensSuffrage");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
const traits_1 = require("@civ-clone/core-unit/traits");
/**
 * Whether a unit `city` supports is away making its citizens unhappy, as Civilization II counts it (OpenCiv2
 * `src/auto/city.cpp` `city_calc_unit_support`, richardpenman/civ2@49f26ec): it has an attack, isn't a unit of diplomacy
 * or trade (only roles below 6 are counted), and is an aircraft other than a fighter, wherever it is, or any other unit
 * that isn't on a city's square, unless it's on a Fortress close to one of its player's cities.
 */
const isAggressive = (ruleRegistry, cityRegistry, tileImprovementRegistry) => (unit) => {
    if (unit.attack().value() <= 0 ||
        (0, roleOf_1.hasRole)(unit, Roles_1.DiplomacyRole, ruleRegistry) ||
        (0, roleOf_1.hasRole)(unit, Roles_1.TradeRole, ruleRegistry)) {
        return false;
    }
    if ((0, traits_1.isA)(unit, Air_1.default)) {
        return !(0, roleOf_1.hasRole)(unit, Roles_1.AirSuperiorityRole, ruleRegistry);
    }
    const tile = unit.tile();
    if (cityRegistry.getByTile(tile) !== null) {
        return false;
    }
    return !(tileImprovementRegistry
        .getByTile(tile)
        .some((improvement) => improvement instanceof Fortress_1.default) &&
        cityRegistry
            .getByPlayer(unit.player())
            .some((city) => city.tile().distanceFrom(tile) < happiness_1.fortressNearCity));
};
exports.isAggressive = isAggressive;
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, cityRegistry = CityRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, improvementOrWonderRegistries = {}) => {
    const { bornUnhappy, empireSize } = (0, content_1.default)({
        cityGrowthRegistry,
        cityRegistry,
        clientRegistry,
        gameDifficultyRegistry,
        playerGovernmentRegistry,
    }), aggressive = (0, exports.isAggressive)(ruleRegistry, cityRegistry, tileImprovementRegistry), 
    // Worked out once a `yields()` call: its rules are all given the same `yields` array, while it's being filled. A
    //  caller that passes no array gets it worked out afresh.
    once = (compute) => {
        const known = new WeakMap();
        return (city, yields) => {
            if (!Array.isArray(yields)) {
                return compute(city);
            }
            if (!known.has(yields)) {
                known.set(yields, compute(city));
            }
            return known.get(yields);
        };
    }, empireSizeOnce = once(empireSize), aggressiveOnce = once((city) => new Set((0, militaryUnhappiness_1.aggressiveUnits)(city, aggressive, unitRegistry))), 
    // Each aggressive unit's share under the player's government (civ2-government's table).
    share = (city) => {
        try {
            return (0, militaryUnhappiness_1.militaryUnhappinessPerUnit)(militaryUnhappiness_2.militaryUnhappinessTable, playerGovernmentRegistry.getByPlayer(city.player()));
        }
        catch (e) {
            return 0;
        }
    }, 
    // A Police Station in the city, or its player's Women's Suffrage, takes `policeStationExemption` off each unit's
    //  share: one test, so the two never stack (`city_calc_trade_happiness`'s `unhappy_mult`).
    perUnit = (city) => {
        const perUnit = share(city);
        return perUnit > 0 &&
            (0, hasImprovementOrWonder_1.cityHasImprovementOrWonder)(city, PoliceStation_1.default, WomensSuffrage_1.default, improvementOrWonderRegistries)
            ? Math.max(perUnit - militaryUnhappiness_2.policeStationExemption, 0)
            : perUnit;
    }, free = (city) => (0, militaryUnhappiness_2.freeAggressiveUnits)(playerGovernmentRegistry.getByPlayer(city.player()));
    return [
        // OpenCiv2 `src/auto/city.cpp` `city_calc_trade_happiness`, richardpenman/civ2@49f26ec, stage 0.
        new Yield_1.default('civ2-city-happiness:city/yield/population', new Criterion_1.default((city) => bornUnhappy(city) > 0), new Effect_1.default((city) => new Yields_1.PopulationUnhappiness(bornUnhappy(city)))),
        new Yield_1.default('civ2-city-happiness:city/yield/empire-size', new Criterion_1.default((city, yields) => empireSizeOnce(city, yields) > 0), new Criterion_1.default((city, yields) => bornUnhappy(city, empireSizeOnce(city, yields)) > bornUnhappy(city)), new Effect_1.default((city, yields) => new Yields_1.PopulationUnhappiness(bornUnhappy(city, empireSizeOnce(city, yields)) - bornUnhappy(city), 'empire-size'))),
        // Stage 3: each aggressive unit makes `perUnit` citizens unhappy (civ2-government's table), but under the Republic
        //  the first.
        new Yield_1.default('civ2-city-happiness:city/yield/military-unhappiness', new Criterion_1.default((city) => perUnit(city) > 0), new Criterion_1.default((city, yields) => aggressiveOnce(city, yields).size > free(city)), new Effect_1.default((city, yields) => {
            const units = aggressiveOnce(city, yields);
            return (0, militaryUnhappiness_1.militaryUnhappiness)(city, perUnit(city), (unit) => units.has(unit), unitRegistry).slice(free(city));
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map