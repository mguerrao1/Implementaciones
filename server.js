const mysql = require("mysql2");
const express = require("express");
const app = express();
const PORT = 3000;


const db = mysql.createConnection({
    host: "localhost",          
    user: "root",              
    password: "199803",        
    database: "LOGIN", 
    port: 3306
});


db.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err);
        return;
    }
    console.log("Conexión exitosa a la base de datos MySQL");
});


app.use(express.static("public"));
app.use(express.json());


app.post("/login", (req, res) => {
    const { username, password } = req.body;

    
    const query = "SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?";
    db.execute(query, [username, password], (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ message: "Error del servidor" });
        }

      
        if (results.length > 0) {
            res.json({ message: "Inicio de sesión exitoso" });
        } else {
            res.json({ message: "Usuario o contraseña incorrectos" });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
