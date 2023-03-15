import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import React from 'react';

import HttpUtils from './components/HttpUtils';
import { verifySignature, hashMessage } from "./components/Utils";

import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { convertUtf8ToHex } from "@walletconnect/utils";



const INITIAL_STATE = {
    connector: null,
    fetching: false,
    connected: false,
    chainId: 1,
    showModal: false,
    pendingRequest: false,
    uri: "",
    accounts: [],
    address: "",
    result: null,
    assets: [],
};

function MyButton() {
    const [count, setCount] = useState(0);

    function handleClick() {
      alert('You clicked me!');
      setCount(count + 1);
    }
  
    return (
      <button className="App-button" onClick={handleClick}>
        Clicked {count} times
      </button>
    );
}

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          connector: null,
          fetching: false,
          connected: false,
          chainId: 1,
          showModal: false,
          pendingRequest: false,
          uri: "",
          accounts: [],
          address: "",
          result: null,
          assets: [],
        }
    }

    connect = async () => {
        // bridge url
        const bridge = "https://bridge.walletconnect.org";
    
        // create new connector
        const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });
    
        await this.setState({ connector });
    
        // check if already connected
        if (!connector.connected) {
          // create new session
          await connector.createSession();
        }
    
        // subscribe to events
        await this.subscribeToEvents();
    }

    subscribeToEvents = () => {
      const { connector } = this.state;
  
      if (!connector) {
        return;
      }
  
      connector.on("session_update", async (error, payload) => {
        console.log(`connector.on("session_update")`);
  
        if (error) {
          throw error;
        }
  
        const { chainId, accounts } = payload.params[0];
        this.onSessionUpdate(accounts, chainId);
      });
  
      connector.on("connect", (error, payload) => {
        console.log(`connector.on("connect")`);
  
        if (error) {
          throw error;
        }
  
        this.onConnect(payload);
      });
  
      connector.on("disconnect", (error, payload) => {
        console.log(`connector.on("disconnect")`);
  
        if (error) {
          throw error;
        }
  
        this.onDisconnect();
      });
  
      if (connector.connected) {
        const { chainId, accounts } = connector;
        const address = accounts[0];
        this.setState({
          connected: true,
          chainId,
          accounts,
          address,
        });
        this.onSessionUpdate(accounts, chainId);
      }
  
      this.setState({ connector });
    }

    disconnect = async () => {
      const { connector } = this.state;
      if (connector) {
        await connector.killSession();
      }
      this.resetApp();
    };

    onConnect = async (payload) => {
      const { chainId, accounts } = payload.params[0];
      const address = accounts[0];
      await this.setState({
        connected: true,
        chainId,
        accounts,
        address,
      });
      this.getAccountAssets();
    };
  
    onDisconnect = async () => {
      this.resetApp();
    };

    onSessionUpdate = async (accounts, chainId) => {
      const address = accounts[0];
      await this.setState({ chainId, accounts, address });
      await this.getAccountAssets();
    };

    resetApp = async () => {
      await this.setState({ ...INITIAL_STATE });
    };

    getAccountAssets = async () => {
      const { address, chainId } = this.state;
      console.log(`address:` + address);
      console.log(`chainId:` + chainId);
    //   this.setState({ fetching: true });
    //   try {
    //     // get account balances
    //     const assets = await apiGetAccountAssets(address, chainId);
  
    //     await this.setState({ fetching: false, address, assets });
    //   } catch (error) {
    //     console.error(error);
    //     await this.setState({ fetching: false });
    //   }
    };

    toggleModal = () => this.setState({ showModal: !this.state.showModal });

    testPersonalSignMessage = async () => {
      const { connector, address, chainId } = this.state;
  
      if (!connector) {
        return;
      }
  
      // test message
      const message = `My email is john@doe.com - ${new Date().toUTCString()}`;
  
      // encode message (hex)
      const hexMsg = convertUtf8ToHex(message);
  
      // eth_sign params
      const msgParams = [hexMsg, address];
  
      try {
        // open modal
        this.toggleModal();
  
        // toggle pending request indicator
        this.setState({ pendingRequest: true });
  
        // send message
        const result = await connector.signPersonalMessage(msgParams);
  
        // verify signature
        const hash = hashMessage(message);
        const valid = await verifySignature(address, result, hash, chainId);
  
        // format displayed result
        const formattedResult = {
          method: "personal_sign",
          address,
          valid,
          result,
        };
  
        // display result
        this.setState({
          connector,
          pendingRequest: false,
          result: formattedResult || null,
        });
      } catch (error) {
        console.error(error);
        this.setState({ connector, pendingRequest: false, result: null });
      }
    };


    onTestBtnPressed = async () => {
        const params = {
            offset: 1,
            limit: 10,
        }
        const response = await HttpUtils.sendJsonRPC("/v1", 'net_getAccountList', params)
        console.log("response data:" + JSON.stringify(response));
    }

    async onMinerOnboardByCode(){
        const params = {
            minerAcode: "4d263f23fe1c4044b30a6148e459ba7b",
            ownerAddress: "0x087f3CeFcfE200B405c584D283aFbd2091067185",
            location: {
                version: 1,
                type: 2,
                latitude: "44.10473120854115",
                longitude: "41.04892671698865",
                h3index: 8531287
            },
            minerInfo: {
                version: 1,
                energy: 0,
                power: 1000,
                capabilities: 1,
                deviceModel: "test mode",
                deviceSerialNum: "SN1234567890"
            }
        }
        const response = await HttpUtils.sendJsonRPC("/v1", 'sdm_requestOnboardByActivateCode', params)
        console.log("response data:" + JSON.stringify(response));
    };

    async onTestConnectWallet(){
    };

    render() {
      const { address, chainId } = this.state;
      return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <h3>Bind Miner APP</h3>
                <label>
                    Location: <input name="location" />
                </label>
                <label>
                    Miner model: <input name="model" />
                </label>
                <label>
                    Miner power: <input name="power" />
                </label>
                <label>
                    Miner SN: <input name="sn" />
                </label>
                <div>
                    <label>Address:{address}</label>
                    <br/>
                    <label>ChainId:{chainId}</label>
                </div>
                <MyButton/>
                <button className="App-button" onClick={() => this.onTestBtnPressed()}>Test Get Account List</button>
                <button className="App-button" onClick={() => this.onMinerOnboardByCode()}>Test Onboard</button>
                <button className="App-button" onClick={() => this.connect()}>Connect to WalletConnect</button>
                <button className="App-button" onClick={() => this.disconnect()}>DisConnect</button>
                <button className="App-button" onClick={() => this.testPersonalSignMessage()}>Test Personal Sign</button>
            </header>
        </div>
      );
    }
}

export default App;
