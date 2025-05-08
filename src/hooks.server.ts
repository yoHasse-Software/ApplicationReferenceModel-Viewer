
import { type Handle} from '@sveltejs/kit';
import * as cookie from 'cookie';


export const handle: Handle = async ({ event, resolve }) => {
    const cookies = cookie.parse(event.request.headers.get('cookie') || '');


    const theme = cookies.theme;
    const themeString = theme ? `data-theme=${theme}` : '';

    return resolve(event, {
            transformPageChunk: ({ html }) => html.replace('%app.theme%', themeString)
        }
    );
};

