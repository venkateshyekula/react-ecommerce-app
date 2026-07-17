import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import Loader from "../common/Loader";
import { useAuth } from "../../context/useAuth";
import { productQuestionService } from "../../services/productQuestionService";
import type { Product } from "../../types/product";
import type { ProductQuestion } from "../../types/productQuestion";

interface ProductQuestionsProps {
  product: Product;
}

const MAX_QUESTION_IMAGES = 3;
const MAX_IMAGE_SIZE_MB = 1.5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const convertFileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
};

const ProductQuestions = ({ product }: ProductQuestionsProps) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionText, setQuestionText] = useState<string>("");
  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [answerTextByQuestionId, setAnswerTextByQuestionId] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingQuestion, setIsSavingQuestion] = useState<boolean>(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const userRole = currentUser?.role;
  const canAskQuestion = userRole === "CUSTOMER" || userRole === "ADMIN";

  const canAnswerQuestion =
    userRole === "ADMIN" ||
    (userRole === "SELLER" && currentUser?.id === product.sellerId);

  // FIX 3: Wrapped in useCallback with AbortSignal protection
const loadQuestions = useCallback(async (signal?: AbortSignal): Promise<void> => {
  try {
    setIsLoading(true);
    setErrorMessage("");

    const result = await productQuestionService.getQuestionsByProductId(
      product.id
    );

    if (signal?.aborted) return;
    setQuestions(result);
  } catch {
    if (signal?.aborted) return;
    setErrorMessage(
      "Unable to load product questions. Please make sure JSON Server is running."
    );
  } finally {
    // SAFE: Conditional block replaces the return statement
    if (!signal?.aborted) {
      setIsLoading(false);
    }
  }
}, [product.id]);

  // FIX 2 & 3: Clean up hanging form states when switching items + handle signal abortion
  useEffect(() => {
    const controller = new AbortController();

    // Clear out stale input messages from previous products
    setQuestionText("");
    setQuestionImages([]);
    setAnswerTextByQuestionId({});
    setErrorMessage("");
    setSuccessMessage("");

    void loadQuestions(controller.signal);

    return () => controller.abort();
  }, [product.id, loadQuestions]);

  const visibleQuestions = useMemo(() => {
    if (userRole === "ADMIN") {
      return questions;
    }
    return questions.filter((question) => question.status !== "HIDDEN");
  }, [questions, userRole]);

  const answeredCount = useMemo(() => {
    return visibleQuestions.filter((question) => question.status === "ANSWERED")
      .length;
  }, [visibleQuestions]);

  const handleQuestionChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    setQuestionText(event.target.value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleQuestionImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (questionImages.length + selectedFiles.length > MAX_QUESTION_IMAGES) {
      setErrorMessage(`You can upload up to ${MAX_QUESTION_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const validatedFiles = selectedFiles.filter((file) => {
        const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isAllowedSize = file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;
        return isAllowedType && isAllowedSize;
      });

      if (validatedFiles.length !== selectedFiles.length) {
        setErrorMessage(
          `Only JPG, PNG, or WEBP images up to ${MAX_IMAGE_SIZE_MB}MB are allowed.`,
        );
        event.target.value = "";
        return;
      }

      const imageUrls = await Promise.all(
        validatedFiles.map((file) => convertFileToDataUrl(file)),
      );

      setQuestionImages((previousImages) => [...previousImages, ...imageUrls]);
    } catch {
      setErrorMessage("Unable to upload image. Please try again.");
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveQuestionImage = (imageUrl: string): void => {
    setQuestionImages((previousImages) =>
      previousImages.filter(
        (existingImageUrl) => existingImageUrl !== imageUrl,
      ),
    );
  };

  const handleAskQuestion = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!currentUser || !canAskQuestion) {
      setErrorMessage("Only customers and admins can ask product questions.");
      return;
    }

    const question = questionText.trim();
    if (!question) {
      setErrorMessage("Please enter your question.");
      return;
    }

    try {
      setIsSavingQuestion(true);
      setErrorMessage("");
      setSuccessMessage("");

      const createdQuestion = await productQuestionService.createQuestion({
        productId: product.id,
        productName: product.name,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        userId: currentUser.id,
        userName: currentUser.name,
        question,
        imageUrls: questionImages,
      });

      setQuestions((previousQuestions) => [
        createdQuestion,
        ...previousQuestions,
      ]);
      setQuestionText("");
      setQuestionImages([]);
      setSuccessMessage("Your question has been submitted successfully.");
    } catch {
      setErrorMessage("Unable to submit question. Please try again.");
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // FIX 1: Computed property key assignment evaluation syntax corrected
  const handleAnswerTextChange = (questionId: string, value: string): void => {
    setAnswerTextByQuestionId((previousValues) => ({
      ...previousValues,
      [questionId]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleAnswerQuestion = async (
    question: ProductQuestion,
  ): Promise<void> => {
    if (!currentUser || !canAnswerQuestion) {
      setErrorMessage("Only seller or admin can answer this question.");
      return;
    }

    const answer = answerTextByQuestionId[question.id]?.trim();
    if (!answer) {
      setErrorMessage("Please enter an answer.");
      return;
    }

    try {
      setAnsweringQuestionId(question.id);
      setErrorMessage("");
      setSuccessMessage("");

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

      setAnswerTextByQuestionId((previousValues) => ({
        ...previousValues,
        [question.id]: "",
      }));

      setSuccessMessage("Question answered successfully.");
    } catch {
      setErrorMessage("Unable to answer question. Please try again.");
    } finally {
      setAnsweringQuestionId("");
    }
  };

  const handleHideQuestion = async (
    question: ProductQuestion,
  ): Promise<void> => {
    try {
      const updatedQuestion = await productQuestionService.updateQuestionStatus(
        question.id,
        question.status === "HIDDEN" ? "OPEN" : "HIDDEN",
      );

      setQuestions((previousQuestions) =>
        previousQuestions.map((existingQuestion) =>
          existingQuestion.id === updatedQuestion.id
            ? updatedQuestion
            : existingQuestion,
        ),
      );
    } catch {
      setErrorMessage("Unable to update question status.");
    }
  };

  if (isLoading) {
    return <Loader message="Loading product questions..." />;
  }

  return (
    <div className="product-questions-module">
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <div className="product-question-summary bg-light rounded-4 p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <h5 className="fw-bold mb-1">Questions & Answers</h5>
            <p className="text-muted mb-0">
              {visibleQuestions.length} questions • {answeredCount} answered
            </p>
          </div>

          <Button
            variant="outline-primary"
            onClick={() => void loadQuestions()}
          >
            <i className="bi bi-arrow-repeat me-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="product-question-form bg-light rounded-4 p-4 mb-4">
        <h5 className="fw-bold mb-3">Ask about this product</h5>

        {!isAuthenticated ? (
          <p className="text-muted mb-0">
            Please{" "}
            <Link to="/login" className="fw-bold">
              login
            </Link>{" "}
            to ask a question.
          </p>
        ) : !canAskQuestion ? (
          <p className="text-muted mb-0">
            Product questions can be asked only by customer and admin accounts.
          </p>
        ) : (
          <form onSubmit={handleAskQuestion}>
            <textarea
              className="form-control mb-3"
              rows={3}
              placeholder="Ask a question about size, delivery, warranty, damage, product details..."
              value={questionText}
              onChange={handleQuestionChange}
            />

            <div className="question-image-upload-box mb-3">
              <label
                htmlFor="questionImages"
                className="form-label fw-semibold"
              >
                Upload Images
              </label>

              <input
                id="questionImages"
                type="file"
                className="form-control"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => void handleQuestionImageChange(event)}
              />

              <p className="small text-muted mt-2 mb-0">
                Optional. Upload up to {MAX_QUESTION_IMAGES} images. JPG, PNG,
                WEBP only. Max {MAX_IMAGE_SIZE_MB}MB each.
              </p>
            </div>

            {questionImages.length > 0 && (
              <div className="question-image-preview-list mb-3">
                {questionImages.map((imageUrl) => (
                  <div className="question-image-preview" key={imageUrl}>
                    <img src={imageUrl} alt="Question upload preview" />
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionImage(imageUrl)}
                      aria-label="Remove uploaded image"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingQuestion}
            >
              Submit Question
            </Button>
          </form>
        )}
      </div>

      {visibleQuestions.length === 0 ? (
        <div className="product-question-empty bg-light rounded-4 p-4">
          <i className="bi bi-chat-square-text" />
          <h6 className="fw-bold mt-3 mb-1">No questions yet</h6>
          <p className="text-muted mb-0">
            Be the first to ask a question about this product.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {visibleQuestions.map((question) => (
            <div
              key={question.id}
              className={`product-question-card rounded-4 p-4 ${
                question.status === "HIDDEN" ? "is-hidden" : ""
              }`}
            >
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="question-label">Q</span>
                    <h6 className="fw-bold mb-0">{question.question}</h6>
                  </div>

                  <p className="small text-muted mb-3">
                    Asked by {question.userName} on{" "}
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                    }).format(new Date(question.createdAt))}
                  </p>

                  {question.imageUrls?.length ? (
                    <div className="question-attachment-list mb-3">
                      {question.imageUrls.map((imageUrl, index) => (
                        <a
                          key={`${question.id}-image-${index}`}
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
                    <div className="product-question-answer">
                      <div className="d-flex align-items-start gap-2">
                        <span className="answer-label">A</span>
                        <div>
                          <p className="mb-1">{question.answer}</p>
                          <p className="small text-muted mb-0">
                            Answered by {question.answeredByName}{" "}
                            {question.answeredAt &&
                              `on ${new Intl.DateTimeFormat("en-IN", {
                                dateStyle: "medium",
                              }).format(new Date(question.answeredAt))}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle mb-2 d-inline-block">
                      Awaiting answer
                    </span>
                  )}

                  {canAnswerQuestion && question.status !== "HIDDEN" && (
                    <div className="product-question-answer-form mt-3">
                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        placeholder="Write seller/admin answer..."
                        value={answerTextByQuestionId[question.id] ?? ""}
                        onChange={(event) =>
                          handleAnswerTextChange(
                            question.id,
                            event.target.value,
                          )
                        }
                      />

                      <Button
                        variant="primary"
                        className="btn-sm"
                        isLoading={answeringQuestionId === question.id}
                        onClick={() => void handleAnswerQuestion(question)}
                      >
                        {question.answer ? "Update Answer" : "Submit Answer"}
                      </Button>
                    </div>
                  )}
                </div>

                {userRole === "ADMIN" && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => void handleHideQuestion(question)}
                  >
                    {question.status === "HIDDEN" ? "Unhide" : "Hide"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductQuestions;
