<?php 
	
	$mysqli=new mysqli("localhost","root1","123","callvoip");
	
	if(mysqli_connect_errno()){
		echo 'Conexion Fallida : ', mysqli_connect_error();
		exit();
	}

	if (!mysqli_set_charset($mysqli, "utf8")) {
    printf("Error cargando el conjunto de caracteres utf8: %s\n", mysqli_error($mysqli));
    exit();
    }

?>