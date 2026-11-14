import Government from '@civ-clone/core-government/Government';
import Unit from '@civ-clone/core-unit/Unit';

/** An instance of `Type` without running its constructor: enough for what's asked of its class. */
export const instanceOf = <T>(
  Type: abstract new (...args: any[]) => T,
  extra: object = {}
): T => Object.assign(Object.create(Type.prototype), extra);

/** A player government registry whose players all have `Current`, or none. */
export const governedBy = (Current: typeof Government | null) =>
  ({
    getByPlayer: () => {
      if (Current === null) {
        throw new Error('no government');
      }

      return {
        is: (...governments: (typeof Government)[]) =>
          governments.includes(Current),
      };
    },
  } as any);

/** A city growth registry whose cities are all of `size`. */
export const sized = (size: number) =>
  ({ getByCity: () => ({ size: () => size }) } as any);

/** A unit registry whose cities each support `units`. */
export const supporting = (units: Unit[]) =>
  ({ getByCity: () => units } as any);

/** A difficulty registry at `level` (0 Chieftain to 5 Deity). */
export const atLevel = (level: number) =>
  ({ get: () => ({ level: () => level }) } as any);

/** A client registry in which `humans` are a person's players: each has one client, which isn't a computer player's. */
export const playedBy = (...humans: unknown[]) =>
  ({
    getBy: (key: string, player: unknown) =>
      humans.includes(player) ? [{}] : [],
  } as any);
