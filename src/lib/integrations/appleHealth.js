// Apple Health — feeds metrics + trends + habits (bodyweight, sleep, workouts)
//
// Real wiring (when ready):
//   HealthKit is iOS-only; there is no direct web API. Two viable paths:
//     a) Companion Apple Shortcut that queries HealthKit and POSTs to a webhook
//        on a daily schedule. Map:
//          HKQuantityTypeIdentifierBodyMass        → trends.bodyweight
//          HKCategoryTypeIdentifierSleepAnalysis   → habitLog.sleep
//          HKWorkoutType                           → habitLog.gym
//     b) Manual XML export from Health.app, parsed and uploaded.
//   Path (a) is what this dashboard should target.

export const id = "appleHealth";
export const label = "Apple Health";
export const feeds = "metrics, trends, habits";
export const description = "Bodyweight, sleep, workouts";

export async function connect() {
  throw new Error("Apple Health: needs companion Shortcut + webhook URL. See module header.");
}

export async function disconnect() {}

// Returns { ok, data, error }. data shape (when implemented):
//   { bodyweight: number[], sleepDates: string[], workoutDates: string[] }
export async function sync(_opts = {}) {
  return { ok: false, error: "stub", data: null };
}
