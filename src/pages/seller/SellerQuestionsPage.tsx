import { useEffect, useMemo, useState, useCallback } from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { productQuestionService } from "../../services/productQuestionService";
import type { ProductQuestion } from "../../types/productQuestion";

const SellerQuestionsPage = () => {
  const { currentUser } = useAuth();

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [answerTextByQuestionId, setAnswerTextByQuestionId] = useState<
    Record<string, string>
  >({});
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [animatedStatusQuestionIds, setAnimatedStatusQuestionIds] = useState<
    string[]
  >([]);

  // FIX 1: Wrapped inside a useCallback that honors an AbortSignal
  const loadQuestions = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      if (!currentUser) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const result = await productQuestionService.getQuestionsBySellerId(
          currentUser.id,
        );

        if (signal?.aborted) return;
        setQuestions(result);
      } catch {
        if (signal?.aborted) return;
        setErrorMessage(
          "Unable to load seller questions. Please make sure JSON Server is running.",
        );
      } finally {
        // SAFE: Conditional block replaces the return statement
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [currentUser],
  );

  // FIX 1: Cleans up running requests when component unmounts or ID modifies
  useEffect(() => {
    const controller = new AbortController();
    void loadQuestions(controller.signal);

    return () => controller.abort();
  }, [currentUser?.id, loadQuestions]);

  const filteredQuestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return questions.filter((question) => {
      return (
        !query ||
        question.productName.toLowerCase().includes(query) ||
        question.question.toLowerCase().includes(query) ||
        question.userName.toLowerCase().includes(query)
      );
    });
  }, [questions, searchText]);

  const triggerStatusAnimation = (questionId: string): void => {
    setAnimatedStatusQuestionIds((previousIds) => [
      ...previousIds.filter((id) => id !== questionId),
      questionId,
    ]);

    window.setTimeout(() => {
      setAnimatedStatusQuestionIds((previousIds) =>
        previousIds.filter((id) => id !== questionId),
      );
    }, 900);
  };

  const handleAnswer = async (question: ProductQuestion): Promise<void> => {
    if (!currentUser) {
      setErrorMessage("Seller user is missing.");
      return;
    }

    const answer = answerTextByQuestionId[question.id]?.trim();

    if (!answer) {
      setErrorMessage("Please enter an answer.");
      return;
    }

    try {
      setAnsweringQuestionId(question.id);
      setErrorMessage(""); // Clear old error states on initialization

      const updatedQuestion = await productQuestionService.answerQuestion(
        question.id,
        {
          answer,
          answeredByUserId: currentUser.id,
          answeredByName: currentUser.name,
        },
      );

      setQuestions((previousQuestions) =>
        previousQuestions.map((existingQuestion) =>
          existingQuestion.id === updatedQuestion.id
            ? updatedQuestion
            : existingQuestion,
        ),
      );
      triggerStatusAnimation(updatedQuestion.id);
      setAnswerTextByQuestionId((previousValues) => ({
        ...previousValues,
        [question.id]: "",
      }));

      // FIX 2: Flush global validation errors out upon successful operations
      setErrorMessage("");
    } catch {
      setErrorMessage("Unable to answer question.");
    } finally {
      setAnsweringQuestionId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading seller questions..." />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Product Questions</h1>
          <p className="text-muted mb-0">
            Answer questions asked for your products.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadQuestions()}>
          <i className="bi bi-arrow-repeat me-2" />
          Refresh
        </Button>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="seller-panel-card mb-4">
        <input
          className="form-control"
          placeholder="Search by product, question, or customer..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      <div className="seller-panel-card">
        {filteredQuestions.length === 0 ? (
          <p className="text-muted mb-0">No questions found.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="seller-question-card border-bottom pb-3"
              >
                <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                  <div>
                    <h6 className="fw-bold mb-1">{question.productName}</h6>
                    <p className="text-muted mb-1">{question.question}</p>

                    <p className="small text-muted mb-0">
                      Asked by {question.userName}
                    </p>
                  </div>

                  <span
                    className={`seller-question-status-badge ${
                      question.status === "ANSWERED" ? "answered" : "open"
                    } ${
                      animatedStatusQuestionIds.includes(question.id)
                        ? "status-changed"
                        : ""
                    }`}
                  >
                    {question.status}
                  </span>
                </div>

                {question.imageUrls?.length ? (
                  <div className="question-attachment-list mb-3">
                    {question.imageUrls.map((imageUrl, index) => (
                      <a
                        key={`${question.id}-seller-image-${index}`}
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

                {question.answer && (
                  <div className="bg-light rounded-4 p-3 mb-3">
                    <strong>Answer:</strong>
                    <p className="mb-0">{question.answer}</p>
                  </div>
                )}

                <textarea
                  className="form-control mb-2"
                  rows={3}
                  placeholder="Write answer..."
                  value={answerTextByQuestionId[question.id] ?? ""}
                  onChange={(event) => {
                    // Reset errors on keystroke so warning goes away when typing begins
                    if (errorMessage) setErrorMessage("");
                    setAnswerTextByQuestionId((previousValues) => ({
                      ...previousValues,
                      [question.id]: event.target.value,
                    }));
                  }}
                />

                <Button
                  variant="primary"
                  className="btn-sm"
                  isLoading={answeringQuestionId === question.id}
                  onClick={() => void handleAnswer(question)}
                >
                  {question.answer ? "Update Answer" : "Submit Answer"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerQuestionsPage;
