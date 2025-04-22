<script lang="ts">
    const { rule = $bindable(), labels } = $props();

</script>

<details>
    <summary role="button" class="outline">Font Styling</summary>
    <fieldset class="grid">
        <label>
            Font decoration:
            <select bind:value={rule.styling.textDecoration}>
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Line-through</option>
            </select>
            <small >
                <em>Changes the text decoration when rule is applied</em>
            </small>
        </label>
        <label>
            Font Weight:
            <select bind:value={rule.styling.fontWeight}>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
            </select>
            <small >
                <em>Changes the font weight when rule is applied</em>
            </small>
        </label>
        <label>
            Font Style:
            <select bind:value={rule.styling.fontStyle}>
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
                <option value="oblique">Oblique</option>
            </select>
            <small >
                <em>Changes the font style when rule is applied</em>
            </small>
        </label>
    </fieldset>
</details>