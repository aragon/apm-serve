# apm-serve
Web 2.0 server for APM hosted websites

## Goal API

dapp.aragonpm.com -> serves content from latest version of dapp.aragonpm.eth in the mainnet
dapp.rinkeby.aragonpm.com -> serves content from latest version of dapp.aragonpm.eth in rinkeby (requires setting ENS address)
1.2.3.dapp.aragonpm.com -> serves version 1.2.3 of dapp
voting.aragonpm.com/?json=true -> serves json with all versions of voting.aragonpm.eth with smart contract addresses and contentURIs
voting.aragonpm.com/?json=true&version=1.2.3 -> serves version information for voting.aragonpm.eth 1.2.3
