<script lang="ts">


    let { children } = $props();

</script>

<main  class="container" >
    <div id="content">
      {@render children()}
    </div>
</main>