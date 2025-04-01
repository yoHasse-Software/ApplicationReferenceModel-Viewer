<script lang="ts">

    export const prerender = true;
    let { children } = $props();

</script>

<main  class="container" >
    <div id="content">
      {@render children()}
    </div>
</main>