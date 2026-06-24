import assert from "node:assert/strict";
import test from "node:test";

import { createCubeEngine } from "../../src/three-by-three/domain/three-by-three-cube-engine.js";

function inverseMove(token) {
  if (token.endsWith("2")) return token;
  if (token.endsWith("'")) return token[0];
  return `${token[0]}'`;
}

function inverseMoves(tokens) {
  const out = [];
  for (let i = tokens.length - 1; i >= 0; i -= 1) out.push(inverseMove(tokens[i]));
  return out;
}

test("parseMoves should accept valid notation", () => {
  const engine = createCubeEngine();
  const parsed = engine.parseMoves("R U R' U' F2");
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.moves, ["R", "U", "R'", "U'", "F2"]);
});

test("parseMoves should reject unsupported notation", () => {
  const engine = createCubeEngine();
  const parsed = engine.parseMoves("X R");
  assert.equal(parsed.ok, false);
});

test("move followed by inverse should return solved state", () => {
  const engine = createCubeEngine();
  for (const token of engine.MOVE_TOKENS) {
    const state1 = engine.applyMoveToken(engine.SOLVED_FACELETS, token);
    const state2 = engine.applyMoveToken(state1, inverseMove(token));
    assert.equal(engine.isCubeSolved(state2), true, `failed move inversion for ${token}`);
  }
});

test("scramble then inverse sequence should return solved state", () => {
  const engine = createCubeEngine();
  const scramble = ["R", "U", "R'", "U'", "F2", "D", "L2", "B'"];
  const scrambledState = engine.applyMoveTokens(engine.SOLVED_FACELETS, scramble);
  const restoredState = engine.applyMoveTokens(scrambledState, inverseMoves(scramble));
  assert.equal(engine.isCubeSolved(restoredState), true);
});

test("random scramble should not contain same adjacent faces", () => {
  const engine = createCubeEngine();
  const scrambleText = engine.makeRandomScramble(25);
  const moves = scrambleText.split(/\s+/).filter(Boolean);
  assert.equal(moves.length, 25);

  for (let i = 1; i < moves.length; i += 1) {
    assert.notEqual(moves[i][0], moves[i - 1][0], `adjacent same face at index ${i}`);
  }
});

