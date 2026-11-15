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
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Yield from '@civ-clone/core-yield/Yield';
import stagedHappiness from '../../lib/stagedHappiness';

// A city with fewer happy citizens than unhappy ones, the angry among them, once its happiness is worked out in Civ2's
//  stages (`lib/stagedHappiness`), is in civil disorder (OpenCiv2 `src/auto/city.cpp` `city_process_disorder`,
//  `happy_count - unhappy_count < 0`, richardpenman/civ2@49f26ec).
export const getRules = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance
): CivilDisorder[] => [
  new CivilDisorder(
    'civ2-city-happiness:city/civil-disorder',
    new Effect((city: City, yields: Yield[] = city.yields()): boolean => {
      const { happy, unhappy } = stagedHappiness(city, yields, {
        cityGrowthRegistry,
        playerGovernmentRegistry,
        specialistRegistry,
      });

      return unhappy > happy;
    })
  ),
];

export default getRules;
