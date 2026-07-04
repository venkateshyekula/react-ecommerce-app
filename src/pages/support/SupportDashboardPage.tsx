import { useEffect, useMemo, useState } from "react";
import Loader from "../../components/common/Loader";
import { supportService } from "../../services/supportService";
import type { Order } from "../../types/order";
import type { SupportTicket } from "../../types/support";
import { formatCurrency } from "../../utils/currencyFormatter";
import { getOrderStatusBadgeClass } from "../../utils/orderUtils";

const SupportDashboardPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadDashboard = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [orderList, ticketList] = await Promise.all([
          supportService.getOrders(),
          supportService.getTickets()
        ]);

        setOrders(orderList);
        setTickets(ticketList);
      } catch {
        setErrorMessage(
          "Unable to load support dashboard. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const returnRequests = orders.filter(
      (order) => order.orderStatus === "Return Requested"
    );

    const cancelledOrders = orders.filter(
      (order) => order.orderStatus === "Cancelled"
    );

    const openTickets = tickets.filter((ticket) => ticket.status === "OPEN");

    const inProgressTickets = tickets.filter(
      (ticket) => ticket.status === "IN_PROGRESS"
    );

    return {
      totalOrders: orders.length,
      returnRequests: returnRequests.length,
      cancelledOrders: cancelledOrders.length,
      openTickets: openTickets.length,
      inProgressTickets: inProgressTickets.length,
      recentOrders: [...orders]
        .sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.orderDate).getTime() -
            new Date(firstOrder.orderDate).getTime()
        )
        .slice(0, 5),
      recentTickets: [...tickets]
        .sort(
          (firstTicket, secondTicket) =>
            new Date(secondTicket.createdAt).getTime() -
            new Date(firstTicket.createdAt).getTime()
        )
        .slice(0, 5)
    };
  }, [orders, tickets]);

  if (isLoading) {
    return <Loader message="Loading support dashboard..." />;
  }

  if (errorMessage) {
    return (
      <div className="alert alert-danger" role="alert">
        {errorMessage}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="fw-bold mb-1">Support Dashboard</h1>
        <p className="text-muted mb-0">
          Monitor returns, cancellations, customer tickets, and order assistance.
        </p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="support-stat-card">
            <div className="support-stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-receipt" />
            </div>
            <p className="text-muted mb-1">Total Orders</p>
            <h3 className="fw-bold mb-0">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="support-stat-card">
            <div className="support-stat-icon bg-warning-subtle text-warning">
              <i className="bi bi-arrow-counterclockwise" />
            </div>
            <p className="text-muted mb-1">Return Requests</p>
            <h3 className="fw-bold mb-0">{stats.returnRequests}</h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="support-stat-card">
            <div className="support-stat-icon bg-danger-subtle text-danger">
              <i className="bi bi-x-circle" />
            </div>
            <p className="text-muted mb-1">Cancelled Orders</p>
            <h3 className="fw-bold mb-0">{stats.cancelledOrders}</h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="support-stat-card">
            <div className="support-stat-icon bg-success-subtle text-success">
              <i className="bi bi-chat-dots" />
            </div>
            <p className="text-muted mb-1">Open Tickets</p>
            <h3 className="fw-bold mb-0">
              {stats.openTickets} / {stats.inProgressTickets}
            </h3>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="support-panel-card">
            <h5 className="fw-bold mb-3">Recent Orders</h5>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-semibold">{order.orderId}</td>
                      <td>
                        <span
                          className={`badge ${getOrderStatusBadgeClass(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        {new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "medium"
                        }).format(new Date(order.orderDate))}
                      </td>
                    </tr>
                  ))}

                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No orders found.
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
            <h5 className="fw-bold mb-3">Recent Tickets</h5>

            {stats.recentTickets.length === 0 ? (
              <p className="text-muted mb-0">No tickets found.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {stats.recentTickets.map((ticket) => (
                  <div key={ticket.id} className="border-bottom pb-2">
                    <div className="d-flex justify-content-between gap-3">
                      <h6 className="fw-semibold mb-1">
                        {ticket.ticketNumber}
                      </h6>

                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {ticket.status}
                      </span>
                    </div>

                    <p className="small text-muted mb-0">{ticket.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboardPage;