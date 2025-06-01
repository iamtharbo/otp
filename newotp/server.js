const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/getOTP', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ success: false, message: "Phone number required", id: null });
    }

    try { 
        const response = await axios.post('https://api.shwecity2d.com/shwe/api/generate', { username });
        console.log("Generate Response:", response.data);
        
        if (!response.data?.id) {
            throw new Error("Missing ID in response");
        }

        return res.json({
            success: true,
            message: "OTP sent successfully",
            id: response.data.id 
        });

    } catch (error) {
        if (error.response?.status === 409 && error.response?.data?.code === "T4001") {
            try {
                const forgotResponse = await axios.post('https://api.shwecity2d.com/shwe/api/forget-password-otp', { username });
                console.log("Forget Password Response:", forgotResponse.data);

                if (!forgotResponse.data?.id) {
                    throw new Error("Missing ID in forget password response");
                }

                return res.json({
                    success: true,
                    message: "OTP sent successfully",
                    id: forgotResponse.data.id  
                });

            } catch (forgotError) {
                console.error("Forgot Password Error:", forgotError.response?.data || forgotError.message);
                return res.status(400).json({
                    success: false,
                    message: "Failed to resend OTP: " + (forgotError.response?.data?.message || forgotError.message),
                    id: null
                });
            }
        }

        console.error("OTP Request Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP: " + (error.response?.data?.message || error.message),
            id: null
        });
    }
});

app.post('/verifyOTP', async (req, res) => {
    const { id, otpCode, phoneNumber } = req.body; 
    
    if (!id || !otpCode) {
        return res.status(400).json({
            success: false,
            message: "ID and OTP code are required"
        });
    }
    try {
        let verificationResponse; 
        try {
            verificationResponse = await axios.post(
                'https://api.shwecity2d.com/shwe/api/validate',
                { id, otpCode }
            );
            return res.json({
                success: true,
                message: "OTP verified successfully",
                data: verificationResponse.data
            });
            
        } catch (validateError) { 
            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number is required"
                });
            }
            
            verificationResponse = await axios.post(
                'https://api.shwecity2d.com/shwe/forget-password/update-password',
                {
                    otpId: id,
                    otpCode: otpCode,
                    password: "123456",
                    phoneNumber: phoneNumber
                }
            );
            
            return res.json({
                success: true,
                message: "OTP verified",
                data: verificationResponse.data
            });
        }

    } catch (error) {
        console.error("OTP Verification Error:", error.response?.data || error.message);
        
        if (error.response?.status === 400) {
            return res.status(400).json({
                success: false,
                message: error.response.data?.message || "Invalid OTP code"
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "OTP verification failed: " + (error.response?.data?.message || error.message)
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
