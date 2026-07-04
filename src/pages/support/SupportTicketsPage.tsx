import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { supportService } from "../../services/supportService";
import type {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus
} from "../../types/support";

const ticketStatuses: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED"
];

const ticketPriorities: SupportTicketPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT"
];

const SupportTicketsPage = () => {
  const { currentUser } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "">("");
  const [response, setResponse] = useState<string>("");
  const [status, setStatus] = useState<SupportTicketStatus>("OPEN");
  const [priority, setPriority] = useState<SupportTicketPriority>("MEDIUM");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadTickets = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const ticketList = await supportService.getTickets();

      const sortedTickets = [...ticketList].sort(
        (firstTicket, secondTicket) =>
          new Date(secondTicket.createdAt).getTime() -
          new Date(firstTicket.createdAt).getTime()
      );

      setTickets(sortedTickets);
    } catch {
      setErrorMessage(
        "Unable to load support tickets. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.customerName.toLowerCase().includes(query) ||
        ticket.customerEmail.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchText, statusFilter]);

  const handleSelectTicket = (ticket: SupportTicket): void => {
    setSelectedTicket(ticket);
    setResponse(ticket.response ?? "");
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleStatusChange = (
    event: ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatus(event.target.value as SupportTicketStatus);
  };

  const handlePriorityChange = (
    event: ChangeEvent<HTMLSelectElement>
  ): void => {
    setPriority(event.target.value as SupportTicketPriority);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!selectedTicket) {
      setErrorMessage("Please select a ticket first.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedTicket = await supportService.updateTicket(
        selectedTicket.id,
        {
          status,
          priority,
          response,
          assignedTo: currentUser?.id
        }
      );

      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        )
      );

      setSelectedTicket(updatedTicket);
      setSuccessMessage("Ticket updated successfully.");
    } catch {
      setErrorMessage("Unable to update ticket. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader message="Loading support tickets..." />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Customer Tickets</h1>
          <p className="text-muted mb-0">
            Review, respond, and update customer support tickets.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadTickets()}>
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

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="support-panel-card mb-4">
            <div className="row g-3">
              <div className="col-md-8">
                <input
                  className="form-control"
                  placeholder="Search tickets..."
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>

              <div className="col-md-4">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as SupportTicketStatus | ""
                    )
                  }
                >
                  <option value="">All Statuses</option>
                  {ticketStatuses.map((ticketStatus) => (
                    <option key={ticketStatus} value={ticketStatus}>
                      {ticketStatus}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="support-panel-card">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <h6 className="fw-semibold mb-1">
                          {ticket.ticketNumber}
                        </h6>
                        <p className="small text-muted mb-0">
                          {ticket.subject}
                        </p>
                      </td>

                      <td>
                        <h6 className="fw-semibold mb-1">
                          {ticket.customerName}
                        </h6>
                        <p className="small text-muted mb-0">
                          {ticket.customerEmail}
                        </p>
                      </td>

                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          {ticket.status}
                        </span>
                      </td>

                      <td>
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                          {ticket.priority}
                        </span>
                      </td>

                      <td>
                        <Button
                          variant="outline-primary"
                          className="btn-sm"
                          onClick={() => handleSelectTicket(ticket)}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No tickets found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="support-panel-card">
            <h5 className="fw-bold mb-3">Ticket Response</h5>

            {!selectedTicket ? (
              <p className="text-muted mb-0">
                Select a ticket from the list to respond.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="support-ticket-preview bg-light rounded-4 p-3 mb-3">
                  <h6 className="fw-bold mb-1">
                    {selectedTicket.ticketNumber}
                  </h6>
                  <p className="text-muted mb-1">{selectedTicket.subject}</p>
                  <p className="small mb-0">{selectedTicket.message}</p>

                  {selectedTicket.orderId ? (
                    <p className="small text-muted mt-2 mb-0">
                      Related Order: {selectedTicket.orderId}
                    </p>
                  ) : null}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={handleStatusChange}
                  >
                    {ticketStatuses.map((ticketStatus) => (
                      <option key={ticketStatus} value={ticketStatus}>
                        {ticketStatus}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={handlePriorityChange}
                  >
                    {ticketPriorities.map((ticketPriority) => (
                      <option key={ticketPriority} value={ticketPriority}>
                        {ticketPriority}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Response</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Write support response..."
                    value={response}
                    onChange={(event) => setResponse(event.target.value)}
                  />
                </div>

                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Save Response
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsPage;