# Go Funds Backend API - Architecture & System Documentation

> **Note for AI Agents & Developers**: This document provides a complete, authoritative architectural and operational specification of the `backend_go_funds` codebase. It details all system components, data models, security implementations, background jobs, external integrations, and business algorithms (including authentication flows and the 10-stage mutual fund recommendation engine). Any AI agent reading this document will gain immediate, comprehensive context to maintain, refactor, or extend this application.

---

## Table of Contents

1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Architecture & Folder Structure](#3-architecture--folder-structure)
4. [Environment Configuration & Deployment](#4-environment-configuration--deployment)
5. [Database Schema & Entity Relationships](#5-database-schema--entity-relationships)
6. [Global Application Mechanics](#6-global-application-mechanics)
7. [Authentication & User Management Module](#7-authentication--user-management-module)
   - [RSA Password Encryption & Decryption](#71-rsa-password-encryption--decryption)
   - [Registration & Email Verification Flow](#72-registration--email-verification-flow)
   - [Login & Dual-Token Rotation System](#73-login--dual-token-rotation-system)
   - [Password Reset Flow](#74-password-reset-flow)
   - [Automated Unverified User Cleanup Cron](#75-automated-unverified-user-cleanup-cron)
8. [Funds Catalog & Sync Module](#8-funds-catalog--sync-module)
   - [AMFI Live Feed Ingestion Engine](#81-amfi-live-feed-ingestion-engine)
   - [Categorization & Risk Estimation Rules](#82-categorization--risk-estimation-rules)
   - [Daily Automated Cron Synchronization](#83-daily-automated-cron-synchronization)
   - [Funds Query & Filtering API](#84-funds-query--filtering-api)
9. [Planner & Investment Recommendation Engine](#9-planner--investment-recommendation-engine)
   - [Architectural Overview](#91-architectural-overview)
   - [10-Stage Recommendation Pipeline Breakdown](#92-10-stage-recommendation-pipeline-breakdown)
   - [SIP Future Value Calculation Formula](#93-sip-future-value-calculation-formula)
   - [Plan Management & User Statistics API](#94-plan-management--user-statistics-api)
10. [Transactional Email Service](#10-transactional-email-service)
11. [Complete API Endpoints Catalog](#11-complete-api-endpoints-catalog)
12. [Developer Guide & Extension Points](#12-developer-guide--extension-points)

---

## 1. Project Overview & Purpose

**Go Funds Backend** (`backend_go_funds`) is a production-grade NestJS RESTful API designed for automated mutual fund portfolio recommendation, investment planning, and fund catalog management.

### Key Capabilities
- **End-to-End Authentication**: Zero-trust architecture featuring RSA PKCS1 client-side password encryption, bcrypt hashing, dual JWT token rotation (Access + Refresh), 6-digit email OTP verifications, and secure password reset.
- **Automated Mutual Fund Sync**: Ingests daily NAVs and scheme data directly from AMFI (Association of Mutual Funds in India), dynamically classifies funds into main/sub categories, estimates risk levels, and upserts data into PostgreSQL in high-performance batches.
- **10-Stage Investment Recommendation Engine**: Evaluates investor financial capacity and risk tolerance, applies goal-specific strategies, calculates optimal asset allocation across sub-categories, screens and ranks top eligible funds, projects future returns using SIP annuity calculations, and generates human-readable explanations.
- **Portfolio & Dashboard Analytics**: Aggregates user plans, computes total monthly commitments, and provides risk profile distribution breakdowns.

---

## 2. Tech Stack & Dependencies

| Layer | Technology / Package | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [NestJS](https://nestjs.com/) | `^11.0.1` | Modular Node.js enterprise backend framework |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5.7.3` | Strongly typed JavaScript |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `16-alpine` | Relational database (Docker container locally / Neon in prod) |
| **ORM** | [TypeORM](https://typeorm.io/) | `^1.1.0` | Entities, Query Builders, Migrations |
| **Security & Hashing** | `bcrypt` | `^6.0.0` | Password hashing & OTP/Token verification |
| **Encryption** | Node.js `crypto` | Native | RSA PKCS1 private key decryption for passwords |
| **Authentication** | `@nestjs/passport`, `passport-jwt` | `^11.0.5` | Passport strategy integration for JWT guard |
| **Scheduling** | `@nestjs/schedule` | `^6.1.3` | Cron tasks for daily NAV sync and unverified user cleanup |
| **Mailer** | `@nestjs-modules/mailer`, `nodemailer` | `^2.3.7` | SMTP email service for OTPs and notifications |
| **Validation** | `class-validator`, `class-transformer` | `^0.15.1` | DTO validation and object serialization |
| **Documentation** | `@nestjs/swagger` | `^11.4.5` | OpenAPI specification and Interactive Swagger UI at `/api/docs` |

---

## 3. Architecture & Folder Structure

The application follows NestJS's modular domain-driven architectural pattern.

```
backend_go_funds/
├── .compose.env                # Docker Compose environment variables
├── .env                        # Local runtime environment file
├── .env.example                # Template for environment variables
├── compose.yaml                # Docker Compose config for local PostgreSQL (port 5434)
├── nest-cli.json               # Nest CLI configuration
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler config
├── typeorm.config.ts           # TypeORM CLI DataSource config for migrations
├── src/
│   ├── main.ts                 # Application bootstrap file (Pipes, Interceptors, CORS, Swagger)
│   ├── app.module.ts           # Root module loading Config, TypeORM, Schedule, and Feature Modules
│   ├── app.controller.ts       # Health check controller
│   ├── app.service.ts          # Health check service
│   ├── config/
│   │   └── app.config.ts       # Typed configuration module using registerAs
│   ├── common/
│   │   ├── decorators/         # Custom decorators (@CurrentUser, @Roles)
│   │   ├── enums/              # Core enums (UserRole)
│   │   ├── guards/             # Security guards (JwtAuthGuard, JwtRefreshGuard, RolesGuard)
│   │   └── interceptors/       # Interceptors (TransformInterceptor for unified API responses)
│   ├── migrations/             # TypeORM DB migration files
│   └── modules/
│       ├── auth/               # Authentication domain (Controllers, Services, DTOs, Strategies)
│       ├── users/              # User management, Refresh tokens, OTP entities, Cleanup cron
│       ├── funds/              # Funds catalog, AMFI Sync engine, Cron scheduler, Query service
│       ├── planner/            # Investment Recommendation Engine (10 sub-services, Entities, DTOs)
│       └── mail/               # Transactional email service (Nodemailer wrapper)
```

---

## 4. Environment Configuration & Deployment

Configuration parameters are loaded via `@nestjs/config` in [src/config/app.config.ts](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/config/app.config.ts).

### Environment Variables Matrix

| Variable | Default (Dev) | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | HTTP Server port |
| `APP_ENV` | `development` | Environment mode (`development` or `production`) |
| `LOCAL_DATABASE_URL` | `postgresql://postgres:postgres@localhost:5434/gofunds` | Dev database URL |
| `NEON_DATABASE_URL` | `postgresql://user:pass@neon-host/db?sslmode=require` | Production database URL |
| `DATABASE_URL` | Fallback | Legacy environment database connection string |
| `JWT_ACCESS_SECRET` | `change-me-access` | Secret key for signing Access Tokens |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifespan |
| `JWT_REFRESH_SECRET` | `change-me-refresh` | Secret key for signing Refresh Tokens |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifespan |
| `BCRYPT_SALT_ROUNDS` | `10` | Salt rounds for bcrypt hashing |
| `RSA_PRIVATE_KEY` | Raw PEM string | RSA Private Key for decrypting frontend-encrypted passwords |
| `SMTP_USER` | `""` | Gmail / SMTP email address |
| `SMTP_PASS` | `""` | Gmail App Password (16 characters) |
| `SMTP_FROM` | `""` | Sender header display name & email |
| `OTP_EXPIRES_IN_MINUTES` | `15` | Email OTP validity duration |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |

### Running the Application

```bash
# 1. Start local PostgreSQL database container
npm run db:up

# 2. Run in development watch mode
npm run start:dev

# 3. Run database migrations (TypeORM CLI)
npm run migration:run

# 4. Run unit tests
npm run test
```

---

## 5. Database Schema & Entity Relationships

The PostgreSQL database contains 6 primary relational tables managed through TypeORM entities:

```mermaid
erDiagram
    users ||--o{ refresh_tokens : "has many"
    users ||--o{ otp_verifications : "has many"
    users ||--o{ investment_plans : "owns many"
    fund_houses ||--o{ funds : "manages many"

    users {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum role "user | admin"
        boolean is_active
        boolean is_verified
        string phone_country_code
        string phone_number
        date date_of_birth
        decimal annual_income
        timestamptz created_at
        timestamptz updated_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash
        timestamptz expires_at
        boolean is_revoked
        timestamptz created_at
    }

    otp_verifications {
        uuid id PK
        uuid user_id FK
        string otp_hash
        timestamptz expires_at
        boolean is_used
        timestamptz created_at
    }

    fund_houses {
        uuid id PK
        string fund_house_name UK
        string website
        string logo_url
        timestamptz created_at
        timestamptz updated_at
    }

    funds {
        uuid id PK
        uuid fund_house_id FK
        string fund_name
        string scheme_code UK
        enum fund_main_category
        enum fund_sub_category
        enum fund_risk
        decimal fund_return_rate
        string isin
        decimal nav
        decimal expense_ratio
        decimal assets_under_management
        decimal minimum_investment
        date launch_date
        boolean sip_allowed
        boolean lump_sum_allowed
        timestamptz created_at
        timestamptz updated_at
    }

    investment_plans {
        uuid id PK
        uuid user_id FK
        enum risk_profile "conservative | moderate | aggressive"
        enum goal_type
        enum horizon
        decimal monthly_amount
        jsonb allocations
        string status "active | deleted"
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 6. Global Application Mechanics

During bootstrap ([src/main.ts](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/main.ts)), the application enforces standard global rules:

1. **Global Route Prefix**: All API routes are prefixed with `/api/v1`.
2. **Global Validation Pipe**: `ValidationPipe` is registered with:
   - `whitelist: true` (removes extraneous unmapped payload properties).
   - `forbidNonWhitelisted: true` (throws `400 Bad Request` if unexpected fields are supplied).
   - `transform: true` (automatically transforms incoming JSON to typed DTO class instances).
3. **Response Envelope Interceptor**: `TransformInterceptor` ([src/common/interceptors/transform.interceptor.ts](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/common/interceptors/transform.interceptor.ts)) wraps all HTTP 2xx responses into a unified JSON structure:
   ```json
   {
     "success": true,
     "data": { ... },
     "timestamp": "2026-09-19T16:48:12.000Z"
   }
   ```
4. **Class Serializer**: `ClassSerializerInterceptor` ensures entities exclude fields marked with `@Exclude()` (e.g. `passwordHash`).
5. **Swagger Documentation**: Interactive OpenAPI UI accessible at `/api/docs`.

---

## 7. Authentication & User Management Module

The authentication architecture ([src/modules/auth](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/auth)) implements a zero-trust model handling account onboarding, security verification, and token management.

### 7.1 RSA Password Encryption & Decryption
To protect credentials in transit against MITM inspection, passwords sent from client applications are encrypted using an RSA Public Key (PKCS1 padding, base64 encoded).

- **Backend Decryption**: Implemented in `AuthService.decryptPassword()` using Node.js `crypto.privateDecrypt()` with `process.env.RSA_PRIVATE_KEY`.
- **Validation Rules**: Once decrypted, password must satisfy:
  - Length between 8 and 20 characters.
  - Regex requirement: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$` (at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character).

### 7.2 Registration & Email Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as AuthController
    participant Auth as AuthService
    participant Users as UsersService
    participant Mail as MailService
    participant DB as PostgreSQL

    Client->>API: POST /api/v1/auth/register (RSA encrypted password)
    API->>Auth: register(dto)
    Auth->>Auth: Decrypt RSA password & validate regex
    Auth->>Users: findByEmail(email)
    alt Email exists & is verified
        Users-->>Auth: User (isVerified=true)
        Auth-->>Client: 409 Conflict ("Account already exists")
    else Email exists & unverified
        Auth->>Users: updateUnverifiedUser()
    else New email
        Auth->>Users: createUser()
    end
    Auth->>Auth: Generate 6-digit OTP (crypto.randomInt)
    Auth->>Users: replaceVerificationOtp(userId, bcrypt(otp), expiresAt=15m)
    Users->>DB: Save to otp_verifications
    Auth->>Mail: sendVerificationEmail(email, otp)
    Mail-->>Client: Verification Email Delivered
    Auth-->>Client: 201 Created ({ message: "Verification code sent..." })

    Client->>API: POST /api/v1/auth/verify-email ({ email, otp })
    API->>Auth: verifyEmail(dto)
    Auth->>Users: findActiveVerificationOtp(userId)
    Auth->>Auth: Compare bcrypt(otp, otpHash)
    Auth->>Users: consumeVerificationOtp(otpId) [isUsed=true]
    Auth->>Users: markEmailVerified(userId) [isVerified=true]
    Auth->>Auth: generateAuthResponse(user)
    Auth-->>Client: 200 OK ({ accessToken, refreshToken, user })
```

### 7.3 Login & Dual-Token Rotation System

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as AuthController
    participant Auth as AuthService
    participant Users as UsersService
    participant DB as PostgreSQL

    Client->>API: POST /api/v1/auth/login ({ email, encryptedPassword })
    API->>Auth: login(dto)
    Auth->>Users: findByEmail(email)
    Auth->>Auth: Decrypt RSA password & compare bcrypt(password, passwordHash)
    Auth->>Auth: Verify user.isActive and user.isVerified
    Auth->>Auth: generateTokenPair(user)
    Note over Auth: Generate UUID tokenId.<br/>Access JWT payload: { sub: userId, email, role } (15m)<br/>Refresh JWT payload: { sub: userId, tokenId } (7d)
    Auth->>Users: saveRefreshToken({ userId, bcrypt(rawRefreshToken), expiresAt })
    Users->>DB: Save refresh token record
    Auth-->>Client: 200 OK ({ accessToken, refreshToken, user })

    Note over Client, DB: Token Refresh Flow (Rotation)
    Client->>API: POST /api/v1/auth/refresh (Header: Bearer refreshToken)
    API->>JwtRefreshGuard: Authenticate Refresh Token
    JwtRefreshGuard->>Users: validateRefreshToken(tokenId, rawRefreshToken)
    Users->>DB: Fetch refresh token record
    Users->>Users: Check !isRevoked & !expired & bcrypt match
    JwtRefreshGuard-->>API: req.user = user
    API->>Auth: refresh(user)
    Auth->>Users: revokeAllRefreshTokensForUser(userId) [is_revoked=true]
    Auth->>Auth: generateTokenPair(user) (Issue fresh pair)
    Auth-->>Client: 200 OK ({ accessToken, refreshToken, user })
```

### 7.4 Password Reset Flow
1. `POST /api/v1/auth/forgot-password`: Generates 6-digit OTP (15 min expiration), hashes with bcrypt, saves to `otp_verifications`, and emails user. Always returns a uniform generic message to prevent user enumeration attacks.
2. `POST /api/v1/auth/verify-reset-otp`: Validates OTP and returns a short-lived (10 minutes) JWT `resetToken` with payload `{ sub: userId, purpose: 'password_reset' }`.
3. `POST /api/v1/auth/reset-password`: Verifies the `resetToken` signature and purpose, decrypts the new RSA password, checks strength requirements, updates `password_hash` in `users` table, and revokes all active refresh tokens for security.

### 7.5 Automated Unverified User Cleanup Cron
Implemented in `UsersCleanupService` ([src/modules/users/users-cleanup.service.ts](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/users/users-cleanup.service.ts)):
- **Schedule**: `@Cron(CronExpression.EVERY_DAY_AT_2AM)` (Daily at 02:00 AM).
- **Logic**: Deletes all user accounts from `users` table where `is_verified = false` and `created_at < (now - 24 hours)`.

---

## 8. Funds Catalog & Sync Module

The funds module ([src/modules/funds](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/funds)) manages the catalog of Indian mutual funds and synchronizes NAV (Net Asset Value) daily from the official AMFI text feed.

### 8.1 AMFI Live Feed Ingestion Engine
Handled by `FundsSyncService.syncAmfiNavData()`:
- **Source Endpoint**: `https://www.amfiindia.com/spages/NAVAll.txt`
- **Format**: Semicolon-delimited text (`Scheme Code; ISIN Div; ISIN Reinv; Scheme Name; NAV; Date`).
- **AMC Resolution**: Parses the scheme name against `COMMON_AMCS` (e.g. *SBI, HDFC, ICICI Prudential, Nippon India, Axis, Kotak, DSP, Quant, Parag Parikh, Motilal Oswal*, etc.). Finds or dynamically creates the corresponding `FundHouse` record in `fund_houses`.
- **Batch Processing**: Performs PostgreSQL `upsert` queries in batches of **300 funds** using `schemeCode` as the unique conflict index.

### 8.2 Categorization & Risk Estimation Rules

The service inspects fund names using rule-based pattern matching to classify funds:

#### Sub-Category Classification (`classifyFund`)
- **Index Funds**: Name contains `index`, `nifty`, `sensex`. -> `Main: Equity, Sub: Index Funds`
- **Large Cap**: Name contains `large cap`. -> `Main: Equity, Sub: Large Cap`
- **Mid Cap**: Name contains `mid cap`. -> `Main: Equity, Sub: Mid Cap`
- **Small Cap**: Name contains `small cap`. -> `Main: Equity, Sub: Small Cap`
- **Flexi Cap**: Name contains `flexi cap`. -> `Main: Equity, Sub: Flexi Cap`
- **Multi Cap**: Name contains `multi cap`. -> `Main: Equity, Sub: Multi Cap`
- **ELSS**: Name contains `elss` or `tax saver`. -> `Main: Equity, Sub: ELSS`
- **Sectoral/Thematic**: Name contains `tech`, `pharma`, `healthcare`, `banking`, `infrastructure`, `sectoral`. -> `Main: Equity, Sub: Sectoral/Thematic`
- **Liquid**: Name contains `liquid`. -> `Main: Debt, Sub: Liquid`
- **Ultra Short**: Name contains `ultra short`. -> `Main: Debt, Sub: Ultra Short`
- **Money Market**: Name contains `money market`. -> `Main: Debt, Sub: Money Market`
- **Arbitrage**: Name contains `arbitrage`. -> `Main: Hybrid, Sub: Arbitrage`
- **Dynamic Asset Allocation**: Name contains `balanced advantage`, `dynamic asset`, `baf`. -> `Main: Hybrid, Sub: Dynamic Asset Allocation`

#### Risk Level & Return Rate Estimation
- **Equity**:
  - Small Cap / Sectoral: Risk = `Very High`, Historical Return Rate = `21.4%` (Small Cap) / `18.2%` (Mid Cap) / `15.6%` (Large Cap/Flexi Cap)
  - Others: Risk = `High`
- **Hybrid**: Risk = `Moderately High`, Historical Return Rate = `11.5%`
- **Debt**:
  - Liquid: Risk = `Low`, Historical Return Rate = `7.2%`
  - Others: Risk = `Low to Moderate`, Historical Return Rate = `7.2%`

### 8.3 Daily Automated Cron Synchronization
Implemented in `FundsCronService` ([src/modules/funds/services/funds-cron.service.ts](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/funds/services/funds-cron.service.ts)):
- **Schedule**: `@Cron(CronExpression.EVERY_DAY_AT_11PM)` (Daily at 11:00 PM IST when AMFI publishes updated NAVs).

### 8.4 Funds Query & Filtering API
`FundsQueryService` exposes flexible pagination and filtering:
- `findAll(options)`: Supports `page`, `limit`, `mainCategory`, `subCategory`, `risk`, and case-insensitive search (`search`) matching fund name or scheme code.
- `findEligibleFunds(subCategory, risk, mode)`: Used internally by the Recommendation Engine to query candidate funds filtering by `sipAllowed` and `lumpSumAllowed`.

---

## 9. Planner & Investment Recommendation Engine

The **Planner Module** ([src/modules/planner](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/planner)) is a domain engine designed to build personalized mutual fund portfolios.

### 9.1 Architectural Overview
The engine uses a pipeline pattern managed by `RecommendationService`, delegating work across **9 single-responsibility domain sub-services**:

```mermaid
graph TD
    A[Client Request: CreatePlanDto] --> B[RecommendationService Orchestrator]
    B --> C[1. UserValidationService]
    B --> D[2. RiskAssessmentService]
    B --> E[3. GoalAnalysisService]
    B --> F[4. AssetAllocationService]
    B --> G[5. FundEligibilityService]
    B --> H[6. FundScoringService]
    B --> I[7. PortfolioConstructionService]
    B --> J[8. InvestmentCalculatorService]
    B --> K[9. PlanExplanationService]
    B --> L[(PostgreSQL: investment_plans)]
```

### 9.2 10-Stage Recommendation Pipeline Breakdown

#### Stage 1: Validation (`UserValidationService`)
Enforces basic financial logic:
- `monthlyInvestment <= monthlyIncome`
- `monthlyInvestment >= ₹500`
- `age >= 18`

#### Stage 2: Risk Profiling (`RiskAssessmentService`)
Computes two independent composite scores:
1. **Capacity Score** (Max 65 pts):
   - **Age**: 18–30 (15 pts), 31–40 (12 pts), 41–50 (8 pts), 51–60 (4 pts), 60+ (0 pts).
   - **Horizon**: >10 yrs (30 pts), 5–10 yrs (20 pts), 3–5 yrs (10 pts), <3 yrs (0 pts).
   - **Emergency Fund**: >6 months (10 pts), 3–6 months (5 pts), No fund (0 pts).
   - **Investment Ratio** (`monthlyInvestment / monthlyIncome`): <20% (10 pts), 20–40% (5 pts), >40% (0 pts).
2. **Tolerance Score** (Max 40 pts):
   - **Market Fall Reaction**: `buy_more` (30 pts), `wait` (15 pts), `sell` (0 pts).
   - **Experience**: >2 yrs (10 pts), <2 yrs (5 pts), None (2 pts).

**Decision Matrix**:
- High Capacity (>30) & High Tolerance (>20) -> **AGGRESSIVE**
- High Capacity (>30) & Low Tolerance (<=20) -> **MODERATE**
- Low Capacity (<=30) & High Tolerance (>20) -> **MODERATE**
- Low Capacity (<=30) & Low Tolerance (<=20) -> **CONSERVATIVE**

#### Stage 3: Goal Strategy Analysis (`GoalAnalysisService`)
Derives primary objectives based on `InvestmentGoal`:
- `tax_saving`: Focus on Section 80C ELSS Funds.
- `emergency_fund`: Focus on Liquid and Ultra-Short Debt Funds.
- `wealth_creation`: Long-Term Capital Appreciation via Equity Growth.
- `retirement`: Aggressive Growth transitioning to Stability.
- `house_purchase`: Balanced Growth with Lower Volatility (Hybrid / BAF).
- `child_education`: Inflation-beating Equity with Debt allocation.

#### Stage 4: Asset Allocation Schema (`AssetAllocationService`)
1. **Goal Overrides**:
   - `tax_saving` -> 100% ELSS (`VERY_HIGH` target risk).
   - `emergency_fund` -> 100% Liquid Debt (`LOW_TO_MODERATE` target risk).
2. **Base Split by Risk Profile**:
   - **AGGRESSIVE**: 80% Equity / 20% Debt
   - **MODERATE**: 60% Equity / 40% Debt
   - **CONSERVATIVE**: 30% Equity / 70% Debt
3. **Sub-Category Breakdown by Horizon**:
   - **< 3 Years**: 100% Large Cap Equity.
   - **3–5 Years**: 70% Large Cap / 30% Mid Cap Equity.
   - **5+ Years**: 50% Large Cap / 30% Mid Cap / 20% Small Cap Equity.
4. Ensures allocation percentages sum to exactly `1.0` (100%).

#### Stage 5: Fund Eligibility Filtering (`FundEligibilityService`)
Queries candidate funds from DB matching sub-category, target risk, and investment mode (`sip`, `lump_sum`, or `both`).

#### Stage 6: Fund Scoring & Ranking (`FundScoringService`)
Ranks candidate funds per category descending by `fundReturnRate`.

#### Stage 7: Portfolio Construction (`PortfolioConstructionService`)
Selects the single top-ranked unique fund for each category schema, guaranteeing **zero fund duplication** across categories.

#### Stage 8: Financial Projections (`InvestmentCalculatorService`)
- Maps monthly SIP amounts per fund: `monthlyAmount = round(monthlyInvestment * allocationPercentage)`.
- Maps horizon enum to projection years: `<3y` -> 2 yrs, `3-5y` -> 4 yrs, `5-10y` -> 7 yrs, `>10y` -> 15 yrs.
- Computes blended portfolio expected return rate (Assumptions: Equity ~ 12%, Debt ~ 7%, Hybrid ~ 10%).

#### Stage 9: Explanation Generation (`PlanExplanationService`)
Generates contextualized human-readable bullet points explaining why specific asset classes, risk profiles, and sub-categories were selected.

#### Stage 10: Plan Persistence (`RecommendationService`)
Saves the complete plan object with JSONB allocation breakdown into `investment_plans` table linked to `userId`.

---

### 9.3 SIP Future Value Calculation Formula

Future value projections use the standard formula for the **Future Value of an Ordinary Annuity (SIP)**:

$$FV = P \times \left[ \frac{(1 + r)^n - 1}{r} \right] \times (1 + r)$$

Where:
- $P$ = Monthly Investment Amount (`monthlyInvestment`)
- $r$ = Monthly Return Rate ($\frac{\text{Blended Annual Rate}}{12}$)
- $n$ = Total Number of Months ($\text{Horizon Years} \times 12$)

---

### 9.4 Plan Management & User Statistics API
`PlannerStatsService` powers the user portfolio dashboard:
- `getDashboardStats(userId)`: Returns total active plans count, total monthly investment sum across active plans, and risk profile allocation breakdown (`{ name: 'aggressive', value: 2 }`).
- `getUserPlans(userId)`: Returns all active investment plans ordered by `created_at DESC`.
- `deletePlan(userId, planId)`: Soft-deletes plan by setting `status = 'deleted'`.

---

## 10. Transactional Email Service

The Mail module ([src/modules/mail](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/mail)) integrates `@nestjs-modules/mailer` with Gmail SMTP.

- `sendVerificationEmail(email, otp, expiresInMinutes)`: Sends 6-digit email verification code.
- `sendPasswordResetEmail(email, otp, expiresInMinutes)`: Sends 6-digit password reset code.

---

## 11. Complete API Endpoints Catalog

All endpoints require content type `application/json` and return unified `{ success, data, timestamp }` envelopes.

| Category | Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/v1` | No | Health check |
| **Auth** | `POST` | `/api/v1/auth/register` | No | Register new user & dispatch verification OTP |
| **Auth** | `POST` | `/api/v1/auth/verify-email` | No | Verify email OTP & receive initial JWT tokens |
| **Auth** | `POST` | `/api/v1/auth/resend-verification-otp` | No | Resend 6-digit verification OTP |
| **Auth** | `POST` | `/api/v1/auth/login` | No | Authenticate user with RSA encrypted password |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Bearer Refresh | Rotate access/refresh token pair |
| **Auth** | `POST` | `/api/v1/auth/logout` | Bearer Refresh | Revoke active refresh tokens |
| **Auth** | `POST` | `/api/v1/auth/forgot-password` | No | Dispatch password reset OTP |
| **Auth** | `POST` | `/api/v1/auth/verify-reset-otp` | No | Verify reset OTP & receive short-lived `resetToken` |
| **Auth** | `POST` | `/api/v1/auth/reset-password` | No | Reset password using `resetToken` |
| **Funds** | `GET` | `/api/v1/funds` | Bearer Access | Paginated list of funds with search & filters |
| **Funds** | `GET` | `/api/v1/funds/:id` | Bearer Access | Fetch single fund details by UUID |
| **Funds** | `GET` | `/api/v1/funds/scheme/:schemeCode` | Bearer Access | Fetch fund by AMFI scheme code |
| **Funds** | `POST` | `/api/v1/funds/sync` | No (Admin/Dev) | Manually trigger AMFI NAV live sync |
| **Planner** | `POST` | `/api/v1/planner/generate` | Bearer Access | Generate personalized investment plan |
| **Planner** | `GET` | `/api/v1/planner/plans` | Bearer Access | Fetch all active plans for logged-in user |
| **Planner** | `DELETE`| `/api/v1/planner/plans/:id` | Bearer Access | Soft delete an investment plan |
| **Planner** | `GET` | `/api/v1/planner/stats` | Bearer Access | Get portfolio dashboard stats & risk distribution |

---

## 12. Developer Guide & Extension Points

### Common Tasks & Guidance for Future AI Agents

1. **Adding New Mutual Fund Sub-Categories**:
   - Update `FundSubCategory` enum in [src/modules/funds/funds.enums.ts](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/funds/funds.enums.ts).
   - Update `FundsSyncService.classifyFund()` keyword matching.
   - Update `AssetAllocationService` if the new category should participate in automated asset allocation.

2. **Modifying Risk Scoring Weights**:
   - Adjust point values in `RiskAssessmentService.assess()` ([src/modules/planner/services/risk-assessment.service.ts](file:///c:/Users/mejum/Documents/Go%20funds/backend_go_funds/src/modules/planner/services/risk-assessment.service.ts)).
   - Ensure decision boundaries (`isHighCapacity` > 30, `isHighTolerance` > 20) are updated consistently.

3. **Running Database Migrations**:
   - Generate migration: `npm run migration:generate -- src/migrations/YourMigrationName`
   - Apply migration: `npm run migration:run`
   - Revert migration: `npm run migration:revert`

4. **Testing Contracts**:
   - Unit test suites exist in `spec.ts` files alongside services (`auth.service.spec.ts`, `planner.spec.ts`, `funds.spec.ts`, `users.service.spec.ts`).
   - Run tests before committing: `npm run test`.
