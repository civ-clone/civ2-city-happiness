"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fortressNearCity = exports.celebrationHappy = exports.celebrationMinimumSize = exports.empireSizeUnhappiness = exports.empireSizeLimit = exports.largeMapRiotBonus = exports.computerContent = exports.humanContent = void 0;
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
// Civilization II's city happiness numbers that aren't in RULES.TXT, from OpenCiv2's reconstruction of the game
//  (richardpenman/civ2@49f26ec, `src/auto/city.cpp` `city_calc_trade_happiness`). Those in RULES.TXT come from
//  civ2-rules' effective @COSMIC values; the martial law and military unhappiness tables by government are
//  civ2-government's.
/**
 * How many citizens of a person's city are born content: @COSMIC's first unhappy size, less 1, less the level (6 on
 *  Chieftain down to 1 on Deity). The game counts it as `(size - 1) - (limit - 2)` unhappy, where `limit` is the first
 *  unhappy size less the level.
 */
const humanContent = (level) => cosmic_1.default.unhappySize - level - 1;
exports.humanContent = humanContent;
/** How many citizens of a computer player's city are born content, whatever the level: `(size - 1) - (limit - 5)`. */
exports.computerContent = cosmic_1.default.unhappySize - 4;
/** What a large map adds to the empire size factor. */
exports.largeMapRiotBonus = 2;
/**
 * How many cities a person's empire may have, under a government, before each city has one more unhappy citizen: the
 *  government's pair (`government >> 1`, so Anarchy and Despotism, Monarchy and Communism, Fundamentalism and the
 *  Republic, then Democracy) + 2, × @COSMIC's riot factor less twice the level (+2 on a large map), halved, and at
 *  least 1.
 */
const empireSizeLimit = (government, level, largeMap) => {
    const factor = cosmic_1.default.riotFactor - 2 * level + (largeMap ? exports.largeMapRiotBonus : 0), limit = Math.trunc((((government >> 1) + 2) * factor) / 2);
    return limit < 2 ? 1 : limit;
};
exports.empireSizeLimit = empireSizeLimit;
/**
 * The unhappy citizens a person's empire adds to one of its cities: `(cities - limit + index % limit) / limit`, where
 *  `index` is the city's number among every player's cities, so which cities tip over first depends on how those
 *  numbers fall. The game's division truncates, and the result is never below 0.
 */
const empireSizeUnhappiness = (cities, index, limit) => Math.max(Math.trunc((cities - limit + (index % limit)) / limit), 0);
exports.empireSizeUnhappiness = empireSizeUnhappiness;
/** A celebration needs more than this many citizens. */
exports.celebrationMinimumSize = 2;
/** The happy citizens a celebrating city needs: half its size, rounded up (`(size + 1) >> 1`). */
const celebrationHappy = (size) => (size + 1) >> 1;
exports.celebrationHappy = celebrationHappy;
/** A unit on a Fortress this close to one of its player's cities isn't away: closer than 4 (`map_distance`). */
exports.fortressNearCity = 4;
//# sourceMappingURL=happiness.js.map