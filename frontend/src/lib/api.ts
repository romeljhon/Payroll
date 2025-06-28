

// ACCOUNT API 
export interface LoginResponse {
  access?: string;     
  refresh?: string;
  user?: {
    id: number;
    username: string;
    role?: string;
  };
}

export async function loginRequest(username: string, password: string): Promise<{ token: string }> {
  const res = await fetch("http://127.0.0.1:8000/payroll/accounts/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Login failed");
  }

  return res.json(); // { token: "..." }
}

export async function logoutRequest(): Promise<void> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No token found");
  }

  const res = await fetch("http://127.0.0.1:8000/payroll/accounts/logout/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }
}

export async function changePasswordRequest(current_password: string, new_password: string): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/accounts/change-password/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ current_password, new_password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Password change failed");
  }

  return data.token; // new token returned by backend
}

// EMPLOYEE API 

export async function getAllEmployee() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/employees/", {
    method: "GET",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}


// ORGANIZATION API

export async function getBranches() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/branches/", {
    method: "GET",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}