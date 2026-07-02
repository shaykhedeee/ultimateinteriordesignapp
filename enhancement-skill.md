# ULTIDA Autopilot — S.M.A.R.T.E.R. Contract

## Purpose
Give Hermes a repeatable self-improvement loop for the Ultimate Interior Design App without constant user prompting.

## S.M.A.R.T.E.R. Mini Cycle
1. **S**creen state first: verify existing router + screens are mapped and loadable before new services.  
2. **M**ake one small, scoped change per cycle; avoid rewrites.  
3. **A**lways log to `enhancement-log.txt` with timestamp + changed paths.  
4. **R**oute/screen > service > server scaffold priority order.  
5. **T**ests: only lightweight validation within the cycle; fail small and log.  
6. **E**nable autonomous validation only; no reshoots, no breaking global state.  
7. **R**ecord context for next cycle in the log.  
8. **S**top if repeated identical failure occurs; mark blocked in log and pause further attempts on that target.

## Cedelworks Constraint
- Cedelworks remains untouched; no bundled/patch-outside skill files are edited from this loop.  
- Improvements stay in the app repo and cron logs.

## Cron Contract
- **App Runner**: every 6h — applies one minimal enhancement and logs it.  
- **Health Check**: every 2h — reports backend reachability only.  
- **Auto-Commit**: nightly at 21:00 — local commit only; no push.

## Stopping Condition
If the same failure repeats twice in a row, stop automatic attempts on that issue and report it in `enhancement-log.txt` as blocked.
