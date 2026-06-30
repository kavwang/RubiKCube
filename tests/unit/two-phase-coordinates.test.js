import assert from "node:assert/strict";
import test from "node:test";
import { CubieCube, MOVE_CUBES } from "../../src/three-by-three/domain/two-phase/cubie-cube.js";
import {
  getTwist, setTwist, TWIST_COUNT,
  getFlip, setFlip, FLIP_COUNT,
  getUDSlice, setUDSlice, UDSLICE_COUNT,
  getCornerPerm, setCornerPerm, CORNER_PERM_COUNT,
  getEdgePerm, setEdgePerm, EDGE_PERM_COUNT,
  getUDSlicePerm, setUDSlicePerm, UDSLICE_PERM_COUNT
} from "../../src/three-by-three/domain/two-phase/coordinates.js";

test("Coordinates: twist roundtrip on random states", () => {
  const cube = new CubieCube();
  // Test identity
  assert.equal(getTwist(cube), 0);
  
  // Test some values
  const testValues = [0, 1, 10, 100, 1000, TWIST_COUNT - 1];
  for (const val of testValues) {
    setTwist(cube, val);
    assert.equal(getTwist(cube), val, `Twist roundtrip failed for ${val}`);
  }
});

test("Coordinates: flip roundtrip on random states", () => {
  const cube = new CubieCube();
  assert.equal(getFlip(cube), 0);
  
  const testValues = [0, 1, 10, 100, 1000, FLIP_COUNT - 1];
  for (const val of testValues) {
    setFlip(cube, val);
    assert.equal(getFlip(cube), val, `Flip roundtrip failed for ${val}`);
  }
});

test("Coordinates: UDSlice roundtrip", () => {
  const cube = new CubieCube();
  assert.equal(getUDSlice(cube), 0);
  
  const testValues = [0, 1, 10, 100, UDSLICE_COUNT - 1];
  for (const val of testValues) {
    setUDSlice(cube, val);
    assert.equal(getUDSlice(cube), val, `UDSlice roundtrip failed for ${val}`);
  }
});

test("Coordinates: CornerPerm roundtrip", () => {
  const cube = new CubieCube();
  assert.equal(getCornerPerm(cube), 0);
  
  const testValues = [0, 1, 10, 100, 1000, 10000, CORNER_PERM_COUNT - 1];
  for (const val of testValues) {
    setCornerPerm(cube, val);
    assert.equal(getCornerPerm(cube), val, `CornerPerm roundtrip failed for ${val}`);
  }
});

test("Coordinates: EdgePerm roundtrip", () => {
  const cube = new CubieCube();
  assert.equal(getEdgePerm(cube), 0);
  
  const testValues = [0, 1, 10, 100, 1000, 10000, EDGE_PERM_COUNT - 1];
  for (const val of testValues) {
    setEdgePerm(cube, val);
    assert.equal(getEdgePerm(cube), val, `EdgePerm roundtrip failed for ${val}`);
  }
});

test("Coordinates: UDSlicePerm roundtrip", () => {
  const cube = new CubieCube();
  assert.equal(getUDSlicePerm(cube), 0);
  
  const testValues = [0, 1, 5, 10, UDSLICE_PERM_COUNT - 1];
  for (const val of testValues) {
    setUDSlicePerm(cube, val);
    assert.equal(getUDSlicePerm(cube), val, `UDSlicePerm roundtrip failed for ${val}`);
  }
});
