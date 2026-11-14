import {
  Anarchy,
  Communism,
  Democracy,
  Despotism,
  Fundamentalism,
  Monarchy,
  Republic,
} from '@civ-clone/civ2-government/Governments';
import {
  AirSuperiorityRole,
  AttackRole,
  DiplomacyRole,
} from '@civ-clone/base-unit-role/Roles';
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
import {
  computerContent,
  empireSizeLimit,
  empireSizeUnhappiness,
  humanContent,
} from '../data/happiness';
import Air from '@civ-clone/base-unit-type-air/Air';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Airbase from '@civ-clone/base-tile-improvement-airbase/Airbase';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import Government from '@civ-clone/core-government/Government';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import celebrateLeader from '../Rules/City/celebrate-leader';
import civilDisorder from '../Rules/City/civil-disorder';
import cost from '../Rules/City/cost';
import { expect } from 'chai';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';
import yieldRules from '../Rules/City/yield';
import PoliceStation from '@civ-clone/base-city-improvement-policestation/PoliceStation';
import RequirementRegistry from '@civ-clone/core-requirement/RequirementRegistry';
import WomensSuffrage from '@civ-clone/base-wonder-womenssuffrage/WomensSuffrage';

class Warrior extends Unit {}
class Bomber extends Air {}
class Fighter extends Air {}
class Envoy extends Unit {}

const roles = new RuleRegistry();

roles.register(
  unitRole('test', Warrior, AttackRole),
  unitRole('test', Bomber, AttackRole),
  unitRole('test', Fighter, AirSuperiorityRole),
  unitRole('test', Envoy, DiplomacyRole)
);

describe('data', (): void => {
  it("bears 6 content citizens on Chieftain down to 1 on Deity in a person's city, and 3 in a computer player's", (): void => {
    expect([0, 1, 2, 3, 4, 5].map(humanContent)).eql([6, 5, 4, 3, 2, 1]);
    expect(computerContent).equal(3);
  });

  it('allows (pair + 2) × (14 - 2 × level, +2 on a large map) / 2 cities, at least 1', (): void => {
    // Despotism (pair 0) at King: 2 × 8 / 2.
    expect(empireSizeLimit(1, 3, false)).equal(8);
    // Democracy (pair 3) at King: 5 × 8 / 2; on a large map 5 × 10 / 2.
    expect(empireSizeLimit(6, 3, false)).equal(20);
    expect(empireSizeLimit(6, 3, true)).equal(25);
    // Fundamentalism and the Republic share a pair.
    expect(empireSizeLimit(4, 0, false)).equal(empireSizeLimit(5, 0, false));
    expect(empireSizeLimit(0, 7, false)).equal(1);
  });

  it('adds (cities - limit + index % limit) / limit unhappy citizens, truncated, never below 0', (): void => {
    expect(empireSizeUnhappiness(8, 0, 8)).equal(0);
    expect(empireSizeUnhappiness(9, 0, 8)).equal(0);
    expect(empireSizeUnhappiness(9, 7, 8)).equal(1);
    expect(empireSizeUnhappiness(16, 0, 8)).equal(1);
    expect(empireSizeUnhappiness(1, 0, 8)).equal(0);
  });
});

describe('city:yield', (): void => {
  const human = { name: 'human' },
    computer = { name: 'computer' },
    // A city's square is as far from a unit's square as the unit's square says it is from any city.
    centre = {
      name: 'centre',
      distanceFrom: (other: { distanceFrom?: () => number }): number =>
        other?.distanceFrom ? other.distanceFrom() : 0,
    },
    world = (squares: number) => ({ width: () => squares, height: () => 1 }),
    cityOf = (player: unknown, mapSquares = 4000) => {
      const tile = { ...centre, map: () => world(mapSquares) };

      return instanceOf(City, {
        player: () => player,
        tile: () => tile,
      });
    },
    unitOf = (
      Type: typeof Unit,
      player: unknown,
      tile: unknown,
      attack = 1
    ): Unit =>
      instanceOf(Type, {
        attack: () => ({ value: () => attack }),
        tile: () => tile,
        player: () => player,
      }),
    yieldsOf = (
      city: City,
      {
        size = 5,
        level = 3,
        Current = Despotism as typeof Government,
        cities = [] as City[],
        units = [] as Unit[],
        improvements = [] as unknown[],
        exemption = null as 'police' | 'suffrage' | null,
      } = {}
    ): Yield[] => {
      const registry = new RuleRegistry(),
        cityRegistry = {
          getByPlayer: (player: unknown) =>
            cities.filter((city) => city.player() === player),
          indexOf: (city: City) => {
            calls.indexOf++;

            return cities.indexOf(city);
          },
          getByTile: (tile: unknown) =>
            cities.find((city) => city.tile() === tile) ?? null,
        };

      registry.register(
        ...yieldRules(
          { getByCity: () => ({ size: () => size }) } as any,
          governedBy(Current),
          {
            getByCity: () => {
              calls.getByCity++;

              return units;
            },
          } as any,
          cityRegistry as any,
          atLevel(level),
          playedBy(human),
          { getByTile: () => improvements } as any,
          roles,
          {
            cityImprovementRegistry: {
              getByCity: () =>
                exemption === 'police'
                  ? [Object.create(PoliceStation.prototype)]
                  : [],
            } as any,
            wonderRegistry: {
              getByPlayer: () =>
                exemption === 'suffrage'
                  ? [
                      Object.assign(Object.create(WomensSuffrage.prototype), {
                        city: () => ({ destroyed: () => false }),
                      }),
                    ]
                  : [],
            } as any,
            playerResearchRegistry: { some: () => false } as any,
            requirementRegistry: new RequirementRegistry(),
          }
        )
      );

      return registry.process(CityYield, city, []).flat();
    },
    total = (yields: Yield[], Type: typeof Yield): number =>
      reduceYield(yields, Type),
    calls = { indexOf: 0, getByCity: 0 };

  it("makes the citizens past those born content unhappy, up to the city's size", (): void => {
    expect(total(yieldsOf(cityOf(human)), PopulationUnhappiness)).equal(2);
    expect(
      total(yieldsOf(cityOf(human), { level: 0 }), PopulationUnhappiness)
    ).equal(0);
    expect(
      total(
        yieldsOf(cityOf(human), { level: 5, size: 3 }),
        PopulationUnhappiness
      )
    ).equal(2);
    expect(total(yieldsOf(cityOf(computer), { level: 0 }), Unhappiness)).equal(
      2
    );
  });

  it("adds a person's empire size, except under Communism, and never for a computer player", (): void => {
    const city = cityOf(human),
      others = new Array(7).fill(0).map(() => cityOf(human)),
      cities = [...others, city, cityOf(human)];

    // 9 cities at King under Despotism (limit 8): (9 - 8 + 7 % 8) / 8 makes the city at index 7 tip over.
    expect(total(yieldsOf(city, { cities }), PopulationUnhappiness)).equal(3);
    // 20 cities: Communism's limit would be 12, and (20 - 12 + 7) / 12 = 1 more, but it has none.
    const many = [...cities, ...new Array(11).fill(0).map(() => cityOf(human))];

    expect(
      total(yieldsOf(city, { cities: many }), PopulationUnhappiness)
    ).equal(4);
    expect(
      total(
        yieldsOf(city, { cities: many, Current: Communism }),
        PopulationUnhappiness
      )
    ).equal(2);

    const computerCity = cityOf(computer);

    expect(
      total(
        yieldsOf(computerCity, {
          cities: [...others, computerCity, cityOf(computer)],
          level: 0,
        }),
        PopulationUnhappiness
      )
    ).equal(2);
  });

  it('counts a large map, which allows more cities', (): void => {
    // 7 cities on Emperor under Despotism: a limit of 6, or 8 on a large map. The city at index 5 has 3 born unhappy,
    //  and (7 - 6 + 5) / 6 = 1 more on a small map, (7 - 8 + 5) / 8 = 0 on a large one.
    const unhappy = (squares: number): number => {
      const city = cityOf(human, squares),
        cities = [
          ...new Array(5).fill(0).map(() => cityOf(human)),
          city,
          cityOf(human),
        ];

      return total(yieldsOf(city, { cities, level: 4 }), PopulationUnhappiness);
    };

    expect(unhappy(5999)).equal(4);
    expect(unhappy(6000)).equal(3);
  });

  it('makes 1 citizen unhappy per aggressive unit past the first under the Republic, and 2 per unit under Democracy', (): void => {
    const city = cityOf(human),
      away = { distanceFrom: () => 10 },
      units = [
        unitOf(Warrior, human, away),
        unitOf(Warrior, human, away),
        unitOf(Warrior, human, away),
      ],
      military = (Current: typeof Government): number[] =>
        yieldsOf(city, { level: 0, Current, units, cities: [city] })
          .filter((cityYield) => cityYield instanceof MilitaryUnhappiness)
          .map((cityYield) => cityYield.value());

    expect(military(Republic)).eql([1, 1]);
    expect(military(Democracy)).eql([2, 2, 2]);
    [Anarchy, Despotism, Monarchy, Communism, Fundamentalism].forEach(
      (Current) => expect(military(Current), Current.name).eql([])
    );
  });

  it("takes 1 off each unit's share with a Police Station or its player's Women's Suffrage, once", (): void => {
    const city = cityOf(human),
      away = { distanceFrom: () => 10 },
      units = [
        unitOf(Warrior, human, away),
        unitOf(Warrior, human, away),
        unitOf(Warrior, human, away),
      ],
      military = (
        Current: typeof Government,
        exemption: 'police' | 'suffrage' | null
      ): number[] =>
        yieldsOf(city, { level: 0, Current, units, cities: [city], exemption })
          .filter((cityYield) => cityYield instanceof MilitaryUnhappiness)
          .map((cityYield) => cityYield.value());

    expect(military(Democracy, 'police')).eql([1, 1, 1]);
    expect(military(Democracy, 'suffrage')).eql([1, 1, 1]);
    expect(military(Republic, 'police')).eql([]);
    expect(military(Republic, 'suffrage')).eql([]);
  });

  it("counts units with an attack away from any city, bombers anywhere, but not fighters, diplomats, or a unit on a Fortress near its player's city", (): void => {
    const city = cityOf(human),
      away = { distanceFrom: () => 10 },
      near = { distanceFrom: () => 3 },
      aggressive = (units: Unit[], improvements: unknown[] = []): number =>
        yieldsOf(city, {
          level: 0,
          Current: Democracy,
          units,
          cities: [city],
          improvements,
        }).filter((cityYield) => cityYield instanceof MilitaryUnhappiness)
          .length;

    expect(aggressive([unitOf(Warrior, human, away)])).equal(1);
    expect(aggressive([unitOf(Warrior, human, away, 0)])).equal(0);
    expect(aggressive([unitOf(Warrior, human, city.tile())])).equal(0);
    expect(aggressive([unitOf(Bomber, human, city.tile())])).equal(1);
    expect(aggressive([unitOf(Fighter, human, away)])).equal(0);
    expect(aggressive([unitOf(Envoy, human, away)])).equal(0);
    expect(
      aggressive([unitOf(Warrior, human, near)], [instanceOf(Fortress)])
    ).equal(0);
    expect(aggressive([unitOf(Warrior, human, near)], [])).equal(1);
  });

  it("counts a unit on a Fortress near another player's city, or on an Airbase near its own", (): void => {
    const near = { distanceFrom: () => 2 },
      theirs = cityOf(computer),
      city = cityOf(human),
      aggressive = (cities: City[], improvements: unknown[]): number =>
        yieldsOf(city, {
          level: 0,
          Current: Democracy,
          units: [unitOf(Warrior, human, near)],
          cities,
          improvements,
        }).filter((cityYield) => cityYield instanceof MilitaryUnhappiness)
          .length;

    // `near` is 2 from every city: only the person's own makes the Fortress safe.
    expect(aggressive([theirs], [instanceOf(Fortress)])).equal(1);
    expect(aggressive([city], [instanceOf(Fortress)])).equal(0);
    expect(aggressive([city], [instanceOf(Airbase)])).equal(1);
  });

  it('exempts a unit on a Fortress 3 from its own city, but not one 4 away', (): void => {
    const city = cityOf(human),
      aggressive = (distance: number): number =>
        yieldsOf(city, {
          level: 0,
          Current: Democracy,
          units: [unitOf(Warrior, human, { distanceFrom: () => distance })],
          cities: [city],
          improvements: [instanceOf(Fortress)],
        }).filter((cityYield) => cityYield instanceof MilitaryUnhappiness)
          .length;

    expect(aggressive(3)).equal(0);
    expect(aggressive(4)).equal(1);
  });

  it('works them out afresh for each call, and with no yields given', (): void => {
    const city = cityOf(human),
      cities = [...new Array(7).fill(0).map(() => cityOf(human)), city],
      registry = new RuleRegistry(),
      cityRegistry = {
        getByPlayer: (player: unknown) =>
          cities.filter((other) => other.player() === player),
        indexOf: (other: City) => cities.indexOf(other),
        getByTile: () => null,
      };

    registry.register(
      ...yieldRules(
        { getByCity: () => ({ size: () => 5 }) } as any,
        governedBy(Despotism),
        { getByCity: () => [] } as any,
        cityRegistry as any,
        atLevel(3),
        playedBy(human),
        { getByTile: () => [] } as any,
        roles
      )
    );

    const rule = registry
        .entries()
        .find(
          (entry) => entry.id() === 'civ2-city-happiness:city/yield/empire-size'
        )!,
      empire = (): number =>
        reduceYield(
          registry.process(CityYield, city, []).flat() as Yield[],
          PopulationUnhappiness
        );

    // 8 cities, the city at index 7, a limit of 8: (8 - 8 + 7) / 8 = 0; with 9: (9 - 8 + 7) / 8 = 1.
    expect(empire()).equal(2);

    cities.push(cityOf(human));

    expect(empire()).equal(3);
    expect(() => rule.validate(city)).not.throw();
    expect((rule as any).validate(city)).true;
  });

  it("works out the empire size and the aggressive units once a city's yields", (): void => {
    const city = cityOf(human),
      away = { distanceFrom: () => 10 },
      cities = [
        ...new Array(7).fill(0).map(() => cityOf(human)),
        city,
        ...new Array(6).fill(0).map(() => cityOf(human)),
      ];

    calls.indexOf = 0;
    calls.getByCity = 0;

    // Deity, 14 cities under Democracy: 4 born unhappy, and a limit of 10, so (14 - 10 + 7) / 10 = 1 more.
    const yields = yieldsOf(city, {
      level: 5,
      Current: Democracy,
      cities,
      units: [unitOf(Warrior, human, away)],
    });

    expect(total(yields, PopulationUnhappiness)).equal(5);
    expect(yields.some((cityYield) => cityYield instanceof MilitaryUnhappiness))
      .true;
    expect(calls.indexOf).equal(1);
    // Once for the aggressive units, and once more as the base library lists the city's units to make the yields.
    expect(calls.getByCity).equal(2);
  });
});

describe('city:cost', (): void => {
  const city = instanceOf(City, {
      player: () => null,
      tile: () => 'centre',
    }),
    costs = (
      Current: typeof Government,
      yields: Yield[],
      units: Unit[] = []
    ): Yield[] => {
      const registry = new RuleRegistry();

      registry.register(
        ...cost(governedBy(Current), {
          getByTile: () => units,
        } as any)
      );

      return registry.process(Cost, city, yields).flat();
    },
    armed = (count: number) =>
      new Array(count).fill(0).map(() =>
        instanceOf(Warrior, {
          player: () => null,
          attack: () => ({ value: () => 1 }),
          id: () => 'unit',
        })
      );

  it('makes a citizen happier for every 2 luxuries', (): void => {
    expect(
      reduceYield(costs(Republic, [new Luxuries(5)]), LuxuryHappiness)
    ).equal(2);
  });

  it('keeps martial law with up to 3 units: each calming 1 up to Monarchy, and 2 under Communism', (): void => {
    const calmed = (
      Current: typeof Government,
      unhappy: number,
      units: number
    ) =>
      -reduceYield(
        costs(Current, [new Unhappiness(unhappy)], armed(units)),
        MartialLaw
      );

    expect(calmed(Despotism, 5, 4)).equal(3);
    expect(calmed(Monarchy, 2, 4)).equal(2);
    expect(calmed(Communism, 9, 4)).equal(6);
    expect(calmed(Communism, 3, 4)).equal(3);
    expect(calmed(Republic, 5, 4)).equal(0);
    expect(calmed(Fundamentalism, 5, 4)).equal(0);
  });

  it('leaves no unhappy citizens under Fundamentalism', (): void => {
    const yields = costs(Fundamentalism, [new Unhappiness(4)]);

    expect(-reduceYield(yields, GovernmentContent)).equal(4);
    expect(reduceYield([new Unhappiness(4), ...yields], Unhappiness)).equal(0);
    expect(
      costs(Monarchy, [new Unhappiness(4)]).some(
        (cityYield) => cityYield instanceof GovernmentContent
      )
    ).false;
  });
});

describe('disorder and celebrating', (): void => {
  const check = (
    Rule: typeof CelebrateLeader | typeof CivilDisorder,
    size: number,
    yields: Yield[],
    Current: typeof Government = Monarchy
  ): boolean => {
    const registry = new RuleRegistry(),
      city = instanceOf(City, { player: () => null }),
      cityGrowth = { size: () => size, city: () => city },
      growthRegistry = { getByCity: () => cityGrowth } as any,
      specialists = { getByCity: () => [] } as any;

    registry.register(
      ...celebrateLeader(growthRegistry, specialists, governedBy(Current)),
      ...civilDisorder(growthRegistry, specialists)
    );

    return registry.process(Rule, city, yields).some((result) => result);
  };

  it('is in disorder with more unhappy citizens than happy ones', (): void => {
    expect(check(CivilDisorder, 4, [new Unhappiness(2), new Happiness(2)]))
      .false;
    expect(check(CivilDisorder, 4, [new Unhappiness(3), new Happiness(2)]))
      .true;
  });

  it('celebrates with more than 2 citizens, none unhappy, half (rounded up) happy, not under Anarchy', (): void => {
    expect(check(CelebrateLeader, 3, [new Happiness(2)])).true;
    expect(check(CelebrateLeader, 3, [new Happiness(1)])).false;
    expect(check(CelebrateLeader, 2, [new Happiness(2)])).false;
    expect(check(CelebrateLeader, 4, [new Happiness(3), new Unhappiness(1)]))
      .false;
    expect(check(CelebrateLeader, 3, [new Happiness(2)], Anarchy)).false;
  });
});
