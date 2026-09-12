# Quantum Blackjack

A single-player blackjack variant with quantum cards, built with Vite + TypeScript (no framework, plain DOM rendering).

## Running the game

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run test     # run the unit test suite (vitest)
```

## Project structure

- `src/game/cards.ts` — data-driven regular deck and quantum card definitions.
- `src/game/deck.ts` — deck creation/shuffling and draw functions.
- `src/game/blackjack.ts` — hand-value math, including the possible-value range for hands with unobserved quantum cards.
- `src/game/quantum.ts` — observation and entanglement rules.
- `src/game/chips.ts` — win/loss/push chip reward rules.
- `src/game/engine.ts` — game state and round-flow orchestration (start round, hit, stand, observe, entangle, resolution).
- `src/ui/render.ts` — DOM rendering only; no game rules live here.
- `src/main.ts` — wires UI events to the engine.

## How the quantum mechanics work

- A quantum card holds two fixed values, e.g. `[3|7]`. It stays a `?`/`[3|7]` until observed.
- **Observe**: the player picks an unobserved quantum card in their hand; it randomly collapses to one of its two values and cannot be observed again.
- **Entangle**: for 1 chip, the player links two unobserved quantum cards in *their own hand* as `SAME` (both resolve to the same side/index) or `OPPOSITE` (resolve to opposite sides/indexes). "Side" means position in the superposition, not the numeric value.
- Observing either half of an entangled pair immediately resolves its partner according to the relationship.
- Any quantum cards still unobserved when the player stands (or is guaranteed to bust) are collapsed automatically, respecting any active entanglement.
- The dealer only ever plays regular cards — quantum cards are a player-only mechanic (see "Assumptions").

## Assumptions

The rules document intentionally leaves some details unspecified. Simplest reasonable choices made:

- **Dealer never draws quantum cards.** The dealer's hand is always fully known and its hit/stand decision is fully deterministic; quantum uncertainty only applies to the player.
- **Observe/Entangle only apply to the player's own hand.** The player has no way to interact with the dealer's cards before the dealer's turn.
- **Guaranteed-bust short-circuit.** If a hand's *minimum* possible value (assuming every unobserved quantum card resolves to its lowest side) already exceeds 21, the round ends immediately as a bust rather than waiting for a Stand — this can never be avoided by any future observation, so playing on would be meaningless.
- **A player bust always loses**, even if the dealer's hand would also end up busting after full resolution.
- **Quantum card supply**: 2 copies of each of the 16 listed quantum card definitions are shuffled into the standard 52-card deck (see `QUANTUM_COPIES_PER_DEF` in `src/game/cards.ts`).
- **Full re-render UI.** The interface re-renders from scratch on every state change; there's no animation, which matches the "simple graphics" requirement.
- No betting, insurance, splitting, doubling, surrender, or persistence — none of these were requested.

## Known limitations

- If the deck runs out of regular cards for the dealer mid-round (very unlikely given deck size), the dealer simply stops drawing.
- No accessibility beyond semantic HTML/button elements; no keyboard shortcuts.
- Single local player only, no persistence between page reloads.
