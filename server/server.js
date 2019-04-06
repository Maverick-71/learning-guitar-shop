const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

//modelos a importar 
const  { User } = require('./models/user');
// constante para utilizar autenticacion siempre 
const { auth } = require('./middleware/auth')

//Crear cadena de conexion 
mongoose.connect(process.env.DATABASE, {useNewUrlParser:true, 'useCreateIndex': true}, (err) => {
  if(err) return err
  console.log("Conectado a MongoDB");
});

//middleware 
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 3002;


  
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
  app.post('/api/users/register', (req, res) => {
    const user = new User(req.body)
    user.save((err, doc) => {
        if(err) return res. json({success: false, err})
        res.status(200).json({
            success: true,
            userdata: doc
        })
    })
})

///Rutas para realizar el login 
//@param email
/*@param password 
  return token */
  app.post('/api/users/login', (req, res) => {
    // 1. Encuentra el correo
        User.findOne({'email': req.body.email}, (err,user) => {
            if(!user) return res.json({loginSuccess: false, message: 'Auth fallida, email no encontrado'})
    // 2. Obtén el password y compruébalo
            console.log("hola Server")
            user.comparePassword(req.body.password, (err, isMatch) => {
              if(!isMatch) return res.json({loginSuccess: false, message: "Wrong Password"})
    // 3. Si todo es correcto, genera un token
              user.generateToken((err, user)=> {
                if(err) return res.status(400).send(err)
                // Si todo bien, debemos guardar este token como un "cookie"
                res.cookie('guitarshop_auth', user.token).status(200).json(
                    {loginSuccess: true}
                )
            })
        })
    })
})
//Autenticacion por ruta para no logearse casa vez que cambias de pagian 
app.get('/api/users/auth', auth, (req, res) => {
  res.status(200).json({
      isAdmin: req.user.role === 0 ? false : true,
      isAuth: true,
      email: req.user.email,
      name: req.user.name,
      lastname: req.user.lastname,
      role: req.user.role,
      cart: req.user.cart,
      history: req.user.history
  })
})

/* Terminar Sesion  */
app.get('/api/user/logout', auth, (req, res) => {
  User.findOneAndUpdate(
      {_id: req.user._id},
      {token: ''},
      (err, doc) => {
          if(err) return res.json({success: false, err})
          return res.status(200).json({
              success: true
          })
      }
  )
})