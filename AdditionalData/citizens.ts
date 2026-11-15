import {
  CitizenMood,
  citizenMood,
} from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Happiness, Unhappiness } from '../Yields';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import AdditionalData from '@civ-clone/core-data-object/AdditionalData';
import City from '@civ-clone/core-city/City';
import { IStagedCountsByStage } from '@civ-clone/base-city-happiness/lib/calculateStagedCitizenState';
import Yield from '@civ-clone/core-yield/Yield';
import stagedHappiness from '../lib/stagedHappiness';

export type Citizens = {
  moods: CitizenMood[];
  causes: { yield: Yield; moods: CitizenMood[] }[];
  stages: IStagedCountsByStage[];
};

/**
 * The mood of each of a city's working citizens, so a renderer can draw them without knowing the rule, worked out in
 * Civ2's stages (`lib/stagedHappiness`): happy, content, unhappy, then angry. `causes` has one entry per `Happiness` or
 * `Unhappiness` yield, in order, with the moods once that yield and the ones before it are applied, as
 * civ1-city-happiness gives them. `stages` has the happy, unhappy and angry counts after each of Civ2's stages ('base',
 * 'luxuries', 'buildings', 'units', 'wonders'), for a happiness panel that shows them.
 */
export const getAdditionalData = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance
): AdditionalData[] => [
  new AdditionalData(City, 'citizens', (city: City): Citizens => {
    const yields = city.yields(),
      causes = yields.filter(
        (cityYield) =>
          (cityYield instanceof Happiness ||
            cityYield instanceof Unhappiness) &&
          cityYield.value() !== 0
      ),
      staged = (yields: Yield[]) =>
        stagedHappiness(city, yields, {
          cityGrowthRegistry,
          playerGovernmentRegistry,
          specialistRegistry,
        }),
      all = staged(yields);

    return {
      moods: all.states.map(citizenMood),
      causes: causes.map((cityYield, index) => ({
        yield: cityYield,
        moods: staged(causes.slice(0, index + 1)).states.map(citizenMood),
      })),
      stages: all.stages,
    };
  }),
];

export default getAdditionalData;
