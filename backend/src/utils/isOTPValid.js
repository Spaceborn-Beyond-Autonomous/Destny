import bcrypt from 'bcrypt';

export const isOTPValid = async function(userotp, otp) {
    const isValid = await bcrypt.compare(userotp, otp)
    if(isValid) {
        return true;
    }
    return false
}