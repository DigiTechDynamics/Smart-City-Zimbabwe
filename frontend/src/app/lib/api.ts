const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export { API_BASE_URL };

export async function fetchIssues(department?: string) {
  const url = department ? `${API_BASE_URL}/issues/?department=${department}` : `${API_BASE_URL}/issues/`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch issues');
  return response.json();
}

export async function getIssueByRef(ref: string) {
  const response = await fetch(`${API_BASE_URL}/issues/${ref}`);
  if (!response.ok) throw new Error('Issue not found');
  return response.json();
}

export async function createIssue(data: any) {
  const response = await fetch(`${API_BASE_URL}/issues/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to report issue');
  return response.json();
}

export async function updateIssueStatus(ref: string, status: string) {
  const response = await fetch(`${API_BASE_URL}/issues/${ref}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update status');
  return response.json();
}

export async function fetchHotspots() {
  const response = await fetch(`${API_BASE_URL}/hotspots/`);
  if (!response.ok) throw new Error('Failed to fetch hotspots');
  return response.json();
}

export async function fetchWorkforce(department?: string) {
  const url = department ? `${API_BASE_URL}/workforce/?department=${department}` : `${API_BASE_URL}/workforce/`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch workforce');
  return response.json();
}

export async function createWorkforce(data: any) {
  const response = await fetch(`${API_BASE_URL}/workforce/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create workforce');
  return response.json();
}

export async function assignIssue(ref: string, workforce_id: number) {
  const response = await fetch(`${API_BASE_URL}/issues/${ref}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workforce_id }),
  });
  if (!response.ok) throw new Error('Failed to assign issue');
  return response.json();
}


export async function dispatchWorkforce(id: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/workforce/${id}/dispatch`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to dispatch workforce');
  return response.json();
}

// Workforce Member management
export async function addWorkforceMember(workforceId: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/workforce/${workforceId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, workforce_id: workforceId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to add member');
  }
  return response.json();
}

export async function getWorkforceMembers(workforceId: number) {
  const response = await fetch(`${API_BASE_URL}/workforce/${workforceId}/members`);
  if (!response.ok) throw new Error('Failed to fetch members');
  return response.json();
}

export async function updateWorkforceMember(workforceId: number, memberId: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/workforce/${workforceId}/members/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to update member');
  }
  return response.json();
}

// Workforce individual login
export async function workforceLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/workforce-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Invalid credentials');
  }
  return response.json();
}

// Get tickets for a workforce member
export async function getMyTickets(userId: number) {
  const response = await fetch(`${API_BASE_URL}/my-tickets/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch tickets');
  return response.json();
}

// Workforce member updates ticket status
export async function workforceUpdateTicketStatus(userId: number, ref: string, status: string) {
  const response = await fetch(`${API_BASE_URL}/my-tickets/${userId}/${ref}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update ticket status');
  return response.json();
}

// SLA metrics for a department
export async function fetchDeptSLA(department: string) {
  const response = await fetch(`${API_BASE_URL}/sla/${department}`);
  if (!response.ok) throw new Error('Failed to fetch SLA');
  return response.json();
}

// Categories
export async function fetchCategories(sector?: string) {
  const url = sector ? `${API_BASE_URL}/categories/?sector=${sector}` : `${API_BASE_URL}/categories/`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function createCategory(data: any) {
  const response = await fetch(`${API_BASE_URL}/categories/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create category');
  return response.json();
}
