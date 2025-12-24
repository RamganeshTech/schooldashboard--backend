import mongoose from "mongoose";
const { Schema, model } = mongoose;




// const uploadSchema = new Schema({
//     type: { type: String, enum: ["image", "pdf"] },
//     url: { type: String, },
//     originalName: String,
//     uploadedAt: { type: Date, default: new Date() }
// });


const uploadSchema = new Schema({
    type: { type: String, enum: ["image", "pdf"] },
    key: { type: String, },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
});





const schoolSchema = new Schema(
    {
        name: { type: String, required: true },
        schoolCode: { type: String, }, // e.g., "SCH-001"
        email: { type: String, },
        phoneNo: { type: String },
        address: { type: String },
        currentAcademicYear: { type: String, default: null },

        // Optional: Logo or branding
        logo: {
            type: uploadSchema,
            default: null
        },

        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);


// =========================================================
// PRE-SAVE HOOK: AUTO-GENERATE SCHOOL CODE
// =========================================================
schoolSchema.pre("save", async function (next) {
    // Only generate if this is a NEW document
    // If we are just updating an email or address, skip this logic.
    if (!this.isNew) {
        return next();
    }

    try {
        // 1. Find the most recently created school to determine the sequence
        const lastSchool = await mongoose.model("SchoolModel").findOne({}, {}, { sort: { createdAt: -1 } });

        let nextSequence = 1;

        if (lastSchool && lastSchool.schoolCode) {
            // Split "SCH-001-9988" -> ["SCH", "001", "9988"]
            const parts = lastSchool.schoolCode.split("-");
            if (parts.length >= 2) {
                const lastSequence = parseInt(parts[1], 10);
                if (!isNaN(lastSequence)) {
                    nextSequence = lastSequence + 1;
                }
            }
        }

        // 2. Format the Sequence (001, 002... 999, 1000, 1001)
        // If less than 1000, pad with zeros. If 1000 or more, keep as is.
        const sequenceString = nextSequence < 1000
            ? String(nextSequence).padStart(3, "0")
            : String(nextSequence);

        // 3. Generate Random 4-digit Suffix
        // We use a random number to make it unguessable
        // const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits (1000 to 9999)
        const dateSuffix = Date.now().toString().slice(-4);


        // 4. Construct the Code
        this.schoolCode = `SCH-${sequenceString}-${dateSuffix}`;

        next();
    } catch (error) {
        next(error);
    }
});

const SchoolModel = model("SchoolModel", schoolSchema);
export default SchoolModel;