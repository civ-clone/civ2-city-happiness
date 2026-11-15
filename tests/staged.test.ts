import { AttackRole } from '@civ-clone/base-unit-role/Roles';
import {
  Communism,
  Democracy,
  Despotism,
  Fundamentalism,
  Monarchy,
} from '@civ-clone/civ2-government/Governments';
import {
  GovernmentContent,
  Happiness,
  LuxuryHappiness,
  Luxuries,
  MartialLaw,
  MilitaryUnhappiness,
  PopulationUnhappiness,
  Unhappiness,
} from '../Yields';
import { atLevel, governedBy, instanceOf, playedBy } from './lib/stubs';
import { happinessStages, stagedHappiness } from '../lib/stagedHappiness';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import CityImprovementContent from '@civ-clone/base-city-yield-city-improvement-content/CityImprovementContent';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Cost from '@civ-clone/core-city/Rules/Cost';
import CureForCancer from '@civ-clone/base-wonder-cureforcancer/CureForCancer';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import HangingGardens from '@civ-clone/base-wonder-hanging-gardens/HangingGardens';
import JsBachsCathedral from '@civ-clone/base-wonder-jsbachscathedral/JsBachsCathedral';
import Low from '@civ-clone/core-rule/Priorities/Low';
import RequirementRegistry from '@civ-clone/core-requirement/RequirementRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import ShakespearesTheatre from '@civ-clone/base-wonder-shakespearestheatre/ShakespearesTheatre';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import civilDisorder from '../Rules/City/civil-disorder';
import cost from '../Rules/City/cost';
import { expect } from 'chai';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';
import yieldRules from '../Rules/City/yield';

class Warrior extends Unit {}

const human = { name: 'human' },
  // Each a city of `human`'s on a small map, so the empire's size uses no large-map bonus.
  cityOf = (): City => {
    const tile = {
      distanceFrom: () => 0,
      map: () => ({ width: () => 40, height: () => 25 }),
    };

    return instanceOf(City, { player: () => human, tile: () => tile });
  },
  improvement = (): CityImprovement =>
    instanceOf(CityImprovement, { id: () => 'improvement' }),
  // A city of `size` with no specialists, and its happiness worked out from `yields` alone.
  staged = (
    size: number,
    yields: Yield[],
    Current: typeof Government = Monarchy,
    specialists = 0
  ) =>
    stagedHappiness(instanceOf(City, { player: () => human }), yields, {
      cityGrowthRegistry: { getByCity: () => ({ size: () => size }) } as any,
      playerGovernmentRegistry: governedBy(Current),
      specialistRegistry: {
        getByCity: () => new Array(specialists).fill(null),
      } as any,
    }),
  counts = ({ name, happy, unhappy, angry }: any) => ({
    name,
    happy,
    unhappy,
    angry,
  });

describe('happinessStages', (): void => {
  it("sorts the city's yields into Civ2's stages", (): void => {
    const { unhappy, stages } = happinessStages([
      new PopulationUnhappiness(9),
      new PopulationUnhappiness(2, 'empire-size'),
      new LuxuryHappiness(3),
      new CityImprovementContent(4, improvement()),
      new Happiness(1, 'courthouse'),
      new MilitaryUnhappiness(2, instanceOf(Warrior, { id: () => 'unit' })),
      new Happiness(1, HangingGardens.name),
      new Happiness(1, CureForCancer.name),
    ]);

    expect(unhappy).equal(11);
    expect(stages.map(({ name }) => name)).eql([
      'luxuries',
      'buildings',
      'units',
      'wonders',
    ]);
    expect(stages[0].happy).equal(3);
    expect([stages[1].happy, stages[1].content]).eql([1, 4]);
    expect(stages[2].unhappy).equal(2);
    expect(stages[3].happy).equal(2);
  });

  it('counts unhappiness from anywhere else in the base, as a caller asking about one more unhappy citizen adds it', (): void => {
    expect(
      happinessStages([new PopulationUnhappiness(3), new Unhappiness(1)])
        .unhappy
    ).equal(4);
    expect(staged(4, [new Unhappiness(3), new Unhappiness(2)]).angry).equal(1);
  });
});

describe('stagedHappiness', (): void => {
  it("makes the unhappy citizens past the city's size angry (city_calc_trade_happiness ~3766)", (): void => {
    const result = staged(6, [new PopulationUnhappiness(8)]);

    expect([result.happy, result.unhappy, result.angry]).eql([0, 6, 2]);
    expect(result.states.slice(-2)).eql([3, 3]);
  });

  it('takes two content effects to make an angry citizen content: the clamp brings it back as unhappy', (): void => {
    // Size 6, 8 unhappy: 6 unhappy, 2 angry. A Colosseum's 3 leaves 3 unhappy, and the clamp's last loop
    //  (`city_happy_clamp_stage` ~3483) turns both angry citizens unhappy while there's room: 5.
    const result = staged(6, [
      new PopulationUnhappiness(8),
      new CityImprovementContent(3, improvement()),
    ]);

    expect([result.happy, result.unhappy, result.angry]).eql([0, 5, 0]);
  });

  it("applies martial law to no more than are unhappy after the buildings, and Fundamentalism's none at all", (): void => {
    const unit = instanceOf(Warrior, { id: () => 'unit' });

    expect(
      staged(4, [new PopulationUnhappiness(2), new MartialLaw(3, unit)]).unhappy
    ).equal(0);
    expect(
      staged(
        6,
        [new PopulationUnhappiness(10), new GovernmentContent(6)],
        Fundamentalism
      )
    ).include({ unhappy: 0, angry: 0 });
    // The government decides, not the yield: under Fundamentalism even with no `GovernmentContent` given.
    expect(
      staged(6, [new PopulationUnhappiness(10)], Fundamentalism).unhappy
    ).equal(0);
    expect(
      staged(6, [new PopulationUnhappiness(4), new GovernmentContent(4)])
        .unhappy
    ).equal(4);
  });

  it("zeroes the unhappy (not the angry) in Shakespeare's Theatre's city, then takes away J. S. Bach's 2", (): void => {
    // Size 8, 10 unhappy: 8 unhappy and 2 angry. Shakespeare's sets the unhappy to 0; the clamp's first loop turns
    //  angry citizens unhappy while there are fewer unhappy than angry (1 and 1), its last while there's room (2).
    const shakespeare = new Unhappiness(-8, ShakespearesTheatre.name),
      // civ2-wonder caps Bach's yield to the net unhappiness, which Shakespeare's has already taken to 0.
      bach = new Unhappiness(0, JsBachsCathedral.name);

    expect(
      counts(staged(8, [new PopulationUnhappiness(10), shakespeare]))
    ).include({ unhappy: 2, angry: 0 });
    expect(
      counts(staged(8, [new PopulationUnhappiness(10), shakespeare, bach]))
    ).include({ unhappy: 0, angry: 0 });
    // Without Shakespeare's, Bach's 2 come in full, whatever its own yield says.
    expect(
      staged(8, [
        new PopulationUnhappiness(6),
        new Unhappiness(-2, JsBachsCathedral.name),
      ]).unhappy
    ).equal(4);
  });

  it('adds military unhappiness after the buildings, so a Colosseum never calms it (stage 3)', (): void => {
    // Size 6 under Democracy: 3 unhappy, a Colosseum's 4 leaves none (clamped at 0), then 2 aggressive units' 4.
    const unit = instanceOf(Warrior, { id: () => 'unit' }),
      result = staged(
        6,
        [
          new PopulationUnhappiness(3),
          new CityImprovementContent(3, improvement()),
          new MilitaryUnhappiness(2, unit),
          new MilitaryUnhappiness(2, unit),
        ],
        Democracy
      );

    expect(result.stages.map(counts)).eql([
      { name: 'base', happy: 0, unhappy: 3, angry: 0 },
      { name: 'luxuries', happy: 0, unhappy: 3, angry: 0 },
      { name: 'buildings', happy: 0, unhappy: 0, angry: 0 },
      { name: 'units', happy: 0, unhappy: 4, angry: 0 },
      { name: 'wonders', happy: 0, unhappy: 4, angry: 0 },
    ]);
  });

  it('keeps the working citizens to the size less the specialists', (): void => {
    const result = staged(5, [new PopulationUnhappiness(5)], Monarchy, 2);

    expect([result.unhappy, result.content, result.states.length]).eql([
      3, 0, 3,
    ]);
  });

  it('puts the Hanging Gardens and the Cure for Cancer in the last stage, the Courthouse in the buildings', (): void => {
    const result = staged(4, [
      new PopulationUnhappiness(2),
      new Happiness(1, 'courthouse'),
      new Happiness(3, HangingGardens.name),
      new Happiness(1, CureForCancer.name),
    ]);

    expect(result.stages.map(counts)).eql([
      { name: 'base', happy: 0, unhappy: 2, angry: 0 },
      { name: 'luxuries', happy: 0, unhappy: 2, angry: 0 },
      { name: 'buildings', happy: 1, unhappy: 2, angry: 0 },
      { name: 'units', happy: 1, unhappy: 2, angry: 0 },
      // 4 happy (5, clamped to the size) and 2 unhappy in 4: the overflow takes a happy and an unhappy citizen at a
      //  time while there are no angry ones (~3470).
      { name: 'wonders', happy: 3, unhappy: 1, angry: 0 },
    ]);
  });
});

describe('the happiness probe: size 12 under Despotism on Deity, with a Temple, luxuries and martial law', (): void => {
  // A trace of OpenCiv2's `city_calc_trade_happiness` (`src/auto/city.cpp`, richardpenman/civ2@49f26ec), worked by hand:
  //
  // Stage 0 (~3745–3770), a person's city on Deity (difficulty 5) under Despotism (government 1), 20 cities, this one
  //  numbered 3:
  //  - factor = riot_factor 14 - 2 × 5 = 4; result = ((1 >> 1) + 2) × 4 / 2 = 4;
  //  - content_limit = unhappy_size 7 - 5 = 2 (the Palace floor of 2 changes nothing);
  //  - unhappy = (12 - 1) - (2 - 2) = 11, + ((20 - 4) + 3 % 4) / 4 = 19 / 4 = 4: 15;
  //  - 15 > 12: angry = 3, unhappy = 12. Clamp (~3459): 12 + 0 ≤ 12 working, nothing moves. (0, 12, 3)
  // Stage 1 (~3772), 2 luxuries: happy = 2 >> 1 = 1. Clamp: 1 + 12 > 12, angry ≠ 0, so angry 2, unhappy 11. (1, 11, 2)
  // Stage 2 (~3774–3808), a Temple with Ceremonial Burial and Mysticism, no Oracle: unhappy -= 2, 9. Clamp: 9 ≥ 2 angry;
  //  1 + 9 ≤ 12; the last loop turns both angry unhappy while 1 + unhappy < 12: (1, 11, 0). The Temple's 2 were spent
  //  on the angry citizens.
  // Stage 3 (~3814–3830), Despotism's martial law: 4 units with an attack in the city, at most 3, each 1:
  //  int_clamp(3, 0, 11) = 3, unhappy 8. (1, 8, 0)
  // Stage 4: no wonders. (1, 8, 0)
  // `city_process_disorder` (~4205): happy - unhappy = 1 - 8 < 0, so the city is in disorder.
  const city = cityOf(),
    others = new Array(19).fill(0).map(() => cityOf()),
    cities = [...others.slice(0, 3), city, ...others.slice(3)],
    roles = new RuleRegistry(),
    unitsInCity = new Array(4).fill(0).map(() =>
      instanceOf(Warrior, {
        player: () => human,
        attack: () => ({ value: () => 1 }),
        tile: () => city.tile(),
        id: () => 'unit',
      })
    ),
    growth = { getByCity: () => ({ size: () => 12 }) } as any,
    governments = governedBy(Despotism),
    specialists = { getByCity: () => [] } as any,
    registry = new RuleRegistry();

  roles.register(unitRole('test', Warrior, AttackRole));

  registry.register(
    ...yieldRules(
      growth,
      governments,
      {
        getByCity: () => [],
        getByTile: () => unitsInCity,
      } as any,
      {
        getByPlayer: () => cities,
        indexOf: (other: City) => cities.indexOf(other),
        getByTile: () => null,
      } as any,
      atLevel(5),
      playedBy(human),
      { getByTile: () => [] } as any,
      roles,
      {
        cityImprovementRegistry: { getByCity: () => [] } as any,
        wonderRegistry: { getByPlayer: () => [] } as any,
        playerResearchRegistry: { some: () => false } as any,
        requirementRegistry: new RequirementRegistry(),
      }
    ),
    new CityYield('test:luxuries', new Effect((): Yield => new Luxuries(2))),
    ...cost(governments, { getByTile: () => unitsInCity } as any),
    // As civ2-city-improvement's Temple content: 1 for Ceremonial Burial and 1 for Mysticism, `Low`.
    new Cost(
      'test:temple',
      new Low(),
      new Effect((): Yield => new CityImprovementContent(2, improvement()))
    ),
    ...civilDisorder(growth, specialists, governments)
  );

  // As `City#yields` runs them.
  const yields: Yield[] = [];

  [CityYield, Cost].forEach((Type: typeof CityYield | typeof Cost): void =>
    registry.get(Type).forEach((rule: CityYield | Cost): void => {
      if (rule.validate(city, yields)) {
        const result = rule.process(city, yields);

        yields.push(...(Array.isArray(result) ? result : [result]));
      }
    })
  );

  it('stages it as the hand trace does', (): void => {
    const result = stagedHappiness(city, yields, {
      cityGrowthRegistry: growth,
      playerGovernmentRegistry: governments,
      specialistRegistry: specialists,
    });

    expect(result.stages.map(counts)).eql([
      { name: 'base', happy: 0, unhappy: 12, angry: 3 },
      { name: 'luxuries', happy: 1, unhappy: 11, angry: 2 },
      { name: 'buildings', happy: 1, unhappy: 11, angry: 0 },
      { name: 'units', happy: 1, unhappy: 8, angry: 0 },
      { name: 'wonders', happy: 1, unhappy: 8, angry: 0 },
    ]);
    expect([result.happy, result.content, result.unhappy]).eql([1, 3, 8]);
  });

  it('is in disorder by the civ2-city-happiness rule', (): void => {
    expect(
      registry.process(CivilDisorder, city, yields).some((result) => result)
    ).true;
  });

  it('differs from a single net total, which gives 10 unhappy, not 8', (): void => {
    // 15 unhappy - 2 (Temple) - 3 (martial law) = 10 net: the stages, not the net, give Civ2's 8.
    const net = yields
      .filter((cityYield) => cityYield instanceof Unhappiness)
      .reduce((total, cityYield) => total + cityYield.value(), 0);

    expect(net).equal(10);
  });
});

describe('the units stage under Communism', (): void => {
  it('takes martial law of up to 6 off the unhappy after the buildings', (): void => {
    const unit = instanceOf(Warrior, { id: () => 'unit' });

    expect(
      staged(
        10,
        [
          new PopulationUnhappiness(9),
          new MartialLaw(2, unit),
          new MartialLaw(2, unit),
          new MartialLaw(2, unit),
        ],
        Communism
      ).unhappy
    ).equal(3);
  });
});
