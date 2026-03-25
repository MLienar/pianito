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
    composer: null,
    key: null,
    tempo: 120,
    loopCount: 2,
    visibility: "private",
    data: {
      squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
      groups: [],
    },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function groupedData(): GridData {
  return {
    squares: [sq("C"), sq("Am"), sq("F"), sq("G"), sq("Dm"), sq("E7")],
    groups: [
      { start: 0, nbSquares: 4, repeatCount: 2 },
      { start: 4, nbSquares: 2, repeatCount: 3 },
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
    expect(store().data.groups).toEqual([]);
    expect(store().isDirty).toBe(false);
  });

  it("migrates old format groups, dropping repeatCount=1", () => {
    const grid = makeGrid({
      data: {
        squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
        groups: [
          { squareCount: 2, repeatCount: 3 },
          { squareCount: 2, repeatCount: 1 },
        ],
      } as unknown as GridData,
    });

    store().initialize(grid);

    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 2, repeatCount: 3 },
    ]);
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
    expect(store().data.groups).toEqual([]);
  });

  it("passes through new format groups", () => {
    const grid = makeGrid({
      data: {
        squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
        groups: [{ start: 0, nbSquares: 4, repeatCount: 2 }],
      },
    });

    store().initialize(grid);

    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 4, repeatCount: 2 },
    ]);
  });

  it("falls back to default data for unknown format", () => {
    const grid = makeGrid({
      data: { unknown: true } as unknown as GridData,
    });

    store().initialize(grid);

    expect(store().data.squares).toEqual([sq(null)]);
    expect(store().data.groups).toEqual([]);
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
    store().initialize(makeGrid());
    store().setChord(0, "D");

    expect(store().data.squares[0]?.chord).toBe("D");
    expect(store().isDirty).toBe(true);
  });

  it("does not update when chord is already the same (no-op)", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().setChord(0, "C");

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
          groups: [],
        },
      }),
    );
    const dataBefore = store().data;

    store().clearChord(0);

    expect(store().data).toBe(dataBefore);
  });
});

describe("addSquare", () => {
  it("adds an empty square without creating a group", () => {
    store().initialize(makeGrid());
    store().addSquare();

    expect(store().data.squares).toHaveLength(5);
    expect(store().data.squares[4]?.chord).toBeNull();
    expect(store().data.groups).toEqual([]);
    expect(store().isDirty).toBe(true);
  });

  it("does not modify existing groups", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am")],
          groups: [{ start: 0, nbSquares: 2, repeatCount: 2 }],
        },
      }),
    );
    store().addSquare();

    expect(store().data.squares).toHaveLength(3);
    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 2, repeatCount: 2 },
    ]);
  });
});

describe("removeSquare", () => {
  it("removes a standalone square", () => {
    store().initialize(makeGrid());
    store().removeSquare(2);

    expect(store().data.squares).toHaveLength(3);
    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "C",
      "Am",
      "G",
    ]);
  });

  it("shrinks a group when removing a square inside it", () => {
    store().initialize(
      makeGrid({
        data: groupedData(),
      }),
    );
    store().removeSquare(1); // remove "Am" from group 0

    expect(store().data.groups[0]).toEqual({
      start: 0,
      nbSquares: 3,
      repeatCount: 2,
    });
    expect(store().data.groups[1]).toEqual({
      start: 3,
      nbSquares: 2,
      repeatCount: 3,
    });
  });

  it("removes a group when its last square is removed", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am")],
          groups: [{ start: 1, nbSquares: 1, repeatCount: 2 }],
        },
      }),
    );
    store().removeSquare(1);

    expect(store().data.squares).toHaveLength(1);
    expect(store().data.groups).toEqual([]);
  });

  it("shifts group starts when removing a square before a group", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
          groups: [{ start: 2, nbSquares: 2, repeatCount: 2 }],
        },
      }),
    );
    store().removeSquare(0);

    expect(store().data.groups).toEqual([
      { start: 1, nbSquares: 2, repeatCount: 2 },
    ]);
  });

  it("does not remove the last remaining square", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C")],
          groups: [],
        },
      }),
    );

    store().removeSquare(0);

    expect(store().data.squares).toHaveLength(1);
  });
});

describe("removeSquares", () => {
  it("removes multiple squares and adjusts groups", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    store().removeSquares(new Set([0, 4])); // remove from both groups

    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "Am",
      "F",
      "G",
      "E7",
    ]);
    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 3, repeatCount: 2 },
      { start: 3, nbSquares: 1, repeatCount: 3 },
    ]);
  });
});

describe("reorderSquares", () => {
  it("moves a square from one position to another", () => {
    store().initialize(makeGrid());
    store().reorderSquares(0, 2);

    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "Am",
      "F",
      "C",
      "G",
    ]);
    expect(store().isDirty).toBe(true);
  });

  it("shrinks source group when dragging a square out", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G"), sq("Dm")],
          groups: [{ start: 0, nbSquares: 4, repeatCount: 2 }],
        },
      }),
    );
    // Drag "C" (index 0) out to index 4 (after the group, standalone area)
    store().reorderSquares(0, 4);

    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "Am",
      "F",
      "G",
      "Dm",
      "C",
    ]);
    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 3, repeatCount: 2 },
    ]);
  });

  it("expands group when dragging a square into its interior", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G"), sq("Dm")],
          groups: [{ start: 0, nbSquares: 3, repeatCount: 2 }],
        },
      }),
    );
    // Drag "Dm" (index 4) to index 1 (inside the group)
    store().reorderSquares(4, 1);

    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "C",
      "Dm",
      "Am",
      "F",
      "G",
    ]);
    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 4, repeatCount: 2 },
    ]);
  });

  it("keeps group size when reordering within the same group", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
          groups: [{ start: 0, nbSquares: 4, repeatCount: 2 }],
        },
      }),
    );
    store().reorderSquares(0, 2);

    expect(store().data.squares.map((s) => s.chord)).toEqual([
      "Am",
      "F",
      "C",
      "G",
    ]);
    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 4, repeatCount: 2 },
    ]);
  });

  it("is a no-op when fromIndex equals toIndex", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().reorderSquares(1, 1);

    expect(store().data).toBe(dataBefore);
  });
});

describe("updateGroupRepeatCount", () => {
  it("updates the repeat count for a group", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am")],
          groups: [{ start: 0, nbSquares: 2, repeatCount: 1 }],
        },
      }),
    );
    store().updateGroupRepeatCount(0, 3);

    expect(store().data.groups[0]?.repeatCount).toBe(3);
    expect(store().isDirty).toBe(true);
  });

  it("clamps to minimum 1", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am")],
          groups: [{ start: 0, nbSquares: 2, repeatCount: 2 }],
        },
      }),
    );
    store().updateGroupRepeatCount(0, 0);

    expect(store().data.groups[0]?.repeatCount).toBe(1);
  });

  it("clamps to maximum 50", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am")],
          groups: [{ start: 0, nbSquares: 2, repeatCount: 2 }],
        },
      }),
    );
    store().updateGroupRepeatCount(0, 100);

    expect(store().data.groups[0]?.repeatCount).toBe(50);
  });
});

describe("splitGroup", () => {
  it("splits a group at the given square index", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
          groups: [{ start: 0, nbSquares: 4, repeatCount: 2 }],
        },
      }),
    );
    store().splitGroup(2);

    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 2, repeatCount: 2 },
      { start: 2, nbSquares: 2, repeatCount: 2 },
    ]);
    expect(store().isDirty).toBe(true);
  });

  it("is a no-op at the first square of a group", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G")],
          groups: [{ start: 0, nbSquares: 4, repeatCount: 2 }],
        },
      }),
    );
    const dataBefore = store().data;

    store().splitGroup(0);

    expect(store().data).toBe(dataBefore);
  });

  it("is a no-op for a standalone square", () => {
    store().initialize(makeGrid());
    const dataBefore = store().data;

    store().splitGroup(0);

    expect(store().data).toBe(dataBefore);
  });
});

describe("mergeWithPreviousGroup", () => {
  it("merges a group with the previous one", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    store().mergeWithPreviousGroup(1);

    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 6, repeatCount: 2 },
    ]);
    expect(store().isDirty).toBe(true);
  });

  it("absorbs gap squares between groups", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G"), sq("Dm"), sq("E7")],
          groups: [
            { start: 0, nbSquares: 2, repeatCount: 2 },
            { start: 4, nbSquares: 2, repeatCount: 3 },
          ],
        },
      }),
    );
    store().mergeWithPreviousGroup(1);

    // Absorbs standalone squares at indices 2-3
    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 6, repeatCount: 2 },
    ]);
  });

  it("keeps the previous group's repeat count", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    store().mergeWithPreviousGroup(1);

    expect(store().data.groups[0]?.repeatCount).toBe(2);
  });

  it("is a no-op for the first group (index 0)", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    const dataBefore = store().data;

    store().mergeWithPreviousGroup(0);

    expect(store().data).toBe(dataBefore);
  });

  it("is a no-op for out-of-range index", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    const dataBefore = store().data;

    store().mergeWithPreviousGroup(10);

    expect(store().data).toBe(dataBefore);
  });
});

describe("deleteGroup", () => {
  it("removes a group without affecting squares", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    store().deleteGroup(0);

    expect(store().data.squares).toHaveLength(6);
    expect(store().data.groups).toEqual([
      { start: 4, nbSquares: 2, repeatCount: 3 },
    ]);
    expect(store().isDirty).toBe(true);
  });

  it("can remove all groups", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    store().deleteGroup(1);
    store().deleteGroup(0);

    expect(store().data.squares).toHaveLength(6);
    expect(store().data.groups).toEqual([]);
  });

  it("is a no-op for invalid index", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    const dataBefore = store().data;

    store().deleteGroup(-1);

    expect(store().data).toBe(dataBefore);
  });
});

describe("groupSquares", () => {
  it("groups a range of standalone squares", () => {
    store().initialize(makeGrid());
    store().groupSquares(1, 2);

    expect(store().data.groups).toEqual([
      { start: 1, nbSquares: 2, repeatCount: 1 },
    ]);
    expect(store().isDirty).toBe(true);
  });

  it("trims an overlapping group", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G"), sq("Dm"), sq("E7")],
          groups: [{ start: 0, nbSquares: 4, repeatCount: 2 }],
        },
      }),
    );
    store().groupSquares(2, 4); // overlaps last 2 squares of existing group

    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 2, repeatCount: 2 },
      { start: 2, nbSquares: 3, repeatCount: 1 },
    ]);
  });

  it("replaces a fully contained group", () => {
    store().initialize(
      makeGrid({
        data: {
          squares: [sq("C"), sq("Am"), sq("F"), sq("G"), sq("Dm"), sq("E7")],
          groups: [{ start: 1, nbSquares: 2, repeatCount: 3 }],
        },
      }),
    );
    store().groupSquares(0, 5);

    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 6, repeatCount: 1 },
    ]);
  });

  it("can group all squares", () => {
    store().initialize(makeGrid({ data: groupedData() }));
    store().groupSquares(0, 5);

    expect(store().data.groups).toEqual([
      { start: 0, nbSquares: 6, repeatCount: 1 },
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
});
