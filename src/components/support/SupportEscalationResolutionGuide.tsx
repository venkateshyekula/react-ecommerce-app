import type { SupportEscalationTeam } from "../../types/supportEscalation";
import { getSupportResolutionPlaybook } from "../../utils/supportResolutionPlaybookUtils";

interface SupportEscalationResolutionGuideProps {
  team: SupportEscalationTeam;
}

const SupportEscalationResolutionGuide = ({
  team
}: SupportEscalationResolutionGuideProps) => {
  const playbook = getSupportResolutionPlaybook(team);

  return (
    <div className="support-resolution-guide border rounded-4 p-3 mb-3">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div>
          <h6 className="fw-bold mb-1">{playbook.title}</h6>
          <p className="text-muted small mb-0">{playbook.summary}</p>
        </div>

        <span className="badge text-bg-light border">Playbook</span>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <h6 className="small fw-bold text-uppercase text-muted">
            Checklist
          </h6>

          <ol className="small mb-0 ps-3">
            {playbook.checklist.map((item) => (
              <li className="mb-1" key={item}>
                {item}
              </li>
            ))}
          </ol>
        </div>

        <div className="col-lg-6">
          <h6 className="small fw-bold text-uppercase text-muted">
            Recommended Outcomes
          </h6>

          <ul className="small mb-3 ps-3">
            {playbook.recommendedOutcomes.map((item) => (
              <li className="mb-1" key={item}>
                {item}
              </li>
            ))}
          </ul>

          <div className="alert alert-light border small mb-0">
            <strong>Resolution note hint:</strong>{" "}
            {playbook.resolutionNoteHint}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportEscalationResolutionGuide;