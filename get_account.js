const algosdk = require('algosdk');
const account_mnemonic = "horse satisfy ticket zebra lesson supreme drive drill anchor vague grain empty skate coffee fat any find until absurd father cable knee thrive able table";

const getAccount = function() {
    try {  
        return algosdk.mnemonicToSecretKey(account_mnemonic);
    }
    catch (err) {
        console.log("err", err);
    }
};

module.exports =  { getAccount, };