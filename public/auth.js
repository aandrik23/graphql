export const DOMAIN = "https://platform.zone01.gr";
export const TOKEN_KEY = "z01_token";

//store jwt in localstorage
export function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

//get jwt from localstorage
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

//remove jwt from localstorage
export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

//logout helper
export function logout() {
    removeToken();
}

// build basic auth header
function buildBasicAuth(identifier, password) {
    const encoded = btoa(`${identifier}:${password}`);
    return `Basic ${encoded}`;
}

//sign in user and get jwt
export async function signin(identifier, password) {
    const res = await fetch(`${DOMAIN}/api/auth/signin`, {
        method: "POST",
        headers: {
            Authorization: buildBasicAuth(identifier, password),
        },
    });

    if (!res.ok) {
        if (res.status === 401) {
            throw new Error("Invalid credentials.");
        }
        throw new Error(`Signin failed (${res.status}).`);
    }

    // Zone01 returns raw JWT as plain text
    let token = (await res.text()).trim();

    if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1).trim();
    }
    if (!token || token.split(".").length !== 3) {
        throw new Error("Invalid JWT received.");
    }

    return token;
}