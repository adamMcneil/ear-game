export function notesInChord(
    start: number,
    chordType: Chord,
    inversion: Inversion = Inversion.Root,) {
    switch (chordType) {
        case Chord.Major:
            return majorChordNotes(start, inversion);
        case Chord.Minor:
            return minorChordNotes(start, inversion);
        case Chord.Seventh:
            return seventhChordNotes(start, inversion);
        case Chord.MajorSeventh:
            return majorSeventhChordNotes(start, inversion);
        default:
            return [];
    }
}

export function majorChordNotes(
    start: number,
    inversion: Inversion = Inversion.Root,
) {
    let notes = [start, start + 4, start + 7];
    applyInversion(notes, inversion);
    return notes;
}

export function minorChordNotes(
    start: number,
    inversion: Inversion = Inversion.Root,
) {
    let notes = [start, start + 3, start + 7];
    applyInversion(notes, inversion);
    return notes;
}

export function seventhChordNotes(
    start: number,
    inversion: Inversion = Inversion.Root,
) {
    let notes = [start, start + 4, start + 7, start + 10];
    applyInversion(notes, inversion);
    return notes;
}

export function majorSeventhChordNotes(
    start: number,
    inversion: Inversion = Inversion.Root,
) {
    let notes = [start, start + 4, start + 7, start + 11];
    applyInversion(notes, inversion);
    return notes;
}

function applyInversion(notes, inversion: Inversion) {
    switch (inversion) {
        case Inversion.First:
            notes[0] += 12;
            break;
        case Inversion.Second:
            notes[0] += 12;
            notes[1] += 12;
            break;
    }
}

export enum Chord {
    Major,
    Minor,
    Seventh,
    MajorSeventh,
}

export enum Inversion {
    Root,
    First,
    Second,
}

const majorKeyOffsets = [0, 2, 4, 5, 7, 9, 11, 12];

export function getNotesInKey(root: number) {
    return majorKeyOffsets.map((x) => x + root);
}

export function getNthNoteInKey(root: number, n: number) {
    let notes = getNotesInKey(root);
    return notes[n];
}

export function noteToPositionInKey(root: number, note: number) {
    let offset = (note - root) % 12;
    if (offset < 0) offset += 12;
    const positionInKey = majorKeyOffsets.indexOf(offset)
    if (positionInKey >= 0) {
        return positionInKey + 1;
    } else {
        return null;
    }
}