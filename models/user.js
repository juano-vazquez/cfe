const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    firstLastName: {
        type: String,
        required: true
    },
    secondLastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    privilege: {
        type: String,
        enum: ['admin', 'employee'],
        required: true
    }
});

userSchema.pre("save", async function(done){
    if(this.isModified("password") || this.isNew){
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(this.password, saltRounds);
        this.set("password", hashedPassword);
    }
    done();
});

module.exports = mongoose.model('User', userSchema);
