import { apiClient } from "./apiClient";
import type { SupportEscalationTeam } from "../types/supportEscalation";
import type { 
  SupportTeam, 
  SupportTeamMember, 
  SupportTeamMemberAvailability, 
  UpdateSupportTeamMemberPayload 
} from "../types/supportTeam";

const SUPPORT_TEAMS_ENDPOINT = "/supportTeams";
const SUPPORT_TEAM_MEMBERS_ENDPOINT = "/supportTeamMembers";
const USERS_ENDPOINT = "/users";

type DatabaseUserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  supportTeamCode?: SupportEscalationTeam;
  supportTeamRole?: string;
};

const sortMembersByName = (
  members: SupportTeamMember[]
): SupportTeamMember[] => {
  return [...members].sort((firstMember, secondMember) =>
    firstMember.name.localeCompare(secondMember.name)
  );
};

const mapSupportUserToTeamMember = (
  user: DatabaseUserResponse
): SupportTeamMember | null => {
  if (user.role !== "SUPPORT" || !user.supportTeamCode) {
    return null;
  }

  return {
    id: user.id,
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.supportTeamRole ?? "SUPPORT_TEAM_MEMBER",
    teamCode: user.supportTeamCode,
    isActive: user.isActive ?? true
  };
};

export const supportTeamService = {
  getTeams: async (): Promise<SupportTeam[]> => {
    const teams = await apiClient.get<SupportTeam[]>(SUPPORT_TEAMS_ENDPOINT);

    return teams.filter((team) => team.isActive);
  },

  getTeamMembers: async (): Promise<SupportTeamMember[]> => {
    try {
      const members = await apiClient.get<SupportTeamMember[]>(
        SUPPORT_TEAM_MEMBERS_ENDPOINT
      );

      return sortMembersByName(members.filter((member) => member.isActive));
    } catch {
      // Fallback: Query the /users endpoint if the members endpoint failed
      try {
        const users = await apiClient.get<DatabaseUserResponse[]>(
          `${USERS_ENDPOINT}?role=SUPPORT`
        );

        const fallbackMembers = users
          .map(mapSupportUserToTeamMember)
          .filter((member): member is SupportTeamMember => member !== null)
          .filter((member) => member.isActive);

        return sortMembersByName(fallbackMembers);
      } catch (usersError) {
        console.error("Failed to load fallback team members:", usersError);
        return [];
      }
    }
  },

  getMembersByTeamCode: async (
    teamCode: SupportEscalationTeam
  ): Promise<SupportTeamMember[]> => {
    try {
      const members = await apiClient.get<SupportTeamMember[]>(
        `${SUPPORT_TEAM_MEMBERS_ENDPOINT}?teamCode=${encodeURIComponent(
          teamCode
        )}`
      );

      return sortMembersByName(members.filter((member) => member.isActive));
    } catch {
      // Fallback: Query the /users endpoint if the members endpoint failed
      try {
        const users = await apiClient.get<DatabaseUserResponse[]>(
          `${USERS_ENDPOINT}?role=SUPPORT&supportTeamCode=${encodeURIComponent(
            teamCode
          )}`
        );

        const fallbackMembers = users
          .map(mapSupportUserToTeamMember)
          .filter((member): member is SupportTeamMember => member !== null)
          .filter((member) => member.isActive);

        return sortMembersByName(fallbackMembers);
      } catch (usersError) {
        console.error("Failed to load fallback team members by team code:", usersError);
        return [];
      }
    }
  },

  getMemberByUserId: async (
    userId: string
  ): Promise<SupportTeamMember | null> => {
    try {
      // 1. Try fetching from directory endpoint
      const directoryMembers = await apiClient.get<SupportTeamMember[]>(
        `${SUPPORT_TEAM_MEMBERS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
      );

      const directoryMember = directoryMembers.find((member) => member.isActive);
      if (directoryMember) {
        return directoryMember;
      }
    } catch {
      // If the endpoint returns a 404, catch it and swallow the error so we can fall back to /users
      console.warn(`${SUPPORT_TEAM_MEMBERS_ENDPOINT} failed or is missing. Falling back to users collection.`);
    }

    // 2. Fallback: Query the /users endpoint if the members endpoint threw an error or returned nothing
    try {
      const users = await apiClient.get<DatabaseUserResponse[]>(
        `${USERS_ENDPOINT}?id=${encodeURIComponent(userId)}`
      );

      const user = users[0] ?? null;
      if (!user) {
        return null;
      }

      return mapSupportUserToTeamMember(user);
    } catch (usersError) {
      console.error("Failed to load user scope entirely:", usersError);
      return null;
    }
  },

  updateMember: async (
    memberId: string,
    payload: UpdateSupportTeamMemberPayload
  ): Promise<SupportTeamMember> => {
    return apiClient.patch<SupportTeamMember, UpdateSupportTeamMemberPayload>(
      `${SUPPORT_TEAM_MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`,
      payload
    );
  },

  updateAvailabilityByUserId: async ({
    userId,
    availabilityStatus
  }: {
    userId: string;
    availabilityStatus: SupportTeamMemberAvailability;
  }): Promise<SupportTeamMember | null> => {
    const member = await supportTeamService.getMemberByUserId(userId);

    if (!member) {
      return null;
    }

    if (member.id.startsWith("team-member-support-")) {
      return member;
    }

    return supportTeamService.updateMember(member.id, {
      availabilityStatus,
      lastActiveAt: new Date().toISOString()
    });
  },

  heartbeatByUserId: async (
    userId: string
  ): Promise<SupportTeamMember | null> => {
    const member = await supportTeamService.getMemberByUserId(userId);

    if (!member) {
      return null;
    }

    if (member.id.startsWith("team-member-support-")) {
      return member;
    }

    return supportTeamService.updateMember(member.id, {
      availabilityStatus:
        member.availabilityStatus === "ON_LEAVE"
          ? "ON_LEAVE"
          : member.availabilityStatus === "AWAY"
            ? "AWAY"
            : "AVAILABLE",
      lastActiveAt: new Date().toISOString()
    });
  }
};