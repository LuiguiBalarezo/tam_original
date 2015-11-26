var utils = require('utils');


var casper = require('casper').create({
    colorizerType: 'Dummy', // prevent colorize text output
    verbose: false, // prevent casper to print messages to stdout
    logLevel: 'error', // casper only prints to stderr error messages
    viewportSize: {width: 800, height: 600},
    pageSettings: {
        webSecurityEnabled: false
    },
    clientScripts: ['jquery-1.6.1.js']
});

//url_boot = 'http://smart-track.g-trackers.com/gpstracking/www/pe',
var url_g = '', url_boot = 'http://localhost:8080/tam_original/gpstracking/www/pe',
    client = '',
    idcuenta = '', namecuenta = [], id_personal = [], name_personal = [],
    name_report = [], link_report = [], link_consulta_json = [],
    coordenadas_json = [], interval,
    lat_tmp = "", long_tmp = "", lat_a = "", long_a = "", lat_b = "", long_b = "",
    delay_1 = 0, delay_2 = 0,
    contar_index_tramas = 0, contar_index_coordenadas = 0, resultJson = "",
    direccion = [], distancia = 0,
    cod_user = [], name_user = [], address_user = [], lat_user = [], long_user = [], date_user = [],
    codpersonal = "", namepersonal = "", calle = "", calle1 = "", calle2 = "",
    total_registros = 0, contador_registros = 0,
    todayTimeStamp, oneDayTimeStamp, diff, yesterdayDate,
    fecha = [],
    f_inicial = '', dia = '', mes = '', anio = '', f_final = '',
    h_inicial = '', h_final = '',
    m_inicial = '', m_final = '',
    b_f_inicial = '', b_f_final = '',
    direccion_formateada = "---",
    status = "",
    a_f_inicial = '', a_f_final = '',
    pageContent = "",
    error_message = "";


var saverFilesTo, downloadedFile = {}, t = Date.now();

casper.start(url_boot + "/miembro/ingresar", function () {
    //console.log("Abrir Login");
    //this.log('Abrir Login', 'debug');
    takeSnapshot(this, 'fillingLogin.png');
});

casper.thenEvaluate(function () {
    //console.log("Ingresa Credenciales");
    document.querySelector('input[name="correo"]').value = "lmoreno@oxfordperu.com";
    document.querySelector('input[name="contrasena"]').value = "oxforduser";
    document.querySelector('input[name="acceder"]').click();
    takeSnapshot(this, 'Evaluate.png');
})

casper.thenOpen(url_boot + "/rrecorrido", function () {
    //console.log("Abrir Modulo Recorrido");
    takeSnapshot(this, 'Menu.png');
});

casper.then(function () {
    //console.log("Obtenermos informacion");

    var tmpNameCuenta, tmpFecha;
    idcuenta = getElementValue('idcuenta');
    tmpNameCuenta = getElementTextClass('contenido');
    id_personal = getElementSelectValue();

    //console.log("total_personas "+id_personal.length);

    name_personal = getElementSelectText();

    todayTimeStamp = new Date;
    oneDayTimeStamp = 1000 * 60 * 60 * 24;
    diff = todayTimeStamp - oneDayTimeStamp;
    yesterdayDate = new Date(diff);
    dia = ("0" + yesterdayDate.getDate()).slice(-2);
    mes = ("0" + (yesterdayDate.getMonth() + 1)).slice(-2);
    anio = yesterdayDate.getFullYear();

    tmpFecha = dia + "/" + mes + "/" + anio

    f_inicial = dia + "/" + mes + "/" + anio;
    f_final = dia + "/" + mes + "/" + anio;
    h_inicial = getElementValue('pp_hora_inicial_hora_personas');
    h_final = getElementValue('pp_hora_final_hora_personas');
    m_inicial = getElementValue('pp_hora_inicial_minuto_personas');
    m_final = getElementValue('pp_hora_final_minuto_personas');

    if (f_inicial.length > 8) {
        a_f_inicial = f_inicial.split("/");
        b_f_inicial = a_f_inicial[2] + '-' + a_f_inicial[1] + '-' + a_f_inicial[0];
    }

    if (f_final.length > 8) {
        a_f_final = f_inicial.split("/");
        b_f_final = a_f_final[2] + '-' + a_f_final[1] + '-' + a_f_final[0];
    }

    url_g += '/fi/' + b_f_inicial;
    url_g += '/hi/' + h_inicial;
    url_g += '/mi/' + m_inicial;

    url_g += '/ff/' + b_f_final;
    url_g += '/hf/' + h_final;
    url_g += '/mf/' + m_final;

    namecuenta.push(tmpNameCuenta);
    fecha.push(tmpFecha);

});

casper.then(function () {
    for (var i = 0; i < id_personal.length; i++) {
        if (id_personal[i] != '0') {
            link_consulta_json.push(url_boot + "/reportes/rrecorridojsonpersona/person_id/" + id_personal[i] + "/cli/" + idcuenta + "/per/" + id_personal[i] + "" + url_g);
            link_report.push(url_boot + "/reportes/rrecorridoimprimiblepersona/person_id/" + id_personal[i] + "/cli/" + idcuenta + "/per/" + id_personal[i] + "" + url_g);
        }
    }
    for (var i = 0; i < name_personal.length; i++) {
        if (name_personal[i] != 'Seleccione Personal') {
            name_report.push(name_personal[i]);
        }
    }
});

casper.then(function () {
    for (var i = 0; i < link_consulta_json.length; i++) {
        this.thenOpen(link_consulta_json[i], function () {
            //console.log("Obteniendo Coordenadas");
            var resultJson = this.getPageContent();
            if (resultJson != "null") {
                coordenadas_json.push(JSON.parse(resultJson));
            } else {
                coordenadas_json.push(null);
            }
        });
    }
});

casper.then(function () {
    delay_1 = 2000;
    delay_2 = 2000;
    casper.each(coordenadas_json, function (self, i) {
        /*Recorrido deacuerdo a la trama de las coordenadas*/
        self.wait(delay_1, function () {
            contar_index_tramas++;
            this.log('Creando direcciones ' + i, 'debug');

            codpersonal = id_personal[contar_index_tramas];
            namepersonal = name_personal[contar_index_tramas];

            if (isNullArray(i)) {
                //Recorrido deacurdo a el todo de coordenadas por tramas
                casper.each(i, function (self, j) {
                    self.wait(delay_2, function () {
                        contar_index_coordenadas++;
                        contador_registros++;
                        /*Mantenemos las variables ya que el each no permite obtener valores adelantados (longitud, latitud)*/
                        mantenerValores(j.latitude, j.longitude);
                        if (contar_index_coordenadas == 1) {
                            this.thenOpen("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + j.latitude + "," + j.longitude + "&sensor=true", {
                                method: 'get',
                                encoding: "utf-8",
                                headers: {
                                    'Content-type': 'application/json; charset=utf-8'
                                }
                            }, function () {
                                direccion_formateada = getAddress(this.getPageContent());
                                almacenarDirecciones(codpersonal, namepersonal, direccion_formateada, j.latitude, j.longitude, j.server_date);
                            });
                        } else {
                            this.thenOpen("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + j.latitude + "," + j.longitude + "&sensor=true", {
                                method: 'get',
                                encoding: "utf-8",
                                headers: {
                                    'Content-type': 'application/json; charset=utf-8'
                                }
                            }, function () {
                                direccion_formateada = getAddress(this.getPageContent());
                                almacenarDirecciones(codpersonal, namepersonal, direccion_formateada, j.latitude, j.longitude, j.server_date);
                            })
                        }
                    });
                });
                contar_index_coordenadas = 0;
            } else {
               almacenarDirecciones(codpersonal, namepersonal, null, null, null, null);
            }
        });
    });
})

function getAddress(pageContent){
    if (isJsonString(pageContent)) {
        resultJson = JSON.parse(pageContent);
        status = resultJson.status;
        if (status == "OK") {
            return resultJson.results[0].formatted_address;
        } else if (status == "OVER_QUERY_LIMIT") {
            return "Se excedio el limite";
        }
    } else {
        return "Error: "+error_message;
    }
}

casper.run(function () {
    downloadedFile.cod_user = cod_user;
    downloadedFile.name_user = name_user;
    downloadedFile.address_user = address_user;
    downloadedFile.lat_user = lat_user;
    downloadedFile.long_user = long_user;
    downloadedFile.date_user = date_user;
    this.echo(utils.serialize(downloadedFile));
    casper.exit();
});

/*Method*/
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        error_message = e.message;
        return false;
    }
    return true;
}

function almacenarDirecciones(idpersonal, nombrepersonal, direccion, latitud, longitud, fecha_hora) {
    cod_user.push("" + idpersonal + "");
    name_user.push("" + nombrepersonal + "");
    address_user.push("" + direccion + "");
    lat_user.push("" + latitud + "");
    long_user.push("" + longitud + "");
    date_user.push("" + fecha_hora + "");
}

function getElementValue(element) {
    //console.log("Obetenemos id de la cuenta");
    return casper.evaluate(function (elemento) {
        return $('#' + elemento + '').val();
    }, {
        elemento: element
    });
}

function getElementTextClass(element) {
    //console.log("Obtenemos Nombre de la cuenta");
    return casper.evaluate(function (elemento) {
        return $('.' + elemento + '').text();
    }, {
        elemento: element
    });
}

function getElementSelectValue() {
    //console.log("Obtenemos valores del select");
    return casper.evaluate(function () {
        var optionValues = [];
        $('#select_personas option').each(function () {
            optionValues.push($(this).val());
        });
        return optionValues;
    });
}

function getElementSelectText() {
    //console.log("Obetenemos texto del select");
    return casper.evaluate(function () {
        var optionText = [];
        $('#select_personas option').each(function () {
            optionText.push($(this).text());
        });
        return optionText;
    });
}

function isNullArray(coor_array) {
    if (coor_array != null) {
        return true;
    } else {
        return false;
    }
}

function mantenerValores(la, lo) {
    lat_a = la;
    long_a = lo;
    lat_b = lat_tmp;
    long_b = long_tmp;
    lat_tmp = lat_a;
    long_tmp = long_a;
}

function Dist(lat1, lon1, lat2, lon2) {
    rad = function (x) {
        return x * Math.PI / 180;
    }

    var R = 6378.137;                          //Radio de la tierra en km
    var dLat = rad(lat2 - lat1);
    var dLong = rad(lon2 - lon1);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return (d / 0.0010000).toFixed(2);                      //Retorna dos decimales
}

function takeSnapshot(casp, pictureName) {

}