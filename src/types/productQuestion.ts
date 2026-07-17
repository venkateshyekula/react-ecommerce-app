export type ProductQuestionStatus = "OPEN" | "ANSWERED" | "HIDDEN";

export interface ProductQuestion {
  id: string;
  productId: string;
  productName: string;
  sellerId?: string;
  sellerName?: string;
  userId: string;
  userName: string;
  question: string;
  imageUrls?: string[];
  answer?: string;
  answeredByUserId?: string;
  answeredByName?: string;
  status: ProductQuestionStatus;
  createdAt: string;
  answeredAt?: string;
  updatedAt: string;
}

export interface CreateProductQuestionPayload {
  productId: string;
  productName: string;
  sellerId?: string;
  sellerName?: string;
  userId: string;
  userName: string;
  question: string;
  imageUrls?: string[];
}

export interface AnswerProductQuestionPayload {
  answer: string;
  answeredByUserId: string;
  answeredByName: string;
}

export interface UpdateProductQuestionStatusPayload {
  status: ProductQuestionStatus;
}