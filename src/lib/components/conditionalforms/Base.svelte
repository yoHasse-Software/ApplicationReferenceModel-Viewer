
<script lang="ts">
    const { rule = $bindable(), labels } = $props();
</script>

<h4>Base</h4>
<fieldset class="grid">
<label>
    <span class="required"></span>Name:
    <input type="text" 
        bind:value={rule.name} 
        placeholder="Rule Name" />
    <small >
        <em>Rule name to identify the rule.</em>
    </small>
</label>

<label>
    Text/Emoji:
    <input type="text" bind:value={rule.styling.content} />
    <small >
        <em>Optional content or emoji to display on the right of the application name when rule is applied.</em>
    </small>
</label>
</fieldset>