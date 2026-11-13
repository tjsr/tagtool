import { type JWK, decodeJwt, importJWK, jwtVerify } from 'jose';

type Provider = { issuer: string; audience: string; publicKey: JWK };
export type Assertion = { issuer: string; subject: string; id: string; expires: number };

export const verifyIntegrationAssertion = async (
  token: string, sessionId: string, configured: string
): Promise<Assertion> => {
  const providers: unknown = JSON.parse(configured);
  if (!Array.isArray(providers)) throw new Error('Invalid provider configuration');
  const issuer = decodeJwt(token).iss;
  const matching = providers.filter((item: unknown) =>
    typeof item === 'object' && item !== null && 'issuer' in item && item.issuer === issuer);
  if (matching.length !== 1) throw new Error('Untrusted issuer');
  const provider = matching[0] as Provider;
  if (typeof provider.issuer !== 'string' || !provider.issuer || typeof provider.audience !== 'string' ||
    !provider.audience || !provider.publicKey || provider.publicKey.kty !== 'RSA' ||
    'd' in provider.publicKey) throw new Error('Invalid provider configuration');
  const key = await importJWK(provider.publicKey, 'RS256');
  const { payload } = await jwtVerify(token, key, { algorithms: ['RS256'], audience: provider.audience,
    issuer: provider.issuer, maxTokenAge: '5m', requiredClaims: ['iss', 'sub', 'aud', 'iat', 'exp', 'jti'] });
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255 ||
    typeof payload.jti !== 'string' || payload.jti.length < 16 || payload.jti.length > 128 ||
    typeof payload.iat !== 'number' || payload.iat > now + 30 ||
    typeof payload.exp !== 'number' || payload.exp <= payload.iat || payload.exp - payload.iat > 300 ||
    payload.session_id !== sessionId) throw new Error('Invalid assertion claims');
  return { expires: payload.exp, id: payload.jti, issuer: provider.issuer, subject: payload.sub };
};
