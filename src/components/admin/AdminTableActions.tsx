interface AdminTableActionsProps {
  itemName: string;
  isActive?: boolean;
  isLoading?: boolean;
  showToggle?: boolean;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  onView?: boolean;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
}

const AdminTableActions = ({
  itemName,
  isActive = true,
  isLoading = false,
  showToggle = true,
  showEdit = true,
  showDelete = true,
  onEdit,
  onToggleStatus,
  onDelete
}: AdminTableActionsProps) => {
  return (
    <div className="admin-table-action-icons">
      {showEdit ? (
        <button
          type="button"
          className="admin-icon-action-btn edit"
          onClick={onEdit}
          aria-label={`Edit ${itemName}`}
          title="Edit"
        >
          <i className="bi bi-pencil-square" />
        </button>
      ) : null}

      {showToggle ? (
        <button
          type="button"
          className={`admin-icon-action-btn ${isActive ? "disable" : "enable"}`}
          disabled={isLoading}
          onClick={onToggleStatus}
          aria-label={isActive ? `Disable ${itemName}` : `Enable ${itemName}`}
          title={isActive ? "Disable" : "Enable"}
        >
          <i className={isActive ? "bi bi-slash-circle" : "bi bi-check-circle"} />
        </button>
      ) : null}

      {showDelete ? (
        <button
          type="button"
          className="admin-icon-action-btn delete"
          disabled={isLoading}
          onClick={onDelete}
          aria-label={`Delete ${itemName}`}
          title="Delete"
        >
          <i className="bi bi-trash3" />
        </button>
      ) : null}
    </div>
  );
};

export default AdminTableActions;