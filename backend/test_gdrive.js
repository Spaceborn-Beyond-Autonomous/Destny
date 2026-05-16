import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing Google Drive Credentials...");
console.log("Client ID:", process.env.GDRIVE_CLIENT_ID);

const oauth2Client = new google.auth.OAuth2(
    process.env.GDRIVE_CLIENT_ID,
    process.env.GDRIVE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: process.env.GDRIVE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth: oauth2Client });

async function testConnection() {
    try {
        const response = await drive.about.get({
            fields: "user",
        });
        console.log("Connection Successful!");
        console.log("User:", response.data.user.displayName);
    } catch (error) {
        console.error("Connection Failed!");
        if (error.response && error.response.data) {
            console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testConnection();
