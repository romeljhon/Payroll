import { CloudCog } from "lucide-react";

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

export async function loginRequest(
  username: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/accounts/login/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }
  );

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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/accounts/logout/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Logout failed");
  }
}

export async function changePasswordRequest(
  current_password: string,
  new_password: string
): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/accounts/change-password/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ current_password, new_password }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Password change failed");
  }

  return data.token; // new token returned by backend
}

export async function CreateAccount(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/accounts/register/",
    {
      method: "POST",
      body: body,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}

// -------------------------------------------------------------------EMPLOYEE API----------------------------------
// GET EMPLOYEE
export async function getAllEmployee() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/employees/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}
// GET EMPLOYEE BY ID
export async function getAllEmployeeById(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/employees/${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}
// ADD EMPLOYEE
export async function AddEmployee(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/employees/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: body,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}
// UPDATE EMPLOYEE
export async function UpdateEmployee(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/employees/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
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
// DELETE EMPLOYEE
export async function DeleteEmployee(id: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No token found");

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  // ✅ correct prefix: /payroll/api/..., not /api/payroll/...
  const res = await fetch(`${base}/payroll/api/employees/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Failed to delete employee (HTTP ${res.status})`;
    try {
      const data = await res.json();
      const detail = data?.detail ?? data?.error ?? JSON.stringify(data);
      if (detail) msg = detail;
    } catch {
      /* empty/204 body */
    }
    throw new Error(msg);
  }

  return true; // DRF usually returns 204 No Content
}

// --------------------------------------------------------------------POSITIONS-----------------------------------
// GET POSITIONS
export async function getPositions() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/positions/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/positions/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // ✅ stringify the body here
    }
  );

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

  const res = await fetch(`/payroll/api/positions/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATE POSITIONS
export async function UpdatePositions(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/positions/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
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

// -----------------------------------------------------------------------BRANCHES------------------------------------
// GET BRANCHES
export async function getBranches() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/branches/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/branches/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // ✅ stringify the body here
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETE BRANCHES
export async function DeleteBranches(id: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No token found");

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  // DRF usually expects a trailing slash; if your API has APPEND_SLASH=False, remove the final `/`.
  const url = `${base}/payroll/api/branches/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Token ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Failed to delete branch (HTTP ${res.status})`;
    try {
      const data = await res.json();
      const detail = data?.detail ?? data?.error ?? JSON.stringify(data);
      if (detail) msg = detail;
    } catch {
      /* probably 204 / empty body */
    }
    throw new Error(msg);
  }

  // 204 No Content is typical for DELETE
  return true;
}
// UPDATE BRANCHES
export async function UpdateBranches(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/branches/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
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

// ----------------------------------------------------------------------BUSINESS-------------------------------
// GET BUSINESS
export async function getBusiness() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/businesses/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/businesses/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // ✅ stringify the body here
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETE BUSINESS
export async function DeleteBusiness(id: number | string) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No token found");

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  // If your DRF has APPEND_SLASH=True, keep trailing slash. If False, remove it.
  const url = `${base}/payroll/api/businesses/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Failed to delete business (HTTP ${res.status})`;
    try {
      const data = await res.json();
      const detail = data?.detail ?? data?.error ?? JSON.stringify(data);
      if (detail) msg = detail;
    } catch {
      /* empty/204 body */
    }
    throw new Error(msg);
  }

  return true; // 204 No Content expected
}
// UPDATE BUSINESS
export async function UpdateBusiness(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/businesses/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
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

// --------------------------------------------------------------------TIME KEPPING---------------------------
// GET Timekeeping
export async function getTimekeeping() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/payroll/api/timekeeping/`,
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch timekeeping");
  }
  return data;
}
// ADD Timekeeping
export async function AddTimekeeping(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/payroll/api/timekeeping/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const data = await res.json();
  if (!res.ok) {
    // surface backend validation messages
    throw new Error(
      data.detail ||
        data.error ||
        JSON.stringify(data) ||
        "Failed to create timekeeping"
    );
  }
  return data; // created record
}
// DELETE Timekeeping
export async function DeleteTimekeeping(id: number | string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  const url = `${base}/payroll/api/timekeeping/${id}/`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Token ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Failed to delete Timekeeping (HTTP ${res.status})`;
    try {
      const data = await res.json();
      const detail = data?.detail ?? data?.error ?? JSON.stringify(data);
      if (detail) msg = detail;
    } catch {
      /* 204/empty */
    }
    throw new Error(msg);
  }
  return true; // 204 expected
}
// UPDATE Timekeeping  ✅ fixed to use BASE URL
export async function UpdateTimekeeping(id: string | number, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  const res = await fetch(`${base}/payroll/api/timekeeping/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.detail ||
        data.error ||
        JSON.stringify(data) ||
        "Failed to update timekeeping"
    );
  }
  return data;
}

// -----------------------------------------------------------------------POLICY---------------------------------------
// GET POLICY
export async function getPolicys() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/payroll/policies/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}
// ADD POLICY
export async function AddPolicy(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/payroll/policies/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // ✅ stringify the body here
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}

// ------------------------------------------------------------------------CYCLE-----------------------------------------
// GET CYCLE
export async function getPayrollCycle() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/payrollcycle/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}
// ADD CYCLE
export async function AddPayrollCycle(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/payrollcycle/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // ✅ stringify the body here
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETE CYCLE
export async function DeleteCycle(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/payrollcycle/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATE CYCLE
export async function UpdateCycle(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/payrollcycle/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update salary component");
  }

  return data;
}


// ----------------------------------------------------------------------SALARY COMPONENT----------------------------------------------------
// GET SalaryComponent
export async function getSalaryComponent() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/components/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}
// ADDSalaryComponent
export async function AddSalaryComponent(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/components/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // ✅ stringify the body here
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETESalaryComponent
export async function DeleteSalaryComponent(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/components/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATESalaryComponent
export async function UpdateSalaryComponent(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/components/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update salary component");
  }

  return data;
}

// ----------------------------------------------------------------------SALARY STRUCTURE-----------------------------------------------------
// GET SalaryStructure
export async function getSalaryStructure() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/structure/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch employees");
  }

  return data; // this is the employee list
}
// ADDSalaryStructure
export async function AddSalaryStructure(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/payroll/api/structure/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // ✅ stringify the body here
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to create branch");
  }

  return data; // expected to be the created branch
}
// DELETESalaryStructure
export async function DeleteSalaryStructure(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/structure/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATESalaryStructure
export async function UpdateSalaryStructure(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`/payroll/api/structure/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update salary Structure");
  }

  return data;
}
