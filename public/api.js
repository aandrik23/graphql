import { DOMAIN, getToken } from "./auth.js";

// send graphql query to the server
export async function graphql(query, variables = {}) {
    const token = getToken();
    if (!token) throw new Error("Missing JWT. Please login.");

    const res = await fetch(`${DOMAIN}/api/graphql-engine/v1/graphql`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(`GraphQL request failed (${res.status}).`);
  }

  if (!data) {
    throw new Error("Invalid JSON response from GraphQL.");
  }

  if (data.errors?.length) {
    throw new Error(data.errors[0].message || "GraphQL error.");
  }

  return data.data;
}

