import { getAsTreeAsync } from "$lib/server/dataFetch";
import type { RequestEvent } from "@sveltejs/kit";


export async function GET({ cookies }: RequestEvent) {

    const data = await getAsTreeAsync();

    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `session=${cookies.get('session')}; Path=/; HttpOnly; Secure; SameSite=Strict`
        }
    });

}


