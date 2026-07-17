import { useEffect, useState } from "react";
import { supportTeamService } from "../../services/supportTeamService";
import type { SupportEscalationTeam } from "../../types/supportEscalation";
import type { SupportTeamMember } from "../../types/supportTeam";
import { deriveMemberAvailability } from "../../utils/supportTeamMetricsUtils";
import SupportTeamAvailabilityBadge from "./SupportTeamAvailabilityBadge";

interface SupportTeamAssignmentPickerProps {
  teamCode: SupportEscalationTeam;
  selectedUserId?: string | null;
  disabled?: boolean;
  onSelectMember: (member: SupportTeamMember | null) => void;
}

const SupportTeamAssignmentPicker = ({
  teamCode,
  selectedUserId,
  disabled = false,
  onSelectMember
}: SupportTeamAssignmentPickerProps) => {
  const [members, setMembers] = useState<SupportTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadMembers = async (): Promise<void> => {
      try {
        setIsLoading(true);

        const data = await supportTeamService.getMembersByTeamCode(teamCode);

        setMembers(data);
      } catch {
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, [teamCode]);

  const handleMemberChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const memberUserId = event.target.value;

    if (!memberUserId) {
      onSelectMember(null);
      return;
    }

    const selectedMember = members.find(
      (member) => member.userId === memberUserId
    );

    onSelectMember(selectedMember ?? null);
  };

  return (
    <div className="support-team-assignment-picker">
      <label className="form-label small fw-semibold">
        Assign Team Member
      </label>

      <select
        className="form-select form-select-sm"
        value={selectedUserId ?? ""}
        disabled={disabled || isLoading}
        onChange={handleMemberChange}
      >
        <option value="">
          {isLoading ? "Loading team members..." : "Select team member"}
        </option>

        {members.map((member) => (
          <option value={member.userId} key={member.id}>
            {member.name} · {member.role} ·{" "}
            {deriveMemberAvailability(member)} ·{" "}
            {member.activeEscalationCount ?? 0}/
            {member.maxEscalationCapacity ?? 5}
          </option>
        ))}
      </select>

      {members.length > 0 ? (
        <div className="support-assignment-member-list mt-2">
          {members.map((member) => {
            const availability = deriveMemberAvailability(member);

            return (
              <div className="support-assignment-member-row" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <small>
                    {member.role} · {member.activeEscalationCount ?? 0}/
                    {member.maxEscalationCapacity ?? 5} active
                  </small>
                </div>

                <SupportTeamAvailabilityBadge status={availability} />
              </div>
            );
          })}
        </div>
      ) : null}

      {members.length === 0 && !isLoading ? (
        <div className="form-text text-warning">
          No active members found for this team.
        </div>
      ) : null}
    </div>
  );
};

export default SupportTeamAssignmentPicker;