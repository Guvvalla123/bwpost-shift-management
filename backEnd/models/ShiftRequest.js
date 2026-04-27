// ShiftRequest.js
// This file defines how a Shift Request
// is stored in the MongoDB database.
//
// An employee can submit two types of requests:
// - leave: asking to be removed from a shift
// - shift_change: asking to swap to a different shift
//
// A manager can approve or reject each request.
// Approved leave removes employee from the shift.
// Approved shift_change moves employee to the new shift.

const mongoose = require("mongoose");

const shiftRequestSchema = new mongoose.Schema(
    {
        // type - what kind of request this is
        // "leave": employee wants to cancel their shift
        // "shift_change": employee wants to swap to a different shift
        type: {
            type: String,
            enum: ["leave", "shift_change"],
            required: true,
        },

        // employee - which employee submitted this request
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // currentShift - the shift the employee currently holds
        // they want to leave this shift or swap away from it
        currentShift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shift",
            required: true,
        },

        // requestedShift - the shift the employee wants to move to
        // only used for shift_change requests, null for leave requests
        requestedShift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shift",
            default: null,
        },

        // reason - the employee's explanation for why they need this change
        reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        // status - the current state of this request
        // "pending": waiting for manager to review
        // "approved": manager approved the request
        // "rejected": manager rejected the request
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        // managerNote - the manager's comment when approving or rejecting
        // optional, can be left empty
        managerNote: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },

        // resolvedAt - the date and time when manager approved or rejected
        // null while the request is still pending
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

/* ── Indexes for query performance at scale ── */
// Speed up getting all requests for a specific employee with a specific status
shiftRequestSchema.index({ employee: 1, status: 1 });

// Speed up getting all requests for a specific shift with a specific status
shiftRequestSchema.index({ currentShift: 1, status: 1 });

// Speed up checking if an employee already has a pending request for a shift
shiftRequestSchema.index({ employee: 1, currentShift: 1, type: 1, status: 1 });

module.exports = mongoose.model("ShiftRequest", shiftRequestSchema);
