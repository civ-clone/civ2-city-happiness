"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.isAggressive = void 0;
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const militaryUnhappiness_1 = require("@civ-clone/base-government-military-unhappiness/lib/militaryUnhappiness");
const happiness_1 = require("../../data/happiness");
const militaryUnhappiness_2 = require("@civ-clone/civ2-government/militaryUnhappiness");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fortress_1 = require("@civ-clone/base-tile-improvement-fortress/Fortress");
const Yields_1 = require("../../Yields");
const government_1 = require("@civ-clone/civ2-city/lib/government");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
const traits_1 = require("@civ-clone/core-unit/traits");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const mapSize_1 = require("@civ-clone/civ2-rules/lib/mapSize");
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
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, cityRegistry = CityRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance) => {
    const size = (city) => cityGrowthRegistry.getByCity(city).size(), content = (city) => (0, isHuman_1.default)(city.player(), clientRegistry)
        ? (0, happiness_1.humanContent)((0, level_1.levelOf)(gameDifficultyRegistry))
        : happiness_1.computerContent, 
    // Citizens beyond those born content are born unhappy, up to the whole city (those past it are angry citizens:
    //  civ2-city-happiness's README).
    bornUnhappy = (city, extra = 0) => Math.min(Math.max(size(city) - content(city) + extra, 0), size(city)), 
    // A person's empire, under any government but Communism (`data/happiness`). A map counts as large by its squares,
    //  as civ2-rules' `mapSize` has it.
    empireSize = (city) => {
        const player = city.player(), government = (0, government_1.default)(player, playerGovernmentRegistry);
        if (!(0, isHuman_1.default)(player, clientRegistry) || government === governments_1.COMMUNISM) {
            return 0;
        }
        const world = city.tile().map(), limit = (0, happiness_1.empireSizeLimit)(government, (0, level_1.levelOf)(gameDifficultyRegistry), (0, mapSize_1.default)(world.width() * world.height()) === 'large');
        return (0, happiness_1.empireSizeUnhappiness)(cityRegistry.getByPlayer(player).length, Math.max(cityRegistry.indexOf(city), 0), limit);
    }, aggressive = (0, exports.isAggressive)(ruleRegistry, cityRegistry, tileImprovementRegistry), perUnit = (city) => {
        try {
            return (0, militaryUnhappiness_1.militaryUnhappinessPerUnit)(militaryUnhappiness_2.militaryUnhappinessTable, playerGovernmentRegistry.getByPlayer(city.player()));
        }
        catch (e) {
            return 0;
        }
    }, free = (city) => (0, militaryUnhappiness_2.freeAggressiveUnits)(playerGovernmentRegistry.getByPlayer(city.player()));
    return [
        // OpenCiv2 `src/auto/city.cpp` `city_calc_trade_happiness`, richardpenman/civ2@49f26ec, stage 0.
        new Yield_1.default('civ2-city-happiness:city/yield/population', new Criterion_1.default((city) => bornUnhappy(city) > 0), new Effect_1.default((city) => new Yields_1.PopulationUnhappiness(bornUnhappy(city)))),
        new Yield_1.default('civ2-city-happiness:city/yield/empire-size', new Criterion_1.default((city) => empireSize(city) > 0), new Criterion_1.default((city) => bornUnhappy(city, empireSize(city)) > bornUnhappy(city)), new Effect_1.default((city) => new Yields_1.PopulationUnhappiness(bornUnhappy(city, empireSize(city)) - bornUnhappy(city), 'empire-size'))),
        // Stage 3: each aggressive unit makes `perUnit` citizens unhappy (civ2-government's table), but under the Republic
        //  the first.
        new Yield_1.default('civ2-city-happiness:city/yield/military-unhappiness', new Criterion_1.default((city) => perUnit(city) > 0), new Criterion_1.default((city) => (0, militaryUnhappiness_1.aggressiveUnits)(city, aggressive, unitRegistry).length > free(city)), new Effect_1.default((city) => (0, militaryUnhappiness_1.militaryUnhappiness)(city, perUnit(city), aggressive, unitRegistry).slice(free(city)))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map