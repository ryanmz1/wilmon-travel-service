import { ManagementClient } from 'auth0';
import { generateTravel } from '../lib/generateTravel';
import httpErrors from 'http-errors';

const auth0MgtClient = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: 'read:users',
  audience: process.env.AUTH0_AUDIENCE,
  tokenProvider: {
    enableCache: true,
    cacheTTLInSeconds: 10,
  },
});

async function autoGenerateTravels(event, context) {
  console.log('entered');
  try {
    // 1) filter user to { sub, email }
    const currentTime = new Date();
    const timeOffset = currentTime.getTimezoneOffset() / 60;
    const hour = currentTime.getHours() + timeOffset;
    console.log('hour', hour);
    const params = {
      search_engine: 'v3',
      q: `user_metadata.preferences.travelTimeAt.hour:${hour}`,
    };
    const users = (await auth0MgtClient.getUsers(params)).map((u) => ({
      email: u.email,
      userId: u.user_id,
    }));
    console.log(users);
    // 2) generate travel
    // 3) notify user
    const generatedPromises = users.map((u) =>
      generateTravel({ userId: u.userId, userEmail: u.email })
    );
    await Promise.all(generatedPromises);
    console.log('autoGenerated:', generatedPromises.length);
    return { autoGenerated: generatedPromises.length };
  } catch (error) {
    console.log(error);
    throw new httpErrors.InternalServerError(error);
  }
}

export const handler = autoGenerateTravels;
