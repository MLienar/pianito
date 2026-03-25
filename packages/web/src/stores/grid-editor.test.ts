import type { Grid, GridData } from "@pianito/shared";
import { afterEach, describe, expect, it } from "vitest";
import { useGridEditorStore } from "./grid-editor";

const store = () => useGridEditorStore.getState();

function sq(chord: string | null): { chord: string | null; nbBeats: number } {
  return { chord, nbBeats: 4 };
}

function makeGrid(overrides?: Partial<Grid>): Grid {
  return {
    id: "grid-1",
    userId: "user-1",
    name: "Test Grid",
    tempo: 120,
    loopCount: 2,
    data: {
      squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
      groups: [{ squareCount: 4, repeatCount: 1 }],
    },
    // Default playback settings
    metronome: false,
    style: null,
    swing: 0,
    chordsEnabled: true,
    bassEnabled: true,
    drumsEnabled: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function multiGroupData(): GridData {
  return {
    squares: [sq("C"), sq("Am"), sq("F"), sq("G"), sq("Dm"), sq("E7")],
    groups: [
      { squareCount: 4, repeatCount: 2 },
      { squareCount: 2, repeatCount: 1 },
    ],
  };
}

afterEach(() => {
  store().reset();
});

describe("initialize", () => {
  it("sets all fields from a grid", () => {
    store().initialize(makeGrid());

    expect(store().gridId).toBe("grid-1");
    expect(store().name).toBe("Test Grid");
    expect(store().tempo).toBe(120);
    expect(store().loopCount).toBe(2);
    expect(store().data.squares).toHaveLength(4);
    expect(store().isDirty).toBe(false);
  });

  it("migrates legacy lines format", () => {
    const grid = makeGrid({
      data: {
        lines: [
          [{ chord: "C" }, { chord: "G" }, { chord: "Am" }, { chord: "F" }],
        ],
      } as unknown as GridData,
    });

    store().initialize(grid);

    expect(store().data.squares).toEqual([
      sq("C"),
      sq("G"),
      sq("Am"),
      sq("F"),
    ]);
    expect(store().data.groups).toEqual([
      { squareCount: 4, repeatCount: 1 },
    ]);
  });

  it("falls back to default data for unknown format", () => {
    const grid = makeGrid({
      data: { unknown: true } as unknown as GridData,
    });

    store().initialize(grid);

    expect(store().data.squares).toEqual([sq(null)]);
    expect(store().data.groups).toEqual([
      { squareCount: 1, repeatCount: 1 },
    ]);
  });
});

describe("reset", () => {
  it("restores initial state", () => {
    store().initialize(makeGrid());
    store().updateName("Changed");
    store().reset();

    expect(store().gridId).toBeNull();
    expect(store().name).toBe("");
    expect(store().tempo).toBe(90);
    expect(store().isDirty).toBe(false);
  });
});

describe("updateName", () => {
  it("sets name and marks dirty", () => {
    store().updateName("New Name");

    expect(store().name).toBe("New Name");
    expect(store().isDirty).toBe(true);
  });
});

describe("updateTempo", () => {
  it("sets tempo and marks dirty", () => {
    store().updateTempo(140);

    expect(store().tempo).toBe(140);
    expect(store().isDirty).toBe(true);
  });
});

describe("clampTempo", () => {
  it("clamps tempo below minimum to 30", () => {
    store().updateTempo(10);
    store().clampTempo();

    expect(store().tempo).toBe(30);
  });

  it("clamps tempo above maximum to 300", () => {
    store().updateTempo(500);
    store().clampTempo();

    expect(store().tempo).toBe(300);
  });

  it("does not change tempo within range", () => {
    store().updateTempo(120);
    store().clampTempo();

    expect(store().tempo).toBe(120);
  });
});

describe("updateLoopCount", () => {
  it("sets loop count and marks dirty", () => {
    store().updateLoopCount(5);

    expect(store().loopCount).toBe(5);
    expect(store().isDirty).toBe(true);
  });

  it("clamps to minimum 1", () => {
    store().updateLoopCount(0);
    expect(store().loopCount).toBe(1);
  });

  it("clamps to maximum 50", () => {
    store().updateLoopCount(100);
    expect(store().loopCount).toBe(50);
  });
});

describe("setChord", () => {
  it("sets a chord at the given index", () => {
    store().initialize(makeGrid());
    store().initialize(makeGrid()); // reset isDirty
    store().setChord(0, "D");

    expect(store().data.squares[0]?.chord).toBe("D");
    expect(store().isDirty).toBe(true);
  });

  it("does not update when chord is already the same (no-op)", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().setChord(0, "C"); // already "C"

    expect(store().data).toBe(dataBefore);
    expect(store().isDirty).toBe(false);
  });
});

describe("clearChord", () => {
  it("sets the chord to null", () => {
    store().initialize(makeGrid());
    store().clearChord(0);

    expect(store().data.squares[0]?.chord).toBeNull();
    expect(store().isDirty).toBe(true);
  });

  it("is a no-op when chord is already null", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq(null)],
          groups: [{ squareCount: 1, repeatCount: 1 }],
        },
      }),
    );
    const dataBefore = store().data;

    store().clearChord(0);

    expect(store().data).toBe(dataBefore);
  });
});

describe("addSquare", () => {
  it("adds an empty square to the last group", () => {
    store().initialize(makeGrid());
    store().addSquare();

    expect(store().data.squares).toHaveLength(5);
    expect(store().data.squares[4]?.chord).toBeNull();
    expect(store().data.groups[0]?.squareCount).toBe(5);
    expect(store().isDirty).toBe(true);
  });
});

describe("removeSquare", () => {
  it("removes a square and decrements group count", () => {
    store().initialize(makeGrid());
    store().removeSquare(2); // remove "F"

    expect(store().data.squares).toHaveLength(3);
    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "C",
      "Am",
      "G",
    ]);
    expect(store().data.groups[0]?.squareCount).toBe(3);
    expect(store().isDirty).toBe(true);
  });

  it("does not remove the last remaining square", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C")],
          groups: [{ squareCount: 1, repeatCount: 1 }],
        },
      }),
    );

    store().removeSquare(0);

    expect(store().data.squares).toHaveLength(1);
  });

  it("removes a single-square group entirely", () => {
    store().initialize(
      makeGrid({
        data: multiGroupData(),
      }),
    );

    // Remove both squares from group 2 (indices 4, 5 → after first removal index 4)
    store().removeSquare(5);
    store().removeSquare(4);

    expect(store().data.groups).toHaveLength(1);
    expect(store().data.squares).toHaveLength(4);
  });
});

describe("reorderSquares", () => {
  it("moves a square from one position to another", () => {
    store().initialize(makeGrid());
    store().reorderSquares(0, 2); // move C from index 0 to index 2

    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "Am",
      "F",
      "C",
      "G",
    ]);
    expect(store().isDirty).toBe(true);
  });
});

describe("updateGroupRepeatCount", () => {
  it("updates the repeat count for a group", () => {
    store().initialize(makeGrid());
    store().initialize(makeGrid()); // reset isDirty
    store().updateGroupRepeatCount(0, 3);

    expect(store().data.groups[0]?.repeatCount).toBe(3);
    expect(store().isDirty).toBe(true);
  });

  it("clamps to minimum 1", () => {
    store().initialize(makeGrid());
    store().updateGroupRepeatCount(0, 0);

    expect(store().data.groups[0]?.repeatCount).toBe(1);
  });

  it("clamps to maximum 50", () => {
    store().initialize(makeGrid());
    store().updateGroupRepeatCount(0, 100);

    expect(store().data.groups[0]?.repeatCount).toBe(50);
  });

  it("is a no-op when value is already the same", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().updateGroupRepeatCount(0, 1); // already 1

    expect(store().data).toBe(dataBefore);
  });
});

describe("splitGroup", () => {
  it("splits a group at the given square index", () => {
    store().initialize(makeGrid());
    store().splitGroup(2); // split at index 2 → groups of 2 and 2

    expect(store().data.groups).toEqual([
      { squareCount: 2, repeatCount: 1 },
      { squareCount: 2, repeatCount: 1 },
    ]);
    expect(store().isDirty).toBe(true);
  });

  it("preserves repeat count in both halves", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
          groups: [{ squareCount: 4, repeatCount: 3 }],
        },
      }),
    );
    store().splitGroup(2);

    expect(store().data.groups).toEqual([
      { squareCount: 2, repeatCount: 3 },
      { squareCount: 2, repeatCount: 3 },
    ]);
  });

  it("is a no-op at the first square of a group", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().splitGroup(0); // offset 0 → no-op

    expect(store().data).toBe(dataBefore);
  });

  it("is a no-op for a single-square group", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C")],
          groups: [{ squareCount: 1, repeatCount: 1 }],
        },
      }),
    );
    const dataBefore = store().data;

    store().splitGroup(0);

    expect(store().data).toBe(dataBefore);
  });
});

describe("mergeWithPreviousGroup", () => {
  it("merges a group with the previous one", () => {
    store().initialize(makeGrid({ data: multiGroupData() }));
    store().mergeWithPreviousGroup(1);

    expect(store().data.groups).toEqual([
      { squareCount: 6, repeatCount: 2 },
    ]);
    expect(store().data.squares).toHaveLength(6);
    expect(store().isDirty).toBe(true);
  });

  it("keeps the previous group's repeat count", () => {
    store().initialize(makeGrid({ data: multiGroupData() }));
    store().mergeWithPreviousGroup(1);

    expect(store().data.groups[0]?.repeatCount).toBe(2);
  });

  it("is a no-op for the first group (index 0)", () => {
    store().initialize(makeGrid({ data: multiGroupData() }));
    const dataBefore = store().data;

    store().mergeWithPreviousGroup(0);

    expect(store().data).toBe(dataBefore);
  });

  it("is a no-op for out-of-range index", () => {
    store().initialize(makeGrid({ data: multiGroupData() }));
    const dataBefore = store().data;

    store().mergeWithPreviousGroup(10);

    expect(store().data).toBe(dataBefore);
  });
});

describe("groupSquares", () => {
  it("groups a range of squares into a new group", () => {
    store().initialize(makeGrid());
    store().groupSquares(1, 2); // group Am and F

    expect(store().data.groups).toEqual([
      { squareCount: 1, repeatCount: 1 },
      { squareCount: 2, repeatCount: 1 },
      { squareCount: 1, repeatCount: 1 },
    ]);
    expect(store().isDirty).toBe(true);
  });

  it("groups squares spanning multiple existing groups", () => {
    store().initialize(makeGrid({ data: multiGroupData() }));
    store().groupSquares(3, 4); // spans group boundary

    // Group 1 becomes 3 squares, new group is 2, group 2 becomes 1
    expect(store().data.groups).toEqual([
      { squareCount: 3, repeatCount: 2 },
      { squareCount: 2, repeatCount: 1 },
      { squareCount: 1, repeatCount: 1 },
    ]);
  });

  it("is a no-op for invalid range (start > end)", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().groupSquares(3, 1);

    expect(store().data).toBe(dataBefore);
  });

  it("is a no-op for out-of-bounds indices", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().groupSquares(-1, 2);

    expect(store().data).toBe(dataBefore);
  });

  it("is a no-op when end exceeds square count", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().groupSquares(0, 100);

    expect(store().data).toBe(dataBefore);
  });

  it("can group all squares", () => {
    store().initialize(makeGrid({ data: multiGroupData() }));
    store().groupSquares(0, 5);

    expect(store().data.groups).toEqual([
      { squareCount: 6, repeatCount: 1 },
    ]);
  });
});
