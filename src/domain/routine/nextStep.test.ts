import { nextStep, type RoutineStepSummary } from './nextStep';

const HYDRATE: RoutineStepSummary = { id: 1, label: 'Hydrate & Kickstart', order: 1 };
const WORKOUT: RoutineStepSummary = { id: 2, label: 'Fasted Workout', order: 2 };
const SHOWER: RoutineStepSummary = { id: 3, label: 'Shower & Reward', order: 3 };

const steps = [HYDRATE, WORKOUT, SHOWER];

describe('nextStep', () => {
  test('returns the first step in order when nothing is completed', () => {
    expect(nextStep(steps, {})).toEqual(HYDRATE);
  });

  test('a step with no completion row defaults to pending', () => {
    expect(nextStep(steps, { [HYDRATE.id]: 'completed' })).toEqual(WORKOUT);
  });

  test('skipping a step moves on to the next one, without blocking progress', () => {
    expect(nextStep(steps, { [HYDRATE.id]: 'completed', [WORKOUT.id]: 'skipped' })).toEqual(
      SHOWER
    );
  });

  test('a snoozed step still counts as the next action', () => {
    expect(nextStep(steps, { [HYDRATE.id]: 'completed', [WORKOUT.id]: 'snoozed' })).toEqual(
      WORKOUT
    );
  });

  test('returns null once every step is completed or skipped', () => {
    expect(
      nextStep(steps, {
        [HYDRATE.id]: 'completed',
        [WORKOUT.id]: 'skipped',
        [SHOWER.id]: 'completed',
      })
    ).toBeNull();
  });

  test('breaks ties in `order` deterministically by id', () => {
    const tied: RoutineStepSummary[] = [
      { id: 20, label: 'B', order: 1 },
      { id: 10, label: 'A', order: 1 },
    ];
    expect(nextStep(tied, {})).toEqual(tied[1]); // id 10, lower id wins the tie
  });

  test('handles an empty step list', () => {
    expect(nextStep([], {})).toBeNull();
  });
});
