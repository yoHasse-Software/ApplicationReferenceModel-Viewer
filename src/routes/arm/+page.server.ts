

// Fetch data from the Neo4j database during the svelte load function


import type { PageServerLoad } from './$types';
import { getAsTreeAsync } from '$lib/server/dataFetch';


export const load: PageServerLoad = async () => {
  const data = await getAsTreeAsync();

  return {
    nodeTree: data
  };
};




