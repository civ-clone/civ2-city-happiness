import { ContentRegistries } from '../../lib/content';
import BornContent from '@civ-clone/base-city-happiness/Rules/BornContent';
/**
 * How many of a city's citizens are born content (base-city-happiness' `BornContent`), for a player or its AI to see
 *  what one more citizen would be: those `Rules/City/yield` gives (`lib/content`), less the unhappy citizens a person's
 *  empire adds. Asked by nothing in the rules themselves.
 */
export declare const getRules: (
  registries?: ContentRegistries
) => BornContent[];
export default getRules;
