const algosdk = require('algosdk');
const crypto = require('crypto');
const fs = require('fs').promises
const { getAccount } = require('./get_account');
// see ASA param conventions here: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md
// for JavaScript SDK doc see: https://algorand.github.io/js-algorand-sdk/

const DISPENSERACCOUNT = "HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA";
async function createAsset(algodClient, account) {
    console.log("");
    console.log("==> CREATE ASSET");
    //Check account balance    
    const accountInfo = await algodClient.accountInformation(account.addr).do();
    const startingAmount = accountInfo.amount;
    console.log("Account balance: %d microAlgos", startingAmount);

    // Construct the transaction
    const params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    // params.fee = 1000;
    // params.flatFee = true;
   
    // Whether user accounts will need to be unfrozen before transacting    
    const defaultFrozen = false;
    // Used to display asset units to user    
    const unitName = "Bakha Art";
    // Friendly name of the asset    
    const assetName = "Chocolate Cake@1";
    // Optional string pointing to a URL relating to the asset
    const url = "https://github.com/bakytnur/algorand/blob/main/NFT/metadata.json";
    // Optional hash commitment of some sort relating to the asset. 32 character length.
    // metadata can define the unitName and assetName as well.
    // see ASA metadata conventions here: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md


    // The following parameters are the only ones
    // that can be changed, and they have to be changed
    // by the current manager
    // Specified address can change reserve, freeze, clawback, and manager
    // If they are set to undefined at creation time, you will not be able to modify these later
    const managerAddr = getAccount(); // OPTIONAL: FOR DEMO ONLY, USED TO DESTROY ASSET WITHIN
    // Specified address is considered the asset reserve
    // (it has no special privileges, this is only informational)
    const reserveAddr = undefined;
    // Specified address can freeze or unfreeze user asset holdings   
    const freezeAddr = undefined;
    // Specified address can revoke user asset holdings and send 
    // them to other addresses    
    const clawbackAddr = undefined;

    // Use actual total  > 1 to create a Fungible Token
    // example 1:(fungible Tokens)
    // totalIssuance = 10, decimals = 0, result is 10 total actual 
    // example 2: (fractional NFT, each is 0.1)
    // totalIssuance = 10, decimals = 1, result is 1.0 total actual
    // example 3: (NFT)
    // totalIssuance = 1, decimals = 0, result is 1 total actual 
    // integer number of decimals for asset unit calculation
    const decimals = 0;
    const total = 1; // how many of this asset there will be

    // temp fix for replit    
    //const metadata2 = "16efaa3924a6fd9d3a4824799a4ac65d";

    const fullPath = __dirname + '/NFT/metadata.json';
    const metadatafile = (await fs.readFile(fullPath));
//    const metadatafile = (await fs.readFileSync(fullPath)).toString();
    const hash = crypto.createHash('sha256');
    hash.update(metadatafile);

    // replit error  - work around
    // const metadata = "16efaa3924a6fd9d3a4824799a4ac65d";
    // replit error  - the following only runs in debug mode in replit, and use this in your code
    const metadata = new Uint8Array(hash.digest()); // use this in your code


    const fullPathImage = __dirname + '/NFT/nft1.png';
//    const metadatafileImage = (await fs.readFileSync(fullPathImage));
    const metadatafileImage = (await fs.readFile(fullPathImage));
    const hashImage = crypto.createHash('sha256');
    hashImage.update(metadatafileImage);
    const hashImageBase64 = hashImage.digest("base64");
    const imageIntegrity = "sha256-" + hashImageBase64;

    // use this in youe metadata.json file
    console.log("image_integrity : " + imageIntegrity);


    // signing and sending "txn" allows "addr" to create an asset 
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: getAccount(),
        total,
        decimals,
        assetName,
        unitName,
        assetURL: url,
        assetMetadataHash: metadata,
        defaultFrozen,
        freeze: freezeAddr,
        manager: managerAddr,
        clawback: clawbackAddr,
        reserve: reserveAddr,
        suggestedParams: params,
    });

    const rawSignedTxn = txn.signTxn(account.sk);
    const tx = (await algodClient.sendRawTransaction(rawSignedTxn).do());
    let assetID = null;
    // wait for transaction to be confirmed
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
    // Get the completed Transaction
    console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
    assetID = confirmedTxn["asset-index"];
    // console.log("AssetID = " + assetID);

    await printCreatedAsset(algodClient, account.addr, assetID);
    await printAssetHolding(algodClient, account.addr, assetID);
    console.log("You can verify the metadata-hash above in the asset creation details");
    console.log("Using terminal the Metadata hash should appear as identical to the output of");
    console.log("cat accountAssetMetaData.json | openssl dgst -sha256 -binary | openssl base64 -A");
    console.log("That is: Cii04FOHWE4NiXQ4s4J02we2gnJop5dOfdkBvUoGHQ8=");

    return { assetID };
}

// Function used to print created asset for account and assetid
const printCreatedAsset = async function (algodClient, account, assetid) {
    // note: if you have an indexer instance available it is easier to just use this
    //     let accountInfo = await indexerClient.searchAccounts()
    //    .assetID(assetIndex).do();
    // and in the loop below use this to extract the asset for a particular account
    // accountInfo['accounts'][idx][account]);
    let accountInfo = await algodClient.accountInformation(account).do();
    for (idx = 0; idx < accountInfo['created-assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['created-assets'][idx];
        if (scrutinizedAsset['index'] == assetid) {
            console.log("AssetID = " + scrutinizedAsset['index']);
            let myparms = JSON.stringify(scrutinizedAsset['params'], undefined, 2);
            console.log("parms = " + myparms);
            break;
        }
    }
};
// Function used to print asset holding for account and assetid
const printAssetHolding = async function (algodClient, account, assetid) {
    // note: if you have an indexer instance available it is easier to just use this
    //     let accountInfo = await indexerClient.searchAccounts()
    //    .assetID(assetIndex).do();
    // and in the loop below use this to extract the asset for a particular account
    // accountInfo['accounts'][idx][account]);
    let accountInfo = await algodClient.accountInformation(account).do();
    for (idx = 0; idx < accountInfo['assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['assets'][idx];
        if (scrutinizedAsset['asset-id'] == assetid) {
            let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
            console.log("assetholdinginfo = " + myassetholding);
            break;
        }
    }
};

async function createNFT() {
    try {
        let account = createAccount();
        console.log("Press any key when the account is funded");
        await keypress();
        // Connect your client
        // const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        // const algodServer = 'http://localhost';
        // const algodPort = 4001;
        const algodToken = '2f3203f21e738a1de6110eba6984f9d03e5a95d7a577b34616854064cf2c0e7b';
        const algodServer = 'https://academy-algod.dev.aws.algodev.network';
        const algodPort = 443;

        let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

        // CREATE ASSET
        const { assetID } = await createAsset(algodClient, account);
    }
    catch (err) {
        console.log("err", err);
    }
    process.exit();
};

createNFT();