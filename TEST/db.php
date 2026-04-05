<?php
/**
 * DB CONNECTION: WEB PMR (MySQL XAMPP)
 * Ajustado a credenciales por defecto de XAMPP (root / '')
 */

$host = 'localhost';
$db = 'webpmr';
$user = 'root'; // Usuario por defecto de XAMPP
$pass = '';     // Contraseña por defecto (vacía)
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
     PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
     PDO::ATTR_EMULATE_PREPARES => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // Si falla aquí, api.php capturará este error y lo devolverá como JSON
     throw new Exception("⚠️ ERROR DE DB: " . $e->getMessage());
}
?>