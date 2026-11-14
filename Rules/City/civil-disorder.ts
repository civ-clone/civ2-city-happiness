import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  calculateCitizenState,
  citizenSummary,
} from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Yield from '@civ-clone/core-yield/Yield';

// A city with more unhappy citizens than happy ones is in civil disorder (OpenCiv2 `src/auto/city.cpp`
//  `city_process_disorder`, richardpenman/civ2@49f26ec).
export const getRules = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance
): CivilDisorder[] => [
  new CivilDisorder(
    'civ2-city-happiness:city/civil-disorder',
    new Effect((city: City, yields: Yield[] = city.yields()): boolean => {
      const [unhappiness, , happiness] = citizenSummary(
        calculateCitizenState(
          cityGrowthRegistry.getByCity(city),
          yields,
          specialistRegistry
        )
      );

      return unhappiness > happiness;
    })
  ),
];

export default getRules;
