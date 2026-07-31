import type {
  SellerReturnDispute,
  SellerReturnDisputeActivity
} from "../../types/sellerReturnDispute";

// Extend type locally if subEvents isn't already defined in your types
export type DisputeSubEvent = {
  id: string;
  label: string;
  description?: string;
  createdAt?: string;
};

export type ExtendedDisputeActivity = SellerReturnDisputeActivity & {
  subEvents?: DisputeSubEvent[];
};

type AdminReturnDisputeTimelineProps = {
  dispute: SellerReturnDispute;
};

const buildFallbackActivities = (
  dispute: SellerReturnDispute
): ExtendedDisputeActivity[] => {
  const activities: ExtendedDisputeActivity[] = [
    {
      id: `created-${dispute.id}`,
      label: "Dispute Created",
      description: `${dispute.sellerName || "Seller"} created dispute ${dispute.disputeId}.`,
      createdAt: dispute.createdAt,
      createdByRole: "SELLER",
      createdByName: dispute.sellerName
    }
  ];

  if (dispute.reviewedAt && dispute.adminRemarks) {
    activities.push({
      id: `admin-review-${dispute.id}`,
      label:
        dispute.status === "NEEDS_MORE_EVIDENCE"
          ? "More Evidence Requested"
          : "Admin Decision Updated",
      description: dispute.adminRemarks,
      createdAt: dispute.reviewedAt,
      createdByRole: "ADMIN",
      createdByName: dispute.reviewedByName
    });
  }

  if (dispute.sellerRespondedAt && dispute.sellerAdditionalRemarks) {
    activities.push({
      id: `seller-response-${dispute.id}`,
      label: "Seller Evidence Submitted",
      description: dispute.sellerAdditionalRemarks,
      createdAt: dispute.sellerRespondedAt,
      createdByRole: "SELLER",
      createdByName: dispute.sellerName,
      // Example sub-events mapping for seller evidence files
      subEvents: (dispute.sellerEvidence ?? []).map((evidence) => ({
        id: evidence.id,
        label: `File Attached: ${evidence.fileName}`,
        description: evidence.fileType,
        createdAt: evidence.uploadedAt
      }))
    });
  }

  return activities;
};

const getRoleBadgeClass = (role: string): string => {
  if (role === "ADMIN") {
    return "text-bg-primary";
  }

  if (role === "SELLER") {
    return "text-bg-warning text-dark";
  }

  return "text-bg-secondary";
};

// Dynamic Bootstrap Icon mapper based on role and activity label
const getActivityIcon = (role: string, label: string): string => {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("created")) {
    return "bi-plus-circle-fill text-success";
  }

  if (normalizedLabel.includes("evidence")) {
    return "bi-file-earmark-arrow-up-fill text-info";
  }

  if (role === "ADMIN") {
    return "bi-shield-check text-primary";
  }

  return "bi-clock-history text-secondary";
};

const AdminReturnDisputeTimeline = ({
  dispute
}: AdminReturnDisputeTimelineProps) => {
  const rawActivities = dispute.activities?.length
    ? (dispute.activities as ExtendedDisputeActivity[])
    : buildFallbackActivities(dispute);

  const activities = [...rawActivities].sort(
    (firstActivity, secondActivity) =>
      new Date(firstActivity.createdAt).getTime() -
      new Date(secondActivity.createdAt).getTime()
  );

  return (
    <div className="border rounded-4 p-3 bg-white">
      <h6 className="fw-bold mb-3">Dispute Decision Timeline</h6>

      <div className="d-flex flex-column gap-3 position-relative">
        {activities.map((activity, index) => {
          const isLast = index === activities.length - 1;

          return (
            <div className="d-flex gap-3 position-relative" key={activity.id}>
              {/* Timeline Icon Node */}
              <div className="d-flex flex-column align-items-center">
                <span className="fs-5 lh-1">
                  <i className={`bi ${getActivityIcon(activity.createdByRole, activity.label)}`} />
                </span>
                {/* Vertical connector line between nodes */}
                {!isLast ? (
                  <div
                    className="bg-light-subtle border-start my-1 flex-grow-1"
                    style={{ width: "2px" }}
                  />
                ) : null}
              </div>

              {/* Activity Details */}
              <div className="flex-grow-1 pb-2">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <strong className="small">{activity.label}</strong>
                  <span
                    className={`badge ${getRoleBadgeClass(
                      activity.createdByRole
                    )}`}
                  >
                    {activity.createdByRole}
                  </span>
                </div>

                <p className="small text-muted mb-1">{activity.description}</p>

                <div className="small text-muted mb-2">
                  {activity.createdByName ? `${activity.createdByName} · ` : ""}
                  {new Date(activity.createdAt).toLocaleString("en-IN")}
                </div>

                {/* Sub-events rendering block */}
                {activity.subEvents && activity.subEvents.length > 0 ? (
                  <div className="border-start border-2 ps-3 ms-1 my-2 d-flex flex-column gap-1 bg-light rounded-2 p-2">
                    {activity.subEvents.map((subEvent) => (
                      <div className="small" key={subEvent.id}>
                        <div className="fw-semibold text-dark">
                          <i className="bi bi-arrow-return-right me-1 text-muted" />
                          {subEvent.label}
                        </div>
                        {subEvent.description ? (
                          <div className="text-muted small ms-3">
                            {subEvent.description}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminReturnDisputeTimeline;