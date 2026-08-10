-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('MARKET', 'COMPANY');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('INDIVIDUAL', 'CONSOLIDATED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('STANDARD', 'BULK');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('MARKET', 'COMPANY');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('OWN_FLEET', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'DELIVERED', 'POD_RECEIVED', 'BILLED', 'SUBMITTED', 'PAYMENT_PENDING', 'PAID', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('FUEL', 'DRIVER_BATTA', 'FASTAG', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('POD');

-- CreateEnum
CREATE TYPE "VehicleDocumentType" AS ENUM ('RC', 'INSURANCE', 'FITNESS', 'PERMIT', 'PUC');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('GENERATED', 'SUBMITTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubmissionReason" AS ENUM ('INITIAL', 'REISSUE');

-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('UI', 'API', 'SYSTEM', 'MIGRATION');

-- CreateEnum
CREATE TYPE "SequenceKey" AS ENUM ('TRIP', 'BILL', 'SUBMISSION', 'PAYMENT');

-- CreateTable
CREATE TABLE "financial_years" (
    "id" UUID NOT NULL,
    "display_name" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" UUID NOT NULL,
    "financial_year_id" UUID NOT NULL,
    "sequence_key" "SequenceKey" NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "last_number" INTEGER NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "mobile" VARCHAR(20),
    "username" VARCHAR(80) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "setting_key" VARCHAR(120) NOT NULL,
    "setting_value" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" UUID NOT NULL,
    "party_name" VARCHAR(200) NOT NULL,
    "party_type" "PartyType" NOT NULL,
    "gst_number" VARCHAR(20),
    "contact_person" VARCHAR(120),
    "mobile" VARCHAR(20),
    "email" VARCHAR(120),
    "address" TEXT,
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "billing_type" "BillingType",
    "payment_type" "PaymentType",
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_directory" (
    "id" UUID NOT NULL,
    "vehicle_number" VARCHAR(30) NOT NULL,
    "owner_name" VARCHAR(150) NOT NULL,
    "owner_mobile" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "vehicle_directory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "own_vehicles" (
    "id" UUID NOT NULL,
    "vehicle_number" VARCHAR(30) NOT NULL,
    "vehicle_type" VARCHAR(80),
    "brand" VARCHAR(80),
    "model" VARCHAR(80),
    "manufacturing_year" INTEGER,
    "chassis_number" VARCHAR(100),
    "engine_number" VARCHAR(100),
    "registration_date" DATE,
    "purchase_date" DATE,
    "status" "VehicleStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "own_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" UUID NOT NULL,
    "own_vehicle_id" UUID NOT NULL,
    "document_type" "VehicleDocumentType" NOT NULL,
    "document_number" VARCHAR(120),
    "issue_date" DATE,
    "expiry_date" DATE,
    "remarks" TEXT,
    "imagekit_file_id" VARCHAR(255) NOT NULL,
    "imagekit_url" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size" BIGINT,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "trip_number" VARCHAR(30) NOT NULL,
    "financial_year_id" UUID NOT NULL,
    "customer_type" "CustomerType" NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "status" "TripStatus" NOT NULL,
    "loading_date" DATE NOT NULL,
    "unloading_date" DATE,
    "pod_received_date" DATE,
    "bill_generated_date" DATE,
    "submission_date" DATE,
    "payment_completed_date" DATE,
    "party_id" UUID NOT NULL,
    "party_name_snapshot" VARCHAR(200) NOT NULL,
    "gst_number_snapshot" VARCHAR(20),
    "from_city" VARCHAR(120) NOT NULL,
    "to_city" VARCHAR(120) NOT NULL,
    "vehicle_number" VARCHAR(30) NOT NULL,
    "driver_mobile" VARCHAR(20) NOT NULL,
    "vehicle_owner_name_snapshot" VARCHAR(150),
    "vehicle_owner_mobile_snapshot" VARCHAR(20),
    "weight" DECIMAL(10,2),
    "freight_rate" DECIMAL(12,2) NOT NULL,
    "vehicle_rate" DECIMAL(12,2),
    "lr_number" VARCHAR(80),
    "customer_advance" DECIMAL(12,2) NOT NULL,
    "customer_balance" DECIMAL(12,2) NOT NULL,
    "owner_advance" DECIMAL(12,2),
    "owner_balance" DECIMAL(12,2),
    "detention" DECIMAL(12,2),
    "deduction" DECIMAL(12,2),
    "revenue" DECIMAL(12,2) NOT NULL,
    "expense" DECIMAL(12,2) NOT NULL,
    "profit" DECIMAL(12,2) NOT NULL,
    "bill_id" UUID,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "remarks" TEXT,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_expenses" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "expense_type" "ExpenseType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "remarks" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_documents" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "remarks" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_document_files" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "imagekit_file_id" VARCHAR(255) NOT NULL,
    "imagekit_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "mime_type" VARCHAR(100),
    "file_size" BIGINT,
    "display_order" INTEGER NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_document_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL,
    "bill_number" VARCHAR(10) NOT NULL,
    "financial_year_id" UUID NOT NULL,
    "party_id" UUID NOT NULL,
    "bill_type" "BillingType" NOT NULL,
    "bill_date" DATE NOT NULL,
    "digital_signature" BOOLEAN NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" "BillStatus" NOT NULL,
    "party_name_snapshot" VARCHAR(200) NOT NULL,
    "gst_number_snapshot" VARCHAR(20),
    "billing_address_snapshot" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_trips" (
    "id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "linked_by" UUID NOT NULL,
    "linked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "submission_number" VARCHAR(30) NOT NULL,
    "financial_year_id" UUID NOT NULL,
    "party_id" UUID NOT NULL,
    "submission_date" DATE NOT NULL,
    "remarks" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_bills" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,
    "submission_reason" "SubmissionReason" NOT NULL,
    "linked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "payment_number" VARCHAR(30) NOT NULL,
    "party_id" UUID NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "reference_number" VARCHAR(100) NOT NULL,
    "remarks" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "bill_id" UUID,
    "financial_year_id" UUID NOT NULL,
    "allocation_month" DATE,
    "allocated_amount" DECIMAL(12,2) NOT NULL,
    "allocation_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "source" "ActivitySource" NOT NULL,
    "module" VARCHAR(80) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "action" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "request_path" VARCHAR(255) NOT NULL,
    "response_body" JSONB,
    "response_status" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_financial_year_id_sequence_key_key" ON "number_sequences"("financial_year_id", "sequence_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_mobile_idx" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "settings_setting_key_key" ON "settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "parties_gst_number_key" ON "parties"("gst_number");

-- CreateIndex
CREATE INDEX "parties_party_name_idx" ON "parties"("party_name");

-- CreateIndex
CREATE INDEX "parties_mobile_idx" ON "parties"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_directory_vehicle_number_key" ON "vehicle_directory"("vehicle_number");

-- CreateIndex
CREATE INDEX "vehicle_directory_owner_mobile_idx" ON "vehicle_directory"("owner_mobile");

-- CreateIndex
CREATE INDEX "vehicle_directory_owner_name_idx" ON "vehicle_directory"("owner_name");

-- CreateIndex
CREATE UNIQUE INDEX "own_vehicles_vehicle_number_key" ON "own_vehicles"("vehicle_number");

-- CreateIndex
CREATE INDEX "own_vehicles_status_idx" ON "own_vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicle_documents_own_vehicle_id_idx" ON "vehicle_documents"("own_vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_documents_document_type_idx" ON "vehicle_documents"("document_type");

-- CreateIndex
CREATE INDEX "vehicle_documents_expiry_date_idx" ON "vehicle_documents"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "trips_trip_number_key" ON "trips"("trip_number");

-- CreateIndex
CREATE INDEX "trips_financial_year_id_idx" ON "trips"("financial_year_id");

-- CreateIndex
CREATE INDEX "trips_party_id_idx" ON "trips"("party_id");

-- CreateIndex
CREATE INDEX "trips_created_by_idx" ON "trips"("created_by");

-- CreateIndex
CREATE INDEX "trips_updated_by_idx" ON "trips"("updated_by");

-- CreateIndex
CREATE INDEX "trips_loading_date_idx" ON "trips"("loading_date");

-- CreateIndex
CREATE INDEX "trips_unloading_date_idx" ON "trips"("unloading_date");

-- CreateIndex
CREATE INDEX "trips_pod_received_date_idx" ON "trips"("pod_received_date");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE INDEX "trips_customer_type_idx" ON "trips"("customer_type");

-- CreateIndex
CREATE INDEX "trips_vehicle_type_idx" ON "trips"("vehicle_type");

-- CreateIndex
CREATE INDEX "trips_vehicle_number_idx" ON "trips"("vehicle_number");

-- CreateIndex
CREATE INDEX "trips_driver_mobile_idx" ON "trips"("driver_mobile");

-- CreateIndex
CREATE INDEX "trips_lr_number_idx" ON "trips"("lr_number");

-- CreateIndex
CREATE INDEX "trips_from_city_idx" ON "trips"("from_city");

-- CreateIndex
CREATE INDEX "trips_to_city_idx" ON "trips"("to_city");

-- CreateIndex
CREATE INDEX "trip_expenses_trip_id_idx" ON "trip_expenses"("trip_id");

-- CreateIndex
CREATE INDEX "trip_expenses_expense_type_idx" ON "trip_expenses"("expense_type");

-- CreateIndex
CREATE INDEX "trip_expenses_expense_date_idx" ON "trip_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "trip_documents_trip_id_idx" ON "trip_documents"("trip_id");

-- CreateIndex
CREATE INDEX "trip_documents_document_type_idx" ON "trip_documents"("document_type");

-- CreateIndex
CREATE INDEX "trip_document_files_document_id_idx" ON "trip_document_files"("document_id");

-- CreateIndex
CREATE INDEX "trip_document_files_display_order_idx" ON "trip_document_files"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "bills_financial_year_id_bill_number_key" ON "bills"("financial_year_id", "bill_number");

-- CreateIndex
CREATE INDEX "bill_trips_bill_id_idx" ON "bill_trips"("bill_id");

-- CreateIndex
CREATE INDEX "bill_trips_trip_id_idx" ON "bill_trips"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "bill_trips_bill_id_trip_id_key" ON "bill_trips"("bill_id", "trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_submission_number_key" ON "submissions"("submission_number");

-- CreateIndex
CREATE INDEX "submissions_party_id_idx" ON "submissions"("party_id");

-- CreateIndex
CREATE INDEX "submissions_submission_date_idx" ON "submissions"("submission_date");

-- CreateIndex
CREATE INDEX "submission_bills_submission_id_idx" ON "submission_bills"("submission_id");

-- CreateIndex
CREATE INDEX "submission_bills_bill_id_idx" ON "submission_bills"("bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "payments_reference_number_idx" ON "payments"("reference_number");

-- CreateIndex
CREATE INDEX "payments_party_id_idx" ON "payments"("party_id");

-- CreateIndex
CREATE INDEX "payment_allocations_payment_id_idx" ON "payment_allocations"("payment_id");

-- CreateIndex
CREATE INDEX "payment_allocations_bill_id_idx" ON "payment_allocations"("bill_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_module_idx" ON "activity_logs"("module");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_idx" ON "activity_logs"("entity_type");

-- CreateIndex
CREATE INDEX "activity_logs_entity_id_idx" ON "activity_logs"("entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- AddForeignKey
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_financial_year_id_fkey" FOREIGN KEY ("financial_year_id") REFERENCES "financial_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_own_vehicle_id_fkey" FOREIGN KEY ("own_vehicle_id") REFERENCES "own_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_financial_year_id_fkey" FOREIGN KEY ("financial_year_id") REFERENCES "financial_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_documents" ADD CONSTRAINT "trip_documents_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_documents" ADD CONSTRAINT "trip_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_document_files" ADD CONSTRAINT "trip_document_files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "trip_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_document_files" ADD CONSTRAINT "trip_document_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_financial_year_id_fkey" FOREIGN KEY ("financial_year_id") REFERENCES "financial_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_trips" ADD CONSTRAINT "bill_trips_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_trips" ADD CONSTRAINT "bill_trips_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_trips" ADD CONSTRAINT "bill_trips_linked_by_fkey" FOREIGN KEY ("linked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_financial_year_id_fkey" FOREIGN KEY ("financial_year_id") REFERENCES "financial_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_bills" ADD CONSTRAINT "submission_bills_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_bills" ADD CONSTRAINT "submission_bills_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_financial_year_id_fkey" FOREIGN KEY ("financial_year_id") REFERENCES "financial_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

