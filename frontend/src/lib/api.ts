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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/accounts/login/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/accounts/logout/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/accounts/change-password/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/accounts/register/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/employees/",
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

  const res = await fetch(`/api/employees/${id}/`, {
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
// GET EMPLOYEE BY BRANCH 
export async function getAllEmployeeByBranch(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + `/api/employees/by-branch/${id}/`, {
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/employees/",
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

  const res = await fetch(`/api/employees/${id}/`, {
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

  // ✅ correct prefix: /api/..., not /api/...
  const res = await fetch(`${base}/api/employees/${id}/`, {
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/positions/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/positions/",
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

  const res = await fetch(`/api/positions/${id}/`, {
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

  const res = await fetch(`/api/positions/${id}/`, {
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/branches/",
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
// GET ALLBRANCHES BY ALL BUSINESS 
export async function getAllBranchesByBusiness(selectedBusiness: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/branches/by-business/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/branches/",
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
  const url = `${base}/api/branches/${id}/`;

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

  const res = await fetch(`/api/branches/${id}/`, {
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/businesses/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/businesses/",
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
  const url = `${base}/api/businesses/${id}/`;

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

  const res = await fetch(`/api/businesses/${id}/`, {
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
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/timekeeping/`,
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
// GET TIMEKEEPING HISTORY BY BUSINESS + BRANCH (+ optional employee)
export async function getTimekeepingByBusinessBranch(
  businessId: number,
  branchId: number,
  employeeId?: number
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  const query = new URLSearchParams({
    business_id: String(businessId),
    branch_id: String(branchId),
    ...(employeeId ? { employee_id: String(employeeId) } : {}),
  });

  const res = await fetch(`${base}/api/timekeeping/by-business-branch/?${query}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.detail ||
        data.error ||
        JSON.stringify(data) ||
        "Failed to fetch timelogs by business/branch"
    );
  }
  return data;
}

// ADD Timekeeping
export async function AddTimekeeping(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/timekeeping/`,
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

  const url = `${base}/api/timekeeping/${id}/`;

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

  const res = await fetch(`${base}/api/timekeeping/${id}/`, {
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/policy/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/policy/",
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
// DELETE POLICY
export async function DeletePolicy(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL +`/api/policy/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATE POLICY
export async function UpdatePolicy(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL+`/api/policy/${id}/`, {
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



// ------------------------------------------------------------------------CYCLE-----------------------------------------
// GET CYCLE
export async function getPayrollCycle() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/payrollcycle/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/payrollcycle/",
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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL +`/api/payrollcycle/${id}/`, {
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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL +`/api/payrollcycle/${id}/`, {
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/components/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/components/",
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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL +`/api/components/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATESalaryComponent
export async function UpdateSalaryComponent(id: any, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL +`/api/components/${id}/`, {
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/structure/",
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
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/structure/",
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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL +`/api/structure/${id}/`, {
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

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL +`/api/structure/${id}/`, {
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

// --------------------------------------------------------------------------HOLIDAYS-----------------------------------------------------------
// GET Holidays
export async function getHolidays() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/holidays/",
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
// ADDHolidays
export async function AddHolidays(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/holidays/",
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
// DELETEHolidays
export async function DeleteHolidays(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/holidays/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATEHolidays
export async function UpdateHolidays(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/holidays/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update salary holidays");
  }

  return data;
}

// ----------------------------------------------------------------------GENERATE PAYSLIP FOR 1 EMPLOYEE--------------------------------------------
export async function SinglePayslip(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/email/send-single-payslip/",
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
export async function generatePayroll(body: any, selectedPeriod: string, selectedCycle: string, include13th: boolean) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/generate/",
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
export async function run13thMonth(body: any, selectedBusiness: string | undefined, selectedBranch: string | undefined) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/13th/",
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
export async function runBatchGeneration(body: any, selectedCycle: string, selectedBusiness: string | undefined, selectedBranch: string | undefined) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/batch/",
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
export async function previewPayslip(selectedEmployee: string, selectedPeriod: string, selectedCycle: string, include13th: boolean) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/payslip/",
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

// -----------------------------------------------------------------------------RECORDS OF PAYSLIP----------------------------------------------------
// GET Records
export async function getRecords() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/records/",
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
// ADDRecords
export async function AddRecords(body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/api/records/",
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
// DELETERecords
export async function DeleteRecords(id: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/records/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res; // expected to be the created branch
}
// UPDATERecords
export async function UpdateRecords(id: string, body: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/records/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to update salary Records");
  }

  return data;
}