/**
 * Extracts chord progressions from the veltzer/openbook repo (.ly.mako files)
 * and outputs JSON compatible with Pianito's grid format.
 *
 * Usage:
 *   node scripts/extract-openbook.mjs <openbook-dir> [output-file]
 *
 * Example:
 *   node scripts/extract-openbook.mjs ../openbook openbook-grids.json
 */

import { Chord } from "tonal";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ── LilyPond note-name → pitch-class mapping ────────────────────────────

const LILY_NOTE_MAP = {
	c: "C",
	d: "D",
	e: "E",
	f: "F",
	g: "G",
	a: "A",
	b: "B",
	ces: "Cb",
	des: "Db",
	ees: "Eb",
	fes: "Fb",
	ges: "Gb",
	aes: "Ab",
	bes: "Bb",
	cis: "C#",
	dis: "D#",
	eis: "E#",
	fis: "F#",
	gis: "G#",
	ais: "A#",
	bis: "B#",
};

// ── LilyPond chord-quality suffix → tonal symbol mapping ────────────────

const LILY_QUALITY_MAP = {
	"": "",
	maj7: "maj7",
	maj: "maj7",
	"maj7.9": "maj9",
	maj9: "maj9",
	"maj7.11+": "maj7#11",
	"6": "6",
	"6.9": "6/9",
	"7": "7",
	"7.9-": "7b9",
	"7.9+": "7#9",
	"7.5-": "7b5",
	"7.5+": "7#5",
	"7.5-.9-": "7b5b9",
	"7.5-.9+": "7b5#9",
	"7.5+.9-": "7#5b9",
	"7.5+.9+": "7#5#9",
	"7.9-.5+": "7#5b9",
	"7.11+": "7#11",
	"7.13": "13",
	"7.4": "7sus4",
	"9": "9",
	"9.11+": "9#11",
	"9-": "b9",
	"5+": "aug",
	"5+7": "aug7",
	"5+9": "9#5",
	aug: "aug",
	dim: "dim",
	dim7: "dim7",
	m: "m",
	m6: "m6",
	"m6.9": "m69",
	m7: "m7",
	"m7.5-": "m7b5",
	"m7.9": "m9",
	"m7.9-": "m7b9",
	"m7.7+": "mMaj7",
	"m7+": "mMaj7",
	m9: "m9",
	m11: "m11",
	m5: "dim",
	"m5+": "m#5",
	"sus4.7": "7sus4",
	"sus4.9": "9sus4",
	sus7: "7sus4",
	"7.11": "11",
	"13": "13",
	"5.11": "add11",
	"7.5": "7",
	"7.9": "9",
	"9.5+": "9#5",
	"maj7.": "maj7",
	maj1: "maj7",
	dim5m7: "dim7",
	"7.3-.5-.9-.11-.13-": "7alt",
};

// ── LilyPond key → standard key string ──────────────────────────────────

function lilyKeyToString(note, mode) {
	const root = LILY_NOTE_MAP[note];
	if (!root) return `${note} ${mode}`;
	return mode === "minor" ? `${root}m` : root;
}

// ── Parse a single chord token from \chordmode ──────────────────────────

function parseLilyDuration(dur, multiplier) {
	const base = parseInt(dur, 10);
	if (isNaN(base) || base === 0) return 4;
	let beats = 4 / base;
	if (dur.includes(".")) {
		beats *= 1.5;
	}
	if (multiplier) {
		beats *= parseInt(multiplier, 10);
	}
	return beats;
}

/** Last seen duration, used when a token omits it (LilyPond inherits). */
let lastDuration = "1";

function parseChordToken(token) {
	// Duration is optional in LilyPond — inherited from previous note
	// Slash chords: e.g. f2:dim7/c → Fdim7/C (bass note after /)
	const match = token.match(
		/^([a-g](?:es|is|eses|isis)?)(\d+\.?)?(?:\*(\d+))?(?::([a-z0-9.+\-]+))?(?:\/([a-g](?:es|is)?))?$/,
	);
	if (!match) return null;

	const [, lilyNote, duration, multiplier, quality, bassNote] = match;
	if (!lilyNote) return null;

	const root = LILY_NOTE_MAP[lilyNote];
	if (!root) return null;

	// If duration is provided, update the running base duration
	// Note: multiplier (*N) is NOT inherited in LilyPond, only the base duration is
	if (duration) {
		lastDuration = duration;
	}

	const beats = parseLilyDuration(duration || lastDuration, multiplier);
	const qualitySuffix = quality ? (LILY_QUALITY_MAP[quality] ?? quality) : "";
	const bassSuffix = bassNote && LILY_NOTE_MAP[bassNote] ? `/${LILY_NOTE_MAP[bassNote]}` : "";
	const symbol = `${root}${qualitySuffix}${bassSuffix}`;

	return { symbol, beats };
}

// ── Validate chord against tonal ────────────────────────────────────────

function isValidChord(symbol) {
	const c = Chord.get(symbol);
	return c.empty === false;
}

// ── Extract data from a .ly.mako file ───────────────────────────────────

function extractFromFile(content) {
	// Reset duration inheritance for each file
	lastDuration = "1";

	// Handle escaped single quotes (e.g. 'Bessies\'s Blues')
	const titleMatch = content.match(/attributes\['title'\]\s*=\s*'((?:[^'\\]|\\.)*)'/);
	if (!titleMatch) return null;

	const composerMatch = content.match(
		/attributes\['composer'\]\s*=\s*'((?:[^'\\]|\\.)*)'/,
	);
	const styleMatch = content.match(/attributes\['style'\]\s*=\s*'([^']+)'/);
	const tempoMatch = content.match(/\\tempo\s+"[^"]*"\s+\d+\s*=\s*(\d+)/);
	const timeMatch = content.match(/\\time\s+(\d+)\/(\d+)/);
	const keyMatch = content.match(
		/\\key\s+([a-g](?:es|is)?)\s+\\(major|minor)/,
	);

	// Extract chords from ChordsReal (preferred) or ChordsFake
	let chordsSection = null;
	for (const partName of ["ChordsReal", "ChordsFake"]) {
		const partStart = content.indexOf(`part=='${partName}'`);
		if (partStart === -1) continue;
		const chordmodeStart = content.indexOf("\\chordmode", partStart);
		if (chordmodeStart === -1) continue;
		const braceStart = content.indexOf("{", chordmodeStart);
		if (braceStart === -1) continue;

		// Find matching closing brace by counting depth
		let depth = 1;
		let i = braceStart + 1;
		while (i < content.length && depth > 0) {
			if (content[i] === "{") depth++;
			else if (content[i] === "}") depth--;
			i++;
		}
		if (depth === 0) {
			chordsSection = content.slice(braceStart + 1, i - 1);
			break;
		}
	}

	if (!chordsSection) return null;

	// Structural parse: extract chords with repeat/group info
	const result = parseChordsStructurally(chordsSection);
	if (result.chords.length === 0) return null;

	// Parse time signature — default to 4/4
	let timeSignature = { numerator: 4, denominator: 4 };
	if (timeMatch) {
		const num = parseInt(timeMatch[1], 10);
		const den = parseInt(timeMatch[2], 10);
		if (num >= 2 && num <= 6 && [2, 4, 8].includes(den)) {
			timeSignature = { numerator: num, denominator: den };
		}
	}

	return {
		title: (titleMatch[1] ?? "Untitled").replace(/\\'/g, "'"),
		composer: composerMatch?.[1]?.replace(/\\'/g, "'") ?? null,
		key: keyMatch ? lilyKeyToString(keyMatch[1], keyMatch[2]) : null,
		tempo: tempoMatch ? Math.min(300, Math.max(30, parseInt(tempoMatch[1], 10))) : null,
		timeSignature,
		style: styleMatch?.[1] ?? null,
		chords: result.chords,
		groups: result.groups,
	};
}

// ── Structural chord parser with repeat/group awareness ─────────────

function tryParseChord(token) {
	const parsed = parseChordToken(token);
	if (!parsed) return null;

	if (isValidChord(parsed.symbol)) return parsed;

	const fixups = [
		parsed.symbol.replace("b9", "7b9"),
		parsed.symbol.replace("(b5)", "b5"),
	];
	const fixed = fixups.find((f) => isValidChord(f));
	if (fixed) return { symbol: fixed, beats: parsed.beats };

	console.warn(`  [warn] Invalid chord: "${parsed.symbol}" (from "${token}")`);
	return null;
}

function tokenize(text) {
	return text
		.split(/[\s|]+/)
		.filter(
			(t) =>
				t.length > 0 &&
				!t.startsWith("\\") &&
				!t.startsWith("%") &&
				!t.startsWith("s") &&
				!t.startsWith('"'),
		);
}

function parseChordsStructurally(section) {
	const chords = [];
	const groups = []; // { startChordIdx, repeatCount } — endIdx filled after

	// Find \repeat volta N { ... } \alternative { { ... } { ... } } patterns
	// Strategy: process the section left-to-right, finding repeat blocks
	let pos = 0;

	while (pos < section.length) {
		const repeatMatch = section.slice(pos).match(/\\repeat\s+volta\s+(\d+)\s*\{/);
		if (!repeatMatch) {
			// No more repeats — parse remaining as plain chords
			const remaining = section.slice(pos);
			const plainText = remaining
				.replace(/\{/g, "")
				.replace(/\}/g, "");
			for (const token of tokenize(plainText)) {
				const ch = tryParseChord(token);
				if (ch) chords.push(ch);
			}
			break;
		}

		// Parse plain chords before the repeat
		const beforeRepeat = section.slice(pos, pos + repeatMatch.index);
		const plainText = beforeRepeat.replace(/\{/g, "").replace(/\}/g, "");
		for (const token of tokenize(plainText)) {
			const ch = tryParseChord(token);
			if (ch) chords.push(ch);
		}

		const repeatCount = parseInt(repeatMatch[1], 10);
		const repeatBodyStart = pos + repeatMatch.index + repeatMatch[0].length;

		// Find the matching } for the repeat body (brace-matching)
		let depth = 1;
		let i = repeatBodyStart;
		while (i < section.length && depth > 0) {
			if (section[i] === "{") depth++;
			else if (section[i] === "}") depth--;
			i++;
		}
		const repeatBody = section.slice(repeatBodyStart, i - 1);

		// Check for \alternative block after the repeat
		const afterRepeat = section.slice(i);
		const altMatch = afterRepeat.match(/^\s*\\alternative\s*\{/);
		let alternatives = [];
		let nextPos = i;

		if (altMatch) {
			// Parse alternative block — find its matching }
			const altStart = i + altMatch[0].length;
			depth = 1;
			let j = altStart;
			while (j < section.length && depth > 0) {
				if (section[j] === "{") depth++;
				else if (section[j] === "}") depth--;
				j++;
			}
			const altContent = section.slice(altStart, j - 1);
			nextPos = j;

			// Split alternatives by top-level { ... } blocks
			let altDepth = 0;
			let altBlockStart = -1;
			for (let k = 0; k < altContent.length; k++) {
				if (altContent[k] === "{") {
					if (altDepth === 0) altBlockStart = k + 1;
					altDepth++;
				} else if (altContent[k] === "}") {
					altDepth--;
					if (altDepth === 0 && altBlockStart >= 0) {
						alternatives.push(altContent.slice(altBlockStart, k));
						altBlockStart = -1;
					}
				}
			}
		}

		// Record group start
		const groupStartIdx = chords.length;

		// Parse the repeat body chords
		const bodyText = repeatBody.replace(/\{/g, "").replace(/\}/g, "");
		for (const token of tokenize(bodyText)) {
			const ch = tryParseChord(token);
			if (ch) chords.push(ch);
		}

		// Append last alternative (the ending) — it plays once after the repeats
		if (alternatives.length > 0) {
			const lastAlt = alternatives[alternatives.length - 1];
			const altText = lastAlt.replace(/\{/g, "").replace(/\}/g, "");
			for (const token of tokenize(altText)) {
				const ch = tryParseChord(token);
				if (ch) chords.push(ch);
			}
		}

		const groupEndIdx = chords.length;

		if (repeatCount > 1 && groupEndIdx > groupStartIdx) {
			groups.push({
				startChordIdx: groupStartIdx,
				endChordIdx: groupEndIdx,
				repeatCount,
			});
		}

		pos = nextPos;
	}

	return { chords, groups };
}

// ── Convert extracted song to Pianito grid format ───────────────────────

function songToGrid(song) {
	const squares = [];
	// Track which square index each chord index maps to
	const chordToSquareStart = [];
	let accumulator = null;
	const ts = song.timeSignature ?? { numerator: 4, denominator: 4 };
	const beatsPerMeasure = ts.numerator;

	function flush() {
		if (!accumulator) return;
		let remaining = accumulator.beats;
		while (remaining > 0) {
			// Fill full measures first, then use what's left (min 1)
			const nb = remaining >= beatsPerMeasure
				? beatsPerMeasure
				: Math.max(1, Math.min(remaining, beatsPerMeasure));
			squares.push({ chord: accumulator.chord, nbBeats: nb });
			remaining -= nb;
		}
		accumulator = null;
	}

	for (let ci = 0; ci < song.chords.length; ci++) {
		const ch = song.chords[ci];
		if (accumulator && accumulator.chord === ch.symbol) {
			accumulator.beats += ch.beats;
		} else {
			flush();
			chordToSquareStart[ci] = squares.length;
			accumulator = { chord: ch.symbol, beats: ch.beats };
		}
		// For merged chords, point to the same square as the start
		if (chordToSquareStart[ci] === undefined) {
			chordToSquareStart[ci] = chordToSquareStart[ci - 1];
		}
	}
	flush();
	// Sentinel for end-of-array mapping
	const totalSquares = squares.length;

	// Map chord-level groups to square-level groups
	const groups = [];
	for (const g of song.groups ?? []) {
		const start = chordToSquareStart[g.startChordIdx] ?? 0;
		const end =
			g.endChordIdx < chordToSquareStart.length
				? chordToSquareStart[g.endChordIdx] ?? totalSquares
				: totalSquares;
		const nbSquares = end - start;
		if (nbSquares > 0 && g.repeatCount > 1) {
			groups.push({ start, nbSquares, repeatCount: g.repeatCount });
		}
	}

	return {
		name: song.title,
		composer: song.composer,
		key: song.key,
		tempo: song.tempo ?? 120,
		timeSignature: ts,
		loopCount: 1,
		visibility: "public",
		data: {
			squares,
			groups,
		},
	};
}

// ── Main ────────────────────────────────────────────────────────────────

const openbookDir = process.argv[2];
const outputFile = process.argv[3] ?? "openbook-grids.json";

if (!openbookDir) {
	console.error(
		"Usage: node scripts/extract-openbook.mjs <openbook-dir> [output-file]",
	);
	process.exit(1);
}

const songsDir = join(openbookDir, "src", "openbook");
const files = readdirSync(songsDir).filter((f) => f.endsWith(".ly.mako"));

console.log(`Found ${files.length} song files in ${songsDir}`);

const grids = [];
let skipped = 0;

for (const file of files) {
	const content = readFileSync(join(songsDir, file), "utf-8");
	const song = extractFromFile(content);
	if (!song) {
		skipped++;
		continue;
	}

	const grid = songToGrid(song);
	grids.push(grid);
	console.log(
		`  ✓ ${song.title} — ${song.chords.length} chords → ${grid.data.squares.length} squares`,
	);
}

writeFileSync(outputFile, JSON.stringify(grids, null, 2));
console.log(
	`\nExtracted ${grids.length} grids (${skipped} skipped). Written to ${outputFile}`,
);
