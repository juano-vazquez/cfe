const bcrypt = require("bcrypt");

const saltRounds = 10;
const password = "abc";

async function hashPassword(password, saltRounds) {
    return await bcrypt.hash(password, saltRounds);
}

async function main() {
    try {
        const hashedPassword = await hashPassword(password, saltRounds);
        console.log(hashedPassword);
    } catch (error) {
        console.error("Error hashing password:", error);
    }
}

main();
