// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details..

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import ethers, { Contract, utils, BigNumber as EthersBigNumber } from 'ethers';
import axios from 'axios';
import { SABLIER_CONTRACT_ADDRESS, SABLIER_GRAPH_ID } from 'react-native-dotenv';
import { BigNumber } from 'bignumber.js';
import * as Sentry from '@sentry/react-native';


import { buildERC20ApproveTransactionData, encodeContractMethod, getContract } from 'services/assets';
import smartWalletService from 'services/smartWallet';
import { ETH } from 'constants/assetsConstants';
import { parseTokenBigNumberAmount, reportLog } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';

import SABLIER_ABI from 'abi/sablier.json';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

export const buildCreateStreamTransaction = (
  receiver: string,
  amount: EthersBigNumber,
  tokenAddress: string,
  startTimestamp: number,
  endTimestamp: number,
): string => {
  return encodeContractMethod(SABLIER_ABI, 'createStream', [
    receiver,
    amount,
    tokenAddress,
    startTimestamp,
    endTimestamp,
  ]);
};

export const getCreateStreamTransaction = async (
  sender: string,
  receiver: string,
  amount: number,
  tokenAddress: string,
  startTimestamp: number,
  endTimestamp: number,
) => {
  const createStreamTransactionData =
    buildCreateStreamTransaction(receiver, amount, tokenAddress, startTimestamp, endTimestamp);

  const sablierCreateStreamTransaction = {
    from: sender,
    to: SABLIER_CONTRACT_ADDRESS,
    data: createStreamTransactionData,
    amount: 0,
    symbol: ETH,
  };

  return sablierCreateStreamTransaction;
};


export const getSablierWithdrawTransaction = (
  sender: string,
  streamId: number,
  amount: number,
  asset: SablierAsset,
) => {
  const amountBN = parseTokenBigNumberAmount(amount, asset.decimals);

  const transactionData = encodeContractMethod(SABLIER_ABI, 'withdrawFromStream', [
    streamId,
    amountBN,
  ]);
  return {
    from: sender,
    to: SABLIER_CONTRACT_ADDRESS,
    data: transactionData,
    amount: 0,
    symbol: ETH,
  };
};

export const fetchUserStreams = async (accountAddress: string) => {
  const url = `https://api.thegraph.com/subgraphs/id/${SABLIER_GRAPH_ID}`;
  return axios
    .post(url, {
      timeout: 5000,
      query: `
        {
          outgoingStreams: streams(where: {
            sender: "${accountAddress}",
            cancellation: null,
          }) {
            id
            deposit
            exchangeRateInitial
            ratePerSecond
            recipient
            sender
            startTime
            stopTime
            timestamp
            token {
              id
              decimals
              name
              symbol
            }
            withdrawals {
              id
              amount
            }
          }
          incomingStreams: streams(where: {
            recipient: "${accountAddress}",
            cancellation: null,
          }) {
            id
            deposit
            exchangeRateInitial
            ratePerSecond
            recipient
            sender
            startTime
            stopTime
            timestamp
            token {
              id
              decimals
              name
              symbol
            }
            withdrawals {
              id
              amount
            }
          }
        }
      `,
    })
    .then(({ data: response }) => {
      return response.data;
    })
    .catch((e) => console.warn('ERROR! ', e));
};

export const checkSablierAllowance = async (tokenAddress: string, sender: string): Promise<number> => {
  const erc20Contract = getContract(tokenAddress, ERC20_CONTRACT_ABI);
  const approvedAmountBN = erc20Contract
    ? await erc20Contract.allowance(sender, SABLIER_CONTRACT_ADDRESS)
    : null;
  return approvedAmountBN;
};

export const getSmartWalletTxFee = async (transaction: Object, useGasToken: boolean): Promise<Object> => {
  const defaultResponse = { fee: new BigNumber('0'), error: true };
  const estimateTransaction = {
    data: transaction.data,
    recipient: transaction.to,
    value: transaction.amount,
  };

  const estimated = await smartWalletService
    .estimateAccountTransaction(estimateTransaction)
    .then(result => buildTxFeeInfo(result, useGasToken))
    .catch((e) => {
      reportLog('Error getting sablier fee for transaction', {
        ...transaction,
        message: e.message,
      }, Sentry.Severity.Error);
      return null;
    });

  if (!estimated) {
    return defaultResponse;
  }

  return estimated;
};

export const getApproveFeeAndTransaction = async (assetData: Asset, useGasToken: boolean) => {
  const { symbol, decimals, address: tokenAddress } = assetData;
  const rawValue = 1000000000;
  const valueToApprove = utils.parseUnits(rawValue.toString(), decimals);

  const data = encodeContractMethod(ERC20_CONTRACT_ABI, 'approve', [SABLIER_CONTRACT_ADDRESS, valueToApprove]);

  let transactionPayload = {
    amount: 0,
    to: tokenAddress,
    symbol,
    contractAddress: tokenAddress,
    decimals,
    data,
    extra: {
      sablierApproval: {
        symbol,
      },
    },
  };

  const { fee: txFeeInWei, gasToken, error } = await getSmartWalletTxFee(transactionPayload, useGasToken);

  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  if (error) {
    return null;
  }

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
};

export const getCancellationFeeAndTransaction = async (streamId: string, useGasToken: boolean) => {
  const transactionData = encodeContractMethod(SABLIER_ABI, 'cancelStream', [
    streamId,
  ]);
  let transactionPayload = {
    to: SABLIER_CONTRACT_ADDRESS,
    data: transactionData,
    amount: 0,
    symbol: ETH,
  };

  const { fee: txFeeInWei, gasToken, error } = await getSmartWalletTxFee(transactionPayload, useGasToken);

  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  if (error) {
    return null;
  }

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
};
