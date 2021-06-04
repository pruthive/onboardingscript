/*
Merchant Onboarding 

--Start of Script--
*/

//Getting script for SHA512
eval(UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js').getContentText());

//Setting global date
var getDate = new Date();

//getting sheet references
var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
var scriptSheet = spreadSheet.getSheets()[1];
var dataSheet = spreadSheet.getSheets()[2];
var emailSheet = spreadSheet.getSheets()[3];

//getting global cell references
var dataVal = scriptSheet.getDataRange().getValues();
var dataCount = dataVal.length +1;

//duplicate list and cell
var dupeList = [];
var duplicates = dataSheet.getRange("B5");

//Getting complete records 
var recordList = [];
var records = dataSheet.getRange("B6");


//setting up global variables
var document = PropertiesService.getDocumentProperties();
var xgpversion;
var returnedAccessToken;
var mer_id;
var sp_pfc_id;
var transit_transaction_key;
var tr_pfc_id;
var merchantID;
var name; 
var sheet_merchant_name;


function testReq(){

    generateUserAndDate();
    setTime("B3");

  for(var i = 2; i < dataCount; i++){
    var blankCheck = scriptSheet.getRange("J"+i+":"+"U"+i);
    if(i > 2 && blankCheck.isBlank()){
          accessToken();
          createMerchant(i);
          transitKey(i);
          transitPlatform(i);
          createAccounts(i);
          sendCPTransaction(i);
          sendCNPTransaction(i);
          sendACHTransaction(i);
          getSheetVals(i);
          recordList.push(i);
    }else if(i > 2 && !(blankCheck.isBlank())){
      Logger.log("Row "+i+" already executed");
      dupeList.push(i);
      
    }
  }
  Logger.log(dupeList.length);
  Logger.log(recordList.length);
  duplicates.setValue(dupeList.length);
  records.setValue(recordList.length);
  setTime("B4");
}
  
function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
      .createMenu('Custom Menu')
      .addItem('Show prompt', 'showPrompt')
      .addToUi();
}

function checkBlanks(){
  
  var ui = SpreadsheetApp.getUi();
  var range = scriptSheet.getDataRange();
  var numRows = range.getNumRows();
  var rowLength = numRows +1;
  var numCol = 35;
 
  for(var i = 1; i < rowLength; i++){
    for(var x = 1; x < numCol; x++){
      if(i > 2){
     
        var value = range.getCell(i, x).getValues();
   
        if(value==""){
          Logger.log("Empty value at Row:"+i+" Column:"+x);
          ui.alert("Empty value at Row:"+i+" Column:"+x+"\n" +" Run  the script again with values added to the empty fields!");
          return;
        }else{
     
        }
      }
    }
  } 
  sendRequest(); 
}


function documentProps(){
 
 document.setProperty("app_id", "oohPXGFuYGeeAZ3yN7HR6ZBTOLqCQD99");
 document.setProperty("app_key", "zJ8OYnPMMvhTQmoO");
 document.setProperty("MER_ID", "MER_60af02beeeae4543bbd72c0b3c409273");
 document.setProperty("developer_id", "002857G001");
 document.setProperty("password", "TsysCert123.");


}

//generating the access token
function accessToken(){

    documentProps();
    var app_id = document.getProperty("app_id");
    var app_key = document.getProperty("app_key");
    var nonce = getDate.toISOString();
    var s512Txt = nonce+''+app_key;
    var secret = CryptoJS.SHA512(s512Txt).toString(CryptoJS.enc.Hex);

    var data = {
    "app_id": app_id,
    "secret": secret,
    "grant_type": "client_credentials",
    "nonce": nonce
    }
    var options = {
    "method": "post",
    "headers": {
      "Content-type": "application/json",
      "X-GP-Version": "2020-12-22",
    },
    "payload" : JSON.stringify(data) 
    }

    try{

      var response = UrlFetchApp.fetch("https://apis.sandbox.globalpay.com/ucp/accesstoken", options);

        if(response.getResponseCode()=="200"){
         var json = response.getContentText();
         var returnedData = JSON.parse(json);
    
          returnedAccessToken = returnedData.token;
         
        }else{
          Logger.log(response.getResponseCode());
        }

    }catch(err){
          Logger.log(err);
        }
 }
 

//creating a merchant
function createMerchant(i){

    //var merchant_name = scriptSheet.getRange("A"+i).getValue();
    //var merchant_email = scriptSheet.getRange("E"+i).getValue();
    var backendmid = scriptSheet.getRange("A"+i);
    var tcid = scriptSheet.getRange("C"+i);
    var regkey = scriptSheet.getRange("D"+i);
    var merchant_errors = scriptSheet.getRange("R"+i);
    var successRange = scriptSheet.getRange("J"+i+":"+"N"+i);


    if(tcid.isBlank()&&regkey.isBlank()){
      merchantID = backendmid.getValue();
    }else{
      merchantID = backendmid.getValue()+"_"+tcid.getValue()+"_"+regkey.getValue();
    }
 

    var data = {
    "name": merchantID,
    "type": "MERCHANT"
    }
    var options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer "+returnedAccessToken,
      "X-GP-Version": "2021-03-22",
    },
    "payload" : JSON.stringify(data) 
    }

    try{

      var response = UrlFetchApp.fetch("https://apis.sandbox.globalpay.com/ucp/merchants", options);

        if(response.getResponseCode()=="200"){
         var json = response.getContentText();
         var returnedData = JSON.parse(json);
           Logger.log(returnedData);
           mer_id = returnedData.id;
           merchant_errors.setValue("");
        

        }else{
          Logger.log(response.getResponseCode());
        }

    }catch(err){
          Logger.log(err);
          merchant_errors.setValue(err);
          successRange.setValue("");
        }
}
    
  




//creating the transit key
function transitKey(i){

    var mid = scriptSheet.getRange("G"+i).getValue();
    var userID = scriptSheet.getRange("F"+i).getValue();
    var password = document.getProperty("password");

    var data = {
      "GenerateKey" : {
            "mid": mid,
            "userID": userID,
            "password": password,
          }
    }
    var options = {
    "method": "post",
    "headers": {
      ///"Authorization": "Bearer "+returnedAccessToken,
      //"X-GP-Version": "2021-03-22",
      "Content-Type" : "application/json",
    },
    "payload" : JSON.stringify(data) 
    }
    try{

      var response = UrlFetchApp.fetch("https://stagegw.transnox.com/servlets/Transnox_API_Server", options);

        if(response.getResponseCode()=="200"){
         var json = response.getContentText();
         var returnedData = JSON.parse(json);
           transit_transaction_key = returnedData.GenerateKeyResponse.transactionKey;
           Logger.log("transitkey: "+returnedData.GenerateKeyResponse.transactionKey);
         
        }else{
          Logger.log(response.getResponseCode());
        }

    }catch(err){
          Logger.log(err);
        }

}


//creating the transit platform
function transitPlatform(i){

    var platform_name = scriptSheet.getRange("B"+i).getValue();
    var platform_mid = scriptSheet.getRange("G"+i).getValue();
    var device_id = scriptSheet.getRange("H"+i).getValue();
    var developer_id = document.getProperty("developer_id");
    var transaction_key = transit_transaction_key;

    var transit_platform_errors = scriptSheet.getRange("S"+i);

    var data = {
      "transit" : {
            "platform_name": platform_name,
            "platform_mid": platform_mid,
            "device_id": device_id,
            "developer_id": developer_id,
            "transaction_key": transaction_key,
          }
    }
    var options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer "+returnedAccessToken,
      "X-GP-Version": "2021-03-22",
    },
    "payload" : JSON.stringify(data) 
    }
    
    try{

      var response = UrlFetchApp.fetch("https://apis.sandbox.globalpay.com/ucp/merchants/"+mer_id+"/platform-configurations", options);

        if(response.getResponseCode()=="200"){
         var json = response.getContentText();
         var returnedData = JSON.parse(json);
         tr_pfc_id = returnedData.id;
           Logger.log("tr_pfc_id: "+tr_pfc_id);
           transit_platform_errors.setValue("");
     
          

        }else{
          Logger.log(response.getResponseCode());
        }

    }catch(err){
          Logger.log(err);
          transit_platform_errors.setValue(err);
        }

}
  



 
//creating accounts
function createAccounts(i){
   
    var finalStr = String("00000000"+ Math.floor(Math.random()*100000000) + 1).slice(-10);
    var finalStr2 = String("00000000"+ Math.floor(Math.random()*100000000) + 1).slice(-10);
    
    
    sheet_merchant_name = scriptSheet.getRange("E"+i);

    var account_errors = scriptSheet.getRange("T"+i);
    var successful_request = scriptSheet.getRange("J"+i);
    var mcs_merchant_id = scriptSheet.getRange("K"+i);
    var mcs_merchant_name = scriptSheet.getRange("L"+i);
    var mcs_account_id = scriptSheet.getRange("M"+i);
    var mcs_account_name = scriptSheet.getRange("N"+i);
    var errorrange = scriptSheet.getRange("R"+i+":"+"U"+i);
    var merchantname;
    
    if(sheet_merchant_name.isBlank()){
      merchantname = "default";
      
    }else if(!(sheet_merchant_name.isBlank())){
      merchantname = sheet_merchant_name.getValue();
    }


    var data = {
    "type": "TRANSACTION_PROCESSING",
    "name": merchantname,
    "status": "ACTIVE",
    "permissions": [
        "TRN_POST_Authorize",
        "TRN_POST_Refund",
        "TRN_POST_Adjust",
        "TRN_GET_Single",
        "TRN_POST_Initiate",
        "TRN_POST_Reverse",
        "TRN_POST_Capture",
        "TRN_GET_List",
        "VER_POST_Verify",
        "ACC_GET_List",
        "ACC_GET_Single",
        "ACT_GET_Single",
        "ACT_GET_List"
    ],
    "configurations": [
          {
            "id": finalStr,
            "channel": "CP",
            "countries": [
                "US"
            ],
            "currencies": [
                "USD"
            ],
            "payment_methods": [
                "CARD"
            ],
            "platform_configuration": {
                "id": tr_pfc_id
              }
          },
        {
            "id": finalStr2,
            "channel": "CNP",
            "countries": [
                "US"
            ],
            "currencies": [
                "USD"
            ],
            "payment_methods": [
                "CARD","BANK_TRANSFER"
            ],
            "platform_configuration": {
                "id": tr_pfc_id
              }
          }
       ]
    }
    var options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer "+returnedAccessToken,
      "X-GP-Version": "2021-03-22",
    },
    "payload" : JSON.stringify(data) 
    }
    
    try{

      var response = UrlFetchApp.fetch("https://apis.sandbox.globalpay.com/ucp/merchants/"+mer_id+"/accounts", options);

        if(response.getResponseCode()=="200"){
         var json = response.getContentText();
         var returnedData = JSON.parse(json);
        
           Logger.log(returnedData);
           Logger.log("tr_pfc_id from create accounts: "+tr_pfc_id);
           account_errors.setValue("");
           successful_request.setValue(returnedData.action.result_code);
           mcs_merchant_id.setValue(returnedData.merchant_id);
           mcs_merchant_name.setValue(returnedData.merchant_name);
           mcs_account_id.setValue(returnedData.id);
           mcs_account_name.setValue(returnedData.name);

           successful_request.setBackground("green");
           successful_request.setFontColor("white");
           errorrange.setValue("");
           recordList.push(i);

        }else{
          Logger.log(response.getResponseCode());
        }

    }catch(err){
          Logger.log(err);
          account_errors.setValue(err);
          successful_request.setValue("");
          successful_request.setBackground("white");
          mcs_merchant_id.setValue("");
          mcs_merchant_name.setValue("");
          mcs_account_id.setValue("");
          mcs_account_name.setValue("");
        }

}

function getSheetVals(i){
  var values = scriptSheet.getSheetValues(3, 11, i, 4);
  var targetRange = emailSheet.getRange(2,1,i,4);
  targetRange.setValues(values);

  var loginUser = scriptSheet.getSheetValues(3,6,i,1);
  var targetRangeUser = emailSheet.getRange(2,5,i,1)
  targetRangeUser.setValues(loginUser);

}


function sendEmail(){
  /**
 * Tests the schema.
 */
  var dateObj = new Date();
  var date = dateObj.getDate();
  var month = dateObj.getUTCMonth()+1;
  var year = dateObj.getFullYear();
  var fullDate = date+"-"+month+"-"+year;
  var email = dataSheet.getRange("E1").getValue();
  var mer_numbers = dataSheet.getRange("B8").getValue();

  Logger.log(email);

  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Doc").hideSheet();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Script").hideSheet();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data").hideSheet();

  //var blob = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).getAs("pdf");
  //blob.setName("mindbody_merchants_configured_YYYMMDD"); 
  var htmlTemplate = HtmlService.createTemplateFromFile("email");
  htmlTemplate.mer_numbers = mer_numbers;

  //var htmlBody = HtmlService.createHtmlOutputFromFile('email').getContent();
  var htmlBody = htmlTemplate.evaluate().getContent();

  Logger.log(htmlBody);

  MailApp.sendEmail({
    to: email,
    subject: "Mindbody Merchant Configuration - " + fullDate,
    htmlBody: htmlBody,
    name: "api.configuration@global.com",
    attachments: [SpreadsheetApp.getActiveSpreadsheet().getAs(MimeType.PDF).setName("mindbody_merchants_configured_"+fullDate)]
  })

  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Doc").showSheet();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data").showSheet();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Script").showSheet();
  
}

function generateUserAndDate(){
  var user = dataSheet.getRange("B1");
  var date = dataSheet.getRange("B2");
  
  var getDate = new Date();
  //Logger.log(getDate.toISOString());
  date.setValue(getDate);

  var email = Session.getActiveUser().getEmail();
  user.setValue(email);
}

function setTime(cell){
  var getDate = new Date();
  var startTime = dataSheet.getRange(cell);
  startTime.setValue(getDate.getHours()+":"+getDate.getMinutes()+":"+getDate.getSeconds());
}


 
function sendCPTransaction(i){
  accessToken();
    
    sheet_merchant_name = scriptSheet.getRange("E"+i);
    var accountname;

    if(sheet_merchant_name.isBlank()){
      accountname = "default";
    }else if(!(sheet_merchant_name.isBlank())){
      accountname = sheet_merchant_name.getValue();
    }


    var str = String("00000000"+ Math.floor(Math.random()*100000000) + 1).slice(-8);

     //Transaction object
      var data = {
        "account_name": accountname,
        "channel": "CP",
        //"capture_mode": "AUTO",
        "type": "SALE",
        "amount": "100",
        "currency": "USD",
        "reference": str,
        "country": "US",
        "payment_method": {
          "name": "Jane",
          "entry_mode": "SWIPE",
          "card": {
            "track": ";4761739001010036=25122011184404889?"
          }
        }
      }
      var options = {
        "method": "post",
        "headers": {
        "Authorization": "Bearer "+returnedAccessToken,
        "X-GP-Version": "2021-03-22"
      },
        "payload" : JSON.stringify(data) 
      }
   
      try{
        var response = UrlFetchApp.fetch("https://apis.sandbox.globalpay.com/ucp/merchants/"+mer_id+"/transactions", options);

        if(response.getResponseCode()=="200"){
      
          var json = response.getContentText();
          var returnedData = JSON.parse(json);
          Logger.log(returnedData); 
       
        }else{
          Logger.log(response.getResponseCode());
    
        }
      }catch(err){
       
          Logger.log(err);
          var cpres = scriptSheet.getRange("O"+i);
          var valstr = err.toString();
          if(valstr.includes("50052")){
            cpres.setValue("error_code : SYSTEM_ERROR_DOWNSTREAM");
          }
          
      }

    }
    

function sendCNPTransaction(i){
 accessToken();

    sheet_merchant_name = scriptSheet.getRange("E"+i);
    var accountname;

    if(sheet_merchant_name.isBlank()){
      accountname = "default";
    }else if(!(sheet_merchant_name.isBlank())){
      accountname = sheet_merchant_name.getValue();
    }

    var str = String("00000000"+ Math.floor(Math.random()*100000000) + 1).slice(-8);


      //Transaction object
      var data = {
        "account_name": accountname,
        "channel": "CNP",
        //"capture_mode": "AUTO",
        "type": "SALE",
        "amount": "100",
        "currency": "USD",
        "reference": str,
        "country": "US",
        "payment_method": {
          "name": "Jane",
          "entry_mode": "ECOM",
          "card": {
            "number": "4242424242424242",
            "expiry_month": "09",
            "expiry_year": "22",
            "cvv": "940"
          }
        }
      }
      var options = {
        "method": "post",
        "headers": {
        "Authorization": "Bearer "+returnedAccessToken,
        "X-GP-Version": "2021-03-22"
      },
        "payload" : JSON.stringify(data) 
      }
     
      try{
        var response = UrlFetchApp.fetch("https://apis.sandbox.globalpay.com/ucp/merchants/"+mer_id+"/transactions", options);

        if(response.getResponseCode()=="200"){
      
          var json = response.getContentText();
          var returnedData = JSON.parse(json);
          Logger.log(returnedData); 
       
        }else{
          Logger.log(response.getResponseCode());
          
        }
      }catch(err){
       
          Logger.log(err);
          var cnpres = scriptSheet.getRange("P"+i);
          var valstr = err.toString();
          if(valstr.includes("50052")){
            cnpres.setValue("error_code : SYSTEM_ERROR_DOWNSTREAM");
          }
          
      }

    }



function sendACHTransaction(i){
  accessToken();

   sheet_merchant_name = scriptSheet.getRange("E"+i);
    var accountname;

    if(sheet_merchant_name.isBlank()){
      accountname = "default";
    }else if(!(sheet_merchant_name.isBlank())){
      accountname = sheet_merchant_name.getValue();
    }

    var str = String("00000000"+ Math.floor(Math.random()*100000000) + 1).slice(-8);

      
      //Transaction object
    var data = {
          
        "account_name": accountname,
        "channel": "CNP",
        "type": "SALE",
        "amount": "12345",
        "currency": "USD",
        "reference": str,
        "country": "US",
        "payment_method": {
            "name": "Jane Doe",
            "entry_mode": "ECOM",
            "bank_transfer": {
                "account_number": "1234567890",
                "number_type": "SAVING",
                "check_reference": "123",
                "sec_code": "WEB",
                "merchant_notes": "123",
                "bank": {
                    "code": "083908420",
                    "name": "First Union",
                    "address": {
                        "line_1": "12000 Smoketown Rd",
                        "line_2": "Apt 3B",
                        "line_3": "X",
                        "city": "Mesa",
                        "state": "AZ",
                        "postal_code": "22192",
                        "country": "USA"
                    }
                }
            }
        },
      "payer": {
        "name": "ANGELA SMITH",
        "reference": "123",
        "date_of_birth": "1967-08-13",
        "landline_phone": "235555",
        "mobile_phone": "222222",
        "billing_address": {
            "line_1": "Address Line 1",
            "line_2": "Address Line 2",
            "city": "PUNE",
            "state": "AZ",
            "postal_code": "411015",
            "country": "USA"
        }
     }
  }

    var options = {
        "method": "post",
        "headers": {
        "Authorization": "Bearer "+returnedAccessToken,
        "X-GP-Version": "2021-03-22"
        //"Content-Type": "application/json",
        //"Accept": "application/json"
      },
        "payload" : JSON.stringify(data) 
      }
        
      try{
        var response = UrlFetchApp.fetch("https://apis.sandbox.globalpay.com/ucp/merchants/MER_82cfc6dab37f42ae9d1b50af38ab3ff4/transactions", options);

        if(response.getResponseCode()=="200"){
      
          var json = response.getContentText();
          var returnedData = JSON.parse(json);
          Logger.log(returnedData); 
       
        }else{
          Logger.log(response.getResponseCode());
          
        }
      }catch(err){
       
          Logger.log(err.stack);
          var achres = scriptSheet.getRange("Q"+i);
          var valstr = err.toString();
          if(valstr.includes("50052")){
            achres.setValue("error_code : SYSTEM_ERROR_DOWNSTREAM");
          }else{
            achres.setValue(err);
          }
          
      }

 }



//Hash Algorithm not to be altered
function SHA512(str) {
class int64 {
constructor(msint_32,lsint_32) {
this.highOrder=msint_32;
this.lowOrder=lsint_32;
}
}

 var H = [new int64(0x6a09e667, 0xf3bcc908), new int64(0xbb67ae85, 0x84caa73b),
 new int64(0x3c6ef372, 0xfe94f82b), new int64(0xa54ff53a, 0x5f1d36f1),
 new int64(0x510e527f, 0xade682d1), new int64(0x9b05688c, 0x2b3e6c1f),
 new int64(0x1f83d9ab, 0xfb41bd6b), new int64(0x5be0cd19, 0x137e2179)];

 var K = [new int64(0x428a2f98, 0xd728ae22), new int64(0x71374491, 0x23ef65cd),
 new int64(0xb5c0fbcf, 0xec4d3b2f), new int64(0xe9b5dba5, 0x8189dbbc),
 new int64(0x3956c25b, 0xf348b538), new int64(0x59f111f1, 0xb605d019),
 new int64(0x923f82a4, 0xaf194f9b), new int64(0xab1c5ed5, 0xda6d8118),
 new int64(0xd807aa98, 0xa3030242), new int64(0x12835b01, 0x45706fbe),
 new int64(0x243185be, 0x4ee4b28c), new int64(0x550c7dc3, 0xd5ffb4e2),
 new int64(0x72be5d74, 0xf27b896f), new int64(0x80deb1fe, 0x3b1696b1),
 new int64(0x9bdc06a7, 0x25c71235), new int64(0xc19bf174, 0xcf692694),
 new int64(0xe49b69c1, 0x9ef14ad2), new int64(0xefbe4786, 0x384f25e3),
 new int64(0x0fc19dc6, 0x8b8cd5b5), new int64(0x240ca1cc, 0x77ac9c65),
 new int64(0x2de92c6f, 0x592b0275), new int64(0x4a7484aa, 0x6ea6e483),
 new int64(0x5cb0a9dc, 0xbd41fbd4), new int64(0x76f988da, 0x831153b5),
 new int64(0x983e5152, 0xee66dfab), new int64(0xa831c66d, 0x2db43210),
 new int64(0xb00327c8, 0x98fb213f), new int64(0xbf597fc7, 0xbeef0ee4),
 new int64(0xc6e00bf3, 0x3da88fc2), new int64(0xd5a79147, 0x930aa725),
 new int64(0x06ca6351, 0xe003826f), new int64(0x14292967, 0x0a0e6e70),
 new int64(0x27b70a85, 0x46d22ffc), new int64(0x2e1b2138, 0x5c26c926),
 new int64(0x4d2c6dfc, 0x5ac42aed), new int64(0x53380d13, 0x9d95b3df),
 new int64(0x650a7354, 0x8baf63de), new int64(0x766a0abb, 0x3c77b2a8),
 new int64(0x81c2c92e, 0x47edaee6), new int64(0x92722c85, 0x1482353b),
 new int64(0xa2bfe8a1, 0x4cf10364), new int64(0xa81a664b, 0xbc423001),
 new int64(0xc24b8b70, 0xd0f89791), new int64(0xc76c51a3, 0x0654be30),
 new int64(0xd192e819, 0xd6ef5218), new int64(0xd6990624, 0x5565a910),
 new int64(0xf40e3585, 0x5771202a), new int64(0x106aa070, 0x32bbd1b8),
 new int64(0x19a4c116, 0xb8d2d0c8), new int64(0x1e376c08, 0x5141ab53),
 new int64(0x2748774c, 0xdf8eeb99), new int64(0x34b0bcb5, 0xe19b48a8),
 new int64(0x391c0cb3, 0xc5c95a63), new int64(0x4ed8aa4a, 0xe3418acb),
 new int64(0x5b9cca4f, 0x7763e373), new int64(0x682e6ff3, 0xd6b2b8a3),
 new int64(0x748f82ee, 0x5defb2fc), new int64(0x78a5636f, 0x43172f60),
 new int64(0x84c87814, 0xa1f0ab72), new int64(0x8cc70208, 0x1a6439ec),
 new int64(0x90befffa, 0x23631e28), new int64(0xa4506ceb, 0xde82bde9),
 new int64(0xbef9a3f7, 0xb2c67915), new int64(0xc67178f2, 0xe372532b),
 new int64(0xca273ece, 0xea26619c), new int64(0xd186b8c7, 0x21c0c207),
 new int64(0xeada7dd6, 0xcde0eb1e), new int64(0xf57d4f7f, 0xee6ed178),
 new int64(0x06f067aa, 0x72176fba), new int64(0x0a637dc5, 0xa2c898a6),
 new int64(0x113f9804, 0xbef90dae), new int64(0x1b710b35, 0x131c471b),
 new int64(0x28db77f5, 0x23047d84), new int64(0x32caab7b, 0x40c72493),
 new int64(0x3c9ebe0a, 0x15c9bebc), new int64(0x431d67c4, 0x9c100d4c),
 new int64(0x4cc5d4be, 0xcb3e42b6), new int64(0x597f299c, 0xfc657e2a),
 new int64(0x5fcb6fab, 0x3ad6faec), new int64(0x6c44198c, 0x4a475817)];

 var W = new Array(64);
 var a, b, c, d, e, f, g, h, i, j;
 var T1, T2;
 var charsize = 8;

 function utf8_encode(str) {
 return unescape(encodeURIComponent(str));
 }

 function str2binb(str) {
 var bin = [];
 var mask = (1 << charsize) - 1;
 var len = str.length * charsize;

 for (var i = 0; i < len; i += charsize) {
 bin[i >> 5] |= (str.charCodeAt(i / charsize) & mask) << (32 - charsize - (i % 32));
 }

 return bin;
 }

 function binb2hex(binarray) {
 var hex_tab = '0123456789abcdef';
 var str = '';
 var length = binarray.length * 4;
 var srcByte;

 for (var i = 0; i < length; i += 1) {
 srcByte = binarray[i >> 2] >> ((3 - (i % 4)) * 8);
 str += hex_tab.charAt((srcByte >> 4) & 0xF) + hex_tab.charAt(srcByte & 0xF);
 }

 return str;
 }

 function safe_add_2(x, y) {
 var lsw, msw, lowOrder, highOrder;

 lsw = (x.lowOrder & 0xFFFF) + (y.lowOrder & 0xFFFF);
 msw = (x.lowOrder >>> 16) + (y.lowOrder >>> 16) + (lsw >>> 16);
 lowOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);

 lsw = (x.highOrder & 0xFFFF) + (y.highOrder & 0xFFFF) + (msw >>> 16);
 msw = (x.highOrder >>> 16) + (y.highOrder >>> 16) + (lsw >>> 16);
 highOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);

 return new int64(highOrder, lowOrder);
 }

 function safe_add_4(a, b, c, d) {
 var lsw, msw, lowOrder, highOrder;

 lsw = (a.lowOrder & 0xFFFF) + (b.lowOrder & 0xFFFF) + (c.lowOrder & 0xFFFF) + (d.lowOrder & 0xFFFF);
 msw = (a.lowOrder >>> 16) + (b.lowOrder >>> 16) + (c.lowOrder >>> 16) + (d.lowOrder >>> 16) + (lsw >>> 16);
 lowOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);

 lsw = (a.highOrder & 0xFFFF) + (b.highOrder & 0xFFFF) + (c.highOrder & 0xFFFF) + (d.highOrder & 0xFFFF) + (msw >>> 16);
 msw = (a.highOrder >>> 16) + (b.highOrder >>> 16) + (c.highOrder >>> 16) + (d.highOrder >>> 16) + (lsw >>> 16);
 highOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);

 return new int64(highOrder, lowOrder);
 }

 function safe_add_5(a, b, c, d, e) {
 var lsw, msw, lowOrder, highOrder;

 lsw = (a.lowOrder & 0xFFFF) + (b.lowOrder & 0xFFFF) + (c.lowOrder & 0xFFFF) + (d.lowOrder & 0xFFFF) + (e.lowOrder & 0xFFFF);
 msw = (a.lowOrder >>> 16) + (b.lowOrder >>> 16) + (c.lowOrder >>> 16) + (d.lowOrder >>> 16) + (e.lowOrder >>> 16) + (lsw >>> 16);
 lowOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);

 lsw = (a.highOrder & 0xFFFF) + (b.highOrder & 0xFFFF) + (c.highOrder & 0xFFFF) + (d.highOrder & 0xFFFF) + (e.highOrder & 0xFFFF) + (msw >>> 16);
 msw = (a.highOrder >>> 16) + (b.highOrder >>> 16) + (c.highOrder >>> 16) + (d.highOrder >>> 16) + (e.highOrder >>> 16) + (lsw >>> 16);
 highOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);

 return new int64(highOrder, lowOrder);
 }

 function maj(x, y, z) {
 return new int64(
 (x.highOrder & y.highOrder) ^ (x.highOrder & z.highOrder) ^ (y.highOrder & z.highOrder),
 (x.lowOrder & y.lowOrder) ^ (x.lowOrder & z.lowOrder) ^ (y.lowOrder & z.lowOrder)
 );
 }

 function ch(x, y, z) {
 return new int64(
 (x.highOrder & y.highOrder) ^ (~x.highOrder & z.highOrder),
 (x.lowOrder & y.lowOrder) ^ (~x.lowOrder & z.lowOrder)
 );
 }

 function rotr(x, n) {
 if (n <= 32) {
 return new int64(
 (x.highOrder >>> n) | (x.lowOrder << (32 - n)),
 (x.lowOrder >>> n) | (x.highOrder << (32 - n))
 );
 } else {
 return new int64(
 (x.lowOrder >>> n) | (x.highOrder << (32 - n)),
 (x.highOrder >>> n) | (x.lowOrder << (32 - n))
 );
 }
 }

 function sigma0(x) {
 var rotr28 = rotr(x, 28);
 var rotr34 = rotr(x, 34);
 var rotr39 = rotr(x, 39);

 return new int64(
 rotr28.highOrder ^ rotr34.highOrder ^ rotr39.highOrder,
 rotr28.lowOrder ^ rotr34.lowOrder ^ rotr39.lowOrder
 );
 }

 function sigma1(x) {
 var rotr14 = rotr(x, 14);
 var rotr18 = rotr(x, 18);
 var rotr41 = rotr(x, 41);

 return new int64(
 rotr14.highOrder ^ rotr18.highOrder ^ rotr41.highOrder,
 rotr14.lowOrder ^ rotr18.lowOrder ^ rotr41.lowOrder
 );
 }

 function gamma0(x) {
 var rotr1 = rotr(x, 1), rotr8 = rotr(x, 8), shr7 = shr(x, 7);

 return new int64(
 rotr1.highOrder ^ rotr8.highOrder ^ shr7.highOrder,
 rotr1.lowOrder ^ rotr8.lowOrder ^ shr7.lowOrder
 );
 }

 function gamma1(x) {
 var rotr19 = rotr(x, 19);
 var rotr61 = rotr(x, 61);
 var shr6 = shr(x, 6);

 return new int64(
 rotr19.highOrder ^ rotr61.highOrder ^ shr6.highOrder,
 rotr19.lowOrder ^ rotr61.lowOrder ^ shr6.lowOrder
 );
 }

 function shr(x, n) {
 if (n <= 32) {
 return new int64(
 x.highOrder >>> n,
 x.lowOrder >>> n | (x.highOrder << (32 - n))
 );
 } else {
 return new int64(
 0,
 x.highOrder << (32 - n)
 );
 }
 }

 str = utf8_encode(str);
 strlen = str.length*charsize;
 str = str2binb(str);

 str[strlen >> 5] |= 0x80 << (24 - strlen % 32);
 str[(((strlen + 128) >> 10) << 5) + 31] = strlen;

 for (var i = 0; i < str.length; i += 32) {
 a = H[0];
 b = H[1];
 c = H[2];
 d = H[3];
 e = H[4];
 f = H[5];
 g = H[6];
 h = H[7];

 for (var j = 0; j < 80; j++) {
 if (j < 16) {
 W[j] = new int64(str[j*2 + i], str[j*2 + i + 1]);
 } else {
 W[j] = safe_add_4(gamma1(W[j - 2]), W[j - 7], gamma0(W[j - 15]), W[j - 16]);
 }

 T1 = safe_add_5(h, sigma1(e), ch(e, f, g), K[j], W[j]);
 T2 = safe_add_2(sigma0(a), maj(a, b, c));
 h = g;
 g = f;
 f = e;
 e = safe_add_2(d, T1);
 d = c;
 c = b;
 b = a;
 a = safe_add_2(T1, T2);
 }

 H[0] = safe_add_2(a, H[0]);
 H[1] = safe_add_2(b, H[1]);
 H[2] = safe_add_2(c, H[2]);
 H[3] = safe_add_2(d, H[3]);
 H[4] = safe_add_2(e, H[4]);
 H[5] = safe_add_2(f, H[5]);
 H[6] = safe_add_2(g, H[6]);
 H[7] = safe_add_2(h, H[7]);
 }

 var binarray = [];
 for (var i = 0; i < H.length; i++) {
 binarray.push(H[i].highOrder);
 binarray.push(H[i].lowOrder);
 }
 return binb2hex(binarray);
}
