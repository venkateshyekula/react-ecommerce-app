import { apiClient } from "./apiClient";
import type {
  AnswerProductQuestionPayload,
  CreateProductQuestionPayload,
  ProductQuestion,
  ProductQuestionStatus,
  UpdateProductQuestionStatusPayload
} from "../types/productQuestion";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const PRODUCT_QUESTIONS_ENDPOINT = "/productQuestions";

export const productQuestionService = {
  getQuestions: async (): Promise<ProductQuestion[]> => {
    const questions = await apiClient.get<ProductQuestion[]>(
      PRODUCT_QUESTIONS_ENDPOINT
    );

    return questions.sort(
      (firstQuestion, secondQuestion) =>
        new Date(secondQuestion.createdAt).getTime() -
        new Date(firstQuestion.createdAt).getTime()
    );
  },

  getQuestionsByProductId: async (
    productId: string
  ): Promise<ProductQuestion[]> => {
    const questions = await apiClient.get<ProductQuestion[]>(
      `${PRODUCT_QUESTIONS_ENDPOINT}?productId=${encodeURIComponent(
        productId
      )}`
    );

    return questions.sort(
      (firstQuestion, secondQuestion) =>
        new Date(secondQuestion.createdAt).getTime() -
        new Date(firstQuestion.createdAt).getTime()
    );
  },

  getQuestionsBySellerId: async (
    sellerId: string
  ): Promise<ProductQuestion[]> => {
    const questions = await apiClient.get<ProductQuestion[]>(
      `${PRODUCT_QUESTIONS_ENDPOINT}?sellerId=${encodeURIComponent(sellerId)}`
    );

    return questions.sort(
      (firstQuestion, secondQuestion) =>
        new Date(secondQuestion.createdAt).getTime() -
        new Date(firstQuestion.createdAt).getTime()
    );
  },

  createQuestion: async (
    payload: CreateProductQuestionPayload
  ): Promise<ProductQuestion> => {
    const now = new Date().toISOString();

    const question: ProductQuestion = {
      id: `question-${Date.now()}`,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
      imageUrls: payload.imageUrls ?? [],
      ...payload
    };

    return apiClient.post<ProductQuestion, ProductQuestion>(
      PRODUCT_QUESTIONS_ENDPOINT,
      question
    );
  },

  answerQuestion: async (
    questionId: string,
    payload: AnswerProductQuestionPayload
  ): Promise<ProductQuestion> => {
    const now = new Date().toISOString();

    return apiClient.patch<
      ProductQuestion,
      AnswerProductQuestionPayload & {
        status: ProductQuestionStatus;
        answeredAt: string;
        updatedAt: string;
      }
    >(`${PRODUCT_QUESTIONS_ENDPOINT}/${questionId}`, {
      ...payload,
      status: "ANSWERED",
      answeredAt: now,
      updatedAt: now
    });
  },

  updateQuestionStatus: async (
    questionId: string,
    status: ProductQuestionStatus
  ): Promise<ProductQuestion> => {
    return apiClient.patch<
      ProductQuestion,
      UpdateProductQuestionStatusPayload & {
        updatedAt: string;
      }
    >(`${PRODUCT_QUESTIONS_ENDPOINT}/${questionId}`, {
      status,
      updatedAt: new Date().toISOString()
    });
  },

  /*deleteQuestion: async (questionId: string): Promise<void> => {
    await apiClient.delete<void>(`${PRODUCT_QUESTIONS_ENDPOINT}/${questionId}`);
  }*/

  deleteQuestion: async (questionId: string): Promise<void> => {
  assertValidDeleteId({
    entityType: "question",
    id: questionId
  });

  await apiClient.delete<void>(
    `${PRODUCT_QUESTIONS_ENDPOINT}/${encodeURIComponent(questionId)}`
  );
},  
};