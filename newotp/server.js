const express = require('express');
const cors = require('cors');         // require cors
const axios = require('axios');
const app = express();
const port = process.env.PORT || 10000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] })); // allow all origins

app.use(express.json());
app.use(express.static('public'));

app.post('/getOTP', async (req, res) => {
    const { name, username } = req.body;
    console.log("Incoming request body:", req.body);
    if (!username) {
        return res.status(400).json({ success: false, message: "Username (phone number) is required" });
    }
    const data = { username };
    try {
        const response = await axios.post('https://api.shwecity2d.com/shwe/api/generate', data);
        console.log("success", response.data);
        return res.json({ success: true, message: response.data.data || "OTP sent" });
    } catch (error) {
        const { response } = error;
        if (response?.status === 409 && response.data?.code === "T4001") {
            console.log("T401");
            try {
                const forgotResponse = await axios.post('https://api.shwecity2d.com/shwe/api/forget-password-otp', data);
                console.log("success", forgotResponse.data);
                return res.json({ success: true, message: forgotResponse.data.data || "success" });
            } catch (forgotError) {
                console.error("Error", forgotError.response?.data || forgotError.message);
                return res.status(400).json({
                    success: false,
                    message: "Error" + (forgotError.response?.data?.message || forgotError.message)
                });
            }
        }
        console.error("Error during OTP request:", error.message, response?.data);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
