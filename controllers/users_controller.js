const User = require('../models/user');
const {check} = require("express-validator");
const BadRequestError = require('../config/common/error/bad_request_error');
const NotFoundError = require('../config/common/error/not_found_error');

const companyDomain = 'cfe.mx';

const createUserValidators = [
    check(['firstName', 'firstLastName', 'secondLastName'])
        .notEmpty().withMessage('Se requiere el nombre completo')
        .isLength({ max: 255 }).withMessage('El nombre debe de contener menos de 255 caracteres'),
    check('email')
        .notEmpty().withMessage('Se requiere el email')
        .isEmail().withMessage('Formato de email inválido')
        .custom(async (value, { req }) => {
            const user = await User.findOne({ email: value });
            if (user) {
                throw new NotFoundError('Email no permitido');
            }

            const domain = value.split('@')[1];
            if (domain !== companyDomain) {
                throw new BadRequestError('Dominio inválido');
            }

            return true;
        }),
    check('password')
        .notEmpty().withMessage('Se requiere la contraseña')
        .isLength({ min: 12 }).withMessage('La contraseña debe de tener al menos 12 caracteres')
        .matches(/[a-z]/).withMessage('La contraseña debe de contener al menos una letra minúscula')
        .matches(/[A-Z]/).withMessage('La contraseña debe de contener al menos una letra mayúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe de contener al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe de contener al menos un caracter especial'),
];

const updateUserValidators = [
    check(['firstName', 'lastName'])
        .optional({ checkFalsy: true })
        .isLength({ max: 255 }).withMessage("El nombre debe de contener menos de 255 caracteres"),
    check('email')
        .optional({ checkFalsy: true })
        .isEmail().withMessage('Formato de email inválido')
        .custom(async (value, { req }) => {
            const user = await User.findOne({ email: value });
            if (user && user._id != req.params.id) {
                throw new NotFoundError('Email no permitido');
            }

            const domain = value.split('@')[1];
            if (domain !== companyDomain) {
                throw new BadRequestError('Dominio inválido');
            }
            return true;
        }),
    check('password')
        .optional({ checkFalsy: true })
        .isLength({ min: 12 }).withMessage('La contraseña debe de tener al menos 12 caracteres')
        .matches(/[a-z]/).withMessage('La contraseña debe de contener al menos una letra minúscula')
        .matches(/[A-Z]/).withMessage('La contraseña debe de contener al menos una letra mayúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe de contener al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe de contener al menos un caracter especial'),
    check('')
        .custom(async (value, {req}) => {
            const user = await User.findById(req.params.id);
            if (user.privilege != privileges.employee) {
                throw new BadRequestError("No puede modificarse la información de este usuario");
            }

            return true;
        }),
    check()
        .custom((value, { req }) => {
            const { firstName, firstLastName, secondLastName, email, password} = req.body;
            if(!firstName && !firstLastName && !secondLastName && !email && !password){
                throw new BadRequestError("Debería de haber al menos un dato a actualizar")
            }
            return true;
        })
];

const deleteUserValidators = [
    check('')
        .custom(async (value, { req }) => {
            const user = await User.findById(req.params.id);
            if (!user) {
                throw new NotFoundError('Usuario no registrado');
            }
            return true;
        }),
    check('')
        .custom(async (value, {req}) => {
            const user = await User.findById(req.params.id);
            if (user.privilege != privileges.employee) {
                throw new BadRequestError("No puede eliminarse este usuario");
            }

            return true;
        }),
];

async function getUsers(req, res, next) {
    try {
        const users = await User.find({ privilege: privileges.employee});
        const mappedUsers = users.map(userInfo => ({
            id: userInfo.id,
            firstName: userInfo.firstName,
            firstLastName: userInfo.firstLastName,
            secondLastName: userInfo.secondLastName,
            email: userInfo.email,
        }));
        console.log(users);

        console.log("Usuarios recuperados con éxito");
        res.status(200).json({ success: true, message: "Usuarios recuperados con éxito", content: mappedUsers});
    } catch (err) {
        return next(err);
    }
}

async function createUser(req, res, next) {
    const { firstName, firstLastName, secondLastName, email, password } = req.body;
    const userToAdd = new User ({
        firstName, firstLastName, secondLastName, email, password, privilege: "employee"
    });

    try{    
        await userToAdd.save();
        
        console.log("Usuario agregado con éxito");
        res.status(200).json({ success: true, message: "Usuario agregado con éxito", content: userToAdd._id});
    } catch(err){
        console.log(err);
        return next(err);
    }   
}

async function updateUser(req, res, next) {
    const { firstName, firstLastName, secondLastName, email, password } = req.body;
    const { id } = req.params;
    const updateFields = {};
    if (firstName) { updateFields.firstName = firstName; }
    if (firstLastName) { updateFields.firstLastName = firstLastName; }
    if (secondLastName) { updateFields.secondLastName = secondLastName; }
    if (email) { updateFields.email = email; }
    if (password) { updateFields.password = password; }

    try {
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            throw new NotFoundError("User not found");
        }

        if (userToUpdate.privilege != privileges.employee) {
            throw new BadRequestError("No puede modificarse la información de este usuario");
        }

        Object.assign(userToUpdate, updateFields);
        await userToUpdate.save();

        console.log("Usuario editado con éxito");        
        res.status(200).json({ success: true, message: "Usuario editado con éxito", content: userToUpdate._id});
    } catch(err) {
        return next(err);
    }
}

async function deleteUser(req, res, next) {
    const { id } = req.params;

    try {
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            throw new NotFoundError("User not found");
        }

        if (userToDelete.privilege != privileges.employee) {
            throw new BadRequestError("No puede eliminarse este usuario");
        }

        await User.deleteOne({ _id: id });

        console.log("Usuario eliminado con éxito");
        res.status(200).json({ success: true, message: "Usuario eliminado con éxito"});
    } catch(err) {
        return next(err);
    }    
}

module.exports = {
    createUserValidators,
    updateUserValidators,
    deleteUserValidators,
    getUsers,
    createUser,
    updateUser,
    deleteUser
}
