import { getSignedUrlForKey } from "../../../Utils/s4UploadsNew.js";

// --- DOWNLOAD CONTROLLER ---
export const downloadProof = async (req, res) => {
    try {
        const { key } = req.query; // Expecting ?key=images/xyz.jpg

        if (!key) {
            return res.status(400).json({ message: "File key is required" });
        }

        // Generate a secure, temporary link
        const downloadUrl = getSignedUrlForKey(key);

        res.status(200).json({
            url: downloadUrl,
            message: "Link expires in 15 minutes"
        });


        // Returns JSON like Vertical Living
        res.json({ url: downloadUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating download link" });
    }
};