type CreateLnbitsUserRequest = {
  admin_id: string;
  user_name: string;
  wallet_name: string;
};
type CreateLnbitsUserResponse = {
  // below are unused
  // id: string;
  // name: string;
  // admin: string;
  // email: string;
  // password: string;
  wallets: [
    {
      id: string;
      admin: string;
      // name: string;
      user: string;
      adminkey: string;
    }
  ];
};

/**
 * This name is just visual, shown in lnbits when you open the wallet URL
 * the actual ID of the user and wallet are generated by lnbits
 */
export function generateUserAndWalletName(type: "tip" | "user", id: string) {
  return type + "-" + id;
}

export async function createLnbitsUserAndWallet(name: string): Promise<{
  createLnbitsUserResponse: Response;
  createLnbitsUserResponseBody: CreateLnbitsUserResponse;
}> {
  if (!process.env.LNBITS_URL) {
    throw new Error("No LNBITS_URL provided");
  }
  if (!process.env.LNBITS_API_KEY) {
    throw new Error("No LNBITS_API_KEY provided");
  }
  if (!process.env.LNBITS_USER_ID) {
    throw new Error("No LNBITS_USER_ID provided");
  }

  const createLnbitsUserRequest: CreateLnbitsUserRequest = {
    admin_id: process.env.LNBITS_USER_ID,
    user_name: name,
    wallet_name: name,
  };

  const createLnbitsUserRequestHeaders = new Headers();
  createLnbitsUserRequestHeaders.append("Content-Type", "application/json");
  createLnbitsUserRequestHeaders.append("Accept", "application/json");
  createLnbitsUserRequestHeaders.append(
    "X-Api-Key",
    process.env.LNBITS_API_KEY
  );

  const createLnbitsUserResponse = await fetch(
    `${process.env.LNBITS_URL}/usermanager/api/v1/users`,
    {
      method: "POST",
      body: JSON.stringify(createLnbitsUserRequest),
      headers: createLnbitsUserRequestHeaders,
    }
  );
  console.log(
    "Create lnbits user response: ",
    createLnbitsUserResponse.status,
    createLnbitsUserResponse.statusText
  );

  const createLnbitsUserResponseBody =
    (await createLnbitsUserResponse.json()) as CreateLnbitsUserResponse;
  console.log(
    "Create lnbits user response body: ",
    createLnbitsUserResponseBody
  );
  return {
    createLnbitsUserResponse,
    createLnbitsUserResponseBody,
  };
}
