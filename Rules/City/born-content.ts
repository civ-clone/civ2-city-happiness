import contentCounts, { ContentRegistries } from '../../lib/content';
import BornContent from '@civ-clone/base-city-happiness/Rules/BornContent';
import City from '@civ-clone/core-city/City';
import Effect from '@civ-clone/core-rule/Effect';

/**
 * How many of a city's citizens are born content (base-city-happiness' `BornContent`), for a player or its AI to see
 *  what one more citizen would be: those `Rules/City/yield` gives (`lib/content`), less the unhappy citizens a person's
 *  empire adds. Asked by nothing in the rules themselves.
 */
export const getRules = (registries: ContentRegistries = {}): BornContent[] => {
  const { content, empireSize } = contentCounts(registries);

  return [
    new BornContent(
      'civ2-city-happiness:city/born-content',
      new Effect((city: City): number => content(city) - empireSize(city))
    ),
  ];
};

export default getRules;
