import type { SupportTeamMemberAvailability } from "../../types/supportTeam";

interface SupportTeamAvailabilityBadgeProps {
  status?: SupportTeamMemberAvailability;
}

const getBadgeClass = (
  status: SupportTeamMemberAvailability = "OFFLINE"
): string => {
  switch (status) {
    case "AVAILABLE":
      return "support-availability-badge-success";

    case "BUSY":
      return "support-availability-badge-warning";

    case "AWAY":
      return "support-availability-badge-info";

    case "ON_LEAVE":
      return "support-availability-badge-dark";

    case "OFFLINE":
    default:
      return "support-availability-badge-secondary";
  }
};

const formatStatus = (
  status: SupportTeamMemberAvailability = "OFFLINE"
): string => {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const SupportTeamAvailabilityBadge = ({
  status = "OFFLINE"
}: SupportTeamAvailabilityBadgeProps) => {
  return (
    <span className={`support-availability-badge ${getBadgeClass(status)}`}>
      <span className="support-availability-dot" />
      <span>{formatStatus(status)}</span>
    </span>
  );
};

export default SupportTeamAvailabilityBadge;