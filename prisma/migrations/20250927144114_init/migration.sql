-- CreateTable
CREATE TABLE "public"."RewardEligibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardSpin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resultKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardSpin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardPointLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardPointLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardSpin_userId_createdAt_idx" ON "public"."RewardSpin"("userId", "createdAt");
