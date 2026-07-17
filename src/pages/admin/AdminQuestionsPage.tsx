import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { productQuestionService } from "../../services/productQuestionService";
import type {
  ProductQuestion,
  ProductQuestionStatus
} from "../../types/productQuestion";
import { useToast } from "../../context/useToast";

const statusOptions: Array<ProductQuestionStatus | ""> = [
  "",
  "OPEN",
  "ANSWERED",
  "HIDDEN"
];

const AdminQuestionsPage = () => {
  const { currentUser } = useAuth();

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ProductQuestionStatus | "">(
    ""
  );
  const [answerTextByQuestionId, setAnswerTextByQuestionId] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingQuestionId, setUpdatingQuestionId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { showToast } = useToast();

  const loadQuestions = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await productQuestionService.getQuestions();
      setQuestions(result);
    } catch {
      setErrorMessage(
        "Unable to load questions. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, []);

  const filteredQuestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesSearch =
        !query ||
        question.productName.toLowerCase().includes(query) ||
        question.question.toLowerCase().includes(query) ||
        question.userName.toLowerCase().includes(query) ||
        question.sellerName?.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || question.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [questions, searchText, statusFilter]);

  const handleAnswer = async (question: ProductQuestion): Promise<void> => {
    if (!currentUser) {
      setErrorMessage("Admin user is missing.");
      return;
    }

    const answer = answerTextByQuestionId[question.id]?.trim();

    if (!answer) {
      setErrorMessage("Please enter an answer.");
      return;
    }

    try {
      setUpdatingQuestionId(question.id);
      setErrorMessage("");

      const updatedQuestion = await productQuestionService.answerQuestion(
        question.id,
        {
          answer,
          answeredByUserId: currentUser.id,
          answeredByName: currentUser.name
        }
      );

      setQuestions((previousQuestions) =>
        previousQuestions.map((existingQuestion) =>
          existingQuestion.id === updatedQuestion.id
            ? updatedQuestion
            : existingQuestion
        )
      );

      setAnswerTextByQuestionId((previousValues) => ({
        ...previousValues,
        [question.id]: ""
      }));
    } catch {
      setErrorMessage("Unable to answer question.");
    } finally {
      setUpdatingQuestionId("");
    }
  };

  const handleStatusChange = async (
    question: ProductQuestion,
    status: ProductQuestionStatus
  ): Promise<void> => {
    try {
      setUpdatingQuestionId(question.id);

      const updatedQuestion =
        await productQuestionService.updateQuestionStatus(question.id, status);

      setQuestions((previousQuestions) =>
        previousQuestions.map((existingQuestion) =>
          existingQuestion.id === updatedQuestion.id
            ? updatedQuestion
            : existingQuestion
        )
      );
    } catch {
      setErrorMessage("Unable to update question status.");
    } finally {
      setUpdatingQuestionId("");
    }
  };

  const handleDelete = async (questionId: string): Promise<void> => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await productQuestionService.deleteQuestion(questionId);

      setQuestions((previousQuestions) =>
        previousQuestions.filter((question) => question.id !== questionId)
      );
      showToast(
"Question deleted",
"Question was deleted successfully.",
"success"
);
    } catch {
      showToast("Unable to delete question", "Please try again.", "danger");
    }
  };

  if (isLoading) {
    return <Loader message="Loading product questions..." />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Product Questions</h1>
          <p className="text-muted mb-0">
            Moderate customer questions and seller/admin answers.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadQuestions()}>
          <i className="bi bi-arrow-repeat me-2" />
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="admin-panel-card mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder="Search by product, question, customer, or seller..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ProductQuestionStatus | "")
              }
            >
              {statusOptions.map((status) => (
                <option key={status || "ALL"} value={status}>
                  {status || "All Statuses"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Question</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Answer / Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.id}>
                  <td>
                    <h6 className="fw-semibold mb-1">{question.question}</h6>

                    {question.imageUrls?.length ? (
                      <div className="question-attachment-list mt-2 mb-2">
                        {question.imageUrls.map((imageUrl, index) => (
                          <a
                            key={`${question.id}-admin-image-${index}`}
                            href={imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="question-attachment"
                          >
                            <img
                              src={imageUrl}
                              alt={`Question attachment ${index + 1}`}
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {question.answer ? (
                      <p className="small text-muted mb-0">
                        Answer: {question.answer}
                      </p>
                    ) : null}
                  </td>

                  <td>
                    <h6 className="fw-semibold mb-1">
                      {question.productName}
                    </h6>
                    <p className="small text-muted mb-0">
                      Seller: {question.sellerName ?? "-"}
                    </p>
                  </td>

                  <td>{question.userName}</td>

                  <td>
                    <select
                      className="form-select form-select-sm admin-question-status-select"
                      value={question.status}
                      disabled={updatingQuestionId === question.id}
                      onChange={(event) =>
                        void handleStatusChange(
                          question,
                          event.target.value as ProductQuestionStatus
                        )
                      }
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ANSWERED">ANSWERED</option>
                      <option value="HIDDEN">HIDDEN</option>
                    </select>
                  </td>

                  <td>
                    <div className="d-flex flex-column gap-2">
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Write answer..."
                        value={answerTextByQuestionId[question.id] ?? ""}
                        onChange={(event) =>
                          setAnswerTextByQuestionId((previousValues) => ({
                            ...previousValues,
                            [question.id]: event.target.value
                          }))
                        }
                      />

                      <div className="d-flex gap-2">
                        <Button
                          variant="primary"
                          className="btn-sm"
                          isLoading={updatingQuestionId === question.id}
                          onClick={() => void handleAnswer(question)}
                        >
                          {question.answer ? "Update" : "Answer"}
                        </Button>

                        <Button
                          variant="outline-danger"
                          className="btn-sm"
                          onClick={() => void handleDelete(question.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No questions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionsPage;