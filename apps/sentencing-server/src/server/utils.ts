import { OAuth2Client } from "google-auth-library";

export async function verifyGoogleIdToken(idToken: string, email: string) {
  const oAuth2Client = new OAuth2Client();

  const result = await oAuth2Client.verifyIdToken({
    idToken,
  });

  const payload = result.getPayload();

  // Optionally, if "includeEmail" was set in the token options, check if the
  // email was verified
  if (!payload || !payload.email_verified || !payload.email) {
    throw new Error("Email not verified");
  }

  if (payload.email !== email) {
    throw new Error("Invalid email address");
  }

  console.log(`Email verified: ${payload.email}`);
}
