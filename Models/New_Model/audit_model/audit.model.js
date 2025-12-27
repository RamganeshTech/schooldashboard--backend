import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SchoolModel",
            required: true,
        },

        // --- WHO ---
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel", // Links to Accountant, Principal, etc.
            // required: true
        },
        userName: { type: String, default: null }, // Snapshot of name in case user is deleted
        role: { type: String, default: null },

        // --- WHAT ---
        action: {
            type: String,
            // enum: ["create", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT"],
            // required: true
        },
        module: {
            type: String,
            // required: true // e.g., "Expense", "Announcement", "Student"
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId, // The ID of the item created/deleted
        },
        description: { type: String }, // e.g., "Deleted Expense EXP-001"

        // --- TECHNICAL DETAILS ---
        ipAddress: { type: String },
        userAgent: { type: String }, // Browser/Device info
        status: { type: String,
            //  enum: ["SUCCESS", "FAILURE"],
              default: "success" },

    },
    { timestamps: true }
);

// Auto-expire logs after 1 year (Optional - saves DB space)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
auditLogSchema.index({schoolId:1});

export const AuditLogModel = mongoose.model("AuditLogModel", auditLogSchema);