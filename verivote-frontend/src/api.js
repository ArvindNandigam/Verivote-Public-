import axios from "axios";

export const API = "https://verivote-cloud-blockchain-web-based-e.onrender.com";

// Signup
export const signup = async (formData) => {
  try {
    const res = await axios.post(`${API}/signup`, {
      username: formData.username,
      preferred_username: formData.preferred_username,
      email: formData.email,
      password: formData.password,
      name: formData.name,
      birthdate: formData.birthdate,
      phone_number: formData.phone_number,
    });
    return res.data;
  } catch (err) {
    console.error("Signup error:", err.response?.data || err.message);
    return { error: err.response?.data?.error || "Signup failed" };
  }
};



// Confirm signup
export const confirmSignup = async ({ username, code }) => {
  try {
    const res = await axios.post(`${API}/confirm`, { username, code });
    return res.data;
  } catch (err) {
    console.error("Confirm error:", err.response?.data || err.message);
    return { error: err.response?.data?.error || "Confirmation failed" };
  }
};

// Resend code
export const resendCode = async (username) => {
  try {
    const res = await axios.post(`${API}/resend`, { username });
    return res.data;
  } catch (err) {
    console.error("Resend error:", err.response?.data || err.message);
    return { error: err.response?.data?.error || "Resend failed" };
  }
};

// Login
export const login = async ({ username, password }) => {
  try {
    const res = await axios.post(`${API}/login`, { username, password });
    return res.data;
  } catch (err) {
    console.error("Login error:", err.response?.data || err.message);
    return { error: err.response?.data?.error || "Login failed" };
  }
};

// Authenticated fetch
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("accessToken");
  return fetch(`${API}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};
