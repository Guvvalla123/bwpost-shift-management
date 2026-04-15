const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const crypto = require("crypto");
const fs = require("fs");
const { google } = require("googleapis");

// ── Configuration ──────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const ENCRYPTION_PASSWORD =
  process.env.BACKUP_ENCRYPTION_PASSWORD;
const DRIVE_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID;
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "../google-service-account.json");
const RETENTION_DAYS =
  parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
const TEMP_DIR = path.join(__dirname, "../backup-temp");
const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// ── Validate environment ────────────────────
function validateEnv() {
  const required = [
    "MONGO_URI",
    "BACKUP_ENCRYPTION_PASSWORD",
    "GOOGLE_DRIVE_FOLDER_ID",
  ];
  const missing = required.filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}`
    );
  }
}

// ── Google Drive auth ───────────────────────
function getDriveClient() {
  let credentials;

  // Try environment variable first
  // (GitHub Actions stores JSON as string)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      credentials = JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      );
    } catch (e) {
      throw new Error(
        "Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON"
      );
    }
  } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    // Fall back to local file
    credentials = JSON.parse(
      fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8")
    );
  } else {
    throw new Error(
      "No Google service account credentials found. " +
      "Set GOOGLE_SERVICE_ACCOUNT_KEY env var or " +
      "provide google-service-account.json file."
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

// ── Encrypt data ────────────────────────────
function encryptData(data, password) {
  // Derive a 32-byte key from password using SHA-256
  const key = crypto
    .createHash("sha256")
    .update(password)
    .digest();

  // Generate random 16-byte IV for each encryption
  // IV = Initialization Vector (makes each encryption unique)
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher with AES-256-CBC algorithm
  const cipher = crypto.createCipheriv(
    ALGORITHM, key, iv
  );

  // Encrypt the data
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(data, "utf8")),
    cipher.final(),
  ]);

  // Prepend IV to encrypted data
  // (IV is needed for decryption — not a secret)
  return Buffer.concat([iv, encrypted]);
}

// ── Decrypt data ────────────────────────────
function decryptData(encryptedBuffer, password) {
  // Derive same key from password
  const key = crypto
    .createHash("sha256")
    .update(password)
    .digest();

  // Extract IV from first 16 bytes
  const iv = encryptedBuffer.slice(0, IV_LENGTH);

  // Extract encrypted data (everything after IV)
  const encryptedData = encryptedBuffer.slice(IV_LENGTH);

  // Create decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM, key, iv
  );

  // Decrypt and return
  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]).toString("utf8");
}

// ── Export MongoDB collections ──────────────
async function exportCollections(db) {
  const collections = [
    "users",
    "shifts",
    "attendances",
    "shiftrequests",
    "invites",
    "auditlogs",
  ];

  const backup = {
    timestamp: new Date().toISOString(),
    version: "1.0",
    collections: {},
    counts: {},
  };

  console.log("Exporting collections...");

  for (const name of collections) {
    try {
      const docs = await db
        .collection(name)
        .find({})
        .toArray();
      backup.collections[name] = docs;
      backup.counts[name] = docs.length;
      console.log(
        `  ${name}: ${docs.length} records`
      );
    } catch (err) {
      console.warn(
        `  Warning: Could not export ${name}: ${err.message}`
      );
      backup.collections[name] = [];
      backup.counts[name] = 0;
    }
  }

  return backup;
}

// ── Upload to Google Drive ──────────────────
async function uploadToDrive(drive, filePath, fileName) {
  const fileMetadata = {
    name: fileName,
    parents: [DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: "application/octet-stream",
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, size",
  });

  return response.data;
}

// ── Download from Google Drive ──────────────
async function downloadFromDrive(
  drive, fileId, destPath
) {
  const dest = fs.createWriteStream(destPath);

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return new Promise((resolve, reject) => {
    response.data
      .on("error", reject)
      .pipe(dest)
      .on("error", reject)
      .on("finish", resolve);
  });
}

// ── Delete old backups ──────────────────────
async function deleteOldBackups(drive) {
  const cutoffDate = new Date();
  cutoffDate.setDate(
    cutoffDate.getDate() - RETENTION_DAYS
  );

  // List all backup files in folder
  const response = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and name contains 'backup-' and trashed = false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime",
  });

  const files = response.data.files || [];
  let deletedCount = 0;

  for (const file of files) {
    const fileDate = new Date(file.createdTime);
    if (fileDate < cutoffDate) {
      await drive.files.delete({ fileId: file.id });
      console.log(`  Deleted old backup: ${file.name}`);
      deletedCount++;
    }
  }

  return deletedCount;
}

// ── Main backup function ────────────────────
async function runBackup() {
  console.log("══════════════════════════════════");
  console.log("BWPost Database Backup");
  console.log(new Date().toISOString());
  console.log("══════════════════════════════════");

  // Validate environment variables
  validateEnv();

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];
  const backupFileName = `backup-${today}.enc`;
  const tempEncPath = path.join(
    TEMP_DIR, backupFileName
  );
  const tempVerifyPath = path.join(
    TEMP_DIR, `verify-${today}.json`
  );

  let drive;
  let uploadedFileId;

  try {
    // Step 1: Connect to MongoDB
    console.log("\n1. Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    console.log("   Connected");

    // Step 2: Export collections
    console.log("\n2. Exporting collections...");
    const backup = await exportCollections(db);
    const originalCounts = { ...backup.counts };
    const totalRecords = Object.values(
      backup.counts
    ).reduce((a, b) => a + b, 0);
    console.log(
      `   Total records: ${totalRecords}`
    );

    // Step 3: Encrypt backup
    console.log("\n3. Encrypting backup...");
    const jsonString = JSON.stringify(backup);
    const encrypted = encryptData(
      jsonString, ENCRYPTION_PASSWORD
    );
    fs.writeFileSync(tempEncPath, encrypted);
    const fileSizeKB = Math.round(
      fs.statSync(tempEncPath).size / 1024
    );
    console.log(
      `   Encrypted file: ${fileSizeKB}KB`
    );

    // Step 4: Upload to Google Drive
    console.log("\n4. Uploading to Google Drive...");
    drive = getDriveClient();
    const uploadedFile = await uploadToDrive(
      drive, tempEncPath, backupFileName
    );
    uploadedFileId = uploadedFile.id;
    console.log(
      `   Uploaded: ${backupFileName}`
    );
    console.log(
      `   File ID: ${uploadedFileId}`
    );

    // Step 5: Verify backup
    console.log("\n5. Verifying backup...");
    await downloadFromDrive(
      drive, uploadedFileId, tempVerifyPath
    );
    const downloadedBuffer = fs.readFileSync(
      tempVerifyPath
    );
    const decrypted = decryptData(
      downloadedBuffer, ENCRYPTION_PASSWORD
    );
    const verified = JSON.parse(decrypted);

    // Compare counts
    let verificationPassed = true;
    for (const [name, count] of Object.entries(
      originalCounts
    )) {
      const verifiedCount =
        verified.collections[name]?.length || 0;
      if (verifiedCount !== count) {
        console.error(
          `   FAILED ${name}: expected ${count},` +
          ` got ${verifiedCount}`
        );
        verificationPassed = false;
      }
    }

    if (verificationPassed) {
      console.log("   Verification PASSED");
    } else {
      throw new Error("Backup verification FAILED");
    }

    // Step 6: Delete old backups
    console.log("\n6. Cleaning old backups...");
    const deletedCount = await deleteOldBackups(drive);
    console.log(
      `   Deleted ${deletedCount} old backup(s)`
    );

    // Step 7: Print summary
    console.log(
      "\n══════════════════════════════════"
    );
    console.log("BACKUP COMPLETE");
    console.log(
      "══════════════════════════════════"
    );
    console.log(`Date:       ${today}`);
    console.log(`File:       ${backupFileName}`);
    console.log(`Size:       ${fileSizeKB}KB`);
    console.log(
      `Records:    ${totalRecords} total`
    );
    Object.entries(originalCounts).forEach(
      ([name, count]) => {
        console.log(
          `  ${name.padEnd(16)}: ${count}`
        );
      }
    );
    console.log(`Verified:   YES`);
    console.log(
      `Old deleted: ${deletedCount}`
    );
    console.log(
      "══════════════════════════════════"
    );

  } finally {
    // Always clean up temp files
    console.log("\nCleaning up temp files...");
    [tempEncPath, tempVerifyPath].forEach(
      (filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(
            `  Deleted: ${path.basename(filePath)}`
          );
        }
      }
    );

    // Close MongoDB connection
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

// ── Run ─────────────────────────────────────
runBackup()
  .then(() => {
    console.log("\nBackup finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nBACKUP FAILED:", err.message);
    console.error(err.stack);
    process.exit(1);
  });