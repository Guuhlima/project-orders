import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL_API!;

const api = axios.create({
    baseURL: apiBaseUrl,
});

export default api;
