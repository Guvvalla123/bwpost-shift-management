const mongoose = require("mongoose");

/**
 * ShiftRequest model — used for both:
 *  • Leave requests   (employee wants to cancel an accepted shift)
 *  • Shift-change requests (employee wants to swap to a different shift)
 */
const shiftRequestSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["leave", "shift_change"],
            required: true,
        },

        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // The shift the employee currently holds
        currentShift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shift",
            required: true,
        },

        // Only required for shift_change requests
        requestedShift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shift",
            default: null,
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        // Manager's note when approving/rejecting
        managerNote: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },

        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ShiftRequest", shiftRequestSchema);
