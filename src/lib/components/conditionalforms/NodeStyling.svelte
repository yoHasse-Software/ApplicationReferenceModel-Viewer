<script lang="ts">

    const { rule = $bindable() } = $props();


</script>

<article style="padding: unset;">

<details>
    <summary role="button" class="outline">Styling</summary>
    <div class="grid" style="grid-template-columns: 1fr; gap: 1rem;">
        <div>
        <label >
            Color:
            {#if rule.styling.color.isSet}
            <div role="group">
                <input type="color" bind:value={rule.styling.color.color} aria-label="Color picker" />
                <button onclick={() => setTimeout(() => rule.styling.color.isSet = false, 0)} >Clear</button>
            </div>
            {:else}
            <div>
                <button onclick={() => {rule.styling.color.isSet = true; console.log('clicked picked');}} class="secondary" style="width: 100%;">Pick Color</button>
            </div>
            {/if}
            <small >
                <em>Changes the text color when rule is applied</em>
            </small>
        </label>
    </div>
    <div>
        <label>
            Background:
            {#if rule.styling.backgroundColor.isSet}
            <div role="group">
                <input type="color" bind:value={rule.styling.backgroundColor.color} aria-label="Background color picker" />
                <button onclick={() =>  setTimeout(() => rule.styling.backgroundColor.isSet = false, 0)} >Clear</button>
            </div>

            {:else}
            <div>
                <button onclick={() => rule.styling.backgroundColor.isSet = true} class="secondary" style="width: 100%;">Pick Color</button>
            </div>
            {/if}
            <small >
                <em>Changes the background color when rule is applied</em>
            </small>
        </label>
    </div>
    <div>
        <label>
            Border Color:
            {#if rule.styling.borderColor.isSet}
            <div role="group">
                <input type="color" bind:value={rule.styling.borderColor.color} aria-label="Border color picker" />
                <button onclick={() =>  setTimeout(() => rule.styling.borderColor.isSet = false, 0)} >Clear</button>
            </div>
            {:else}
            <div>
                <button onclick={() => rule.styling.borderColor.isSet = true} class="secondary" style="width: 100%;">Pick Color</button>
            </div>
            {/if}
            <small >
                <em>Changes the border color when rule is applied</em>
            </small>

        </label>
    </div>
    </div>
</details>

</article>
