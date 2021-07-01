<?php

$nombres=$_POST['name'];
$correo=$_POST['email'];
$asunto=$_POST['msg_subject'];
$telefono=$_POST['phone_number'];
$mensaje=$_POST['message'];

$email= "aclogistica01@gmail.com";//solicitud@corficolombianaltda.com
$emailenvio= "solicitudes@callvoip.com.co";

$contenido= "Nombre: $nombres \n";
$contenido .= "Correo: $correo \n";
$contenido .= "Telefono: $telefono \n"; 
$contenido .= "Asunto: $asunto \n"; 
$contenido .= "Mensaje: $mensaje \n";

$asunto = 'Solicitud de Información - Pagina Web Ecuador';

$header = 'MIME-Version: 1.0' . "\r\n";
$header .= 'Content-type: text/html; charset=utf-8' . "\r\n";
$header .= 'From: ' . $emailenvio . " \r\n";
$header .= "X-Mailer: PHP/" . phpversion() . " \r\n";
$header .= "Mime-Version: 1.0 \r\n";
$header .= "Content-Type: text/plain";

mail($email, $asunto, $contenido, $header);

echo "Solicitud Enviada Satisfactoriamente";

?>