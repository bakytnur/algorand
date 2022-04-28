const algosdk = require('algosdk');
async function receive_transaction() {
    try {
        // Connect your client
        const decimal = 100000;
        const algodToken = '2f3203f21e738a1de6110eba6984f9d03e5a95d7a577b34616854064cf2c0e7b';
        const algodServer = 'https://academy-algod.dev.aws.algodev.network';
        const algodPort = 443;
        const roundNumber = 21240302;
        let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

        // Get block round
        const block = await algodClient.block(roundNumber, {format : 'json'}).do();
        // Parsing transactions
        const txns = block.block.txns;
        console.log("Total transactions", txns.length);
        //console.log("Transaction: ", algosdk.encodeAddress(block.block.txn));
        //console.log("Transaction: ", Buffer.from(block.block.txns, 'base64').toString());
        for (let i=0; i < txns.length; i++) {
            if (txns[i].txn.type == "pay") {
                console.log("Amount: %s", txns[i].txn.amt);
                console.log("Fee: %s", txns[i].txn.fee);
                console.log("From: %s", algosdk.encodeAddress(txns[i].txn.snd));
                console.log("To: %s", algosdk.encodeAddress(txns[i].txn.rcv));
                console.log("Note: %s", Buffer.from(txns[i].txn.note, 'base64').toString());
            } else if (txns[i].txn.type == "axfer") {
                console.log("Amount: %s", txns[i].txn.aamt);
                console.log("Fee: %s", txns[i].txn.fee);
                if (txns[i].txn.grp) {
                    console.log("Group id: %s", Buffer.from(txns[i].txn.grp).toString('base64'));
                }
                console.log("From: %s", algosdk.encodeAddress(txns[i].txn.snd));
                console.log("To: %s", algosdk.encodeAddress(txns[i].txn.arcv));
                console.log("Asset id: %s", txns[i].txn.xaid)
                if (txns[i].txn.note) {
                    console.log("Note: %s", Buffer.from(txns[i].txn.note, 'base64').toString());
                }
            }
        }

    }
    catch (err) {
        console.log("err", err);
    }
    process.exit();
};

receive_transaction();
