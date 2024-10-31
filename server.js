require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const mysql = require('mysql2');
const validator = require('validator');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err);
        return;
    }
    console.log("Conexión exitosa a la base de datos MySQL");
});

// Middleware para seguridad y parseo de JSON
app.use(express.static("public"));
app.use(express.json());
app.use(helmet());

// Middleware para autenticación de token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Middleware para autorización basada en roles
function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Acceso denegado" });
        }
        next();
    };
}

// Ruta para registrar un nuevo usuario con contraseña hasheada
app.post("/register", async (req, res) => {
    const { username, password, role } = req.body;

    if (!validator.isAlphanumeric(username)) {
        return res.status(400).json({ message: "Nombre de usuario inválido" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)";
    db.execute(query, [username, hashedPassword, role], (err, results) => {
        if (err) {
            console.error("Error en el registro:", err);
            return res.status(500).json({ message: "Error del servidor" });
        }
        res.json({ message: "Usuario registrado exitosamente" });
    });
});

// Ruta para iniciar sesión y obtener un token JWT
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!validator.isAlphanumeric(username)) {
        return res.status(400).json({ message: "Nombre de usuario inválido" });
    }

    const query = "SELECT * FROM usuarios WHERE usuario = ?";
    db.execute(query, [username], async (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ message: "Error del servidor" });
        }

        if (results.length > 0) {
            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.contrasena);

            if (passwordMatch) {
                const token = jwt.sign({ userId: user.id, role: user.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.json({ message: "Inicio de sesión exitoso", token });
            } else {
                res.json({ message: "Contraseña incorrecta" });
            }
        } else {
            res.json({ message: "Usuario no encontrado" });
        }
    });
});

// Ruta protegida de ejemplo, solo accesible para usuarios con rol "admin"
app.get("/admin", authenticateToken, authorizeRole("admin"), (req, res) => {
    res.send("Bienvenido a la sección de administración");
});

// Iniciar el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
