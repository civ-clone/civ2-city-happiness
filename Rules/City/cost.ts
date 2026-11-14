import {
  GovernmentContent,
  Luxuries,
  LuxuryHappiness,
  Unhappiness,
} from '../../Yields';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  keepsMartialLaw,
  martialLawTable,
} from '@civ-clone/civ2-government/martialLaw';
import {
  martialLaw,
  martialLawLevel,
} from '@civ-clone/base-government-martial-law/lib/martialLaw';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { FUNDAMENTALISM } from '@civ-clone/civ2-rules/data/governments';
import High from '@civ-clone/core-rule/Priorities/High';
import Priority from '@civ-clone/core-rule/Priority';
import Yield from '@civ-clone/core-yield/Yield';
import governmentOf from '@civ-clone/civ2-city/lib/government';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

// OpenCiv2 `src/auto/city.cpp` `city_calc_trade_happiness` (richardpenman/civ2@49f26ec): each 2 luxuries make a
//  citizen happier (stage 1); the improvements' content is civ2-city-improvement's (stage 2, `Low`); then the
//  government's units (stage 3): martial law under Anarchy to Communism, by civ2-government's table, and under
//  Fundamentalism no unhappy citizens at all. The wonders (stage 4) come after.
export const getRules: (
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry
) => Cost[] = (
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance
): Cost[] => {
  const level = (city: City) => {
    try {
      return martialLawLevel(
        martialLawTable,
        playerGovernmentRegistry.getByPlayer(city.player())
      );
    } catch (e) {
      return null;
    }
  };

  return [
    new Cost(
      'civ2-city-happiness:city/cost/luxuries',
      new High(),
      new Effect(
        (city: City, yields: Yield[]): Yield =>
          new LuxuryHappiness(
            Math.floor(reduceYield(yields, Luxuries) / 2),
            Luxuries.name
          )
      )
    ),

    // After the improvements here and the wonders in civ2-wonder, which are `Low`, as civ1-city-happiness's.
    new Cost(
      'civ2-city-happiness:city/cost/martial-law',
      new Priority(3500),
      new Criterion((city: City): boolean => level(city) !== null),
      new Criterion(
        (city: City, yields: Yield[]): boolean =>
          reduceYield(yields, Unhappiness) > 0
      ),
      new Effect(
        (city: City, yields: Yield[]): Yield[] =>
          martialLaw(
            city,
            reduceYield(yields, Unhappiness),
            level(city)!,
            keepsMartialLaw,
            unitRegistry
          ) as Yield[]
      )
    ),

    new Cost(
      'civ2-city-happiness:city/cost/fundamentalism',
      new Priority(3500),
      new Criterion(
        (city: City): boolean =>
          governmentOf(city.player(), playerGovernmentRegistry) ===
          FUNDAMENTALISM
      ),
      new Criterion(
        (city: City, yields: Yield[]): boolean =>
          reduceYield(yields, Unhappiness) > 0
      ),
      new Effect(
        (city: City, yields: Yield[]): Yield =>
          new GovernmentContent(
            Math.trunc(reduceYield(yields, Unhappiness)),
            'Fundamentalism'
          )
      )
    ),
  ];
};

export default getRules;
