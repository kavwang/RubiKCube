import assert from "node:assert/strict";
import test from "node:test";
import { CubieCube, MOVE_CUBES, MOVE_NAMES } from "../../src/three-by-three/domain/two-phase/cubie-cube.js";

test("CubieCube: solved cube is identity", () => {
  const cube = new CubieCube();
  assert.equal(cube.isIdentity(), true);
});

test("CubieCube: applying MOVE_U 4 times returns to identity", () => {
  let cube = new CubieCube();
  const moveU = MOVE_CUBES[0]; // U

  for (let i = 0; i < 4; i++) {
    cube = cube.multiply(moveU);
  }

  assert.equal(cube.isIdentity(), true);
});

test("CubieCube: applying MOVE_R 4 times returns to identity", () => {
  let cube = new CubieCube();
  const moveR = MOVE_CUBES[3]; // R

  for (let i = 0; i < 4; i++) {
    cube = cube.multiply(moveR);
  }

  assert.equal(cube.isIdentity(), true);
});

test("CubieCube: applying MOVE_F 4 times returns to identity", () => {
  let cube = new CubieCube();
  const moveF = MOVE_CUBES[6]; // F

  for (let i = 0; i < 4; i++) {
    cube = cube.multiply(moveF);
  }

  assert.equal(cube.isIdentity(), true);
});

test("CubieCube: applying a move and its CCW returns to identity", () => {
  const basicMoves = [0, 3, 6, 9, 12, 15]; // U, R, F, D, L, B
  for (const m of basicMoves) {
    const cw = MOVE_CUBES[m];
    const ccw = MOVE_CUBES[m + 2];
    const result = cw.multiply(ccw);
    assert.equal(result.isIdentity(), true, `Move ${MOVE_NAMES[m]} and ${MOVE_NAMES[m+2]} did not cancel out`);
  }
});
