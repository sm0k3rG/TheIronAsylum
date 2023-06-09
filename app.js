// 1 - Invocamos a Express
const express = require('express');
const app = express();

app.set('view engine','ejs');

//2 - Para poder capturar los datos del formulario (sin urlencoded nos devuelve "undefined")
app.use(express.urlencoded({extended:false}));
app.use(express.json());//además le decimos a express que vamos a usar json


//3- Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env'});

//4 -seteamos el directorio de assets
app.use('/resources',express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

app.use(express.urlencoded({extended:false}));
app.use(express.json());

//app.use('/', require('./router'));

//5 - Establecemos el motor de plantillas
app.set('view engine','ejs');

//6 -Invocamos a bcrypt
const bcrypt = require('bcryptjs');

//7- variables de session
const session = require('express-session');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));


// 8 - Invocamos a la conexion de la DB
const connection = require('./database/db');

//9 - establecemos las rutas
app.get('/login',(req, res)=>{
	res.render('login');
})

app.get('/register',(req, res)=>{
	res.render('register');
})
app.get('/usuario',(req, res)=>{
	res.render('usuario');
})
app.get('/planes',(req, res)=>{
	res.render('planes');
})
app.get('/entrenador',(req, res)=>{
	res.render('entrenador');
})
app.get('/detalles',(req, res)=>{
	res.render('detalles');
})

app.get('/', (req, res) => {
	if (req.session.loggedin) {
		connection.query('SELECT * FROM users WHERE id != ?', [req.session.id_users], (error, userResults) => {
		if (error) {
			throw error;
		} else {
			connection.query('SELECT * FROM plan', (error, planResults) => {
			if (error) {
				throw error;
			} else {
				res.render('index', {
				results: userResults,
				login: true,
				name: req.session.name,
				rol: req.session.rol,
				id: req.session.id_users,
				resultado: planResults,
				idPlan: req.session.idPlan,
				plan: req.session.plan,
				nivel: req.session.nivel,
				descripcion: req.session.descripcion
				});
			}
			});
		}
		});
	} else {
		res.render('index', {
		login: false,
		name: 'sesión caducada'
		});
	}
});

app.get('/edit/:id', (req,res)=>{    
    const id = req.params.id;
    connection.query('SELECT * FROM users WHERE id=?',[id] , (error, results) => {
        if (error) {
            throw error;
        }else{            
            res.render('edit', {
				user:results[0],
				name: req.session.name});            
        }        
    });
});
app.get('/imc/:id', (req,res)=>{    
    const id = req.params.id;
    connection.query('SELECT * FROM users WHERE id=?',[id] , (error, results) => {
        if (error) {
            throw error;
        }else{            
            res.render('imc', {
				user:results[0],
				name: req.session.name});            
        }        
    });
});

app.get('/tarjeta/:id', (req,res)=>{    
    const id = req.params.id;
    connection.query('SELECT * FROM tarjetas WHERE idAsignado=?',[id] , (error, results) => {
        if (error) {
            throw error;
        }else{
			    
            res.render('tarjeta', {
			tarjeta: results[0],
			name: req.session.name,
			id: id,
			});            
        };        
    });
});

app.get('/detalles/:id', (req,res)=>{    
    const id = req.params.id;
	console.log("entro al get")
	console.log(id)
    connection.query('SELECT * FROM detalle_plan WHERE plan_id=?',[id] , (error, results) => {
        if (error) {
            throw error;
        }else{
            res.render('detalles', { 
				results: results,
				detalleid: id            
        	});        
    	};
	});
});
app.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM users WHERE id = ?',[id], (error, results)=>{
        if(error){
            console.log(error);
        }else{           
            res.redirect('/');         
        }
    })
});

app.get('/agregarhora', (req, res) => {
	var datee = new Date();
	const entrada = req.query.parametro;
	const hora = datee.getHours()+":"+datee.getMinutes();
	const fecha = datee.getFullYear()+"/"+(1+datee.getMonth())+"/"+datee.getDate()

	connection.query('INSERT INTO asistencia (fecha, hora, tipo) VALUES (?, ?, ?)', [fecha, hora, entrada], (error, results) => {
		if (error) {
		  console.log(error);
		} else{
            res.render('usuario', { fecha: fecha, hora: hora, tipo: entrada });         
        }
	});
});

app.post('/usuario', async (req, res)=>{
	
})

//10 - Método para el registro
app.post('/register', async (req, res)=>{
	const user = req.body.user;
    const rol = req.body.rol;
	const name = req.body.email;
	const edad = req.body.edad;
	const estado = req.body.estado;
	const pass = req.body.pass;
	let passwordHash = await bcrypt.hash(pass, 8);
    connection.query('INSERT INTO users SET ?',{user:user, name:name, rol:rol, pass:passwordHash,estado:estado,edad:edad},
	 async (error, results)=>{
        if(error){
            console.log(error);
        }else{            
			res.render('register', {
				alert: true,
				alertTitle: "Registrarse",
				alertMessage: "¡Se registro exitosamente!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
            //res.redirect('/');         
        }
	});
})

app.post('/agregarplan', async (req, res) => {
	const plan = req.body.plan;
	const nivel = req.body.nivel;
	const descripcion = req.body.descripcion;
  
	connection.query('INSERT INTO plan SET ?', { plan: plan, nivel: nivel, descripcion: descripcion }, async (error, resultado) => {
	  if (error) {
		console.log(error);
		// Manejar el error aquí
	  } else {
			res.render('register', {
			  alert: true,
			  alertTitle: "Registrarse",
			  alertMessage: "¡Se agregó el plan exitosamente!",
			  alertIcon: 'success',
			  showConfirmButton: false,
			  timer: 1500,
			  ruta: '',
			});
		  }
	});
});

  

//11 - Metodo para la autenticacion
app.post('/auth', async (req, res)=> {
	const user = req.body.user;
	const pass = req.body.pass;
	const estado = req.body.estado;
	
    let passwordHash = await bcrypt.hash(pass, 8);

	if (user && pass) {
		connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results)=> {
			if(results.length == 0 || !(await bcrypt.compare(pass, results[0].pass)) ) {    
				res.render('login', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "USUARIO y/o PASSWORD incorrectas",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'login'    
                    });
				
				//Mensaje simple y poco vistoso
                //res.send('Incorrect Username and/or Password!');				
			} else {         
				//creamos una var de session y le asignamos true si INICIO SESSION    
				req.session.loggedin = true;                
				req.session.name = results[0].user;
				req.session.rol = results[0].rol; 	
				req.session.id_users = results[0].id;
				
				if(results[0].estado == 0){
					res.render('login', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Usuario desactivado",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'login'  
					});
				}
				else if(results[0].rol == 'admin'){
					res.render('login', {
						alert: true,
						alertTitle: "Conexión exitosa",
						alertMessage: "¡LOGIN CORRECTO!",
						alertIcon:'success',
						showConfirmButton: false,
						timer: 1500,
						ruta: ''
						});
					}
				else if(results[0].rol == 'usuario'){
					res.render('login', {
						alert: true,
						alertTitle: "Conexión exitosa",
						alertMessage: "¡LOGIN CORRECTO!",
						alertIcon:'success',
						showConfirmButton: false,
						timer: 1500,
						ruta: 'usuario'
                    });
				}
				else{
					res.render('login', {
						alert: true,
						alertTitle: "Conexión exitosa",
						alertMessage: "¡LOGIN CORRECTO!",
						alertIcon:'success',
						showConfirmButton: false,
						timer: 1500,
						ruta: 'entrenador'
						});
				}
			};	
			res.end();
		});
	} else {	
		res.send('Porfavor ingrese un nombre y una contraseña!');
		res.end();
	}
});

app.post('/update', async (req, res)=> {
	const user = req.body.user;
	const rol = req.body.rol;
	const id = req.body.id;   

	connection.query('UPDATE users SET user = ?, rol=? WHERE id = ?', [user,rol,id], async (error, filas)=> {
			if(error){
				throw error;
			}else{
				res.render('edit', {
					user: req.body.user,
					name: req.session.name,
					rol: req.session.rol,
					alert: true,
					alertTitle: "Actualizado",
					alertMessage: "¡Actualización correcta!",
					alertIcon:'success',
					showConfirmButton: false,
					timer: 1500,
					ruta: ''
				});
			}

	});
	
});

app.post('/agregardetalle', async (req, res)=> {
	//const user = req.body.user;
	//const rol = req.body.rol;
	const id = req.body.id;
	const detalle = req.body.detalle;
	console.log("entro al post")
	console.log(req.body.id)


	connection.query('SELECT plan_id FROM detalle_plan WHERE plan_id = ?',[id],async(error,resultado)=>{
		if(error){
            console.log(error);
		}
		else{
			if(resultado.length > 0 && resultado[0].plan_id != 0 ){
				connection.query('UPDATE detalle_plan SET detalle = ? WHERE plan_id = ? ', [detalle,id], async (error, filas)=> {
					if(error){
						throw error;
					}else{
						res.render('edit', {
							user: req.body.user,
							name: req.session.name,
							rol: req.session.rol,
							alert: true,
							alertTitle: "Actualizado",
							alertMessage: "¡Actualización correcta!",
							alertIcon:'success',
							showConfirmButton: false,
							timer: 1500,
							ruta: ''
						});
					}
			});
			}else{
				connection.query('INSERT INTO detalle_plan SET ?',{detalle:detalle, plan_id:id},
				async (error, results)=>{
				   if(error){
					   console.log(error);
				   }else{            
					   res.render('detalles', {
						 //  user: req.body.user,
							name: req.session.name,
							rol: req.session.rol,
							alert: true,
							alertTitle: "Registrarse",
							alertMessage: "¡Se registro exitosamente!",
							alertIcon:'success',
							showConfirmButton: false,
							timer: 1500,
							ruta: ''
					   });
				   }
			   });
			}
		}
	})
});

app.post('/agregarTarjeta', async (req, res)=> {
	//const user = req.body.user;
	//const rol = req.body.rol;
	const id = req.body.id;
	const numeroTarjeta = req.body.numero;
	const codigoSecreto = req.body.secreto;
	const fechaVencimiento = req.body.fecha;
	const estado = req.body.estado;
	connection.query('SELECT idAsignado FROM tarjetas WHERE idAsignado = ?',[id],async(error,resultado)=>{
		if(error){
            console.log(error);
		}
		else{
			if(resultado.length > 0 && resultado[0].idAsignado != 0 ){
				connection.query('UPDATE tarjetas SET numeroTarjeta = ?, codigoSecreto = ? , fechaVencimiento = ?,estado = ? WHERE idAsignado = ? ', [numeroTarjeta,codigoSecreto,fechaVencimiento,estado,id], async (error, filas)=> {
					if(error){
						throw error;
					}else{
						res.render('edit', {
							user: req.body.user,
							name: req.session.name,
							rol: req.session.rol,
							alert: true,
							alertTitle: "Actualizado",
							alertMessage: "¡Actualización correcta!",
							alertIcon:'success',
							showConfirmButton: false,
							timer: 1500,
							ruta: ''
						});
					}
			});
			}else{
				connection.query('INSERT INTO tarjetas SET ?',{numeroTarjeta:numeroTarjeta, codigoSecreto:codigoSecreto,fechaVencimiento:fechaVencimiento, estado:estado, idAsignado:id},
				async (error, results)=>{
				   if(error){
					   console.log(error);
				   }else{            
					   res.render('tarjeta', {
						 //  user: req.body.user,
							   name: req.session.name,
							   rol: req.session.rol,
						   alert: true,
						   alertTitle: "Registrarse",
						   alertMessage: "¡Se registro exitosamente!",
						   alertIcon:'success',
						   showConfirmButton: false,
						   timer: 1500,
						   ruta: ''
					   });
				   }
			   });
			}
		}
	})
});

app.post('/agregarIMC', async (req, res)=> {
	const user = req.body.user;
	const rol = req.body.rol;
	const id = req.body.id;
	const peso = req.body.peso;
	const altura = req.body.altura;
	const IMC = req.body.imc;
	const nivel = req.body.nivel;
	const sexo = req.body.sexo;

	connection.query('INSERT INTO clientes SET ?',{peso:peso,altura:altura,IMC:IMC,nivel:nivel,sexo:sexo,idAsignado:id},
	 async (error, results)=>{
        if(error){
            console.log(error);
        }else{            
			res.render('imc', {
				user: req.body.user,
					name: req.session.name,
					rol: req.session.rol,
				alert: true,
				alertTitle: "Registrarse",
				alertMessage: "¡Se registro exitosamente!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
            //res.redirect('/');         
        }
	});
	
});



//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

 //Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/login') // siempre se ejecutará después de que se destruya la sesión
	})
});


app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000/login');
});