<script>
    export let noteNum;
    export let keyWidth = 56;
    export let pressed = false;
    export let numberInKey = null;
    let correct = false;
    let wrong = false;
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    let isNatural = ![1, 3, 6, 8, 10].includes(noteNum % 12);
    let bias = 0;
    // the accidental keys are not perfectly in center
    if (!isNatural) {
        if ([1, 6].includes(noteNum % 12)) bias = -keyWidth / 12;
        else if ([3, 10].includes(noteNum % 12)) bias = keyWidth / 12;
    }
    export function getNote() {
        return noteNum;
    }
    function keyPressed() {
        dispatch("notepressed", noteNum);
    }
    function keyReleased() {
        dispatch("notereleased", noteNum);
    }
    export function playKey() {
        if (pressed) return;
        pressed = true;
    }
    export function stopPlayingKey() {
        if (!pressed) return;
        pressed = false;
    }
    export function markCorrect() {
        correct = true;
        setTimeout(() => (correct = false), 500);
    }
    export function markWrong() {
        wrong = true;
        setTimeout(() => (wrong = false), 500);
    }
</script>

<div
    class:accidental={!isNatural}
    class:natural={isNatural}
    class:pressed
    class:correct
    class:wrong
    style="--width: {keyWidth -
        keyWidth *
            0.47 *
            !isNatural}px; transform: translate({bias}px);--whiteWidth: {keyWidth}px;"
    draggable="false"
    on:mousedown|preventDefault={keyPressed}
    on:mouseup|preventDefault={keyReleased}
    on:mouseenter={(e) => {
        if (e.buttons) keyPressed();
    }}
    on:mouseleave={(e) => {
        if (e.buttons) keyReleased();
    }}
    on:touchstart|preventDefault={keyPressed}
    on:touchend|preventDefault={keyReleased}
>
    {#if numberInKey !== null}
        <span class="key-number">{numberInKey}</span>
    {/if}
</div>

<style>
    div {
        position: relative;
        flex-shrink: 0;
        width: var(--width);
        min-width: min-content;
        border-radius: 0px 0px calc(var(--width) / 8) calc(var(--width) / 8);
        -webkit-user-drag: none;
    }
    .accidental {
        margin: 0px calc(var(--width) / -2) 0px calc(var(--width) / -2);
        z-index: 2;
        height: 60%;
        background: black;
        box-shadow: inset white 0px 0px 2px 0px;
    }
    .natural {
        height: 100%;
        box-shadow: inset black 0px 0px 2px 0px;
    }
    .accidental.pressed {
        background: teal;
    }
    .accidental:not(.pressed) {
        background: black;
        transition: background-color 0.5s ease;
    }
    .natural.pressed {
        background: cyan;
    }
    .natural:not(.pressed) {
        background: white;
        transition: background-color 0.5s ease;
    }
    .natural.correct {
        background: greenyellow;
    }
    .natural.wrong {
        background: red;
    }
    .accidental.correct {
        background: green;
    }
    .accidental.wrong {
        background: red;
    }
    .key-number {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgb(150, 150, 150);
        color: white;
        border-radius: 4px;
        padding: calc(var(--whiteWidth) / 4);
        font-size: calc(var(--whiteWidth) / 3);
        pointer-events: none;
    }
</style>
