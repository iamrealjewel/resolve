import { Role } from "../generated/client";

export function getIncidentAccessFilter(user: { id: string; role: string; departmentId?: string | null }) {
  if (user.role === Role.SUPER_ADMIN) {
    return {};
  }

  const baseFilters: any[] = [
    { reporterId: user.id },
    { accessList: { some: { id: user.id } } }
  ];

  if (user.role === Role.RESOLVER) {
    baseFilters.push({ assigneeId: user.id });
    if (user.departmentId) {
      baseFilters.push({ departmentId: user.departmentId });
    }
  }

  if (user.role === Role.DEPARTMENT_HEAD || user.role === Role.LINE_MANAGER) {
    if (user.departmentId) {
      baseFilters.push({ departmentId: user.departmentId });
    }
    baseFilters.push({ reporter: { superiorId: user.id } });
    baseFilters.push({ assigneeId: user.id });
  }

  return { OR: baseFilters };
}

export function getLogAccessFilter(user: { id: string; role: string; departmentId?: string | null }) {
  // Logs are visible if the incident is visible
  return {
    incident: getIncidentAccessFilter(user)
  };
}
