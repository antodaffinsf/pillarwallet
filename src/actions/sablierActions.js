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
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { fetchUserStreams, getSablierWithdrawTransaction } from 'services/sablier';
import smartWalletService from 'services/smartWallet';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import {
  SET_STREAMS,
  SET_FETCHING_STREAMS,
  SET_CALCULATING_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE,
  SET_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE,
} from 'constants/sablierConstants';


export const setUserStreamsAction = (streams) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_STREAMS, payload: streams });
  };
};

export const fetchUserStreamsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_FETCHING_STREAMS });
    const streams = await fetchUserStreams(getAccountAddress(smartWalletAccount));
    dispatch(setUserStreamsAction(streams));
  };
};

export const calculateSablierWithdrawTransactionEstimateAction = (
  streamId: string,
  amount: number,
  asset: SablierAsset,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_CALCULATING_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE });

    const { to: recipient, amount: value, data } = getSablierWithdrawTransaction(
      getAccountAddress(smartWalletAccount),
      streamId,
      amount,
      asset,
    );

    const estimate = await smartWalletService
      .estimateAccountTransaction({ recipient, value, data })
      .catch(() => null);

    dispatch({ type: SET_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE, payload: estimate });
  };
};
