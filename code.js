/**
 * @OnlyCurrentDoc
 *
 * Specifica che l'add-on potrà solamente accedere a questo documento
 * e non ad altri file.
 */

/**
 * Parametri di configurazione
 */
var PATH = 'http://95.252.6.3:8080';
var REC_URL = 'http://some.url.com/recording?time=';
//var LEC_ID = '4649c6fe-39fa-489d-9074-23e1477678c7';
var EMAIL = 'giacomo.callegari@studenti.unitn.it';
var PASSWORD = 'ciao1234';
//var TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxvZGVAdW5pdG4uaXQiLCJ0eXBlIjoicHJvZmVzc29yIiwiaWF0IjoxNTI0MDY2NDcwfQ.Cui7Heo0z1a1Y2yn--zAb08lwLqyU5qruO7W4dlkZww';
var PIN = '1234';


/**
 * Inserisce una nuova voce nel menù dei componenti aggiuntivi di Google Docs.
 * Questo metodo non è mai utilizzato nella versione mobile dell'add-on.
 *
 * @param {object} e Il parametro evento per un semplice trigger di tipo onOpen.
 *     Il tipo di autorizzazione è disponibile ispezionando e.authMode.
 */
function onOpen(e) {
    // Visualizzo la sidebar.
    DocumentApp.getUi().createAddonMenu()
        .addItem('Avvia', 'showSidebar')
        .addToUi();
}

/**
 * Viene eseguito quando l'add-on viene installato.
 * Questo metodo non è mai utilizzato nella versione mobile dell'add-on.
 *
 * @param {object} e Il parametro evento per un semplice trigger di tipo onInstall.
 *     Il tipo di autorizzazione è disponibile ispezionando e.authMode.
 */
function onInstall(e) {
    onOpen(e);
}

/**
 * Apre una sidebar nel documento contenente l'interfaccia utente dell'add-on.
 * Questo metodo non è mai utilizzato nella versione mobile dell'add-on.
 */
function showSidebar() {
    var ui = HtmlService.createHtmlOutputFromFile('sidebar')
        .setTitle('Strumento di cattura');
    DocumentApp.getUi().showSidebar(ui);    
}

/**
 * Accede al sistema LODE e ottiene, se esiste, la lezione in corso.
 */
function init() {
    // Accedo al sistema LODE.
    login();
    
    // Ottengo l'ID della lezione.
    getLecture();
}

/**
 * Accede al sistema LODE con le credenziali richieste.
 */
function login() {
    console.log('Login');

    // Definisco l'URL della richiesta.
    var reqUrl = PATH + '/api/user/login';

    // Definisco i parametri della richiesta.
    var email = EMAIL;
    var password = PASSWORD;
    var body = {
        email: email,
        password: password
    };
    var options = {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(body)
    };

    // Invio la richiesta.
    var response = JSON.parse(UrlFetchApp.fetch(reqUrl, options));
    console.log('Token: ' + response.token);
    
    // Salvo il token di autorizzazione.
    PropertiesService.getDocumentProperties().setProperty('TOKEN', response.token);
}

/**
 * Esegue una richiesta HTTP al dispositivo di cattura per ottenere la lezione in corso.
 */
function getLecture() {
    console.log('Get lecture');
    
    // Ottengo il token di autorizzazione.
    var token = PropertiesService.getDocumentProperties().getProperty('TOKEN');

    // Definisco l'URL della richiesta.
    var reqUrl = PATH + '/api/lecture?live=true';

    // Definisco i parametri della richiesta.
    var headers = {
        'Authorization': 'Bearer ' + token
    };
    var options = {
        method: 'GET',
        headers: headers
    };

    // Invio la richiesta.
    var response = JSON.parse(UrlFetchApp.fetch(reqUrl, options));
    console.log('Lecture: ' + response[0].uuid);
    
    // Salvo l'ID della lezione.
    PropertiesService.getDocumentProperties().setProperty('LEC_ID', response[0].uuid);
}

/**
 * Esegue una richiesta HTTP al dispositivo di cattura per ottenere la schermata corrente.
 */
function getScreenshot() {
    console.log('Get screenshot');
    
    // Ottengo il token di autorizzazione e l'ID della lezione.
    var token = PropertiesService.getDocumentProperties().getProperty('TOKEN');
    var lecture = PropertiesService.getDocumentProperties().getProperty('LEC_ID');

    // Definisco l'URL della richiesta.
    var reqUrl = PATH + '/api/lecture/' + lecture + '/screenshot';

    // Definisco i parametri della richiesta.
    var headers = {
        'Authorization': 'Bearer ' + token,
        'pin': PIN
    };
    var options = {
        method: 'GET',
        headers: headers
    };

    // Invio la richiesta.
    var response = JSON.parse(UrlFetchApp.fetch(reqUrl, options));
    var blob = Utilities.newBlob(Utilities.base64Decode(response.img), MimeType.PNG);

    // Individuo la posizione del cursore.
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();

    // Inserisco l'immagine nel documento.
    if (cursor) {
        var screenshot = cursor.insertInlineImage(blob);
    } else {
        var screenshot = doc.getBody().appendImage(0, screenshot);
    }

    //Ridimensiono l'immagine.
    if (screenshot) {
        var width = doc.getBody().getPageWidth();
        var height = screenshot.getHeight() * (width / screenshot.getWidth());
        screenshot.setWidth(width).setHeight(height);
    }
}

/**
 * Esegue una richiesta HTTP al dispositivo di cattura per ottenere il timestamp corrente.
 */
function getTimestamp() {
    console.log('Get timestamp');
    
    // Ottengo il token di autorizzazione e l'ID della lezione.
    var token = PropertiesService.getDocumentProperties().getProperty('TOKEN');
    var lecture = PropertiesService.getDocumentProperties().getProperty('LEC_ID');
    
    // Definisco l'URL della richiesta.
    var reqUrl = PATH + '/api/lecture/' + LEC_ID + '/screenshot';

    // Definisco i parametri della richiesta.
    var headers = {
        'Authorization': 'Bearer ' + token,
        'pin': PIN
    };
    var options = {
        method: 'GET',
        headers: headers
    };

    // Invio la richiesta.
    var response = JSON.parse(UrlFetchApp.fetch(reqUrl, options));
    var timestamp = response.timestamp;

    // Individuo la posizione del cursore.
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();
    
    // Costruisco il link del timestamp.
    var baseUrl = REC_URL;
    var linkUrl = baseUrl.append(timestamp);
    
    // Inserisco il marcatore per il timestamp nel documento.
    if (cursor) {
        cursor.insertText('📽').setLink(linkUrl);
    } else {
        doc.getBody().appendParagraph('').insertText('📽').setLink(linkUrl);
    }
}
