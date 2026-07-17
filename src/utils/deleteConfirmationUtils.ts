export const getDeleteConfirmationMessage = ({
  entityLabel,
  entityId
}: {
  entityLabel: string;
  entityId: string;
}): string => {
  return `Are you sure you want to delete ${entityLabel} (${entityId})? This action cannot be undone.`;
};

export const confirmDelete = ({
  entityLabel,
  entityId
}: {
  entityLabel: string;
  entityId: string;
}): boolean => {
  return window.confirm(
    getDeleteConfirmationMessage({
      entityLabel,
      entityId
    })
  );
};

export const getBulkDeleteConfirmationMessage = ({
  entityLabel,
  count
}: {
  entityLabel: string;
  count: number;
}): string => {
  return `Are you sure you want to delete ${count} ${entityLabel}? This action cannot be undone.`;
};

export const confirmBulkDelete = ({
  entityLabel,
  count
}: {
  entityLabel: string;
  count: number;
}): boolean => {
  return window.confirm(
    getBulkDeleteConfirmationMessage({
      entityLabel,
      count
    })
  );
};