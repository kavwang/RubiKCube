const MOVE_FACE = ["U", "R", "F", "D", "L", "B"];
const MOVE_SUFFIX = ["", "2", "'"];

export function moveToText(moveId) {
  const f = Math.floor(moveId / 3);
  const s = moveId % 3;
  return MOVE_FACE[f] + MOVE_SUFFIX[s];
}

export function describeMove(move, i18n) {
  let token = "";
  if (typeof move === 'number') {
    token = moveToText(move);
  } else {
    token = move;
  }

  const face = token[0];
  const suffix = token.slice(1);

  const faceName = i18n.t(`faces.${face}`);
  let turnText = i18n.t('turns.cw');
  if (suffix === '2') {
    turnText = i18n.t('turns.half');
  } else if (suffix === "'") {
    turnText = i18n.t('turns.ccw');
  }

  return `${token} (${faceName} ${turnText})`;
}
