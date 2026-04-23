const API_URL = import.meta.env.VITE_API_URL;


export async function apiGet(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`);
    return res.json();
}

export async function apiPost(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error en la petición");
    }
    return res.json();
}

export async function apiPut(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return res.json();
}