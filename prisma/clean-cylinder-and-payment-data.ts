import { PrismaClient } from "@prisma/client";
import { unlink } from "fs/promises";
import { join } from "path";

const prisma = new PrismaClient();

/**
 * Clean up all cylinder entries and payment records:
 * - Delete all CylinderEntry records (both DELIVERED and RECEIVED)
 * - Delete all Invoice records (and their PDF files)
 * - Delete all Payment records
 * - Delete all Bill records
 * - Delete all PaymentLog records related to bills/payments
 */
async function cleanCylinderAndPaymentData() {
  try {
    console.log("🧹 Starting cleanup of cylinder entries and payment records...\n");

    await prisma.$transaction(async (tx) => {
      // Step 1: Count records before deletion
      const [
        cylinderEntryCount,
        invoiceCount,
        paymentCount,
        billCount,
        paymentLogCount,
      ] = await Promise.all([
        tx.cylinderEntry.count(),
        tx.invoice.count(),
        tx.payment.count(),
        tx.bill.count(),
        tx.paymentLog.count(),
      ]);

      console.log("📊 Current data counts:");
      console.log(`   Cylinder Entries: ${cylinderEntryCount}`);
      console.log(`   Invoices: ${invoiceCount}`);
      console.log(`   Payments: ${paymentCount}`);
      console.log(`   Bills: ${billCount}`);
      console.log(`   Payment Logs: ${paymentLogCount}\n`);

      // Step 2: Delete Invoice PDF files from disk
      if (invoiceCount > 0) {
        console.log("📄 Deleting invoice PDF files...");
        const invoices = await tx.invoice.findMany({
          select: { id: true, pdfUrl: true },
        });

        let deletedFiles = 0;
        let failedFiles = 0;

        for (const invoice of invoices) {
          try {
            // Invoice PDFs are stored in public/invoices/ directory
            // pdfUrl format: /invoices/INV-xxxxx.pdf
            if (invoice.pdfUrl) {
              // Extract filename from URL (e.g., "/invoices/INV-123.pdf" -> "INV-123.pdf")
              const fileName = invoice.pdfUrl.replace("/invoices/", "");
              // Files are stored in public/invoices/ directory
              const filePath = join(process.cwd(), "public", "invoices", fileName);
              await unlink(filePath);
              deletedFiles++;
            }
          } catch (fileError: any) {
            // File might not exist, continue silently for ENOENT errors
            if (fileError.code !== "ENOENT") {
              failedFiles++;
              console.log(`   ⚠️  Could not delete file for invoice ${invoice.id}: ${fileError.message}`);
            } else {
              // File already deleted or doesn't exist
              deletedFiles++;
            }
          }
        }

        console.log(`   ✅ Deleted ${deletedFiles} PDF file(s)`);
        if (failedFiles > 0) {
          console.log(`   ⚠️  ${failedFiles} file(s) could not be deleted (may not exist)\n`);
        } else {
          console.log("");
        }
      }

      // Step 3: Delete PaymentLog records (should be deleted before related records)
      if (paymentLogCount > 0) {
        console.log("📝 Deleting payment logs...");
        const deletedLogs = await tx.paymentLog.deleteMany({});
        console.log(`   ✅ Deleted ${deletedLogs.count} payment log record(s)\n`);
      }

      // Step 4: Delete Invoice records (will cascade delete from bills, but we'll delete explicitly)
      if (invoiceCount > 0) {
        console.log("🧾 Deleting invoices...");
        const deletedInvoices = await tx.invoice.deleteMany({});
        console.log(`   ✅ Deleted ${deletedInvoices.count} invoice record(s)\n`);
      }

      // Step 5: Delete Payment records
      if (paymentCount > 0) {
        console.log("💳 Deleting payments...");
        const deletedPayments = await tx.payment.deleteMany({});
        console.log(`   ✅ Deleted ${deletedPayments.count} payment record(s)\n`);
      }

      // Step 6: Delete Bill records
      if (billCount > 0) {
        console.log("📋 Deleting bills...");
        const deletedBills = await tx.bill.deleteMany({});
        console.log(`   ✅ Deleted ${deletedBills.count} bill record(s)\n`);
      }

      // Step 7: Delete CylinderEntry records (both DELIVERED and RECEIVED)
      if (cylinderEntryCount > 0) {
        console.log("🔵 Deleting cylinder entries (DELIVERED and RECEIVED)...");
        const deletedEntries = await tx.cylinderEntry.deleteMany({});
        console.log(`   ✅ Deleted ${deletedEntries.count} cylinder entry record(s)\n`);
      }

      console.log("✅ All cleanup operations completed successfully!\n");
    });

    // Verify deletion
    const [
      remainingCylinderEntries,
      remainingInvoices,
      remainingPayments,
      remainingBills,
      remainingPaymentLogs,
    ] = await Promise.all([
      prisma.cylinderEntry.count(),
      prisma.invoice.count(),
      prisma.payment.count(),
      prisma.bill.count(),
      prisma.paymentLog.count(),
    ]);

    console.log("📊 Remaining data counts after cleanup:");
    console.log("─".repeat(50));
    console.log(`   Cylinder Entries: ${remainingCylinderEntries} (should be 0)`);
    console.log(`   Invoices: ${remainingInvoices} (should be 0)`);
    console.log(`   Payments: ${remainingPayments} (should be 0)`);
    console.log(`   Bills: ${remainingBills} (should be 0)`);
    console.log(`   Payment Logs: ${remainingPaymentLogs} (should be 0)`);
    console.log("─".repeat(50));

    if (
      remainingCylinderEntries === 0 &&
      remainingInvoices === 0 &&
      remainingPayments === 0 &&
      remainingBills === 0
    ) {
      console.log("\n✨ All cylinder entries and payment records have been successfully deleted!");
      console.log("   You can now start entering new data from scratch.");
    } else {
      console.log("\n⚠️  Warning: Some records may still remain. Please check the counts above.");
    }
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanCylinderAndPaymentData()
  .then(() => {
    console.log("\n🎉 Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
