/***************************************************************************************************************************
 * @license                                                                                                                *
 * Copyright 2017 Coinbase, Inc.                                                                                           *
 *                                                                                                                         *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance          *
 * with the License. You may obtain a copy of the License at                                                               *
 *                                                                                                                         *
 * http://www.apache.org/licenses/LICENSE-2.0                                                                              *
 *                                                                                                                         *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on     *
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the                      *
 * License for the specific language governing permissions and limitations under the License.                              *
 ***************************************************************************************************************************/

import * as CBPTT from 'coinbase-pro-trading-toolkit';
import {
    BitfinexConfig,
    BitfinexExchangeAPI
} from "coinbase-pro-trading-toolkit/build/src/exchanges/bitfinex/BitfinexExchangeAPI";
import { CoinbaseProConfig } from "coinbase-pro-trading-toolkit/build/src/exchanges/coinbasePro/CoinbaseProInterfaces";
import { CoinbaseProExchangeAPI } from "coinbase-pro-trading-toolkit/build/src/exchanges/coinbasePro/CoinbaseProExchangeAPI";
import { PublicExchangeAPI, Ticker } from "coinbase-pro-trading-toolkit/build/src/exchanges/PublicExchangeAPI";

const padfloat = CBPTT.utils.padfloat;
const logger = CBPTT.utils.ConsoleLoggerFactory({ level: 'info' });

const bitfinexConfig: BitfinexConfig = {
    logger: logger,
    auth: {
        key: process.env.BITFINEX_KEY,
        secret: process.env.BITFINEX_SECRET
    }
};

const coinbaseProConfig: CoinbaseProConfig = {
    logger: logger,
    apiUrl: process.env.COINBASE_PRO_API_URL || 'https://api.pro.coinbase.com',
    auth: {
        key: process.env.COINBASE_PRO_KEY,
        secret: process.env.COINBASE_PRO_SECRET,
        passphrase: process.env.COINBASE_PRO_PASSPHRASE
    }
};

const bitfinex = new BitfinexExchangeAPI(bitfinexConfig);
const coinbasePro = new CoinbaseProExchangeAPI(coinbaseProConfig);

const publicExchanges: PublicExchangeAPI[] = [coinbasePro, bitfinex];

setInterval(() => {
    getAndPrintTickers(publicExchanges, 'BTC-USD').then(() => {
        return getAndPrintTickers(publicExchanges, 'ETH-USD');
    }).catch((err) => {
        logger.log('error', err.message, err);
    });
}, 5000);

function getTickers(exchanges: PublicExchangeAPI[], product: string): Promise<Ticker[]> {
    const promises = exchanges.map((ex: PublicExchangeAPI) => ex.loadTicker(product));
    return Promise.all(promises);
}

function getAndPrintTickers(exchanges: PublicExchangeAPI[], product: string) {
    return getTickers(publicExchanges, product).then((tickers: Ticker[]) => {
        const quoteCurrency = tickers[0].productId.split('-')[1];
        console.log(`${new Date().toTimeString()}\t| Price ${quoteCurrency}  |   Best Bid |   Best Ask`);
        for (let i = 0; i < exchanges.length; i++) {
            printTicker(exchanges[i], tickers[i]);
        }
        console.log();
    });
}

function printTicker(exchange: PublicExchangeAPI, ticker: Ticker) {
    // pad exchange name
    let s = `${ticker.productId} (${exchange.owner})`;
    for (let i = s.length; i < 24; i++) {
        s += ' ';
    }
    console.log(`${s}\t| ${padfloat(ticker.price, 10, 2)} | ${padfloat(ticker.bid, 10, 2)} | ${padfloat(ticker.ask, 10, 2)}`);
}

process.on('SIGINT', () => {
    process.exit(0);
});
