import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import { celebrationHappy, celebrationMinimumSize } from '../../data/happiness';
import { ANARCHY } from '@civ-clone/civ2-rules/data/governments';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Yield from '@civ-clone/core-yield/Yield';
import governmentOf from '@civ-clone/civ2-city/lib/government';
import stagedHappiness from '../../lib/stagedHappiness';

// A city celebrates, its happiness worked out in Civ2's stages (`lib/stagedHappiness`), with no unhappy citizens, more
//  than 2 citizens, at least half of them (rounded up) happy, and not under Anarchy (OpenCiv2 `src/auto/city.cpp` `city_process_disorder`, richardpenman/civ2@49f26ec).
export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => CelebrateLeader[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance
): CelebrateLeader[] => [
  new CelebrateLeader(
    'civ2-city-happiness:city/celebrate-leader',
    new Criterion(
      (city: City): boolean =>
        cityGrowthRegistry.getByCity(city).size() > celebrationMinimumSize
    ),
    new Effect((city: City, yields: Yield[] = city.yields()): boolean => {
      const { happy, unhappy } = stagedHappiness(city, yields, {
        cityGrowthRegistry,
        playerGovernmentRegistry,
        specialistRegistry,
      });

      return (
        unhappy === 0 &&
        happy >= celebrationHappy(cityGrowthRegistry.getByCity(city).size()) &&
        governmentOf(city.player(), playerGovernmentRegistry) !== ANARCHY
      );
    })
  ),
];

export default getRules;
