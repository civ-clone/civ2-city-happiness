import {
  militaryUnhappinessTable,
  policeStationExemption,
} from '@civ-clone/civ2-government/militaryUnhappiness';
import Democracy from '@civ-clone/base-government-democracy/Democracy';
import { EffectDescription } from '@civ-clone/core-rule/Description';
import PoliceStation from '@civ-clone/base-city-improvement-policestation/PoliceStation';
import WomensSuffrage from '@civ-clone/base-wonder-womenssuffrage/WomensSuffrage';
import { expect } from 'chai';
import yieldRules, { isAggressive } from '../Rules/City/yield';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import { fortressNearCity } from '../data/happiness';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';

// What a Police Station and Women's Suffrage say they do, for the Civilopedia (civ-clone/web-renderer#1196).
//  `happiness.test.ts` checks the rule in a city: under Democracy each unit's 2 unhappy become 1 with either.
describe('descriptions', (): void => {
  it("a Police Station takes civ2-government's exemption off each unit's unhappiness, and Women's Suffrage counts as one", (): void => {
    const described: [string | null, EffectDescription][] =
      yieldRules().flatMap((rule) =>
        rule
          .descriptions()
          .map((description): [string | null, EffectDescription] => [
            rule.id(),
            description,
          ])
      );

    expect(described).to.eql([
      [
        'civ2-city-happiness:city/yield/military-unhappiness',
        {
          type: 'military_unhappiness',
          subject: PoliceStation,
          value: policeStationExemption,
        },
      ],
      [
        'civ2-city-happiness:city/yield/military-unhappiness',
        {
          type: 'acts_as',
          subject: WomensSuffrage,
          improvement: PoliceStation,
          scope: 'player',
        },
      ],
      [
        'civ2-city-happiness:city/yield/military-unhappiness',
        {
          type: 'not_away',
          subject: Fortress,
          radius: fortressNearCity - 1,
        },
      ],
    ]);

    const [, democracyShare] = militaryUnhappinessTable.find(
      ([GovernmentType]) => GovernmentType === Democracy
    )!;

    // The 2 a Democracy's unit makes unhappy, less the value described, are the 1 `happiness.test.ts` sees.
    expect(democracyShare - (described[0][1].value as number)).to.equal(1);
  });

  // What a Fortress does for a unit near home (civ-clone/web-renderer#1343): the radius said is the furthest a unit on
  //  one is from its player's nearest city and still not away.
  it('a unit on a Fortress within the radius it says of one of its cities is not away, and one further is', (): void => {
    const radius = fortressNearCity - 1,
      awayAt = (distance: number): boolean => {
        const square = {} as never,
          unit = {
            attack: () => ({ value: () => 1 }),
            tile: () => square,
            player: () => 'p',
          } as never;

        return isAggressive(
          new RuleRegistry(),
          {
            getByTile: () => null,
            getByPlayer: () => [
              { tile: () => ({ distanceFrom: () => distance }) },
            ],
          } as never,
          { getByTile: () => [Object.create(Fortress.prototype)] } as never
        )(unit);
      };

    expect(radius).to.equal(3);
    expect(awayAt(radius)).to.false;
    expect(awayAt(radius + 1)).to.true;
  });
});
