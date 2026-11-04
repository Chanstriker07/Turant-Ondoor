import { prisma } from "./prisma";

export async function refreshBusinessRating(businessId: string) {
  const agg = await prisma.businessReview.aggregate({
    where: { businessId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.business.update({
    where: { id: businessId },
    data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count },
  });
}

export async function refreshProviderRating(providerUserId: string) {
  const agg = await prisma.bookingReview.aggregate({
    where: { booking: { providerId: providerUserId } },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.providerProfile.updateMany({
    where: { userId: providerUserId },
    data: { rating: agg._avg.rating ?? 0, ratingCount: agg._count },
  });
}
