import {
  applyMoveCOMulti,
  applyMoveCPMulti
} from "./two-by-two-moves.js";

function solveOptimal2x2(cpStart, coStart) {
  const getKey = (cp, co) => {
    return cp.join("") + co.join("");
  };

  const startKey = getKey(cpStart, coStart);
  const targetKey = "0123456700000000";

  if (startKey === targetKey) {
    return [];
  }

  const forwardVisited = new Map();
  const backwardVisited = new Map();

  forwardVisited.set(startKey, []);
  backwardVisited.set(targetKey, []);

  let forwardQueue = [{ cp: cpStart, co: coStart, key: startKey }];
  let backwardQueue = [{ cp: [0, 1, 2, 3, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0], key: targetKey }];

  const invertPath = (path) => {
    return path.slice().reverse().map((m) => Math.floor(m / 3) * 3 + (2 - (m % 3)));
  };

  while (forwardQueue.length > 0 && backwardQueue.length > 0) {
    if (forwardQueue.length <= backwardQueue.length) {
      const nextQueue = [];
      for (const node of forwardQueue) {
        const path = forwardVisited.get(node.key);
        const lastFace = path.length > 0 ? Math.floor(path[path.length - 1] / 3) : -1;

        for (let mv = 0; mv < 18; mv += 1) {
          const face = Math.floor(mv / 3);
          if (face === lastFace) continue;

          const nextCP = applyMoveCPMulti(node.cp, face, (mv % 3) + 1);
          const nextCO = applyMoveCOMulti(node.co, face, (mv % 3) + 1);
          const nextKey = getKey(nextCP, nextCO);

          if (backwardVisited.has(nextKey)) {
            const backPath = backwardVisited.get(nextKey);
            return [...path, mv, ...invertPath(backPath)];
          }

          if (!forwardVisited.has(nextKey)) {
            forwardVisited.set(nextKey, [...path, mv]);
            nextQueue.push({ cp: nextCP, co: nextCO, key: nextKey });
          }
        }
      }
      forwardQueue = nextQueue;
    } else {
      const nextQueue = [];
      for (const node of backwardQueue) {
        const path = backwardVisited.get(node.key);
        const lastFace = path.length > 0 ? Math.floor(path[path.length - 1] / 3) : -1;

        for (let mv = 0; mv < 18; mv += 1) {
          const face = Math.floor(mv / 3);
          if (face === lastFace) continue;

          const nextCP = applyMoveCPMulti(node.cp, face, (mv % 3) + 1);
          const nextCO = applyMoveCOMulti(node.co, face, (mv % 3) + 1);
          const nextKey = getKey(nextCP, nextCO);

          if (forwardVisited.has(nextKey)) {
            const forwardPath = forwardVisited.get(nextKey);
            return [...forwardPath, ...invertPath([...path, mv])];
          }

          if (!backwardVisited.has(nextKey)) {
            backwardVisited.set(nextKey, [...path, mv]);
            nextQueue.push({ cp: nextCP, co: nextCO, key: nextKey });
          }
        }
      }
      backwardQueue = nextQueue;
    }
  }

  return null;
}

export function solveFastest2x2(cp, co) {
  const optMoves = solveOptimal2x2(cp, co);
  if (!optMoves) {
    return { ok: false, message: "最速解求解失敗，請檢查顏色輸入。" };
  }
  return {
    ok: true,
    moves: optMoves,
    phases: [
      { name: "雙向尋優最速解", startIdx: 0, endIdx: optMoves.length }
    ]
  };
}
