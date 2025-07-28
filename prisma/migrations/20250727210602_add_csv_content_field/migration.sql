-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "password" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "idToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT,
    "backupCodes" TEXT,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_report" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "foreignBrandId" INTEGER NOT NULL,
    "foreignPartnerId" INTEGER NOT NULL,
    "foreignCampaignId" INTEGER NOT NULL,
    "foreignLandingId" INTEGER NOT NULL,
    "trafficSource" TEXT,
    "deviceType" TEXT NOT NULL,
    "userAgentFamily" TEXT NOT NULL,
    "osFamily" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "allClicks" INTEGER NOT NULL,
    "uniqueClicks" INTEGER NOT NULL,
    "registrationsCount" INTEGER NOT NULL,
    "ftdCount" INTEGER NOT NULL,
    "depositsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players_data" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "originalPlayerId" INTEGER NOT NULL,
    "signUpDate" TIMESTAMP(3) NOT NULL,
    "firstDepositDate" TIMESTAMP(3),
    "partnerId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "partnerTags" TEXT NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "campaignName" TEXT NOT NULL,
    "promoId" INTEGER NOT NULL,
    "promoCode" TEXT NOT NULL,
    "playerCountry" TEXT NOT NULL,
    "tagClickid" TEXT,
    "tagOs" TEXT,
    "tagSource" TEXT,
    "tagSub2" TEXT,
    "tagWebId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "prequalified" INTEGER NOT NULL,
    "duplicate" INTEGER NOT NULL,
    "selfExcluded" INTEGER NOT NULL,
    "disabled" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "ftdCount" INTEGER NOT NULL,
    "ftdSum" DECIMAL(10,2) NOT NULL,
    "depositsCount" INTEGER NOT NULL,
    "depositsSum" DECIMAL(10,2) NOT NULL,
    "cashoutsCount" INTEGER NOT NULL,
    "cashoutsSum" DECIMAL(10,2) NOT NULL,
    "casinoBetsCount" INTEGER NOT NULL,
    "casinoRealNgr" DECIMAL(10,2) NOT NULL,
    "fixedPerPlayer" DECIMAL(10,2) NOT NULL,
    "casinoBetsSum" DECIMAL(12,2) NOT NULL,
    "casinoWinsSum" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "totalRows" INTEGER,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "csvContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "twoFactor_userId_key" ON "twoFactor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "traffic_report_date_idx" ON "traffic_report"("date");

-- CreateIndex
CREATE INDEX "traffic_report_foreignPartnerId_idx" ON "traffic_report"("foreignPartnerId");

-- CreateIndex
CREATE INDEX "traffic_report_foreignCampaignId_idx" ON "traffic_report"("foreignCampaignId");

-- CreateIndex
CREATE INDEX "traffic_report_country_idx" ON "traffic_report"("country");

-- CreateIndex
CREATE INDEX "traffic_report_date_foreignPartnerId_idx" ON "traffic_report"("date", "foreignPartnerId");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_report_date_foreignPartnerId_foreignCampaignId_fore_key" ON "traffic_report"("date", "foreignPartnerId", "foreignCampaignId", "foreignLandingId", "trafficSource", "deviceType", "userAgentFamily", "osFamily", "country");

-- CreateIndex
CREATE INDEX "players_data_date_idx" ON "players_data"("date");

-- CreateIndex
CREATE INDEX "players_data_partnerId_idx" ON "players_data"("partnerId");

-- CreateIndex
CREATE INDEX "players_data_campaignId_idx" ON "players_data"("campaignId");

-- CreateIndex
CREATE INDEX "players_data_playerCountry_idx" ON "players_data"("playerCountry");

-- CreateIndex
CREATE INDEX "players_data_signUpDate_idx" ON "players_data"("signUpDate");

-- CreateIndex
CREATE INDEX "players_data_date_partnerId_idx" ON "players_data"("date", "partnerId");

-- CreateIndex
CREATE INDEX "players_data_playerId_idx" ON "players_data"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "players_data_playerId_date_key" ON "players_data"("playerId", "date");

-- CreateIndex
CREATE INDEX "import_job_userId_status_idx" ON "import_job"("userId", "status");

-- CreateIndex
CREATE INDEX "import_job_createdAt_idx" ON "import_job"("createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
