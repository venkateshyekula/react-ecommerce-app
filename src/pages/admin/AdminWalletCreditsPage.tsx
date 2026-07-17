import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";
import { useAuth } from "../../context/useAuth";
import { walletService } from "../../services/walletService";
import type {
  WalletTransaction,
  WalletTransactionSource,
  WalletTransactionType
} from "../../types/wallet";
import { formatCurrency } from "../../utils/currencyFormatter";

interface WalletCreditFormValues {
  userId: string;
  type: WalletTransactionType;
  source: WalletTransactionSource;
  amount: string;
  description: string;
  expiresAt: string;
  adminRemarks: string;
}

const initialFormValues: WalletCreditFormValues = {
  userId: "",
  type: "CREDIT",
  source: "PROMOTION",
  amount: "",
  description: "",
  expiresAt: "",
  adminRemarks: ""
};

const walletSources: WalletTransactionSource[] = [
  "PROMOTION",
  "STORE_CREDIT",
  "ADMIN_ADJUSTMENT"
];

const getTransactionBadgeClass = (type: WalletTransactionType): string => {
  return type === "CREDIT" ? "bg-success" : "bg-danger";
};

const AdminWalletCreditsPage = () => {
  const { currentUser } = useAuth();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [formValues, setFormValues] =
    useState<WalletCreditFormValues>(initialFormValues);
  const [searchText, setSearchText] = useState<string>("");
  const [sourceFilter, setSourceFilter] =
    useState<WalletTransactionSource | "">("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadTransactions = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await walletService.getTransactions();

      setTransactions(
        data.sort(
          (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
        )
      );
    } catch {
      setErrorMessage(
        "Unable to load wallet transactions. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSource =
        !sourceFilter || transaction.source === sourceFilter;

      const searchableText = [
        transaction.transactionId,
        transaction.userId,
        transaction.type,
        transaction.source,
        transaction.description,
        transaction.adminRemarks,
        transaction.orderId,
        transaction.refundId
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesSource && (!query || searchableText.includes(query));
    });
  }, [transactions, searchText, sourceFilter]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedTransactions,
    setCurrentPage,
    setItemsPerPage
  } = useAdminTablePagination({
    items: filteredTransactions,
    defaultItemsPerPage: 10,
    resetDependencies: [searchText, sourceFilter]
  });

  const totalCreditAmount = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.type === "CREDIT")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [transactions]);

  const totalDebitAmount = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.type === "DEBIT")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [transactions]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = (): boolean => {
    if (!formValues.userId.trim()) {
      setErrorMessage("Please enter a user ID.");
      return false;
    }

    if (!formValues.amount || Number(formValues.amount) <= 0) {
      setErrorMessage("Please enter a valid wallet amount.");
      return false;
    }

    if (!formValues.description.trim()) {
      setErrorMessage("Please enter a description.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const createdTransaction = await walletService.createTransaction({
        transactionId: `WAL-${Date.now()}`,
        userId: formValues.userId.trim(),
        type: formValues.type,
        source: formValues.source,
        amount: Number(formValues.amount),
        description: formValues.description.trim(),
        createdAt: new Date().toISOString(),
        expiresAt: formValues.expiresAt || undefined,
        createdBy: currentUser?.id,
        adminRemarks: formValues.adminRemarks.trim() || undefined
      });

      setTransactions((previousTransactions) => [
        createdTransaction,
        ...previousTransactions
      ]);

      setFormValues(initialFormValues);
      setSuccessMessage("Wallet transaction created successfully.");
    } catch {
      setErrorMessage("Unable to create wallet transaction.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader message="Loading wallet credits..." />;
  }

  return (
    <div className="admin-wallet-credits-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Wallet Credits</h1>
          <p className="text-muted mb-0">
            Issue promotional credits, store credits and manual wallet
            adjustments.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadTransactions()}>
          <i className="bi bi-arrow-repeat me-2" />
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      ) : null}

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="wallet-admin-stat-card">
            <span className="wallet-admin-stat-icon text-success bg-success-subtle">
              <i className="bi bi-arrow-down-left" />
            </span>
            <div>
              <p className="text-muted mb-1">Total Credits</p>
              <h4 className="fw-bold mb-0">
                {formatCurrency(totalCreditAmount)}
              </h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="wallet-admin-stat-card">
            <span className="wallet-admin-stat-icon text-danger bg-danger-subtle">
              <i className="bi bi-arrow-up-right" />
            </span>
            <div>
              <p className="text-muted mb-1">Total Debits</p>
              <h4 className="fw-bold mb-0">
                {formatCurrency(totalDebitAmount)}
              </h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="wallet-admin-stat-card">
            <span className="wallet-admin-stat-icon text-primary bg-primary-subtle">
              <i className="bi bi-wallet2" />
            </span>
            <div>
              <p className="text-muted mb-1">Transactions</p>
              <h4 className="fw-bold mb-0">{transactions.length}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel-card mb-4">
        <h5 className="fw-bold mb-3">Create Wallet Adjustment</h5>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">User ID</label>
              <input
                name="userId"
                className="form-control"
                value={formValues.userId}
                onChange={handleChange}
                placeholder="user-001"
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold">Type</label>
              <select
                name="type"
                className="form-select"
                value={formValues.type}
                onChange={handleChange}
              >
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Source</label>
              <select
                name="source"
                className="form-select"
                value={formValues.source}
                onChange={handleChange}
              >
                {walletSources.map((source) => (
                  <option value={source} key={source}>
                    {source.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold">Amount</label>
              <input
                name="amount"
                type="number"
                min={1}
                className="form-control"
                value={formValues.amount}
                onChange={handleChange}
                placeholder="500"
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold">Expiry</label>
              <input
                name="expiresAt"
                type="date"
                className="form-control"
                value={formValues.expiresAt}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Description</label>
              <input
                name="description"
                className="form-control"
                value={formValues.description}
                onChange={handleChange}
                placeholder="Promotional wallet credit"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Admin Remarks</label>
              <input
                name="adminRemarks"
                className="form-control"
                value={formValues.adminRemarks}
                onChange={handleChange}
                placeholder="Optional internal note"
              />
            </div>

            <div className="col-12 d-flex justify-content-end">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                <i className="bi bi-plus-circle me-2" />
                Create Transaction
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="admin-panel-card">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">Wallet Ledger</h5>

          <div className="d-flex flex-column flex-md-row gap-2">
            <input
              className="form-control admin-search-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search wallet transactions..."
            />

            <select
              className="form-select admin-status-filter"
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as WalletTransactionSource | "")
              }
            >
              <option value="">All Sources</option>
              {[...walletSources, "REFUND", "ORDER_PAYMENT"].map((source) => (
                <option value={source} key={source}>
                  {source.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>User</th>
                <th>Type</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Expiry</th>
              </tr>
            </thead>

            <tbody>
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <strong>{transaction.transactionId}</strong>
                    <p className="small text-muted mb-0">
                      {transaction.description}
                    </p>
                    <p className="small text-muted mb-0">
                      {new Date(transaction.createdAt).toLocaleString("en-IN")}
                    </p>
                  </td>

                  <td>{transaction.userId}</td>

                  <td>
                    <span
                      className={`badge ${getTransactionBadgeClass(
                        transaction.type
                      )}`}
                    >
                      {transaction.type}
                    </span>
                  </td>

                  <td>{transaction.source.replace("_", " ")}</td>

                  <td>
                    <strong>{formatCurrency(transaction.amount)}</strong>
                  </td>

                  <td>
                    {transaction.expiresAt ? (
                      new Date(transaction.expiresAt).toLocaleDateString("en-IN")
                    ) : (
                      <span className="text-muted small">No expiry</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No wallet transactions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <AdminTablePagination
          totalItems={filteredTransactions.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="transactions"
        />
      </div>
    </div>
  );
};

export default AdminWalletCreditsPage;