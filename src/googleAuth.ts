import { type JWTVerifyGetKey, createRemoteJWKSet, jwtVerify } from 'jose';

export const verifyGoogleCredential = async (
  credential: string,
  clientId: string,
  key: JWTVerifyGetKey = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
): Promise<{ subject: string; legacyEmail?: string }> => {
  if (!clientId) throw new Error('Google client ID is not configured');
  const { payload } = await jwtVerify(credential, key, {
    algorithms: ['RS256'],
    audience: clientId,
    issuer: ['accounts.google.com', 'https://accounts.google.com'],
    requiredClaims: ['sub', 'exp', 'iat'],
  });
  const email = typeof payload.email === 'string' ? payload.email : '';
  const parts = email.split('@');
  const domain = parts.length === 2 ? parts[1].toLowerCase() : '';
  const googleAuthoritative = domain === 'gmail.com' ||
    (typeof payload.hd === 'string' && payload.hd.length > 0 && domain === payload.hd.toLowerCase());
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Invalid Google subject');
  return { legacyEmail: parts[0] && payload.email_verified === true && googleAuthoritative ? email : undefined,
    subject: payload.sub };
};
