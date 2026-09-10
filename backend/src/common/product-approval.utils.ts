import type { ProductApprovalStatus } from '../generated/prisma/client';

export const PUBLIC_PRODUCT_APPROVAL_FILTER = {
  approvalStatus: 'APPROVED' as ProductApprovalStatus,
};

export function isProductPubliclyVisible(
  approvalStatus: ProductApprovalStatus,
): boolean {
  return approvalStatus === 'APPROVED';
}
