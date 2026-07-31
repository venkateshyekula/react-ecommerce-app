import { apiClient } from "./apiClient";
import type {
  CreateReturnQcInspectionPayload,
  ReturnQcInspection,
  UpdateReturnQcInspectionPayload,
} from "../types/returnQc";
import {
  generateReturnQcDbId,
  generateReturnQcInspectionId,
} from "../utils/returnQcUtils";

const RETURN_QC_INSPECTIONS_ENDPOINT = "/returnQcInspections";

const sortInspectionsByLatest = (
  inspections: ReturnQcInspection[],
): ReturnQcInspection[] => {
  return [...inspections].sort(
    (firstInspection, secondInspection) =>
      new Date(secondInspection.updatedAt).getTime() -
      new Date(firstInspection.updatedAt).getTime(),
  );
};

export const returnQcService = {
  async getQcInspections(): Promise<ReturnQcInspection[]> {
    const inspections = await apiClient.get<ReturnQcInspection[]>(
      RETURN_QC_INSPECTIONS_ENDPOINT,
    );

    return sortInspectionsByLatest(inspections);
  },

  async getQcInspectionsByReturnRequestId(
    returnRequestId: string,
  ): Promise<ReturnQcInspection[]> {
    const inspections = await apiClient.get<ReturnQcInspection[]>(
      `${RETURN_QC_INSPECTIONS_ENDPOINT}?returnRequestId=${encodeURIComponent(
        returnRequestId,
      )}`,
    );

    return sortInspectionsByLatest(inspections);
  },

  async getQcInspectionByReturnAndProduct({
    returnRequestId,
    productId,
  }: {
    returnRequestId: string;
    productId: string;
  }): Promise<ReturnQcInspection | null> {
    const inspections = await apiClient.get<ReturnQcInspection[]>(
      `${RETURN_QC_INSPECTIONS_ENDPOINT}?returnRequestId=${encodeURIComponent(
        returnRequestId,
      )}&productId=${encodeURIComponent(productId)}`,
    );

    const sortedInspections = sortInspectionsByLatest(inspections);

    return sortedInspections[0] ?? null;
  },

  async createQcInspection(
    payload: CreateReturnQcInspectionPayload,
  ): Promise<ReturnQcInspection> {
    const now = new Date().toISOString();

    const inspection: ReturnQcInspection = {
      id: generateReturnQcDbId(),
      inspectionId: generateReturnQcInspectionId(),
      ...payload,
      inspectedAt: payload.inspectedByUserId ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    return apiClient.post<ReturnQcInspection, ReturnQcInspection>(
      RETURN_QC_INSPECTIONS_ENDPOINT,
      inspection,
    );
  },

  async updateQcInspection(
    inspectionDbId: string,
    payload: UpdateReturnQcInspectionPayload,
  ): Promise<ReturnQcInspection> {
    return apiClient.patch<
      ReturnQcInspection,
      UpdateReturnQcInspectionPayload
    >(
      `${RETURN_QC_INSPECTIONS_ENDPOINT}/${encodeURIComponent(inspectionDbId)}`,
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    );
  },

  async saveQcInspection(
    payload: CreateReturnQcInspectionPayload,
  ): Promise<ReturnQcInspection> {
    const existingInspection =
      await returnQcService.getQcInspectionByReturnAndProduct({
        returnRequestId: payload.returnRequestId,
        productId: payload.productId,
      });

    if (!existingInspection) {
      return returnQcService.createQcInspection(payload);
    }

    const now = new Date().toISOString();

    return returnQcService.updateQcInspection(existingInspection.id, {
      conditionGrade: payload.conditionGrade,
      qcStatus: payload.qcStatus,
      checklistResults: payload.checklistResults,
      qcRemarks: payload.qcRemarks,

      expectedBarcode: payload.expectedBarcode,
      scannedBarcode: payload.scannedBarcode,
      barcodeMatchStatus: payload.barcodeMatchStatus,

      expectedSerialNumber: payload.expectedSerialNumber,
      scannedSerialNumber: payload.scannedSerialNumber,
      serialMatchStatus: payload.serialMatchStatus,

      expectedPackageWeightKg: payload.expectedPackageWeightKg,
      packageWeightKg: payload.packageWeightKg,
      packageWeightVarianceNote: payload.packageWeightVarianceNote,

      qcPhotoDataUrl: payload.qcPhotoDataUrl,
      qcPhotoFileName: payload.qcPhotoFileName,
      evidenceNotes: payload.evidenceNotes,

      inspectedByUserId: payload.inspectedByUserId,
      inspectedByName: payload.inspectedByName,
      inspectedAt: payload.inspectedByUserId
        ? now
        : (existingInspection.inspectedAt ?? null),
    });
  },
};