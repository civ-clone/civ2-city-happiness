import {
  militaryUnhappinessTable,
  policeStationExemption,
} from '@civ-clone/civ2-government/militaryUnhappiness';
import Democracy from '@civ-clone/base-government-democracy/Democracy';
import { EffectDescription } from '@civ-clone/core-rule/Description';
import PoliceStation from '@civ-clone/base-city-improvement-policestation/PoliceStation';
import WomensSuffrage from '@civ-clone/base-wonder-womenssuffrage/WomensSuffrage';
import { expect } from 'chai';
import yieldRules from '../Rules/City/yield';

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
    ]);

    const [, democracyShare] = militaryUnhappinessTable.find(
      ([GovernmentType]) => GovernmentType === Democracy
    )!;

    // The 2 a Democracy's unit makes unhappy, less the value described, are the 1 `happiness.test.ts` sees.
    expect(democracyShare - (described[0][1].value as number)).to.equal(1);
  });
});
