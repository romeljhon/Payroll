

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

export async function AddEmployee(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/employees/", {
    method: "POST",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: body
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}

// ----------------POSITIONS--------------------- 
// GET POSITIONS 
export async function getPositions() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/positions/", {
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
// ADD POSITIONS 
export async function AddPositions(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/positions/", {
    method: "POST",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body), // ✅ stringify the body here
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETE POSITIONS
export async function DeletePositions(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`http://127.0.0.1:8000/payroll/api/positions/${id}/`, {
    method: "DELETE",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log(res)

  return res; // expected to be the created branch
}

// UPDATE POSITIONS
export async function UpdatePositions(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`http://127.0.0.1:8000/payroll/api/positions/${id}/`, {
    method: "PATCH",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update business");
  }

  return data;
}
// ----------------BRANCHES--------------------

// GET BRANCHES 
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
// ADD BRANCHES 
export async function AddBranches(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/branches/", {
    method: "POST",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body), // ✅ stringify the body here
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETE BRANCHES
export async function DeleteBranches(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`http://127.0.0.1:8000/payroll/api/branches/${id}/`, {
    method: "DELETE",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log(res)

  return res; // expected to be the created branch
}

// UPDATE BRANCHES
export async function UpdateBranches(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`http://127.0.0.1:8000/payroll/api/branches/${id}/`, {
    method: "PATCH",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update business");
  }

  return data;
}
// -----------------BUSINESS--------------------

// GET BUSINESS 
export async function getBusiness() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/businesses/", {
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
// ADD BUSINESS 
export async function AddBusiness(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch("http://127.0.0.1:8000/payroll/api/businesses/", {
    method: "POST",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body), // ✅ stringify the body here
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETE BUSINESS
export async function DeleteBusiness(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`http://127.0.0.1:8000/payroll/api/businesses/${id}/`, {
    method: "DELETE",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log(res)

  return res; // expected to be the created branch
}
// UPDATE BUSINESS
export async function UpdateBusiness(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`http://127.0.0.1:8000/payroll/api/businesses/${id}/`, {
    method: "PATCH",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update business");
  }

  return data;
}