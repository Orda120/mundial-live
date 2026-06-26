import test from "node:test";
import assert from "node:assert/strict";

import {
  FIFA_THIRD_PLACE_MATRIX,
  THIRD_PLACE_TABLE_COLUMNS,
  assignOfficialThirds,
  rowForThirdPlaceGroups,
  thirdPlaceGroupKey,
} from "./thirdPlaceMatrix.js";

test("contains one official row for every eight-third-place-team combination", () => {
  assert.equal(FIFA_THIRD_PLACE_MATRIX.length, 495);

  const keys = FIFA_THIRD_PLACE_MATRIX.map((row) => thirdPlaceGroupKey(row.split("")));
  assert.equal(new Set(keys).size, 495);
  keys.forEach((key) => assert.match(key, /^[A-L]{8}$/));
});

test("never assigns a third-place team to its own group winner", () => {
  FIFA_THIRD_PLACE_MATRIX.forEach((row) => {
    row.split("").forEach((thirdGroup, index) => {
      assert.notEqual(thirdGroup, THIRD_PLACE_TABLE_COLUMNS[index][1]);
    });
  });
});

test("assigns third-place teams by the FIFA matrix, not by ranking order", () => {
  const expected = {
    79: "H", // 1A
    85: "G", // 1B
    81: "B", // 1D
    74: "C", // 1E
    82: "A", // 1G
    77: "F", // 1I
    87: "D", // 1K
    80: "E", // 1L
  };

  assert.equal(rowForThirdPlaceGroups(["A", "B", "C", "D", "E", "F", "G", "H"]), "HGBCAFDE");
  assert.deepEqual(assignOfficialThirds(["A", "B", "C", "D", "E", "F", "G", "H"]), expected);
  assert.deepEqual(assignOfficialThirds(["H", "G", "F", "E", "D", "C", "B", "A"]), expected);
});
