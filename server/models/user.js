const mongoose = require('mongoose');

//Importaciones para emcriptarr 
const bcrypt = require('bcrypt');
const SALT_I=10;

// Importaciones para generar el TOKEN 
const jwt = require('jsonwebtoken');

//require para poder utilizar archivo de conexion 
// a base de datos 
require('dotenv').config();

const userSchema = mongoose.Schema({
        email: {
            type: String,
            required: true,
            trim: true,
            unique: 1
        },
        password: {
            type: String,
            required: true,
            minlength: 5
        },
        name: {
            type: String,
            required: true,
            maxlength: 100
        },
        lastname: {
            type: String,
            required: true,
            maxlength: 100
        },
        cart: {
            type: Array,
            default: []
        },
        history:{
            type: Array,
            default:[]
        },
        role: {
            type: Number,
            default: 0
        },
        token: {
            type: String
        }
    })

    
    //MIDDLEWARE Encryptasion 
    userSchema.pre('save', async function (next){
        if(this.isModified('password')){
            try {
                const salt = await bcrypt.genSalt(SALT_I)
                const hash = await bcrypt.hash(this.password, salt)
                this.password = hash;
                next();
            } catch(err){
                return next(err);
            }
        }
    });

    //Methodos  
    /* Comparar contraseñas */
    userSchema.methods.comparePassword = function(candidatePassword, cb){
        bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
            console.log(isMatch)
            if(err) return cb(err)
            cb(null, isMatch)
        })
    };

    /*Metodo para generar TOKEN */
    userSchema.methods.generateToken = async function(cb){
        const token = await jwt.sign(this._id.toHexString(),process.env.SECRET)
        this.token = token
        this.save((err, user) => {
            if(err) return cb(err)
            cb(null, user)
        })
    }
    
    /* Metodo para buscar en base de datos por token  */
    userSchema.statics.findByToken = function(token,cb){
        var user = this;
        jwt.verify(token, process.env.SECRET, function(err, decode){
            user.findOne({"_id": decode, "token": token}, function(err, user){
                if (err) cb(error)
                cb(null, user);
            })
        })
    }

    //MIDDLEWARE 
    const User = mongoose.model('User', userSchema, "users");

    //IMPORTASION 
    module.exports = {User}