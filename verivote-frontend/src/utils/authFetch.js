// src/utils/authFetch.js
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("accessToken");
  console.log("Using backend URL:", process.env.REACT_APP_API_URL);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
  console.log("🔗 Fetching:", fullUrl);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Log response status for debugging
    if (!res.ok) {
      console.error(`❌ Request failed [${res.status}]: ${res.statusText}`);
    }

    return res;
  } catch (err) {
    console.error("🚨 Network/Fetch error:", err);
    throw err;
  }
};
