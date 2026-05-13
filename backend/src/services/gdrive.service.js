import { google } from "googleapis";
import { Readable } from "stream";

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GDRIVE_CLIENT_ID,
    process.env.GDRIVE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

// Authenticate using the refresh token
oauth2Client.setCredentials({
    refresh_token: process.env.GDRIVE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth: oauth2Client });

/**
 * Uploads a file buffer to Google Drive
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @returns {Object} Google Drive file metadata
 */
const uploadToGDrive = async (fileBuffer, fileName, mimeType) => {
    const fileMetadata = {
        name: fileName,
        parents: [process.env.GDRIVE_FOLDER_ID],
    };

    const media = {
        mimeType,
        body: Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id, name, mimeType, webViewLink, webContentLink, size",
    });

    // Make the file readable by anyone with the link
    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    // Re-fetch to get the updated webViewLink
    const file = await drive.files.get({
        fileId: response.data.id,
        fields: "id, name, mimeType, webViewLink, webContentLink, size",
    });

    return {
        fileId: file.data.id,
        fileName: file.data.name,
        mimeType: file.data.mimeType,
        webViewLink: file.data.webViewLink,
        webContentLink: file.data.webContentLink,
        size: file.data.size,
    };
};

/**
 * Deletes a file from Google Drive
 * @param {string} fileId - The Google Drive file ID to delete
 */
const deleteFromGDrive = async (fileId) => {
    try {
        await drive.files.delete({
            fileId,
        });
        return true;
    } catch (error) {
        console.error("Error deleting from GDrive:", error);
        // If file already deleted or not found, we still return true as the goal is achieved
        if (error.code === 404) return true;
        throw error;
    }
};

export { uploadToGDrive, deleteFromGDrive };
