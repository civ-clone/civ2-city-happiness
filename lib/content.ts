import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  computerContent,
  empireSizeLimit,
  empireSizeUnhappiness,
  humanContent,
} from '../data/happiness';
import { COMMUNISM } from '@civ-clone/civ2-rules/data/governments';
import City from '@civ-clone/core-city/City';
import governmentOf from '@civ-clone/civ2-city/lib/government';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { levelOf } from '@civ-clone/civ2-difficulty/level';
import mapSize from '@civ-clone/civ2-rules/lib/mapSize';

/** The registries the content counts read. */
export type ContentRegistries = {
  cityGrowthRegistry?: CityGrowthRegistry;
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  gameDifficultyRegistry?: GameDifficultyRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
};

/**
 * How a city's citizens are born (OpenCiv2 `src/auto/city.cpp` `city_calc_trade_happiness`, richardpenman/civ2@49f26ec,
 *  stage 0, `data/happiness`):
 * - `content(city)`: a person's city has @COSMIC's first unhappy size − 1 − level content citizens, a computer player's
 *   3;
 * - `bornUnhappy(city, extra)`: those beyond them, with `extra` more, are born unhappy (any beyond the size are angry);
 * - `empireSize(city)`: the unhappy citizens a person's empire adds to the city, under any government but Communism. A
 *   map counts as large by its squares, as civ2-rules' `mapSize` has it.
 */
export const contentCounts = ({
  cityGrowthRegistry = cityGrowthRegistryInstance,
  cityRegistry = cityRegistryInstance,
  clientRegistry = clientRegistryInstance,
  gameDifficultyRegistry = gameDifficultyRegistryInstance,
  playerGovernmentRegistry = playerGovernmentRegistryInstance,
}: ContentRegistries = {}) => {
  const size = (city: City): number =>
      cityGrowthRegistry.getByCity(city).size(),
    content = (city: City): number =>
      isHuman(city.player(), clientRegistry)
        ? humanContent(levelOf(gameDifficultyRegistry))
        : computerContent,
    bornUnhappy = (city: City, extra: number = 0): number =>
      Math.max(size(city) - content(city) + extra, 0),
    empireSize = (city: City): number => {
      const player = city.player(),
        government = governmentOf(player, playerGovernmentRegistry);

      if (!isHuman(player, clientRegistry) || government === COMMUNISM) {
        return 0;
      }

      const world = city.tile().map(),
        limit = empireSizeLimit(
          government,
          levelOf(gameDifficultyRegistry),
          mapSize(world.width() * world.height()) === 'large'
        );

      return empireSizeUnhappiness(
        cityRegistry.getByPlayer(player).length,
        Math.max(cityRegistry.indexOf(city), 0),
        limit
      );
    };

  return { bornUnhappy, content, empireSize };
};

export default contentCounts;
