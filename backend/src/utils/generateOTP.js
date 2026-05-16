import bcrypt from "bcrypt";

export const generateOTP = async function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
    const hashedotp = await bcrypt.hash(otp, 10);
    return {hashedotp, OrignalOtp: otp};
}