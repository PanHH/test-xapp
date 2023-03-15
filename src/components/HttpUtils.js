import axios from 'axios';

const config = {
    baseURL: 'http://101.35.163.23:9802',
    // baseURL: 'http://192.168.132.159:3005',
    // baseURL: 'https://testapi.arkreen.com',
    timeout: 300000,
    headers: {
        'Content-Type': 'application/json',
    }
};

const request = axios.create(config);

request.interceptors.response.use(
    (response) => {
        if (response.data.code) {
            console.log(JSON.stringify(response));
        }
        return response.data
    },
    (error) => {
        let { message } = error;
        if (message === "Network Error") {
            message = "Network Error, can't connect to service.";
        }
        else if(message.incldes("timeout")) {
            message = "System interface request timeout.";
        }
        else if(message.incldes("Request failed with status code")) {
            message = "System interface " + message.substr(message.length -3) + " error.";
        }
        console.error(message);
        return Promise.reject(error)
    }
)

async function sendJsonRPC(url, method, params) {
    let data = {
        jsonrpc: "2.0",
        id: Number(Math.random().toString().substring(2)),
        method: method,
        params: params
    }
    console.log(method);
    console.log("request data:" + JSON.stringify(data));
    return await request({url: url, method: 'post', data: data})
}

async function post(url, params) {
    return await request({url: url, method: 'post', data: params})
}

async function get(url) {
    return await request({url: url, method: 'get'})
}

const HttpUtils = {
    sendJsonRPC: sendJsonRPC,
    post: post,
    get: get,
}

export default HttpUtils;

