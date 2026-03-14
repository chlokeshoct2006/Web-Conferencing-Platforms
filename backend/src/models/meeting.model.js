import mongoose, { Schema } from "mongoose";

// ✅ FIXED: Schema had `meeting_code` but controller saved as `meetingCode` and frontend
//           displayed `e.meetingCode` — unified to meetingCode throughout
const meetingSchema = new Schema(
    {
        user_id: { type: String },
        meetingCode: { type: String, required: true },  // ✅ was `meeting_code` in schema only
        date: { type: Date, default: Date.now, required: true }
    }
);

const Meeting = mongoose.model("Meeting", meetingSchema);
export { Meeting };
