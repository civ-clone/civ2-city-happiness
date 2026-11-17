import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import City from '@civ-clone/core-city/City';
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
export declare const contentCounts: ({
  cityGrowthRegistry,
  cityRegistry,
  clientRegistry,
  gameDifficultyRegistry,
  playerGovernmentRegistry,
}?: ContentRegistries) => {
  bornUnhappy: (city: City, extra?: number) => number;
  content: (city: City) => number;
  empireSize: (city: City) => number;
};
export default contentCounts;
