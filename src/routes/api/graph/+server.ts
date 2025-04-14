import { fetchGraphByLabelsAsync } from "$lib/server/dataFetch";
import type { RequestEvent } from "@sveltejs/kit";


export async function GET({ cookies, params, url }: RequestEvent) {

    // Get query parameters from the URL
    const labelParamQuery = url.searchParams.get('labels')?.split(',').map(label => label.trim()) || [];


    if (!labelParamQuery) {
        throw new Error('No labels provided in the query string.');
    }

    const data = await fetchGraphByLabelsAsync(labelParamQuery);

    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `session=${cookies.get('session')}; Path=/; HttpOnly; Secure; SameSite=Strict`
        }
    });

}


