import Unhappiness from '@civ-clone/base-city-yield-unhappiness/Unhappiness';
import { makeNegative } from '@civ-clone/core-yield/NegativeYield';

/**
 * Unhappy citizens the government itself makes content: under Fundamentalism, all of them. A candidate for a
 * `base-city-yield-*` package once a second rule set needs it.
 */
export class GovernmentContent extends Unhappiness {}

makeNegative(GovernmentContent);

export default GovernmentContent;
