<script lang="ts">
    export let octaves = 2;
    export let keysPressed = [];
    export let verbose;

    import Key from "./Key.svelte";
    import { onMount } from "svelte";
    import MIDI from "midi.js";
    import {
        Chord,
        Inversion,
        notesInChord,
        noteToPositionInKey,
    } from "./chords";

    let notes;

    let minRootNote = 60;
    let maxRootRote = 72;
    let rootNote = 60;
    let chordTypeToGuess = null;
    let playing = false;
    let randomRoot = true;

    const chordTypes = Object.values(Chord).filter(
        (value) => typeof value === "string",
    );
    const defaultChordsToInclude: Array<String> = [
        Chord.Major,
        Chord.Minor,
        Chord.Seventh,
    ].map((t) => Chord[t]);
    let includeChordTypes: Array<boolean> = chordTypes.map((chordType) =>
        defaultChordsToInclude.includes(chordType),
    );

    $: {
        let start = 0;
        let finish = octaves * 12 + 1;
        const isRootNatural = ![1, 3, 6, 8, 10].includes(rootNote % 12);
        if (!isRootNatural) {
            start -= 1;
            finish += 1;
        }
        const arr = Array.from({ length: finish - start }, (_, a) => a + start);
        notes = arr.map((i) => i + (rootNote - Math.floor(octaves / 2) * 12));
    }

    let logs = [];

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    function midiToKey(note: number) {
        if (note < notes[0]) {
            note += 12 * octaves;
        }
        let octave = Math.floor(note / (12 * octaves));
        let offset = (note - rootNote) % (12 * octaves);
        if (octave % (octaves + 1) == 0 && (offset == 0 || offset == 1)) {
            // need this because we add in 1 extra note of the one we start on
            return 12 * octaves + offset;
        } else {
            return offset;
        }
    }

    function noteOn(
        note: number,
        velocity: number = 127,
        playOnKeyboard = true,
        markCorrect = false,
        markWrong = false,
    ) {
        logs = [`Note ${note} was pressed!`, ...logs];
        MIDI.noteOn(0, note, velocity, 0);
        if (playOnKeyboard) {
            let key = midiToKey(note);
            keyBindings[key]?.playKey();
            if (markCorrect) {
                keyBindings[key]?.markCorrect();
            }
            if (markWrong) {
                keyBindings[key]?.markWrong();
            }
        }
    }

    function noteOff(note: number) {
        logs = [`Note ${note} was released!`, ...logs];
        MIDI.noteOff(0, note, 0);
        let key = midiToKey(note);
        keyBindings[key]?.stopPlayingKey();
    }

    function listInputsAndOutputs(midiAccess: WebMidi.MIDIAccess) {
        for (const entry of midiAccess.inputs) {
            const input = entry[1];
            console.log(
                "Input port [type:'" +
                    input.type +
                    "'] id:'" +
                    input.id +
                    "' manufacturer:'" +
                    input.manufacturer +
                    "' name:'" +
                    input.name +
                    "' version:'" +
                    input.version +
                    "'",
            );
        }

        for (const entry of midiAccess.outputs) {
            const output = entry[1];
            console.log(
                "Output port [type:'" +
                    output.type +
                    "'] id:'" +
                    output.id +
                    "' manufacturer:'" +
                    output.manufacturer +
                    "' name:'" +
                    output.name +
                    "' version:'" +
                    output.version +
                    "'",
            );
        }
    }

    function onMIDIMessage(event: WebMidi.MIDIMessageEvent) {
        if (verbose) {
            let str =
                "MIDI message received at timestamp " +
                event.timeStamp +
                "[" +
                event.data.length +
                " bytes]: ";
            for (let i = 0; i < event.data.length; i++) {
                str += "0x" + event.data[i].toString(16) + " ";
                event.data;
            }
            console.log(str);
        }

        const command = event.data[0];
        const note = keyBindings[midiToKey(event.data[1])]?.getNote();
        const velocity = event.data.length > 2 ? event.data[2] : 0; // a velocity value might not be included with a noteOff command

        switch (command) {
            case 144: // noteOn
                if (velocity > 0) {
                    noteOn(note);
                } else {
                    noteOff(note);
                }
                break;
            case 128: // noteOff
                noteOff(note);
                break;
            // we could easily expand this switch statement to cover other types of commands such as controllers or sysex
        }
    }

    onMount(async () => {
        MIDI.loadPlugin({
            soundfontUrl: "./soundfont/",
            instrument: "acoustic_grand_piano",
            onprogress: function (state, progress) {
                console.log(state, progress);
            },
            onsuccess: function () {
                MIDI.setVolume(0, 127);
            },
        });
        try {
            let midiAccess = await navigator.requestMIDIAccess();
            console.log("MIDI ready!");
            if (verbose) listInputsAndOutputs(midiAccess);
            midiAccess.inputs.forEach((entry) => {
                entry.onmidimessage = onMIDIMessage;
            });
        } catch (err) {
            console.log("Failed to get MIDI access - " + err);
        }
    });

    let keyBindings: Record<number, Key> = {};

    let innerWidth: number;
    $: keyWidth = Math.min((innerWidth - 36 / octaves) / (octaves * 8), 56);

    function chordOn(
        start: number,
        type: Chord = Chord.Major,
        inversion: Inversion = Inversion.Root,
        playOnKeyboard = true,
        markCorrect = false,
        markWrong = false,
    ) {
        chordOnOrOff(
            start,
            type,
            true,
            inversion,
            playOnKeyboard,
            markCorrect,
            markWrong,
        );
    }

    function chordOff(
        start: number,
        type: Chord = Chord.Major,
        inversion: Inversion = Inversion.Root,
    ) {
        chordOnOrOff(start, type, false, inversion);
    }

    function chordOnOrOff(
        start: number,
        chordType: Chord,
        play: boolean,
        inversion: Inversion,
        playOnKeyboard = true,
        markCorrect = false,
        markWrong = false,
    ) {
        let chordNotes = notesInChord(start, chordType, inversion);
        chordNotes.forEach((note) => {
            if (play) {
                noteOn(note, 127, playOnKeyboard, markCorrect, markWrong);
            } else {
                noteOff(note);
            }
        });
    }

    function getRandomChord(): Chord {
        let availableChords = chordTypes.filter((_, i) => includeChordTypes[i]);
        return Chord[
            availableChords[Math.floor(Math.random() * availableChords.length)]
        ];
    }

    async function playPattern(newChordToGuess) {
        playing = true;
        if (newChordToGuess) {
            chordTypeToGuess = getRandomChord();
            if (chordTypeToGuess == null) {
                return;
            }
            if (randomRoot) {
                rootNote =
                    Math.floor(Math.random() * (maxRootRote - minRootNote)) +
                    minRootNote;
            }
        }
        let hold = 500;
        chordOn(rootNote, chordTypeToGuess, Inversion.Root, false);
        await sleep(hold);
        chordOff(rootNote, chordTypeToGuess, Inversion.Root);
        playing = false;
    }

    async function guessChordType(chordTypeString: string) {
        let chordType = Chord[chordTypeString];
        let hold = 500;
        playing = true;

        const correct = chordType == chordTypeToGuess;
        chordOn(rootNote, chordType, Inversion.Root, true, correct, !correct);
        await sleep(hold);
        chordOff(rootNote, chordType, Inversion.Root);

        if (correct) {
            chordTypeToGuess = null;
        }
        playing = false;
    }
</script>

<svelte:window bind:innerWidth />

<label>
    Root Note
    <input
        type="number"
        bind:value={rootNote}
        min={minRootNote}
        max={maxRootRote}
    />
    <input
        type="range"
        bind:value={rootNote}
        min={minRootNote}
        max={maxRootRote}
    />
</label>

<label>
    Random Root
    <input type="checkbox" bind:checked={randomRoot} />
</label>

{#each chordTypes as chordType, i}
    <label>
        {chordType}
        <input
            type="checkbox"
            bind:checked={includeChordTypes[i]}
            on:change={() => (chordTypeToGuess = null)}
        />
    </label>
{/each}

{#key rootNote}
    <div class="keyboard">
        <div>
            {#each notes as note}
                <Key
                    noteNum={note}
                    {keyWidth}
                    on:notepressed={({ detail }) => noteOn(detail)}
                    on:notereleased={({ detail }) => noteOff(detail)}
                    pressed={keysPressed.includes(note)}
                    bind:this={keyBindings[midiToKey(note)]}
                    numberInKey={noteToPositionInKey(rootNote, note) == 1
                        ? 1
                        : null}
                />
            {/each}
        </div>
    </div>
{/key}

{#if chordTypeToGuess == null && includeChordTypes.includes(true)}
    <button
        on:mousedown={async () => {
            await playPattern(true);
        }}
    >
        Guess Chord
    </button>
{/if}

{#if chordTypeToGuess != null && !playing}
    <button
        on:mousedown={async () => {
            await playPattern(false);
        }}
    >
        Replay
    </button>
    {#each chordTypes as chordType, i}
        {#if includeChordTypes[i]}
            <button
                on:mousedown={async () => {
                    await guessChordType(chordType);
                }}
            >
                {chordType}
            </button>
        {/if}
    {/each}
{/if}

{#if verbose}
    {#each logs as log}
        <div>{log}</div>
    {/each}
{/if}
