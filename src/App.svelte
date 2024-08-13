<script lang="ts">
    import GuessChord from "./GuessChord.svelte";
    import GuessInterval from "./GuessInterval.svelte";
    import GuessNote from "./GuessNote.svelte";
    import Settings from "./Settings.svelte";
    import { octaves, verbose } from "./stores";

    const modes = ["note", "interval", "chord"];
    let selectedMode = modes[0];
</script>

<svelte:head>
    <title>Ear Game</title>
</svelte:head>

<div class="nav">
    <h1>
        <a href="https://github.com/lukemcneil/ear-game">Ear Game</a>
    </h1>
    <Settings />
</div>

<label>
    Mode
    <select bind:value={selectedMode}>
        {#each modes as mode}
            <option value={mode}>{mode}</option>
        {/each}
    </select>
</label>

{#key $octaves}
    {#if selectedMode == "note"}
        <GuessNote octaves={$octaves} verbose={$verbose} />
    {:else if selectedMode == "interval"}
        <GuessInterval octaves={$octaves} verbose={$verbose} />
    {:else if selectedMode == "chord"}
        <GuessChord octaves={$octaves} verbose={$verbose} />
    {/if}
{/key}

<style>
    .nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
