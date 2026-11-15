import {
  Anarchy,
  Democracy,
  Fundamentalism,
  Monarchy,
  Republic,
} from '@civ-clone/civ2-government/Governments';
import {
  CIVIL_DISORDER,
  LEADER_CELEBRATION,
  civilDisorder,
  leaderCelebration,
} from '../lib/cityStatus';
import AnarchyDuration from '@civ-clone/base-government-change/Rules/AnarchyDuration';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Aqueduct from '@civ-clone/base-city-improvement-aqueduct/Aqueduct';
import Food from '@civ-clone/base-terrain-yield-food/Food';
import { expect } from 'chai';
import { instanceOf } from './lib/stubs';
import { pendingRevolution } from '@civ-clone/civ2-government/lib/revolution';
import turnStart from '../Rules/Player/turn-start';

describe('player:turn-start', (): void => {
  const setUp = (
    Current: typeof Government,
    human: boolean,
    { food = 0, size = 5, improvements = [] as unknown[] } = {}
  ) => {
    const ruleRegistry = new RuleRegistry(),
      pendingEffects = new PendingEffectRegistry(),
      events: unknown[][] = [],
      engine = { emit: (...args: unknown[]) => events.push(args) } as any,
      player = instanceOf(Player),
      playerGovernment = new PlayerGovernment(player, undefined, ruleRegistry),
      city = instanceOf(City, {
        player: () => player,
        yields: () => (food === 0 ? [] : [new Food(food)]),
      }),
      state = { disorder: false, celebrating: false },
      growth = {
        size: () => growth.cities,
        cities: size,
        stored: 7,
        city: () => city,
        progress: () => ({
          value: () => growth.stored,
          set: (value: number) => (growth.stored = value),
        }),
        grow: () => {
          growth.cities++;
          growth.stored = 0;
        },
      },
      gameTurn = new Turn();

    playerGovernment.set(new Current());

    ruleRegistry.register(
      new CivilDisorder(new Effect(() => state.disorder)),
      new CelebrateLeader(new Effect(() => state.celebrating)),
      new AnarchyDuration(new Effect(() => 2)),
      ...turnStart(
        { getByPlayer: () => [city] } as any,
        ruleRegistry,
        engine,
        { getByPlayer: () => playerGovernment } as any,
        pendingEffects,
        gameTurn,
        { getBy: () => (human ? [{}] : []) } as any,
        { getByCity: () => growth } as any,
        { getByCity: () => improvements } as any
      )
    );

    const turn = () => {
      ruleRegistry.process(TurnStart, player);
      gameTurn.increment();
    };

    return {
      city,
      events,
      growth,
      pendingEffects,
      playerGovernment,
      state,
      turn,
    };
  };

  it("brings a person's Democracy down into Anarchy on a city's second turn of disorder", (): void => {
    const { city, events, pendingEffects, playerGovernment, state, turn } =
      setUp(Democracy, true);

    state.disorder = true;

    turn();

    expect(civilDisorder(city, pendingEffects)).not.null;
    expect(playerGovernment.is(Democracy)).true;

    turn();

    expect(playerGovernment.is(Anarchy)).true;
    expect(pendingRevolution(playerGovernment, pendingEffects)).not.null;
    expect(events.map(([event]) => event)).include(
      'player:government:collapsed'
    );
  });

  it("leaves a computer player's Democracy, and a person's Monarchy, standing", (): void => {
    [setUp(Democracy, false), setUp(Monarchy, true)].forEach(
      ({ playerGovernment, state, turn }) => {
        const Before = playerGovernment.current()!.constructor;

        state.disorder = true;
        turn();
        turn();

        expect(playerGovernment.current()!.constructor).equal(Before);
      }
    );
  });

  it('ends a celebration in disorder without a word, and announces one that ends otherwise', (): void => {
    const { city, events, pendingEffects, state, turn } = setUp(Monarchy, true);

    state.celebrating = true;
    turn();

    expect(leaderCelebration(city, pendingEffects)).not.null;
    expect(events).eql([['city:leader-celebration', city]]);

    state.celebrating = false;
    state.disorder = true;
    events.length = 0;
    turn();

    expect(leaderCelebration(city, pendingEffects)).null;
    expect(events).eql([['city:civil-disorder', city]]);

    state.disorder = false;
    state.celebrating = true;
    events.length = 0;
    turn();

    expect(events).eql([
      ['city:order-restored', city],
      ['city:leader-celebration', city],
    ]);

    state.celebrating = false;
    events.length = 0;
    turn();

    expect(events).eql([['city:leader-celebration-ended', city]]);
  });

  it("grows a Republic's or a Democracy's city by 1 on each turn it celebrates again, leaving its food box (city_process_disorder ~4271)", (): void => {
    [Republic, Democracy].forEach((Current) => {
      const { growth, state, turn } = setUp(Current, true, { food: 1 });

      state.celebrating = true;
      turn();

      // The first turn only records the celebration.
      expect(growth.cities).equal(5);

      turn();

      expect([growth.cities, growth.stored]).eql([6, 7]);

      turn();

      expect(growth.cities).equal(7);
    });
  });

  it('grows no city under Fundamentalism or below, without food to spare, or at a cap it lacks the building for', (): void => {
    [
      setUp(Fundamentalism, true, { food: 1 }),
      setUp(Monarchy, true, { food: 1 }),
      setUp(Republic, true, { food: 0 }),
      setUp(Republic, true, { food: 1, size: 8 }),
      setUp(Democracy, true, { food: 1, size: 12 }),
      setUp(Democracy, true, {
        food: 1,
        size: 12,
        improvements: [Object.create(Aqueduct.prototype)],
      }),
    ].forEach(({ growth, state, turn }) => {
      const before = growth.cities;

      state.celebrating = true;
      turn();
      turn();

      expect(growth.cities).equal(before);
    });

    const { growth, state, turn } = setUp(Republic, true, {
      food: 1,
      size: 8,
      improvements: [Object.create(Aqueduct.prototype)],
    });

    state.celebrating = true;
    turn();
    turn();

    expect(growth.cities).equal(9);
  });

  it('keeps the statuses under their own save keys', (): void => {
    expect(CIVIL_DISORDER).equal('civ2-city-happiness:civil-disorder');
    expect(LEADER_CELEBRATION).equal('civ2-city-happiness:leader-celebration');
  });
});
