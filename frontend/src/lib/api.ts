// src/ts apis/auth.ts
export interface LoginResponse {
  access?: string;      // JWT or session id – adjust to your backend
  refresh?: string;
  user?: {
    id: number;
    username: string;
    role?: string;
    // …any other props you return
  };
}

// export async function loginRequest(
//   username: string,
//   password: string,
// ): Promise<LoginResponse> {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_API_BASE_URL}/payroll/accounts/login/`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username, password }),
//       credentials: 'include', // drop if your backend doesn’t set cookies
//     },
//   );

//   if (!res.ok) {
//     // 400 / 401 etc.
//     const detail = await res.text();
//     throw new Error(
//       detail || `Login failed – server returned ${res.status}`,
//     );
//   }

//   return res.json();
// }


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
