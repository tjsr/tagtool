CREATE TABLE IntegrationIdentity (
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  userId TEXT NOT NULL,
  PRIMARY KEY (issuer, subject)
);
CREATE TABLE UsedAssertion (
  issuer TEXT NOT NULL,
  assertionId TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (issuer, assertionId)
);
CREATE INDEX UsedAssertion_expires_idx ON UsedAssertion (expires);
