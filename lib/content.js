"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentCounts = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const happiness_1 = require("../data/happiness");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const government_1 = require("@civ-clone/civ2-city/lib/government");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const mapSize_1 = require("@civ-clone/civ2-rules/lib/mapSize");
/**
 * How a city's citizens are born (OpenCiv2 `src/auto/city.cpp` `city_calc_trade_happiness`, richardpenman/civ2@49f26ec,
 *  stage 0, `data/happiness`):
 * - `content(city)`: a person's city has @COSMIC's first unhappy size − 1 − level content citizens, a computer player's
 *   3;
 * - `bornUnhappy(city, extra)`: those beyond them, with `extra` more, are born unhappy (any beyond the size are angry);
 * - `empireSize(city)`: the unhappy citizens a person's empire adds to the city, under any government but Communism. A
 *   map counts as large by its squares, as civ2-rules' `mapSize` has it.
 */
const contentCounts = ({ cityGrowthRegistry = CityGrowthRegistry_1.instance, cityRegistry = CityRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, } = {}) => {
    const size = (city) => cityGrowthRegistry.getByCity(city).size(), content = (city) => (0, isHuman_1.default)(city.player(), clientRegistry)
        ? (0, happiness_1.humanContent)((0, level_1.levelOf)(gameDifficultyRegistry))
        : happiness_1.computerContent, bornUnhappy = (city, extra = 0) => Math.max(size(city) - content(city) + extra, 0), empireSize = (city) => {
        const player = city.player(), government = (0, government_1.default)(player, playerGovernmentRegistry);
        if (!(0, isHuman_1.default)(player, clientRegistry) || government === governments_1.COMMUNISM) {
            return 0;
        }
        const world = city.tile().map(), limit = (0, happiness_1.empireSizeLimit)(government, (0, level_1.levelOf)(gameDifficultyRegistry), (0, mapSize_1.default)(world.width() * world.height()) === 'large');
        return (0, happiness_1.empireSizeUnhappiness)(cityRegistry.getByPlayer(player).length, Math.max(cityRegistry.indexOf(city), 0), limit);
    };
    return { bornUnhappy, content, empireSize };
};
exports.contentCounts = contentCounts;
exports.default = exports.contentCounts;
//# sourceMappingURL=content.js.map